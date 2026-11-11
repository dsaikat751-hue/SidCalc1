/**
 * Engine + keypad logic tests. Run with:  npm test
 * (uses Node's built-in test runner through tsx; no extra setup needed)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, formatNumber, groupDigits, hasOperation } from '../src/engine/calculator';
import {
  CalcState,
  EditKey,
  INITIAL_STATE,
  applyKey,
  currentValue,
  insertNumber,
  pressEquals,
  previewResult,
} from '../src/engine/input';

/** Evaluate and return the formatted text, or "ERR: message". */
function calc(expr: string): string {
  const r = calculate(expr);
  return r.ok ? r.text : `ERR: ${r.error}`;
}

/** Type a sequence of keys. Multi-character names are separated by spaces. */
function type(keys: string, from: CalcState = INITIAL_STATE): CalcState {
  let s = from;
  for (const k of keys.split(' ').filter(Boolean)) {
    if (k === '=') s = pressEquals(s).state;
    else if (k.length > 1 && !['back', 'clear', 'sign'].includes(k)) {
      for (const ch of k) s = applyKey(s, ch as EditKey);
    } else s = applyKey(s, k as EditKey);
  }
  return s;
}

test('basic arithmetic', () => {
  assert.equal(calc('2+3'), '5');
  assert.equal(calc('10−4'), '6');
  assert.equal(calc('6×7'), '42');
  assert.equal(calc('20÷8'), '2.5');
});

test('operator precedence', () => {
  assert.equal(calc('2+3×4'), '14');
  assert.equal(calc('20−6÷2'), '17');
  assert.equal(calc('2×3+4×5'), '26');
  assert.equal(calc('100÷10÷5'), '2'); // left-associative
  assert.equal(calc('10−3−2'), '5');
});

test('parentheses and auto-close', () => {
  assert.equal(calc('(2+3)×4'), '20');
  assert.equal(calc('((1+2)×(3+4))'), '21');
  assert.equal(calc('2×(3+4'), '14'); // missing ) is closed automatically
  assert.equal(calc('2(3)'), '6'); // implicit multiplication
  assert.equal(calc('(1+1)(2+2)'), '8');
  assert.equal(calc('2√9'), '6');
});

test('decimals and floating-point cleanup', () => {
  assert.equal(calc('0.1+0.2'), '0.3');
  assert.equal(calc('1.1×1.1'), '1.21');
  assert.equal(calc('4.35×100'), '435');
  assert.equal(calc('1÷3'), '0.333333333333');
  assert.equal(calc('.5+.5'), '1');
  assert.equal(calc('5.+1'), '6');
});

test('negative numbers and unary minus', () => {
  assert.equal(calc('−5+3'), '-2');
  assert.equal(calc('5×−3'), '-15');
  assert.equal(calc('5−−3'), '8');
  assert.equal(calc('-(2+3)'), '-5');
  assert.equal(calc('2×(−4)'), '-8');
  assert.equal(calc('−3²'), '-9'); // unary minus is looser than square
  assert.equal(calc('0×−5'), '0'); // never "-0"
});

test('square and square root', () => {
  assert.equal(calc('5²'), '25');
  assert.equal(calc('(2+3)²'), '25');
  assert.equal(calc('√9'), '3');
  assert.equal(calc('√(16)'), '4');
  assert.equal(calc('√9²'), '9');
  assert.equal(calc('√2'), '1.41421356237');
  assert.equal(calc('√√16'), '2');
});

test('percentage', () => {
  assert.equal(calc('50%'), '0.5');
  assert.equal(calc('200×10%'), '20');
  assert.equal(calc('200+10%'), '220');
  assert.equal(calc('200−10%'), '180');
  assert.equal(calc('50+20%+10'), '70');
});

test('errors are reported, never thrown', () => {
  assert.equal(calc('5÷0'), 'ERR: Cannot divide by zero');
  assert.equal(calc('0÷0'), 'ERR: Cannot divide by zero');
  assert.equal(calc('1÷(2−2)'), 'ERR: Cannot divide by zero');
  assert.equal(calc('√(−4)'), 'ERR: Invalid input');
  assert.equal(calc(''), 'ERR: Invalid expression');
  assert.equal(calc('5+'), 'ERR: Invalid expression');
  assert.equal(calc('×5'), 'ERR: Invalid expression');
  assert.equal(calc('2++'), 'ERR: Invalid expression');
  assert.equal(calc('(2+3))'), 'ERR: Invalid expression');
  assert.equal(calc('()'), 'ERR: Invalid expression');
  assert.equal(calc('1..2'), 'ERR: Invalid expression');
  assert.equal(calc('abc'), 'ERR: Invalid expression');
  assert.equal(calc('2 + alert(1)'), 'ERR: Invalid expression'); // no code execution
  assert.equal(calc('9'.repeat(400)), 'ERR: Result too large');
});

test('large and small results', () => {
  assert.equal(calc('999999999999×1000'), '999999999999000');
  assert.equal(calc('1000000×1000000000'), '1e+15');
  assert.equal(calc('1÷1000000'), '0.000001');
  assert.equal(calc('1÷10000000'), '1e-7');
});

test('formatting helpers', () => {
  assert.equal(formatNumber(-0), '0');
  assert.equal(groupDigits('1234567.891'), '1,234,567.891');
  assert.equal(groupDigits('-1234'), '-1,234');
  assert.equal(groupDigits('1e+21'), '1e+21');
  assert.equal(hasOperation('5'), false);
  assert.equal(hasOperation('−5'), false);
  assert.equal(hasOperation('5+1'), true);
});

test('keypad: typing and equals', () => {
  const s = type('1 2 + 3 =');
  assert.equal(s.expression, '12+3');
  assert.equal(s.result, '15');
});

test('keypad: leading zeros, dots and operators', () => {
  assert.equal(type('0 0 5').expression, '5');
  assert.equal(type('.').expression, '0.');
  assert.equal(type('1 . 2 . 3').expression, '1.23');
  assert.equal(type('5 + ×').expression, '5×'); // operator replaces operator
  assert.equal(type('5 × −').expression, '5×−'); // unary minus after ×
  assert.equal(type('5 × − +').expression, '5+');
  assert.equal(type('×').expression, ''); // cannot start with ×
  assert.equal(type('−').expression, '−'); // can start with minus
});

test('keypad: brackets, √ and implicit multiplication', () => {
  assert.equal(type('2 (').expression, '2×(');
  assert.equal(type('( 1 + 2 ) 3').expression, '(1+2)×3');
  assert.equal(type(')').expression, ''); // nothing to close
  assert.equal(type('2 √').expression, '2×√');
  assert.equal(type('( 1 )  )').expression, '(1)'); // no extra )
});

test('keypad: sign toggle', () => {
  assert.equal(type('5 sign').expression, '−5');
  assert.equal(type('5 sign sign').expression, '5');
  assert.equal(type('3 + 4 sign').expression, '3+−4');
  assert.equal(type('3 + 4 sign sign').expression, '3+4');
  assert.equal(type('5 sign =').result, '-5');
});

test('keypad: continuing after equals', () => {
  assert.equal(type('2 + 3 = × 4 =').result, '20'); // operator continues
  assert.equal(type('2 + 3 = 7').expression, '7'); // digit starts fresh
  const back = type('2 + 3 = back');
  assert.equal(back.result, null); // backspace re-opens editing
  assert.equal(back.expression, '2+');
  assert.equal(type('5 + 5 = =').result, '10'); // second = is harmless
});

test('keypad: errors keep the expression for editing', () => {
  const s = type('5 ÷ 0 =');
  assert.equal(s.error, 'Cannot divide by zero');
  assert.equal(s.expression, '5÷0');
  const fixed = type('back 2 =', s);
  assert.equal(fixed.error, null);
  assert.equal(fixed.result, '2.5');
});

test('keypad: trailing operator is ignored on equals and preview', () => {
  assert.equal(type('5 + 3 + =').result, '8');
  assert.equal(previewResult(type('2 + 3')), '5');
  assert.equal(previewResult(type('2 +')), null);
  assert.equal(previewResult(type('2')), null);
});

test('keypad: history commits only real calculations', () => {
  assert.equal(pressEquals(type('7')).committed, null);
  const c = pressEquals(type('2 × ( 3 + 4')).committed;
  assert.deepEqual(c, { expression: '2×(3+4)', result: '14' });
});

test('memory helpers', () => {
  assert.equal(currentValue(type('2 + 3')), 5);
  assert.equal(currentValue(type('2 + 3 =')), 5);
  assert.equal(currentValue(INITIAL_STATE), null);
  assert.equal(insertNumber(type('2'), 5).expression, '2×5');
  assert.equal(insertNumber(INITIAL_STATE, -5).expression, '(-5)');
  assert.equal(calc('(-5)+10'), '5');
});
