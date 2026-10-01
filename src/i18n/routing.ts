import { defineRouting } from "next-intl/routing";

/**
 * Explicit mapping between equivalent localized pages. Internal
 * (app-directory) paths use the English slug; each locale entry is the public
 * slug. French gets proper French slugs; Arabic uses the English slugs
 * (documented choice — avoids percent-encoded URLs in sharing/SEO tooling).
 */
export const routing = defineRouting({
  locales: ["en", "es", "fr", "ar"],
  defaultLocale: "en",
  // No IP/browser-language redirects: `/` deterministically goes to /en/.
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/valencia-group-bike-tour": {
      en: "/valencia-group-bike-tour",
      es: "/tour-bicicleta-valencia-grupos",
      fr: "/tour-velo-valence-groupes",
      ar: "/valencia-group-bike-tour",
    },
    "/about": {
      en: "/about",
      es: "/sobre-nosotros",
      fr: "/a-propos",
      ar: "/about",
    },
    "/faq": {
      en: "/faq",
      es: "/preguntas-frecuentes",
      fr: "/questions-frequentes",
      ar: "/faq",
    },
    "/contact": {
      en: "/contact",
      es: "/contacto",
      fr: "/contact",
      ar: "/contact",
    },
    "/book": {
      en: "/book",
      es: "/reservar",
      fr: "/reserver",
      ar: "/book",
    },
    "/guides": {
      en: "/guides",
      es: "/guias",
      fr: "/guides",
      ar: "/guides",
    },
    "/guides/[guideSlug]": {
      en: "/guides/[guideSlug]",
      es: "/guias/[guideSlug]",
      fr: "/guides/[guideSlug]",
      ar: "/guides/[guideSlug]",
    },
    "/privacy": {
      en: "/privacy",
      es: "/privacidad",
      fr: "/confidentialite",
      ar: "/privacy",
    },
    "/cookies": "/cookies",
    "/booking-terms": {
      en: "/booking-terms",
      es: "/condiciones-de-reserva",
      fr: "/conditions-de-reservation",
      ar: "/booking-terms",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;

/** Localized slug pairs for guide articles (key = internal guide id). */
export const guideSlugs: Record<string, Record<Locale, string>> = {
  "getting-around-valencia-by-bike": {
    en: "getting-around-valencia-by-bike",
    es: "moverse-por-valencia-en-bicicleta",
    fr: "se-deplacer-a-valence-a-velo",
    ar: "getting-around-valencia-by-bike",
  },
  "group-bike-tour-planning": {
    en: "how-to-plan-a-group-bike-tour-in-valencia",
    es: "como-organizar-un-tour-en-bici-para-grupos-en-valencia",
    fr: "comment-organiser-un-tour-a-velo-pour-groupes-a-valence",
    ar: "how-to-plan-a-group-bike-tour-in-valencia",
  },
};
