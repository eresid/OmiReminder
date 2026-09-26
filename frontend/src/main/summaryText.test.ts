import { describe, expect, it } from "vitest";
import { createMainI18n } from "./i18n";
import { formatDailySummary, formatTrayTooltip } from "./summaryText";

describe("summary text", () => {
  it("formats the daily notification in English", () => {
    const { t } = createMainI18n("en");
    expect(formatDailySummary(t, { overdueCount: 2, todayCount: 1, titles: ["A", "B", "C"], moreCount: 4 })).toEqual({
      title: "2 overdue, 1 for today",
      body: "A\nB\nC\nand 4 more",
    });
  });

  it("uses Ukrainian plural forms", () => {
    const { t } = createMainI18n("uk");
    expect(formatDailySummary(t, { overdueCount: 0, todayCount: 5, titles: ["A"], moreCount: 0 }).title).toBe(
      "5 на сьогодні"
    );
    expect(formatTrayTooltip(t, { overdue: 2, today: 0 })).toBe("OmiReminder\n2 прострочені");
    expect(formatTrayTooltip(t, { overdue: 5, today: 0 })).toBe("OmiReminder\n5 прострочених");
  });

  it("says when there is nothing for today", () => {
    const { t } = createMainI18n("en");
    expect(formatTrayTooltip(t, { overdue: 0, today: 0 })).toBe("OmiReminder\nNothing for today");
  });
});
