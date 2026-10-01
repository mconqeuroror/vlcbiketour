import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingRequest } from "@prisma/client";
import { emailConfigured, notifyCustomer, notifyOperator } from "@/lib/booking/notify";
import { handleContactRequest } from "@/lib/booking/server";
import { paymentConfigured } from "@/lib/booking/stripe";
const network = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", network); network.mockReset();
  vi.stubEnv("RESEND_API_KEY", "re_mock"); vi.stubEnv("RESEND_FROM_EMAIL", "BikeTourVLC <bookings@example.invalid>"); vi.stubEnv("OPERATOR_NOTIFY_EMAIL", "operator@example.invalid");
  network.mockResolvedValue({ ok: true, json: async () => ({ id: "email_mock" }) });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const contact = { type: "contact_message" as const, locale: "en", summary: { name: "<script>test</script>", email: "guest@example.invalid", message: "Hello <b>there</b>", submissionId: 1234 } };
const booking = { id: "reservation_test", tourId: "valencia-group-tour", locale: "en", date: "2030-06-15", departureTime: "10:30", guideLanguage: "en", groupSize: 2, amountCents: 5000, email: "guest@example.invalid" } as BookingRequest;
describe("Resend email integration (mocked network)", () => {
  it("uses a verified sender, guest reply-to, plain text and a stable contact retry key", async () => {
    expect(await notifyOperator(contact)).toBe(true); await notifyOperator(contact);
    const [url, options] = network.mock.calls[0]; const body = JSON.parse(options.body);
    expect(url).toBe("https://api.resend.com/emails"); expect(body.from).toContain("bookings@example.invalid"); expect(body.to).toEqual(["operator@example.invalid"]); expect(body.reply_to).toBe("guest@example.invalid"); expect(body.html).toBeUndefined(); expect(body.text).toContain("Hello <b>there</b>");
    expect(options.headers["Idempotency-Key"]).toBe(network.mock.calls[1][1].headers["Idempotency-Key"]);
  });
  it.each(["en", "es", "fr", "ar"])("sends a %s customer receipt after payment with a distinct stable key", async (locale) => {
    expect(await notifyCustomer({ ...booking, locale })).toBe(true);
    const options = network.mock.calls[0][1]; const body = JSON.parse(options.body);
    expect(body.to).toEqual([booking.email]); expect(body.reply_to).toBe("operator@example.invalid"); expect(body.text).toContain("EUR 50.00"); expect(body.text).toContain("10:30–13:30 (Europe/Madrid)"); expect(body.text).toContain("Casa Fenicia"); expect(options.headers["Idempotency-Key"]).toBe("paid-customer-reservation_test");
    if (locale === "en") expect(body.text).toContain("this email does not confirm the departure");
  });
  it("rejects missing Resend configuration and gates checkout", async () => {
    vi.stubEnv("RESEND_API_KEY", ""); expect(emailConfigured()).toBe(false); expect(paymentConfigured()).toBe(false); expect(await notifyOperator(contact)).toBe(false); expect(network).not.toHaveBeenCalled();
  });
  it("treats API rejection, malformed acknowledgement and network failure as retryable failures", async () => {
    network.mockResolvedValueOnce({ ok: false, status: 429 }); expect(await notifyOperator(contact)).toBe(false);
    network.mockResolvedValueOnce({ ok: true, json: async () => ({}) }); expect(await notifyOperator(contact)).toBe(false);
    network.mockRejectedValueOnce(new Error("timeout")); expect(await notifyOperator(contact)).toBe(false);
  });
  it("never claims a contact message was sent when Resend fails", async () => {
    network.mockResolvedValueOnce({ ok: false, status: 503 });
    const result = await handleContactRequest(new Request("http://localhost/api/contact", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "192.0.2.22" }, body: JSON.stringify({ ...contact.summary, locale: "en", website: "", renderedAt: Date.now() - 10000 }) }));
    expect(result.status).toBe(503); expect(result.body.ok).toBe(false);
  });
});
