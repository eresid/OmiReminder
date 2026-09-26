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

function parseTags(value: string): string[] {
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
}

function toReminder(row: Row): Reminder {
  return {
    id: text(row, "id"),
    title: text(row, "title"),
    description: text(row, "description"),
    dueDate: text(row, "due_date"),
    priority: text(row, "priority") as Priority,
    tags: parseTags(text(row, "tags")),
    status: text(row, "status") as ReminderStatus,
    completedAt: optionalText(row, "completed_at"),
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at"),
  };
}

export class ReminderNotFoundError extends Error {
  override name = "ReminderNotFoundError";
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
    return this.db.prepare(sql).all().map(toReminder);
  }

  get(id: string): Reminder {
    const row = this.db.prepare("SELECT * FROM reminders WHERE id = :id AND deleted_at IS NULL").get({ id });
    if (!row) {
      throw new ReminderNotFoundError(`Reminder ${id} was not found`);
    }
    return toReminder(row);
  }

  create(input: NewReminderInput): Reminder {
    const id = this.newId();
    const timestamp = this.timestamp();
    this.db
      .prepare(
        `INSERT INTO reminders (id, title, due_date, priority, created_at, updated_at)
         VALUES (:id, :title, :dueDate, :priority, :timestamp, :timestamp)`
      )
      .run({ id, title: input.title, dueDate: input.dueDate, priority: input.priority, timestamp });
    return this.get(id);
  }

  update(id: string, patch: ReminderPatch): Reminder {
    const current = this.get(id);
    const next = { ...current, ...patch };
    this.db
      .prepare(
        `UPDATE reminders
         SET title = :title, description = :description, due_date = :dueDate,
             priority = :priority, tags = :tags, updated_at = :updatedAt
         WHERE id = :id`
      )
      .run({
        id,
        title: next.title,
        description: next.description,
        dueDate: next.dueDate,
        priority: next.priority,
        tags: JSON.stringify(next.tags),
        updatedAt: this.timestamp(),
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

  /** Changes several due dates at once. Used by reschedule, "Reschedule all", and Undo. */
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
