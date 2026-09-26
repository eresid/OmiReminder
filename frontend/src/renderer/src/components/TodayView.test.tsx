import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { makeReminder } from "../../../shared/testUtils";
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
  });

  it("shows overdue reminders first, then today and the next day with reminders", () => {
    useAppStore.setState({
      today: TODAY,
      environment: { systemLocale: "en-GB", firstDayOfWeek: 1, today: TODAY },
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

  it("shows an empty state when nothing is due", () => {
    useAppStore.setState({ today: TODAY, active: [] });
    render(<TodayView />);
    expect(screen.getByText("All clear for today")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Overdue" })).toBeNull();
  });
});
