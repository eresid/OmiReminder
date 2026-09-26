import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "./database";
import { ReminderNotFoundError, ReminderRepository } from "./reminderRepository";

describe("ReminderRepository", () => {
  let db: DatabaseSync;
  let repository: ReminderRepository;
  let clock: Date;
  let nextId: number;

  beforeEach(() => {
    db = openDatabase(":memory:");
    clock = new Date("2026-09-26T08:00:00.000Z");
    nextId = 0;
    repository = new ReminderRepository(
      db,
      () => clock,
      () => {
        nextId += 1;
        return `id-${String(nextId)}`;
      }
    );
  });

  afterEach(() => {
    db.close();
  });

  it("creates a reminder with defaults", () => {
    const reminder = repository.create({ title: "Pay rent", dueDate: "2026-10-01", priority: "high" });
    expect(reminder).toEqual({
      id: "id-1",
      title: "Pay rent",
      description: "",
      dueDate: "2026-10-01",
      priority: "high",
      tags: [],
      status: "active",
      completedAt: null,
      createdAt: "2026-09-26T08:00:00.000Z",
      updatedAt: "2026-09-26T08:00:00.000Z",
    });
  });

  it("updates fields and the update time", () => {
    const { id } = repository.create({ title: "Pay rent", dueDate: "2026-10-01", priority: "normal" });
    clock = new Date("2026-09-26T09:00:00.000Z");
    const updated = repository.update(id, { description: "Bank transfer", tags: ["home", "bills"] });
    expect(updated.description).toBe("Bank transfer");
    expect(updated.tags).toEqual(["home", "bills"]);
    expect(updated.title).toBe("Pay rent");
    expect(updated.updatedAt).toBe("2026-09-26T09:00:00.000Z");
  });

  it("completes and reopens a reminder", () => {
    const { id } = repository.create({ title: "Call mom", dueDate: "2026-09-26", priority: "normal" });
    repository.complete(id);
    expect(repository.list("active")).toEqual([]);
    expect(repository.list("completed")[0]?.completedAt).toBe("2026-09-26T08:00:00.000Z");

    repository.reopen(id);
    expect(repository.list("completed")).toEqual([]);
    expect(repository.get(id)).toMatchObject({ status: "active", completedAt: null });
  });

  it("soft-deletes a reminder", () => {
    const { id } = repository.create({ title: "Call mom", dueDate: "2026-09-26", priority: "normal" });
    repository.delete(id);
    expect(repository.list("active")).toEqual([]);
    expect(() => repository.get(id)).toThrow(ReminderNotFoundError);
    const row = db.prepare("SELECT deleted_at FROM reminders WHERE id = :id").get({ id });
    expect(row?.deleted_at).toBe("2026-09-26T08:00:00.000Z");
  });

  it("changes several due dates in one transaction", () => {
    const first = repository.create({ title: "A", dueDate: "2026-09-20", priority: "normal" });
    const second = repository.create({ title: "B", dueDate: "2026-09-21", priority: "normal" });
    repository.setDueDates([
      { id: first.id, dueDate: "2026-09-26" },
      { id: second.id, dueDate: "2026-09-26" },
    ]);
    expect(repository.list("active").map((reminder) => reminder.dueDate)).toEqual(["2026-09-26", "2026-09-26"]);

    expect(() => {
      repository.setDueDates([
        { id: first.id, dueDate: "2026-10-01" },
        { id: "missing", dueDate: "2026-10-01" },
      ]);
    }).toThrow(ReminderNotFoundError);
    expect(repository.get(first.id).dueDate).toBe("2026-09-26");
  });

  it("throws for unknown reminders", () => {
    expect(() => repository.update("missing", { title: "X" })).toThrow(ReminderNotFoundError);
    expect(() => {
      repository.complete("missing");
    }).toThrow(ReminderNotFoundError);
  });
});
