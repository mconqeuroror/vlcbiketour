import { PrismaClient } from "@prisma/client";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";

const prisma = new PrismaClient();

export async function bookingRequestCount(): Promise<number> {
  return prisma.bookingRequest.count();
}

export async function findBookingByIdempotencyKey(key: string) {
  return prisma.bookingRequest.findUnique({ where: { idempotencyKey: key } });
}

export async function findBookingByEmail(email: string) {
  return prisma.bookingRequest.findFirst({ where: { email } });
}

export const GUIDE_SLUGS = {
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
} as const;

/** All localized public pages with trailing slash. */
export const LOCALIZED_PAGES: Record<"en" | "es" | "fr" | "ar", string>[] = [
  { en: "/en/", es: "/es/", fr: "/fr/", ar: "/ar/" },
  {
    en: "/en/valencia-group-bike-tour/",
    es: "/es/tour-bicicleta-valencia-grupos/",
    fr: "/fr/tour-velo-valence-groupes/",
    ar: "/ar/valencia-group-bike-tour/",
  },
  { en: "/en/about/", es: "/es/sobre-nosotros/", fr: "/fr/a-propos/", ar: "/ar/about/" },
  { en: "/en/faq/", es: "/es/preguntas-frecuentes/", fr: "/fr/questions-frequentes/", ar: "/ar/faq/" },
  { en: "/en/contact/", es: "/es/contacto/", fr: "/fr/contact/", ar: "/ar/contact/" },
  { en: "/en/book/", es: "/es/reservar/", fr: "/fr/reserver/", ar: "/ar/book/" },
  { en: "/en/guides/", es: "/es/guias/", fr: "/fr/guides/", ar: "/ar/guides/" },
  {
    en: `/en/guides/${GUIDE_SLUGS["getting-around-valencia-by-bike"].en}/`,
    es: `/es/guias/${GUIDE_SLUGS["getting-around-valencia-by-bike"].es}/`,
    fr: `/fr/guides/${GUIDE_SLUGS["getting-around-valencia-by-bike"].fr}/`,
    ar: `/ar/guides/${GUIDE_SLUGS["getting-around-valencia-by-bike"].ar}/`,
  },
  {
    en: `/en/guides/${GUIDE_SLUGS["group-bike-tour-planning"].en}/`,
    es: `/es/guias/${GUIDE_SLUGS["group-bike-tour-planning"].es}/`,
    fr: `/fr/guides/${GUIDE_SLUGS["group-bike-tour-planning"].fr}/`,
    ar: `/ar/guides/${GUIDE_SLUGS["group-bike-tour-planning"].ar}/`,
  },
  { en: "/en/privacy/", es: "/es/privacidad/", fr: "/fr/confidentialite/", ar: "/ar/privacy/" },
  { en: "/en/cookies/", es: "/es/cookies/", fr: "/fr/cookies/", ar: "/ar/cookies/" },
  {
    en: "/en/booking-terms/",
    es: "/es/condiciones-de-reserva/",
    fr: "/fr/conditions-de-reservation/",
    ar: "/ar/booking-terms/",
  },
];

/** yyyy-MM-dd `days` days in the future (UTC is fine — well beyond any TZ edge). */
export function futureDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function pastDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

export function validBookingPayload(overrides: Record<string, unknown> = {}) {
  return {
    tourId: "valencia-group-tour",
    locale: "en",
    date: futureDate(3),
    departureTime: "10:00",
    groupSize: 8,
    name: "QA Reviewer",
    email: `qa-${crypto.randomUUID()}@example.com`,
    phone: "",
    guideLanguage: "en",
    message: "",
    idempotencyKey: crypto.randomUUID(),
    website: "",
    renderedAt: Date.now() - 5000,
    ...overrides,
  };
}
