import { describe, expect, it } from "vitest";
import { makeTag } from "../../shared/testUtils";
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
