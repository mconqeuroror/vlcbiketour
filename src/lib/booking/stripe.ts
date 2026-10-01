import Stripe from "stripe";
import { operator } from "@/config/operator";
import { getTour } from "@/config/tours";
import { prisma } from "@/lib/db";

/**
 * Instant-booking helpers. Everything in this module is gated behind
 * operator.bookingMode === "instant"; in the default "request" mode these
 * functions throw and the webhook route returns 404.
 *
 * Activation checklist (instant mode):
 *   1. Confirm real pricing in src/config/tours.ts (price.kind !== "tbd").
 *   2. Set BOOKING_MODE=instant, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 *      SITE_URL in the environment.
 *   3. Create Departure rows (tourId + date + time + capacity) for the
 *      sellable schedule — bookings can only be taken against existing rows.
 *   4. Point a Stripe webhook at /api/stripe/webhook with events
 *      checkout.session.completed and checkout.session.expired.
 *   5. Build the instant-mode UI branch on the booking page (currently the
 *      page renders the request form regardless of mode).
 */

const HOLD_MINUTES = 15;

export class InstantModeError extends Error {
  constructor(
    message: string,
    readonly code:
      | "mode_disabled"
      | "pricing_unconfirmed"
      | "departure_unavailable"
      | "stripe_unconfigured",
  ) {
    super(message);
    this.name = "InstantModeError";
  }
}

export function assertInstantMode(): void {
  if (operator.bookingMode !== "instant") {
    throw new InstantModeError(
      "Stripe checkout is only available when BOOKING_MODE=instant",
      "mode_disabled",
    );
  }
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  assertInstantMode();
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new InstantModeError("STRIPE_SECRET_KEY is not configured", "stripe_unconfigured");
  }
  return (stripeClient ??= new Stripe(key));
}

/** Server-side price calculation — never trust client-supplied amounts. */
export function computeAmountCents(tourId: string, groupSize: number): number {
  const tour = getTour(tourId);
  if (!tour) throw new InstantModeError("Unknown tour", "departure_unavailable");
  switch (tour.price.kind) {
    case "tbd":
      throw new InstantModeError(
        `Tour ${tourId} has unconfirmed pricing (kind "tbd") — instant checkout is impossible`,
        "pricing_unconfirmed",
      );
    case "per_person":
      return tour.price.amountCents * groupSize;
    case "per_group":
      return tour.price.amountCents;
  }
}

export interface CheckoutInput {
  tourId: string;
  date: string;
  departureTime: string;
  groupSize: number;
  name: string;
  email: string;
  phone?: string;
  guideLanguage?: string;
  locale: "en" | "es";
}

/**
 * Atomically reserves seats (15-minute hold) and creates a Stripe Checkout
 * Session. Capacity rules: a departure is unavailable when it lacks the
 * requested seats, or when it is exclusive (per-row flag OR global
 * operator.toursArePrivate) and any booking/hold already exists on it.
 */
export async function createCheckoutSession(
  input: CheckoutInput,
): Promise<{ url: string; bookingId: string }> {
  assertInstantMode();
  const amountCents = computeAmountCents(input.tourId, input.groupSize);
  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

  const booking = await prisma.$transaction(async (tx) => {
    const departure = await tx.departure.findUnique({
      where: {
        tourId_date_time: {
          tourId: input.tourId,
          date: input.date,
          time: input.departureTime,
        },
      },
    });
    if (!departure) {
      throw new InstantModeError("No such departure", "departure_unavailable");
    }
    const exclusive = departure.exclusive || operator.toursArePrivate;
    const taken = departure.bookedSeats + departure.heldSeats;
    const unavailable =
      (exclusive && taken > 0) || departure.capacity - taken < input.groupSize;
    if (unavailable) {
      throw new InstantModeError(
        "Departure does not have enough seats available",
        "departure_unavailable",
      );
    }
    const created = await tx.booking.create({
      data: {
        departureId: departure.id,
        groupSize: input.groupSize,
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        guideLanguage: input.guideLanguage ?? null,
        amountCents,
        currency: operator.currency.toLowerCase(),
        status: "awaiting_payment",
        holdExpiresAt,
      },
    });
    await tx.departure.update({
      where: { id: departure.id },
      data: { heldSeats: { increment: input.groupSize } },
    });
    return created;
  });

  const base = operator.siteUrl.replace(/\/$/, "");
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: operator.currency.toLowerCase(),
          unit_amount: amountCents,
          product_data: { name: `Bike tour ${input.date} ${input.departureTime}` },
        },
      },
    ],
    success_url: `${base}/${input.locale}/book/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/${input.locale}/book/payment/cancelled`,
    expires_at: Math.floor(holdExpiresAt.getTime() / 1000),
    client_reference_id: booking.id,
    metadata: {
      departureId: booking.departureId,
      bookingId: booking.id,
      groupSize: String(input.groupSize),
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: session.id },
  });

  if (!session.url) {
    throw new InstantModeError("Stripe did not return a checkout URL", "stripe_unconfigured");
  }
  return { url: session.url, bookingId: booking.id };
}

/** checkout.session.completed — the ONLY trusted payment confirmation. */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const booking = await prisma.booking.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (!booking || booking.status === "paid") return;
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "paid", paidAt: new Date() },
    }),
    prisma.departure.update({
      where: { id: booking.departureId },
      data: {
        heldSeats: { decrement: booking.groupSize },
        bookedSeats: { increment: booking.groupSize },
      },
    }),
  ]);
}

/** checkout.session.expired — release the seat hold. */
export async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const booking = await prisma.booking.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (!booking || booking.status !== "awaiting_payment") return;
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "expired" },
    }),
    prisma.departure.update({
      where: { id: booking.departureId },
      data: { heldSeats: { decrement: booking.groupSize } },
    }),
  ]);
}
