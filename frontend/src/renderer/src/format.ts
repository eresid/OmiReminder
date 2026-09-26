import type { TFunction } from "i18next";
import { dateOnlyToUtcDate, daysBetween } from "../../shared/dates";

export interface DateFormatter {
  /** "Today", "Tomorrow", "Yesterday", a weekday within a week, or a short date. */
  dayLabel(date: string): string;
  /** A heading such as "Monday, 29 September". */
  dayHeading(date: string): string;
  /** A weekday name such as "Monday". */
  weekday(date: string): string;
  /** A short date such as "29 Sep", with the year when it differs from the current one. */
  shortDate(date: string): string;
  /** A full month title such as "September 2026". */
  monthTitle(monthStart: string): string;
  /** Narrow weekday names starting from Monday. */
  weekdayNames(): string[];
}

/** Ukrainian weekday and month names are lowercase; headings start with a capital letter. */
function capitalize(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

export function createDateFormatter(locale: string, today: string, t: TFunction): DateFormatter {
  const currentYear = today.slice(0, 4);
  const withYear = (date: string): boolean => date.slice(0, 4) !== currentYear;
  const format = (date: string, options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(dateOnlyToUtcDate(date));
  const title = (date: string, options: Intl.DateTimeFormatOptions): string =>
    capitalize(format(date, options), locale);
  const year = (date: string): Intl.DateTimeFormatOptions => (withYear(date) ? { year: "numeric" } : {});

  return {
    dayLabel(date) {
      const offset = daysBetween(today, date);
      if (offset === 0) {
        return t("dates.today");
      }
      if (offset === 1) {
        return t("dates.tomorrow");
      }
      if (offset === -1) {
        return t("dates.yesterday");
      }
      if (offset > 1 && offset < 7) {
        return title(date, { weekday: "long" });
      }
      return title(date, { weekday: "short", day: "numeric", month: "short", ...year(date) });
    },
    dayHeading(date) {
      return title(date, { weekday: "long", day: "numeric", month: "long", ...year(date) });
    },
    weekday(date) {
      return title(date, { weekday: "long" });
    },
    shortDate(date) {
      return format(date, { day: "numeric", month: "short", ...year(date) });
    },
    monthTitle(monthStart) {
      return title(monthStart, { month: "long", year: "numeric" });
    },
    weekdayNames() {
      // 2024-01-01 is a Monday.
      return Array.from({ length: 7 }, (_, index) => format(`2024-01-0${String(index + 1)}`, { weekday: "short" }));
    },
  };
}
