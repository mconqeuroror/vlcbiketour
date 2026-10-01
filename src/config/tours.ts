import { operator } from "./operator";

/**
 * Central tour catalog — single source of truth for tour facts. Descriptions
 * and long copy live in messages/*.json under the `tours.<id>` key; only
 * structured, machine-readable facts live here so visible content and
 * JSON-LD can be generated from the same source.
 *
 * NOTHING here may be fabricated. Fields marked OWNER INPUT must be
 * confirmed by the operator before launch; null/“tbd” values render as
 * honest “confirmed on request” copy, never as invented specifics.
 */

export type PriceModel =
  | { kind: "tbd" } // pricing not yet confirmed — show “pricing on request”
  | { kind: "per_person"; amountCents: number }
  | { kind: "per_group"; amountCents: number };

export type Difficulty = "easy" | "moderate" | "challenging";

export interface Tour {
  id: string;
  /** Internal pathname key from src/i18n/routing.ts */
  pagePath: "/valencia-group-bike-tour";
  status: "published" | "draft";
  groupSize: { min: number; max: number };
  /** Approximate duration in minutes. */
  durationMinutes: number;
  /** Approximate route distance in kilometres. */
  distanceKm: number;
  difficulty: Difficulty;
  /**
   * Route areas / highlights (factually verified Valencia locations only).
   * Keys into messages: tours.<id>.stops.<n>
   */
  stopCount: number;
  meetingPoint: {
    /** Display-name key: tours.<id>.meetingPointName */
    lat: number | null;
    lng: number | null;
  };
  /** Equipment/services included in the tour price. Keys into messages. */
  inclusions: string[];
  price: PriceModel;
  /** Departure start times offered (local, Europe/Madrid). */
  departureTimes: string[];
  /** Minimum notice before a booking request date, in days. */
  minAdvanceBookingDays: number;
  /**
   * Policy copy keys (cancellation, weather, refund). Copy lives in messages
   * under policies.*; set to null until the operator approves real terms —
   * the UI then omits the policy rather than inventing one.
   */
  policies: {
    cancellation: string | null;
    weather: string | null;
    refund: string | null;
  };
}

export const tours: Tour[] = [
  {
    id: "valencia-group-tour",
    pagePath: "/valencia-group-bike-tour",
    status: "published",
    groupSize: { min: operator.groupSize.min, max: operator.groupSize.max },
    durationMinutes: 180, // OWNER INPUT: confirm exact duration
    distanceKm: 12, // OWNER INPUT: confirm measured route distance
    difficulty: "easy",
    stopCount: 5,
    meetingPoint: {
      // OWNER INPUT: confirm exact meeting point + coordinates
      lat: null,
      lng: null,
    },
    inclusions: ["bike", "helmet", "guide", "water"],
    price: { kind: "tbd" },
    departureTimes: ["10:00", "16:00"], // OWNER INPUT: confirm schedule
    minAdvanceBookingDays: 1,
    policies: {
      cancellation: null, // OWNER INPUT
      weather: null, // OWNER INPUT
      refund: null, // OWNER INPUT
    },
  },
];

export const defaultTour = tours[0];

export function getTour(id: string): Tour | undefined {
  return tours.find((t) => t.id === id);
}

/** Formatted price basis for display, or null when pricing is unconfirmed. */
export function priceBasis(tour: Tour): "on_request" | "per_person" | "per_group" {
  return tour.price.kind === "tbd" ? "on_request" : tour.price.kind;
}
