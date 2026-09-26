import { addDays, toDateOnly } from "../../shared/dates";
import type { OmiApi, Priority, Reminder, ReminderListKind, Settings, Tag } from "../../shared/types";
import {
  tagNameKey,
  validateDueDateChanges,
  validateNewReminder,
  validateNewTag,
  validateReminderPatch,
  validateSettingsPatch,
  validateTagPatch,
} from "../../shared/validation";

/** An in-memory API with sample data, used only when the dev server runs in a plain browser. */
export function createMockApi(): OmiApi {
  const today = toDateOnly(new Date());
  const changeListeners = new Set<() => void>();
  let settings: Settings = { language: "en", theme: "system", launchAtStartup: true, notificationTime: "09:00" };
  let sequence = 0;

  function sampleTag(name: string, color: Tag["color"]): Tag {
    sequence += 1;
    const timestamp = new Date(Date.now() + sequence).toISOString();
    return { id: `tag-${String(sequence)}`, name, color, archivedAt: null, createdAt: timestamp, updatedAt: timestamp };
  }

  const tags: Tag[] = [sampleTag("Work", "blue"), sampleTag("Home", "green"), sampleTag("Shopify course", "purple")];
  const [work, home, course] = tags.map((tag) => tag.id) as [string, string, string];

  function sample(title: string, offset: number | null, priority: Priority = "normal"): Reminder {
    sequence += 1;
    const timestamp = new Date(Date.now() + sequence).toISOString();
    return {
      id: `sample-${String(sequence)}`,
      title,
      description: "",
      dueDate: offset === null ? null : addDays(today, offset),
      priority,
      tagIds: [],
      status: "active",
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  const reminders: Reminder[] = [
    { ...sample("Submit the expense report", -2, "high"), tagIds: [work] },
    sample("Renew the domain", -1),
    sample("Pay the electricity bill", 0, "high"),
    { ...sample("Water the plants", 0), tagIds: [home] },
    { ...sample("Read the design review", 0, "low"), description: "Notes from the last call.", tagIds: [work] },
    sample("Call the dentist", 3),
    sample("Buy a birthday gift", 3, "low"),
    { ...sample("Watch the theme lesson", null), tagIds: [course] },
    { ...sample("Set up a test store", null, "high"), tagIds: [course] },
    sample("Ideas for the weekend", null),
  ];

  function findTag(id: string): Tag {
    const tag = tags.find((item) => item.id === id && !deletedTags.has(item.id));
    if (!tag) {
      throw new Error(`Tag ${id} was not found`);
    }
    return tag;
  }

  function assertNameFree(name: string, exceptId: string | null): void {
    if (
      tags.some((tag) => tag.id !== exceptId && !deletedTags.has(tag.id) && tagNameKey(tag.name) === tagNameKey(name))
    ) {
      throw new Error(`A tag named ${name} already exists`);
    }
  }

  const deletedTags = new Set<string>();

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
      .map((reminder) => ({ ...reminder, tagIds: [...reminder.tagIds] }));
  }

  return {
    getEnvironment: () => Promise.resolve({ systemLocale: navigator.language, firstDayOfWeek: 1, today }),
    listReminders: (kind) => Promise.resolve(list(kind)),
    createReminder: (input) => {
      const valid = validateNewReminder(input);
      valid.tagIds.forEach(findTag);
      const reminder = { ...sample(valid.title, 0, valid.priority), dueDate: valid.dueDate, tagIds: valid.tagIds };
      reminders.push(reminder);
      return changed({ ...reminder });
    },
    updateReminder: (id, patch) => {
      const valid = validateReminderPatch(patch);
      valid.tagIds?.forEach(findTag);
      const reminder = Object.assign(find(id), valid, {
        updatedAt: new Date().toISOString(),
      });
      return changed({ ...reminder });
    },
    deleteReminder: (id) => {
      reminders.splice(reminders.indexOf(find(id)), 1);
      return changed(undefined);
    },
    completeReminder: (id) => {
      const now = new Date().toISOString();
      Object.assign(find(id), { status: "completed", completedAt: now, updatedAt: now });
      return changed(undefined);
    },
    reopenReminder: (id) => {
      Object.assign(find(id), { status: "active", completedAt: null, updatedAt: new Date().toISOString() });
      return changed(undefined);
    },
    setDueDates: (changes) => {
      for (const change of validateDueDateChanges(changes)) {
        find(change.id).dueDate = change.dueDate;
      }
      return changed(undefined);
    },
    listTags: () => Promise.resolve(tags.filter((tag) => !deletedTags.has(tag.id)).map((tag) => ({ ...tag }))),
    createTag: (input) => {
      const valid = validateNewTag(input);
      assertNameFree(valid.name, null);
      const tag = { ...sampleTag(valid.name, valid.color) };
      tags.push(tag);
      return changed({ ...tag });
    },
    updateTag: (id, patch) => {
      const valid = validateTagPatch(patch);
      const tag = findTag(id);
      if (valid.name !== undefined) {
        assertNameFree(valid.name, id);
        tag.name = valid.name;
      }
      if (valid.color !== undefined) {
        tag.color = valid.color;
      }
      if (valid.archived !== undefined) {
        tag.archivedAt = valid.archived ? (tag.archivedAt ?? new Date().toISOString()) : null;
      }
      tag.updatedAt = new Date().toISOString();
      return changed({ ...tag });
    },
    deleteTag: (id) => {
      findTag(id);
      deletedTags.add(id);
      for (const reminder of reminders) {
        reminder.tagIds = reminder.tagIds.filter((tagId) => tagId !== id);
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
