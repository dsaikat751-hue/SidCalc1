/**
 * Tests for the v1.1.0 features: scientific functions, unit conversion,
 * mass, percentage, discount and age calculators.
 * Run with:  npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AngleMode, calculate } from '../src/engine/calculator';
import { CalcState, EditKey, INITIAL_STATE, applyKey, pressEquals } from '../src/engine/input';
import { convertText, CATEGORIES } from '../src/engine/units';
import { discount, parseNumber, percentChange, percentOf, whatPercent } from '../src/engine/finance';
import { computeAge, isValidDate } from '../src/engine/age';

const sci = (expr: string, angle: AngleMode = 'deg'): string => {
  const r = calculate(expr, angle);
  return r.ok ? r.text : `ERR: ${r.error}`;
};

/** Press a list of keys (each entry is one key id). */
const press = (keys: EditKey[], from: CalcState = INITIAL_STATE): CalcState =>
  keys.reduce((s, k) => applyKey(s, k), from);

test('trig in degrees gives exact answers', () => {
  assert.equal(sci('sin(30)'), '0.5');
  assert.equal(sci('cos(60)'), '0.5');
  assert.equal(sci('tan(45)'), '1');
  assert.equal(sci('sin(0)'), '0');
  assert.equal(sci('sin(90)'), '1');
  assert.equal(sci('sin(180)'), '0');
  assert.equal(sci('cos(90)'), '0');
  assert.equal(sci('cos(0)'), '1');
  assert.equal(sci('sin(−30)'), '-0.5');
  assert.equal(sci('tan(180)'), '0');
});

test('trig in radians', () => {
  assert.equal(sci('sin(π)', 'rad'), '0');
  assert.equal(sci('cos(π)', 'rad'), '-1');
  assert.equal(sci('sin(π÷2)', 'rad'), '1');
  assert.equal(sci('cos(π÷2)', 'rad'), '0');
  assert.equal(sci('tan(π÷4)', 'rad'), '1');
  assert.equal(sci('sin(1)', 'rad'), '0.841470984808');
});

test('inverse trig respects the angle mode', () => {
  assert.equal(sci('asin(1)'), '90');
  assert.equal(sci('acos(0)'), '90');
  assert.equal(sci('atan(1)'), '45');
  assert.equal(sci('asin(0.5)'), '30');
  assert.equal(sci('asin(1)', 'rad'), '1.57079632679');
  assert.equal(sci('atan(1)×4', 'rad'), '3.14159265359');
});

test('trig domain errors', () => {
  assert.equal(sci('tan(90)'), 'ERR: Invalid input');
  assert.equal(sci('tan(270)'), 'ERR: Invalid input');
  assert.equal(sci('asin(2)'), 'ERR: Invalid input');
  assert.equal(sci('acos(−1.5)'), 'ERR: Invalid input');
});

test('logarithms', () => {
  assert.equal(sci('log(1000)'), '3');
  assert.equal(sci('log(1)'), '0');
  assert.equal(sci('log(0.01)'), '-2');
  assert.equal(sci('ln(e)'), '1');
  assert.equal(sci('ln(1)'), '0');
  assert.equal(sci('ln(e^2)'), '2');
  assert.equal(sci('log(0)'), 'ERR: Invalid input');
  assert.equal(sci('ln(−5)'), 'ERR: Invalid input');
});

test('roots, powers, factorial, constants', () => {
  assert.equal(sci('∛27'), '3');
  assert.equal(sci('∛(−8)'), '-2');
  assert.equal(sci('√144'), '12');
  assert.equal(sci('2^10'), '1024');
  assert.equal(sci('2^−1'), '0.5');
  assert.equal(sci('2^3^2'), '512'); // right-associative
  assert.equal(sci('−2^2'), '-4');
  assert.equal(sci('(−2)^2'), '4');
  assert.equal(sci('2^0.5'), '1.41421356237');
  assert.equal(sci('5!'), '120');
  assert.equal(sci('0!'), '1');
  assert.equal(sci('10!'), '3628800');
  assert.equal(sci('3!+2'), '8');
  assert.equal(sci('π'), '3.14159265359');
  assert.equal(sci('2π'), '6.28318530718');
  assert.equal(sci('e'), '2.71828182846');
  assert.equal(sci('2×e'), '5.43656365692');
  assert.equal(sci('2sin(30)'), '1');
});

test('scientific errors', () => {
  assert.equal(sci('(−8)^0.5'), 'ERR: Invalid input');
  assert.equal(sci('0^−1'), 'ERR: Cannot divide by zero');
  assert.equal(sci('2.5!'), 'ERR: Invalid input');
  assert.equal(sci('(−3)!'), 'ERR: Invalid input');
  assert.equal(sci('171!'), 'ERR: Result too large');
  assert.equal(sci('10^400'), 'ERR: Result too large');
  assert.equal(sci('sin()'), 'ERR: Invalid expression');
  assert.equal(sci('sin'), 'ERR: Invalid expression');
  assert.equal(sci('foo(2)'), 'ERR: Invalid expression');
  assert.equal(sci('^2'), 'ERR: Invalid expression');
});

test('large factorials format cleanly', () => {
  assert.equal(sci('20!'), '2.43290200817664e+18');
  assert.equal(sci('25!'), '1.5511210043331e+25');
});

test('keypad: scientific keys', () => {
  assert.equal(press(['sin']).expression, 'sin(');
  assert.equal(press(['2', 'sin']).expression, '2×sin(');
  assert.equal(press(['asin', '1', ')']).expression, 'asin(1)');
  assert.equal(press(['π']).expression, 'π');
  assert.equal(press(['2', 'π']).expression, '2×π');
  assert.equal(press(['π', '2']).expression, 'π×2');
  assert.equal(press(['e', 'e']).expression, 'e×e');
  assert.equal(press(['5', '!']).expression, '5!');
  assert.equal(press(['!']).expression, '');
  assert.equal(press(['2', '^', '3']).expression, '2^3');
  assert.equal(press(['2', '^', '−', '3']).expression, '2^−3');
  assert.equal(press(['^']).expression, '');
  assert.equal(press(['∛', '8']).expression, '∛8');
  assert.equal(press(['sin', 'sin']).expression, 'sin(sin(');
});

test('keypad: backspace removes a whole function name', () => {
  assert.equal(press(['sin', 'back']).expression, '');
  assert.equal(press(['2', '+', 'asin', 'back']).expression, '2+');
  assert.equal(press(['log', '5', 'back']).expression, 'log(');
});

test('keypad: full scientific calculation with angle mode', () => {
  const s = press(['sin', '3', '0', ')']);
  assert.equal(pressEquals(s, 'deg').state.result, '0.5');
  const r = press(['sin', '3', '0', ')']);
  assert.equal(pressEquals(r, 'rad').state.result, '-0.988031624093');
  const hist = pressEquals(press(['2', '^', '8']), 'deg').committed;
  assert.deepEqual(hist, { expression: '2^8', result: '256' });
});

test('keypad: constants alone are not saved to history', () => {
  assert.equal(pressEquals(press(['π'])).committed, null);
});

test('keypad: continue from a result with ^ and !', () => {
  const s = pressEquals(press(['3', '+', '2'])).state;
  assert.equal(press(['^', '2'], s).expression, '5^2');
  assert.equal(press(['!'], s).expression, '5!');
});

// ---------------------------------------------------------------- converter

test('length conversions', () => {
  assert.equal(convertText('length', 1, 'mi', 'km'), '1.609344');
  assert.equal(convertText('length', 1, 'm', 'cm'), '100');
  assert.equal(convertText('length', 1, 'km', 'm'), '1000');
  assert.equal(convertText('length', 12, 'in', 'ft'), '1');
  assert.equal(convertText('length', 1, 'in', 'mm'), '25.4');
  assert.equal(convertText('length', 5280, 'ft', 'mi'), '1');
  assert.equal(convertText('length', 250, 'mm', 'cm'), '25');
});

test('area conversions', () => {
  assert.equal(convertText('area', 1, 'km2', 'm2'), '1000000');
  assert.equal(convertText('area', 1, 'acre', 'm2'), '4046.8564224');
  assert.equal(convertText('area', 43560, 'ft2', 'acre'), '1');
  assert.equal(convertText('area', 10, 'ft2', 'm2'), '0.9290304');
});

test('volume conversions', () => {
  assert.equal(convertText('volume', 1, 'l', 'ml'), '1000');
  assert.equal(convertText('volume', 1, 'm3', 'l'), '1000');
  assert.equal(convertText('volume', 1, 'gal', 'l'), '3.785411784');
  assert.equal(convertText('volume', 3.785411784, 'l', 'gal'), '1');
});

test('temperature conversions', () => {
  assert.equal(convertText('temperature', 100, 'c', 'f'), '212');
  assert.equal(convertText('temperature', 32, 'f', 'c'), '0');
  assert.equal(convertText('temperature', 0, 'c', 'k'), '273.15');
  assert.equal(convertText('temperature', 0, 'k', 'c'), '-273.15');
  assert.equal(convertText('temperature', -40, 'f', 'c'), '-40');
  assert.equal(convertText('temperature', 37, 'c', 'f'), '98.6');
  assert.equal(convertText('temperature', 300, 'k', 'f'), '80.33');
  assert.throws(() => convertText('temperature', -300, 'c', 'f'), /absolute zero/);
  assert.throws(() => convertText('temperature', -1, 'k', 'c'), /absolute zero/);
});

test('speed conversions', () => {
  assert.equal(convertText('speed', 36, 'kmh', 'ms'), '10');
  assert.equal(convertText('speed', 1, 'mph', 'kmh'), '1.609344');
  assert.equal(convertText('speed', 100, 'kmh', 'mph'), '62.1371192237');
  assert.equal(convertText('speed', 1, 'ms', 'kmh'), '3.6');
});

test('time conversions', () => {
  assert.equal(convertText('time', 1, 'd', 'h'), '24');
  assert.equal(convertText('time', 90, 'min', 'h'), '1.5');
  assert.equal(convertText('time', 1, 'h', 's'), '3600');
  assert.equal(convertText('time', 86400, 's', 'd'), '1');
});

test('mass conversions', () => {
  assert.equal(convertText('mass', 1, 'kg', 'g'), '1000');
  assert.equal(convertText('mass', 1, 'kg', 'lb'), '2.20462262185');
  assert.equal(convertText('mass', 1, 'lb', 'g'), '453.59237');
  assert.equal(convertText('mass', 16, 'oz', 'lb'), '1');
  assert.equal(convertText('mass', 1, 't', 'kg'), '1000');
  assert.equal(convertText('mass', 1000000, 'mg', 'kg'), '1');
  assert.equal(convertText('mass', 1, 'oz', 'g'), '28.349523125');
});

test('every unit converts to itself and round-trips', () => {
  for (const cat of CATEGORIES) {
    for (const a of cat.units) {
      assert.equal(convertText(cat.id, 123.456, a.id, a.id), '123.456', `${cat.id} ${a.id}`);
      for (const b of cat.units) {
        const there = Number(convertText(cat.id, 50, a.id, b.id));
        const back = Number(convertText(cat.id, there, b.id, a.id));
        assert.ok(Math.abs(back - 50) < 1e-6, `${cat.id} ${a.id}->${b.id} round trip gave ${back}`);
      }
    }
  }
});

test('converter rejects bad input', () => {
  assert.throws(() => convertText('length', NaN, 'm', 'km'), /valid number/);
  assert.throws(() => convertText('length', 1, 'm', 'nope'), /Unknown unit/);
  assert.throws(() => convertText('bogus', 1, 'm', 'km'), /Unknown category/);
});

// ------------------------------------------------------- percentage etc.

test('percentage calculators', () => {
  assert.equal(percentOf(15, 200), 30);
  assert.equal(percentOf(0, 200), 0);
  assert.equal(whatPercent(50, 200), 25);
  assert.equal(percentChange(100, 150), 50);
  assert.equal(percentChange(200, 150), -25);
  assert.equal(percentChange(-100, -50), 50);
  assert.throws(() => whatPercent(5, 0), /cannot be 0/);
  assert.throws(() => percentChange(0, 5), /cannot be 0/);
  assert.throws(() => percentOf(NaN, 5), /Enter/);
});

test('discount calculator', () => {
  assert.deepEqual(discount(200, 25), { saved: 50, final: 150 });
  assert.deepEqual(discount(99.99, 0), { saved: 0, final: 99.99 });
  assert.deepEqual(discount(80, 100), { saved: 80, final: 0 });
  assert.throws(() => discount(100, 101), /between 0 and 100/);
  assert.throws(() => discount(100, -1), /between 0 and 100/);
  assert.throws(() => discount(-5, 10), /negative/);
});

test('number field parsing', () => {
  assert.equal(parseNumber('12.5'), 12.5);
  assert.equal(parseNumber('-3'), -3);
  assert.equal(parseNumber('2,5'), 2.5);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('-'), null);
  assert.equal(parseNumber('.'), null);
  assert.equal(parseNumber('abc'), null);
});

// -------------------------------------------------------------------- age

test('age calculator', () => {
  const a = computeAge({ year: 2000, month: 5, day: 15 }, { year: 2026, month: 11, day: 13 });
  assert.deepEqual([a.years, a.months, a.days], [26, 5, 29]);
  assert.equal(a.totalDays, 9678);
  assert.equal(a.nextBirthdayIn, 183);

  const birthdayToday = computeAge({ year: 2000, month: 11, day: 13 }, { year: 2026, month: 11, day: 13 });
  assert.deepEqual([birthdayToday.years, birthdayToday.months, birthdayToday.days], [26, 0, 0]);
  assert.equal(birthdayToday.nextBirthdayIn, 0);

  const borrow = computeAge({ year: 2020, month: 1, day: 31 }, { year: 2020, month: 3, day: 1 });
  assert.deepEqual([borrow.years, borrow.months, borrow.days], [0, 1, 1]);

  const leap = computeAge({ year: 2000, month: 2, day: 29 }, { year: 2026, month: 3, day: 1 });
  assert.equal(leap.years, 26);
  assert.equal(computeAge({ year: 2026, month: 11, day: 13 }, { year: 2026, month: 11, day: 13 }).totalDays, 0);
});

test('age calculator validation', () => {
  assert.equal(isValidDate({ year: 2024, month: 2, day: 29 }), true);
  assert.equal(isValidDate({ year: 2023, month: 2, day: 29 }), false);
  assert.equal(isValidDate({ year: 2023, month: 4, day: 31 }), false);
  assert.equal(isValidDate({ year: 2023, month: 13, day: 1 }), false);
  assert.throws(
    () => computeAge({ year: 2030, month: 1, day: 1 }, { year: 2026, month: 11, day: 13 }),
    /future/,
  );
  assert.throws(
    () => computeAge({ year: 2001, month: 2, day: 30 }, { year: 2026, month: 11, day: 13 }),
    /not a real date/,
  );
});
