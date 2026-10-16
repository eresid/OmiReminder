import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeReminder, makeTag } from "../../../shared/testUtils";
import { initI18n } from "../i18n";
import { useAppStore } from "../store";
import { EditDialog } from "./EditDialog";

const TODAY = "2026-09-25"; // Friday

describe("EditDialog", () => {
  const work = makeTag({ name: "Work" });
  const home = makeTag({ name: "Home" });
  const archived = makeTag({ name: "Workshop", archivedAt: "2026-01-01T00:00:00.000Z" });
  const reminder = makeReminder({
    title: "Report",
    description: "Quarterly numbers",
    dueDate: TODAY,
    priority: "high",
    tagIds: [work.id],
  });
  const updateReminder = vi.fn<() => Promise<void>>();
  const deleteReminder = vi.fn<() => Promise<void>>();

  beforeAll(() => {
    initI18n("en");
  });

  beforeEach(() => {
    updateReminder.mockReset().mockResolvedValue(undefined);
    deleteReminder.mockReset().mockResolvedValue(undefined);
    useAppStore.setState({
      today: TODAY,
      environment: { systemLocale: "en-GB", firstDayOfWeek: 1, today: TODAY },
      tags: [work, home, archived],
      active: [reminder],
      completed: [],
      editingId: reminder.id,
      updateReminder,
      deleteReminder,
    });
  });

  afterEach(() => {
    cleanup();
    useAppStore.setState({ editingId: null, tags: [], active: [], completed: [] });
  });

  const save = () => screen.getByRole<HTMLButtonElement>("button", { name: "Save" });
  const tagInput = () => screen.getByRole<HTMLInputElement>("combobox");
  const confirmDialog = () => screen.getByText("Delete this reminder?").parentElement as HTMLElement;
  const suggestions = () =>
    within(screen.getByRole("listbox", { name: "Tag suggestions" }))
      .getAllByRole("option")
      .map((option) => option.textContent);

  it("fills the form from the reminder and disables Save until something changes", () => {
    render(<EditDialog />);
    expect(screen.getByPlaceholderText<HTMLInputElement>("Reminder name").value).toBe("Report");
    expect(screen.getByPlaceholderText<HTMLTextAreaElement>("Description").value).toBe("Quarterly numbers");
    expect(screen.getByRole("button", { name: "Remove tag Work" })).toBeTruthy();
    expect(save().disabled).toBe(true);
  });

  it("saves only the changed fields", async () => {
    render(<EditDialog />);
    fireEvent.change(screen.getByPlaceholderText("Reminder name"), { target: { value: "  Final report " } });
    fireEvent.change(screen.getByPlaceholderText("Description"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Priority: High" }));
    fireEvent.click(screen.getByRole("option", { name: "Low" }));
    fireEvent.click(save());

    expect(updateReminder).toHaveBeenCalledWith(
      reminder.id,
      { title: "Final report", description: "", priority: "low" },
      []
    );
    await waitFor(() => {
      expect(useAppStore.getState().editingId).toBeNull();
    });
  });

  it("does not allow an empty title", () => {
    render(<EditDialog />);
    fireEvent.change(screen.getByPlaceholderText("Reminder name"), { target: { value: "   " } });
    expect(save().disabled).toBe(true);
  });

  it("clears the date with No date", () => {
    render(<EditDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Date: Today" }));
    fireEvent.click(screen.getByRole("button", { name: "No date" }));
    fireEvent.click(save());
    expect(updateReminder).toHaveBeenCalledWith(reminder.id, { dueDate: null }, []);
  });

  it("removes a tag", () => {
    render(<EditDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Remove tag Work" }));
    fireEvent.click(save());
    expect(updateReminder).toHaveBeenCalledWith(reminder.id, { tagIds: [] }, []);
  });

  it("suggests existing tags but not archived or already selected ones", () => {
    render(<EditDialog />);
    fireEvent.change(tagInput(), { target: { value: "wor" } });
    // "Work" is selected and "Workshop" is archived, so only the create option is left.
    expect(suggestions()).toEqual(["Create “wor”"]);

    fireEvent.change(tagInput(), { target: { value: "ho" } });
    expect(suggestions()).toEqual(["Home", "Create “ho”"]);
  });

  it("adds an existing tag by name ignoring case, without offering to create it", () => {
    render(<EditDialog />);
    fireEvent.change(tagInput(), { target: { value: "HOME" } });
    expect(suggestions()).toEqual(["Home"]);
    fireEvent.keyDown(tagInput(), { key: "Enter" });
    fireEvent.click(save());
    expect(updateReminder).toHaveBeenCalledWith(reminder.id, { tagIds: [work.id, home.id] }, []);
  });

  it("passes a brand-new tag name so the store can create it", () => {
    render(<EditDialog />);
    fireEvent.change(tagInput(), { target: { value: "Urgent" } });
    fireEvent.keyDown(tagInput(), { key: "," });
    fireEvent.click(save());
    expect(updateReminder).toHaveBeenCalledWith(reminder.id, { tagIds: [work.id] }, ["Urgent"]);
  });

  it("clears the tag draft with Escape and removes the last tag with Backspace", () => {
    render(<EditDialog />);
    fireEvent.change(tagInput(), { target: { value: "abc" } });
    fireEvent.keyDown(tagInput(), { key: "Escape" });
    expect(tagInput().value).toBe("");
    expect(screen.getByRole("button", { name: "Remove tag Work" })).toBeTruthy();

    fireEvent.keyDown(tagInput(), { key: "Backspace" });
    expect(screen.queryByRole("button", { name: "Remove tag Work" })).toBeNull();
  });

  it("deletes only after confirmation", () => {
    render(<EditDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteReminder).not.toHaveBeenCalled();

    fireEvent.click(within(confirmDialog()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Delete this reminder?")).toBeNull();
    expect(deleteReminder).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(within(confirmDialog()).getByRole("button", { name: "Delete" }));
    expect(deleteReminder).toHaveBeenCalledWith(reminder.id);
    expect(useAppStore.getState().editingId).toBeNull();
  });

  it("hides the date button for a completed reminder", () => {
    const done = makeReminder({ title: "Done", status: "completed", completedAt: "2026-09-24T10:00:00.000Z" });
    useAppStore.setState({ active: [], completed: [done], editingId: done.id });
    render(<EditDialog />);
    expect(screen.queryByRole("button", { name: /^Date:/ })).toBeNull();
    expect(screen.getByRole("button", { name: /^Priority:/ })).toBeTruthy();
  });
});
