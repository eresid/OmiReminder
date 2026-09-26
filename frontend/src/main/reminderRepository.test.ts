import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "./database";
import { ReminderNotFoundError, ReminderRepository, UnknownTagError } from "./reminderRepository";
import { TagRepository } from "./tagRepository";

describe("ReminderRepository", () => {
  let db: DatabaseSync;
  let repository: ReminderRepository;
  let tags: TagRepository;
  let clock: Date;
  let nextId: number;

  beforeEach(() => {
    db = openDatabase(":memory:");
    clock = new Date("2026-09-26T08:00:00.000Z");
    nextId = 0;
    const newId = (): string => {
      nextId += 1;
      return `id-${String(nextId)}`;
    };
    repository = new ReminderRepository(db, () => clock, newId);
    tags = new TagRepository(db, () => clock, newId);
  });

  afterEach(() => {
    db.close();
  });

  function create(title: string, dueDate: string | null = "2026-09-26", tagIds: string[] = []) {
    return repository.create({ title, dueDate, priority: "normal", tagIds });
  }

  it("creates a reminder with defaults", () => {
    const reminder = repository.create({ title: "Pay rent", dueDate: "2026-10-01", priority: "high", tagIds: [] });
    expect(reminder).toEqual({
      id: "id-1",
      title: "Pay rent",
      description: "",
      dueDate: "2026-10-01",
      priority: "high",
      tagIds: [],
      status: "active",
      completedAt: null,
      createdAt: "2026-09-26T08:00:00.000Z",
      updatedAt: "2026-09-26T08:00:00.000Z",
    });
  });

  it("creates a reminder without a date and with tags", () => {
    const course = tags.create({ name: "Shopify course", color: null });
    const reminder = create("Watch the lesson", null, [course.id]);
    expect(reminder.dueDate).toBeNull();
    expect(reminder.tagIds).toEqual([course.id]);
    expect(repository.list("active")).toEqual([reminder]);
  });

  it("updates fields, tags in their order, and the update time", () => {
    const home = tags.create({ name: "Home", color: null });
    const bills = tags.create({ name: "Bills", color: null });
    const { id } = create("Pay rent", "2026-10-01");
    clock = new Date("2026-09-26T09:00:00.000Z");
    const updated = repository.update(id, { description: "Bank transfer", tagIds: [bills.id, home.id] });
    expect(updated.description).toBe("Bank transfer");
    expect(updated.tagIds).toEqual([bills.id, home.id]);
    expect(updated.title).toBe("Pay rent");
    expect(updated.updatedAt).toBe("2026-09-26T09:00:00.000Z");

    expect(repository.update(id, { title: "Pay the rent" }).tagIds).toEqual([bills.id, home.id]);
    expect(repository.update(id, { tagIds: [] }).tagIds).toEqual([]);
  });

  it("removes and sets the date", () => {
    const { id } = create("Plan the trip", "2026-10-01");
    expect(repository.update(id, { dueDate: null }).dueDate).toBeNull();
    expect(repository.update(id, { dueDate: "2026-10-05" }).dueDate).toBe("2026-10-05");
  });

  it("rejects unknown and deleted tags without changing the reminder", () => {
    const work = tags.create({ name: "Work", color: null });
    const { id } = create("Report", "2026-09-26", [work.id]);
    expect(() => create("Other", null, ["missing"])).toThrow(UnknownTagError);
    expect(repository.list("active")).toHaveLength(1);

    const old = tags.create({ name: "Old", color: null });
    tags.delete(old.id);
    expect(() => repository.update(id, { title: "Changed", tagIds: [old.id] })).toThrow(UnknownTagError);
    expect(repository.get(id)).toMatchObject({ title: "Report", tagIds: [work.id] });
  });

  it("completes and reopens a reminder", () => {
    const { id } = create("Call mom");
    repository.complete(id);
    expect(repository.list("active")).toEqual([]);
    expect(repository.list("completed")[0]?.completedAt).toBe("2026-09-26T08:00:00.000Z");

    repository.reopen(id);
    expect(repository.list("completed")).toEqual([]);
    expect(repository.get(id)).toMatchObject({ status: "active", completedAt: null });
  });

  it("soft-deletes a reminder", () => {
    const { id } = create("Call mom");
    repository.delete(id);
    expect(repository.list("active")).toEqual([]);
    expect(() => repository.get(id)).toThrow(ReminderNotFoundError);
    const row = db.prepare("SELECT deleted_at FROM reminders WHERE id = :id").get({ id });
    expect(row?.deleted_at).toBe("2026-09-26T08:00:00.000Z");
  });

  it("changes several due dates in one transaction", () => {
    const first = create("A", "2026-09-20");
    const second = create("B", "2026-09-21");
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

  it("restores a missing date on Undo of Set date", () => {
    const { id } = create("Someday", null);
    repository.setDueDates([{ id, dueDate: "2026-09-27" }]);
    repository.setDueDates([{ id, dueDate: null }]);
    expect(repository.get(id).dueDate).toBeNull();
  });

  it("throws for unknown reminders", () => {
    expect(() => repository.update("missing", { title: "X" })).toThrow(ReminderNotFoundError);
    expect(() => {
      repository.complete("missing");
    }).toThrow(ReminderNotFoundError);
  });
});
