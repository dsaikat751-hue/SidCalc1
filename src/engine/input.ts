/**
 * Calculator keypad logic.
 *
 * Pure functions only (no React): given the current state and a key press they
 * return the next state. This keeps all of the "what happens when I tap X"
 * rules in one place and makes them easy to unit test.
 */
import {
  autoClose,
  calculate,
  evaluate,
  formatNumber,
  hasOperation,
} from './calculator';

export interface CalcState {
  /** What the user has typed, e.g. "2×(3+4)". */
  expression: string;
  /** Plain (ungrouped) result after "=", or null while still typing. */
  result: string | null;
  /** Error message to show instead of a result, or null. */
  error: string | null;
}

export const INITIAL_STATE: CalcState = { expression: '', result: null, error: null };

/** Every key that edits the expression. "=" is handled by pressEquals(). */
export type EditKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.'
  | '+' | '−' | '×' | '÷'
  | '(' | ')'
  | '%' | '²' | '√'
  | 'back' | 'clear' | 'sign';

const MAX_LENGTH = 120;
const OPERATORS = ['+', '−', '-', '×', '÷'];

const isDigit = (c: string): boolean => c >= '0' && c <= '9';
const isOperator = (c: string): boolean => OPERATORS.includes(c);
const isMinus = (c: string): boolean => c === '−' || c === '-';
/** True if the character can end an operand (so something may follow it). */
const endsValue = (c: string): boolean => isDigit(c) || c === ')' || c === '²' || c === '%';
const last = (s: string): string => (s.length ? s[s.length - 1] : '');
const trimDot = (s: string): string => (last(s) === '.' ? s.slice(0, -1) : s);

/** The number at the very end of the expression, if any (e.g. "12.5"). */
const TRAILING_NUMBER = /(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

function trailingNumber(e: string): string | null {
  const m = TRAILING_NUMBER.exec(e);
  return m ? m[0] : null;
}

/** Remove trailing operators / dots so "5+" can still be previewed as "5". */
export function stripTrailing(e: string): string {
  let s = e;
  while (s.length && (isOperator(last(s)) || last(s) === '.')) s = s.slice(0, -1);
  return s;
}

/**
 * After "=", the next key either continues from the result (operators, %, ²,
 * ±) or starts a brand new calculation (digits, brackets, √).
 */
function prepare(state: CalcState, key: EditKey): CalcState {
  const base: CalcState = { ...state, error: null };
  if (base.result === null) return base;
  switch (key) {
    case '+': case '−': case '×': case '÷': case '%': case '²': case 'sign':
      return { expression: base.result, result: null, error: null };
    case 'back':
      return { ...base, result: null };
    case 'clear':
      return base;
    default:
      return { expression: '', result: null, error: null };
  }
}

function pressOperator(e: string, op: string): string {
  if (e === '') return op === '−' ? '−' : e; // only a minus can start an expression
  const l = last(e);
  if (l === '√') return e;
  if (l === '(') return op === '−' ? e + '−' : e;
  if (isOperator(l)) {
    // "5×" followed by "−" is a negative number: 5×−3
    if (op === '−' && (l === '×' || l === '÷')) return e + '−';
    // Otherwise the new operator replaces the old one(s).
    const s = stripTrailing(e);
    if (s === '' || last(s) === '(') return op === '−' ? s + '−' : s;
    return s + op;
  }
  return trimDot(e) + op;
}

function toggleSign(e: string): string {
  const tn = trailingNumber(e);
  if (tn === null) {
    if (e === '') return '−';
    const l = last(e);
    if (isMinus(l)) {
      const before = e.slice(0, -1);
      if (before === '' || isOperator(last(before)) || last(before) === '(') return before;
      return e; // binary minus: leave alone
    }
    if (isOperator(l) || l === '(') return e + '−';
    return e;
  }
  const before = e.slice(0, e.length - tn.length);
  if (isMinus(last(before))) {
    const prev = before.slice(0, -1);
    if (prev === '' || isOperator(last(prev)) || last(prev) === '(') return prev + tn;
  }
  return before + '−' + tn;
}

/** Apply one editing key and return the new state. */
export function applyKey(state: CalcState, key: EditKey): CalcState {
  if (key === 'clear') return INITIAL_STATE;

  const s = prepare(state, key);
  const e = s.expression;
  const l = last(e);
  let next = e;

  if (key.length === 1 && isDigit(key)) {
    const tn = trailingNumber(e);
    if (tn !== null && /e/i.test(tn)) return s; // no digits after an exponent result
    if (endsValue(l) && !isDigit(l)) next = e + '×' + key;
    else if (tn === '0') next = e.slice(0, -1) + key; // avoid leading zeros ("05")
    else next = e + key;
  } else {
    switch (key) {
      case '.': {
        const tn = trailingNumber(e);
        if (tn !== null) {
          if (tn.includes('.') || /e/i.test(tn)) return s;
          next = e + '.';
        } else if (endsValue(l)) {
          next = e + '×0.';
        } else {
          next = e + '0.';
        }
        break;
      }
      case '+': case '−': case '×': case '÷':
        next = pressOperator(e, key);
        break;
      case '(':
        next = endsValue(trimDot(e).slice(-1)) ? trimDot(e) + '×(' : trimDot(e) + '(';
        break;
      case ')': {
        const t = trimDot(e);
        const open = (t.match(/\(/g) ?? []).length;
        const close = (t.match(/\)/g) ?? []).length;
        if (open > close && endsValue(last(t))) next = t + ')';
        break;
      }
      case '%': {
        const t = trimDot(e);
        if (endsValue(last(t))) next = t + '%';
        break;
      }
      case '²': {
        const t = trimDot(e);
        if (endsValue(last(t))) next = t + '²';
        break;
      }
      case '√': {
        const t = trimDot(e);
        next = endsValue(last(t)) ? t + '×√' : t + '√';
        break;
      }
      case 'back':
        next = e.slice(0, -1);
        break;
      case 'sign':
        next = toggleSign(e);
        break;
      default:
        break;
    }
  }

  if (next.length > MAX_LENGTH) return s;
  return { expression: next, result: null, error: null };
}

export interface Committed {
  expression: string;
  result: string;
}

/** Press "=". Returns the new state and the entry to save in history (if any). */
export function pressEquals(state: CalcState): { state: CalcState; committed: Committed | null } {
  if (state.result !== null || state.expression === '') {
    return { state, committed: null };
  }
  const expr = autoClose(stripTrailing(state.expression));
  if (expr === '') return { state, committed: null };
  const out = calculate(expr);
  if (!out.ok) {
    return { state: { ...state, result: null, error: out.error }, committed: null };
  }
  return {
    state: { expression: expr, result: out.text, error: null },
    committed: hasOperation(expr) ? { expression: expr, result: out.text } : null,
  };
}

/** Live preview shown (dimmed) while typing, or null when there is nothing useful. */
export function previewResult(state: CalcState): string | null {
  if (state.result !== null || state.error !== null) return null;
  const expr = stripTrailing(state.expression);
  if (!hasOperation(expr)) return null;
  const out = calculate(expr);
  return out.ok ? out.text : null;
}

/** The number the calculator currently "holds", used by M+ and M-. */
export function currentValue(state: CalcState): number | null {
  if (state.error !== null) return null;
  if (state.result !== null) {
    const n = Number(state.result);
    return Number.isFinite(n) ? n : null;
  }
  const expr = stripTrailing(state.expression);
  if (expr === '') return null;
  try {
    return evaluate(expr);
  } catch {
    return null;
  }
}

/** Insert a number (used by MR) as if the user had typed it. */
export function insertNumber(state: CalcState, value: number): CalcState {
  const text = formatNumber(value);
  const piece = text.startsWith('-') ? `(${text})` : text;
  const base = state.result !== null ? '' : trimDot(state.expression);
  const next = endsValue(last(base)) ? `${base}×${piece}` : `${base}${piece}`;
  if (next.length > MAX_LENGTH) return state;
  return { expression: next, result: null, error: null };
}

/** Restore a saved history entry so it can be inspected, continued or edited. */
export function loadEntry(expression: string, result: string): CalcState {
  return { expression, result, error: null };
}
