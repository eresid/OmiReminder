import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toDateOnly } from "../../../shared/dates";
import type { Reminder } from "../../../shared/types";
import { useDateFormatter } from "../hooks";
import { useAppStore } from "../store";
import { Icon } from "./Icon";
import { DateMenu } from "./Pickers";
import { Popover, usePopover } from "./Popover";
import { TagDot } from "./TagDot";

const COMPLETE_ANIMATION_MS = 220;

interface ReminderRowProps {
  reminder: Reminder;
  /** Show the date in the row. Groups that already name the date hide it. */
  showDate?: boolean;
  /** Show when a completed reminder was completed. The main screen hides it. */
  showCompletedOn?: boolean;
  /** A tag page does not repeat its own tag in the rows. */
  hideTagId?: string;
}

export function ReminderRow({ reminder, showDate = false, showCompletedOn = true, hideTagId }: ReminderRowProps) {
  const { t } = useTranslation();
  const format = useDateFormatter();
  const today = useAppStore((state) => state.today);
  const completeReminder = useAppStore((state) => state.completeReminder);
  const reopenReminder = useAppStore((state) => state.reopenReminder);
  const reschedule = useAppStore((state) => state.reschedule);
  const openEditor = useAppStore((state) => state.openEditor);
  const tags = useAppStore((state) => state.tags);
  // The version of the reminder being completed. Any change to the reminder ends the animation.
  const [completingVersion, setCompletingVersion] = useState<string | null>(null);
  const rescheduleRef = useRef<HTMLButtonElement>(null);
  const popover = usePopover();

  const isCompleted = reminder.status === "completed";
  const isOverdue = !isCompleted && reminder.dueDate !== null && reminder.dueDate < today;
  // For a reminder without a date, the reschedule action sets the date (FR-NODATE-4).
  const rescheduleLabel = reminder.dueDate === null ? t("reminder.setDate") : t("reminder.reschedule");
  const completing = !isCompleted && completingVersion === reminder.updatedAt;

  function toggleCompleted(): void {
    if (isCompleted) {
      void reopenReminder(reminder);
      return;
    }
    setCompletingVersion(reminder.updatedAt);
    window.setTimeout(() => {
      void completeReminder(reminder);
    }, COMPLETE_ANIMATION_MS);
  }

  const meta: React.ReactNode[] = [];
  // Only priorities other than normal are marked, by icon and text as well as color (FR-MAIN-10).
  if (!isCompleted && reminder.priority !== "normal") {
    meta.push(
      <span key="priority" className={`row-priority priority-${reminder.priority}`}>
        <Icon
          name={reminder.priority === "high" ? "flag" : "arrowDown"}
          size={13}
          className={reminder.priority === "high" ? "priority-flag" : undefined}
        />
        {t(`priority.${reminder.priority}`)}
      </span>
    );
  }
  if (isCompleted) {
    if (showCompletedOn && reminder.completedAt) {
      meta.push(
        <span key="completed">
          {t("all.completedOn", { date: format.shortDate(toDateOnly(new Date(reminder.completedAt))) })}
        </span>
      );
    }
  } else if (showDate && reminder.dueDate !== null) {
    meta.push(
      <span key="date" className={isOverdue ? "tone-danger" : ""}>
        <Icon name="calendar" size={13} />
        {format.dayLabel(reminder.dueDate)}
      </span>
    );
  }
  if (reminder.description.trim()) {
    meta.push(
      <span key="description" className="meta-icon">
        <Icon name="description" size={13} />
      </span>
    );
  }
  for (const tagId of reminder.tagIds) {
    const tag = tags.find((item) => item.id === tagId);
    if (tag && tag.id !== hideTagId) {
      meta.push(
        <span key={`tag-${tag.id}`} className="tag">
          <TagDot color={tag.color} />
          {tag.name}
        </span>
      );
    }
  }

  return (
    <li
      className={[
        "row",
        isCompleted ? "is-completed" : "",
        reminder.priority === "low" ? "is-low-priority" : "",
        completing ? "is-completing" : "",
        popover.open ? "is-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className={`check priority-${reminder.priority}`}
        aria-label={isCompleted ? t("reminder.reopen") : t("reminder.complete")}
        aria-pressed={isCompleted || completing}
        disabled={completing}
        onClick={toggleCompleted}
      >
        <Icon name="check" size={12} />
      </button>
      <button
        type="button"
        className="row-main"
        onClick={() => {
          openEditor(reminder.id);
        }}
      >
        <span className="row-title">{reminder.title}</span>
        {meta.length > 0 ? <span className="row-meta">{meta}</span> : null}
      </button>
      {isCompleted ? null : (
        <div className="row-actions">
          <button
            ref={rescheduleRef}
            type="button"
            className="icon-button"
            aria-label={rescheduleLabel}
            title={rescheduleLabel}
            onClick={popover.toggle}
          >
            <Icon name="calendar" size={16} />
          </button>
          <Popover
            anchorRef={rescheduleRef}
            open={popover.open}
            onClose={popover.close}
            align="end"
            label={rescheduleLabel}
          >
            <DateMenu
              value={reminder.dueDate}
              onSelect={(date) => {
                popover.close();
                void reschedule([reminder], date);
              }}
            />
          </Popover>
        </div>
      )}
    </li>
  );
}
