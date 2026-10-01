import { test, expect } from "@playwright/test";
import { validBookingPayload, pastDate } from "./helpers";
// Successful payment and persistence are tested against isolated PostgreSQL with Stripe mocked.
// These HTTP tests only send invalid input and never create reservations or Checkout sessions.
for (const [label, overrides, field] of [
  ["below minimum", { groupSize: 0 }, "groupSize"], ["above maximum", { groupSize: 21 }, "groupSize"],
  ["fractional party", { groupSize: 5.5 }, "groupSize"], ["string party", { groupSize: "2" }, "groupSize"],
  ["past date", { date: pastDate() }, "date"], ["mismatched language/time", { departureTime: "10:00", guideLanguage: "en" }, "departureTime"],
  ["missing consent", { termsAccepted: false }, "termsAccepted"],
  ["private outside schedule", { tourId: "private-city", departureTime: "17:00" }, "departureTime"],
  ["private quotation", { tourId: "private-city", groupSize: 11 }, "groupSize"],
] as const) {
  test(`rejects ${label} before checkout`, async ({ request }) => {
    const response = await request.post("/api/bookings/", { headers: { "x-forwarded-for": crypto.randomUUID() }, data: validBookingPayload(overrides) });
    expect(response.status()).toBe(400); expect((await response.json()).errors).toHaveProperty(field);
  });
}
test("booking GET is not a submission endpoint", async ({ request }) => {
  expect((await request.get("/api/bookings/")).status()).toBe(405);
});
