import {
  format,
  startOfDay,
  startOfMonth,
  endOfMonth,
  getDay,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { tr } from "date-fns/locale";

export function today(): Date {
  return startOfDay(new Date());
}

export function parseDateInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return startOfDay(new Date(y, m - 1, d));
}

export function toDateInputValue(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd");
}

export function formatDateLong(date: Date | string): string {
  return format(new Date(date), "dd MMMM yyyy, EEEE", { locale: tr });
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy");
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: tr });
}

/** Monday=1 ... Sunday=7 */
export function getWeekdayNumber(date: Date): number {
  const d = getDay(date);
  return d === 0 ? 7 : d;
}

export function parseWeekdays(weekdays: string): number[] {
  return weekdays.split(",").map(Number).filter(Boolean);
}

export function formatWeekdays(weekdays: number[]): string {
  return weekdays.sort((a, b) => a - b).join(",");
}

export const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export function weekdayLabel(n: number): string {
  return WEEKDAY_LABELS[n - 1] ?? "";
}

export function monthRange(year: number, month: number) {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return { start, end };
}

export function navigateMonth(year: number, month: number, delta: number) {
  const d = addMonths(new Date(year, month - 1, 1), delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export { startOfDay, startOfMonth, endOfMonth, addMonths, subMonths, parseISO };
