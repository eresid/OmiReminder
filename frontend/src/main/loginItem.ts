/** Passed to the app when Windows starts it at sign-in, so it starts hidden in the tray (FR-DESK-3). */
export const HIDDEN_ARGUMENT = "--hidden";

/**
 * The name of the startup entry in the Windows registry. Without it, Electron uses the
 * AppUserModelId, which is the executable path here. A portable build runs from a temporary folder
 * that changes with every build, so each build added another entry, and turning the setting off
 * removed only the entry of the running build.
 */
export const LOGIN_ITEM_NAME = "OmiReminder";

export interface LoginItemSettings {
  openAtLogin: boolean;
  name: string;
  path: string;
  args: string[];
}

/**
 * Startup settings for the running build. A portable build runs from a temporary folder, so it
 * registers the original .exe that electron-builder passes in `PORTABLE_EXECUTABLE_FILE`.
 */
export function loginItemSettings(
  enabled: boolean,
  execPath: string,
  env: NodeJS.ProcessEnv = process.env
): LoginItemSettings {
  return {
    openAtLogin: enabled,
    name: LOGIN_ITEM_NAME,
    path: env.PORTABLE_EXECUTABLE_FILE ?? execPath,
    args: [HIDDEN_ARGUMENT],
  };
}
