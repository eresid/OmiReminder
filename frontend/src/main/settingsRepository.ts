import type { DatabaseSync } from "node:sqlite";
import { isValidDateOnly } from "../shared/dates";
import { isLanguage } from "../shared/locale";
import { isValidTime } from "../shared/summary";
import { isTheme } from "../shared/validation";
import type { Language, Settings } from "../shared/types";

export const DEFAULT_NOTIFICATION_TIME = "09:00";

const Key = {
  language: "language",
  theme: "theme",
  launchAtStartup: "launchAtStartup",
  notificationTime: "notificationTime",
  lastSummaryDate: "lastSummaryDate",
} as const;

/** Device settings. They stay on this device and are never synced (FR-SET-1). */
export class SettingsRepository {
  constructor(
    private readonly db: DatabaseSync,
    private readonly defaultLanguage: Language
  ) {}

  private read(key: string): string | null {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = :key").get({ key });
    const value = row?.value;
    return typeof value === "string" ? value : null;
  }

  private write(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO settings (key, value) VALUES (:key, :value)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`
      )
      .run({ key, value });
  }

  get(): Settings {
    const language = this.read(Key.language);
    const notificationTime = this.read(Key.notificationTime);
    const theme = this.read(Key.theme);
    return {
      language: isLanguage(language) ? language : this.defaultLanguage,
      theme: isTheme(theme) ? theme : "system",
      launchAtStartup: this.read(Key.launchAtStartup) !== "false",
      notificationTime: isValidTime(notificationTime) ? notificationTime : DEFAULT_NOTIFICATION_TIME,
    };
  }

  update(patch: Partial<Settings>): Settings {
    if (patch.language !== undefined) {
      this.write(Key.language, patch.language);
    }
    if (patch.theme !== undefined) {
      this.write(Key.theme, patch.theme);
    }
    if (patch.launchAtStartup !== undefined) {
      this.write(Key.launchAtStartup, String(patch.launchAtStartup));
    }
    if (patch.notificationTime !== undefined) {
      this.write(Key.notificationTime, patch.notificationTime);
    }
    return this.get();
  }

  /** Stores the language resolved on first start, so later OS changes do not switch it. */
  ensureLanguage(): void {
    if (!isLanguage(this.read(Key.language))) {
      this.write(Key.language, this.defaultLanguage);
    }
  }

  getLastSummaryDate(): string | null {
    const value = this.read(Key.lastSummaryDate);
    return isValidDateOnly(value) ? value : null;
  }

  setLastSummaryDate(date: string): void {
    this.write(Key.lastSummaryDate, date);
  }
}
