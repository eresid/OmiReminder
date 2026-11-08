import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startTimeZoneWatcher } from "./timeZoneWatcher";

describe("startTimeZoneWatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reports the zone at start and only when it changes", () => {
    let zone = "Europe/Paris";
    const report = vi.fn(() => Promise.resolve());
    const stop = startTimeZoneWatcher({ report, readTimeZone: () => zone, intervalMs: 1000 });
    expect(report).toHaveBeenCalledExactlyOnceWith("Europe/Paris");

    vi.advanceTimersByTime(3000);
    expect(report).toHaveBeenCalledOnce();

    zone = "America/New_York";
    vi.advanceTimersByTime(1000);
    expect(report).toHaveBeenLastCalledWith("America/New_York");
    expect(report).toHaveBeenCalledTimes(2);

    stop();
    zone = "Asia/Tokyo";
    vi.advanceTimersByTime(5000);
    expect(report).toHaveBeenCalledTimes(2);
  });

  it("checks again when the window gets focus", () => {
    let zone = "Europe/Kyiv";
    const report = vi.fn(() => Promise.resolve());
    const stop = startTimeZoneWatcher({ report, readTimeZone: () => zone, intervalMs: 60_000 });
    zone = "Australia/Sydney";
    window.dispatchEvent(new Event("focus"));
    expect(report).toHaveBeenLastCalledWith("Australia/Sydney");
    stop();
  });

  it("retries after a failed report", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const report = vi.fn().mockRejectedValueOnce(new Error("busy")).mockResolvedValue(undefined);
    const stop = startTimeZoneWatcher({ report, readTimeZone: () => "Europe/Kyiv", intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(report).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(report).toHaveBeenCalledTimes(2);
    stop();
  });
});
