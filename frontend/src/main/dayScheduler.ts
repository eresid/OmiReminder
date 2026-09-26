import { toDateOnly } from "../shared/dates";
import { isSummaryDue } from "../shared/summary";

export interface DaySchedulerOptions {
  now?: () => Date;
  getNotificationTime: () => string;
  getLastSummaryDate: () => string | null;
  setLastSummaryDate: (date: string) => void;
  /** Called when the local date changes, including at midnight and after a time zone change. */
  onDayChanged: (today: string) => void;
  /** Called at most once per local day, when the daily summary is due. */
  onSummaryDue: (today: string) => void;
}

export const TICK_INTERVAL_MS = 15_000;

/**
 * Watches the local clock. A short polling interval, instead of one long timer, keeps the
 * schedule correct after sleep, clock changes, and time zone changes (FR-MAIN-6, FR-NOT-1b).
 */
export class DayScheduler {
  private readonly now: () => Date;
  private today: string;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: DaySchedulerOptions) {
    this.now = options.now ?? (() => new Date());
    this.today = toDateOnly(this.now());
  }

  getToday(): string {
    return this.today;
  }

  start(): void {
    this.tick();
    this.timer ??= setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  tick(): void {
    const now = this.now();
    const today = toDateOnly(now);
    if (today !== this.today) {
      this.today = today;
      this.options.onDayChanged(today);
    }
    const due = isSummaryDue({
      now,
      notificationTime: this.options.getNotificationTime(),
      lastSummaryDate: this.options.getLastSummaryDate(),
    });
    if (due) {
      // The day is marked as handled even if there is nothing to show, so reminders added later
      // that day do not trigger another notification (FR-NOT-1a).
      this.options.setLastSummaryDate(today);
      this.options.onSummaryDue(today);
    }
  }
}
