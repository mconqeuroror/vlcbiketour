---
date: 2026-10-01
confidence: verified
tags: [session]
---

# Correct the production setup origin after live deployment

## User request

Push BikeTourVLC and supply exact Stripe/Resend production setup requirements.

## What changed

Corrected the setup guide and environment example from commit `ef48954fef86cba1b6e67545cb7ab1bd8c060c88` to use `https://www.biketourvlc.com`, including `/api/stripe/webhook`. Corrected the previous session note to call the map asset local map data (GeoJSON).

## Why

The first pushed deployment reached Ready and its bare domain returned HTTP 308 to `www`. Stripe must receive a direct webhook URL rather than a redirect. This is a configuration-documentation correction, not a change to payment processing.

## Gotchas

Verified the actual production redirect after deployment. Do not assume the canonical hostname from local defaults. No service secrets were exposed or changed.

## Follow-ups

Use the corrected guide to configure production PostgreSQL, Stripe and Resend, then validate sandbox payment and actual email delivery before accepting bookings.

## Live verification follow-up

The live production gate test confirmed the unavailable message and zero booking submissions. Its final URL assertion still hardcoded localhost in `ef48954fef86cba1b6e67545cb7ab1bd8c060c88`; corrected that assertion to use the configured target origin. The same test then passed against `https://www.biketourvlc.com`. EN home/booking, ES booking, AR booking and the local GeoJSON map returned HTTP 200; the production canonical URL already uses `www`.
