import { defineRouting } from "next-intl/routing";

/**
 * Explicit mapping between equivalent EN/ES pages. Internal (app-directory)
 * paths use the English slug; the `es` entry is the public Spanish slug.
 */
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  // No IP/browser-language redirects: `/` deterministically goes to /en/.
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/valencia-group-bike-tour": {
      en: "/valencia-group-bike-tour",
      es: "/tour-bicicleta-valencia-grupos",
    },
    "/about": { en: "/about", es: "/sobre-nosotros" },
    "/faq": { en: "/faq", es: "/preguntas-frecuentes" },
    "/contact": { en: "/contact", es: "/contacto" },
    "/book": { en: "/book", es: "/reservar" },
    "/guides": { en: "/guides", es: "/guias" },
    "/guides/[guideSlug]": {
      en: "/guides/[guideSlug]",
      es: "/guias/[guideSlug]",
    },
    "/privacy": { en: "/privacy", es: "/privacidad" },
    "/cookies": { en: "/cookies", es: "/cookies" },
    "/booking-terms": { en: "/booking-terms", es: "/condiciones-de-reserva" },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;

/** Localized slug pairs for guide articles (key = internal guide id). */
export const guideSlugs: Record<string, Record<Locale, string>> = {
  "getting-around-valencia-by-bike": {
    en: "getting-around-valencia-by-bike",
    es: "moverse-por-valencia-en-bicicleta",
  },
  "group-bike-tour-planning": {
    en: "how-to-plan-a-group-bike-tour-in-valencia",
    es: "como-organizar-un-tour-en-bici-para-grupos-en-valencia",
  },
};
