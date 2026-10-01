import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, processStripeEvent } from "@/lib/booking/stripe";
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ ok: false }, { status: 400 });
  let event: Stripe.Event;
  try { event = getStripe().webhooks.constructEvent(await req.text(), signature, secret); }
  catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  try { await processStripeEvent(event); }
  catch { console.error("[stripe] Event processing failed", event.id, event.type); return NextResponse.json({ ok: false }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
