import Stripe from "stripe";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { getTour, tourPrice } from "@/config/tours";
import { prisma } from "@/lib/db";
import { routing } from "@/i18n/routing";
import type { BookingRequestInput } from "./schema";
import { notifyOperator, notifyCustomer, emailConfigured } from "./notify";

export class CheckoutError extends Error {
  constructor(readonly code: string) { super(code); }
}

export function paymentConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.SITE_URL && process.env.DATABASE_URL && emailConfigured());
}
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new CheckoutError("payment_unavailable");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}
export function computeAmountCents(tourId: string, groupSize: number, language = "en"): number {
  const tour = getTour(tourId);
  const price = tour && tourPrice(tour, groupSize, language);
  if (!price) throw new CheckoutError("quote_required");
  return price.totalCents;
}

// Fingerprint prevents a retried key from silently charging for changed guest/slot details.
function fingerprint(input: BookingRequestInput) {
  const { renderedAt: _renderedAt, website: _website, ...data } = input;
  void _renderedAt; void _website;
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
function sameReservation(row: { tourId: string; locale: string; date: string; departureTime: string; groupSize: number; name: string; email: string; phone: string | null; guideLanguage: string | null; message: string | null }, input: BookingRequestInput) {
  return row.tourId === input.tourId && row.locale === input.locale && row.date === input.date && row.departureTime === input.departureTime && row.groupSize === input.groupSize && row.name === input.name && row.email === input.email && (row.phone || "") === (input.phone || "") && row.guideLanguage === input.guideLanguage && (row.message || "") === (input.message || "");
}

export async function createCheckoutSession(input: BookingRequestInput) {
  if (!paymentConfigured()) throw new CheckoutError("payment_unavailable");
  const stripe = getStripe();
  const amountCents = computeAmountCents(input.tourId, input.groupSize, input.guideLanguage);
  const base = new URL(process.env.SITE_URL!);
  if (base.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(base.hostname)) throw new CheckoutError("payment_unavailable");
  const tour = getTour(input.tourId)!;
  let booking = await prisma.bookingRequest.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (!booking) {
    try {
      booking = await prisma.bookingRequest.create({ data: {
        idempotencyKey: input.idempotencyKey, tourId: input.tourId, locale: input.locale,
        date: input.date, departureTime: input.departureTime, groupSize: input.groupSize,
        name: input.name, email: input.email, phone: input.phone || null,
        guideLanguage: input.guideLanguage, message: input.message || null,
        amountCents, currency: "eur", status: "awaiting_payment", termsAcceptedAt: new Date(),
      } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      booking = await prisma.bookingRequest.findUniqueOrThrow({ where: { idempotencyKey: input.idempotencyKey } });
    }
  }
  if (!sameReservation(booking, input) || booking.amountCents !== amountCents) throw new CheckoutError("idempotency_conflict");
  if (booking.status !== "awaiting_payment") throw new CheckoutError(booking.paidAt ? "already_paid" : "checkout_expired");
  if (booking.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
    if (session.status === "open" && session.url) return { url: session.url };
    throw new CheckoutError(session.payment_status === "paid" ? "already_paid" : "checkout_expired");
  }
  // Retry an uncertain Stripe response with identical parameters and key, even across server restarts.
  const expiresAt = Math.floor(booking.createdAt.getTime() / 1000) + 3600;
  if (expiresAt < Math.floor(Date.now() / 1000) + 1800) throw new CheckoutError("checkout_expired");
  const bookPath = `/${input.locale}${routing.pathnames["/book"][input.locale]}/`;
  const label = tour.key === "shared" ? `Shared Bike Tour (${input.guideLanguage === "nl" ? "Dutch" : "English"})` : tour.key === "city" ? "Private City Bike Tour" : "Private Islamic Architecture Bike Tour";
  const session = await stripe.checkout.sessions.create({
    mode: "payment", payment_method_types: ["card"], customer_email: input.email,
    locale: input.locale === "ar" ? "auto" : input.locale,
    line_items: [{ quantity: tour.private ? 1 : input.groupSize, price_data: {
      currency: "eur", unit_amount: tour.private ? amountCents : amountCents / input.groupSize,
      product_data: { name: `${label} · ${input.date} ${input.departureTime}`, description: "Reservation payment. Departure subject to operator confirmation. Times: Europe/Madrid." },
    } }],
    success_url: `${base.origin}${bookPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base.origin}${bookPath}?tour=${input.tourId}&payment=cancelled`,
    expires_at: expiresAt, client_reference_id: booking.id,
    metadata: { bookingId: booking.id, fingerprint: fingerprint(input) },
    payment_intent_data: { metadata: { bookingId: booking.id } },
  }, { idempotencyKey: `reservation-${input.idempotencyKey}` });
  if (!session.url) throw new CheckoutError("payment_unavailable");
  await prisma.bookingRequest.update({ where: { id: booking.id }, data: { stripeSessionId: session.id, checkoutExpiresAt: new Date(session.expires_at * 1000) } });
  return { url: session.url };
}

export async function processStripeEvent(event: Stripe.Event) {
  const supported = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired", "checkout.session.async_payment_failed", "charge.refunded"];
  if (!supported.includes(event.type)) return;
  // The event marker and state change commit together; failed processing remains retryable.
  await prisma.$transaction(async (tx) => {
    if (await tx.stripeEvent.findUnique({ where: { id: event.id } })) return;
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const intent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (intent && charge.refunded) {
        let reservation = await tx.bookingRequest.findUnique({ where: { stripePaymentIntentId: intent } });
        if (!reservation) {
          // Refund and checkout webhooks can arrive out of order.
          const payment = await getStripe().paymentIntents.retrieve(intent);
          if (payment.metadata.bookingId) reservation = await tx.bookingRequest.findUnique({ where: { id: payment.metadata.bookingId } });
        }
        if (reservation) {
          if (charge.amount !== reservation.amountCents || charge.currency !== reservation.currency) throw new Error("Stripe refund amount mismatch");
          await tx.bookingRequest.update({ where: { id: reservation.id }, data: { status: "refunded", stripePaymentIntentId: intent, paidAt: reservation.paidAt ?? new Date() } });
        }
      }
    } else {
      const session = event.data.object as Stripe.Checkout.Session;
      const id = session.metadata?.bookingId;
      if (!id) return;
      const booking = await tx.bookingRequest.findUnique({ where: { id } });
      if (!booking) throw new Error("Unknown reservation in Stripe event");
      if (session.client_reference_id !== booking.id || (booking.stripeSessionId && booking.stripeSessionId !== session.id)) throw new Error("Stripe reservation mismatch");
      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        if (session.payment_status === "paid") {
          if (session.amount_total !== booking.amountCents || session.currency !== booking.currency) throw new Error("Stripe amount mismatch");
          const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
          await tx.bookingRequest.updateMany({ where: { id, paidAt: null, status: { in: ["awaiting_payment", "expired"] } }, data: {
            status: "paid_pending_confirmation", paidAt: new Date(), stripeSessionId: session.id, stripePaymentIntentId: intent,
          } });
        }
      } else {
        await tx.bookingRequest.updateMany({ where: { id, status: "awaiting_payment", paidAt: null }, data: { status: "expired" } });
      }
    }
    await tx.stripeEvent.create({ data: { id: event.id, type: event.type } });
  }).catch(async (error) => {
    // Concurrent duplicate delivery rolls back; the successful transaction owns the state.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && await prisma.stripeEvent.findUnique({ where: { id: event.id } }))) throw error;
  });
  const session = event.data.object as Stripe.Checkout.Session;
  if (event.type.startsWith("checkout.session.") && session.metadata?.bookingId) {
    const booking = await prisma.bookingRequest.findUnique({ where: { id: session.metadata.bookingId } });
    if (booking?.paidAt && booking.status === "paid_pending_confirmation") {
      // Each recipient is persisted separately so a customer-email retry does not resend the operator email.
      if (!booking.notifiedAt) {
        const accepted = await notifyOperator({ type: "paid_reservation", locale: booking.locale, summary: { ...booking, idempotencyKey: `paid-${booking.id}` } });
        if (!accepted) throw new Error("Paid reservation notification failed; retry webhook");
        await prisma.bookingRequest.update({ where: { id: booking.id }, data: { notifiedAt: new Date() } });
      }
      if (!booking.customerNotifiedAt) {
        if (!await notifyCustomer(booking)) throw new Error("Customer notification failed; retry webhook");
        await prisma.bookingRequest.update({ where: { id: booking.id }, data: { customerNotifiedAt: new Date() } });
      }
    }
  }
}
