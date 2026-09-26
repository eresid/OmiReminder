// Helpers for date-only values in `YYYY-MM-DD` format. Arithmetic runs on UTC dates, so it never
// depends on a time zone. Only `toDateOnly` reads the local calendar of the device.

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function parseDateOnly(value: string): DateParts | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

export function isValidDateOnly(value: unknown): value is string {
  return typeof value === "string" && parseDateOnly(value) !== null;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

export function formatDateOnly({ year, month, day }: DateParts): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** The local calendar date of an instant on this device. */
export function toDateOnly(instant: Date): string {
  return formatDateOnly({
    year: instant.getFullYear(),
    month: instant.getMonth() + 1,
    day: instant.getDate(),
  });
}

function requireParts(value: string): DateParts {
  const parts = parseDateOnly(value);
  if (!parts) {
    throw new RangeError(`Invalid date-only value: ${value}`);
  }
  return parts;
}

/** A UTC midnight `Date` for the value. Format it with `timeZone: 'UTC'`. */
export function dateOnlyToUtcDate(value: string): Date {
  const { year, month, day } = requireParts(value);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtcDate(date: Date): string {
  return formatDateOnly({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

export function addDays(value: string, days: number): string {
  const date = dateOnlyToUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtcDate(date);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((dateOnlyToUtcDate(to).getTime() - dateOnlyToUtcDate(from).getTime()) / MS_PER_DAY);
}

/** ISO weekday: 1 is Monday, 7 is Sunday. */
export function isoWeekday(value: string): number {
  const day = dateOnlyToUtcDate(value).getUTCDay();
  return day === 0 ? 7 : day;
}

export function firstOfMonth(value: string): string {
  const { year, month } = requireParts(value);
  return formatDateOnly({ year, month, day: 1 });
}

export function addMonths(monthStart: string, months: number): string {
  const { year, month } = requireParts(monthStart);
  return fromUtcDate(new Date(Date.UTC(year, month - 1 + months, 1)));
}

export function daysInMonth(value: string): number {
  const { year, month } = requireParts(value);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
