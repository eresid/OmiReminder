import { describe, expect, it } from "vitest";
import { compareByDate, countAttention, groupForMainScreen } from "./grouping";
import { makeReminder } from "./testUtils";

const TODAY = "2026-09-25"; // Friday

describe("main screen groups", () => {
  it("splits reminders into overdue, today, and the next day that has reminders", () => {
    const overdue = makeReminder({ dueDate: "2026-09-20" });
    const today = makeReminder({ dueDate: TODAY });
    const monday = makeReminder({ dueDate: "2026-09-28" });
    const later = makeReminder({ dueDate: "2026-10-05" });
    const completed = makeReminder({ dueDate: TODAY, status: "completed" });

    const groups = groupForMainScreen([later, monday, today, overdue, completed], TODAY);

    expect(groups.overdue).toEqual([overdue]);
    expect(groups.today).toEqual([today, completed]);
    // The weekend is empty, so the next day with reminders is Monday.
    expect(groups.next).toEqual({ date: "2026-09-28", reminders: [monday] });
  });

  it("keeps completed reminders of today and the next day at the bottom, in completion order", () => {
    const high = makeReminder({ dueDate: TODAY, priority: "high" });
    const low = makeReminder({ dueDate: TODAY, priority: "low" });
    const doneLater = makeReminder({
      dueDate: TODAY,
      priority: "high",
      status: "completed",
      completedAt: "2026-09-25T10:00:00.000Z",
    });
    const doneEarlier = makeReminder({ dueDate: TODAY, status: "completed", completedAt: "2026-09-25T08:00:00.000Z" });
    const doneOverdue = makeReminder({ dueDate: "2026-09-20", status: "completed" });
    const archived = makeReminder({ dueDate: TODAY, status: "archived" });

    const groups = groupForMainScreen([doneLater, low, doneEarlier, high, doneOverdue, archived], TODAY);

    expect(groups.today).toEqual([high, low, doneEarlier, doneLater]);
    expect(groups.overdue).toEqual([]);
  });

  it("keeps the next day when all its reminders are completed", () => {
    const done = makeReminder({ dueDate: "2026-09-26", status: "completed" });
    const later = makeReminder({ dueDate: "2026-09-30" });
    expect(groupForMainScreen([later, done], TODAY).next).toEqual({ date: "2026-09-26", reminders: [done] });
  });

  it("has no next group when nothing is planned after today", () => {
    const groups = groupForMainScreen([makeReminder({ dueDate: TODAY })], TODAY);
    expect(groups.next).toBeNull();
  });

  it("sorts by priority, then date, then creation time", () => {
    const olderLow = makeReminder({ dueDate: "2026-09-01", priority: "low" });
    const newerHigh = makeReminder({ dueDate: "2026-09-20", priority: "high" });
    const olderNormal = makeReminder({ dueDate: "2026-09-01" });
    const newerNormal = makeReminder({ dueDate: "2026-09-20" });
    const sameDateLater = makeReminder({ dueDate: "2026-09-20" });

    const { overdue } = groupForMainScreen([olderLow, sameDateLater, newerNormal, olderNormal, newerHigh], TODAY);

    expect(overdue).toEqual([newerHigh, olderNormal, newerNormal, sameDateLater, olderLow]);
  });

  it("recalculates groups when the day changes at midnight", () => {
    const tomorrow = makeReminder({ dueDate: "2026-09-26" });
    expect(groupForMainScreen([tomorrow], TODAY).next?.date).toBe("2026-09-26");
    expect(groupForMainScreen([tomorrow], "2026-09-26").today).toEqual([tomorrow]);
    expect(groupForMainScreen([tomorrow], "2026-09-27").overdue).toEqual([tomorrow]);
  });

  it("counts overdue and today reminders for the badge", () => {
    const reminders = [
      makeReminder({ dueDate: "2026-09-24" }),
      makeReminder({ dueDate: TODAY }),
      makeReminder({ dueDate: TODAY }),
      makeReminder({ dueDate: "2026-09-26" }),
      makeReminder({ dueDate: "2026-09-24", status: "completed" }),
    ];
    expect(countAttention(reminders, TODAY)).toEqual({ overdue: 1, today: 2 });
  });

  it("orders the full list by date first", () => {
    const high = makeReminder({ dueDate: "2026-10-01", priority: "high" });
    const early = makeReminder({ dueDate: "2026-09-30", priority: "low" });
    expect([high, early].sort(compareByDate)).toEqual([early, high]);
  });
});
