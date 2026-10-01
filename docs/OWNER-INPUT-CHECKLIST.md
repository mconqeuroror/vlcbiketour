# Production readiness — BikeTourVLC

Updated 1 October 2026. See [Stripe + Resend setup](PRODUCTION-SETUP.md) for exact steps.

## Implemented and approved

- Shared Dutch tour: 10:00–13:00, €30 per person. Shared English tour: 10:30–13:30, €25 per person.
- Private city and Islamic architecture tours: €225 total for 1–10 guests; larger private groups need a quote.
- Private start choices: 10:00–16:00 every 30 minutes, at least 24 hours ahead.
- Islamic architecture languages: English and Arabic. Private city: English, Dutch, Italian, Spanish, French and Arabic.
- Start/end: Casa Fenicia, Calle Corretgeria 4, 46001 Valencia; arrive 15 minutes early.
- Approved branding, individual image scenes, four translated locales, selectable tour cards and city route map.
- Calendar booking flow, server-calculated Stripe payments, verified payment webhooks, Resend customer/operator notifications.

## Required before accepting real bookings

- [ ] Production PostgreSQL, backups and all Prisma migrations applied.
- [ ] Stripe account activated; matching live account/key and endpoint signing secret installed.
- [ ] Resend sender domain verified, API key installed, sender set, real monitored operator inbox set.
- [ ] Complete a sandbox checkout through the real Stripe webhook and real Resend delivery; test failure, retry and refund.
- [ ] Legal operator name, registered address, public email and phone supplied in `src/config/operator.ts`.
- [ ] Final cancellation, bad-weather, refund and minimum-participant policies, including what happens if a paid departure cannot run. Review all four translations of the legal pages.
- [ ] Actual operating dates, guide/bike availability and a process to confirm paid requests. The calendar currently shows schedule choices; it is not an inventory or guide-calendar feed. Shared tours require 3 participants in aggregate. Current maximum is 20 per shared booking; capacity is not enforced per departure.
- [ ] Assign someone to monitor incoming reservations, confirm departures and handle refunds. No admin booking console or automatic guide assignment is included.
- [ ] Monitor Stripe failed webhooks and Resend failures/bounces; establish manual recovery after automatic retries end.
- [ ] Replace the per-process rate limiter with shared protection for Vercel/serverless traffic before a public booking launch.

## Optional launch follow-ups

- Owned social profiles; Search Console and Business Profile setup.
- Analytics remains disabled unless deliberately configured with appropriate consent.
- Additional authentic operator photography can replace generated scenes later; preserve photo credits and provenance already supplied.
