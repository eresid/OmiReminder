import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { makeReminder } from "../../../shared/testUtils";
import type { Reminder } from "../../../shared/types";
import { initI18n } from "../i18n";
import { useAppStore } from "../store";
import { ReminderRow } from "./ReminderRow";

function renderRow(reminder: Reminder) {
  useAppStore.setState({ today: "2026-09-27", tags: [] });
  return render(
    <ul>
      <ReminderRow reminder={reminder} />
    </ul>
  );
}

describe("ReminderRow priority", () => {
  beforeAll(() => {
    initI18n("en");
  });

  afterEach(() => {
    cleanup();
  });

  it("marks high priority with a flag and text (FR-MAIN-10)", () => {
    renderRow(makeReminder({ priority: "high" }));
    expect(screen.getByText("High").classList.contains("priority-high")).toBe(true);
  });

  it("marks low priority with text and a muted title", () => {
    renderRow(makeReminder({ priority: "low" }));
    expect(screen.getByText("Low")).toBeTruthy();
    expect(screen.getByRole("listitem").classList.contains("is-low-priority")).toBe(true);
  });

  it("keeps normal priority plain", () => {
    renderRow(makeReminder({ priority: "normal" }));
    expect(screen.queryByText("Normal")).toBeNull();
    expect(document.querySelector(".row-priority")).toBeNull();
  });

  it("does not show the priority of completed reminders", () => {
    renderRow(makeReminder({ priority: "high", status: "completed", completedAt: "2026-09-27T08:00:00.000Z" }));
    expect(screen.queryByText("High")).toBeNull();
  });
});
