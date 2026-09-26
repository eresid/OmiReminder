import type { Reminder } from "./types";

/** The tag filter of the main screen or "All reminders" (FR-TAG-10). */
export interface TagFilter {
  tagIds: string[];
  /** Also show reminders without tags. */
  untagged: boolean;
}

export const EMPTY_TAG_FILTER: TagFilter = { tagIds: [], untagged: false };

/** With nothing selected, the filter is off. */
export function isTagFilterActive(filter: TagFilter): boolean {
  return filter.untagged || filter.tagIds.length > 0;
}

/** A reminder matches if it has at least one selected tag, or no tags when "No tag" is selected. */
export function matchesTagFilter(reminder: Reminder, filter: TagFilter): boolean {
  if (!isTagFilterActive(filter)) {
    return true;
  }
  if (reminder.tagIds.length === 0) {
    return filter.untagged;
  }
  return reminder.tagIds.some((id) => filter.tagIds.includes(id));
}

export interface HiddenCounts {
  hidden: number;
  overdue: number;
}

/** How many of the screen's reminders the filter hides, and how many of them are overdue (FR-TAG-11). */
export function countHidden(reminders: readonly Reminder[], filter: TagFilter, today: string): HiddenCounts {
  let hidden = 0;
  let overdue = 0;
  for (const reminder of reminders) {
    if (matchesTagFilter(reminder, filter)) {
      continue;
    }
    hidden += 1;
    if (reminder.status === "active" && reminder.dueDate !== null && reminder.dueDate < today) {
      overdue += 1;
    }
  }
  return { hidden, overdue };
}

/** Drops tags that can no longer be selected, for example after they were archived or deleted. */
export function pruneTagFilter(filter: TagFilter, selectableIds: ReadonlySet<string>): TagFilter {
  const tagIds = filter.tagIds.filter((id) => selectableIds.has(id));
  return tagIds.length === filter.tagIds.length ? filter : { ...filter, tagIds };
}

/** Reminders of a tag page, or of Inbox when `tagId` is `null` (FR-TAG-3, FR-TAG-4). */
export function remindersOfTag(reminders: readonly Reminder[], tagId: string | null): Reminder[] {
  return reminders.filter((reminder) =>
    tagId === null ? reminder.tagIds.length === 0 : reminder.tagIds.includes(tagId)
  );
}
