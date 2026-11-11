/**
 * SidCalc expression engine.
 *
 * A hand written tokenizer + recursive-descent parser. It NEVER uses eval()
 * or Function(), so arbitrary text can never be executed as code.
 *
 * Grammar (lowest to highest precedence):
 *
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('*' | '/') unary | implicit unary)*
 *   unary      := ('-' | '+') unary | postfix
 *   postfix    := primary ('²' | '%')*
 *   primary    := NUMBER | '(' expression ')' | '√' primary
 *
 * Notes
 *  - Unary minus binds looser than square, so -3² = -9 (standard convention).
 *  - '√' applies to the next primary: √9 = 3, √(16) = 4, √9² = (√9)² = 9.
 *  - 'x%' is x / 100. In an addition/subtraction a trailing percentage is
 *    taken relative to the left side: 200 + 10% = 220, 200 - 10% = 180.
 *  - Implicit multiplication before ( or √ is accepted: 2(3) = 6, 2√9 = 6.
 */

/** Error with a message that is safe to show directly to the user. */
export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalcError';
  }
}

export const ERR_DIV_ZERO = 'Cannot divide by zero';
export const ERR_INVALID = 'Invalid expression';
export const ERR_DOMAIN = 'Invalid input';
export const ERR_OVERFLOW = 'Result too large';

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

export type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'sqrt' }
  | { type: 'sq' }
  | { type: 'pct' };

// A number such as 12, 12., 12.5, .5 and optional exponent (from big results).
const NUMBER_AT_START = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

/** Convert an expression string into tokens. Throws CalcError on bad input. */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ') {
      i++;
      continue;
    }
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      const match = NUMBER_AT_START.exec(input.slice(i));
      if (!match) throw new CalcError(ERR_INVALID);
      const value = Number(match[0]);
      if (!Number.isFinite(value)) throw new CalcError(ERR_OVERFLOW);
      tokens.push({ type: 'num', value });
      i += match[0].length;
      continue;
    }
    switch (ch) {
      case '+':
        tokens.push({ type: 'op', value: '+' });
        break;
      case '-':
      case '−': // U+2212 minus sign
        tokens.push({ type: 'op', value: '-' });
        break;
      case '×':
      case '*':
        tokens.push({ type: 'op', value: '*' });
        break;
      case '÷':
      case '/':
        tokens.push({ type: 'op', value: '/' });
        break;
      case '(':
        tokens.push({ type: 'lparen' });
        break;
      case ')':
        tokens.push({ type: 'rparen' });
        break;
      case '√':
        tokens.push({ type: 'sqrt' });
        break;
      case '²':
        tokens.push({ type: 'sq' });
        break;
      case '%':
        tokens.push({ type: 'pct' });
        break;
      default:
        throw new CalcError(ERR_INVALID);
    }
    i++;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Parser / evaluator
// ---------------------------------------------------------------------------

/** A parsed value. `pct` marks a value that was written with a trailing %. */
interface Value {
  v: number;
  pct: boolean;
}

/** Throw if a computed number is not a usable finite number. */
function checkFinite(n: number): number {
  if (Number.isNaN(n)) throw new CalcError(ERR_INVALID);
  if (!Number.isFinite(n)) throw new CalcError(ERR_OVERFLOW);
  return n;
}

class Parser {
  private pos = 0;
  private depth = 0;

  constructor(private readonly tokens: Token[]) {}

  /** Parse the whole token list and return the numeric result. */
  parse(): number {
    if (this.tokens.length === 0) throw new CalcError(ERR_INVALID);
    const result = this.expression();
    if (this.pos < this.tokens.length) throw new CalcError(ERR_INVALID);
    return result.v;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private isOp(t: Token | undefined, ...ops: string[]): boolean {
    return !!t && t.type === 'op' && ops.includes(t.value);
  }

  private expression(): Value {
    let left = this.term();
    while (this.isOp(this.peek(), '+', '-')) {
      const op = (this.tokens[this.pos++] as { type: 'op'; value: string }).value;
      const right = this.term();
      // "200 + 10%" means 200 + (10% of 200).
      const rhs = right.pct ? left.v * right.v : right.v;
      left = { v: checkFinite(op === '+' ? left.v + rhs : left.v - rhs), pct: false };
    }
    return left;
  }

  private term(): Value {
    let left = this.unary();
    for (;;) {
      const t = this.peek();
      if (this.isOp(t, '*', '/')) {
        this.pos++;
        const right = this.unary();
        if ((t as { value: string }).value === '/') {
          if (right.v === 0) throw new CalcError(ERR_DIV_ZERO);
          left = { v: checkFinite(left.v / right.v), pct: false };
        } else {
          left = { v: checkFinite(left.v * right.v), pct: false };
        }
      } else if (t && (t.type === 'lparen' || t.type === 'sqrt')) {
        // Implicit multiplication before a bracket or root: 2(3), (1+1)(2+2), 2√9.
        // (A number directly after a number, like "1..2", stays invalid.)
        const right = this.unary();
        left = { v: checkFinite(left.v * right.v), pct: false };
      } else {
        return left;
      }
    }
  }

  private unary(): Value {
    const t = this.peek();
    if (this.isOp(t, '-', '+')) {
      this.pos++;
      this.enter();
      const inner = this.unary();
      this.depth--;
      const v = (t as { value: string }).value === '-' ? -inner.v : inner.v;
      return { v: v === 0 ? 0 : v, pct: inner.pct };
    }
    return this.postfix();
  }

  private postfix(): Value {
    let val = this.primary();
    for (;;) {
      const t = this.peek();
      if (t && t.type === 'sq') {
        this.pos++;
        val = { v: checkFinite(val.v * val.v), pct: false };
      } else if (t && t.type === 'pct') {
        this.pos++;
        val = { v: val.v / 100, pct: true };
      } else {
        return val;
      }
    }
  }

  private primary(): Value {
    const t = this.peek();
    if (!t) throw new CalcError(ERR_INVALID);
    switch (t.type) {
      case 'num':
        this.pos++;
        return { v: t.value, pct: false };
      case 'lparen': {
        this.pos++;
        this.enter();
        const inner = this.expression();
        this.depth--;
        const close = this.peek();
        if (!close || close.type !== 'rparen') throw new CalcError(ERR_INVALID);
        this.pos++;
        return { v: inner.v, pct: false };
      }
      case 'sqrt': {
        this.pos++;
        this.enter();
        const operand = this.primary();
        this.depth--;
        if (operand.v < 0) throw new CalcError(ERR_DOMAIN);
        return { v: Math.sqrt(operand.v), pct: false };
      }
      default:
        throw new CalcError(ERR_INVALID);
    }
  }

  /** Guard against absurdly deep nesting. */
  private enter(): void {
    this.depth++;
    if (this.depth > 200) throw new CalcError(ERR_INVALID);
  }
}

// ---------------------------------------------------------------------------
// Helpers used by the UI
// ---------------------------------------------------------------------------

/** Append ")" for every "(" that is still open, so "2×(3+4" still works. */
export function autoClose(expr: string): string {
  let open = 0;
  for (const ch of expr) {
    if (ch === '(') open++;
    else if (ch === ')') open--;
  }
  return open > 0 ? expr + ')'.repeat(open) : expr;
}

/** Evaluate an expression string to a number. Throws CalcError. */
export function evaluate(expr: string): number {
  const tokens = tokenize(autoClose(expr));
  const value = new Parser(tokens).parse();
  return checkFinite(value);
}

/**
 * Format a number for display / storage: removes floating-point noise
 * (0.1 + 0.2 -> 0.3), never shows "-0", and switches to scientific notation
 * for very large or very small values.
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) throw new CalcError(ERR_OVERFLOW);
  if (n === 0) return '0';
  const p15 = Number(n.toPrecision(15));
  const r = Number.isInteger(p15) ? p15 : Number(n.toPrecision(12));
  if (r === 0) return '0';
  const abs = Math.abs(r);
  if (abs >= 1e15 || abs < 1e-6) return r.toExponential();
  return String(r);
}

/** Add thousands separators to a plain number string for display only. */
export function groupDigits(plain: string): string {
  const match = /^(-?)(\d+)(\.\d+)?(e[+-]\d+)?$/.exec(plain);
  if (!match) return plain;
  const [, sign, int, frac = '', exp = ''] = match;
  return sign + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + frac + exp;
}

export type CalcOutcome =
  | { ok: true; value: number; text: string }
  | { ok: false; error: string };

/** Evaluate and format in one step; never throws. */
export function calculate(expr: string): CalcOutcome {
  try {
    const value = evaluate(expr);
    return { ok: true, value, text: formatNumber(value) };
  } catch (e) {
    if (e instanceof CalcError) return { ok: false, error: e.message };
    return { ok: false, error: ERR_INVALID };
  }
}

/**
 * True when the expression contains real work (an operator, bracket or
 * function), as opposed to a lone number. Used to decide what is saved to
 * history.
 */
export function hasOperation(expr: string): boolean {
  try {
    const t = tokenize(expr);
    if (t.length <= 1) return false;
    if (t.length === 2 && t[0].type === 'op' && t[0].value === '-' && t[1].type === 'num') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
