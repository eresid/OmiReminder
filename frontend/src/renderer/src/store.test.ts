import { describe, expect, it, vi } from "vitest";
import { makeTag } from "../../shared/testUtils";
import { i18next } from "./i18n";
import { tagView, useAppStore } from "./store";

const TODAY = "2026-09-25";

describe("quick-add defaults", () => {
  const work = makeTag({ name: "Work" });

  function openOn(view: ReturnType<typeof tagView>, fromView = true) {
    useAppStore.setState({ today: TODAY, tags: [work], view, quickAddOpen: false });
    useAppStore.getState().openQuickAdd({ fromView });
    return useAppStore.getState().quickAddDefaults;
  }

  it("uses today everywhere and adds the tag of a tag page (FR-TAG-5)", () => {
    expect(openOn("today")).toEqual({ dueDate: TODAY, tagIds: [] });
    expect(openOn("inbox")).toEqual({ dueDate: TODAY, tagIds: [] });
    expect(openOn(tagView(work.id))).toEqual({ dueDate: TODAY, tagIds: [work.id] });
  });

  it("adds no tag when opened from the tray", () => {
    expect(openOn(tagView(work.id), false)).toEqual({ dueDate: TODAY, tagIds: [] });
  });
});

describe("toast undo", () => {
  it("shows an error toast instead of failing silently when Undo fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { showToast } = useAppStore.getState();
    showToast("Moved", () => Promise.reject(new Error("Reminder was not found")));

    const undo = useAppStore.getState().toast?.undo;
    expect(undo).toBeDefined();
    await expect(undo?.()).resolves.toBeUndefined();

    expect(useAppStore.getState().toast?.message).toBe(i18next.t("toast.error"));
    expect(useAppStore.getState().toast?.undo).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
