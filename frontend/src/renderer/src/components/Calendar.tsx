import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { addDays, addMonths, daysInMonth, firstOfMonth, isoWeekday } from "../../../shared/dates";
import { useDateFormatter } from "../hooks";
import { useAppStore } from "../store";
import { Icon } from "./Icon";

interface CalendarProps {
  value: string;
  /** Dates before this one cannot be selected. */
  minDate: string;
  onSelect: (date: string) => void;
}

export function Calendar({ value, minDate, onSelect }: CalendarProps) {
  const { t } = useTranslation();
  const format = useDateFormatter();
  const today = useAppStore((state) => state.today);
  const firstDayOfWeek = useAppStore((state) => state.environment.firstDayOfWeek);
  const [month, setMonth] = useState(() => firstOfMonth(value < minDate ? minDate : value));

  const weekdays = useMemo(() => {
    const names = format.weekdayNames();
    return [...names.slice(firstDayOfWeek - 1), ...names.slice(0, firstDayOfWeek - 1)];
  }, [format, firstDayOfWeek]);

  const cells = useMemo(() => {
    const leading = (isoWeekday(month) - firstDayOfWeek + 7) % 7;
    const days = Array.from({ length: daysInMonth(month) }, (_, index) => addDays(month, index));
    return [...Array.from({ length: leading }, () => null), ...days];
  }, [month, firstDayOfWeek]);

  const canGoBack = month > firstOfMonth(minDate);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <span className="calendar-title">{format.monthTitle(month)}</span>
        <div className="calendar-nav">
          <button
            type="button"
            className="icon-button"
            aria-label={t("dates.previousMonth")}
            disabled={!canGoBack}
            onClick={() => {
              setMonth(addMonths(month, -1));
            }}
          >
            <Icon name="chevronLeft" size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={t("dates.nextMonth")}
            onClick={() => {
              setMonth(addMonths(month, 1));
            }}
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>
      <div className="calendar-grid" role="grid">
        {weekdays.map((name) => (
          <span key={name} className="calendar-weekday" role="columnheader">
            {name}
          </span>
        ))}
        {cells.map((date, index) =>
          date === null ? (
            <span key={`empty-${String(index)}`} />
          ) : (
            <button
              key={date}
              type="button"
              role="gridcell"
              className={["calendar-day", date === value ? "is-selected" : "", date === today ? "is-today" : ""]
                .filter(Boolean)
                .join(" ")}
              aria-selected={date === value}
              aria-label={format.dayHeading(date)}
              disabled={date < minDate}
              onClick={() => {
                onSelect(date);
              }}
            >
              {Number(date.slice(8))}
            </button>
          )
        )}
      </div>
    </div>
  );
}
