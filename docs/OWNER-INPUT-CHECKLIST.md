# Owner input checklist — blocks full launch

Every item below is currently null, "tbd", provisional, or unverified. Fill them in `src/config/operator.ts` / `src/config/tours.ts` (single source of truth) unless noted. The site renders honest fallback copy until then — do not ship placeholder facts as if real.

## Commercial facts

- [ ] **Prices + price model** — per person or per group, amounts in EUR. `defaultTour.price` is `{ kind: "tbd" }`. Until set: no prices shown, no JSON-LD `offers` (deliberately omitted).
- [ ] **Availability / departure schedule** — real days and times. Current `departureTimes: ["10:00", "16:00"]` are indicative only; confirm or replace.
- [ ] **Tour duration + distance** — `durationMinutes: 180`, `distanceKm: 12` are approximate; confirm measured values.
- [ ] **Cancellation / weather / refund policies** — `defaultTour.policies.*` are `null`; the booking-terms page currently says "confirmed with your booking". Provide final policy text (EN + ES).

## Operational facts

- [ ] **Meeting point address + coordinates** — `meetingPoint.lat/lng` are `null`. Until set, JSON-LD `location` is only "Valencia, ES" and pages say the exact point is shared on confirmation.
- [ ] **Guide languages** — assumed `["en", "es"]`; confirm this is what guides actually speak.
- [ ] **Group-size limits** — 5–20 configured; confirm these are the real operational limits.

## Operator identity (required before launch)

- [ ] **Legal name** (`operator.contact.legalName`, currently `null`).
- [ ] **Registered address** (`operator.contact.address`, `null`).
- [ ] **Public contact email** (`operator.contact.email`, `null`) — contact page currently only offers the form.
- [ ] **Public phone** (`operator.contact.phone`, `null`).
- [ ] **Brand name confirmation** — "Bike Tour VLC" is provisional (`footer.provisional` in messages says so publicly). Confirm or rebrand before printing anything.
- [ ] **Social profiles** — `operator.social` is empty; add only real, owned profile URLs.

## Media

- [ ] **Real owned photography** — replace any placeholder/stock imagery with photos the operator owns or has licensed (hero, Turia, City of Arts and Sciences, old town, La Lonja, Central Market, about). Alt texts in `messages/*.json → images.*` assume those subjects; keep alt text and actual photo content in sync.

## Payments (only if switching to instant booking)

- [ ] **Stripe test keys** (`STRIPE_SECRET_KEY`, publishable key).
- [ ] **Stripe live keys** — only after test-mode end-to-end passes.
- [ ] **Stripe webhook secret** (`STRIPE_WEBHOOK_SECRET`) for payment confirmations.
- [ ] Set `BOOKING_MODE=instant` only after all of the above plus real prices exist. Default `request` mode needs none of this.

## Notifications

- [ ] **Operator notification channel for booking requests** — webhook URL and/or notification email for new requests (see `src/lib/booking/`). Without it, requests are stored but nobody is alerted.

## Analytics & consent

- [ ] **Analytics decision** — none, or a privacy-respecting tool. If enabled: non-essential measurement behind consent (cookie policy already promises this in `legal.cookies.sections.analytics`), and personal form data must never be sent to analytics.

## Legal review

- [ ] **Privacy policy draft** (`legal.privacy` in messages) — reviewed against real data flows and the operator's legal identity.
- [ ] **Cookie policy draft** (`legal.cookies`) — must match whatever analytics/consent is actually deployed.
- [ ] **Booking terms draft** (`legal.bookingTerms`) — must match the final cancellation/weather/refund policies above. Both the terms page and the FAQ answers reference these.

## Launch-adjacent

- [ ] **Google Search Console verification** — follow `docs/SEARCH-CONSOLE-SETUP.md` after DNS access is available.
- [ ] **Google Business Profile** — only after operator identity items above are real; see the eligibility notes in `docs/SEARCH-CONSOLE-SETUP.md`.
