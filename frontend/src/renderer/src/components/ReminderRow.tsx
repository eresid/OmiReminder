import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toDateOnly } from "../../../shared/dates";
import type { Reminder } from "../../../shared/types";
import { useDateFormatter } from "../hooks";
import { useAppStore } from "../store";
import { Icon } from "./Icon";
import { DateMenu } from "./Pickers";
import { Popover, usePopover } from "./Popover";

const COMPLETE_ANIMATION_MS = 220;

interface ReminderRowProps {
  reminder: Reminder;
  /** Show the date in the row. Groups that already name the date hide it. */
  showDate?: boolean;
}

export function ReminderRow({ reminder, showDate = false }: ReminderRowProps) {
  const { t } = useTranslation();
  const format = useDateFormatter();
  const today = useAppStore((state) => state.today);
  const completeReminder = useAppStore((state) => state.completeReminder);
  const reopenReminder = useAppStore((state) => state.reopenReminder);
  const reschedule = useAppStore((state) => state.reschedule);
  const openEditor = useAppStore((state) => state.openEditor);
  const [completing, setCompleting] = useState(false);
  const rescheduleRef = useRef<HTMLButtonElement>(null);
  const popover = usePopover();

  const isCompleted = reminder.status === "completed";
  const isOverdue = !isCompleted && reminder.dueDate < today;

  function toggleCompleted(): void {
    if (isCompleted) {
      void reopenReminder(reminder);
      return;
    }
    setCompleting(true);
    window.setTimeout(() => {
      void completeReminder(reminder);
    }, COMPLETE_ANIMATION_MS);
  }

  const meta: React.ReactNode[] = [];
  if (isCompleted && reminder.completedAt) {
    meta.push(
      <span key="completed">
        {t("all.completedOn", { date: format.shortDate(toDateOnly(new Date(reminder.completedAt))) })}
      </span>
    );
  } else if (showDate) {
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
  for (const tag of reminder.tags) {
    meta.push(
      <span key={`tag-${tag}`} className="tag">
        #{tag}
      </span>
    );
  }

  return (
    <li
      className={[
        "row",
        isCompleted ? "is-completed" : "",
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
            aria-label={t("reminder.reschedule")}
            title={t("reminder.reschedule")}
            onClick={popover.toggle}
          >
            <Icon name="calendar" size={16} />
          </button>
          <Popover
            anchorRef={rescheduleRef}
            open={popover.open}
            onClose={popover.close}
            align="end"
            label={t("reminder.reschedule")}
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
