import { z } from "zod";
import { operator } from "@/config/operator";
import { tours, getTour, privateStartTimes } from "@/config/tours";

const { min, max } = operator.groupSize;
const tourIds = tours.map((t) => t.id) as [string, ...string[]];

/**
 * Shared booking-request contract. Used by the client form, the server
 * action and the unit tests — validation rules live here exactly once.
 * All error keys map to messages under `booking.errors.*`.
 */
export const bookingRequestSchema = z.object({
  tourId: z.enum(tourIds),
  locale: z.enum(["en", "es", "fr", "ar"]),
  /** ISO date yyyy-MM-dd. Past-date check happens server-side in Europe/Madrid. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date_format")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v, "date_format"),
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
  guideLanguage: z.enum(["en", "nl", "it", "es", "fr", "ar"], { error: "guide_language_invalid" }),
  termsAccepted: z.literal(true, { error: "terms_required" }),
  message: z.string().trim().max(2000, "message_long").optional().or(z.literal("")),
  /** Client-generated UUID — unique DB constraint prevents duplicates. */
  idempotencyKey: z.string().uuid("idempotency"),
  /** Honeypot: must stay empty. */
  website: z.string().max(0, "spam"),
  /** ms timestamp of form render — time-trap spam control. */
  renderedAt: z.number().int().positive("spam"),
}).superRefine((input, ctx) => {
  const tour = getTour(input.tourId);
  if (!tour) return;
  if (!tour.guideLanguages.includes(input.guideLanguage)) {
    ctx.addIssue({ code: "custom", path: ["guideLanguage"], message: "guide_language_invalid" });
  }
  if (tour.private && !privateStartTimes.includes(input.departureTime)) {
    ctx.addIssue({ code: "custom", path: ["departureTime"], message: "private_time_unavailable" });
  }
  if (tour.private && input.groupSize > 10) {
    ctx.addIssue({ code: "custom", path: ["groupSize"], message: "quote_required" });
  }
  if (!tour.private && !tour.departures.some((d) => d.time === input.departureTime && d.language === input.guideLanguage)) {
    ctx.addIssue({ code: "custom", path: ["departureTime"], message: "time_unavailable" });
  }
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

/** Resolve Madrid wall time, rejecting missing or ambiguous daylight-saving times. */
export function departureInstant(date: string, time: string): number | null {
  const wall = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(wall)) return null;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: operator.timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const matches = [1, 2].map((offset) => wall - offset * 3600000).filter((instant) => {
    const parts = formatter.formatToParts(new Date(instant));
    const value = (type: string) => parts.find((part) => part.type === type)?.value;
    return `${value("year")}-${value("month")}-${value("day")}` === date && `${value("hour")}:${value("minute")}` === time;
  });
  return matches.length === 1 ? matches[0] : null;
}
export function bookingScheduleErrors(input: Pick<BookingRequestInput, "tourId" | "date" | "departureTime">, now = new Date()): Record<string, string> {
  const tour = getTour(input.tourId);
  if (!tour) return { tourId: "tour_invalid" };
  const instant = departureInstant(input.date, input.departureTime);
  if (instant === null) return { departureTime: "time_format" };
  if (instant <= now.getTime()) return { date: "date_past" };
  if (instant - now.getTime() < tour.minAdvanceHours * 3600000) return { date: "date_advance" };
  return {};
}
