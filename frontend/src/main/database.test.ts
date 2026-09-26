import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { getSchemaVersion, migrate, migrations, openDatabase } from "./database";

describe("database", () => {
  it("applies all migrations to a new database", () => {
    const db = openDatabase(":memory:");
    expect(getSchemaVersion(db)).toBe(migrations.length);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);
    expect(tables).toEqual(["reminders", "settings"]);
    db.close();
  });

  it("is safe to migrate again", () => {
    const db = openDatabase(":memory:");
    migrate(db);
    expect(getSchemaVersion(db)).toBe(migrations.length);
    db.close();
  });

  it("refuses a database from a newer app version", () => {
    const db = new DatabaseSync(":memory:");
    db.exec(`PRAGMA user_version = ${String(migrations.length + 1)}`);
    expect(() => {
      migrate(db);
    }).toThrow(/newer/);
    db.close();
  });

  it("enforces allowed values", () => {
    const db = openDatabase(":memory:");
    expect(() => {
      db.exec(
        `INSERT INTO reminders (id, title, due_date, priority, created_at, updated_at)
         VALUES ('a', 'Title', '2026-09-26', 'urgent', 'now', 'now')`
      );
    }).toThrow();
    db.close();
  });
});
