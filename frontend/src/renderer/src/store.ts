import { create } from "zustand";
import { addDays } from "../../shared/dates";
import { formattingLocale } from "../../shared/locale";
import { EMPTY_TAG_FILTER, pruneTagFilter, type TagFilter } from "../../shared/tagFilter";
import type {
  DueDateChange,
  Environment,
  NewReminderInput,
  Reminder,
  ReminderPatch,
  Settings,
  Tag,
  TagColor,
  TagPatch,
  View,
} from "../../shared/types";
import { tagNameKey } from "../../shared/validation";
import { api } from "./api";
import { createDateFormatter } from "./format";
import { changeLanguage, i18next } from "./i18n";
import { applyTheme } from "./theme";

/** Screens with a tag filter (FR-TAG-10). */
export type FilterScreen = "today" | "all";

export interface QuickAddDefaults {
  dueDate: string | null;
  tagIds: string[];
}

/** The tag of a tag page, or `null` for any other view. */
export function tagIdOfView(view: View): string | null {
  return view.startsWith("tag:") ? view.slice(4) : null;
}

export function tagView(id: string): View {
  return `tag:${id}`;
}

export function findTagByName(tags: readonly Tag[], name: string): Tag | undefined {
  const key = tagNameKey(name);
  return tags.find((tag) => tagNameKey(tag.name) === key);
}

export interface Toast {
  id: number;
  message: string;
  undo?: () => Promise<void>;
}

interface AppState {
  ready: boolean;
  environment: Environment;
  settings: Settings;
  today: string;
  active: Reminder[];
  completed: Reminder[];
  tags: Tag[];
  /** Kept per screen until the app quits and never saved (FR-TAG-12). */
  filters: Record<FilterScreen, TagFilter>;
  view: View;
  quickAddOpen: boolean;
  quickAddDefaults: QuickAddDefaults;
  editingId: string | null;
  toast: Toast | null;
}

interface AppActions {
  init: () => Promise<void>;
  reload: () => Promise<void>;
  setToday: (today: string) => void;
  setView: (view: View) => void;
  /**
   * Opens quick-add. On a tag page or in Inbox it defaults to "No date" and that tag (FR-TAG-5).
   * `fromView: false` uses the plain defaults, as for the tray and the global shortcut.
   */
  openQuickAdd: (options?: { fromView?: boolean }) => void;
  closeQuickAdd: () => void;
  openEditor: (id: string) => void;
  closeEditor: () => void;
  createReminder: (input: NewReminderInput) => Promise<void>;
  /** `newTagNames` are created as tags first and added to the reminder (FR-TAG-9). */
  updateReminder: (id: string, patch: ReminderPatch, newTagNames?: readonly string[]) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  completeReminder: (reminder: Reminder) => Promise<void>;
  reopenReminder: (reminder: Reminder) => Promise<void>;
  reschedule: (reminders: readonly Reminder[], dueDate: string) => Promise<void>;
  createTag: (name: string, color?: TagColor | null) => Promise<Tag | null>;
  updateTag: (id: string, patch: TagPatch) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  setFilter: (screen: FilterScreen, filter: TagFilter) => void;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  showToast: (message: string, undo?: () => Promise<void>) => void;
  dismissToast: () => void;
}

export type AppStore = AppState & AppActions;

let toastSequence = 0;

export const useAppStore = create<AppStore>()((set, get) => {
  async function guarded(work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (error) {
      console.error(error);
      get().showToast(i18next.t("toast.error"));
    }
  }

  function formatter() {
    const { settings, environment, today } = get();
    return createDateFormatter(formattingLocale(settings.language, environment.systemLocale), today, i18next.t);
  }

  return {
    ready: false,
    environment: { systemLocale: "en-US", firstDayOfWeek: 1, today: "1970-01-01" },
    settings: { language: "en", theme: "system", launchAtStartup: true, notificationTime: "09:00" },
    today: "1970-01-01",
    active: [],
    completed: [],
    tags: [],
    filters: { today: EMPTY_TAG_FILTER, all: EMPTY_TAG_FILTER },
    view: "today",
    quickAddOpen: false,
    quickAddDefaults: { dueDate: "1970-01-01", tagIds: [] },
    editingId: null,
    toast: null,

    async init() {
      const [environment, settings] = await Promise.all([api.getEnvironment(), api.getSettings()]);
      await changeLanguage(settings.language);
      applyTheme(settings.theme);
      set({ environment, settings, today: environment.today });
      await get().reload();
      set({ ready: true });
    },
    async reload() {
      const [active, completed, tags] = await Promise.all([
        api.listReminders("active"),
        api.listReminders("completed"),
        api.listTags(),
      ]);
      const selectable = new Set(tags.filter((tag) => tag.archivedAt === null).map((tag) => tag.id));
      const { filters } = get();
      set({
        active,
        completed,
        tags,
        filters: { today: pruneTagFilter(filters.today, selectable), all: pruneTagFilter(filters.all, selectable) },
      });
    },
    setToday(today) {
      set({ today });
    },
    setView(view) {
      set({ view });
    },
    openQuickAdd({ fromView = true } = {}) {
      const { view, today, tags } = get();
      const tagId = fromView ? tagIdOfView(view) : null;
      const onTagPage = tagId !== null && tags.some((tag) => tag.id === tagId);
      const quickAddDefaults: QuickAddDefaults =
        onTagPage || (fromView && view === "inbox")
          ? { dueDate: null, tagIds: onTagPage ? [tagId] : [] }
          : { dueDate: today, tagIds: [] };
      set({ quickAddOpen: true, quickAddDefaults, editingId: null });
    },
    closeQuickAdd() {
      set({ quickAddOpen: false });
    },
    openEditor(id) {
      set({ editingId: id, quickAddOpen: false });
    },
    closeEditor() {
      set({ editingId: null });
    },
    createReminder: (input) =>
      guarded(async () => {
        await api.createReminder(input);
      }),
    updateReminder: (id, patch, newTagNames = []) =>
      guarded(async () => {
        const created: string[] = [];
        for (const name of newTagNames) {
          const existing = findTagByName(get().tags, name);
          const tag = existing ?? (await api.createTag({ name, color: null }));
          created.push(tag.id);
        }
        const next = created.length > 0 ? { ...patch, tagIds: [...(patch.tagIds ?? []), ...created] } : patch;
        await api.updateReminder(id, next);
      }),
    deleteReminder: (id) =>
      guarded(async () => {
        await api.deleteReminder(id);
        get().showToast(i18next.t("toast.deleted"));
      }),
    completeReminder: (reminder) =>
      guarded(async () => {
        await api.completeReminder(reminder.id);
        get().showToast(i18next.t("toast.completed"), () => api.reopenReminder(reminder.id));
      }),
    reopenReminder: (reminder) =>
      guarded(async () => {
        await api.reopenReminder(reminder.id);
      }),
    reschedule: (reminders, dueDate) =>
      guarded(async () => {
        const moved = reminders.filter((reminder) => reminder.dueDate !== dueDate);
        if (moved.length === 0) {
          return;
        }
        const previous: DueDateChange[] = moved.map(({ id, dueDate: date }) => ({
          id,
          dueDate: date,
        }));
        await api.setDueDates(moved.map(({ id }) => ({ id, dueDate })));
        const { today } = get();
        const date =
          dueDate === today
            ? i18next.t("dates.toToday")
            : dueDate === addDays(today, 1)
              ? i18next.t("dates.toTomorrow")
              : formatter().shortDate(dueDate);
        const message =
          moved.length === 1
            ? i18next.t("toast.rescheduled", { date })
            : i18next.t("toast.rescheduledMany", { count: moved.length, date });
        get().showToast(message, () => api.setDueDates(previous));
      }),
    async createTag(name, color = null) {
      try {
        const tag = await api.createTag({ name, color });
        await get().reload();
        return tag;
      } catch (error) {
        console.error(error);
        get().showToast(i18next.t("toast.error"));
        return null;
      }
    },
    updateTag: (id, patch) =>
      guarded(async () => {
        await api.updateTag(id, patch);
      }),
    deleteTag: (id) =>
      guarded(async () => {
        await api.deleteTag(id);
        if (tagIdOfView(get().view) === id) {
          set({ view: "today" });
        }
        get().showToast(i18next.t("tags.deleted"));
      }),
    setFilter(screen, filter) {
      set({ filters: { ...get().filters, [screen]: filter } });
    },
    updateSettings: (patch) =>
      guarded(async () => {
        const settings = await api.updateSettings(patch);
        if (settings.language !== get().settings.language) {
          await changeLanguage(settings.language);
        }
        applyTheme(settings.theme);
        set({ settings });
      }),
    showToast(message, undo) {
      toastSequence += 1;
      set({ toast: { id: toastSequence, message, ...(undo ? { undo } : {}) } });
    },
    dismissToast() {
      set({ toast: null });
    },
  };
});

/** Tags in alphabetical order for the UI language (FR-TAG-2). */
export function sortTags(tags: readonly Tag[], language: string): Tag[] {
  return [...tags].sort((a, b) => a.name.localeCompare(b.name, language, { sensitivity: "base" }));
}
