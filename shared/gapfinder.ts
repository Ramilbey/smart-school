/**
 * The equation gap finder: when a pupil cannot solve a Grade 7 equation, find the earlier skill that is really missing.
 *
 * Research on algebra failure keeps pointing at the same few gaps from Grades 5–6: negative numbers, opening brackets, collecting
 * like terms, and "moving" a term across the equals sign without changing its sign. This module holds a small map of those skills,
 * question generators whose wrong answers reveal a specific mistake, and the diagnosis: test the equation, and on a failure test
 * the skills under it, going down until the lowest failing skill is found. All plain arithmetic, so it is fully testable.
 */

export type NodeId = 'eq_br' | 'eq_both' | 'dist' | 'eq2' | 'like' | 'eq1' | 'int_add' | 'int_mul';
export type MissId = 'sign_add' | 'minus_neg' | 'sign_mul' | 'dist_first' | 'dist_sign' | 'like_sign' | 'move_sign' | 'inv_op' | 'div_sign';

export const TARGET: NodeId = 'eq_br';
/** Each skill and the skills it is built on. */
export const PREREQ: Record<NodeId, NodeId[]> = {
  eq_br: ['eq_both', 'dist'],
  eq_both: ['eq2', 'like'],
  dist: ['int_mul'],
  eq2: ['eq1'],
  like: ['int_add'],
  eq1: ['int_add', 'int_mul'],
  int_add: [],
  int_mul: [],
};
/** The school grade where each skill is usually taught (Uzbekistan's maths books put negative numbers and simple equations in Grade 6). */
export const GRADE: Record<NodeId, number> = { eq_br: 7, eq_both: 7, dist: 6, eq2: 6, like: 6, eq1: 5, int_add: 6, int_mul: 6 };
export const NODES = Object.keys(PREREQ) as NodeId[];
/** Which skill a mistake points at, so that skill is checked first. */
export const MISS_POINTS: Record<MissId, NodeId> = {
  sign_add: 'int_add', minus_neg: 'int_add', sign_mul: 'int_mul', div_sign: 'int_mul', dist_first: 'dist', dist_sign: 'dist', like_sign: 'like', move_sign: 'eq1', inv_op: 'eq1',
};

export interface GQ {
  node: NodeId;
  /** What the pupil sees, e.g. "3(x − 2) = x + 4". A "□" marks the blank to fill in. */
  show: string;
  /** "x" = solve for x; "blank" = fill in the □; "value" = work it out. */
  ask: 'x' | 'blank' | 'value';
  answer: number;
  /** Wrong answers that point to a known mistake. */
  misses: { value: number; miss: MissId }[];
  /** The worked solution, one line per step (the same in every language). */
  steps: string[];
}

/* ---------- small helpers ---------- */
export type Rng = () => number;
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
/** A number written the school way: a real minus sign. */
export const n = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);
/** A number in brackets when it is negative: "(−3)". */
const p = (v: number) => (v < 0 ? `(${n(v)})` : `${v}`);
/** "+ 5" or "− 5" after another term. */
const sgn = (v: number) => (v < 0 ? `− ${Math.abs(v)}` : `+ ${v}`);
/** "3x", "x", "−x". */
const kx = (k: number) => (k === 1 ? 'x' : k === -1 ? '−x' : `${n(k)}x`);

function misses(answer: number, list: [number, MissId][]): GQ['misses'] {
  const out: GQ['misses'] = [];
  for (const [value, miss] of list) if (Number.isInteger(value) && value !== answer && !out.some((m) => m.value === value)) out.push({ value, miss });
  return out;
}

/* ---------- one generator per skill ---------- */
export function makeQuestion(node: NodeId, r: Rng): GQ {
  switch (node) {
    case 'int_add': {
      const form = int(r, 0, 2);
      if (form === 0) { // −a + b
        const a = int(r, 4, 12), b = int(r, 2, 9), ans = b - a;
        return { node, ask: 'value', show: `${n(-a)} + ${b}`, answer: ans, misses: misses(ans, [[-(a + b), 'sign_add'], [-ans, 'sign_add'], [a + b, 'sign_add']]), steps: [`${n(-a)} + ${b}`, a > b ? `= −(${a} − ${b})` : `= +(${b} − ${a})`, `= ${n(ans)}`] };
      }
      if (form === 1) { // a − (−b)
        const a = int(r, 2, 9), b = int(r, 2, 9), ans = a + b;
        return { node, ask: 'value', show: `${a} − (${n(-b)})`, answer: ans, misses: misses(ans, [[a - b, 'minus_neg'], [-ans, 'minus_neg']]), steps: [`${a} − (${n(-b)})`, `= ${a} + ${b}`, `= ${ans}`] };
      }
      const a = int(r, 2, 9), b = int(r, 2, 9), ans = -(a + b); // −a − b
      return { node, ask: 'value', show: `${n(-a)} − ${b}`, answer: ans, misses: misses(ans, [[b - a, 'sign_add'], [a - b, 'sign_add'], [a + b, 'sign_add']]), steps: [`${n(-a)} − ${b}`, `= −(${a} + ${b})`, `= ${n(ans)}`] };
    }
    case 'int_mul': {
      const a = int(r, 2, 9), b = int(r, 2, 9), form = int(r, 0, 3);
      if (form === 0) return { node, ask: 'value', show: `${p(-a)} · ${p(-b)}`, answer: a * b, misses: misses(a * b, [[-a * b, 'sign_mul']]), steps: [`${p(-a)} · ${p(-b)}`, `= +(${a} · ${b})`, `= ${a * b}`] };
      if (form === 1) return { node, ask: 'value', show: `${p(-a)} · ${b}`, answer: -a * b, misses: misses(-a * b, [[a * b, 'sign_mul']]), steps: [`${p(-a)} · ${b}`, `= −(${a} · ${b})`, `= ${n(-a * b)}`] };
      if (form === 2) return { node, ask: 'value', show: `${n(-a * b)} : ${b}`, answer: -a, misses: misses(-a, [[a, 'div_sign']]), steps: [`${n(-a * b)} : ${b}`, `= −(${a * b} : ${b})`, `= ${n(-a)}`] };
      return { node, ask: 'value', show: `${n(-a * b)} : ${p(-b)}`, answer: a, misses: misses(a, [[-a, 'div_sign']]), steps: [`${n(-a * b)} : ${p(-b)}`, `= +(${a * b} : ${b})`, `= ${a}`] };
    }
    case 'dist': {
      const a = int(r, 2, 6), b = int(r, 2, 9);
      if (r() < 0.5) { // a(x − b) = ax − □
        return { node, ask: 'blank', show: `${a}(x − ${b}) = ${a}x − □`, answer: a * b, misses: misses(a * b, [[b, 'dist_first'], [-a * b, 'dist_sign']]), steps: [`${a}(x − ${b})`, `= ${a} · x − ${a} · ${b}`, `= ${a}x − ${a * b}`] };
      }
      // −a(x − b) = −ax + □
      return { node, ask: 'blank', show: `−${a}(x − ${b}) = −${a}x + □`, answer: a * b, misses: misses(a * b, [[b, 'dist_first'], [-a * b, 'dist_sign'], [-b, 'dist_first']]), steps: [`−${a}(x − ${b})`, `= (−${a}) · x + (−${a}) · (−${b})`, `= −${a}x + ${a * b}`] };
    }
    case 'like': {
      if (r() < 0.5) {
        const a = int(r, 4, 9), b = int(r, 1, a - 1), c = int(r, 1, 6), ans = a - b + c;
        return { node, ask: 'blank', show: `${a}x − ${b}x + ${c}x = □x`, answer: ans, misses: misses(ans, [[a + b + c, 'like_sign'], [a - b - c, 'like_sign']]), steps: [`${a}x − ${b}x + ${c}x`, `= (${a} − ${b} + ${c})x`, `= ${ans}x`] };
      }
      const a = int(r, 2, 6), b = int(r, a + 1, a + 6), ans = a - b;
      return { node, ask: 'blank', show: `${a}x − ${b}x = □x`, answer: ans, misses: misses(ans, [[b - a, 'like_sign'], [a + b, 'like_sign']]), steps: [`${a}x − ${b}x`, `= (${a} − ${b})x`, `= ${n(ans)}x`] };
    }
    case 'eq1': {
      if (r() < 0.5) { // x − b = c
        const b = int(r, 2, 9), x = int(r, -6, 8), c = x - b;
        return { node, ask: 'x', show: `x − ${b} = ${n(c)}`, answer: x, misses: misses(x, [[c - b, 'move_sign'], [b - c, 'move_sign']]), steps: [`x − ${b} = ${n(c)}`, `x = ${n(c)} + ${b}`, `x = ${n(x)}`] };
      }
      const a = int(r, 2, 8), x = -int(r, 2, 9), c = a * x; // ax = c, c < 0
      return { node, ask: 'x', show: `${a}x = ${n(c)}`, answer: x, misses: misses(x, [[-x, 'div_sign'], [c - a, 'inv_op'], [c + a, 'inv_op'], [c * a, 'inv_op']]), steps: [`${a}x = ${n(c)}`, `x = ${n(c)} : ${a}`, `x = ${n(x)}`] };
    }
    case 'eq2': {
      const a = int(r, 2, 6), x = pick(r, [-5, -4, -3, -2, 2, 3, 4, 5, 6]), b = int(r, 2, 9) * (r() < 0.5 ? 1 : -1), c = a * x + b;
      return {
        node, ask: 'x', show: `${a}x ${sgn(b)} = ${n(c)}`, answer: x,
        misses: misses(x, [[(c + b) / a, 'move_sign'], [c / a - b, 'inv_op'], [(c - b) * a, 'inv_op'], [-x, 'sign_add']]),
        steps: [`${a}x ${sgn(b)} = ${n(c)}`, `${a}x = ${n(c)} ${sgn(-b)}`, `${a}x = ${n(c - b)}`, `x = ${n(c - b)} : ${a}`, `x = ${n(x)}`],
      };
    }
    case 'eq_both': {
      const c = int(r, 1, 4), a = c + int(r, 1, 4), x = pick(r, [-3, -2, 2, 3, 4, 5]), b = int(r, 1, 9) * (r() < 0.5 ? 1 : -1);
      const d = a * x + b - c * x;
      return {
        node, ask: 'x', show: `${kx(a)} ${sgn(b)} = ${kx(c)} ${sgn(d)}`, answer: x,
        misses: misses(x, [[(d + b) / (a - c), 'move_sign'], [(d - b) / (a + c), 'move_sign'], [(d - b) / (c - a), 'move_sign']]),
        steps: [`${kx(a)} ${sgn(b)} = ${kx(c)} ${sgn(d)}`, `${kx(a)} − ${kx(c)} = ${n(d)} ${sgn(-b)}`, `${kx(a - c)} = ${n(d - b)}`, ...(a - c === 1 ? [] : [`x = ${n(d - b)} : ${a - c}`, `x = ${n(x)}`])],
      };
    }
    case 'eq_br': {
      // a(x − b) = cx + d, with a > c so x has one clear answer
      const c = int(r, 1, 2), a = c + int(r, 1, 3), b = int(r, 1, 6), x = pick(r, [-2, 2, 3, 4, 5, 6, 7]);
      const d = a * (x - b) - c * x;
      return {
        node, ask: 'x', show: `${a}(x − ${b}) = ${kx(c)} ${sgn(d)}`, answer: x,
        misses: misses(x, [[(d + b) / (a - c), 'dist_first'], [(d - a * b) / (a - c), 'move_sign'], [(d + a * b) / (a + c), 'move_sign']]),
        steps: [`${a}(x − ${b}) = ${kx(c)} ${sgn(d)}`, `${a}x − ${a * b} = ${kx(c)} ${sgn(d)}`, `${kx(a)} − ${kx(c)} = ${n(d)} + ${a * b}`, `${kx(a - c)} = ${n(d + a * b)}`, ...(a - c === 1 ? [] : [`x = ${n(d + a * b)} : ${a - c}`, `x = ${n(x)}`])],
      };
    }
  }
}

/** Which mistake a wrong answer looks like, if any. */
export function missOf(q: GQ, value: number): MissId | undefined {
  return q.misses.find((m) => m.value === value)?.miss;
}

/** Reads what the pupil typed: "−5", "-5", " 12 ". Null when it is not a whole number. */
export function parseAnswer(raw: string): number | null {
  const s = raw.replace(/[−–—]/g, '-').replace(/\s+/g, '');
  return /^-?\d{1,4}$/.test(s) ? Number(s) : null;
}

/* ---------- the diagnosis ---------- */
export interface Answered { node: NodeId; correct: boolean; miss?: MissId }

/** A skill is decided after two right (passed) or two wrong (missing) answers, so one slip does not decide it. */
export function nodeStatus(history: Answered[], node: NodeId): 'pass' | 'fail' | 'open' {
  const mine = history.filter((h) => h.node === node);
  const right = mine.filter((h) => h.correct).length, wrong = mine.length - right;
  return right >= 2 ? 'pass' : wrong >= 2 ? 'fail' : 'open';
}

/** The skills under a node, the one its mistakes point at first. */
function orderedPrereqs(history: Answered[], node: NodeId): NodeId[] {
  const pointed = new Set(history.flatMap((h) => (h.miss ? [MISS_POINTS[h.miss]] : [])));
  const list = PREREQ[node];
  const under = (a: NodeId, b: NodeId): boolean => PREREQ[a].includes(b) || PREREQ[a].some((c) => under(c, b));
  const score = (c: NodeId) => (pointed.has(c) ? 0 : [...pointed].some((pt) => under(c, pt)) ? 1 : 2);
  return [...list].sort((a, b) => score(a) - score(b));
}

type Eval = { ask: NodeId } | 'pass' | 'fail';
function evaluate(history: Answered[], node: NodeId): Eval {
  const st = nodeStatus(history, node);
  if (st === 'open') return { ask: node };
  if (st === 'pass') return 'pass';
  for (const c of orderedPrereqs(history, node)) {
    const e = evaluate(history, c);
    if (typeof e === 'object') return e;
  }
  return 'fail';
}

export interface Diagnosis {
  /** The next skill to ask about, or null when the diagnosis is finished. */
  next: NodeId | null;
  status: Record<NodeId, 'pass' | 'fail' | 'open'>;
  /** The lowest missing skills: they fail, and everything under them that was checked passes. */
  roots: NodeId[];
}

export function diagnose(history: Answered[]): Diagnosis {
  const e = evaluate(history, TARGET);
  const status = Object.fromEntries(NODES.map((id) => [id, nodeStatus(history, id)])) as Diagnosis['status'];
  if (typeof e === 'object') return { next: e.ask, status, roots: [] };
  const roots = NODES.filter((id) => status[id] === 'fail' && PREREQ[id].every((c) => status[c] !== 'fail'));
  // deepest first: the most basic gap is fixed first
  const depth = (id: NodeId): number => (PREREQ[id].length ? 1 + Math.max(...PREREQ[id].map(depth)) : 0);
  roots.sort((a, b) => depth(a) - depth(b));
  return { next: null, status, roots };
}
