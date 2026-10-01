import { describe, expect, it } from "vitest";
import { bookingRequestSchema } from "@/lib/booking/schema";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    tourId: "valencia-group-tour",
    locale: "en",
    date: "2026-10-07",
    departureTime: "10:00",
    groupSize: 8,
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "",
    guideLanguage: "en",
    message: "",
    idempotencyKey: crypto.randomUUID(),
    website: "",
    renderedAt: Date.now(),
    ...overrides,
  };
}

describe("bookingRequestSchema", () => {
  it("accepts a valid payload", () => {
    const result = bookingRequestSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("accepts optional fields omitted entirely", () => {
    const payload = validPayload();
    delete (payload as Record<string, unknown>).phone;
    delete (payload as Record<string, unknown>).guideLanguage;
    delete (payload as Record<string, unknown>).message;
    expect(bookingRequestSchema.safeParse(payload).success).toBe(true);
  });

  it.each([4, 21, 5.5, "10", Number.NaN])(
    "rejects groupSize %s",
    (groupSize) => {
      const result = bookingRequestSchema.safeParse(validPayload({ groupSize }));
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain("groupSize");
      }
    },
  );

  it("rejects a missing groupSize", () => {
    const payload = validPayload();
    delete (payload as Record<string, unknown>).groupSize;
    const result = bookingRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("accepts the group-size boundaries 5 and 20", () => {
    expect(
      bookingRequestSchema.safeParse(validPayload({ groupSize: 5 })).success,
    ).toBe(true);
    expect(
      bookingRequestSchema.safeParse(validPayload({ groupSize: 20 })).success,
    ).toBe(true);
  });

  it("rejects a non-empty honeypot", () => {
    const result = bookingRequestSchema.safeParse(
      validPayload({ website: "https://spam.example" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("spam");
    }
  });

  it("rejects an invalid email", () => {
    const result = bookingRequestSchema.safeParse(
      validPayload({ email: "not-an-email" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("email_invalid");
    }
  });

  it("rejects a malformed date", () => {
    expect(
      bookingRequestSchema.safeParse(validPayload({ date: "07/10/2026" }))
        .success,
    ).toBe(false);
  });

  it("rejects an unknown tour id", () => {
    expect(
      bookingRequestSchema.safeParse(validPayload({ tourId: "moon-tour" }))
        .success,
    ).toBe(false);
  });
});
