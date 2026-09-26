export type Priority = "low" | "normal" | "high";

export type ReminderStatus = "active" | "completed" | "archived";

export type Language = "en" | "uk";

export type Theme = "system" | "light" | "dark";

export const TAG_COLORS = ["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"] as const;

export type TagColor = (typeof TAG_COLORS)[number];

export interface Reminder {
  id: string;
  title: string;
  description: string;
  /** Calendar date in `YYYY-MM-DD` format, or `null` for a reminder without a date (section 3.7). */
  dueDate: string | null;
  priority: Priority;
  /** IDs of the reminder's tags, in the order they were added. */
  tagIds: string[];
  status: ReminderStatus;
  /** UTC timestamp in ISO 8601 format, set while the reminder is completed. */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A project that groups reminders (section 3.6). */
export interface Tag {
  id: string;
  name: string;
  /** `null` means the neutral color. */
  color: TagColor | null;
  /** UTC timestamp, set while the tag is archived. */
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewReminderInput {
  title: string;
  dueDate: string | null;
  priority: Priority;
  tagIds: string[];
}

export interface ReminderPatch {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  tagIds?: string[];
}

export interface DueDateChange {
  id: string;
  dueDate: string | null;
}

export interface NewTagInput {
  name: string;
  color: TagColor | null;
}

export interface TagPatch {
  name?: string;
  color?: TagColor | null;
  archived?: boolean;
}

export interface Settings {
  language: Language;
  /** `system` follows the OS light or dark mode. */
  theme: Theme;
  launchAtStartup: boolean;
  /** Local clock time of the daily summary in `HH:MM` format. */
  notificationTime: string;
}

export interface Environment {
  systemLocale: string;
  /** ISO weekday: 1 is Monday, 7 is Sunday. */
  firstDayOfWeek: number;
  today: string;
}

/** A tag page is `tag:<id>`. Inbox lists reminders without tags (FR-TAG-4). */
export type View = "today" | "all" | "inbox" | "settings" | `tag:${string}`;

export type NavigationTarget = View | "quick-add";

export type ReminderListKind = "active" | "completed";

export interface OmiApi {
  getEnvironment(): Promise<Environment>;
  listReminders(kind: ReminderListKind): Promise<Reminder[]>;
  createReminder(input: NewReminderInput): Promise<Reminder>;
  updateReminder(id: string, patch: ReminderPatch): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
  completeReminder(id: string): Promise<void>;
  reopenReminder(id: string): Promise<void>;
  setDueDates(changes: DueDateChange[]): Promise<void>;
  /** All non-deleted tags, including archived ones. */
  listTags(): Promise<Tag[]>;
  createTag(input: NewTagInput): Promise<Tag>;
  updateTag(id: string, patch: TagPatch): Promise<Tag>;
  /** Soft-deletes the tag and removes it from its reminders (FR-TAG-8). */
  deleteTag(id: string): Promise<void>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  /** Called after any change to reminders or tags. */
  onRemindersChanged(listener: () => void): () => void;
  onTodayChanged(listener: (today: string) => void): () => void;
  onNavigate(listener: (target: NavigationTarget) => void): () => void;
}
