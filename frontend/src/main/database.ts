import { DatabaseSync } from "node:sqlite";

// Each migration runs once, in order, inside a transaction. The number of applied migrations is
// stored in `PRAGMA user_version`. Never edit a released migration: add a new one instead.
export const migrations: readonly string[] = [
  `
  CREATE TABLE reminders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    due_date TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX reminders_status_due_date ON reminders (status, due_date);
  CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL,
    color TEXT,
    archived_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE UNIQUE INDEX tags_name_key ON tags (name_key) WHERE deleted_at IS NULL;
  CREATE TABLE reminder_tags (
    reminder_id TEXT NOT NULL REFERENCES reminders (id),
    tag_id TEXT NOT NULL REFERENCES tags (id),
    position INTEGER NOT NULL,
    PRIMARY KEY (reminder_id, tag_id)
  );
  CREATE INDEX reminder_tags_tag_id ON reminder_tags (tag_id);
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];

export function getSchemaVersion(db: DatabaseSync): number {
  const row = db.prepare("PRAGMA user_version").get();
  const version = row?.user_version;
  return typeof version === "number" ? version : 0;
}

export function migrate(db: DatabaseSync): void {
  const current = getSchemaVersion(db);
  if (current > migrations.length) {
    throw new Error(`The database schema version ${String(current)} is newer than this app supports`);
  }
  for (let index = current; index < migrations.length; index += 1) {
    db.exec("BEGIN");
    try {
      db.exec(migrations[index] ?? "");
      db.exec(`PRAGMA user_version = ${String(index + 1)}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

export function openDatabase(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  if (path !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL");
  }
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);
  return db;
}

export function inTransaction<T>(db: DatabaseSync, work: () => T): T {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
