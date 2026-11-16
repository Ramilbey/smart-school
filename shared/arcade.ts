/**
 * The practice games for Grades 1–4 (the "arcade" of the student area).
 *
 * Everything here is plain arithmetic with no screen and no network, so it can be tested: making a question, checking an answer,
 * naming the mistake behind a wrong answer, moving the level up or down, and keeping the per-skill record that the skills map shows.
 *
 * Each game goes after one well-known difficulty in early maths (the game's `problem` text says which):
 *  - numline    placing a number on a line          → number sense (Siegler & Ramani's linear board-game studies)
 *  - maketen    filling a ten-frame                 → adding by making ten instead of counting on fingers
 *  - place      building a number from blocks       → a digit's value depends on its place
 *  - arrays     rows × columns                      → multiplication as equal rows, not a memorised table
 *  - fractions  which fraction is bigger            → "a bigger denominator means a bigger fraction" (whole-number bias)
 *  - stories    picking the bar model for a story   → reading a word problem instead of grabbing the numbers
 */

export type GameId = 'numline' | 'maketen' | 'place' | 'arrays' | 'fractions' | 'stories';
export const GAME_IDS: GameId[] = ['numline', 'maketen', 'place', 'arrays', 'fractions', 'stories'];
export const MAX_LEVEL = 4;
/** Questions in one round: short enough for a seven-year-old, long enough to move a level. */
export const ROUND = 8;

/** The school grades each game is written for. */
export const GAME_GRADES: Record<GameId, [number, number]> = {
  numline: [1, 4], maketen: [1, 2], place: [1, 3], arrays: [2, 4], fractions: [3, 4], stories: [1, 4],
};

export type Rng = () => number;
/** A small seeded generator (mulberry32), so a test can ask for the same questions twice. */
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
function shuffle<T>(r: Rng, xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}
/** The right answer plus wrong ones, with no repeats and nothing below zero, in a random order. */
function options(r: Rng, right: number, wrong: number[], n = 4): number[] {
  const out = [right];
  for (const w of wrong) if (out.length < n && w >= 0 && !out.includes(w)) out.push(w);
  for (let d = 1; out.length < n; d++) for (const w of [right + d, right - d]) if (out.length < n && w >= 0 && !out.includes(w)) out.push(w);
  return shuffle(r, out);
}
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export type Frac = [number, number];
export type ModelId = 'sum' | 'part' | 'diff' | 'groups' | 'share';
export type StoryKind = 'join' | 'separate' | 'missing' | 'compare' | 'groups' | 'share';

export type Question =
  | { game: 'numline'; level: number; min: number; max: number; target: number; step: number; labels: number[]; snap: boolean; tol: number }
  | { game: 'maketen'; level: number; kind: 'fill' | 'missing' | 'bridge'; a: number; b: number; total: number; answer: number }
  | { game: 'place'; level: number; kind: 'build'; target: number; places: number }
  | { game: 'place'; level: number; kind: 'read'; tens: number; ones: number; target: number; options: number[] }
  | { game: 'arrays'; level: number; kind: 'count' | 'fact' | 'missing'; rows: number; cols: number; answer: number; options: number[] }
  | { game: 'arrays'; level: number; kind: 'build'; rows: number; cols: number; answer: number }
  | { game: 'fractions'; level: number; a: Frac; b: Frac; answer: 'a' | 'b' | 'eq'; showBars: boolean; withEqual: boolean }
  | { game: 'stories'; level: number; kind: StoryKind; a: number; b: number; answer: number; who: number; thing: number; model: ModelId; models: ModelId[]; options: number[] };

/** The mistake a wrong answer points to. The screen turns each one into a sentence and a picture. */
export type Miss =
  | 'nl_half' | 'nl_near'
  | 'ten_off' | 'ten_bridge'
  | 'pv_swap' | 'pv_build' | 'pv_regroup'
  | 'arr_add' | 'arr_rows'
  | 'fr_bigden' | 'fr_top' | 'fr_equal' | 'fr_other'
  | 'st_model' | 'st_op' | 'st_calc';

export type Answer = number | 'a' | 'b' | 'eq' | { h: number; t: number; o: number } | { rows: number; cols: number } | { model: ModelId };
export interface Verdict {
  ok: boolean;
  /** True when this was only a step on the way (the story's bar model): the question goes on. */
  partial?: boolean;
  miss?: Miss;
}

const MODEL_OF: Record<StoryKind, ModelId> = { join: 'sum', separate: 'part', missing: 'part', compare: 'diff', groups: 'groups', share: 'share' };

/** A new question for a game at a level (1 to MAX_LEVEL). */
export function makeQuestion(game: GameId, level: number, r: Rng): Question {
  const L = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
  switch (game) {
    case 'numline': {
      const spec = [
        { max: 10, step: 1, labels: [0, 5, 10], snap: true, tol: 0 },
        { max: 20, step: 1, labels: [0, 10, 20], snap: true, tol: 1 },
        { max: 100, step: 10, labels: [0, 50, 100], snap: false, tol: 5 },
        { max: 1000, step: 100, labels: [0, 500, 1000], snap: false, tol: 50 },
      ][L - 1]!;
      let target = 0;
      do target = L === 4 ? int(r, 3, 97) * 10 : int(r, 1, spec.max - 1); while (spec.labels.includes(target));
      return { game, level: L, min: 0, ...spec, target };
    }
    case 'maketen': {
      if (L === 1) { const a = int(r, 1, 9); return { game, level: L, kind: 'fill', a, b: 0, total: 10, answer: 10 - a }; }
      if (L === 2) { const a = int(r, 1, 9); return { game, level: L, kind: 'missing', a, b: 0, total: 10, answer: 10 - a }; }
      if (L === 3) { const a = int(r, 11, 19); return { game, level: L, kind: 'fill', a, b: 0, total: 20, answer: 20 - a }; }
      const a = int(r, 6, 9), b = int(r, 11 - a, 9);
      return { game, level: L, kind: 'bridge', a, b, total: a + b, answer: a + b };
    }
    case 'place': {
      if (L === 1) return { game, level: L, kind: 'build', target: int(r, 11, 19), places: 2 };
      if (L === 2) { let t = 0; do t = int(r, 21, 99); while (t % 10 === 0 || Math.floor(t / 10) === t % 10); return { game, level: L, kind: 'build', target: t, places: 2 }; }
      if (L === 3) { let t = 0; do t = int(r, 101, 999); while (t % 10 === 0); return { game, level: L, kind: 'build', target: t, places: 3 }; }
      const tens = int(r, 1, 7), ones = int(r, 11, 18), target = tens * 10 + ones;
      // the tempting wrong answers: writing the two counts side by side, or dropping the extra ten
      return { game, level: L, kind: 'read', tens, ones, target, options: options(r, target, [Number(`${tens}${ones}`), tens * 10 + (ones - 10), target + 10]) };
    }
    case 'arrays': {
      if (L === 1) { const rows = int(r, 2, 5), cols = int(r, 2, 5), answer = rows * cols; return { game, level: L, kind: 'count', rows, cols, answer, options: options(r, answer, [rows + cols, answer + cols, answer - rows]) }; }
      if (L === 2) { const rows = int(r, 2, 6); let cols = 0; do cols = int(r, 2, 7); while (cols === rows); return { game, level: L, kind: 'build', rows, cols, answer: rows * cols }; }
      const rows = int(r, 3, 9), cols = int(r, 3, 9), answer = rows * cols;
      if (L === 3) return { game, level: L, kind: 'fact', rows, cols, answer, options: options(r, answer, [rows + cols, answer + cols, answer - rows, (rows - 1) * cols]) };
      return { game, level: L, kind: 'missing', rows, cols, answer: rows, options: options(r, rows, [rows + 1, rows - 1, cols === rows ? rows + 2 : cols]) };
    }
    case 'fractions': {
      const side = (a: Frac, b: Frac): 'a' | 'b' | 'eq' => { const d = a[0] * b[1] - b[0] * a[1]; return d === 0 ? 'eq' : d > 0 ? 'a' : 'b'; };
      const mk = (a: Frac, b: Frac, showBars: boolean, withEqual = false) => ({ game, level: L, a, b, answer: side(a, b), showBars, withEqual } as const);
      if (L === 1) { const d = pick(r, [4, 5, 6, 8, 10]); const x = int(r, 1, d - 1); let y = 0; do y = int(r, 1, d - 1); while (y === x); return mk([x, d], [y, d], true); }
      if (L === 2) { const n = pick(r, [1, 1, 2, 3]); const d1 = int(r, n + 1, 9); let d2 = 0; do d2 = int(r, n + 1, 10); while (d2 === d1); return mk([n, d1], [n, d2], false); }
      if (L === 3) {
        const k = pick(r, [1, 2, 3, 4]); const half: Frac = [k, 2 * k];
        let other: Frac = [1, 3];
        do { const d = pick(r, [3, 5, 6, 8, 10]); other = [int(r, 1, d - 1), d]; } while (other[0] * 2 === other[1]);
        return r() < 0.5 ? mk(half, other, false) : mk(other, half, false);
      }
      if (r() < 0.3) { const d = pick(r, [2, 3, 4, 5]); const n = int(r, 1, d - 1), k = pick(r, [2, 3]); const a: Frac = [n, d], b: Frac = [n * k, d * k]; return r() < 0.5 ? mk(a, b, false, true) : mk(b, a, false, true); }
      let a: Frac = [1, 2], b: Frac = [1, 3];
      do { const d1 = int(r, 3, 9), d2 = int(r, 3, 9); a = [int(r, 1, d1 - 1), d1]; b = [int(r, 1, d2 - 1), d2]; } while (a[1] === b[1] || a[0] === b[0] || a[0] * b[1] === b[0] * a[1] || gcd(a[0], a[1]) !== 1 || gcd(b[0], b[1]) !== 1);
      return mk(a, b, false, true);
    }
    case 'stories': {
      const kinds: StoryKind[][] = [['join', 'separate'], ['missing', 'compare'], ['join', 'separate', 'missing', 'compare'], ['groups', 'share']];
      const kind = pick(r, kinds[L - 1]!);
      const who = int(r, 0, 3), thing = int(r, 0, 3);
      const big = L === 3;
      let a = 0, b = 0, answer = 0;
      if (kind === 'join') { a = big ? int(r, 21, 58) : int(r, 4, 11); b = big ? int(r, 12, 39) : int(r, 3, 8); answer = a + b; }
      else if (kind === 'separate') { a = big ? int(r, 45, 96) : int(r, 9, 19); b = big ? int(r, 12, a - 11) : int(r, 3, a - 3); answer = a - b; }
      else if (kind === 'missing') { a = big ? int(r, 14, 48) : int(r, 4, 11); answer = big ? int(r, 12, 45) : int(r, 3, 8); b = a + answer; }           // had a, now b: how many came?
      else if (kind === 'compare') { b = big ? int(r, 14, 48) : int(r, 4, 11); answer = big ? int(r, 11, 38) : int(r, 2, 7); a = b + answer; }           // a against b: how many more?
      else if (kind === 'groups') { a = int(r, 2, 6); b = int(r, 2, 9); answer = a * b; }                                                               // a bags of b
      else { b = int(r, 2, 6); answer = int(r, 2, 9); a = b * answer; }                                                                                  // a shared between b
      const model = MODEL_OF[kind];
      // the two wrong pictures must be really wrong: "take away" and "compare" are both a subtraction, so they are never offered together
      const others: ModelId[] = L === 4 ? (model === 'groups' ? ['share', 'sum'] : ['groups', 'sum']) : model === 'sum' ? ['part', 'groups'] : ['sum', 'groups'];
      const models = shuffle(r, [model, ...others]);
      const wrongOp = kind === 'join' ? Math.abs(a - b) : kind === 'separate' || kind === 'missing' || kind === 'compare' ? a + b : kind === 'groups' ? a + b : a - b;
      return { game, level: L, kind, a, b, answer, who, thing, model, models, options: options(r, answer, [wrongOp, answer + (big ? 10 : 1), answer - (big ? 10 : 1)]) };
    }
  }
}

/** The right number for a question that has one (used for the reveal and by the tests). */
export function solution(q: Question): number | 'a' | 'b' | 'eq' {
  switch (q.game) {
    case 'numline': return q.target;
    case 'maketen': return q.answer;
    case 'place': return q.target;
    case 'arrays': return q.answer;
    case 'fractions': return q.answer;
    case 'stories': return q.answer;
  }
}

/** Was the answer right, and if not, which mistake does it look like? */
export function check(q: Question, ans: Answer): Verdict {
  switch (q.game) {
    case 'numline': {
      const g = Number(ans);
      if (Math.abs(g - q.target) <= q.tol) return { ok: true };
      const mid = (q.min + q.max) / 2;
      return { ok: false, miss: (g - mid) * (q.target - mid) < 0 ? 'nl_half' : 'nl_near' };
    }
    case 'maketen':
      return Number(ans) === q.answer ? { ok: true } : { ok: false, miss: q.kind === 'bridge' ? 'ten_bridge' : 'ten_off' };
    case 'place': {
      if (q.kind === 'read') return Number(ans) === q.target ? { ok: true } : { ok: false, miss: 'pv_regroup' };
      const v = ans as { h: number; t: number; o: number };
      const value = v.h * 100 + v.t * 10 + v.o;
      if (value === q.target) return { ok: true };
      const T = Math.floor((q.target % 100) / 10), O = q.target % 10;
      return { ok: false, miss: v.t === O && v.o === T && v.h === Math.floor(q.target / 100) ? 'pv_swap' : 'pv_build' };
    }
    case 'arrays': {
      if (q.kind === 'build') {
        const v = ans as { rows: number; cols: number };
        const same = (v.rows === q.rows && v.cols === q.cols) || (v.rows === q.cols && v.cols === q.rows);
        return same ? { ok: true } : { ok: false, miss: 'arr_rows' };
      }
      const n = Number(ans);
      if (n === q.answer) return { ok: true };
      return { ok: false, miss: q.kind !== 'missing' && n === q.rows + q.cols ? 'arr_add' : 'arr_rows' };
    }
    case 'fractions': {
      if (ans === q.answer) return { ok: true };
      const [an, ad] = q.a, [bn, bd] = q.b;
      if (q.answer === 'eq') return { ok: false, miss: 'fr_equal' };
      const chosen = ans === 'a' ? q.a : ans === 'b' ? q.b : null, other = ans === 'a' ? q.b : q.a;
      if (chosen && an === bn && chosen[1] > other[1]) return { ok: false, miss: 'fr_bigden' };
      if (chosen && ad !== bd && chosen[0] > other[0] && chosen[1] > other[1]) return { ok: false, miss: 'fr_top' };
      return { ok: false, miss: 'fr_other' };
    }
    case 'stories': {
      if (typeof ans === 'object' && 'model' in ans) return ans.model === q.model ? { ok: true, partial: true } : { ok: false, partial: true, miss: 'st_model' };
      const n = Number(ans);
      if (n === q.answer) return { ok: true };
      const wrongOp = q.kind === 'join' ? Math.abs(q.a - q.b) : q.kind === 'groups' ? q.a + q.b : q.kind === 'share' ? q.a - q.b : q.a + q.b;
      return { ok: false, miss: n === wrongOp ? 'st_op' : 'st_calc' };
    }
  }
}

/* ---------- the level follows the child ---------- */

export interface Pace { level: number; up: number; down: number }
/** Three right in a row (first try) moves up a level; two wrong in a row moves down. Anything else stays. */
export function step(p: Pace, firstTry: boolean): Pace & { moved: -1 | 0 | 1 } {
  if (firstTry) {
    const up = p.up + 1;
    if (up >= 3 && p.level < MAX_LEVEL) return { level: p.level + 1, up: 0, down: 0, moved: 1 };
    return { level: p.level, up, down: 0, moved: 0 };
  }
  const down = p.down + 1;
  if (down >= 2 && p.level > 1) return { level: p.level - 1, up: 0, down: 0, moved: -1 };
  return { level: p.level, up: 0, down, moved: 0 };
}

/* ---------- what has been learned: one record per game and level ---------- */

export interface SkillStat { seen: number; right: number }
export interface ArcadeState {
  v: 1;
  /** The level each game starts from next time. */
  level: Partial<Record<GameId, number>>;
  /** Answers by skill, keyed "game:level". Only the first try of each question counts. */
  skills: Record<string, SkillStat>;
  /** Mistakes seen, by kind, so the map can say what the trouble is. */
  misses: Partial<Record<Miss, number>>;
  rounds: number;
  stars: Partial<Record<GameId, number>>;
}
export const emptyArcade = (): ArcadeState => ({ v: 1, level: {}, skills: {}, misses: {}, rounds: 0, stars: {} });
export const skillKey = (game: GameId, level: number) => `${game}:${level}`;

export function record(s: ArcadeState, game: GameId, level: number, firstTry: boolean, miss?: Miss): ArcadeState {
  const k = skillKey(game, level), cur = s.skills[k] ?? { seen: 0, right: 0 };
  const misses = { ...s.misses };
  if (miss) misses[miss] = (misses[miss] ?? 0) + 1;
  return { ...s, skills: { ...s.skills, [k]: { seen: cur.seen + 1, right: cur.right + (firstTry ? 1 : 0) } }, misses };
}

export type Mastery = 'new' | 'practising' | 'strong' | 'help';
/** Strong: at least 4 tries and 80% right. Needs help: at least 3 tries and under 60%. Otherwise still practising. */
export function mastery(st: SkillStat | undefined): Mastery {
  if (!st || st.seen === 0) return 'new';
  const acc = st.right / st.seen;
  if (st.seen >= 4 && acc >= 0.8) return 'strong';
  if (st.seen >= 3 && acc < 0.6) return 'help';
  return 'practising';
}
export const starsFor = (firstTryRight: number, total: number): 1 | 2 | 3 => (firstTryRight >= Math.ceil(total * 0.85) ? 3 : firstTryRight >= Math.ceil(total * 0.6) ? 2 : 1);

/** The skills that need a look, worst first: what a parent or teacher should hear about. */
export function gaps(s: ArcadeState): { game: GameId; level: number; stat: SkillStat }[] {
  const out: { game: GameId; level: number; stat: SkillStat }[] = [];
  for (const [k, stat] of Object.entries(s.skills)) {
    if (mastery(stat) !== 'help') continue;
    const [game, level] = k.split(':') as [GameId, string];
    out.push({ game, level: Number(level), stat });
  }
  return out.sort((x, y) => x.stat.right / x.stat.seen - y.stat.right / y.stat.seen);
}
