import { describe, expect, it } from "vitest";
import { NewerSchemaError } from "./database";
import { createMainI18n } from "./i18n";
import { formatDailySummary, formatDataError, formatTrayTooltip } from "./summaryText";

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

  it("explains a database that cannot be opened", () => {
    const { t } = createMainI18n("en");
    const text = formatDataError(t, new Error("database disk image is malformed"), "C:\\data.sqlite");
    expect(text.title).toBe("OmiReminder could not open its data");
    expect(text.message).toContain("File: C:\\data.sqlite");
    expect(text.message).toContain("Error: database disk image is malformed");
  });

  it("asks to reinstall the newer version for a newer database", () => {
    const { t } = createMainI18n("uk");
    const text = formatDataError(t, new NewerSchemaError("newer"), "data.sqlite");
    expect(text.title).toBe("OmiReminder не може відкрити дані");
    expect(text.message).toContain("новішою версією");
    expect(text.message).not.toContain("Помилка");
  });
});
