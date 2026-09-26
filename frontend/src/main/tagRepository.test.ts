import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "./database";
import { ReminderRepository } from "./reminderRepository";
import { TagNameTakenError, TagNotFoundError, TagRepository } from "./tagRepository";

describe("TagRepository", () => {
  let db: DatabaseSync;
  let tags: TagRepository;
  let reminders: ReminderRepository;
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
    tags = new TagRepository(db, () => clock, newId);
    reminders = new ReminderRepository(db, () => clock, newId);
  });

  afterEach(() => {
    db.close();
  });

  it("creates a tag without reminders", () => {
    expect(tags.create({ name: "Work", color: "blue" })).toEqual({
      id: "id-1",
      name: "Work",
      color: "blue",
      archivedAt: null,
      createdAt: "2026-09-26T08:00:00.000Z",
      updatedAt: "2026-09-26T08:00:00.000Z",
    });
    expect(tags.list()).toHaveLength(1);
  });

  it("keeps names unique ignoring case, also for Cyrillic", () => {
    tags.create({ name: "Робота", color: null });
    expect(() => tags.create({ name: "РОБОТА", color: null })).toThrow(TagNameTakenError);
    expect(() => tags.create({ name: "робота", color: null })).toThrow(TagNameTakenError);
    // The database enforces it too.
    expect(() => {
      db.exec(
        `INSERT INTO tags (id, name, name_key, created_at, updated_at) VALUES ('x', 'Робота', 'робота', 'now', 'now')`
      );
    }).toThrow();
  });

  it("renames without changing the reminders", () => {
    const work = tags.create({ name: "Work", color: null });
    const other = tags.create({ name: "Home", color: null });
    const reminder = reminders.create({ title: "Report", dueDate: null, priority: "normal", tagIds: [work.id] });
    clock = new Date("2026-09-26T09:00:00.000Z");

    expect(tags.update(work.id, { name: "work" }).name).toBe("work");
    expect(() => tags.update(work.id, { name: "HOME" })).toThrow(TagNameTakenError);
    expect(tags.update(other.id, { color: "green" })).toMatchObject({ name: "Home", color: "green" });
    expect(reminders.get(reminder.id).updatedAt).toBe("2026-09-26T08:00:00.000Z");
  });

  it("archives and unarchives a tag", () => {
    const course = tags.create({ name: "Course", color: null });
    clock = new Date("2026-09-27T08:00:00.000Z");
    expect(tags.update(course.id, { archived: true }).archivedAt).toBe("2026-09-27T08:00:00.000Z");
    // Archiving again keeps the first archive time.
    clock = new Date("2026-09-28T08:00:00.000Z");
    expect(tags.update(course.id, { archived: true }).archivedAt).toBe("2026-09-27T08:00:00.000Z");
    expect(tags.update(course.id, { archived: false }).archivedAt).toBeNull();
  });

  it("deletes a tag, keeps its reminders, and marks them changed", () => {
    const work = tags.create({ name: "Work", color: null });
    const home = tags.create({ name: "Home", color: null });
    const both = reminders.create({ title: "A", dueDate: null, priority: "normal", tagIds: [work.id, home.id] });
    const onlyHome = reminders.create({ title: "B", dueDate: null, priority: "normal", tagIds: [home.id] });
    clock = new Date("2026-09-26T09:00:00.000Z");

    tags.delete(work.id);

    expect(tags.list().map((tag) => tag.name)).toEqual(["Home"]);
    expect(() => tags.get(work.id)).toThrow(TagNotFoundError);
    expect(reminders.get(both.id)).toMatchObject({ tagIds: [home.id], updatedAt: "2026-09-26T09:00:00.000Z" });
    expect(reminders.get(onlyHome.id).updatedAt).toBe("2026-09-26T08:00:00.000Z");
    const row = db.prepare("SELECT deleted_at FROM tags WHERE id = :id").get({ id: work.id });
    expect(row?.deleted_at).toBe("2026-09-26T09:00:00.000Z");

    // The name is free again.
    expect(tags.create({ name: "Work", color: null }).name).toBe("Work");
  });
});
