import { describe, expect, it } from "vitest";
import { openDatabase } from "./database";
import { SettingsRepository } from "./settingsRepository";

describe("SettingsRepository", () => {
  it("returns defaults and stores changes", () => {
    const settings = new SettingsRepository(openDatabase(":memory:"), "uk");
    expect(settings.get()).toEqual({ language: "uk", launchAtStartup: true, notificationTime: "09:00" });

    expect(settings.update({ launchAtStartup: false, notificationTime: "07:45", language: "en" })).toEqual({
      language: "en",
      launchAtStartup: false,
      notificationTime: "07:45",
    });
  });

  it("keeps the language resolved on first start", () => {
    const db = openDatabase(":memory:");
    new SettingsRepository(db, "uk").ensureLanguage();
    expect(new SettingsRepository(db, "en").get().language).toBe("uk");
  });

  it("stores the date of the last daily summary", () => {
    const settings = new SettingsRepository(openDatabase(":memory:"), "en");
    expect(settings.getLastSummaryDate()).toBeNull();
    settings.setLastSummaryDate("2026-09-26");
    expect(settings.getLastSummaryDate()).toBe("2026-09-26");
  });
});
