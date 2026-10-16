import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { initI18n } from "../i18n";
import { useAppStore } from "../store";
import { Calendar } from "./Calendar";
import { DateButton, PriorityButton } from "./Pickers";

const TODAY = "2026-09-25"; // Friday

function setEnvironment(firstDayOfWeek: number): void {
  useAppStore.setState({
    today: TODAY,
    environment: { systemLocale: "en-GB", firstDayOfWeek, today: TODAY },
  });
}

/** Empty cells before the first day of the month in the calendar grid. */
function leadingEmptyCells(container: HTMLElement): number {
  const cells = Array.from(container.querySelector(".calendar-grid")?.children ?? []).slice(7);
  return cells.findIndex((cell) => cell.tagName === "BUTTON");
}

describe("Calendar", () => {
  beforeAll(() => {
    initI18n("en");
  });

  beforeEach(() => {
    setEnvironment(1);
  });

  afterEach(cleanup);

  const day = (name: string) => screen.getByRole<HTMLButtonElement>("gridcell", { name });

  it("shows the month of the value and disables days before the minimum date", () => {
    render(<Calendar value="2026-09-28" minDate={TODAY} onSelect={() => undefined} />);
    expect(screen.getByText("September 2026")).toBeTruthy();
    expect(screen.getAllByRole("gridcell")).toHaveLength(30);
    expect(day("Thursday 24 September").disabled).toBe(true);
    expect(day("Friday 25 September").disabled).toBe(false);
    expect(day("Monday 28 September").getAttribute("aria-selected")).toBe("true");
  });

  it("falls back to the month of the minimum date when the value is in the past", () => {
    render(<Calendar value="2026-01-10" minDate={TODAY} onSelect={() => undefined} />);
    expect(screen.getByText("September 2026")).toBeTruthy();
  });

  it("reports the selected date", () => {
    const onSelect = vi.fn();
    render(<Calendar value={null} minDate={TODAY} onSelect={onSelect} />);
    fireEvent.click(day("Sunday 27 September"));
    expect(onSelect).toHaveBeenCalledWith("2026-09-27");
  });

  it("moves between months and cannot go before the month of the minimum date", () => {
    render(<Calendar value={null} minDate={TODAY} onSelect={() => undefined} />);
    const previous = screen.getByRole<HTMLButtonElement>("button", { name: "Previous month" });
    expect(previous.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("October 2026")).toBeTruthy();
    expect(screen.getAllByRole("gridcell")).toHaveLength(31);
    expect(previous.disabled).toBe(false);

    fireEvent.click(previous);
    expect(screen.getByText("September 2026")).toBeTruthy();
  });

  it("offsets the first day of the month by the configured first day of the week", () => {
    // 1 September 2026 is a Tuesday: one empty cell on a Monday start, two on a Sunday start.
    const monday = render(<Calendar value={null} minDate="2026-09-01" onSelect={() => undefined} />);
    expect(leadingEmptyCells(monday.container)).toBe(1);
    monday.unmount();

    setEnvironment(7);
    const sunday = render(<Calendar value={null} minDate="2026-09-01" onSelect={() => undefined} />);
    expect(leadingEmptyCells(sunday.container)).toBe(2);
  });
});

describe("DateButton", () => {
  beforeAll(() => {
    initI18n("en");
  });

  beforeEach(() => {
    setEnvironment(1);
  });

  afterEach(cleanup);

  it("labels the button with the date and offers quick options", () => {
    const onChange = vi.fn();
    render(<DateButton value="2026-09-26" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Date: Tomorrow" }));
    fireEvent.click(screen.getByRole("button", { name: /^Today/ }));
    expect(onChange).toHaveBeenCalledWith(TODAY);
  });

  it("shows No date and picks a date from the calendar", () => {
    const onChange = vi.fn();
    render(<DateButton value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Date: No date" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "Wednesday 30 September" }));
    expect(onChange).toHaveBeenCalledWith("2026-09-30");
  });

  it("clears the date", () => {
    const onChange = vi.fn();
    render(<DateButton value={TODAY} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Date: Today" }));
    fireEvent.click(screen.getByRole("button", { name: "No date" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("PriorityButton", () => {
  beforeAll(() => {
    initI18n("en");
  });

  afterEach(cleanup);

  it("shows the current priority and changes it", () => {
    const onChange = vi.fn();
    render(<PriorityButton value="normal" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Priority: Normal" }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["High", "Normal", "Low"]);
    expect(screen.getByRole("option", { name: "Normal" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("option", { name: "High" }));
    expect(onChange).toHaveBeenCalledWith("high");
  });
});
