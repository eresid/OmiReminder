import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { addDays } from "../../../shared/dates";
import { groupForMainScreen } from "../../../shared/grouping";
import type { Reminder } from "../../../shared/types";
import { useDateFormatter } from "../hooks";
import { useAppStore } from "../store";
import { Icon } from "./Icon";
import { DateMenu } from "./Pickers";
import { Popover, usePopover } from "./Popover";
import { ReminderRow } from "./ReminderRow";

function RescheduleAllButton({ reminders }: { reminders: readonly Reminder[] }) {
  const { t } = useTranslation();
  const today = useAppStore((state) => state.today);
  const reschedule = useAppStore((state) => state.reschedule);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popover = usePopover();

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="link-button"
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        onClick={popover.toggle}
      >
        {t("today.rescheduleAll")}
      </button>
      <Popover
        anchorRef={anchorRef}
        open={popover.open}
        onClose={popover.close}
        align="end"
        label={t("today.rescheduleAll")}
      >
        <DateMenu
          value={today}
          onSelect={(date) => {
            popover.close();
            void reschedule(reminders, date);
          }}
        />
      </Popover>
    </>
  );
}

function AddReminderRow() {
  const { t } = useTranslation();
  const openQuickAdd = useAppStore((state) => state.openQuickAdd);
  return (
    <button type="button" className="add-row" onClick={openQuickAdd}>
      <Icon name="plus" size={16} />
      {t("nav.addReminder")}
    </button>
  );
}

/** The main screen: overdue, today, and the next day that has reminders (section 3.4). */
export function TodayView() {
  const { t } = useTranslation();
  const format = useDateFormatter();
  const today = useAppStore((state) => state.today);
  const active = useAppStore((state) => state.active);
  const groups = useMemo(() => groupForMainScreen(active, today), [active, today]);
  const hasOverdue = groups.overdue.length > 0;

  return (
    <div className="view">
      <header className="view-header">
        <h1>{t("today.title")}</h1>
        <p className="view-subtitle">{format.dayHeading(today)}</p>
      </header>

      {hasOverdue ? (
        <section className="group group-overdue" aria-labelledby="group-overdue">
          <div className="group-header">
            <h2 id="group-overdue">{t("today.overdue")}</h2>
            <span className="group-count">{groups.overdue.length}</span>
            <RescheduleAllButton reminders={groups.overdue} />
          </div>
          <ul className="rows">
            {groups.overdue.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} showDate />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="group" aria-labelledby={hasOverdue ? "group-today" : undefined}>
        {hasOverdue ? (
          <div className="group-header">
            <h2 id="group-today">{t("dates.today")}</h2>
            <span className="group-count">{groups.today.length}</span>
          </div>
        ) : null}
        {groups.today.length > 0 ? (
          <ul className="rows">
            {groups.today.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <Icon name="check" size={22} />
            <p className="empty-title">{t("today.emptyTitle")}</p>
            <p className="empty-text">{t("today.emptyText")}</p>
          </div>
        )}
        <AddReminderRow />
      </section>

      {groups.next ? (
        <section className="group" aria-labelledby="group-next">
          <div className="group-header">
            <h2 id="group-next">
              {groups.next.date === addDays(today, 1) ? t("dates.tomorrow") : format.dayHeading(groups.next.date)}
            </h2>
            <span className="group-count">{groups.next.reminders.length}</span>
          </div>
          <ul className="rows">
            {groups.next.reminders.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
