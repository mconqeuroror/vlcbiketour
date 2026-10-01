import { test, expect } from "@playwright/test";
import {
  validBookingPayload,
  pastDate,
  bookingRequestCount,
} from "./helpers";

// The API rate-limits 5 POSTs / 10 min per client IP. Each request below uses
// a distinct x-forwarded-for bucket so cases stay independent of each other.
let ipCounter = 0;
function headers() {
  ipCounter += 1;
  return {
    "Content-Type": "application/json",
    "x-forwarded-for": `10.99.0.${ipCounter}`,
  };
}

test.describe("7. Booking API", () => {
  for (const size of [5, 20]) {
    test(`valid payload groupSize ${size} → 200 { ok: true }`, async ({
      request,
    }) => {
      const res = await request.post("/api/bookings/", {
        headers: headers(),
        data: validBookingPayload({ groupSize: size }),
      });
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    });
  }

  for (const [label, size] of [
    ["4 (below min)", 4],
    ["21 (above max)", 21],
    ["5.5 (non-integer)", 5.5],
    ['"12" (string)', "12"],
  ] as const) {
    test(`groupSize ${label} → 400`, async ({ request }) => {
      const res = await request.post("/api/bookings/", {
        headers: headers(),
        data: validBookingPayload({ groupSize: size }),
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.errors).toHaveProperty("groupSize");
    });
  }

  test("missing groupSize → 400", async ({ request }) => {
    const payload = validBookingPayload();
    delete (payload as Record<string, unknown>).groupSize;
    const res = await request.post("/api/bookings/", {
      headers: headers(),
      data: payload,
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).errors).toHaveProperty("groupSize");
  });

  test("past date → 400", async ({ request }) => {
    const res = await request.post("/api/bookings/", {
      headers: headers(),
      data: validBookingPayload({ date: pastDate() }),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).errors).toEqual({ date: "date_past" });
  });

  test('departureTime "12:34" (not offered) → 400', async ({ request }) => {
    const res = await request.post("/api/bookings/", {
      headers: headers(),
      data: validBookingPayload({ departureTime: "12:34" }),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).errors).toEqual({
      departureTime: "time_unavailable",
    });
  });

  test("same idempotencyKey twice → second is 409 duplicate", async ({
    request,
  }) => {
    const ip = headers();
    const payload = validBookingPayload();
    const first = await request.post("/api/bookings/", {
      headers: ip,
      data: payload,
    });
    expect(first.status()).toBe(200);
    const second = await request.post("/api/bookings/", {
      headers: ip,
      data: payload,
    });
    expect(second.status()).toBe(409);
    expect((await second.json()).code).toBe("duplicate");
  });

  test("GET /api/bookings/ → 405", async ({ request }) => {
    const res = await request.get("/api/bookings/");
    expect(res.status()).toBe(405);
  });

  test("honeypot website filled → 200 but NOT persisted", async ({
    request,
  }) => {
    const before = await bookingRequestCount();
    const res = await request.post("/api/bookings/", {
      headers: headers(),
      data: validBookingPayload({ website: "x" }),
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const after = await bookingRequestCount();
    expect(after).toBe(before);
  });
});
