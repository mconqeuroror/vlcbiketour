import type { z } from "zod";

/**
 * Maps Zod issues to translation keys under `booking.errors.*`.
 * Schema-declared custom messages already ARE keys; anything else (enum
 * mismatches, structural failures) falls back to a per-field key so the
 * client always receives a stable, localisable key — never raw Zod text.
 */
const KNOWN_KEYS = new Set([
  "date_format",
  "date_past",
  "date_advance",
  "time_format",
  "time_unavailable",
  "group_size_type",
  "group_size_int",
  "group_size_min",
  "group_size_max",
  "name_short",
  "name_long",
  "email_invalid",
  "phone_invalid",
  "phone_long",
  "message_short",
  "message_long",
  "idempotency",
  "spam",
]);

const FIELD_FALLBACK: Record<string, string> = {
  tourId: "tour_invalid",
  locale: "locale_invalid",
  date: "date_format",
  departureTime: "time_format",
  groupSize: "group_size_type",
  name: "name_short",
  email: "email_invalid",
  phone: "phone_invalid",
  guideLanguage: "guide_language_invalid",
  message: "message_long",
  idempotencyKey: "idempotency",
  website: "spam",
  renderedAt: "spam",
  form: "invalid",
};

export function issuesToErrorKeys(
  issues: readonly z.core.$ZodIssue[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    if (out[field]) continue;
    out[field] = KNOWN_KEYS.has(issue.message)
      ? issue.message
      : (FIELD_FALLBACK[field] ?? "invalid");
  }
  return out;
}
