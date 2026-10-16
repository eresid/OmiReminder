import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { EMPTY_TAG_FILTER } from "../../../shared/tagFilter";
import { makeReminder, makeTag } from "../../../shared/testUtils";
import { initI18n } from "../i18n";
import { useAppStore, type AppStore } from "../store";
import { AllRemindersView } from "./AllRemindersView";

const TODAY = "2026-09-25"; // Friday

describe("AllRemindersView", () => {
  const work = makeTag({ name: "Work" });
  const home = makeTag({ name: "Home" });

  beforeAll(() => {
    initI18n("en");
  });

  afterEach(() => {
    cleanup();
    useAppStore.setState({
      tags: [],
      active: [],
      completed: [],
      filters: { today: EMPTY_TAG_FILTER, all: EMPTY_TAG_FILTER },
    });
  });

  function setState(overrides: Partial<AppStore> = {}): void {
    useAppStore.setState({
      today: TODAY,
      environment: { systemLocale: "en-GB", firstDayOfWeek: 1, today: TODAY },
      tags: [work, home],
      active: [],
      completed: [],
      filters: { today: EMPTY_TAG_FILTER, all: EMPTY_TAG_FILTER },
      ...overrides,
    });
  }

  it("groups active reminders with a date by day, overdue first, and leaves out those without a date", () => {
    setState({
      active: [
        makeReminder({ title: "Next week", dueDate: "2026-10-02" }),
        makeReminder({ title: "Late", dueDate: "2026-09-20" }),
        makeReminder({ title: "Today low", dueDate: TODAY, priority: "low" }),
        makeReminder({ title: "Today high", dueDate: TODAY, priority: "high" }),
        makeReminder({ title: "Someday", dueDate: null }),
      ],
    });
    render(<AllRemindersView />);

    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toMatch(/20/);
    expect(headings[1]).toMatch(/^Today/);
    expect(headings[2]).toMatch(/2/);
    const today = screen.getByRole("heading", { name: /^Today/ }).closest("section") as HTMLElement;
    expect(
      within(today)
        .getAllByRole("listitem")
        .map((item) => item.querySelector(".row-title")?.textContent)
    ).toEqual(["Today high", "Today low"]);
    expect(screen.queryByText("Someday")).toBeNull();
  });

  it("shows an empty state when there are no active reminders", () => {
    setState();
    render(<AllRemindersView />);
    expect(screen.getByText("No reminders yet")).toBeTruthy();
  });

  it("switches to completed reminders, which are a flat list", () => {
    setState({
      active: [makeReminder({ title: "Open", dueDate: TODAY })],
      completed: [
        makeReminder({
          title: "Finished",
          dueDate: "2026-09-01",
          status: "completed",
          completedAt: "2026-09-02T10:00:00.000Z",
        }),
      ],
    });
    render(<AllRemindersView />);
    expect(screen.getByRole("tab", { name: "Active" }).getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "Completed" }));
    expect(screen.getByRole("tab", { name: "Completed" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Finished")).toBeTruthy();
    expect(screen.queryByText("Open")).toBeNull();
    expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  });

  it("shows an empty state when nothing is completed", () => {
    setState({ active: [makeReminder({ dueDate: TODAY })] });
    render(<AllRemindersView />);
    fireEvent.click(screen.getByRole("tab", { name: "Completed" }));
    expect(screen.getByText("Nothing completed yet")).toBeTruthy();
  });

  it("applies the tag filter, reports hidden reminders, and clears the filter", () => {
    setState({
      active: [
        makeReminder({ title: "Report", dueDate: TODAY, tagIds: [work.id] }),
        makeReminder({ title: "Late home task", dueDate: "2026-09-20", tagIds: [home.id] }),
        makeReminder({ title: "Untagged", dueDate: TODAY }),
      ],
      filters: { today: EMPTY_TAG_FILTER, all: { tagIds: [work.id], untagged: false } },
    });
    render(<AllRemindersView />);

    expect(screen.getByText("Report")).toBeTruthy();
    expect(screen.queryByText("Late home task")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("2 hidden by the filter, 1 overdue");

    fireEvent.click(within(screen.getByRole("status")).getByRole("button", { name: "Clear filter" }));
    expect(screen.getByText("Late home task")).toBeTruthy();
    expect(screen.getByText("Untagged")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a clear action when the filter hides everything", () => {
    setState({
      active: [makeReminder({ title: "Untagged", dueDate: TODAY })],
      filters: { today: EMPTY_TAG_FILTER, all: { tagIds: [work.id], untagged: false } },
    });
    render(<AllRemindersView />);
    expect(screen.getByText("Nothing matches the filter")).toBeTruthy();

    const empty = screen.getByText("Nothing matches the filter").parentElement as HTMLElement;
    fireEvent.click(within(empty).getByRole("button", { name: "Clear filter" }));
    expect(screen.getByText("Untagged")).toBeTruthy();
  });

  it("builds the filter in the tag menu, including No tag", () => {
    setState({
      active: [
        makeReminder({ title: "Report", dueDate: TODAY, tagIds: [work.id] }),
        makeReminder({ title: "Chores", dueDate: TODAY, tagIds: [home.id] }),
        makeReminder({ title: "Untagged", dueDate: TODAY }),
      ],
    });
    render(<AllRemindersView />);
    fireEvent.click(screen.getByRole("button", { name: "Filter by tag" }));

    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Work" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "Work" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.queryByText("Chores")).toBeNull();

    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "No tag" }));
    expect(screen.getByText("Untagged")).toBeTruthy();
    expect(screen.getByText("Report")).toBeTruthy();
    expect(screen.queryByText("Chores")).toBeNull();

    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Work" }));
    expect(screen.queryByText("Report")).toBeNull();
    expect(useAppStore.getState().filters.all).toEqual({ tagIds: [], untagged: true });
  });

  it("keeps the filter of this screen separate from the main screen", () => {
    setState({ filters: { today: { tagIds: [work.id], untagged: false }, all: EMPTY_TAG_FILTER } });
    render(<AllRemindersView />);
    expect(screen.getByRole("button", { name: "Filter by tag" })).toBeTruthy();
  });
});
