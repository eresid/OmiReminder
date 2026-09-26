import { describe, expect, it, vi } from "vitest";
import { withTimeZone } from "../shared/timeZoneTestUtils";
import { DayScheduler } from "./dayScheduler";

function setup(start: string, notificationTime = "09:00") {
  let now = new Date(start);
  let lastSummaryDate: string | null = null;
  const onDayChanged = vi.fn();
  const onSummaryDue = vi.fn();
  const scheduler = new DayScheduler({
    now: () => now,
    getNotificationTime: () => notificationTime,
    getLastSummaryDate: () => lastSummaryDate,
    setLastSummaryDate: (date) => {
      lastSummaryDate = date;
    },
    onDayChanged,
    onSummaryDue,
  });
  return {
    scheduler,
    onDayChanged,
    onSummaryDue,
    setNow: (value: string) => {
      now = new Date(value);
    },
  };
}

describe("DayScheduler", () => {
  it("shows the summary once when the time is reached", () => {
    withTimeZone("Europe/Kyiv", () => {
      const { scheduler, onSummaryDue, setNow } = setup("2026-09-26T05:00:00Z");
      scheduler.tick();
      expect(onSummaryDue).not.toHaveBeenCalled();

      setNow("2026-09-26T06:00:10Z");
      scheduler.tick();
      scheduler.tick();
      expect(onSummaryDue).toHaveBeenCalledTimes(1);
      expect(onSummaryDue).toHaveBeenCalledWith("2026-09-26");
    });
  });

  it("shows the summary right away on a late start", () => {
    withTimeZone("Europe/Kyiv", () => {
      const { scheduler, onSummaryDue } = setup("2026-09-26T12:00:00Z");
      scheduler.tick();
      expect(onSummaryDue).toHaveBeenCalledWith("2026-09-26");
    });
  });

  it("reports a new day at local midnight and shows the next summary", () => {
    withTimeZone("Europe/Kyiv", () => {
      const { scheduler, onDayChanged, onSummaryDue, setNow } = setup("2026-09-26T12:00:00Z");
      scheduler.tick();
      setNow("2026-09-26T21:00:30Z"); // 00:00:30 on 27 September in Kyiv
      scheduler.tick();
      expect(onDayChanged).toHaveBeenCalledWith("2026-09-27");
      expect(onSummaryDue).toHaveBeenCalledTimes(1);

      setNow("2026-09-27T06:00:00Z");
      scheduler.tick();
      expect(onSummaryDue).toHaveBeenLastCalledWith("2026-09-27");
    });
  });
});
