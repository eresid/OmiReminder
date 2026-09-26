import { describe, expect, it } from "vitest";
import {
  tagNameKey,
  validateDueDateChanges,
  validateNewReminder,
  validateNewTag,
  validateReminderPatch,
  validateSettingsPatch,
  validateTagIds,
  validateTagPatch,
  ValidationError,
} from "./validation";

describe("validation", () => {
  it("accepts and trims a new reminder", () => {
    expect(validateNewReminder({ title: "  Pay rent ", dueDate: "2026-10-01", priority: "high" })).toEqual({
      title: "Pay rent",
      dueDate: "2026-10-01",
      priority: "high",
      tagIds: [],
    });
  });

  it("accepts a reminder without a date and with tags", () => {
    expect(validateNewReminder({ title: "Someday", dueDate: null, priority: "low", tagIds: ["a", "b", "a"] })).toEqual({
      title: "Someday",
      dueDate: null,
      priority: "low",
      tagIds: ["a", "b"],
    });
    expect(validateReminderPatch({ dueDate: null })).toEqual({ dueDate: null });
    expect(() => validateNewReminder({ title: "Someday", priority: "low" })).toThrow(ValidationError);
  });

  it("rejects invalid reminders", () => {
    const valid = { title: "Pay rent", dueDate: "2026-10-01", priority: "normal" };
    expect(() => validateNewReminder({ ...valid, title: "   " })).toThrow(ValidationError);
    expect(() => validateNewReminder({ ...valid, title: "x".repeat(501) })).toThrow(ValidationError);
    expect(() => validateNewReminder({ ...valid, dueDate: "2026-02-30" })).toThrow(ValidationError);
    expect(() => validateNewReminder({ ...valid, priority: "urgent" })).toThrow(ValidationError);
    expect(() => validateNewReminder(null)).toThrow(ValidationError);
  });

  it("keeps only known fields in a patch", () => {
    expect(validateReminderPatch({ description: "Notes", status: "completed", id: "other" })).toEqual({
      description: "Notes",
    });
  });

  it("validates tag IDs", () => {
    expect(validateTagIds(["b", "a", "b"])).toEqual(["b", "a"]);
    expect(() => validateTagIds(Array.from({ length: 21 }, (_, index) => String(index)))).toThrow(ValidationError);
    expect(() => validateTagIds("home")).toThrow(ValidationError);
    expect(() => validateTagIds([""])).toThrow(ValidationError);
  });

  it("validates tags", () => {
    expect(validateNewTag({ name: "  Work " })).toEqual({ name: "Work", color: null });
    expect(validateNewTag({ name: "Home", color: "green" })).toEqual({ name: "Home", color: "green" });
    expect(() => validateNewTag({ name: "   " })).toThrow(ValidationError);
    expect(() => validateNewTag({ name: "x".repeat(51) })).toThrow(ValidationError);
    expect(() => validateNewTag({ name: "Work", color: "black" })).toThrow(ValidationError);
    expect(validateTagPatch({ color: null, archived: true, id: "other" })).toEqual({ color: null, archived: true });
    expect(() => validateTagPatch({ archived: "yes" })).toThrow(ValidationError);
  });

  it("compares tag names ignoring case in any script", () => {
    expect(tagNameKey(" Робота ")).toBe(tagNameKey("РОБОТА"));
    expect(tagNameKey("Work")).toBe("work");
  });

  it("validates date changes and settings", () => {
    expect(validateDueDateChanges([{ id: "a", dueDate: "2026-10-01" }])).toEqual([{ id: "a", dueDate: "2026-10-01" }]);
    expect(() => validateDueDateChanges([{ id: "a", dueDate: "tomorrow" }])).toThrow(ValidationError);
    expect(validateDueDateChanges([{ id: "a", dueDate: null }])).toEqual([{ id: "a", dueDate: null }]);
    expect(validateSettingsPatch({ notificationTime: "08:30", language: "uk" })).toEqual({
      notificationTime: "08:30",
      language: "uk",
    });
    expect(() => validateSettingsPatch({ notificationTime: "8:30" })).toThrow(ValidationError);
    expect(() => validateSettingsPatch({ language: "de" })).toThrow(ValidationError);
    expect(validateSettingsPatch({ theme: "light" })).toEqual({ theme: "light" });
    expect(() => validateSettingsPatch({ theme: "blue" })).toThrow(ValidationError);
  });
});
