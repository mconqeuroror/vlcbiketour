import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { operator } from "@/config/operator";
import { prisma } from "@/lib/db";
import {
  getStripe,
  handleCheckoutCompleted,
  handleCheckoutExpired,
} from "@/lib/booking/stripe";

/**
 * Stripe webhook — instant booking mode only. The success redirect is never
 * trusted; payment state changes exclusively through this endpoint.
 */
export async function POST(req: Request) {
  if (operator.bookingMode !== "instant") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe] Webhook signature verification failed:", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await prisma.stripeEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Already processed — acknowledge without re-running side effects.
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw err;
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "checkout.session.expired") {
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
    }
  } catch (err) {
    console.error(`[stripe] Failed to process ${event.type} (${event.id}):`, err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json(
    { ok: false },
    { status: 405, headers: { Allow: "POST" } },
  );
}
