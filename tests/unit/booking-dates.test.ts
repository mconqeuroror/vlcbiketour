import { describe, expect, it } from "vitest";
import {
  isPastTourDate,
  respectsAdvanceWindow,
  todayInTourTimezone,
} from "@/lib/booking/schema";

// Fixed instant: 2026-09-30 12:00 UTC = 14:00 in Europe/Madrid (CEST, UTC+2),
// so "today" in the tour timezone is deterministically 2026-09-30.
const NOW = new Date("2026-09-30T12:00:00Z");

describe("todayInTourTimezone", () => {
  it("returns the Europe/Madrid calendar date, not the UTC date", () => {
    expect(todayInTourTimezone(NOW)).toBe("2026-09-30");
  });

  it("rolls over at midnight Madrid time, not UTC", () => {
    // 22:30 UTC = 00:30 next day in Madrid (CEST).
    expect(todayInTourTimezone(new Date("2026-09-30T22:30:00Z"))).toBe(
      "2026-10-01",
    );
  });
});

describe("isPastTourDate", () => {
  it("treats yesterday as past", () => {
    expect(isPastTourDate("2026-09-29", NOW)).toBe(true);
  });

  it("treats today as not past", () => {
    expect(isPastTourDate("2026-09-30", NOW)).toBe(false);
  });

  it("treats today+7 as not past", () => {
    expect(isPastTourDate("2026-10-07", NOW)).toBe(false);
  });
});

describe("respectsAdvanceWindow", () => {
  it("rejects today when one day of advance notice is required", () => {
    expect(respectsAdvanceWindow("2026-09-30", 1, NOW)).toBe(false);
  });

  it("accepts exactly the minimum advance boundary (today + minDays)", () => {
    expect(respectsAdvanceWindow("2026-10-01", 1, NOW)).toBe(true);
  });

  it("accepts dates beyond the boundary", () => {
    expect(respectsAdvanceWindow("2026-10-07", 1, NOW)).toBe(true);
  });

  it("accepts today when no advance notice is required", () => {
    expect(respectsAdvanceWindow("2026-09-30", 0, NOW)).toBe(true);
  });
});
