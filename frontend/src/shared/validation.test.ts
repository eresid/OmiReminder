import { describe, expect, it } from "vitest";
import {
  normalizeTags,
  validateDueDateChanges,
  validateNewReminder,
  validateReminderPatch,
  validateSettingsPatch,
  ValidationError,
} from "./validation";

describe("validation", () => {
  it("accepts and trims a new reminder", () => {
    expect(validateNewReminder({ title: "  Pay rent ", dueDate: "2026-10-01", priority: "high" })).toEqual({
      title: "Pay rent",
      dueDate: "2026-10-01",
      priority: "high",
    });
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

  it("normalizes tags", () => {
    expect(normalizeTags([" home ", "Home", "", "work"])).toEqual(["home", "work"]);
    expect(() => normalizeTags(["x".repeat(51)])).toThrow(ValidationError);
    expect(() => normalizeTags("home")).toThrow(ValidationError);
  });

  it("validates date changes and settings", () => {
    expect(validateDueDateChanges([{ id: "a", dueDate: "2026-10-01" }])).toEqual([{ id: "a", dueDate: "2026-10-01" }]);
    expect(() => validateDueDateChanges([{ id: "a", dueDate: "tomorrow" }])).toThrow(ValidationError);
    expect(validateSettingsPatch({ notificationTime: "08:30", language: "uk" })).toEqual({
      notificationTime: "08:30",
      language: "uk",
    });
    expect(() => validateSettingsPatch({ notificationTime: "8:30" })).toThrow(ValidationError);
    expect(() => validateSettingsPatch({ language: "de" })).toThrow(ValidationError);
  });
});
