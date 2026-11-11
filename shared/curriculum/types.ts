// Grade 6–7 course content: short picture lessons and generated practice, aligned with Uzbekistan's school textbooks.
// Used by the Telegram bot and the Mini App. Every answer is computed by code, never typed by hand, so it cannot drift.
// The lessons are written in our own words, following each book's topics and vocabulary. Draft: awaiting teacher review.

import { num } from '../format.ts';
import type { Lang, Text } from '../types.ts';
import type { Visual } from './visuals.ts';

export type { Visual };

export type SubjectId = 'math6' | 'algebra7' | 'geometry7' | 'physics7';

export interface Card {
  text: Text;
  visual?: Visual;
}

export interface Question {
  prompt: Text;
  visual?: Visual;
  choices: Text[];
  correct: number;
  /** Two rungs: the idea, then the next step. The answer itself only comes after real attempts. */
  hints: [Text, Text];
  explain: Text;
  /** For equation questions: lets the tests re-solve the question with the independent solver. */
  check?: { expression: string; root: number };
}

export type Gen = (r: Rng) => Question;

export interface Topic {
  id: string;
  grade: 6 | 7;
  subject: SubjectId;
  emoji: string;
  title: Text;
  /** Where this sits in the school textbook. */
  book: Text;
  /** Words a student might type to find this topic, lower case, in all three languages. */
  keywords: string[];
  cards: Card[];
  gens: Gen[];
  /** Deep link to an interactive Mini App lesson on the same idea. */
  appLink?: 'g7';
}

export interface Subject {
  id: SubjectId;
  grade: 6 | 7;
  emoji: string;
  title: Text;
  /** The textbook this subject follows, as printed on its cover. */
  book: string;
}

/* ---------- small helpers for writing content ---------- */

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

export const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export const pick = <X,>(r: Rng, xs: readonly X[]): X => xs[Math.floor(r() * xs.length)];

export const T = (uz: string, ru: string, en: string): Text => ({ uz, ru, en });

/** Same text in every language (numbers, formulas). */
export const S = (s: string): Text => ({ uz: s, ru: s, en: s });

/** A text whose numbers follow each language's decimal mark: TN((n) => T(`${n(3.14)} m`, ...)). */
export const TN = (f: (n: (v: number) => string) => Text): Text => {
  const one = (l: Lang) => f((v) => num(v, l))[l];
  return { uz: one('uz'), ru: one('ru'), en: one('en') };
};

/** Integer, with a proper minus sign. */
export const s = (v: number) => num(v, 'ru');

/** Number in brackets when negative: "(−2)", "3". */
export const par = (v: number) => (v < 0 ? `(${s(v)})` : s(v));

/** "3x", "x", "−x", "" when k is 0. */
export const kx = (k: number, x = 'x') => (k === 0 ? '' : k === 1 ? x : k === -1 ? `−${x}` : `${s(k)}${x}`);

/** "3x − 4", "x + 2", "−x", "5". */
export const lin = (k: number, b: number, x = 'x') => {
  if (k === 0) return s(b);
  if (b === 0) return kx(k, x);
  return `${kx(k, x)} ${b < 0 ? '−' : '+'} ${s(Math.abs(b))}`;
};

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (v: number) => String(v).split('').map((c) => SUP[Number(c)]).join('');

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** A reduced fraction as text: "3/4", or "2" when it is whole. */
export const fr = (p: number, q: number) => {
  const g = gcd(p, q) || 1;
  const [a, b] = [p / g, q / g];
  return b === 1 ? s(a) : `${s(a)}/${s(b)}`;
};
export { gcd };

const toText = (v: Text | string | number): Text =>
  typeof v === 'number' ? TN((n) => S(n(v))) : typeof v === 'string' ? S(v) : v;

/** Builds a question: mixes the right answer among three distinct wrong ones. */
export function Q(
  r: Rng,
  q: {
    prompt: Text;
    visual?: Visual;
    answer: Text | string | number;
    wrong: (Text | string | number)[];
    hints: [Text, Text];
    explain: Text;
    check?: Question['check'];
  },
): Question {
  const answer = toText(q.answer);
  const seen = new Set([answer.en]);
  const wrong: Text[] = [];
  // Whole-number answers get whole-number distractors: "1.667" would give the right answer away.
  const usable = q.wrong.filter((w) => typeof w !== 'number' || (Number.isFinite(w) && (!Number.isInteger(q.answer) || Number.isInteger(w))));
  for (const w of usable.map(toText)) {
    if (!seen.has(w.en) && wrong.length < 3) {
      seen.add(w.en);
      wrong.push(w);
    }
  }
  // Numeric answers can always be topped up with near misses.
  if (typeof q.answer === 'number') {
    for (let d = 1; wrong.length < 3 && d < 40; d++) {
      for (const v of [q.answer + d, q.answer - d]) {
        const t = toText(v);
        if (!seen.has(t.en) && wrong.length < 3) {
          seen.add(t.en);
          wrong.push(t);
        }
      }
    }
  }
  // Answers with a unit ("50°", "120 km") are topped up the same way, keeping the unit in each language.
  const unit = /^(\d+)(.*)$/;
  for (let d = 10; wrong.length < 3 && unit.test(answer.en) && d < 200; d += 10) {
    const shift = (t: string) => t.replace(unit, (_, v: string, rest: string) => `${Number(v) + d}${rest}`);
    const t: Text = { uz: shift(answer.uz), ru: shift(answer.ru), en: shift(answer.en) };
    if (!seen.has(t.en)) {
      seen.add(t.en);
      wrong.push(t);
    }
  }
  const choices = [answer, ...wrong];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { prompt: q.prompt, visual: q.visual, choices, correct: choices.indexOf(answer), hints: q.hints, explain: q.explain, check: q.check };
}

/**
 * What a student reads after answering: the idea first (the first hint, which says why), then the working.
 * Physics questions already lay out Given / Formula / Working, so they are shown as they are.
 */
export function explainWhy(q: Question, lang: Lang): string {
  const working = q.explain[lang];
  if (/^<b>[^<]+<\/b>/.test(working) && /<b>[^<]+:<\/b>/.test(working)) return working;
  const idea = q.hints[0][lang];
  return idea && !working.includes(idea) ? `${idea}\n${working}` : working;
}
