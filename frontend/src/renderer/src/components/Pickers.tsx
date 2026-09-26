import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { addDays } from "../../../shared/dates";
import type { Priority } from "../../../shared/types";
import { useDateFormatter } from "../hooks";
import { useAppStore } from "../store";
import { Calendar } from "./Calendar";
import { Icon } from "./Icon";
import { Popover, usePopover } from "./Popover";

interface DateMenuProps {
  value: string;
  onSelect: (date: string) => void;
}

/** Quick options and a calendar. Past dates cannot be chosen (FR-REM-6). */
export function DateMenu({ value, onSelect }: DateMenuProps) {
  const { t } = useTranslation();
  const format = useDateFormatter();
  const today = useAppStore((state) => state.today);
  const tomorrow = addDays(today, 1);

  const quickOptions = [
    { date: today, label: t("dates.today"), icon: "today" as const },
    { date: tomorrow, label: t("dates.tomorrow"), icon: "sunrise" as const },
  ];

  return (
    <div className="date-menu">
      <div className="menu-list">
        {quickOptions.map((option) => (
          <button
            key={option.date}
            type="button"
            className={["menu-item", option.date === value ? "is-selected" : ""].join(" ")}
            onClick={() => {
              onSelect(option.date);
            }}
          >
            <Icon name={option.icon} size={16} />
            <span className="menu-item-label">{option.label}</span>
            <span className="menu-item-hint">{format.weekday(option.date)}</span>
          </button>
        ))}
      </div>
      <Calendar value={value} minDate={today} onSelect={onSelect} />
    </div>
  );
}

function dateTone(date: string, today: string): string {
  if (date < today) {
    return "tone-danger";
  }
  return date === today ? "tone-today" : "";
}

interface DateButtonProps {
  value: string;
  onChange: (date: string) => void;
}

export function DateButton({ value, onChange }: DateButtonProps) {
  const { t } = useTranslation();
  const format = useDateFormatter();
  const today = useAppStore((state) => state.today);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popover = usePopover();

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={["chip-button", dateTone(value, today)].join(" ")}
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        aria-label={`${t("reminder.date")}: ${format.dayLabel(value)}`}
        onClick={popover.toggle}
      >
        <Icon name="calendar" size={16} />
        {format.dayLabel(value)}
      </button>
      <Popover anchorRef={anchorRef} open={popover.open} onClose={popover.close} label={t("reminder.date")}>
        <DateMenu
          value={value}
          onSelect={(date) => {
            onChange(date);
            popover.close();
          }}
        />
      </Popover>
    </>
  );
}

const PRIORITIES: readonly Priority[] = ["high", "normal", "low"];

interface PriorityButtonProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export function PriorityButton({ value, onChange }: PriorityButtonProps) {
  const { t } = useTranslation();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popover = usePopover();

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`chip-button priority-${value}`}
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        aria-label={`${t("priority.label")}: ${t(`priority.${value}`)}`}
        onClick={popover.toggle}
      >
        <Icon name="flag" size={16} className="priority-flag" />
        {t(`priority.${value}`)}
      </button>
      <Popover anchorRef={anchorRef} open={popover.open} onClose={popover.close} label={t("priority.label")}>
        <div className="menu-list" role="listbox" aria-label={t("priority.label")}>
          {PRIORITIES.map((priority) => (
            <button
              key={priority}
              type="button"
              role="option"
              aria-selected={priority === value}
              className={`menu-item priority-${priority}`}
              onClick={() => {
                onChange(priority);
                popover.close();
              }}
            >
              <Icon name="flag" size={16} className="priority-flag" />
              <span className="menu-item-label">{t(`priority.${priority}`)}</span>
              {priority === value ? <Icon name="check" size={16} className="menu-check" /> : null}
            </button>
          ))}
        </div>
      </Popover>
    </>
  );
}
