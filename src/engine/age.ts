/**
 * Age calculation using calendar years / months / days (no time zones: only
 * whole calendar dates are compared).
 */
import { CalcError } from './calculator';

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  /** Days until the next birthday (0 = today). */
  nextBirthdayIn: number;
}

const utc = (y: number, m: number, d: number): number => Date.UTC(y, m - 1, d);
const DAY = 86_400_000;

/** True for a real calendar date such as 29 Feb 2024 (but not 30 Feb). */
export function isValidDate(p: DateParts): boolean {
  if (![p.year, p.month, p.day].every(Number.isInteger)) return false;
  if (p.year < 1 || p.month < 1 || p.month > 12 || p.day < 1) return false;
  const d = new Date(utc(p.year, p.month, p.day));
  return d.getUTCFullYear() === p.year && d.getUTCMonth() === p.month - 1 && d.getUTCDate() === p.day;
}

/** Today's date from the device clock. */
export function todayParts(now: Date = new Date()): DateParts {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

export function computeAge(dob: DateParts, today: DateParts): AgeResult {
  if (!isValidDate(dob)) throw new CalcError('That date of birth is not a real date');
  if (!isValidDate(today)) throw new CalcError('Invalid date');
  if (utc(dob.year, dob.month, dob.day) > utc(today.year, today.month, today.day)) {
    throw new CalcError('Date of birth is in the future');
  }

  // Whole months elapsed, using the birthday clamped to the month length
  // (31 Jan + 1 month = 29 Feb in a leap year).
  const todayMs = utc(today.year, today.month, today.day);
  const anchor = (months: number): number => {
    const total = dob.month - 1 + months;
    const y = dob.year + Math.floor(total / 12);
    const m = ((total % 12) + 12) % 12; // 0-11
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return Date.UTC(y, m, Math.min(dob.day, lastDay));
  };
  let wholeMonths = (today.year - dob.year) * 12 + (today.month - dob.month);
  while (wholeMonths > 0 && anchor(wholeMonths) > todayMs) wholeMonths -= 1;
  const years = Math.floor(wholeMonths / 12);
  const months = wholeMonths % 12;
  const days = Math.round((todayMs - anchor(wholeMonths)) / DAY);

  const totalDays = Math.round(
    (utc(today.year, today.month, today.day) - utc(dob.year, dob.month, dob.day)) / DAY,
  );

  // Next birthday (29 Feb birthdays roll to 1 Mar in non-leap years).
  let nextYear = today.year;
  let next = utc(nextYear, dob.month, dob.day);
  if (next < utc(today.year, today.month, today.day)) {
    nextYear += 1;
    next = utc(nextYear, dob.month, dob.day);
  }
  const nextBirthdayIn = Math.round((next - utc(today.year, today.month, today.day)) / DAY);

  return { years, months, days, totalDays, nextBirthdayIn };
}
