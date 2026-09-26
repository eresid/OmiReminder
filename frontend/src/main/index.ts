import { join } from "node:path";
import { app, BrowserWindow, Menu, Notification, nativeTheme, powerMonitor, shell } from "electron";
import type { i18n } from "i18next";
import { countAttention } from "../shared/grouping";
import { IpcChannel } from "../shared/ipcChannels";
import { firstDayOfWeek, resolveLanguage } from "../shared/locale";
import { buildDailySummary } from "../shared/summary";
import type { NavigationTarget, Settings } from "../shared/types";
import { AppTray } from "./appTray";
import { openDatabase } from "./database";
import { DayScheduler } from "./dayScheduler";
import { createMainI18n } from "./i18n";
import { registerIpcHandlers } from "./ipc";
import { createAppIcon } from "./nativeIcons";
import { ReminderRepository } from "./reminderRepository";
import { SettingsRepository } from "./settingsRepository";
import { formatDailySummary } from "./summaryText";

const APP_ID = "net.omisoft.omireminder";
const HIDDEN_ARGUMENT = "--hidden";

app.setName("OmiReminder");
// Keep development data apart from the data of an installed app.
if (!app.isPackaged) {
  app.setPath("userData", join(app.getPath("appData"), "OmiReminder-dev"));
}

// Only one instance runs at a time (FR-DESK-4).
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  void app.whenReady().then(start);
}

function start(): void {
  // Windows shows notifications only for a known app ID. In development the Electron binary is
  // used as the ID, because there is no Start menu shortcut with the app ID.
  app.setAppUserModelId(app.isPackaged ? APP_ID : process.execPath);
  Menu.setApplicationMenu(null);

  const db = openDatabase(join(app.getPath("userData"), "omireminder.sqlite"));
  const reminders = new ReminderRepository(db);
  const settings = new SettingsRepository(db, resolveLanguage(app.getPreferredSystemLanguages()));
  settings.ensureLanguage();

  let i18n: i18n = createMainI18n(settings.get().language);
  let mainWindow: BrowserWindow | null = null;
  let isQuitting = false;
  // Keep references, otherwise a notification can be garbage-collected with its click handler.
  const shownNotifications = new Set<Notification>();

  function sendToWindow(channel: string, ...args: unknown[]): void {
    mainWindow?.webContents.send(channel, ...args);
  }

  function showWindow(target?: NavigationTarget): void {
    const window = mainWindow ?? createMainWindow();
    if (window.isMinimized()) {
      window.restore();
    }
    window.show();
    window.focus();
    if (target) {
      if (window.webContents.isLoading()) {
        window.webContents.once("did-finish-load", () => {
          window.webContents.send(IpcChannel.navigate, target);
        });
      } else {
        window.webContents.send(IpcChannel.navigate, target);
      }
    }
  }

  function createMainWindow(): BrowserWindow {
    const window = new BrowserWindow({
      width: 1000,
      height: 720,
      minWidth: 640,
      minHeight: 480,
      show: false,
      title: "OmiReminder",
      icon: createAppIcon(),
      backgroundColor: nativeTheme.shouldUseDarkColors ? "#1c1c1e" : "#ffffff",
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    // Closing the window hides it to the tray instead of quitting (FR-DESK-2).
    window.on("close", (event) => {
      if (!isQuitting) {
        event.preventDefault();
        window.hide();
      }
    });
    window.on("closed", () => {
      mainWindow = null;
    });

    // Open links in the default browser, never inside the app.
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("https://") || url.startsWith("http://")) {
        void shell.openExternal(url);
      }
      return { action: "deny" };
    });
    window.webContents.on("will-navigate", (event) => {
      event.preventDefault();
    });

    const devServerUrl = process.env.ELECTRON_RENDERER_URL;
    if (!app.isPackaged && devServerUrl) {
      void window.loadURL(devServerUrl);
    } else {
      void window.loadFile(join(__dirname, "../renderer/index.html"));
    }
    mainWindow = window;
    return window;
  }

  const scheduler = new DayScheduler({
    getNotificationTime: () => settings.get().notificationTime,
    getLastSummaryDate: () => settings.getLastSummaryDate(),
    setLastSummaryDate: (date) => {
      settings.setLastSummaryDate(date);
    },
    onDayChanged: (today) => {
      refreshTray();
      sendToWindow(IpcChannel.todayChanged, today);
    },
    onSummaryDue: showDailySummary,
  });

  const tray = new AppTray(i18n, {
    open: () => {
      showWindow("today");
    },
    newReminder: () => {
      showWindow("quick-add");
    },
    quit: () => {
      app.quit();
    },
  });

  function refreshTray(): void {
    tray.update(countAttention(reminders.list("active"), scheduler.getToday()));
  }

  function showDailySummary(today: string): void {
    const summary = buildDailySummary(reminders.list("active"), today);
    if (!summary || !Notification.isSupported()) {
      return;
    }
    const text = formatDailySummary(i18n.t, summary);
    const notification = new Notification({
      title: text.title,
      body: text.body,
      icon: createAppIcon(),
      silent: false,
    });
    notification.on("click", () => {
      shownNotifications.delete(notification);
      showWindow("today");
    });
    notification.on("close", () => {
      shownNotifications.delete(notification);
    });
    shownNotifications.add(notification);
    notification.show();
  }

  function applyLaunchAtStartup(enabled: boolean): void {
    // In development this would register the bare Electron binary, so only installed builds do it.
    if (app.isPackaged) {
      app.setLoginItemSettings({ openAtLogin: enabled, args: [HIDDEN_ARGUMENT] });
    }
  }

  registerIpcHandlers({
    reminders,
    settings,
    getEnvironment: () => {
      const systemLocale = app.getSystemLocale();
      return {
        systemLocale,
        firstDayOfWeek: firstDayOfWeek(systemLocale),
        today: scheduler.getToday(),
      };
    },
    onRemindersChanged: () => {
      refreshTray();
      sendToWindow(IpcChannel.remindersChanged);
    },
    onSettingsChanged: (previous: Settings, next: Settings) => {
      if (previous.language !== next.language) {
        i18n = createMainI18n(next.language);
        tray.setI18n(i18n);
      }
      if (previous.launchAtStartup !== next.launchAtStartup) {
        applyLaunchAtStartup(next.launchAtStartup);
      }
      if (previous.notificationTime !== next.notificationTime) {
        scheduler.tick();
      }
    },
  });

  app.on("second-instance", () => {
    showWindow();
  });
  app.on("before-quit", () => {
    isQuitting = true;
  });
  app.on("will-quit", () => {
    scheduler.stop();
    tray.destroy();
    shownNotifications.clear();
    db.close();
  });
  // The app keeps running in the tray when the window is closed.
  app.on("window-all-closed", () => undefined);

  powerMonitor.on("resume", () => {
    scheduler.tick();
  });
  powerMonitor.on("unlock-screen", () => {
    scheduler.tick();
  });

  applyLaunchAtStartup(settings.get().launchAtStartup);
  const window = createMainWindow();
  // After launch at startup the app starts hidden in the tray.
  if (!process.argv.includes(HIDDEN_ARGUMENT)) {
    window.once("ready-to-show", () => {
      window.show();
    });
  }
  refreshTray();
  scheduler.start();
}
