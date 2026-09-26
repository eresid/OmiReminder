import type { Theme } from "../../shared/types";

/**
 * Applies the theme chosen in settings. `system` removes the attribute, so the styles follow
 * `prefers-color-scheme`. In Electron the main process also sets `nativeTheme.themeSource`.
 */
export function applyTheme(theme: Theme): void {
  if (theme === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
}
