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
 *   unary      := ('-' | '+') unary | power
 *   power      := postfix ('^' exponent)?          (right-associative)
 *   exponent   := ('-' | '+') exponent | power
 *   postfix    := primary ('²' | '%' | '!')*
 *   primary    := NUMBER | 'π' | 'e' | '(' expression ')'
 *               | ('√' | '∛' | FUNCTION) primary
 *
 * Notes
 *  - Unary minus binds looser than power, so -3² = -9 and -2^2 = -4.
 *  - Functions: sin cos tan asin acos atan log (base 10) ln. Trig functions
 *    use degrees or radians according to the `angle` argument.
 *  - '√' and '∛' apply to the next primary: √9 = 3, √9² = (√9)² = 9.
 *  - 'x%' is x / 100. In an addition/subtraction a trailing percentage is
 *    taken relative to the left side: 200 + 10% = 220, 200 - 10% = 180.
 *  - Implicit multiplication before ( √ ∛ π e or a function is accepted:
 *    2(3) = 6, 2π = 6.28…, 2sin(30°) = 1.
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

/** Angle unit used by sin / cos / tan and their inverses. */
export type AngleMode = 'deg' | 'rad';

export const FUNCTION_NAMES = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln'] as const;
export type FunctionName = (typeof FUNCTION_NAMES)[number];

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

export type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'sqrt' }
  | { type: 'cbrt' }
  | { type: 'sq' }
  | { type: 'pct' }
  | { type: 'fact' }
  | { type: 'pow' }
  | { type: 'const'; value: number }
  | { type: 'fn'; name: FunctionName };

// A number such as 12, 12., 12.5, .5 and optional exponent (from big results).
const NUMBER_AT_START = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
const WORD_AT_START = /^[a-z]+/;

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
    if (ch >= 'a' && ch <= 'z') {
      const word = WORD_AT_START.exec(input.slice(i))![0];
      if (word === 'e') {
        tokens.push({ type: 'const', value: Math.E });
      } else if ((FUNCTION_NAMES as readonly string[]).includes(word)) {
        tokens.push({ type: 'fn', name: word as FunctionName });
      } else {
        throw new CalcError(ERR_INVALID);
      }
      i += word.length;
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
      case '∛':
        tokens.push({ type: 'cbrt' });
        break;
      case '²':
        tokens.push({ type: 'sq' });
        break;
      case '%':
        tokens.push({ type: 'pct' });
        break;
      case '!':
        tokens.push({ type: 'fact' });
        break;
      case '^':
        tokens.push({ type: 'pow' });
        break;
      case 'π':
        tokens.push({ type: 'const', value: Math.PI });
        break;
      default:
        throw new CalcError(ERR_INVALID);
    }
    i++;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/** Throw if a computed number is not a usable finite number. */
function checkFinite(n: number): number {
  if (Number.isNaN(n)) throw new CalcError(ERR_INVALID);
  if (!Number.isFinite(n)) throw new CalcError(ERR_OVERFLOW);
  return n;
}

/** Remove floating point dust such as sin(π) = 1.2e-16. */
const snap = (n: number): number => (Math.abs(n) < 1e-14 ? 0 : n);

const DEG = Math.PI / 180;

/** Apply a named function. Exact results are returned for exact angles. */
export function applyFunction(name: FunctionName, x: number, angle: AngleMode): number {
  const deg = angle === 'deg';
  switch (name) {
    case 'sin':
      if (deg && x % 180 === 0) return 0;
      return snap(Math.sin(deg ? x * DEG : x));
    case 'cos':
      if (deg && (x - 90) % 180 === 0) return 0;
      return snap(Math.cos(deg ? x * DEG : x));
    case 'tan': {
      if (deg) {
        if (x % 180 === 0) return 0;
        if ((x - 90) % 180 === 0) throw new CalcError(ERR_DOMAIN); // tan(90°) is undefined
      }
      const r = Math.tan(deg ? x * DEG : x);
      if (Math.abs(r) > 1e15) throw new CalcError(ERR_DOMAIN);
      return snap(r);
    }
    case 'asin': {
      if (x < -1 || x > 1) throw new CalcError(ERR_DOMAIN);
      const r = Math.asin(x);
      return deg ? r / DEG : r;
    }
    case 'acos': {
      if (x < -1 || x > 1) throw new CalcError(ERR_DOMAIN);
      const r = Math.acos(x);
      return deg ? r / DEG : r;
    }
    case 'atan': {
      const r = Math.atan(x);
      return deg ? r / DEG : r;
    }
    case 'log':
      if (x <= 0) throw new CalcError(ERR_DOMAIN);
      return Math.log10(x);
    case 'ln':
      if (x <= 0) throw new CalcError(ERR_DOMAIN);
      return Math.log(x);
  }
}

/** n! for whole numbers 0..170. */
export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new CalcError(ERR_DOMAIN);
  if (n > 170) throw new CalcError(ERR_OVERFLOW);
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** x raised to y with friendly errors. */
export function power(x: number, y: number): number {
  if (x === 0 && y < 0) throw new CalcError(ERR_DIV_ZERO);
  const r = Math.pow(x, y);
  if (Number.isNaN(r)) throw new CalcError(ERR_DOMAIN); // e.g. (-8)^0.5
  return checkFinite(r);
}

// ---------------------------------------------------------------------------
// Parser / evaluator
// ---------------------------------------------------------------------------

/** A parsed value. `pct` marks a value that was written with a trailing %. */
interface Value {
  v: number;
  pct: boolean;
}

const plain = (v: number): Value => ({ v, pct: false });

class Parser {
  private pos = 0;
  private depth = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly angle: AngleMode,
  ) {}

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
      left = plain(checkFinite(op === '+' ? left.v + rhs : left.v - rhs));
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
          left = plain(checkFinite(left.v / right.v));
        } else {
          left = plain(checkFinite(left.v * right.v));
        }
      } else if (
        t &&
        (t.type === 'lparen' ||
          t.type === 'sqrt' ||
          t.type === 'cbrt' ||
          t.type === 'const' ||
          t.type === 'fn')
      ) {
        // Implicit multiplication before a bracket, root, constant or function.
        // (A number directly after a number, like "1..2", stays invalid.)
        const right = this.unary();
        left = plain(checkFinite(left.v * right.v));
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
    return this.power();
  }

  private power(): Value {
    const base = this.postfix();
    if (this.peek()?.type === 'pow') {
      this.pos++;
      this.enter();
      const exp = this.exponent();
      this.depth--;
      return plain(power(base.v, exp));
    }
    return base;
  }

  /** The exponent after '^': may be negative, and chains to the right. */
  private exponent(): number {
    const t = this.peek();
    if (this.isOp(t, '-', '+')) {
      this.pos++;
      this.enter();
      const inner = this.exponent();
      this.depth--;
      return (t as { value: string }).value === '-' ? -inner : inner;
    }
    return this.power().v;
  }

  private postfix(): Value {
    let val = this.primary();
    for (;;) {
      const t = this.peek();
      if (t && t.type === 'sq') {
        this.pos++;
        val = plain(checkFinite(val.v * val.v));
      } else if (t && t.type === 'pct') {
        this.pos++;
        val = { v: val.v / 100, pct: true };
      } else if (t && t.type === 'fact') {
        this.pos++;
        val = plain(factorial(val.v));
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
        return plain(t.value);
      case 'const':
        this.pos++;
        return plain(t.value);
      case 'lparen': {
        this.pos++;
        this.enter();
        const inner = this.expression();
        this.depth--;
        const close = this.peek();
        if (!close || close.type !== 'rparen') throw new CalcError(ERR_INVALID);
        this.pos++;
        return plain(inner.v);
      }
      case 'sqrt':
      case 'cbrt':
      case 'fn': {
        this.pos++;
        this.enter();
        const operand = this.primary();
        this.depth--;
        if (t.type === 'sqrt') {
          if (operand.v < 0) throw new CalcError(ERR_DOMAIN);
          return plain(Math.sqrt(operand.v));
        }
        if (t.type === 'cbrt') return plain(Math.cbrt(operand.v));
        return plain(checkFinite(applyFunction(t.name, operand.v, this.angle)));
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
export function evaluate(expr: string, angle: AngleMode = 'deg'): number {
  const tokens = tokenize(autoClose(expr));
  const value = new Parser(tokens, angle).parse();
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
export function groupDigits(plainText: string): string {
  const match = /^(-?)(\d+)(\.\d+)?(e[+-]\d+)?$/.exec(plainText);
  if (!match) return plainText;
  const [, sign, int, frac = '', exp = ''] = match;
  return sign + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + frac + exp;
}

export type CalcOutcome =
  | { ok: true; value: number; text: string }
  | { ok: false; error: string };

/** Evaluate and format in one step; never throws. */
export function calculate(expr: string, angle: AngleMode = 'deg'): CalcOutcome {
  try {
    const value = evaluate(expr, angle);
    return { ok: true, value, text: formatNumber(value) };
  } catch (e) {
    if (e instanceof CalcError) return { ok: false, error: e.message };
    return { ok: false, error: ERR_INVALID };
  }
}

/**
 * True when the expression contains real work (an operator, bracket or
 * function), as opposed to a lone number or constant. Used to decide what is
 * saved to history.
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

/** True when the expression uses an angle-dependent function. */
export function usesAngles(expr: string): boolean {
  return /(?:sin|cos|tan)/.test(expr);
}
