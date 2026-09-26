import { describe, expect, it } from "vitest";
import {
  countHidden,
  EMPTY_TAG_FILTER,
  isTagFilterActive,
  matchesTagFilter,
  pruneTagFilter,
  remindersOfTag,
} from "./tagFilter";
import { makeReminder } from "./testUtils";

const TODAY = "2026-09-25";

describe("tag filter", () => {
  const work = makeReminder({ tagIds: ["work"] });
  const both = makeReminder({ tagIds: ["work", "home"] });
  const home = makeReminder({ tagIds: ["home"] });
  const untagged = makeReminder({ tagIds: [] });

  it("shows everything while nothing is selected", () => {
    expect(isTagFilterActive(EMPTY_TAG_FILTER)).toBe(false);
    expect(
      [work, both, home, untagged].filter((reminder) => matchesTagFilter(reminder, EMPTY_TAG_FILTER))
    ).toHaveLength(4);
  });

  it("shows reminders with any selected tag", () => {
    const filter = { tagIds: ["work"], untagged: false };
    expect([work, both, home, untagged].filter((reminder) => matchesTagFilter(reminder, filter))).toEqual([work, both]);
  });

  it("combines tags and No tag", () => {
    const filter = { tagIds: ["home"], untagged: true };
    expect([work, both, home, untagged].filter((reminder) => matchesTagFilter(reminder, filter))).toEqual([
      both,
      home,
      untagged,
    ]);
    const onlyUntagged = { tagIds: [], untagged: true };
    expect([work, untagged].filter((reminder) => matchesTagFilter(reminder, onlyUntagged))).toEqual([untagged]);
  });

  it("counts hidden reminders and how many of them are overdue", () => {
    const filter = { tagIds: ["work"], untagged: false };
    const reminders = [
      makeReminder({ tagIds: ["home"], dueDate: "2026-09-20" }),
      makeReminder({ tagIds: [], dueDate: TODAY }),
      makeReminder({ tagIds: ["home"], dueDate: "2026-09-20", status: "completed" }),
      makeReminder({ tagIds: ["work"], dueDate: "2026-09-20" }),
    ];
    expect(countHidden(reminders, filter, TODAY)).toEqual({ hidden: 3, overdue: 1 });
    expect(countHidden(reminders, EMPTY_TAG_FILTER, TODAY)).toEqual({ hidden: 0, overdue: 0 });
  });

  it("drops tags that can no longer be selected", () => {
    const filter = { tagIds: ["work", "archived"], untagged: true };
    expect(pruneTagFilter(filter, new Set(["work"]))).toEqual({ tagIds: ["work"], untagged: true });
    expect(pruneTagFilter(filter, new Set(["work", "archived"]))).toBe(filter);
  });

  it("selects reminders of a tag page and of Inbox", () => {
    expect(remindersOfTag([work, both, home, untagged], "home")).toEqual([both, home]);
    expect(remindersOfTag([work, both, home, untagged], null)).toEqual([untagged]);
  });
});
