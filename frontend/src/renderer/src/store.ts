import { create } from "zustand";
import { addDays } from "../../shared/dates";
import { formattingLocale } from "../../shared/locale";
import type {
  DueDateChange,
  Environment,
  NewReminderInput,
  Reminder,
  ReminderPatch,
  Settings,
  View,
} from "../../shared/types";
import { api } from "./api";
import { createDateFormatter } from "./format";
import { changeLanguage, i18next } from "./i18n";

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
  view: View;
  quickAddOpen: boolean;
  editingId: string | null;
  toast: Toast | null;
}

interface AppActions {
  init: () => Promise<void>;
  reload: () => Promise<void>;
  setToday: (today: string) => void;
  setView: (view: View) => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  openEditor: (id: string) => void;
  closeEditor: () => void;
  createReminder: (input: NewReminderInput) => Promise<void>;
  updateReminder: (id: string, patch: ReminderPatch) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  completeReminder: (reminder: Reminder) => Promise<void>;
  reopenReminder: (reminder: Reminder) => Promise<void>;
  reschedule: (reminders: readonly Reminder[], dueDate: string) => Promise<void>;
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
    settings: { language: "en", launchAtStartup: true, notificationTime: "09:00" },
    today: "1970-01-01",
    active: [],
    completed: [],
    view: "today",
    quickAddOpen: false,
    editingId: null,
    toast: null,

    async init() {
      const [environment, settings] = await Promise.all([api.getEnvironment(), api.getSettings()]);
      await changeLanguage(settings.language);
      set({ environment, settings, today: environment.today });
      await get().reload();
      set({ ready: true });
    },
    async reload() {
      const [active, completed] = await Promise.all([api.listReminders("active"), api.listReminders("completed")]);
      set({ active, completed });
    },
    setToday(today) {
      set({ today });
    },
    setView(view) {
      set({ view });
    },
    openQuickAdd() {
      set({ quickAddOpen: true, editingId: null });
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
    updateReminder: (id, patch) =>
      guarded(async () => {
        await api.updateReminder(id, patch);
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
    updateSettings: (patch) =>
      guarded(async () => {
        const settings = await api.updateSettings(patch);
        if (settings.language !== get().settings.language) {
          await changeLanguage(settings.language);
        }
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
