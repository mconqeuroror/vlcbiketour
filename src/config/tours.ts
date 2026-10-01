export type GuideLanguage = "en" | "nl" | "it" | "fr" | "es" | "ar";
export type TourKey = "shared" | "city" | "architecture";
export type PriceModel =
  | { kind: "per_language"; amounts: Partial<Record<GuideLanguage, number>> }
  | { kind: "per_group"; amountCents: number; quotedAbove: number };
export interface Tour {
  id: string;
  key: TourKey;
  private: boolean;
  pagePath: "/valencia-group-bike-tour";
  status: "published";
  groupSize: { min: number; max: number };
  durationMinutes: number;
  stopCount: number;
  inclusions: string[];
  price: PriceModel;
  guideLanguages: GuideLanguage[];
  departures: { time: string; language: GuideLanguage; returnTime: string }[];
  minAdvanceHours: number;
  minimumDepartureParticipants: number | null;
}
export const meetingPoint = {
  name: "Casa Fenicia", address: "Calle Corretgeria 4, 46001 Valencia", arrivalMinutes: 15,
};
const common = {
  pagePath: "/valencia-group-bike-tour" as const, status: "published" as const,
  groupSize: { min: 1, max: 20 }, durationMinutes: 180,
  inclusions: ["bike", "helmet", "guide"],
};
export const tours: Tour[] = [
  { ...common, id: "valencia-group-tour", key: "shared", private: false, stopCount: 14,
    price: { kind: "per_language", amounts: { en: 2500, nl: 3000 } }, guideLanguages: ["nl", "en"],
    departures: [{ time: "10:00", language: "nl", returnTime: "13:00" },
      { time: "10:30", language: "en", returnTime: "13:30" }],
    minAdvanceHours: 0, minimumDepartureParticipants: 3,
  },
  { ...common, id: "private-city", key: "city", private: true, stopCount: 14,
    price: { kind: "per_group", amountCents: 22500, quotedAbove: 10 },
    guideLanguages: ["en", "nl", "it", "fr", "es", "ar"], departures: [],
    minAdvanceHours: 24, minimumDepartureParticipants: null,
  },
  { ...common, id: "private-architecture", key: "architecture", private: true, stopCount: 0,
    price: { kind: "per_group", amountCents: 22500, quotedAbove: 10 },
    guideLanguages: ["en", "ar"], departures: [],
    minAdvanceHours: 24, minimumDepartureParticipants: null,
  },
];
export const defaultTour = tours[0];
export function getTour(id: string) { return tours.find((tour) => tour.id === id); }
export function tourPrice(tour: Tour, people: number, language: string = "en") {
  if (!Number.isInteger(people) || people < tour.groupSize.min || people > tour.groupSize.max) return null;
  if (tour.price.kind === "per_group") {
    if (people > tour.price.quotedAbove) return null;
    return { totalCents: tour.price.amountCents, perPersonCents: tour.price.amountCents / people };
  }
  const amount = tour.price.amounts[language as GuideLanguage];
  if (!amount) return null;
  return { totalCents: amount * people, perPersonCents: amount };
}
export function formatEuro(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
}

export const privateStartTimes = Array.from({ length: 13 }, (_, i) => `${String(10 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
export function startTimes(tour: Tour, language: string): string[] {
  return tour.private ? privateStartTimes : tour.departures.filter((d) => d.language === language).map((d) => d.time);
}
export function endTime(start: string): string {
  const [hours, minutes] = start.split(":").map(Number);
  return `${String(hours + 3).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
