/**
 * Unit conversion tables and formulas. Everything is offline and linear
 * (value × factor) except temperature, which has its own formulas.
 *
 * Each category's `factor` converts one of that unit into the base unit
 * (metre, square metre, litre, m/s, second, kilogram).
 */
import { CalcError, formatNumber } from './calculator';

export interface Unit {
  id: string;
  /** Short symbol shown on the chip, e.g. "km". */
  label: string;
  /** Spoken / long name, e.g. "kilometre". */
  name: string;
  /** Multiplier to the category base unit (unused for temperature). */
  factor: number;
}

export interface Category {
  id: string;
  title: string;
  units: Unit[];
}

const u = (id: string, label: string, name: string, factor: number): Unit => ({
  id,
  label,
  name,
  factor,
});

export const CATEGORIES: Category[] = [
  {
    id: 'length',
    title: 'Length',
    units: [
      u('mm', 'mm', 'millimetre', 0.001),
      u('cm', 'cm', 'centimetre', 0.01),
      u('m', 'm', 'metre', 1),
      u('km', 'km', 'kilometre', 1000),
      u('in', 'inch', 'inch', 0.0254),
      u('ft', 'feet', 'foot', 0.3048),
      u('mi', 'mile', 'mile', 1609.344),
    ],
  },
  {
    id: 'area',
    title: 'Area',
    units: [
      u('m2', 'm²', 'square metre', 1),
      u('km2', 'km²', 'square kilometre', 1_000_000),
      u('ft2', 'ft²', 'square foot', 0.09290304),
      u('acre', 'acre', 'acre', 4046.8564224),
    ],
  },
  {
    id: 'volume',
    title: 'Volume',
    units: [
      u('ml', 'ml', 'millilitre', 0.001),
      u('l', 'liter', 'litre', 1),
      u('m3', 'm³', 'cubic metre', 1000),
      u('gal', 'gallon', 'US gallon', 3.785411784),
    ],
  },
  {
    id: 'temperature',
    title: 'Temperature',
    units: [u('c', '°C', 'Celsius', 1), u('f', '°F', 'Fahrenheit', 1), u('k', 'K', 'Kelvin', 1)],
  },
  {
    id: 'speed',
    title: 'Speed',
    units: [
      u('ms', 'm/s', 'metres per second', 1),
      u('kmh', 'km/h', 'kilometres per hour', 1 / 3.6),
      u('mph', 'mph', 'miles per hour', 0.44704),
    ],
  },
  {
    id: 'time',
    title: 'Time',
    units: [
      u('s', 'second', 'second', 1),
      u('min', 'minute', 'minute', 60),
      u('h', 'hour', 'hour', 3600),
      u('d', 'day', 'day', 86400),
    ],
  },
  {
    id: 'mass',
    title: 'Weight',
    units: [
      u('mg', 'mg', 'milligram', 1e-6),
      u('g', 'g', 'gram', 0.001),
      u('kg', 'kg', 'kilogram', 1),
      u('t', 'ton', 'metric ton', 1000),
      u('lb', 'lb', 'pound', 0.45359237),
      u('oz', 'oz', 'ounce', 0.028349523125),
    ],
  },
];

export function getCategory(id: string): Category {
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) throw new CalcError('Unknown category');
  return c;
}

const toCelsius = (v: number, unit: string): number =>
  unit === 'f' ? ((v - 32) * 5) / 9 : unit === 'k' ? v - 273.15 : v;

const fromCelsius = (c: number, unit: string): number =>
  unit === 'f' ? (c * 9) / 5 + 32 : unit === 'k' ? c + 273.15 : c;

/** Convert a value between two units of the same category. */
export function convert(categoryId: string, value: number, fromId: string, toId: string): number {
  if (!Number.isFinite(value)) throw new CalcError('Enter a valid number');
  const cat = getCategory(categoryId);
  const from = cat.units.find((x) => x.id === fromId);
  const to = cat.units.find((x) => x.id === toId);
  if (!from || !to) throw new CalcError('Unknown unit');

  if (categoryId === 'temperature') {
    const c = toCelsius(value, fromId);
    if (c < -273.15 - 1e-9) throw new CalcError('Below absolute zero');
    return fromCelsius(c, toId);
  }
  return (value * from.factor) / to.factor;
}

/** Convert and format as clean text, e.g. "1.609344". */
export function convertText(categoryId: string, value: number, fromId: string, toId: string): string {
  return formatNumber(convert(categoryId, value, fromId, toId));
}
