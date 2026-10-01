import { describe, expect, it } from "vitest";
import { tours, tourPrice } from "@/config/tours";
import { bookingRequestSchema, bookingScheduleErrors, departureInstant } from "@/lib/booking/schema";

import { computeAmountCents } from "@/lib/booking/stripe";

function payload(overrides: Record<string, unknown> = {}) {
  return { tourId: tours[0].id, locale: "en", date: "2030-06-15", departureTime: "10:30", groupSize: 1,
    name: "Test Rider", email: "test@example.com", guideLanguage: "en", idempotencyKey: crypto.randomUUID(),
    termsAccepted: true, website: "", renderedAt: Date.now() - 10000, ...overrides };
}

describe("approved tour prices", () => {
  it.each([1,2,6,20])("Dutch charges €30 per person for %i", (people) => {
    expect(computeAmountCents(tours[0].id, people, "nl")).toBe(people * 3000);
    expect(tourPrice(tours[0], people, "nl")?.perPersonCents).toBe(3000);
  });
  it.each([[1,2500],[2,5000],[3,7500],[5,12500],[6,15000],[20,50000]])("shared party of %i pays %i cents", (people,total) => {
    expect(tourPrice(tours[0], people)?.totalCents).toBe(total);
    expect(computeAmountCents(tours[0].id, people)).toBe(total);
  });
  it.each([1,2,3,4,5,6,10])("either private tour for %i people costs €225", (people) => {
    for (const tour of tours.slice(1)) expect(tourPrice(tour, people)).toEqual({ totalCents:22500,perPersonCents:22500/people });
  });
  it("requires quotation for private groups above 10 and rejects invalid sizes", () => {
    expect(tourPrice(tours[1], 11)).toBeNull();
    for (const size of [0, -1, 1.5, 21, NaN]) expect(tourPrice(tours[0], size)).toBeNull();
    expect(() => computeAmountCents(tours[1].id,11)).toThrow();
  });
});
describe("tour-specific booking contract", () => {
  it.each([1,2])("accepts shared party of %i without imposing aggregate departure minimum", (groupSize) => {
    expect(bookingRequestSchema.safeParse(payload({groupSize})).success).toBe(true);
  });
  it.each([
    {departureTime:"10:00",guideLanguage:"en"}, {departureTime:"10:30",guideLanguage:"nl"},
    {departureTime:"16:00"}, {guideLanguage:"es"}, {guideLanguage:undefined}, {date:"2030-02-30"},
    {tourId:"private-architecture",guideLanguage:"fr"},
  ])("rejects invalid combination %j", (override) => {
    expect(bookingRequestSchema.safeParse(payload(override)).success).toBe(false);
  });
  it.each(["en","nl","it","fr","es","ar"])("accepts private city in %s with flexible time",(guideLanguage)=>{
    expect(bookingRequestSchema.safeParse(payload({tourId:"private-city",departureTime:"14:30",guideLanguage})).success).toBe(true);
  });
  it.each(["en","ar"])("accepts architecture in %s",(guideLanguage)=>{
    expect(bookingRequestSchema.safeParse(payload({tourId:"private-architecture",departureTime:"10:00",guideLanguage})).success).toBe(true);
  });
});
describe("real Madrid departure instants", () => {
  const now=new Date("2026-10-01T12:00:00Z");
  it("requires 24 elapsed hours, including selected time",()=>{
    expect(bookingScheduleErrors({tourId:"private-city",date:"2026-10-02",departureTime:"13:59"},now)).toEqual({date:"date_advance"});
    expect(bookingScheduleErrors({tourId:"private-city",date:"2026-10-02",departureTime:"14:00"},now)).toEqual({});
  });
  it("handles spring and autumn clock changes",()=>{
    expect(bookingScheduleErrors({tourId:"private-city",date:"2027-03-28",departureTime:"12:00"},new Date("2027-03-27T11:00:00Z"))).toEqual({date:"date_advance"});
    expect(bookingScheduleErrors({tourId:"private-city",date:"2026-10-25",departureTime:"12:00"},new Date("2026-10-24T10:00:00Z"))).toEqual({});
    expect(departureInstant("2027-03-28","02:30")).toBeNull();
    expect(departureInstant("2026-10-25","02:30")).toBeNull();
  });
  it("allows future same-day shared departures and rejects elapsed departures",()=>{
    expect(bookingScheduleErrors({tourId:tours[0].id,date:"2026-10-01",departureTime:"10:30"},new Date("2026-10-01T07:00:00Z"))).toEqual({});
    expect(bookingScheduleErrors({tourId:tours[0].id,date:"2026-10-01",departureTime:"10:30"},now)).toEqual({date:"date_past"});
  });
});
