---
date: 2026-10-01
confidence: partial
tags: [session]
---

# BikeTourVLC creative production, calendar reservations and Resend

## User request

Finish approved image positions without redesigning; implement co-owner tour content, selectable tour cards and route map; add the private Islamic architecture offer; replace the booking form with a calendar; require Stripe payment (€25 English / €30 Dutch per shared participant, private tours €225); push the work, use Resend and explain production setup.

## What changed

- `public/images`, home components and photo credits: separate scene WebPs and active mobile hero, preserving the installed Arts & Sciences scene. Original masters and verified image package delivered separately.
- `src/components/tours`, `src/config/city-route.ts`, `public/maps`: selectable tours and city route with licensed stop photos and attributed local map data. No invented Islamic route.
- `src/config/tours.ts`, `messages/*.json`: approved tour facts across EN/ES/FR/AR, including private Islamic architecture English/Arabic offer and Casa Fenicia meeting point.
- `src/components/booking`: date/time/guest calendar, fixed Dutch 10:00 and English 10:30 shared departures, private half-hour slots 10:00–16:00, cancellation recovery and verified payment status.
- `src/lib/booking`, API routes and Prisma migrations: server-side prices, Stripe Checkout/signature checks, retry-safe persisted payment/refund handling; Resend operator/customer emails with independent persistence, idempotency and retryable failures. Contact failures no longer report success.
- `.env.example`, production setup and owner checklist: exact configuration and known launch gaps. Payment UI requires database, Stripe and Resend configuration.

## Why

Keep the approved brand and booking flow while collecting the correct reservation payment before submitting requests. A paid reservation still requires operator confirmation of availability. Separate provider setup from the deployment so missing services cannot silently accept unpaid requests or falsely claim emails were sent.

## Validation

- 68 unit tests and 15 isolated PostgreSQL integration tests pass; external Stripe/Resend calls mocked. Signed webhook, forged amount/signature, duplicate and out-of-order events, full refunds, email retry and partial email success covered.
- ESLint and production build pass. Prior calendar desktop/mobile/RTL/keyboard checks and image/map QA are in delivered packages; final calendar regression rerun: 10 passed across EN/ES/FR/AR desktop/mobile, with the missing-configuration case reserved for the unconfigured production deployment.
- No real payments or emails sent. Production service credentials/database not configured as of this commit; payment readiness cannot be claimed.

## Gotchas / mistakes avoided

- Verified origin `mconqeuroror/vlcbiketour`, branch main, remote HEAD and Vercel project `prj_4j3QanvWLZwYalb6bwDyGFzDdSSR` under `modelclone` before push (M-001/M-003).
- Built before committing (M-006); setup instructions explicitly separate matching Stripe sandbox/live credentials (M-007).
- No environment secrets, local databases, generated scratch files or production masters staged. Only optimized website media ships in source control.
- No guessed operator identity, refund policy, guide availability or guaranteed instant booking.

## Follow-ups

- Provision PostgreSQL and apply all three migrations; configure Stripe and Resend and perform real sandbox end-to-end delivery tests.
- Complete operator identity, legal/refund/weather terms and operational availability/confirmation workflow.
- Add shared serverless rate limiting and monitoring of failed webhooks/email delivery before accepting public bookings.
- See `docs/PRODUCTION-SETUP.md` for exact steps. Verify the pushed Vercel deployment is Ready and domain pages return successfully.
