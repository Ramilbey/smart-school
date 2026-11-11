/**
 * The "board script": what the AI (or a prepared lesson) hands to the whiteboard.
 *
 * A lesson is a list of beats. A beat is one sentence or two to say out loud, plus the things to draw while saying it.
 * Nothing here is a picture or a video: every shape is a small instruction that the browser draws, so a lesson is a few
 * kilobytes, can stream beat by beat, and can be checked before anything is drawn (normalizeBeat).
 *
 * The board is 1000 wide and 620 high, with (0, 0) at the top left.
 */
import { compileExpr } from './expr.ts';

export const BOARD_W = 1000;
export const BOARD_H = 620;

export const INKS = ['ink', 'teal', 'blue', 'amber', 'coral', 'lilac', 'mute'] as const;
export type Ink = (typeof INKS)[number];
export const SIZES = ['xl', 'l', 'm', 's'] as const;
export type Size = (typeof SIZES)[number];

export interface Term {
  en: string;
  ru?: string;
  uz?: string;
}

export type Op =
  | { op: 'text'; id?: string; x: number; y: number; text: string; size?: Size; ink?: Ink; hand?: boolean; rotate?: number }
  | { op: 'math'; id?: string; x: number; y: number; tex: string; size?: Size; ink?: Ink }
  | { op: 'line'; id?: string; x1: number; y1: number; x2: number; y2: number; ink?: Ink; arrow?: boolean; dash?: boolean }
  | { op: 'poly'; id?: string; points: [number, number][]; ink?: Ink; fill?: boolean; close?: boolean; dash?: boolean; arrow?: boolean }
  | { op: 'circle'; id?: string; x: number; y: number; r: number; ink?: Ink; fill?: boolean }
  | { op: 'grid'; id?: string; x: number; y: number; cols: number; rows: number; cell: number; ink?: Ink }
  | { op: 'box'; id?: string; x: number; y: number; w: number; h: number; ink?: Ink }
  | { op: 'graph'; id?: string; x: number; y: number; w: number; h: number; fn: string; xmin: number; xmax: number; ymin: number; ymax: number; ink?: Ink; marks?: number[]; label?: string }
  | { op: 'highlight'; target: string; ink?: Ink }
  | { op: 'erase'; target: string }
  | { op: 'clear' }
  | { op: 'terms'; id?: string; items: Term[]; x?: number; y?: number };

export interface Beat {
  /** What is said aloud, and shown as the caption. Plain words: no markdown, and maths spelled out ("x squared minus five x"). */
  say: string;
  ops: Op[];
  /** Which chapter of the lesson this beat belongs to (index into LessonMeta.chapters). */
  chapter?: number;
  /** Extra quiet time after the beat, in milliseconds. */
  pause?: number;
}

export interface LessonMeta {
  title: string;
  chapters: string[];
  /** A question for the student at the end: checked in the browser, so the answer is a number or a short word. */
  try?: { question: string; answer: string; hint?: string };
}

/** What the server streams back, one JSON object per line. */
export type BoardEvent =
  | { type: 'meta'; meta: LessonMeta }
  | { type: 'beat'; beat: Beat }
  | { type: 'done'; beats: number }
  | { type: 'error'; message: string };

export const LIMITS = { say: 280, text: 90, tex: 140, ops: 16, points: 40, terms: 6, term: 40, chapters: 6, chapter: 28, title: 80, fn: 80, grid: 12, marks: 6 };

const num = (v: unknown, lo: number, hi: number, fallback?: number): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback ?? null;
  return Math.min(hi, Math.max(lo, n));
};
const str = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim();
  return s ? s.slice(0, max) : null;
};
const ink = (v: unknown): Ink | undefined => ((INKS as readonly string[]).includes(v as string) ? (v as Ink) : undefined);
const size = (v: unknown): Size | undefined => ((SIZES as readonly string[]).includes(v as string) ? (v as Size) : undefined);
const id = (v: unknown): string | undefined => (typeof v === 'string' && /^[a-zA-Z0-9_-]{1,24}$/.test(v) ? v : undefined);
const x = (v: unknown) => num(v, 0, BOARD_W);
const y = (v: unknown) => num(v, 0, BOARD_H);

/**
 * A model often writes LaTeX with ONE backslash inside a JSON string: "\\times" arrives as a TAB and "imes", "\\frac" as a form feed
 * and "rac", "\\beta" as a backspace and "eta". No formula contains those control characters, so put the backslash and the letter back.
 */
export function fixTex(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  return raw.replace(/\t/g, '\\t').replace(/\f/g, '\\f').replace(/\x08/g, '\\b').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\x07/g, '\\a').replace(/\x0b/g, '\\v');
}

/** One op, checked and trimmed. Returns null when it cannot be drawn (the beat keeps its other ops). */
export function normalizeOp(raw: unknown): Op | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const base = { id: id(o.id) };
  switch (o.op) {
    case 'text': {
      const text = str(o.text, LIMITS.text), px = x(o.x), py = y(o.y);
      if (!text || px === null || py === null) return null;
      return { op: 'text', ...base, x: px, y: py, text, size: size(o.size), ink: ink(o.ink), hand: o.hand === true, rotate: num(o.rotate, -90, 90) ?? undefined };
    }
    case 'math': {
      const tex = str(fixTex(o.tex), LIMITS.tex), px = x(o.x), py = y(o.y);
      if (!tex || px === null || py === null) return null;
      return { op: 'math', ...base, x: px, y: py, tex, size: size(o.size), ink: ink(o.ink) };
    }
    case 'line': {
      const x1 = x(o.x1), y1 = y(o.y1), x2 = x(o.x2), y2 = y(o.y2);
      if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
      return { op: 'line', ...base, x1, y1, x2, y2, ink: ink(o.ink), arrow: o.arrow === true, dash: o.dash === true };
    }
    case 'poly': {
      if (!Array.isArray(o.points)) return null;
      const points: [number, number][] = [];
      for (const p of o.points.slice(0, LIMITS.points)) {
        if (!Array.isArray(p)) continue;
        const px = x(p[0]), py = y(p[1]);
        if (px !== null && py !== null) points.push([px, py]);
      }
      if (points.length < 2) return null;
      return { op: 'poly', ...base, points, ink: ink(o.ink), fill: o.fill === true, close: o.close !== false && points.length > 2, dash: o.dash === true, arrow: o.arrow === true };
    }
    case 'circle': {
      const px = x(o.x), py = y(o.y), r = num(o.r, 2, 400);
      if (px === null || py === null || r === null) return null;
      return { op: 'circle', ...base, x: px, y: py, r, ink: ink(o.ink), fill: o.fill === true };
    }
    case 'grid': {
      const px = x(o.x), py = y(o.y), cols = num(o.cols, 1, LIMITS.grid), rows = num(o.rows, 1, LIMITS.grid), cell = num(o.cell, 8, 200);
      if (px === null || py === null || cols === null || rows === null || cell === null) return null;
      return { op: 'grid', ...base, x: px, y: py, cols: Math.round(cols), rows: Math.round(rows), cell, ink: ink(o.ink) };
    }
    case 'box': {
      const px = x(o.x), py = y(o.y), w = num(o.w, 8, BOARD_W), h = num(o.h, 8, BOARD_H);
      if (px === null || py === null || w === null || h === null) return null;
      return { op: 'box', ...base, x: px, y: py, w, h, ink: ink(o.ink) };
    }
    case 'graph': {
      const fn = str(o.fn, LIMITS.fn), px = x(o.x), py = y(o.y), w = num(o.w, 60, BOARD_W), h = num(o.h, 60, BOARD_H);
      const xmin = num(o.xmin, -1e4, 1e4), xmax = num(o.xmax, -1e4, 1e4), ymin = num(o.ymin, -1e4, 1e4), ymax = num(o.ymax, -1e4, 1e4);
      if (!fn || px === null || py === null || w === null || h === null || xmin === null || xmax === null || ymin === null || ymax === null) return null;
      if (xmax <= xmin || ymax <= ymin) return null;
      try {
        const f = compileExpr(fn);
        if (!Number.isFinite(f((xmin + xmax) / 2)) && !Number.isFinite(f(xmin + (xmax - xmin) * 0.31))) return null;
      } catch {
        return null; // not a formula we can draw: drop the graph, keep the rest of the beat
      }
      const marks = Array.isArray(o.marks) ? o.marks.map((m) => num(m, xmin, xmax)).filter((m): m is number => m !== null).slice(0, LIMITS.marks) : undefined;
      return { op: 'graph', ...base, x: px, y: py, w, h, fn, xmin, xmax, ymin, ymax, ink: ink(o.ink), marks, label: str(o.label, 40) ?? undefined };
    }
    case 'highlight': {
      const target = id(o.target);
      return target ? { op: 'highlight', target, ink: ink(o.ink) } : null;
    }
    case 'erase': {
      const target = id(o.target);
      return target ? { op: 'erase', target } : null;
    }
    case 'clear':
      return { op: 'clear' };
    case 'terms': {
      if (!Array.isArray(o.items)) return null;
      const items: Term[] = [];
      for (const it of o.items.slice(0, LIMITS.terms)) {
        if (!it || typeof it !== 'object') continue;
        const t = it as Record<string, unknown>;
        const en = str(t.en, LIMITS.term);
        if (!en) continue;
        items.push({ en, ru: str(t.ru, LIMITS.term) ?? undefined, uz: str(t.uz, LIMITS.term) ?? undefined });
      }
      return items.length ? { op: 'terms', ...base, items, x: x(o.x) ?? undefined, y: y(o.y) ?? undefined } : null;
    }
    default:
      return null;
  }
}

/** One beat from the AI or a file: unknown or broken ops are dropped, everything is clamped. Null when there is nothing to say. */
export function normalizeBeat(raw: unknown): Beat | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const say = str(b.say, LIMITS.say);
  if (!say) return null;
  const ops: Op[] = [];
  if (Array.isArray(b.ops)) for (const r of b.ops.slice(0, LIMITS.ops)) { const op = normalizeOp(r); if (op) ops.push(op); }
  const chapter = num(b.chapter, 0, LIMITS.chapters - 1);
  const pause = num(b.pause, 0, 3000);
  return { say, ops, chapter: chapter === null ? undefined : Math.round(chapter), pause: pause ?? undefined };
}

/** The first line of a lesson: its title, the chapters, and an optional question to try. */
export function normalizeMeta(raw: unknown): LessonMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const title = str(m.title, LIMITS.title);
  if (!title) return null;
  const chapters = (Array.isArray(m.chapters) ? m.chapters : []).map((c) => str(c, LIMITS.chapter)).filter((c): c is string => !!c).slice(0, LIMITS.chapters);
  const t = m.try && typeof m.try === 'object' ? (m.try as Record<string, unknown>) : null;
  const q = t ? str(t.question, 200) : null;
  const a = t ? str(t.answer, 30) : null;
  return { title, chapters: chapters.length ? chapters : ['The lesson'], try: q && a ? { question: q, answer: a, hint: str(t?.hint, 160) ?? undefined } : undefined };
}

/** Does a typed answer match the expected one? Numbers by value (so "10.0", "10" and "ten" style digits agree), words ignoring case and spaces. */
export function answerMatches(typed: string, expected: string): boolean {
  const clean = (s: string) => s.trim().toLowerCase().replace(/[\s.,;!]+$/g, '').replace(',', '.');
  const a = clean(typed), b = clean(expected);
  if (!a) return false;
  const na = Number(a), nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && a !== '' && b !== '') return Math.abs(na - nb) < 1e-9;
  return a.replace(/\s+/g, '') === b.replace(/\s+/g, '');
}

/** A short plain description of what is on the board, for the AI to refer back to ("the equation in eq1"). */
export function describeOp(op: Op): string {
  switch (op.op) {
    case 'text': return `text "${op.text}"`;
    case 'math': return `formula ${op.tex}`;
    case 'graph': return `graph of ${op.fn}`;
    case 'terms': return `vocabulary: ${op.items.map((t) => t.en).join(', ')}`;
    default: return op.op;
  }
}
