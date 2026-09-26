import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { daysBetween } from "../../../shared/dates";
import { compareByDate } from "../../../shared/grouping";
import type { Reminder, ReminderListKind } from "../../../shared/types";
import { useDateFormatter } from "../hooks";
import { useAppStore } from "../store";
import { Icon } from "./Icon";
import { ReminderRow } from "./ReminderRow";

function groupByDate(reminders: readonly Reminder[]): { date: string; reminders: Reminder[] }[] {
  const groups: { date: string; reminders: Reminder[] }[] = [];
  for (const reminder of [...reminders].sort(compareByDate)) {
    const last = groups.at(-1);
    if (last?.date === reminder.dueDate) {
      last.reminders.push(reminder);
    } else {
      groups.push({ date: reminder.dueDate, reminders: [reminder] });
    }
  }
  return groups;
}

/** "Yesterday", "Today", "Tomorrow", and weekdays do not show the date itself. */
function hasRelativeLabel(today: string, date: string): boolean {
  const offset = daysBetween(today, date);
  return offset >= -1 && offset < 7;
}

/** Every active reminder by date, and completed reminders as history (FR-REM-2). */
export function AllRemindersView() {
  const { t } = useTranslation();
  const format = useDateFormatter();
  const today = useAppStore((state) => state.today);
  const active = useAppStore((state) => state.active);
  const completed = useAppStore((state) => state.completed);
  const [kind, setKind] = useState<ReminderListKind>("active");
  const groups = useMemo(() => groupByDate(active), [active]);

  return (
    <div className="view">
      <header className="view-header view-header-row">
        <h1>{t("all.title")}</h1>
        <div className="segmented" role="tablist" aria-label={t("all.title")}>
          {(["active", "completed"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={kind === option}
              className={kind === option ? "is-selected" : ""}
              onClick={() => {
                setKind(option);
              }}
            >
              {t(`all.${option}`)}
            </button>
          ))}
        </div>
      </header>

      {kind === "active" ? (
        groups.length > 0 ? (
          groups.map((group) => (
            <section key={group.date} className="group">
              <div className="group-header">
                <h2 className={group.date < today ? "tone-danger" : ""}>
                  {format.dayLabel(group.date)}
                  {hasRelativeLabel(today, group.date) ? (
                    <span className="group-date">{format.shortDate(group.date)}</span>
                  ) : null}
                </h2>
                <span className="group-count">{group.reminders.length}</span>
              </div>
              <ul className="rows">
                {group.reminders.map((reminder) => (
                  <ReminderRow key={reminder.id} reminder={reminder} />
                ))}
              </ul>
            </section>
          ))
        ) : (
          <div className="empty-state">
            <Icon name="list" size={22} />
            <p className="empty-title">{t("all.emptyActiveTitle")}</p>
            <p className="empty-text">{t("all.emptyActiveText")}</p>
          </div>
        )
      ) : completed.length > 0 ? (
        <ul className="rows">
          {completed.map((reminder) => (
            <ReminderRow key={reminder.id} reminder={reminder} />
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <Icon name="check" size={22} />
          <p className="empty-title">{t("all.emptyCompletedTitle")}</p>
          <p className="empty-text">{t("all.emptyCompletedText")}</p>
        </div>
      )}
    </div>
  );
}
