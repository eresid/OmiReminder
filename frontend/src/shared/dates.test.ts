import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  daysBetween,
  daysInMonth,
  firstOfMonth,
  isValidDateOnly,
  isoWeekday,
  parseDateOnly,
  toDateOnly,
} from "./dates";
import { withTimeZone } from "./timeZoneTestUtils";

describe("date-only values", () => {
  it("accepts real calendar dates only", () => {
    expect(isValidDateOnly("2026-09-26")).toBe(true);
    expect(isValidDateOnly("2028-02-29")).toBe(true);
    expect(isValidDateOnly("2026-02-29")).toBe(false);
    expect(isValidDateOnly("2026-13-01")).toBe(false);
    expect(isValidDateOnly("2026-9-26")).toBe(false);
    expect(isValidDateOnly("2026-09-26T00:00:00Z")).toBe(false);
    expect(isValidDateOnly(20260926)).toBe(false);
    expect(parseDateOnly("2026-09-26")).toEqual({ year: 2026, month: 9, day: 26 });
  });

  it("adds days across month and year boundaries and leap days", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-09-26", "2026-10-26")).toBe(30);
  });

  it("does not depend on daylight saving transitions", () => {
    withTimeZone("Europe/Kyiv", () => {
      expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
      expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
      expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
    });
  });

  it("reads the local calendar date of an instant", () => {
    const instant = new Date("2026-09-26T22:30:00Z");
    expect(withTimeZone("Europe/Kyiv", () => toDateOnly(instant))).toBe("2026-09-27");
    expect(withTimeZone("America/New_York", () => toDateOnly(instant))).toBe("2026-09-26");
  });

  it("works with weekdays and months", () => {
    expect(isoWeekday("2026-09-28")).toBe(1);
    expect(isoWeekday("2026-09-27")).toBe(7);
    expect(firstOfMonth("2026-09-26")).toBe("2026-09-01");
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
    expect(daysInMonth("2028-02-01")).toBe(29);
    expect(daysInMonth("2026-02-01")).toBe(28);
  });
});
