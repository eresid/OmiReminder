import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { makeTag } from "../../../shared/testUtils";
import { initI18n } from "../i18n";
import { tagView, useAppStore } from "../store";
import { AddReminderButton } from "./AddReminderButton";

describe("AddReminderButton", () => {
  beforeAll(() => {
    initI18n("en");
  });

  afterEach(() => {
    cleanup();
    useAppStore.setState({ quickAddOpen: false, view: "today", tags: [] });
  });

  it("opens quick-add without a tag on the main screen", () => {
    useAppStore.setState({ view: "today", tags: [makeTag({ name: "Work" })] });
    render(<AddReminderButton />);
    fireEvent.click(screen.getByRole("button", { name: "Add reminder" }));
    expect(useAppStore.getState().quickAddOpen).toBe(true);
    expect(useAppStore.getState().quickAddDefaults.tagIds).toEqual([]);
  });

  it("presets the tag on a tag page", () => {
    const work = makeTag({ name: "Work" });
    useAppStore.setState({ view: tagView(work.id), tags: [work] });
    render(<AddReminderButton />);
    fireEvent.click(screen.getByRole("button", { name: "Add reminder" }));
    expect(useAppStore.getState().quickAddDefaults.tagIds).toEqual([work.id]);
  });
});
