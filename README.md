# Bike Tour VLC — biketourvlc.com

Bilingual (English/Spanish) website selling guided bike tours in Valencia, Spain, for groups of 5–20 people. Next.js 16 (App Router, static rendering) · TypeScript · next-intl 4 · Tailwind CSS 4 · Prisma 6 + Postgres (Neon on Vercel) · Zod · Stripe (gated, test-mode only).

## Quick start

```bash
npm install
cp .env.example .env        # set DATABASE_URL (Postgres) and SITE_URL=http://localhost:3000
npx prisma migrate deploy   # applies prisma/migrations to your Postgres
npm run dev                 # http://localhost:3000 → redirects to /en/
```

Local dev needs a Postgres `DATABASE_URL` — the production database URL via
`vercel env pull`, or any local Postgres. (Vercel's serverless filesystem makes
SQLite unsuitable, so the project is Postgres-only.)

Production build: `npm run build && npm start`.

Quality gates: `npm run lint` · `npm run typecheck` · `npm run test` (unit) · `npm run test:e2e` (Playwright, builds and starts the app itself).

## Architecture

- `src/config/operator.ts` — single source of truth for brand, booking mode, timezone (Europe/Madrid), currency (EUR), group-size limits (5–20, enforced client + server), guide languages, operator contact (null = not yet provided).
- `src/config/tours.ts` — typed tour catalog (facts only; copy lives in `messages/`). Pricing is `tbd` until the operator confirms — the UI and structured data honestly show "confirmed on request".
- `messages/en.json` / `messages/es.json` — complete catalogs; every user-visible string. Keep key parity.
- `src/i18n/routing.ts` — explicit EN↔ES slug mapping; `/` deterministically redirects to `/en/` (no IP/browser sniffing).
- `src/lib/seo/metadata.ts` — canonical + reciprocal hreflang (es, en, x-default→en) per page; used by every page's `generateMetadata`.
- `src/components/seo/JsonLd.tsx` — Organization / WebSite / BreadcrumbList / TouristTrip from the same config + messages. No `Offer`/`aggregateRating` while pricing is unconfirmed.
- `src/lib/booking/` — shared Zod contract (`schema.ts`), server orchestration (`server.ts`), operator notification (`notify.ts`), gated Stripe instant mode (`stripe.ts`).
- `src/app/api/bookings` `POST` only (GET → 405); idempotency key (unique DB constraint) prevents duplicates; honeypot + time-trap spam controls; per-IP in-memory rate limit (5/10 min — replace with Redis/Upstash for multi-instance deploys).

## Booking modes

**Request mode (default, `BOOKING_MODE=request`)**: the form stores a booking request and notifies the operator via `OPERATOR_NOTIFICATION_WEBHOOK_URL` (and/or SMTP). Submitting never claims a reservation.

**Instant mode (`BOOKING_MODE=instant`)**: gated Stripe Checkout. Requires all of: real pricing in `src/config/tours.ts`, `Departure` rows for sellable slots, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, production `SITE_URL`, and a webhook registered for `checkout.session.completed` / `checkout.session.expired`. Prices are calculated server-side; payment is confirmed only via the verified, idempotent webhook — never via the browser redirect. Develop with Stripe test keys; do not switch to live keys without operator approval. Success/cancel redirect pages (`/[locale]/book/payment/*`) are not yet implemented — that UI branch is the remaining instant-mode work.

## Deployment

Deployed via the Vercel CLI (`vercel --prod`). Env vars: `SITE_URL`, `BOOKING_MODE`, `DATABASE_URL` (pooled Neon connection string), plus notification/Stripe values when enabled. Apply migrations against production with `DATABASE_URL=... npx prisma migrate deploy` (run from a checkout; direct connection, not pooled, is preferred for migrations). After deploy: submit `sitemap.xml` in Search Console (see `docs/SEARCH-CONSOLE-SETUP.md`).

## Documentation

- `docs/OWNER-INPUT-CHECKLIST.md` — missing business facts/credentials that block full launch (pricing, schedule, meeting point, policies, legal identity, Stripe keys…).
- `docs/KEYWORD-MAP.md` — keyword-to-page intent map (EN/ES).
- `docs/SEARCH-CONSOLE-SETUP.md` — verification + sitemap + local-profile steps.
- `docs/QA-REPORT.md` — measured test results and known defects.
- `public/images/SOURCES.md` — photo provenance and CC attribution requirements (attribution is rendered in the site footer).

## Legal status

Privacy, cookies and booking-terms pages are honest working drafts that describe the actual integrations; each carries a visible "status of this document" section. They must be reviewed with the operator's real legal details before launch (see checklist).
