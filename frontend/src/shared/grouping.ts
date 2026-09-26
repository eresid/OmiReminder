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

export interface MainScreenGroups {
  overdue: Reminder[];
  today: Reminder[];
  /** The nearest date after today that has reminders, or `null` if there is none. */
  next: { date: string; reminders: Reminder[] } | null;
}

export function groupForMainScreen(reminders: readonly Reminder[], today: string): MainScreenGroups {
  const active = reminders.filter((reminder) => reminder.status === "active");
  const overdue = active.filter((reminder) => reminder.dueDate < today).sort(compareForMainScreen);
  const dueToday = active.filter((reminder) => reminder.dueDate === today).sort(compareForMainScreen);

  let nextDate: string | null = null;
  for (const reminder of active) {
    if (reminder.dueDate > today && (nextDate === null || reminder.dueDate < nextDate)) {
      nextDate = reminder.dueDate;
    }
  }

  return {
    overdue,
    today: dueToday,
    next:
      nextDate === null
        ? null
        : {
            date: nextDate,
            reminders: active.filter((reminder) => reminder.dueDate === nextDate).sort(compareForMainScreen),
          },
  };
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
