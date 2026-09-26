import { describe, expect, it } from "vitest";
import { buildDailySummary, isSummaryDue, isValidTime, localInstantFor } from "./summary";
import { makeReminder } from "./testUtils";
import { withTimeZone } from "./timeZoneTestUtils";

describe("local notification time", () => {
  it("validates HH:MM times", () => {
    expect(isValidTime("09:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("9:00")).toBe(false);
  });

  it("uses the local wall clock of the device", () => {
    expect(withTimeZone("Europe/Kyiv", () => localInstantFor("2026-09-26", "09:00").toISOString())).toBe(
      "2026-09-26T06:00:00.000Z"
    );
    expect(withTimeZone("America/New_York", () => localInstantFor("2026-09-26", "09:00").toISOString())).toBe(
      "2026-09-26T13:00:00.000Z"
    );
  });

  describe("northern hemisphere (Europe/Kyiv)", () => {
    it("moves a skipped time to the end of the gap", () => {
      // On 29 March 2026 clocks go from 03:00 to 04:00.
      const instant = withTimeZone("Europe/Kyiv", () => localInstantFor("2026-03-29", "03:30"));
      expect(instant.toISOString()).toBe("2026-03-29T01:00:00.000Z"); // 04:00 EEST
    });

    it("uses the first of two repeated times", () => {
      // On 25 October 2026 clocks go from 04:00 back to 03:00.
      const instant = withTimeZone("Europe/Kyiv", () => localInstantFor("2026-10-25", "03:30"));
      expect(instant.toISOString()).toBe("2026-10-25T00:30:00.000Z"); // 03:30 EEST
    });

    it("keeps times outside the transition unchanged", () => {
      const instant = withTimeZone("Europe/Kyiv", () => localInstantFor("2026-03-29", "09:00"));
      expect(instant.toISOString()).toBe("2026-03-29T06:00:00.000Z");
    });
  });

  describe("southern hemisphere (Australia/Sydney)", () => {
    it("moves a skipped time to the end of the gap", () => {
      // On 4 October 2026 clocks go from 02:00 to 03:00.
      const instant = withTimeZone("Australia/Sydney", () => localInstantFor("2026-10-04", "02:15"));
      expect(instant.toISOString()).toBe("2026-10-03T16:00:00.000Z"); // 03:00 AEDT
    });

    it("uses the first of two repeated times", () => {
      // On 5 April 2026 clocks go from 03:00 back to 02:00.
      const instant = withTimeZone("Australia/Sydney", () => localInstantFor("2026-04-05", "02:30"));
      expect(instant.toISOString()).toBe("2026-04-04T15:30:00.000Z"); // 02:30 AEDT
    });
  });
});

describe("daily summary schedule", () => {
  const at = (iso: string): Date => new Date(iso);

  it("is due once the local time is reached", () => {
    withTimeZone("Europe/Kyiv", () => {
      const state = { notificationTime: "09:00", lastSummaryDate: null };
      expect(isSummaryDue({ ...state, now: at("2026-09-26T05:59:00Z") })).toBe(false);
      expect(isSummaryDue({ ...state, now: at("2026-09-26T06:00:00Z") })).toBe(true);
    });
  });

  it("is due on a late start and only once per day", () => {
    withTimeZone("Europe/Kyiv", () => {
      const now = at("2026-09-26T11:00:00Z");
      expect(isSummaryDue({ now, notificationTime: "09:00", lastSummaryDate: "2026-09-25" })).toBe(true);
      expect(isSummaryDue({ now, notificationTime: "09:00", lastSummaryDate: "2026-09-26" })).toBe(false);
    });
  });

  it("follows the device after a time zone change", () => {
    const now = at("2026-09-26T08:00:00Z");
    const state = { now, notificationTime: "09:00", lastSummaryDate: "2026-09-25" };
    // 11:00 in Kyiv: the summary is due. 04:00 in New York: not yet.
    expect(withTimeZone("Europe/Kyiv", () => isSummaryDue(state))).toBe(true);
    expect(withTimeZone("America/New_York", () => isSummaryDue(state))).toBe(false);
  });

  it("fires at the end of a skipped hour", () => {
    withTimeZone("Europe/Kyiv", () => {
      const state = { notificationTime: "03:30", lastSummaryDate: "2026-03-28" };
      expect(isSummaryDue({ ...state, now: at("2026-03-29T00:59:00Z") })).toBe(false);
      expect(isSummaryDue({ ...state, now: at("2026-03-29T01:00:00Z") })).toBe(true);
    });
  });
});

describe("daily summary content", () => {
  it("is empty when nothing is overdue or due today", () => {
    expect(buildDailySummary([makeReminder({ dueDate: "2026-09-27" })], "2026-09-26")).toBeNull();
  });

  it("ignores reminders already completed for today", () => {
    const done = makeReminder({ dueDate: "2026-09-26", status: "completed" });
    expect(buildDailySummary([done], "2026-09-26")).toBeNull();
    expect(buildDailySummary([done, makeReminder({ dueDate: "2026-09-26" })], "2026-09-26")?.todayCount).toBe(1);
  });

  it("counts reminders and lists the first titles in main screen order", () => {
    const reminders = [
      makeReminder({ title: "Today normal", dueDate: "2026-09-26" }),
      makeReminder({ title: "Overdue", dueDate: "2026-09-20" }),
      makeReminder({ title: "Today high", dueDate: "2026-09-26", priority: "high" }),
      makeReminder({ title: "Today low", dueDate: "2026-09-26", priority: "low" }),
      makeReminder({ title: "Tomorrow", dueDate: "2026-09-27" }),
    ];
    expect(buildDailySummary(reminders, "2026-09-26")).toEqual({
      overdueCount: 1,
      todayCount: 3,
      titles: ["Overdue", "Today high", "Today normal"],
      moreCount: 1,
    });
  });
});
