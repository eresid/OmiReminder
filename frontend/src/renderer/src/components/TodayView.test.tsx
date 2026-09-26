import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { EMPTY_TAG_FILTER } from "../../../shared/tagFilter";
import { makeReminder, makeTag } from "../../../shared/testUtils";
import { initI18n } from "../i18n";
import { useAppStore } from "../store";
import { TodayView } from "./TodayView";

const TODAY = "2026-09-25"; // Friday

describe("TodayView", () => {
  beforeAll(() => {
    initI18n("en");
  });

  afterEach(() => {
    cleanup();
    useAppStore.setState({ tags: [], filters: { today: EMPTY_TAG_FILTER, all: EMPTY_TAG_FILTER } });
  });

  it("shows overdue reminders first, then today and the next day with reminders", () => {
    useAppStore.setState({
      today: TODAY,
      environment: { systemLocale: "en-GB", firstDayOfWeek: 1, today: TODAY },
      completed: [],
      active: [
        makeReminder({ title: "Next week", dueDate: "2026-10-02" }),
        makeReminder({ title: "Monday task", dueDate: "2026-09-28" }),
        makeReminder({ title: "Today low", dueDate: TODAY, priority: "low" }),
        makeReminder({ title: "Today high", dueDate: TODAY, priority: "high" }),
        makeReminder({ title: "Late", dueDate: "2026-09-20" }),
      ],
    });

    render(<TodayView />);

    const overdue = screen.getByRole("region", { name: "Overdue" });
    expect(within(overdue).getByText("Late")).toBeTruthy();
    expect(within(overdue).getByText("Reschedule", { selector: ".link-button" })).toBeTruthy();

    const today = screen.getByRole("region", { name: "Today" });
    const titles = within(today)
      .getAllByRole("listitem")
      .map((item) => item.querySelector(".row-title")?.textContent);
    expect(titles).toEqual(["Today high", "Today low"]);

    const next = screen.getByRole("region", { name: "Monday 28 September" });
    expect(within(next).getByText("Monday task")).toBeTruthy();
    expect(screen.queryByText("Next week")).toBeNull();
  });

  it("keeps completed reminders struck through at the bottom of their day", () => {
    useAppStore.setState({
      today: TODAY,
      active: [makeReminder({ title: "Still to do", dueDate: TODAY, priority: "low" })],
      completed: [
        makeReminder({ title: "Done today", dueDate: TODAY, priority: "high", status: "completed", completedAt: "x" }),
        makeReminder({ title: "Done earlier", dueDate: "2026-09-01", status: "completed", completedAt: "y" }),
      ],
    });

    render(<TodayView />);

    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.querySelector(".row-title")?.textContent)).toEqual(["Still to do", "Done today"]);
    expect(rows[1]?.classList.contains("is-completed")).toBe(true);
    expect(screen.getByRole("button", { name: "Mark as not completed" })).toBeTruthy();
  });

  it("shows an empty state when nothing is due", () => {
    useAppStore.setState({ today: TODAY, active: [], completed: [] });
    render(<TodayView />);
    expect(screen.getByText("All clear for today")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Overdue" })).toBeNull();
  });

  it("filters by tag and says how many reminders are hidden, including overdue", () => {
    const work = makeTag({ name: "Work" });
    const home = makeTag({ name: "Home" });
    useAppStore.setState({
      today: TODAY,
      tags: [work, home],
      completed: [],
      active: [
        makeReminder({ title: "Report", dueDate: TODAY, tagIds: [work.id] }),
        makeReminder({ title: "Late home task", dueDate: "2026-09-20", tagIds: [home.id] }),
        makeReminder({ title: "Untagged", dueDate: TODAY }),
        makeReminder({ title: "Someday work", dueDate: null, tagIds: [work.id] }),
      ],
      filters: { today: { tagIds: [work.id], untagged: false }, all: EMPTY_TAG_FILTER },
    });

    render(<TodayView />);

    expect(screen.getByText("Report")).toBeTruthy();
    expect(screen.queryByText("Late home task")).toBeNull();
    expect(screen.queryByText("Untagged")).toBeNull();
    // Reminders without a date are never on the main screen.
    expect(screen.queryByText("Someday work")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("2 hidden by the filter, 1 overdue");
    expect(screen.getByRole("button", { name: "Filter by tag: Work" })).toBeTruthy();
  });

  it("shows an empty state with a clear action when nothing matches the filter", () => {
    const work = makeTag({ name: "Work" });
    useAppStore.setState({
      today: TODAY,
      tags: [work],
      completed: [],
      active: [makeReminder({ title: "Untagged", dueDate: TODAY })],
      filters: { today: { tagIds: [work.id], untagged: false }, all: EMPTY_TAG_FILTER },
    });

    render(<TodayView />);

    expect(screen.getByText("Nothing matches the filter")).toBeTruthy();
    expect(screen.queryByText("All clear for today")).toBeNull();
  });
});
