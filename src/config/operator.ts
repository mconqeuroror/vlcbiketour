/**
 * Central operator configuration — the single source of truth for business
 * facts. Everything here is rendered into public pages AND structured data,
 * so nothing unverified may be set to a real-looking value. Keep unknowns as
 * null and fill them from docs/OWNER-INPUT-CHECKLIST.md.
 */

export const operator = {
  /** Provisional, centrally configurable brand name. */
  brandName: "Bike Tour VLC",
  domain: "biketourvlc.com",
  siteUrl: process.env.SITE_URL ?? "https://biketourvlc.com",

  /** All reservations now require Stripe payment before submission. */
  bookingMode: "paid_reservation" as const,

  /**
   * Whether departures are exclusive to one group. Explicit operator setting —
   * do NOT assume private tours. false = departures may be shared between groups.
   */
  toursArePrivate: false,

  /** Scheduling timezone for all tour times and date validation. */
  timezone: "Europe/Madrid",
  currency: "EUR",

  /**
   * Languages the guides actually speak — separate from website languages.
   * BCP-47 codes. Availability is restricted per tour in the catalog.
   */
  guideLanguages: ["en", "nl", "it", "es", "fr", "ar"] as const,

  /** Operator identity. OWNER INPUT REQUIRED before production launch. */
  contact: {
    /** null = not yet provided; UI shows the contact form instead of fake data. */
    email: null as string | null,
    phone: null as string | null,
    legalName: null as string | null,
    address: null as string | null,
  },

  /** Social profiles — only listed when real. */
  social: [] as string[],

  /** Group-size limits, enforced client-side AND server-side. */
  groupSize: { min: 1, max: 20 },
} as const;

export type Operator = typeof operator;
