import type { TFunction } from "i18next";
import type { AttentionCounts } from "../shared/grouping";
import type { DailySummary } from "../shared/summary";

/** "2 overdue, 3 for today" style counts, skipping zero values. */
export function formatCounts(t: TFunction, counts: AttentionCounts, namespace: "notification" | "tray"): string {
  const parts: string[] = [];
  if (counts.overdue > 0) {
    parts.push(t(`${namespace}.overdue`, { count: counts.overdue }));
  }
  if (counts.today > 0) {
    parts.push(t(`${namespace}.today`, { count: counts.today }));
  }
  return parts.join(", ");
}

export interface NotificationText {
  title: string;
  body: string;
}

/** The daily summary notification (FR-NOT-1). */
export function formatDailySummary(t: TFunction, summary: DailySummary): NotificationText {
  const lines = [...summary.titles];
  if (summary.moreCount > 0) {
    lines.push(t("notification.more", { count: summary.moreCount }));
  }
  return {
    title: formatCounts(t, { overdue: summary.overdueCount, today: summary.todayCount }, "notification"),
    body: lines.join("\n"),
  };
}

export function formatTrayTooltip(t: TFunction, counts: AttentionCounts): string {
  const details = formatCounts(t, counts, "tray");
  return `OmiReminder\n${details || t("tray.nothingToday")}`;
}
