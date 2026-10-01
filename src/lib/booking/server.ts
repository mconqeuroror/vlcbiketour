import { z } from "zod";
import { getTour } from "@/config/tours";
import {
  bookingRequestSchema,
  bookingScheduleErrors,
} from "./schema";
import { issuesToErrorKeys } from "./issues";
import { notifyOperator } from "./notify";
import { createCheckoutSession, CheckoutError } from "./stripe";

/**
 * Server-side orchestration for booking requests and contact messages:
 * rate limiting, spam traps, schema + business validation, persistence,
 * duplicate handling and operator notification.
 *
 * Rate limiting note: the limiter below is an in-memory Map, so it is
 * per-process. It is effective on a single-instance deployment (one
 * Node server / one VM). On multi-instance or serverless deployments it
 * must be replaced with a shared store (Redis, Upstash, …).
 */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// SPAM_TIMETRAP_MIN_MS=0 disables the time-trap (used by the e2e suite, whose
// bots fill forms faster than humans by design). Honeypot always stays on.
const MIN_FILL_TIME_MS = Number(process.env.SPAM_TIMETRAP_MIN_MS ?? 2000);

const rateBuckets = new Map<string, number[]>();

export function checkRateLimit(
  bucketKey: string,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (rateBuckets.get(bucketKey) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((hits[0] + RATE_LIMIT_WINDOW_MS - now) / 1000),
      ),
    };
  }
  hits.push(now);
  rateBuckets.set(bucketKey, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

function rateLimited(retryAfterSeconds: number): ApiResult {
  return {
    status: 429,
    body: { ok: false, code: "rate_limited" },
    headers: { "Retry-After": String(retryAfterSeconds) },
  };
}

function badRequest(errors: Record<string, string>): ApiResult {
  return { status: 400, body: { ok: false, errors } };
}

/** Fake-accept spam: bots get a success response but nothing is persisted. */
function silentAccept(kind: string, reason: string): ApiResult {
  console.warn(`[booking] Silently discarded ${kind} submission: ${reason}`);
  return { status: 200, body: { ok: true } };
}

function spamPreCheck(
  kind: string,
  raw: Record<string, unknown>,
): ApiResult | null {
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return silentAccept(kind, "honeypot filled");
  }
  if (
    typeof raw.renderedAt === "number" &&
    Number.isFinite(raw.renderedAt) &&
    Date.now() - raw.renderedAt < MIN_FILL_TIME_MS
  ) {
    return silentAccept(kind, "submitted faster than a human can fill the form");
  }
  return null;
}

async function parseJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const raw: unknown = await req.json();
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
    return raw as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function handleBookingRequest(req: Request): Promise<ApiResult> {
  const limit = checkRateLimit(`bookings:${clientIp(req)}`);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const raw = await parseJsonBody(req);
  if (!raw) return badRequest({ form: "invalid_json" });

  const spam = spamPreCheck("booking", raw);
  if (spam) return spam;

  const parsed = bookingRequestSchema.safeParse(raw);
  if (!parsed.success) return badRequest(issuesToErrorKeys(parsed.error.issues));

  const input = parsed.data;
  const tour = getTour(input.tourId);
  if (!tour) return badRequest({ tourId: "tour_invalid" });

  const businessErrors = bookingScheduleErrors(input);
  if (Object.keys(businessErrors).length > 0) return badRequest(businessErrors);

  try {
    return { status: 200, body: { ok: true, ...await createCheckoutSession(input) } };
  } catch (error) {
    if (error instanceof CheckoutError) return { status: error.code === "payment_unavailable" ? 503 : 409, body: { ok: false, code: error.code } };
    throw error;
  }
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "name_short").max(120, "name_long"),
  email: z.string().trim().email("email_invalid").max(254),
  message: z.string().trim().min(1, "message_short").max(2000, "message_long"),
  locale: z.enum(["en", "es", "fr", "ar"]),
  website: z.string().max(0, "spam"),
  renderedAt: z.number().int().positive("spam"),
});

export async function handleContactRequest(req: Request): Promise<ApiResult> {
  const limit = checkRateLimit(`contact:${clientIp(req)}`);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const raw = await parseJsonBody(req);
  if (!raw) return badRequest({ form: "invalid_json" });

  const spam = spamPreCheck("contact", raw);
  if (spam) return spam;

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return badRequest(issuesToErrorKeys(parsed.error.issues));

  const input = parsed.data;
  const accepted = await notifyOperator({
    type: "contact_message",
    locale: input.locale,
    summary: {
      name: input.name,
      email: input.email,
      message: input.message,
      submissionId: input.renderedAt,
    },
  });

  return accepted ? { status: 200, body: { ok: true } } : { status: 503, body: { ok: false, code: "email_unavailable" } };
}
