import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { randomUUID } from "node:crypto";

const sdk = vi.hoisted(() => ({ create: vi.fn(), retrieve: vi.fn(), intent: vi.fn(), notify: vi.fn(), customer: vi.fn() }));
vi.mock("stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("stripe")>();
  return { default: class extends actual.default {
    constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); this.checkout.sessions.create = sdk.create; this.checkout.sessions.retrieve = sdk.retrieve; this.paymentIntents.retrieve = sdk.intent; }
  } };
});
vi.mock("@/lib/booking/notify", () => ({ notifyOperator: sdk.notify, notifyCustomer: sdk.customer, emailConfigured: () => true }));
import { prisma } from "@/lib/db";
import { createCheckoutSession, getStripe, processStripeEvent } from "@/lib/booking/stripe";
import { handleBookingRequest } from "@/lib/booking/server";
import { POST as webhook } from "@/app/api/stripe/webhook/route";
import { GET as status } from "@/app/api/bookings/payment-status/route";
import type { BookingRequestInput } from "@/lib/booking/schema";

const keys: string[] = [], events: string[] = [];
function payload(overrides: Partial<BookingRequestInput> = {}): BookingRequestInput {
  const idempotencyKey = randomUUID(); keys.push(idempotencyKey);
  return { tourId: "valencia-group-tour", locale: "en", date: "2030-06-15", departureTime: "10:30", guideLanguage: "en", groupSize: 2, name: "Automated Test", email: "test@example.invalid", idempotencyKey, termsAccepted: true, website: "", renderedAt: Date.now() - 10000, ...overrides };
}
async function send(data: unknown) { return handleBookingRequest(new Request("http://localhost/api/bookings", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": randomUUID() }, body: JSON.stringify(data) })); }
async function eventFor(input: BookingRequestInput, type = "checkout.session.completed", changes = {}) {
  const row = await prisma.bookingRequest.findUniqueOrThrow({ where: { idempotencyKey: input.idempotencyKey } });
  const id = "evt_test_" + randomUUID().replaceAll("-", ""); events.push(id);
  return { id, object: "event", type, data: { object: { id: row.stripeSessionId, object: "checkout.session", metadata: { bookingId: row.id }, client_reference_id: row.id, currency: "eur", amount_total: row.amountCents, payment_status: "paid", payment_intent: "pi_" + row.id, ...changes } } } as unknown as Stripe.Event;
}
async function row(input: BookingRequestInput) { return prisma.bookingRequest.findUniqueOrThrow({ where: { idempotencyKey: input.idempotencyKey } }); }

beforeAll(() => {
  if (!process.env.BOOKING_INTEGRATION_TEST || !process.env.DATABASE_URL?.includes("biketourvlc_preview")) throw new Error("Only the isolated preview database may run these integration tests");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock_local_only"); vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_mock_local_only"); vi.stubEnv("SITE_URL", "http://localhost:3197");
});
beforeEach(() => {
  vi.clearAllMocks(); sdk.notify.mockResolvedValue(true); sdk.customer.mockResolvedValue(true);
  sdk.create.mockImplementation(async () => ({ id: "cs_test_" + randomUUID().replaceAll("-", ""), url: "https://checkout.stripe.com/c/pay/mock", expires_at: Math.floor(Date.now() / 1000) + 3600, status: "open" }));
});
afterEach(async () => {
  await prisma.stripeEvent.deleteMany({ where: { id: { in: events } } });
  await prisma.bookingRequest.deleteMany({ where: { idempotencyKey: { in: keys } } });
  expect(await prisma.bookingRequest.count({ where: { idempotencyKey: { in: keys } } })).toBe(0);
  expect(await prisma.stripeEvent.count({ where: { id: { in: events } } })).toBe(0);
});
afterAll(async () => { vi.unstubAllEnvs(); await prisma.$disconnect(); });

describe("paid reservations with isolated PostgreSQL and mocked Stripe/network", () => {
  it.each([["en", "10:30", 5000], ["nl", "10:00", 6000]] as const)("charges %s at its server-side price, ignoring a forged amount", async (guideLanguage, departureTime, total) => {
    const input = payload({ guideLanguage, departureTime });
    expect((await send({ ...input, amountCents: 1 })).status).toBe(200);
    expect((await row(input)).amountCents).toBe(total);
    expect((await row(input)).status).toBe("awaiting_payment");
    expect(sdk.create.mock.calls[0][0].line_items[0]).toMatchObject({ quantity: 2, price_data: { unit_amount: total / 2, currency: "eur" } });
    expect(sdk.notify).not.toHaveBeenCalled();
  });
  it("charges private tours €225 and uses the correct localized return URL", async () => {
    const input = payload({ tourId: "private-architecture", locale: "es", groupSize: 8, guideLanguage: "ar", departureTime: "16:00" });
    await createCheckoutSession(input);
    expect((await row(input)).amountCents).toBe(22500);
    expect(sdk.create.mock.calls[0][0]).toMatchObject({ success_url: expect.stringContaining("/es/reservar/?payment=success"), line_items: [{ quantity: 1, price_data: expect.objectContaining({ unit_amount: 22500 }) }] });
  });
  it("rejects invalid slots, language, consent and larger private groups before persistence", async () => {
    for (const override of [{ departureTime: "10:00" }, { termsAccepted: false }, { tourId: "private-city", departureTime: "16:30" }, { tourId: "private-architecture", guideLanguage: "fr" }, { tourId: "private-city", groupSize: 11 }]) {
      expect((await send({ ...payload(), ...override })).status).toBe(400);
    }
    expect(sdk.create).not.toHaveBeenCalled(); expect(sdk.notify).not.toHaveBeenCalled();
  });
  it("missing payment configuration creates no unpaid request or notification", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    try { const input = payload(); expect((await send(input)).status).toBe(503); expect(await prisma.bookingRequest.count({ where: { idempotencyKey: input.idempotencyKey } })).toBe(0); }
    finally { vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock_local_only"); }
  });
  it("reuses an existing checkout and rejects changed payload with the same key", async () => {
    const input = payload(); await createCheckoutSession(input);
    sdk.retrieve.mockResolvedValue({ status: "open", url: "https://checkout.stripe.com/c/pay/mock" });
    await createCheckoutSession(input); expect(sdk.create).toHaveBeenCalledTimes(1);
    await expect(createCheckoutSession({ ...input, groupSize: 3 })).rejects.toThrow("idempotency_conflict");
  });
  it("retries an uncertain Stripe creation with the same key and identical parameters", async () => {
    const input = payload(); sdk.create.mockRejectedValueOnce(new Error("network timeout"));
    await expect(createCheckoutSession(input)).rejects.toThrow(); await createCheckoutSession(input);
    expect(sdk.create.mock.calls[0]).toEqual(sdk.create.mock.calls[1]);
    expect(await prisma.bookingRequest.count({ where: { idempotencyKey: input.idempotencyKey } })).toBe(1);
  });
  it("a signed paid event submits exactly one reservation; duplicates and late expiry preserve payment", async () => {
    const input = payload(); await createCheckoutSession(input); const event = await eventFor(input);
    const body = JSON.stringify(event); const signature = getStripe().webhooks.generateTestHeaderString({ payload: body, secret: "whsec_mock_local_only" });
    const req = () => new Request("http://localhost/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signature }, body });
    expect((await webhook(req())).status).toBe(200); expect((await row(input)).status).toBe("paid_pending_confirmation");
    expect(sdk.notify).toHaveBeenCalledTimes(1); expect((await webhook(req())).status).toBe(200); expect(sdk.notify).toHaveBeenCalledTimes(1);
    await processStripeEvent(await eventFor(input, "checkout.session.expired", { payment_status: "unpaid" })); expect((await row(input)).status).toBe("paid_pending_confirmation");
    const result = await status(new Request("http://localhost/api/bookings/payment-status?session_id=" + (await row(input)).stripeSessionId));
    expect(await result.json()).toEqual({ status: "paid_pending_confirmation" });
  });
  it("unpaid completion cannot submit a reservation, but a later paid event can", async () => {
    const input = payload(); await createCheckoutSession(input);
    await processStripeEvent(await eventFor(input, "checkout.session.completed", { payment_status: "unpaid" }));
    expect((await row(input)).paidAt).toBeNull(); expect(sdk.notify).not.toHaveBeenCalled();
    await processStripeEvent(await eventFor(input, "checkout.session.async_payment_succeeded")); expect((await row(input)).paidAt).not.toBeNull();
  });
  it("rejects forged signatures and amount mismatch; failed events remain retryable", async () => {
    const input = payload(); await createCheckoutSession(input); const event = await eventFor(input, "checkout.session.completed", { amount_total: 1 });
    expect((await webhook(new Request("http://localhost/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": "forged" }, body: JSON.stringify(event) }))).status).toBe(400);
    await expect(processStripeEvent(event)).rejects.toThrow("Stripe amount mismatch");
    expect(await prisma.stripeEvent.count({ where: { id: event.id } })).toBe(0); expect((await row(input)).paidAt).toBeNull();
    (event.data.object as Stripe.Checkout.Session).amount_total = (await row(input)).amountCents;
    await processStripeEvent(event); expect((await row(input)).paidAt).not.toBeNull();
  });
  it("notification failure returns a retryable error after payment without losing the reservation", async () => {
    const input = payload(); await createCheckoutSession(input); const event = await eventFor(input);
    sdk.notify.mockResolvedValueOnce(false); await expect(processStripeEvent(event)).rejects.toThrow("notification failed");
    expect((await row(input)).paidAt).not.toBeNull(); expect((await row(input)).notifiedAt).toBeNull();
    await processStripeEvent(event); expect((await row(input)).notifiedAt).not.toBeNull();
  });
  it("retries only the customer email after partial email success", async () => {
    const input = payload(); await createCheckoutSession(input); const event = await eventFor(input);
    sdk.customer.mockResolvedValueOnce(false);
    await expect(processStripeEvent(event)).rejects.toThrow("Customer notification failed");
    expect((await row(input)).notifiedAt).not.toBeNull(); expect((await row(input)).customerNotifiedAt).toBeNull();
    await processStripeEvent(event);
    expect(sdk.notify).toHaveBeenCalledTimes(1); expect(sdk.customer).toHaveBeenCalledTimes(2);
    expect((await row(input)).customerNotifiedAt).not.toBeNull();
    await processStripeEvent(event); expect(sdk.customer).toHaveBeenCalledTimes(2);
  });
  it("expiry creates no reservation notification and full refunds update payment state", async () => {
    const input = payload(); await createCheckoutSession(input); await processStripeEvent(await eventFor(input, "checkout.session.expired", { payment_status: "unpaid" }));
    expect((await row(input)).status).toBe("expired"); expect(sdk.notify).not.toHaveBeenCalled();
    await processStripeEvent(await eventFor(input));
    const paid = await row(input); const id = "evt_refund_" + randomUUID(); events.push(id);
    await processStripeEvent({ id, type: "charge.refunded", data: { object: { payment_intent: paid.stripePaymentIntentId, refunded: true, amount: paid.amountCents, currency: paid.currency } } } as Stripe.Event);
    expect((await row(input)).status).toBe("refunded");
  });
  it("a refund arriving before checkout completion is never reverted to paid", async () => {
    const input = payload(); await createCheckoutSession(input); const booking = await row(input);
    sdk.intent.mockResolvedValue({ metadata: { bookingId: booking.id } });
    const id = "evt_early_refund_" + randomUUID(); events.push(id);
    await processStripeEvent({ id, type: "charge.refunded", data: { object: { payment_intent: "pi_" + booking.id, refunded: true, amount: booking.amountCents, currency: booking.currency } } } as Stripe.Event);
    await processStripeEvent(await eventFor(input));
    expect((await row(input)).status).toBe("refunded"); expect(sdk.notify).not.toHaveBeenCalled();
  });
  it("unknown success-page session reveals no personal information or paid status", async () => {
    const response = await status(new Request("http://localhost/api/bookings/payment-status?session_id=cs_test_not_a_real_session_0000"));
    expect(await response.json()).toEqual({ status: "pending" });
  });
});
