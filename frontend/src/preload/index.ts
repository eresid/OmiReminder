import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import { IpcChannel } from "../shared/ipcChannels";
import type { NavigationTarget, OmiApi } from "../shared/types";

function subscribe(channel: string, listener: (payload: unknown) => void): () => void {
  const handler = (_event: IpcRendererEvent, payload: unknown): void => {
    listener(payload);
  };
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

// Only this narrow API is exposed to the renderer. It never gets direct access to Node.js or IPC.
const api: OmiApi = {
  getEnvironment: () => ipcRenderer.invoke(IpcChannel.getEnvironment),
  listReminders: (kind) => ipcRenderer.invoke(IpcChannel.listReminders, kind),
  createReminder: (input) => ipcRenderer.invoke(IpcChannel.createReminder, input),
  updateReminder: (id, patch) => ipcRenderer.invoke(IpcChannel.updateReminder, id, patch),
  deleteReminder: (id) => ipcRenderer.invoke(IpcChannel.deleteReminder, id),
  completeReminder: (id) => ipcRenderer.invoke(IpcChannel.completeReminder, id),
  reopenReminder: (id) => ipcRenderer.invoke(IpcChannel.reopenReminder, id),
  setDueDates: (changes) => ipcRenderer.invoke(IpcChannel.setDueDates, changes),
  getSettings: () => ipcRenderer.invoke(IpcChannel.getSettings),
  updateSettings: (patch) => ipcRenderer.invoke(IpcChannel.updateSettings, patch),
  onRemindersChanged: (listener) =>
    subscribe(IpcChannel.remindersChanged, () => {
      listener();
    }),
  onTodayChanged: (listener) =>
    subscribe(IpcChannel.todayChanged, (today) => {
      listener(today as string);
    }),
  onNavigate: (listener) =>
    subscribe(IpcChannel.navigate, (target) => {
      listener(target as NavigationTarget);
    }),
};

contextBridge.exposeInMainWorld("api", api);
