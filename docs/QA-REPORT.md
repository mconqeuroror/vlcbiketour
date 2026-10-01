# QA Report — biketourvlc.com

Date: 2026-10-01. Environment: local production build (`npm run build && next start`), Node 22, Chromium headless (Playwright 1.63), Lighthouse 12 (mobile emulation, local lab). All numbers below were actually measured; lab scores are indicative, not field data.

## Build & static checks

| Check | Result |
|---|---|
| `npm run build` (33 static routes, EN+ES) | PASS |
| `npm run typecheck` (tsc --noEmit) | PASS |
| `npm run lint` (eslint flat, next/core-web-vitals + typescript) | PASS (0 errors, 0 warnings) |
| `npx vitest run` | PASS — 22/22 unit tests (booking schema: group sizes 4/21/5.5/"10"/missing rejected, 5/20 accepted; past-date and advance-window rules in Europe/Madrid; honeypot; email) |
| `npx playwright test` | PASS — 66/66 e2e tests |

## E2E coverage (tests/e2e/)

- All 13 page pairs (26 localized URLs incl. both guide articles) return 200 with correct `<html lang>`.
- `/` deterministically redirects to `/en/`, including with Spanish `Accept-Language`.
- Canonical self-references per locale; reciprocal hreflang es + en + x-default; sitemap.xml contains only canonical trailing-slash URLs; robots.txt allows `/`, disallows `/api/`, references sitemap.
- Locale switcher preserves page context (tour page and guide article verified both directions).
- Booking UI validation EN+ES: group size 4/21 rejected with localized visible errors; 5/20 accepted to review step; past date rejected.
- Booking API direct: valid 5/20 → 200 + persisted; 4/21/5.5/"12"/missing → 400; past date → 400; unlisted departure time → 400; duplicate idempotencyKey → 409; GET → 405; honeypot filled → 200 without persistence (verified via DB row count).
- Full UI flow EN: fill → review (explicit non-commitment wording) → submit → localized success → row verified in SQLite.
- JSON-LD: Organization + WebSite on home; TouristTrip + BreadcrumbList on tour page; TouristTrip has 5 itinerary items; no `offers`/`aggregateRating`/`review`; provider `@id` links to Organization; name matches visible h1.
- axe-core on /en/, /es/, tour page, /en/book/, /es/reservar/: no serious/critical violations.
- Keyboard-only walkthrough of /en/book/ to review step; focus visible; reduced-motion: no running animations/transitions.
- No-JS: headline, tour facts, nav links and booking CTA present in initial HTML (EN+ES tour page).
- Broken links/images crawl from home + tour seeds (both locales): all internal links 200, all images load.
- Sticky mobile CTA: visible on home, hides near footer, absent on /en/book/ and /es/reservar/.

## Visual acceptance

Screenshots in `qa-screenshots/` (`accept-*` at 1440/1280/768/390/375 for home, tour, booking in EN+ES; `design-*` during section development). Manually inspected against `reference/desktop-en.png`, `desktop-es.png`, `mobile.png`: logo lockup, white header, centered desktop hero / left-aligned mobile hero, orange pill with ink text + white pill pair, four-item proof strip, old-town split, quiet three-card row, sage editorial pair, coastal band, group band with forest CTA. Zero horizontal overflow measured at all widths down to 320px. No clipped Spanish strings.

## Lighthouse (lab, mobile emulation, local server)

| Page | Perf | A11y | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| /en/ | 88–99* | 100 | 100 | 92 | 2.1–3.6s* | ≤180ms | 0 |
| /es/ | 97 | 100 | 100 | 92 | 2.6s | 60ms | 0 |
| /en/valencia-group-bike-tour/ | 89–98 | 100 | 100 | 92 | 2.1–3.4s* | ≤170ms | 0 |
| /en/book/ | 96 | 100 | 100 | 92 | 1.7s | 220ms | 0 |

\* LCP/perf vary with first-hit on-demand image optimization on the local server; warm-cache runs score 97–99. Field performance on real hosting must still be measured — CWV targets (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1) are deployment targets, not proven here.

Known lab-only flags: `canonical` audit fails locally because SITE_URL is localhost:3000 while testing on :3100 — canonical/hreflang tags are present and mutually consistent (verified in HTML); resolves in production with SITE_URL=https://biketourvlc.com. `image-aspect-ratio` flags `object-cover` hero crops (false positive for cover imagery). `image-size-responsive` flags the temporary low-resolution design-kit crops (see below).

## Known issues / launch blockers (honest list)

1. **Temporary low-resolution photography** in three homepage slots (old-town-cyclists, greenway-cyclists, beach-day — 165–252px concept crops from the approved brand board, per kit instructions). Must be replaced with ≥1200px licensed operator photography before launch. See `public/images/SOURCES.md` and `OWNER-INPUTS.md`.
2. **Hero photo** is a verified CC BY-SA 4.0 Wikimedia image (Turia Gardens cyclists) pending operator approval/replacement; attribution in footer.
3. **Request-mode booking only.** Instant/Stripe mode is implemented but gated and untested end-to-end (no keys, no departure inventory, success/cancel pages not built). Do not enable without the checklist in README + OWNER-INPUTS.md.
4. **Rate limiting** is per-process in-memory — replace with a shared store for multi-instance deployments.
5. **Operator notification** requires OPERATOR_NOTIFICATION_WEBHOOK_URL (or SMTP) configured; without it requests persist but nobody is notified (a warning is logged).
6. Legal pages are labeled working drafts pending operator legal details. Analytics/consent intentionally disabled until configured.
7. Lighthouse `link-text` heuristic: card links read "Learn more" visually (per approved design) with descriptive `aria-label` including the tour name; the automated audit inspects visible text only.
8. Contact form submissions are delivered via the operator notification channel only (not stored in DB).

## What was NOT tested

- Real email/webhook delivery (no credentials in this environment).
- Stripe webhook processing (gated off; unit-level logic only).
- Real-device field performance and screen readers (axe + keyboard walkthrough done instead).
