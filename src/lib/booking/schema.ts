import { z } from "zod";
import { operator } from "@/config/operator";
import { tours } from "@/config/tours";

const { min, max } = operator.groupSize;
const tourIds = tours.map((t) => t.id) as [string, ...string[]];

/**
 * Shared booking-request contract. Used by the client form, the server
 * action and the unit tests — validation rules live here exactly once.
 * All error keys map to messages under `booking.errors.*`.
 */
export const bookingRequestSchema = z.object({
  tourId: z.enum(tourIds),
  locale: z.enum(["en", "es"]),
  /** ISO date yyyy-MM-dd. Past-date check happens server-side in Europe/Madrid. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date_format")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "date_format"),
  /** HH:mm local departure time. */
  departureTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time_format"),
  groupSize: z
    .number({ error: "group_size_type" })
    .int("group_size_int")
    .min(min, "group_size_min")
    .max(max, "group_size_max"),
  name: z.string().trim().min(2, "name_short").max(120, "name_long"),
  email: z.string().trim().email("email_invalid").max(254),
  phone: z
    .string()
    .trim()
    .max(32, "phone_long")
    .regex(/^[+()\-.\s\d]*$/, "phone_invalid")
    .optional()
    .or(z.literal("")),
  guideLanguage: z.enum(["en", "es"]).optional(),
  message: z.string().trim().max(2000, "message_long").optional().or(z.literal("")),
  /** Client-generated UUID — unique DB constraint prevents duplicates. */
  idempotencyKey: z.string().uuid("idempotency"),
  /** Honeypot: must stay empty. */
  website: z.string().max(0, "spam"),
  /** ms timestamp of form render — time-trap spam control. */
  renderedAt: z.number().int().positive("spam"),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

/** Current date in the tour timezone as yyyy-MM-dd. */
export function todayInTourTimezone(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: operator.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** True when `date` (yyyy-MM-dd) is before today in Europe/Madrid. */
export function isPastTourDate(date: string, now = new Date()): boolean {
  return date < todayInTourTimezone(now);
}

/** True when the date respects the tour's minimum advance booking window. */
export function respectsAdvanceWindow(
  date: string,
  minAdvanceDays: number,
  now = new Date(),
): boolean {
  const today = todayInTourTimezone(now);
  const min = new Date(`${today}T00:00:00Z`);
  min.setUTCDate(min.getUTCDate() + minAdvanceDays);
  const minStr = min.toISOString().slice(0, 10);
  return date >= minStr;
}
