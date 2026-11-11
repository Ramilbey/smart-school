// Homework helper: a student types a problem and gets it back as steps, one at a time.
// Fully deterministic, no AI: exact fractions, so what it says is always mathematically right.
// Handles linear equations (al-Xorazmiy's method, including "no root" and "infinitely many"), simplifying,
// arithmetic with fractions and brackets, percentages, powers and (x ± n)².

import type { Text } from './types.ts';

export interface Solution {
  /** The problem, tidied up. */
  problem: string;
  steps: Text[];
  /** The final result in words and symbols. */
  answer: Text;
  /** A number to compare with, when there is one (tests). */
  value?: number;
  kind: 'equation' | 'simplify' | 'arithmetic' | 'percent' | 'square';
}

const T = (uz: string, ru: string, en: string): Text => ({ uz, ru, en });
const S = (s: string): Text => ({ uz: s, ru: s, en: s });

/* ---------- exact fractions ---------- */

interface Rat {
  n: number;
  d: number;
}
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const rat = (n: number, d = 1): Rat => {
  if (d === 0) throw new Unsupported('division by zero');
  const g = gcd(n, d) || 1;
  const sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
};
const add = (a: Rat, b: Rat) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const neg = (a: Rat) => rat(-a.n, a.d);
const sub = (a: Rat, b: Rat) => add(a, neg(b));
const mul = (a: Rat, b: Rat) => rat(a.n * b.n, a.d * b.d);
const div = (a: Rat, b: Rat) => {
  if (b.n === 0) throw new Unsupported('division by zero');
  return rat(a.n * b.d, a.d * b.n);
};
const isZero = (a: Rat) => a.n === 0;
const value = (a: Rat) => a.n / a.d;
const isOne = (a: Rat) => a.n === a.d;
const MINUS = '−';

/** "3/4", "−2". */
function show(a: Rat): string {
  const abs = Math.abs(a.n);
  return (a.n < 0 ? MINUS : '') + (a.d === 1 ? String(abs) : `${abs}/${a.d}`);
}
const showPar = (a: Rat) => (a.n < 0 ? `(${show(a)})` : show(a));

class Unsupported extends Error {}

/* ---------- reading what the student typed ---------- */

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/[хҳ×]/g, (c) => (c === '×' ? '*' : 'x'))
    .replace(/[·∙•]/g, '*')
    .replace(/÷/g, ':')
    .replace(/,/g, '.')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\s+/g, '');
}

type Tok = { t: 'num'; v: Rat; text: string } | { t: 'x' } | { t: 'op'; v: string };

function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const text = s.slice(i, j);
      if (!/^\d+(\.\d+)?$/.test(text)) throw new Unsupported('bad number');
      const dot = text.indexOf('.');
      const v = dot < 0 ? rat(Number(text)) : rat(Number(text.replace('.', '')), 10 ** (text.length - dot - 1));
      out.push({ t: 'num', v, text });
      i = j;
    } else if (c === 'x') {
      out.push({ t: 'x' });
      i++;
    } else if ('+-*/:()^='.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
    } else {
      throw new Unsupported(`unexpected ${c}`);
    }
  }
  return out;
}

/** A linear expression: a·x + b. */
interface Lin {
  a: Rat;
  b: Rat;
}
const zero = rat(0);
const constant = (b: Rat): Lin => ({ a: zero, b });

class Parser {
  i = 0;
  sawBracket = false;
  constructor(private toks: Tok[]) {}
  private peek() {
    return this.toks[this.i];
  }
  private isOp(v: string) {
    const t = this.peek();
    return t?.t === 'op' && t.v === v;
  }
  private eat(v: string) {
    if (!this.isOp(v)) throw new Unsupported(`expected ${v}`);
    this.i++;
  }
  done() {
    return this.i >= this.toks.length;
  }
  expr(): Lin {
    let left = this.term();
    while (this.isOp('+') || this.isOp('-')) {
      const plus = this.isOp('+');
      this.i++;
      const right = this.term();
      left = plus ? { a: add(left.a, right.a), b: add(left.b, right.b) } : { a: sub(left.a, right.a), b: sub(left.b, right.b) };
    }
    return left;
  }
  private term(): Lin {
    let left = this.factor();
    for (;;) {
      if (this.isOp('*')) {
        this.i++;
        left = times(left, this.factor());
      } else if (this.isOp('/') || this.isOp(':')) {
        this.i++;
        const right = this.factor();
        if (!isZero(right.a) || isZero(right.b)) throw new Unsupported('cannot divide by that');
        left = { a: div(left.a, right.b), b: div(left.b, right.b) };
      } else if (this.peek()?.t === 'x' || this.isOp('(') || this.peek()?.t === 'num') {
        // Implicit multiplication: 3x, 2(x + 1), (x + 1)2.
        left = times(left, this.factor());
      } else {
        return left;
      }
    }
  }
  private factor(): Lin {
    if (this.isOp('-')) {
      this.i++;
      const f = this.factor();
      return { a: neg(f.a), b: neg(f.b) };
    }
    if (this.isOp('+')) {
      this.i++;
      return this.factor();
    }
    let base: Lin;
    const t = this.peek();
    if (t?.t === 'num') {
      this.i++;
      base = constant(t.v);
    } else if (t?.t === 'x') {
      this.i++;
      base = { a: rat(1), b: zero };
    } else if (this.isOp('(')) {
      this.i++;
      this.sawBracket = true;
      base = this.expr();
      this.eat(')');
    } else {
      throw new Unsupported('expected a value');
    }
    if (this.isOp('^')) {
      this.i++;
      const e = this.peek();
      if (e?.t !== 'num' || e.v.d !== 1 || e.v.n > 12 || e.v.n < 0 || !isZero(base.a)) throw new Unsupported('power');
      this.i++;
      let r = rat(1);
      for (let k = 0; k < e.v.n; k++) r = mul(r, base.b);
      base = constant(r);
    }
    return base;
  }
}

function times(p: Lin, q: Lin): Lin {
  if (!isZero(p.a) && !isZero(q.a)) throw new Unsupported('not linear');
  if (!isZero(p.a)) return { a: mul(p.a, q.b), b: mul(p.b, q.b) };
  return { a: mul(q.a, p.b), b: mul(q.b, p.b) };
}

function parseLin(s: string): { lin: Lin; bracket: boolean } {
  const p = new Parser(tokenize(s));
  const lin = p.expr();
  if (!p.done()) throw new Unsupported('trailing input');
  return { lin, bracket: p.sawBracket };
}

/** "3x − 4", "x", "−x/2", "5". */
function showLin(l: Lin): string {
  const ax = isZero(l.a) ? '' : isOne(l.a) ? 'x' : l.a.n === -l.a.d ? `${MINUS}x` : `${show(l.a)}x`;
  if (!ax) return show(l.b);
  if (isZero(l.b)) return ax;
  return `${ax} ${l.b.n < 0 ? MINUS : '+'} ${show(rat(Math.abs(l.b.n), l.b.d))}`;
}

const pretty = (s: string) => s.replace(/-/g, MINUS).replace(/\*/g, ' · ').replace(/([=+:])/g, ' $1 ').replace(/\s+/g, ' ').trim();

/* ---------- the kinds of problem ---------- */

function solveEquation(left: string, right: string): Solution {
  const L = parseLin(left), R = parseLin(right);
  const problem = `${pretty(left)} = ${pretty(right)}`;
  const steps: Text[] = [];
  if (L.bracket || R.bracket) {
    steps.push(T(
      `Qavslarni ochamiz:\n<b>${showLin(L.lin)} = ${showLin(R.lin)}</b>`,
      `Раскрываем скобки:\n<b>${showLin(L.lin)} = ${showLin(R.lin)}</b>`,
      `Open the brackets:\n<b>${showLin(L.lin)} = ${showLin(R.lin)}</b>`,
    ));
  }
  const a = sub(L.lin.a, R.lin.a), b = sub(R.lin.b, L.lin.b);
  const moved = !isZero(R.lin.a) || !isZero(L.lin.b);
  if (moved) {
    steps.push(T(
      `<b>Al-jabr:</b> x li hadlarni chapga, sonlarni o‘ngga o‘tkazamiz. O‘tganda ishorasi o‘zgaradi.\n<b>${isZero(a) ? `0 · x` : showLin({ a, b: zero })} = ${show(b)}</b>`,
      `<b>Аль-джабр:</b> члены с x — налево, числа — направо. При переносе знак меняется.\n<b>${isZero(a) ? `0 · x` : showLin({ a, b: zero })} = ${show(b)}</b>`,
      `<b>Al-jabr:</b> move x terms left and numbers right. Crossing over flips the sign.\n<b>${isZero(a) ? `0 · x` : showLin({ a, b: zero })} = ${show(b)}</b>`,
    ));
  }
  if (isZero(a)) {
    if (isZero(b)) {
      steps.push(T('x ning istalgan qiymatida 0 = 0 to‘g‘ri.', 'При любом x верно 0 = 0.', '0 = 0 is true for every x.'));
      return { problem, steps, answer: T('Cheksiz ko‘p ildiz', 'Бесконечно много корней', 'Infinitely many roots'), kind: 'equation' };
    }
    steps.push(T(`0 · x hech qachon ${show(b)} ga teng bo‘lmaydi.`, `0 · x никогда не равно ${show(b)}.`, `0 · x can never equal ${show(b)}.`));
    return { problem, steps, answer: T('Ildizi yo‘q', 'Корней нет', 'No roots'), kind: 'equation' };
  }
  const x = div(b, a);
  if (!isOne(a)) {
    steps.push(T(
      `Ikkala tomonni <b>${showPar(a)}</b> ga bo‘lamiz:\n<b>x = ${show(b)} : ${showPar(a)}</b>`,
      `Делим обе части на <b>${showPar(a)}</b>:\n<b>x = ${show(b)} : ${showPar(a)}</b>`,
      `Divide both sides by <b>${showPar(a)}</b>:\n<b>x = ${show(b)} ÷ ${showPar(a)}</b>`,
    ));
  }
  const lv = add(mul(L.lin.a, x), L.lin.b), rv = add(mul(R.lin.a, x), R.lin.b);
  steps.push(T(
    `Tekshiramiz: x = ${show(x)} qo‘yilsa, chap tomon ${show(lv)}, o‘ng tomon ${show(rv)} ✓`,
    `Проверяем: при x = ${show(x)} левая часть ${show(lv)}, правая ${show(rv)} ✓`,
    `Check: with x = ${show(x)}, the left side is ${show(lv)} and the right side is ${show(rv)} ✓`,
  ));
  return { problem, steps, answer: S(`x = ${show(x)}`), value: value(x), kind: 'equation' };
}

function solveSimplify(s: string): Solution {
  const { lin, bracket } = parseLin(s);
  const steps: Text[] = [];
  if (bracket) {
    steps.push(T('Avval qavslarni ochamiz. Oldida minus bo‘lsa, ishoralar o‘zgaradi.', 'Сначала раскрываем скобки. Если перед ними минус, знаки меняются.', 'Open the brackets first. A minus in front flips the signs.'));
  }
  steps.push(T(
    `O‘xshash hadlarni birlashtiramiz: x li hadlar bilan alohida, sonlar bilan alohida.\n<b>${showLin(lin)}</b>`,
    `Приводим подобные: отдельно с x, отдельно числа.\n<b>${showLin(lin)}</b>`,
    `Combine like terms: x terms together, numbers together.\n<b>${showLin(lin)}</b>`,
  ));
  return { problem: pretty(s), steps, answer: S(showLin(lin)), kind: 'simplify' };
}

function solveFractions(a: Rat, op: string, b: Rat, problem: string): Solution {
  const steps: Text[] = [];
  let r: Rat;
  if (op === '+' || op === '-') {
    r = op === '+' ? add(a, b) : sub(a, b);
    const common = (a.d * b.d) / gcd(a.d, b.d);
    const na = (a.n * common) / a.d, nb = (b.n * common) / b.d;
    if (a.d !== b.d) {
      steps.push(T(
        `Umumiy maxrajga keltiramiz: <b>${common}</b>.\n${na}/${common} ${op === '+' ? '+' : MINUS} ${nb}/${common}`,
        `Приводим к общему знаменателю: <b>${common}</b>.\n${na}/${common} ${op === '+' ? '+' : MINUS} ${nb}/${common}`,
        `Use a common denominator: <b>${common}</b>.\n${na}/${common} ${op === '+' ? '+' : MINUS} ${nb}/${common}`,
      ));
    }
    const top = op === '+' ? na + nb : na - nb;
    steps.push(T(`Suratlarni ${op === '+' ? 'qo‘shamiz' : 'ayiramiz'}: <b>${show(rat(top))}/${common}</b>`, `${op === '+' ? 'Складываем' : 'Вычитаем'} числители: <b>${show(rat(top))}/${common}</b>`, `${op === '+' ? 'Add' : 'Subtract'} the numerators: <b>${show(rat(top))}/${common}</b>`));
  } else if (op === '*') {
    r = mul(a, b);
    steps.push(T(
      `Suratni suratga, maxrajni maxrajga ko‘paytiramiz: <b>${a.n * b.n}/${a.d * b.d}</b>`,
      `Числитель на числитель, знаменатель на знаменатель: <b>${a.n * b.n}/${a.d * b.d}</b>`,
      `Multiply top by top and bottom by bottom: <b>${a.n * b.n}/${a.d * b.d}</b>`,
    ));
  } else {
    r = div(a, b);
    const flipped = rat(b.d, b.n);
    steps.push(T(
      `Kasrga bo‘lish — teskarisiga ko‘paytirish:\n<b>${show(a)} · ${show(flipped)}</b>`,
      `Делить на дробь — значит умножать на обратную:\n<b>${show(a)} · ${show(flipped)}</b>`,
      `Dividing by a fraction means multiplying by its flip:\n<b>${show(a)} · ${show(flipped)}</b>`,
    ));
  }
  return { problem, steps, answer: S(`${problem} = ${show(r)}`), value: value(r), kind: 'arithmetic' };
}

function solvePercent(s: string): Solution | null {
  const m =
    /^(\d+(?:\.\d+)?)ning(\d+(?:\.\d+)?)%(?:i)?$/.exec(s) ??
    /^(\d+(?:\.\d+)?)ni?ng(\d+(?:\.\d+)?)foiz(?:i)?$/.exec(s);
  const rev = /^(\d+(?:\.\d+)?)%(?:of|от|dan|из)(\d+(?:\.\d+)?)$/.exec(s);
  const [whole, pct] = m ? [Number(m[1]), Number(m[2])] : rev ? [Number(rev[2]), Number(rev[1])] : [NaN, NaN];
  if (!Number.isFinite(whole)) return null;
  const one = whole / 100, result = Math.round(one * pct * 1000) / 1000;
  const f = (n: number) => String(Math.round(n * 1000) / 1000);
  return {
    problem: `${pct}% · ${whole}`,
    steps: [
      T(`Avval 1% ni topamiz: <b>${whole} : 100 = ${f(one)}</b>`, `Сначала находим 1%: <b>${whole} : 100 = ${f(one)}</b>`, `First find 1%: <b>${whole} ÷ 100 = ${f(one)}</b>`),
      T(`Endi ${pct} ga ko‘paytiramiz: <b>${f(one)} · ${pct}</b>`, `Теперь умножаем на ${pct}: <b>${f(one)} · ${pct}</b>`, `Now multiply by ${pct}: <b>${f(one)} · ${pct}</b>`),
    ],
    answer: T(`${whole} ning ${pct}% i = ${f(result)}`, `${pct}% от ${whole} = ${f(result)}`, `${pct}% of ${whole} = ${f(result)}`),
    value: result,
    kind: 'percent',
  };
}

function solveSquare(s: string): Solution | null {
  const m = /^\(x([+-])(\d+)\)\^2$/.exec(s);
  if (!m) return null;
  const n = Number(m[2]), minus = m[1] === '-', mid = 2 * n, last = n * n;
  const result = `x² ${minus ? MINUS : '+'} ${mid}x + ${last}`;
  return {
    problem: `(x ${minus ? MINUS : '+'} ${n})²`,
    steps: [
      T(`Formula: <b>(a ${minus ? MINUS : '+'} b)² = a² ${minus ? MINUS : '+'} 2ab + b²</b>`, `Формула: <b>(a ${minus ? MINUS : '+'} b)² = a² ${minus ? MINUS : '+'} 2ab + b²</b>`, `Formula: <b>(a ${minus ? MINUS : '+'} b)² = a² ${minus ? MINUS : '+'} 2ab + b²</b>`),
      T(`Bu yerda a = x, b = ${n}.\n2ab = 2 · x · ${n} = ${mid}x, b² = ${last}`, `Здесь a = x, b = ${n}.\n2ab = 2 · x · ${n} = ${mid}x, b² = ${last}`, `Here a = x and b = ${n}.\n2ab = 2 · x · ${n} = ${mid}x, b² = ${last}`),
    ],
    answer: S(result),
    kind: 'square',
  };
}

/** Numbers and operations only: 12 * (3 + 4), 2^5, 0.5 + 1/4. */
function solveArithmetic(s: string): Solution {
  const two = /^(\d+)\/(\d+)([+\-*:])(\d+)\/(\d+)$/.exec(s);
  if (two) {
    const a = rat(Number(two[1]), Number(two[2])), b = rat(Number(two[4]), Number(two[5]));
    const opShown = two[3] === '*' ? '·' : two[3] === '-' ? MINUS : two[3];
    return solveFractions(a, two[3], b, `${two[1]}/${two[2]} ${opShown} ${two[4]}/${two[5]}`);
  }
  const { lin, bracket } = parseLin(s);
  const steps: Text[] = [];
  if (bracket) steps.push(T('Avval qavs ichidagi amallarni bajaramiz.', 'Сначала выполняем действия в скобках.', 'Do what is inside the brackets first.'));
  if (/\^/.test(s)) steps.push(T('Keyin darajani hisoblaymiz.', 'Затем вычисляем степень.', 'Then work out the power.'));
  steps.push(T('Ko‘paytirish va bo‘lishni bajaramiz, oxirida qo‘shish va ayirish.', 'Выполняем умножение и деление, затем сложение и вычитание.', 'Multiply and divide next, then add and subtract last.'));
  return { problem: pretty(s), steps, answer: S(`${pretty(s)} = ${show(lin.b)}`), value: value(lin.b), kind: 'arithmetic' };
}

/**
 * Tries to read the text as a maths problem. Returns null when it is not one,
 * so ordinary words ("salom", "kasr nima?") go elsewhere.
 */
export function solveProblem(raw: string): Solution | null {
  if (raw.length > 80) return null;
  const s = normalize(raw);
  // Must contain a digit or x with an operator, and no other letters except the percent words.
  const percent = solvePercentSafe(s);
  if (percent) return percent;
  if (!/[0-9x]/.test(s) || /[a-wyzа-яё]/.test(s) || !/[+\-*/:=^]/.test(s)) return null;
  try {
    const square = solveSquare(s);
    if (square) return square;
    const parts = s.split('=');
    if (parts.length > 2) return null;
    if (parts.length === 2) {
      if (!parts[0] || !parts[1] || !s.includes('x')) return null;
      return solveEquation(parts[0], parts[1]);
    }
    return s.includes('x') ? solveSimplify(s) : solveArithmetic(s);
  } catch (e) {
    if (e instanceof Unsupported) return null;
    throw e;
  }
}

function solvePercentSafe(s: string): Solution | null {
  try {
    return solvePercent(s);
  } catch {
    return null;
  }
}
