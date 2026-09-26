import { isValidDateOnly } from "./dates";
import { isLanguage } from "./locale";
import { isValidTime } from "./summary";
import {
  TAG_COLORS,
  type DueDateChange,
  type NewReminderInput,
  type NewTagInput,
  type Priority,
  type ReminderListKind,
  type ReminderPatch,
  type Settings,
  type TagColor,
  type TagPatch,
  type Theme,
} from "./types";

export const TITLE_MAX_LENGTH = 500;
export const DESCRIPTION_MAX_LENGTH = 10_000;
export const TAG_MAX_LENGTH = 50;
export const TAGS_MAX_COUNT = 20;

export class ValidationError extends Error {
  override name = "ValidationError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

export function validateId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 100) {
    throw new ValidationError("Invalid id");
  }
  return value;
}

export function validateListKind(value: unknown): ReminderListKind {
  if (value !== "active" && value !== "completed") {
    throw new ValidationError("Invalid list kind");
  }
  return value;
}

function validateTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("Title must be a string");
  }
  const title = value.trim();
  if (title.length === 0 || title.length > TITLE_MAX_LENGTH) {
    throw new ValidationError("Title must not be empty or too long");
  }
  return title;
}

/** A `YYYY-MM-DD` date, or `null` for a reminder without a date (FR-NODATE-1). */
function validateDueDate(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  if (!isValidDateOnly(value)) {
    throw new ValidationError("Due date must be a YYYY-MM-DD date or null");
  }
  return value;
}

function validatePriority(value: unknown): Priority {
  if (!isPriority(value)) {
    throw new ValidationError("Invalid priority");
  }
  return value;
}

/** Drops duplicate IDs and keeps the order (FR-TAG-1). */
export function validateTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new ValidationError("Tag IDs must be a list");
  }
  const ids = [...new Set(value.map((item: unknown) => validateId(item)))];
  if (ids.length > TAGS_MAX_COUNT) {
    throw new ValidationError("Too many tags");
  }
  return ids;
}

/** Trims the name. It must have 1 to `TAG_MAX_LENGTH` characters (section 3.6). */
export function validateTagName(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("Tag name must be a string");
  }
  const name = value.trim();
  if (name.length === 0 || name.length > TAG_MAX_LENGTH) {
    throw new ValidationError("Tag name must not be empty or too long");
  }
  return name;
}

/** The key that makes tag names unique ignoring case, for any script. */
export function tagNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function isTagColor(value: unknown): value is TagColor {
  return typeof value === "string" && (TAG_COLORS as readonly string[]).includes(value);
}

function validateTagColor(value: unknown): TagColor | null {
  if (value !== null && !isTagColor(value)) {
    throw new ValidationError("Invalid tag color");
  }
  return value;
}

export function validateNewTag(value: unknown): NewTagInput {
  if (!isRecord(value)) {
    throw new ValidationError("Invalid tag");
  }
  return { name: validateTagName(value.name), color: validateTagColor(value.color ?? null) };
}

export function validateTagPatch(value: unknown): TagPatch {
  if (!isRecord(value)) {
    throw new ValidationError("Invalid tag changes");
  }
  const patch: TagPatch = {};
  if (value.name !== undefined) {
    patch.name = validateTagName(value.name);
  }
  if (value.color !== undefined) {
    patch.color = validateTagColor(value.color);
  }
  if (value.archived !== undefined) {
    if (typeof value.archived !== "boolean") {
      throw new ValidationError("Invalid archived value");
    }
    patch.archived = value.archived;
  }
  return patch;
}

export function validateNewReminder(value: unknown): NewReminderInput {
  if (!isRecord(value)) {
    throw new ValidationError("Invalid reminder");
  }
  return {
    title: validateTitle(value.title),
    dueDate: validateDueDate(value.dueDate),
    priority: validatePriority(value.priority),
    tagIds: validateTagIds(value.tagIds ?? []),
  };
}

export function validateReminderPatch(value: unknown): ReminderPatch {
  if (!isRecord(value)) {
    throw new ValidationError("Invalid reminder changes");
  }
  const patch: ReminderPatch = {};
  if (value.title !== undefined) {
    patch.title = validateTitle(value.title);
  }
  if (value.description !== undefined) {
    if (typeof value.description !== "string" || value.description.length > DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError("Invalid description");
    }
    patch.description = value.description;
  }
  if (value.dueDate !== undefined) {
    patch.dueDate = validateDueDate(value.dueDate);
  }
  if (value.priority !== undefined) {
    patch.priority = validatePriority(value.priority);
  }
  if (value.tagIds !== undefined) {
    patch.tagIds = validateTagIds(value.tagIds);
  }
  return patch;
}

export function validateDueDateChanges(value: unknown): DueDateChange[] {
  if (!Array.isArray(value) || value.length > 10_000) {
    throw new ValidationError("Invalid date changes");
  }
  return value.map((item: unknown) => {
    if (!isRecord(item)) {
      throw new ValidationError("Invalid date change");
    }
    return { id: validateId(item.id), dueDate: validateDueDate(item.dueDate) };
  });
}

export function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

export function validateSettingsPatch(value: unknown): Partial<Settings> {
  if (!isRecord(value)) {
    throw new ValidationError("Invalid settings");
  }
  const patch: Partial<Settings> = {};
  if (value.language !== undefined) {
    if (!isLanguage(value.language)) {
      throw new ValidationError("Invalid language");
    }
    patch.language = value.language;
  }
  if (value.theme !== undefined) {
    if (!isTheme(value.theme)) {
      throw new ValidationError("Invalid theme");
    }
    patch.theme = value.theme;
  }
  if (value.launchAtStartup !== undefined) {
    if (typeof value.launchAtStartup !== "boolean") {
      throw new ValidationError("Invalid launch at startup value");
    }
    patch.launchAtStartup = value.launchAtStartup;
  }
  if (value.notificationTime !== undefined) {
    if (!isValidTime(value.notificationTime)) {
      throw new ValidationError("Invalid notification time");
    }
    patch.notificationTime = value.notificationTime;
  }
  return patch;
}
