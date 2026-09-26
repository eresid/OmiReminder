import type { Reminder, Tag } from "./types";

let sequence = 0;

/** A reminder with sensible defaults for tests. */
export function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  sequence += 1;
  const createdAt = new Date(Date.UTC(2026, 0, 1, 0, 0, sequence)).toISOString();
  return {
    id: `reminder-${String(sequence)}`,
    title: `Reminder ${String(sequence)}`,
    description: "",
    dueDate: "2026-09-26",
    priority: "normal",
    tagIds: [],
    status: "active",
    completedAt: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

/** A tag with sensible defaults for tests. */
export function makeTag(overrides: Partial<Tag> = {}): Tag {
  sequence += 1;
  const createdAt = new Date(Date.UTC(2026, 0, 1, 0, 0, sequence)).toISOString();
  return {
    id: `tag-${String(sequence)}`,
    name: `Tag ${String(sequence)}`,
    color: null,
    archivedAt: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}
