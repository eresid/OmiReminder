import { ipcMain } from "electron";
import { IpcChannel } from "../shared/ipcChannels";
import type { Environment, Settings } from "../shared/types";
import {
  validateDueDateChanges,
  validateId,
  validateListKind,
  validateNewReminder,
  validateReminderPatch,
  validateSettingsPatch,
} from "../shared/validation";
import type { ReminderRepository } from "./reminderRepository";
import type { SettingsRepository } from "./settingsRepository";

export interface IpcDependencies {
  reminders: ReminderRepository;
  settings: SettingsRepository;
  getEnvironment: () => Environment;
  onRemindersChanged: () => void;
  onSettingsChanged: (previous: Settings, next: Settings) => void;
}

/** Registers the handlers behind `window.api`. All input from the renderer is validated. */
export function registerIpcHandlers(deps: IpcDependencies): void {
  const { reminders, settings } = deps;

  function mutation<T>(work: () => T): T {
    const result = work();
    deps.onRemindersChanged();
    return result;
  }

  ipcMain.handle(IpcChannel.getEnvironment, () => deps.getEnvironment());
  ipcMain.handle(IpcChannel.listReminders, (_event, kind: unknown) => reminders.list(validateListKind(kind)));
  ipcMain.handle(IpcChannel.createReminder, (_event, input: unknown) =>
    mutation(() => reminders.create(validateNewReminder(input)))
  );
  ipcMain.handle(IpcChannel.updateReminder, (_event, id: unknown, patch: unknown) =>
    mutation(() => reminders.update(validateId(id), validateReminderPatch(patch)))
  );
  ipcMain.handle(IpcChannel.deleteReminder, (_event, id: unknown) => {
    mutation(() => {
      reminders.delete(validateId(id));
    });
  });
  ipcMain.handle(IpcChannel.completeReminder, (_event, id: unknown) => {
    mutation(() => {
      reminders.complete(validateId(id));
    });
  });
  ipcMain.handle(IpcChannel.reopenReminder, (_event, id: unknown) => {
    mutation(() => {
      reminders.reopen(validateId(id));
    });
  });
  ipcMain.handle(IpcChannel.setDueDates, (_event, changes: unknown) => {
    mutation(() => {
      reminders.setDueDates(validateDueDateChanges(changes));
    });
  });
  ipcMain.handle(IpcChannel.getSettings, () => settings.get());
  ipcMain.handle(IpcChannel.updateSettings, (_event, patch: unknown) => {
    const previous = settings.get();
    const next = settings.update(validateSettingsPatch(patch));
    deps.onSettingsChanged(previous, next);
    return next;
  });
}
