import { Menu, Tray } from "electron";
import type { i18n } from "i18next";
import type { AttentionCounts } from "../shared/grouping";
import { trayBadgeFor } from "./icons/icons";
import { createTrayIcon } from "./nativeIcons";
import { formatTrayTooltip } from "./summaryText";

export interface AppTrayActions {
  open: () => void;
  newReminder: () => void;
  quit: () => void;
}

/** The tray icon with the attention badge and menu (FR-DESK-2, FR-DESK-6). */
export class AppTray {
  private readonly tray: Tray;
  private counts: AttentionCounts = { overdue: 0, today: 0 };
  private badgeKey = "";

  constructor(
    private i18n: i18n,
    private readonly actions: AppTrayActions
  ) {
    this.tray = new Tray(createTrayIcon(null));
    this.tray.on("click", actions.open);
    this.renderMenu();
    this.renderTooltip();
  }

  setI18n(i18n: i18n): void {
    this.i18n = i18n;
    this.renderMenu();
    this.renderTooltip();
  }

  update(counts: AttentionCounts): void {
    this.counts = counts;
    const badge = trayBadgeFor(counts);
    const badgeKey = badge ? `${badge.label}:${badge.color.join(",")}` : "";
    if (badgeKey !== this.badgeKey) {
      this.badgeKey = badgeKey;
      this.tray.setImage(createTrayIcon(badge));
    }
    this.renderTooltip();
  }

  destroy(): void {
    this.tray.destroy();
  }

  private renderTooltip(): void {
    this.tray.setToolTip(formatTrayTooltip(this.i18n.t, this.counts));
  }

  private renderMenu(): void {
    const { t } = this.i18n;
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: t("tray.open"), click: this.actions.open },
        { label: t("tray.newReminder"), click: this.actions.newReminder },
        { type: "separator" },
        { label: t("tray.quit"), click: this.actions.quit },
      ])
    );
  }
}
