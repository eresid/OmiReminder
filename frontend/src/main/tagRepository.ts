import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { tagNameKey } from "../shared/validation";
import type { NewTagInput, Tag, TagColor, TagPatch } from "../shared/types";
import { inTransaction } from "./database";

type Row = Record<string, unknown>;

function text(row: Row, column: string): string {
  const value = row[column];
  if (typeof value !== "string") {
    throw new Error(`Unexpected value in column ${column}`);
  }
  return value;
}

function optionalText(row: Row, column: string): string | null {
  const value = row[column];
  return typeof value === "string" ? value : null;
}

function toTag(row: Row): Tag {
  return {
    id: text(row, "id"),
    name: text(row, "name"),
    color: optionalText(row, "color") as TagColor | null,
    archivedAt: optionalText(row, "archived_at"),
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at"),
  };
}

export class TagNotFoundError extends Error {
  override name = "TagNotFoundError";
}

export class TagNameTakenError extends Error {
  override name = "TagNameTakenError";
}

/** Tags are separate records, so renaming a tag does not change its reminders (section 3.6). */
export class TagRepository {
  constructor(
    private readonly db: DatabaseSync,
    private readonly now: () => Date = () => new Date(),
    private readonly newId: () => string = randomUUID
  ) {}

  private timestamp(): string {
    return this.now().toISOString();
  }

  /** All non-deleted tags, including archived ones. */
  list(): Tag[] {
    return this.db.prepare("SELECT * FROM tags WHERE deleted_at IS NULL ORDER BY created_at").all().map(toTag);
  }

  get(id: string): Tag {
    const row = this.db.prepare("SELECT * FROM tags WHERE id = :id AND deleted_at IS NULL").get({ id });
    if (!row) {
      throw new TagNotFoundError(`Tag ${id} was not found`);
    }
    return toTag(row);
  }

  /** Names are unique among non-deleted tags, ignoring case. */
  private assertNameFree(name: string, exceptId: string | null): void {
    const row = this.db
      .prepare("SELECT id FROM tags WHERE name_key = :key AND deleted_at IS NULL")
      .get({ key: tagNameKey(name) });
    if (row && row.id !== exceptId) {
      throw new TagNameTakenError(`A tag named ${name} already exists`);
    }
  }

  create(input: NewTagInput): Tag {
    this.assertNameFree(input.name, null);
    const id = this.newId();
    const timestamp = this.timestamp();
    this.db
      .prepare(
        `INSERT INTO tags (id, name, name_key, color, created_at, updated_at)
         VALUES (:id, :name, :key, :color, :timestamp, :timestamp)`
      )
      .run({ id, name: input.name, key: tagNameKey(input.name), color: input.color, timestamp });
    return this.get(id);
  }

  update(id: string, patch: TagPatch): Tag {
    const current = this.get(id);
    const name = patch.name ?? current.name;
    if (patch.name !== undefined) {
      this.assertNameFree(patch.name, id);
    }
    const timestamp = this.timestamp();
    const archivedAt =
      patch.archived === undefined ? current.archivedAt : patch.archived ? (current.archivedAt ?? timestamp) : null;
    this.db
      .prepare(
        `UPDATE tags SET name = :name, name_key = :key, color = :color, archived_at = :archivedAt,
         updated_at = :timestamp WHERE id = :id`
      )
      .run({
        id,
        name,
        key: tagNameKey(name),
        color: patch.color === undefined ? current.color : patch.color,
        archivedAt,
        timestamp,
      });
    return this.get(id);
  }

  /**
   * Soft-deletes the tag and removes it from its reminders, which are kept (FR-TAG-8). The changed
   * reminders get a new update time, so the change can be synced later.
   */
  delete(id: string): void {
    this.get(id);
    const timestamp = this.timestamp();
    inTransaction(this.db, () => {
      this.db
        .prepare(
          `UPDATE reminders SET updated_at = :timestamp
           WHERE id IN (SELECT reminder_id FROM reminder_tags WHERE tag_id = :id)`
        )
        .run({ id, timestamp });
      this.db.prepare("DELETE FROM reminder_tags WHERE tag_id = :id").run({ id });
      this.db
        .prepare("UPDATE tags SET deleted_at = :timestamp, updated_at = :timestamp WHERE id = :id")
        .run({ id, timestamp });
    });
  }
}
