import type { Reminder } from "./types";

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 } as const;

/** Main screen order: priority (high first), then date (oldest first), then creation time. */
export function compareForMainScreen(a: Reminder, b: Reminder): number {
  return (
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    a.dueDate.localeCompare(b.dueDate) ||
    a.createdAt.localeCompare(b.createdAt)
  );
}

/** "All reminders" order: date, then priority, then creation time. */
export function compareByDate(a: Reminder, b: Reminder): number {
  return (
    a.dueDate.localeCompare(b.dueDate) ||
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    a.createdAt.localeCompare(b.createdAt)
  );
}

/** Completed reminders go below active ones, in the order they were completed. */
function compareWithinDay(a: Reminder, b: Reminder): number {
  const aCompleted = a.status === "completed";
  const bCompleted = b.status === "completed";
  if (aCompleted !== bCompleted) {
    return aCompleted ? 1 : -1;
  }
  if (aCompleted) {
    return (a.completedAt ?? "").localeCompare(b.completedAt ?? "") || compareForMainScreen(a, b);
  }
  return compareForMainScreen(a, b);
}

export interface MainScreenGroups {
  overdue: Reminder[];
  /** Active reminders due today, then reminders completed for today (FR-MAIN-7). */
  today: Reminder[];
  /** The nearest date after today that has any reminders, or `null` if there is none. */
  next: { date: string; reminders: Reminder[] } | null;
}

export function groupForMainScreen(reminders: readonly Reminder[], today: string): MainScreenGroups {
  const shown = reminders.filter((reminder) => reminder.status === "active" || reminder.status === "completed");
  const overdue = shown
    .filter((reminder) => reminder.status === "active" && reminder.dueDate < today)
    .sort(compareForMainScreen);
  const onDate = (date: string): Reminder[] =>
    shown.filter((reminder) => reminder.dueDate === date).sort(compareWithinDay);

  let nextDate: string | null = null;
  for (const reminder of shown) {
    if (reminder.dueDate > today && (nextDate === null || reminder.dueDate < nextDate)) {
      nextDate = reminder.dueDate;
    }
  }

  return {
    overdue,
    today: onDate(today),
    next: nextDate === null ? null : { date: nextDate, reminders: onDate(nextDate) },
  };
}

export function countActive(reminders: readonly Reminder[]): number {
  return reminders.filter((reminder) => reminder.status === "active").length;
}

export interface AttentionCounts {
  overdue: number;
  today: number;
}

/** Overdue and today counts for the tray badge and the sidebar. */
export function countAttention(reminders: readonly Reminder[], today: string): AttentionCounts {
  let overdue = 0;
  let dueToday = 0;
  for (const reminder of reminders) {
    if (reminder.status !== "active") {
      continue;
    }
    if (reminder.dueDate < today) {
      overdue += 1;
    } else if (reminder.dueDate === today) {
      dueToday += 1;
    }
  }
  return { overdue, today: dueToday };
}
