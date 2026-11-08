import { afterEach, describe, expect, it, vi } from "vitest";
import { toDateOnly } from "../shared/dates";
import { withTimeZone } from "../shared/timeZoneTestUtils";
import { DayScheduler } from "./dayScheduler";
import { applyTimeZone } from "./timeZone";

describe("applyTimeZone", () => {
  const initial = process.env.TZ;

  afterEach(() => {
    if (initial === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = initial;
    }
  });

  it("switches local dates of this process to the reported zone", () => {
    // 01:30 on 10 November in Kyiv is still 9 November in New York.
    const instant = new Date("2026-11-09T23:30:00Z");
    expect(applyTimeZone("Europe/Kyiv")).toBe(true);
    expect(toDateOnly(instant)).toBe("2026-11-10");
    expect(applyTimeZone("America/New_York")).toBe(true);
    expect(toDateOnly(instant)).toBe("2026-11-09");
  });

  it("reports no change for the zone already in use", () => {
    applyTimeZone("Europe/Kyiv");
    expect(applyTimeZone("Europe/Kyiv")).toBe(false);
  });

  it("lets the scheduler fire the summary at 09:00 in the new zone after a move (FR-NOT-1b)", () => {
    let now = new Date("2026-11-09T07:00:00Z");
    const onSummaryDue = vi.fn();
    const onDayChanged = vi.fn();
    let lastSummaryDate: string | null = null;
    const scheduler = withTimeZone("Europe/Paris", () => {
      const created = new DayScheduler({
        now: () => now,
        getNotificationTime: () => "09:00",
        getLastSummaryDate: () => lastSummaryDate,
        setLastSummaryDate: (date) => {
          lastSummaryDate = date;
        },
        onDayChanged,
        onSummaryDue,
      });
      // 08:00 in Paris: not yet.
      created.tick();
      return created;
    });
    expect(onSummaryDue).not.toHaveBeenCalled();

    // The user flies to New York. 09:00 Paris time passes during the flight.
    applyTimeZone("America/New_York");
    now = new Date("2026-11-09T13:00:00Z"); // 08:00 in New York
    scheduler.tick();
    expect(onSummaryDue).not.toHaveBeenCalled();

    now = new Date("2026-11-09T14:00:00Z"); // 09:00 in New York
    scheduler.tick();
    expect(onSummaryDue).toHaveBeenCalledExactlyOnceWith("2026-11-09");
  });
});
