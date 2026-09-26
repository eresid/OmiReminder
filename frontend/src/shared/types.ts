export type Priority = "low" | "normal" | "high";

export type ReminderStatus = "active" | "completed" | "archived";

export type Language = "en" | "uk";

export interface Reminder {
  id: string;
  title: string;
  description: string;
  /** Calendar date in `YYYY-MM-DD` format. It has no time and no time zone. */
  dueDate: string;
  priority: Priority;
  tags: string[];
  status: ReminderStatus;
  /** UTC timestamp in ISO 8601 format, set while the reminder is completed. */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewReminderInput {
  title: string;
  dueDate: string;
  priority: Priority;
}

export interface ReminderPatch {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  tags?: string[];
}

export interface DueDateChange {
  id: string;
  dueDate: string;
}

export interface Settings {
  language: Language;
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

export type View = "today" | "all" | "settings";

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
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  onRemindersChanged(listener: () => void): () => void;
  onTodayChanged(listener: (today: string) => void): () => void;
  onNavigate(listener: (target: NavigationTarget) => void): () => void;
}
