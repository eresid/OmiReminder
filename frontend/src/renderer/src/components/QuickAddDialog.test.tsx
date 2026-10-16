import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTag } from "../../../shared/testUtils";
import { initI18n } from "../i18n";
import { useAppStore } from "../store";
import { QuickAddDialog } from "./QuickAddDialog";

const TODAY = "2026-09-25"; // Friday

describe("QuickAddDialog", () => {
  const work = makeTag({ name: "Work" });
  const createReminder = vi.fn<() => Promise<void>>();

  beforeAll(() => {
    initI18n("en");
  });

  beforeEach(() => {
    createReminder.mockReset().mockResolvedValue(undefined);
    useAppStore.setState({
      today: TODAY,
      environment: { systemLocale: "en-GB", firstDayOfWeek: 1, today: TODAY },
      tags: [work],
      quickAddOpen: true,
      quickAddDefaults: { dueDate: TODAY, tagIds: [work.id] },
      createReminder,
    });
  });

  afterEach(() => {
    cleanup();
    useAppStore.setState({ quickAddOpen: false });
  });

  function typeTitle(value: string): void {
    fireEvent.change(screen.getByPlaceholderText("Reminder name"), { target: { value } });
  }

  it("cannot be submitted without a title", () => {
    render(<QuickAddDialog />);
    const submit = screen.getByRole<HTMLButtonElement>("button", { name: "Add reminder" });
    expect(submit.disabled).toBe(true);
    typeTitle("   ");
    expect(submit.disabled).toBe(true);
    typeTitle("Call mum");
    expect(submit.disabled).toBe(false);
  });

  it("creates a reminder with the defaults and closes", async () => {
    render(<QuickAddDialog />);
    typeTitle("  Call mum  ");
    fireEvent.click(screen.getByRole("button", { name: "Add reminder" }));

    expect(createReminder).toHaveBeenCalledWith({
      title: "Call mum",
      dueDate: TODAY,
      priority: "normal",
      tagIds: [work.id],
    });
    await waitFor(() => {
      expect(useAppStore.getState().quickAddOpen).toBe(false);
    });
  });

  it("sends the chosen date, priority, and removed tag", () => {
    render(<QuickAddDialog />);
    typeTitle("Pay rent");
    fireEvent.click(screen.getByRole("button", { name: "Date: Today" }));
    fireEvent.click(screen.getByRole("button", { name: /^Tomorrow/ }));
    fireEvent.click(screen.getByRole("button", { name: "Priority: Normal" }));
    fireEvent.click(screen.getByRole("option", { name: "High" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove tag Work" }));
    fireEvent.click(screen.getByRole("button", { name: "Add reminder" }));

    expect(createReminder).toHaveBeenCalledWith({
      title: "Pay rent",
      dueDate: "2026-09-26",
      priority: "high",
      tagIds: [],
    });
  });

  it("creates a reminder without a date", () => {
    render(<QuickAddDialog />);
    typeTitle("Someday");
    fireEvent.click(screen.getByRole("button", { name: "Date: Today" }));
    fireEvent.click(screen.getByRole("button", { name: "No date" }));
    fireEvent.click(screen.getByRole("button", { name: "Add reminder" }));

    expect(createReminder).toHaveBeenCalledWith(expect.objectContaining({ title: "Someday", dueDate: null }));
  });

  it("closes on Cancel without creating anything", () => {
    render(<QuickAddDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(useAppStore.getState().quickAddOpen).toBe(false);
    expect(createReminder).not.toHaveBeenCalled();
  });
});
