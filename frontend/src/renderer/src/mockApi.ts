import { addDays, toDateOnly } from "../../shared/dates";
import type { OmiApi, Priority, Reminder, ReminderListKind, Settings } from "../../shared/types";
import {
  validateDueDateChanges,
  validateNewReminder,
  validateReminderPatch,
  validateSettingsPatch,
} from "../../shared/validation";

/** An in-memory API with sample data, used only when the dev server runs in a plain browser. */
export function createMockApi(): OmiApi {
  const today = toDateOnly(new Date());
  const changeListeners = new Set<() => void>();
  let settings: Settings = { language: "en", launchAtStartup: true, notificationTime: "09:00" };
  let sequence = 0;

  function sample(title: string, offset: number, priority: Priority = "normal"): Reminder {
    sequence += 1;
    const timestamp = new Date(Date.now() + sequence).toISOString();
    return {
      id: `sample-${String(sequence)}`,
      title,
      description: "",
      dueDate: addDays(today, offset),
      priority,
      tags: [],
      status: "active",
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  const reminders: Reminder[] = [
    sample("Submit the expense report", -2, "high"),
    sample("Renew the domain", -1),
    sample("Pay the electricity bill", 0, "high"),
    { ...sample("Water the plants", 0), tags: ["home"] },
    { ...sample("Read the design review", 0, "low"), description: "Notes from the last call." },
    sample("Call the dentist", 3),
    sample("Buy a birthday gift", 3, "low"),
  ];

  function find(id: string): Reminder {
    const reminder = reminders.find((item) => item.id === id);
    if (!reminder) {
      throw new Error(`Reminder ${id} was not found`);
    }
    return reminder;
  }

  function changed<T>(result: T): Promise<T> {
    queueMicrotask(() => {
      changeListeners.forEach((listener) => {
        listener();
      });
    });
    return Promise.resolve(result);
  }

  function list(kind: ReminderListKind): Reminder[] {
    return reminders
      .filter((reminder) => reminder.status === kind)
      .map((reminder) => ({ ...reminder, tags: [...reminder.tags] }));
  }

  return {
    getEnvironment: () => Promise.resolve({ systemLocale: navigator.language, firstDayOfWeek: 1, today }),
    listReminders: (kind) => Promise.resolve(list(kind)),
    createReminder: (input) => {
      const valid = validateNewReminder(input);
      const reminder = { ...sample(valid.title, 0, valid.priority), dueDate: valid.dueDate };
      reminders.push(reminder);
      return changed({ ...reminder });
    },
    updateReminder: (id, patch) => {
      const reminder = Object.assign(find(id), validateReminderPatch(patch), {
        updatedAt: new Date().toISOString(),
      });
      return changed({ ...reminder });
    },
    deleteReminder: (id) => {
      reminders.splice(reminders.indexOf(find(id)), 1);
      return changed(undefined);
    },
    completeReminder: (id) => {
      Object.assign(find(id), { status: "completed", completedAt: new Date().toISOString() });
      return changed(undefined);
    },
    reopenReminder: (id) => {
      Object.assign(find(id), { status: "active", completedAt: null });
      return changed(undefined);
    },
    setDueDates: (changes) => {
      for (const change of validateDueDateChanges(changes)) {
        find(change.id).dueDate = change.dueDate;
      }
      return changed(undefined);
    },
    getSettings: () => Promise.resolve({ ...settings }),
    updateSettings: (patch) => {
      settings = { ...settings, ...validateSettingsPatch(patch) };
      return Promise.resolve({ ...settings });
    },
    onRemindersChanged: (listener) => {
      changeListeners.add(listener);
      return () => {
        changeListeners.delete(listener);
      };
    },
    onTodayChanged: () => () => undefined,
    onNavigate: () => () => undefined,
  };
}
