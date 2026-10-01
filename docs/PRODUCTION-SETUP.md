# Stripe, Resend and production setup

Checked 1 October 2026 against the linked Vercel project `modelclone/vlcbiketour` (`prj_4j3QanvWLZwYalb6bwDyGFzDdSSR`) and GitHub `mconqeuroror/vlcbiketour`, branch `main`.

## Current state

The website and payment/email integration are implemented. Vercel Production currently lists only `SITE_URL` and the now-unused `BOOKING_MODE`. No production database, Stripe or Resend variables are present. Checkout stays disabled until database, payment and email settings exist. This checks configuration presence; successful real service tests are still necessary.

Production aliases already include `https://biketourvlc.com`, `https://www.biketourvlc.com` and `https://vlcbiketour.vercel.app`. The live domain redirects the bare domain to `www`. Use `SITE_URL=https://www.biketourvlc.com` for new production configuration and use the direct `www` webhook URL below; Stripe webhooks must not rely on an HTTP redirect.

## 1. Stripe

1. Use the business's Stripe account. Complete account activation, business verification and bank/payout details before live charging. Configure a recognizable statement descriptor and customer support details.
2. Start in a Stripe sandbox/test environment. In Vercel **Preview** settings (or local `.env.local`), add the test secret key as `STRIPE_SECRET_KEY`. Never put secret keys in `NEXT_PUBLIC_*`, source control or chat. Keep test and live keys, accounts and webhook secrets matched.
3. Under Stripe Workbench → Webhooks, create an event destination for **your account**, pointing to `https://www.biketourvlc.com/api/stripe/webhook` for live production. Use a separate publicly reachable staging URL and test destination during testing. Subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Copy that exact endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. A local `stripe listen` secret and a live endpoint secret are different. Use an API event version compatible with the installed Stripe SDK; the installed `stripe@22.6.2` defaults to `2026-08-26.dahlia`, which can be inspected with `node -e 'console.log(require("stripe").API_VERSION)'`.
5. After sandbox end-to-end validation, add the matching live `sk_live_…` key and live endpoint `whsec_…` secret to Vercel **Production**, then redeploy. Verify a controlled live payment/refund with the owner before advertising booking availability.

**No Product IDs, Price IDs, Payment Links or publishable key are required.** The server creates Stripe-hosted Checkout sessions with inline prices: English shared €25 × guests, Dutch shared €30 × guests, private city or Islamic architecture €225 total (1–10 guests). Checkout currently accepts cards; no subscriptions or automatic-tax integration is enabled. The business must confirm tax treatment/invoicing before launch. Stripe receipts may be enabled separately; the Resend email is a reservation payment acknowledgement, not a tax invoice.

The webhook, not the browser redirect, records payment. A paid request remains `paid_pending_confirmation` until the operator checks availability. The customer email makes this explicit. Full Stripe refunds update the database; partial refunds do not change reservation status. Refund emails and departure-confirmation emails are currently handled by the operator/Stripe, not an automated booking admin.

Official references: [Checkout fulfilment](https://docs.stripe.com/checkout/fulfillment), [webhook setup](https://docs.stripe.com/webhooks), [account activation](https://docs.stripe.com/get-started/account/activate).

## 2. Resend

1. Add a domain you own in Resend. Install exactly the SPF/DKIM DNS records Resend supplies and wait for Verified status. A dedicated sending subdomain is fine. Do not overwrite existing mail records blindly.
2. Create a sending API key scoped to the verified domain where available.
3. Set the three server-only Vercel variables:
   - `RESEND_API_KEY`: the sending key.
   - `RESEND_FROM_EMAIL`: for example `BikeTourVLC <bookings@biketourvlc.com>` **only if that sender domain is verified**.
   - `OPERATOR_NOTIFY_EMAIL`: your actual monitored inbox. It receives reservations/contact messages and customer replies. Resend outbound sending alone does not create this inbox.
4. Redeploy. Validate delivery to both the operator inbox and an owner-controlled customer inbox via a sandbox paid booking. Also test the contact form.

Emails are plain text, include the reservation reference, date/time in Europe/Madrid, guide language, guest count and paid amount. Customer acknowledgements follow the website locale (EN/ES/FR/AR). Guest replies go to the operator inbox; the operator can reply directly to a contact enquiry or paid guest.

Each paid recipient has its own database timestamp and stable Resend idempotency key. Provider failures leave the corresponding recipient retryable via Stripe webhook redelivery. Resend acceptance is not proof of inbox delivery: monitor bounces/failures in Resend. Resend's idempotency window is 24 hours; in the rare case of a lost response plus failed persistence beyond that window, check provider history before manual replay. There is no Resend delivery-webhook dashboard in this version.

Official references: [domain verification](https://resend.com/docs/dashboard/domains/introduction), [sending API](https://resend.com/docs/api-reference/emails/send-email), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

## 3. Database and Vercel configuration

Create a production PostgreSQL database in the appropriate region, enable backups, and add its SSL connection string as `DATABASE_URL`. Run `npm run db:deploy` against that production database from a trusted release environment **before enabling checkout**. Do not run `prisma migrate dev` or reset against production.

Required migrations: `0_init`, `20261002000000_paid_reservations`, `20261002010000_customer_receipts`. A build generates Prisma Client but intentionally does not automatically mutate a production database.

| Vercel Production variable | Value |
|---|---|
| `SITE_URL` | `https://www.biketourvlc.com` |
| `DATABASE_URL` | Production PostgreSQL SSL connection string |
| `STRIPE_SECRET_KEY` | Secret live key from the intended account |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from the live destination above |
| `RESEND_API_KEY` | Resend sending key |
| `RESEND_FROM_EMAIL` | Approved sender on a verified domain |
| `OPERATOR_NOTIFY_EMAIL` | Real monitored inbox |

Remove obsolete `BOOKING_MODE` when convenient; it has no effect. `OPERATOR_NOTIFICATION_WEBHOOK_URL` is also obsolete. Keep analytics empty unless intentionally enabled. Use separate test service credentials/database in Preview. Environment changes require a redeploy.

## 4. Remaining launch work

See [the current owner checklist](OWNER-INPUT-CHECKLIST.md): operator identity/contact details, final cancellation/weather/refund policies, real operating days and capacity/guide availability, manual confirmation/refund ownership, webhook/email monitoring and shared rate limiting. These are required to operate a reliable booking service; deploying the website does not resolve them.

## Verification completed here

68 unit tests and 15 integration tests pass with mocked external services and isolated PostgreSQL. The integration tests cover signed webhooks, no submission before payment, amounts, retries, duplicate events, full refunds and independent operator/customer notification retries. No real charges or emails were sent. Earlier desktop/mobile, multilingual, keyboard and route-map checks remain documented in the delivered image/map/calendar packages. Production build and deployment checks are recorded in the accompanying session note.
