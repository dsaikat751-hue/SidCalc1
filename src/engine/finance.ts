/**
 * Percentage and discount helpers. Every function validates its input and
 * throws a CalcError with a friendly message instead of returning NaN.
 */
import { CalcError } from './calculator';

const need = (n: number, label: string): void => {
  if (!Number.isFinite(n)) throw new CalcError(`Enter ${label}`);
};

/** X% of Y. */
export function percentOf(percent: number, value: number): number {
  need(percent, 'a percentage');
  need(value, 'a number');
  return (percent * value) / 100;
}

/** X is what percent of Y. */
export function whatPercent(part: number, whole: number): number {
  need(part, 'the first number');
  need(whole, 'the second number');
  if (whole === 0) throw new CalcError('The second number cannot be 0');
  return (part / whole) * 100;
}

/** Percentage change from one value to another (positive = increase). */
export function percentChange(from: number, to: number): number {
  need(from, 'the starting value');
  need(to, 'the new value');
  if (from === 0) throw new CalcError('The starting value cannot be 0');
  return ((to - from) / Math.abs(from)) * 100;
}

export interface DiscountResult {
  saved: number;
  final: number;
}

/** Price after a percentage discount. */
export function discount(price: number, percent: number): DiscountResult {
  need(price, 'a price');
  need(percent, 'a discount percentage');
  if (price < 0) throw new CalcError('Price cannot be negative');
  if (percent < 0 || percent > 100) throw new CalcError('Discount must be between 0 and 100');
  const saved = (price * percent) / 100;
  return { saved, final: price - saved };
}

/** Parse text typed into a number field. Returns null when empty/incomplete. */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '' || t === '-' || t === '.' || t === '-.') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
