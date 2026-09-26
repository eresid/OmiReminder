import { isValidDateOnly } from "./dates";
import { isLanguage } from "./locale";
import { isValidTime } from "./summary";
import type {
  DueDateChange,
  NewReminderInput,
  Priority,
  ReminderListKind,
  ReminderPatch,
  Settings,
  Theme,
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
    throw new ValidationError("Invalid reminder id");
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

function validateDueDate(value: unknown): string {
  if (!isValidDateOnly(value)) {
    throw new ValidationError("Due date must be a YYYY-MM-DD date");
  }
  return value;
}

function validatePriority(value: unknown): Priority {
  if (!isPriority(value)) {
    throw new ValidationError("Invalid priority");
  }
  return value;
}

/** Trims tags, drops empty values and case-insensitive duplicates. */
export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new ValidationError("Tags must be a list");
  }
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") {
      throw new ValidationError("Each tag must be a string");
    }
    const tag = item.trim();
    if (tag.length > TAG_MAX_LENGTH) {
      throw new ValidationError("Tag is too long");
    }
    const key = tag.toLocaleLowerCase();
    if (tag.length > 0 && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }
  if (tags.length > TAGS_MAX_COUNT) {
    throw new ValidationError("Too many tags");
  }
  return tags;
}

export function validateNewReminder(value: unknown): NewReminderInput {
  if (!isRecord(value)) {
    throw new ValidationError("Invalid reminder");
  }
  return {
    title: validateTitle(value.title),
    dueDate: validateDueDate(value.dueDate),
    priority: validatePriority(value.priority),
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
  if (value.tags !== undefined) {
    patch.tags = normalizeTags(value.tags);
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
