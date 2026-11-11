import type { Lang } from './types.ts';

const MINUS = '−';

/** Formats a number the way it is written in school: "−2", "0,5" (uz/ru) or "0.5" (en). */
export function num(value: number, lang: Lang): string {
  const rounded = Math.round(value * 1000) / 1000;
  const abs = Math.abs(rounded);
  let s = String(abs);
  if (lang !== 'en') s = s.replace('.', ',');
  return (rounded < 0 ? MINUS : '') + s;
}

/** Coordinates: "(2; 5)" in Uzbek and Russian schools, "(2, 5)" in English. A no-break space keeps the pair together. */
export function pt(x: number, y: number, lang: Lang): string {
  return lang === 'en' ? `(${num(x, lang)},\u00A0${num(y, lang)})` : `(${num(x, lang)};\u00A0${num(y, lang)})`;
}

/** "y = 2x − 1", "y = −x", "y = 3", "y = 0,5x + 2". */
export function lineEq(k: number, b: number, lang: Lang): string {
  let kx = '';
  if (k !== 0) {
    if (k === 1) kx = 'x';
    else if (k === -1) kx = `${MINUS}x`;
    else kx = `${num(k, lang)}x`;
  }
  if (!kx) return `y = ${num(b, lang)}`;
  if (b === 0) return `y = ${kx}`;
  return `y = ${kx} ${b < 0 ? MINUS : '+'} ${num(Math.abs(b), lang)}`;
}

/**
 * Parses what a student types: "-2", "−2", "2,5", "2.5", "1/2", "−3/6", " 5 ".
 * Returns null for anything that is not a single number.
 */
export function parseNumber(raw: string): number | null {
  const s = raw
    .trim()
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, '')
    .replace(',', '.');
  if (!s) return null;
  const frac = /^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/.exec(s);
  if (frac) {
    const d = Number(frac[2]);
    if (d === 0) return null;
    return Number(frac[1]) / d;
  }
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export const approxEqual = (a: number, b: number) => Math.abs(a - b) < 1e-9;
