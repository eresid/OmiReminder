import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  DueDateChange,
  NewReminderInput,
  Priority,
  Reminder,
  ReminderListKind,
  ReminderPatch,
  ReminderStatus,
} from "../shared/types";
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

function toReminder(row: Row, tagIds: string[]): Reminder {
  return {
    id: text(row, "id"),
    title: text(row, "title"),
    description: text(row, "description"),
    dueDate: optionalText(row, "due_date"),
    priority: text(row, "priority") as Priority,
    tagIds,
    status: text(row, "status") as ReminderStatus,
    completedAt: optionalText(row, "completed_at"),
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at"),
  };
}

export class ReminderNotFoundError extends Error {
  override name = "ReminderNotFoundError";
}

export class UnknownTagError extends Error {
  override name = "UnknownTagError";
}

export class ReminderRepository {
  constructor(
    private readonly db: DatabaseSync,
    private readonly now: () => Date = () => new Date(),
    private readonly newId: () => string = randomUUID
  ) {}

  private timestamp(): string {
    return this.now().toISOString();
  }

  list(kind: ReminderListKind): Reminder[] {
    const sql =
      kind === "active"
        ? `SELECT * FROM reminders WHERE deleted_at IS NULL AND status = 'active'
           ORDER BY due_date, created_at`
        : `SELECT * FROM reminders WHERE deleted_at IS NULL AND status = 'completed'
           ORDER BY completed_at DESC`;
    const rows = this.db.prepare(sql).all();
    const tagIds = this.allTagIds();
    return rows.map((row) => toReminder(row, tagIds.get(text(row, "id")) ?? []));
  }

  private allTagIds(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    const rows = this.db.prepare("SELECT reminder_id, tag_id FROM reminder_tags ORDER BY position").all();
    for (const row of rows) {
      const reminderId = text(row, "reminder_id");
      const ids = result.get(reminderId) ?? [];
      ids.push(text(row, "tag_id"));
      result.set(reminderId, ids);
    }
    return result;
  }

  private tagIdsOf(id: string): string[] {
    return this.db
      .prepare("SELECT tag_id FROM reminder_tags WHERE reminder_id = :id ORDER BY position")
      .all({ id })
      .map((row) => text(row, "tag_id"));
  }

  /** Replaces the tags of a reminder. Every tag must exist and not be deleted. */
  private writeTagIds(id: string, tagIds: readonly string[]): void {
    const exists = this.db.prepare("SELECT 1 AS found FROM tags WHERE id = :tagId AND deleted_at IS NULL");
    for (const tagId of tagIds) {
      if (!exists.get({ tagId })) {
        throw new UnknownTagError(`Tag ${tagId} was not found`);
      }
    }
    this.db.prepare("DELETE FROM reminder_tags WHERE reminder_id = :id").run({ id });
    const insert = this.db.prepare(
      "INSERT INTO reminder_tags (reminder_id, tag_id, position) VALUES (:id, :tagId, :position)"
    );
    tagIds.forEach((tagId, position) => {
      insert.run({ id, tagId, position });
    });
  }

  get(id: string): Reminder {
    const row = this.db.prepare("SELECT * FROM reminders WHERE id = :id AND deleted_at IS NULL").get({ id });
    if (!row) {
      throw new ReminderNotFoundError(`Reminder ${id} was not found`);
    }
    return toReminder(row, this.tagIdsOf(id));
  }

  create(input: NewReminderInput): Reminder {
    const id = this.newId();
    const timestamp = this.timestamp();
    inTransaction(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO reminders (id, title, due_date, priority, created_at, updated_at)
           VALUES (:id, :title, :dueDate, :priority, :timestamp, :timestamp)`
        )
        .run({ id, title: input.title, dueDate: input.dueDate, priority: input.priority, timestamp });
      this.writeTagIds(id, input.tagIds);
    });
    return this.get(id);
  }

  update(id: string, patch: ReminderPatch): Reminder {
    const current = this.get(id);
    const next = { ...current, ...patch };
    inTransaction(this.db, () => {
      this.db
        .prepare(
          `UPDATE reminders
           SET title = :title, description = :description, due_date = :dueDate,
               priority = :priority, updated_at = :updatedAt
           WHERE id = :id`
        )
        .run({
          id,
          title: next.title,
          description: next.description,
          dueDate: next.dueDate,
          priority: next.priority,
          updatedAt: this.timestamp(),
        });
      if (patch.tagIds) {
        this.writeTagIds(id, patch.tagIds);
      }
    });
    return this.get(id);
  }

  /** Soft delete, so the deletion can be synced to other devices later (FR-SYNC-5). */
  delete(id: string): void {
    this.get(id);
    const timestamp = this.timestamp();
    this.db
      .prepare("UPDATE reminders SET deleted_at = :timestamp, updated_at = :timestamp WHERE id = :id")
      .run({ id, timestamp });
  }

  complete(id: string): void {
    this.setStatus(id, "completed");
  }

  reopen(id: string): void {
    this.setStatus(id, "active");
  }

  private setStatus(id: string, status: "active" | "completed"): void {
    this.get(id);
    const timestamp = this.timestamp();
    this.db
      .prepare(
        `UPDATE reminders SET status = :status, completed_at = :completedAt, updated_at = :timestamp
         WHERE id = :id`
      )
      .run({ id, status, completedAt: status === "completed" ? timestamp : null, timestamp });
  }

  /**
   * Changes several due dates at once. Used by reschedule, "Reschedule all", "Set date", and Undo,
   * which can restore `null` for a reminder that had no date.
   */
  setDueDates(changes: readonly DueDateChange[]): void {
    inTransaction(this.db, () => {
      const statement = this.db.prepare(
        `UPDATE reminders SET due_date = :dueDate, updated_at = :timestamp
         WHERE id = :id AND deleted_at IS NULL`
      );
      const timestamp = this.timestamp();
      for (const change of changes) {
        const result = statement.run({ id: change.id, dueDate: change.dueDate, timestamp });
        if (result.changes === 0) {
          throw new ReminderNotFoundError(`Reminder ${change.id} was not found`);
        }
      }
    });
  }
}
