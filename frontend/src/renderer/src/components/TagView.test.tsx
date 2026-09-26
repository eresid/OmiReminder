import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { makeReminder, makeTag } from "../../../shared/testUtils";
import { initI18n } from "../i18n";
import { useAppStore } from "../store";
import { TagView } from "./TagView";

const TODAY = "2026-09-25";

describe("TagView", () => {
  beforeAll(() => {
    initI18n("en");
  });

  afterEach(() => {
    cleanup();
    useAppStore.setState({ tags: [] });
  });

  it("lists the reminders of a tag, including ones without a date", () => {
    const course = makeTag({ name: "Shopify course" });
    const work = makeTag({ name: "Work" });
    useAppStore.setState({
      today: TODAY,
      tags: [course, work],
      active: [
        makeReminder({ title: "Late lesson", dueDate: "2026-09-20", tagIds: [course.id] }),
        makeReminder({ title: "Watch the lesson", dueDate: null, tagIds: [course.id, work.id] }),
        makeReminder({ title: "Next lesson", dueDate: "2026-10-10", tagIds: [course.id] }),
        makeReminder({ title: "Other work", dueDate: TODAY, tagIds: [work.id] }),
      ],
      completed: [makeReminder({ title: "First lesson", status: "completed", completedAt: "x", tagIds: [course.id] })],
    });

    render(<TagView tagId={course.id} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Shopify course");
    expect(within(screen.getByRole("region", { name: "Overdue" })).getByText("Late lesson")).toBeTruthy();
    const undated = screen.getByRole("region", { name: "No date" });
    expect(within(undated).getByText("Watch the lesson")).toBeTruthy();
    // The row shows the other tag, not the tag of the page.
    expect(within(undated).getByText("Work")).toBeTruthy();
    expect(within(undated).queryByText("Shopify course")).toBeNull();
    expect(within(undated).getByRole("button", { name: "Set date" })).toBeTruthy();
    expect(screen.getByText("Next lesson")).toBeTruthy();
    expect(screen.queryByText("Other work")).toBeNull();
    // Completed reminders are collapsed by default.
    expect(screen.getByRole("button", { name: "Completed" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("First lesson")).toBeNull();
  });

  it("shows reminders without tags in Inbox", () => {
    const work = makeTag({ name: "Work" });
    useAppStore.setState({
      today: TODAY,
      tags: [work],
      active: [
        makeReminder({ title: "Loose idea", dueDate: null }),
        makeReminder({ title: "Tagged", dueDate: null, tagIds: [work.id] }),
      ],
      completed: [],
    });

    render(<TagView tagId={null} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Inbox");
    expect(screen.getByText("Loose idea")).toBeTruthy();
    expect(screen.queryByText("Tagged")).toBeNull();
    expect(screen.queryByRole("button", { name: "Tag actions" })).toBeNull();
  });
});
