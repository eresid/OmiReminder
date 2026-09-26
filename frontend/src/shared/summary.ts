import { parseDateOnly, toDateOnly } from "./dates";
import { groupForMainScreen } from "./grouping";
import type { Reminder } from "./types";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const MS_PER_MINUTE = 60 * 1000;

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

function wallClockKey(instant: Date): number {
  return (
    instant.getFullYear() * 1e8 +
    (instant.getMonth() + 1) * 1e6 +
    instant.getDate() * 1e4 +
    instant.getHours() * 100 +
    instant.getMinutes()
  );
}

/**
 * The first instant at which the local wall clock reaches `time` on `date` (FR-NOT-1c).
 * If clocks move forward and the time does not exist, this is the end of the gap.
 * If clocks move back and the time occurs twice, this is the first occurrence.
 */
export function localInstantFor(date: string, time: string): Date {
  const parts = parseDateOnly(date);
  const match = TIME_PATTERN.exec(time);
  if (!parts || !match) {
    throw new RangeError(`Invalid date or time: ${date} ${time}`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const target = parts.year * 1e8 + parts.month * 1e6 + parts.day * 1e4 + hours * 100 + minutes;

  // For a repeated hour, the Date constructor returns the earlier instant. For a skipped hour, it
  // returns a time shifted forward by the length of the gap, so step back to the end of the gap.
  let instant = new Date(parts.year, parts.month - 1, parts.day, hours, minutes).getTime();
  for (let step = 0; step < 24 * 60; step += 1) {
    if (wallClockKey(new Date(instant - MS_PER_MINUTE)) < target) {
      break;
    }
    instant -= MS_PER_MINUTE;
  }
  return new Date(instant);
}

export interface SummaryState {
  now: Date;
  notificationTime: string;
  /** The local date on which the summary was last handled, or `null`. */
  lastSummaryDate: string | null;
}

/**
 * Whether the daily summary for today is due. It is due once per day: at the configured time, or
 * on the first check after it, which covers a late start (FR-NOT-5).
 */
export function isSummaryDue({ now, notificationTime, lastSummaryDate }: SummaryState): boolean {
  const today = toDateOnly(now);
  if (lastSummaryDate === today) {
    return false;
  }
  return now.getTime() >= localInstantFor(today, notificationTime).getTime();
}

export interface DailySummary {
  overdueCount: number;
  todayCount: number;
  titles: string[];
  moreCount: number;
}

export const SUMMARY_TITLE_LIMIT = 3;

/** The summary content in main screen order, or `null` if nothing is overdue or due today. */
export function buildDailySummary(reminders: readonly Reminder[], today: string): DailySummary | null {
  const active = reminders.filter((reminder) => reminder.status === "active");
  const groups = groupForMainScreen(active, today);
  const items = [...groups.overdue, ...groups.today];
  if (items.length === 0) {
    return null;
  }
  return {
    overdueCount: groups.overdue.length,
    todayCount: groups.today.length,
    titles: items.slice(0, SUMMARY_TITLE_LIMIT).map((reminder) => reminder.title),
    moreCount: Math.max(0, items.length - SUMMARY_TITLE_LIMIT),
  };
}
