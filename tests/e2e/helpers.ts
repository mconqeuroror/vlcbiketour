import { PrismaClient } from "@prisma/client";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./dev.db";

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
  },
  "group-bike-tour-planning": {
    en: "how-to-plan-a-group-bike-tour-in-valencia",
    es: "como-organizar-un-tour-en-bici-para-grupos-en-valencia",
  },
} as const;

/** All localized public pages with trailing slash. */
export const LOCALIZED_PAGES: { en: string; es: string }[] = [
  { en: "/en/", es: "/es/" },
  { en: "/en/valencia-group-bike-tour/", es: "/es/tour-bicicleta-valencia-grupos/" },
  { en: "/en/about/", es: "/es/sobre-nosotros/" },
  { en: "/en/faq/", es: "/es/preguntas-frecuentes/" },
  { en: "/en/contact/", es: "/es/contacto/" },
  { en: "/en/book/", es: "/es/reservar/" },
  { en: "/en/guides/", es: "/es/guias/" },
  {
    en: `/en/guides/${GUIDE_SLUGS["getting-around-valencia-by-bike"].en}/`,
    es: `/es/guias/${GUIDE_SLUGS["getting-around-valencia-by-bike"].es}/`,
  },
  {
    en: `/en/guides/${GUIDE_SLUGS["group-bike-tour-planning"].en}/`,
    es: `/es/guias/${GUIDE_SLUGS["group-bike-tour-planning"].es}/`,
  },
  { en: "/en/privacy/", es: "/es/privacidad/" },
  { en: "/en/cookies/", es: "/es/cookies/" },
  { en: "/en/booking-terms/", es: "/es/condiciones-de-reserva/" },
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
