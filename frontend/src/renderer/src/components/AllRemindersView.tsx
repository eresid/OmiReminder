import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { groupByDate, hasDate } from "../../../shared/grouping";
import { countHidden, isTagFilterActive, matchesTagFilter } from "../../../shared/tagFilter";
import type { ReminderListKind } from "../../../shared/types";
import { hasRelativeLabel } from "../format";
import { useDateFormatter } from "../hooks";
import { useAppStore } from "../store";
import { Icon } from "./Icon";
import { ReminderRow } from "./ReminderRow";
import { FilterEmptyState, HiddenNotice, TagFilterButton } from "./TagFilter";

/**
 * Every active reminder that has a date, by date, and completed ones as history (FR-REM-2).
 * Reminders without a date are only on tag pages and in Inbox (FR-NODATE-1).
 */
export function AllRemindersView() {
  const { t } = useTranslation();
  const format = useDateFormatter();
  const today = useAppStore((state) => state.today);
  const active = useAppStore((state) => state.active);
  const completed = useAppStore((state) => state.completed);
  const filter = useAppStore((state) => state.filters.all);
  const [kind, setKind] = useState<ReminderListKind>("active");
  const { groups, shown, hidden } = useMemo(() => {
    const list = (kind === "active" ? active : completed).filter(hasDate);
    const shown = list.filter((reminder) => matchesTagFilter(reminder, filter));
    return {
      groups: groupByDate(shown),
      shown,
      hidden: countHidden(list, filter, today),
    };
  }, [kind, active, completed, filter, today]);
  const nothingMatches = isTagFilterActive(filter) && shown.length === 0 && hidden.hidden > 0;

  return (
    <div className="view">
      <header className="view-header view-header-row">
        <h1>{t("all.title")}</h1>
        <span className="toolbar-spacer" />
        <TagFilterButton screen="all" />
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
      <HiddenNotice screen="all" counts={hidden} />

      {nothingMatches ? (
        <FilterEmptyState screen="all" />
      ) : kind === "active" ? (
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
      ) : shown.length > 0 ? (
        <ul className="rows">
          {shown.map((reminder) => (
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
