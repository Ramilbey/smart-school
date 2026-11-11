import { HttpError } from './http.ts';
import { normalizeQuestion, type QuizLang, type QuizQuestion } from './quizzes.ts';
import { questionFor, subjects, topicById, topics, visualSvg } from '../shared/curriculum/index.ts';
import { tx } from '../shared/types.ts';

/**
 * Where a teacher's quiz questions can come from besides typing them:
 *  1. the 23 textbook topics (Grades 6 and 7): questions made by code, so every answer is right by construction;
 *  2. AI: a draft that the teacher must read and approve. Only used when the server has an API key.
 */

export function topicList(lang: QuizLang) {
  return topics.map((t) => ({
    id: t.id,
    grade: t.grade,
    subject: t.subject,
    subjectTitle: tx(subjects.find((s) => s.id === t.subject)?.title ?? t.subject, lang),
    emoji: t.emoji,
    title: tx(t.title, lang),
    book: tx(t.book, lang),
  }));
}

const MAX_SVG = 60_000;

/** `count` different questions on one topic. The same seed gives the same questions. */
export function questionsFromTopic(topicId: unknown, countRaw: unknown, lang: QuizLang, seed = Math.floor(Math.random() * 1_000_000)) {
  const topic = typeof topicId === 'string' ? topicById(topicId) : undefined;
  if (!topic) throw new HttpError(404, 'unknown topic');
  const count = Math.min(20, Math.max(1, Math.floor(Number(countRaw)) || 5));
  const out: QuizQuestion[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < count && i < count * 8; i++) {
    const q = questionFor(topic, seed, i);
    const prompt = tx(q.prompt, lang);
    if (seen.has(prompt)) continue;
    try {
      const made = normalizeQuestion(
        { kind: 'choice', prompt, choices: q.choices.map((c) => tx(c, lang)), correct: q.correct, explain: tx(q.explain, lang) },
        out.length,
      );
      if (q.visual) {
        const svg = visualSvg(q.visual, lang);
        if (svg.length <= MAX_SVG) made.svg = svg;
      }
      seen.add(prompt);
      out.push(made);
    } catch {
      /* a question with two equal answers is skipped, the next one is tried */
    }
  }
  if (!out.length) throw new HttpError(500, 'could not make questions for this topic');
  return { title: tx(topic.title, lang), subject: tx(subjects.find((s) => s.id === topic.subject)?.title ?? topic.subject, lang), questions: out };
}

/* ---------- Math Sprint: sums made from the numbers the teacher chooses ---------- */

export const MATH_OPS = ['add', 'sub', 'mul', 'div', 'sq', 'missing'] as const;
export type MathOp = (typeof MATH_OPS)[number];

/**
 * Questions for the Math Sprint game. The teacher picks the kinds of sums, the smallest and largest number and how many.
 * Every answer is computed here, so it is right by construction. `pick` is injectable so tests can be exact.
 */
export function mathQuestions(raw: unknown, pick: (lo: number, hi: number) => number = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))) {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const ops = (Array.isArray(r.ops) ? r.ops : []).filter((o): o is MathOp => MATH_OPS.includes(o as MathOp));
  if (!ops.length) throw new HttpError(400, 'pick at least one kind of sum');
  const lo = Math.min(999, Math.max(0, Math.floor(Number(r.min)) || 0));
  const hi = Math.min(1000, Math.max(lo + 1, Math.floor(Number(r.max)) || 10));
  const count = Math.min(40, Math.max(3, Math.floor(Number(r.count)) || 10));
  const lo1 = Math.max(lo, 1); // dividing and multiplying by zero makes dull questions
  const out: QuizQuestion[] = [];
  const seen = new Set<string>();
  for (let tries = 0; out.length < count && tries < count * 30; tries++) {
    const op = ops[pick(0, ops.length - 1)];
    let prompt = '';
    let answer = 0;
    let explain = '';
    if (op === 'add') {
      const a = pick(lo, hi), b = pick(lo, hi);
      prompt = `${a} + ${b} = ?`; answer = a + b; explain = `${a} + ${b} = ${answer}`;
    } else if (op === 'sub') {
      let a = pick(lo, hi), b = pick(lo, hi);
      if (a < b) [a, b] = [b, a];
      prompt = `${a} − ${b} = ?`; answer = a - b; explain = `${a} − ${b} = ${answer}`;
    } else if (op === 'mul') {
      const a = pick(lo1, hi), b = pick(lo1, hi);
      prompt = `${a} × ${b} = ?`; answer = a * b; explain = `${a} × ${b} = ${answer}`;
    } else if (op === 'div') {
      const d = pick(lo1, hi), q = pick(lo1, hi);
      prompt = `${d * q} ÷ ${d} = ?`; answer = q; explain = `${d * q} ÷ ${d} = ${q}`;
    } else if (op === 'sq') {
      const a = pick(lo1, Math.min(hi, 100));
      prompt = `${a}² = ?`; answer = a * a; explain = `${a}² = ${a} × ${a} = ${answer}`;
    } else {
      const a = pick(lo, hi), x = pick(lo, hi);
      const kind = pick(0, 2);
      if (kind === 0) { prompt = `? + ${a} = ${x + a}`; explain = `${x + a} − ${a} = ${x}`; }
      else if (kind === 1) { prompt = `? − ${a} = ${x}`; explain = `${x} + ${a} = ${x + a}`; }
      else { const f = Math.max(a, 1); prompt = `? × ${f} = ${x * f}`; explain = `${x * f} ÷ ${f} = ${x}`; }
      answer = kind === 1 ? x + a : x;
    }
    if (seen.has(prompt)) continue;
    seen.add(prompt);
    out.push(normalizeQuestion({ kind: 'number', prompt, answer, explain }, out.length));
  }
  if (!out.length) throw new HttpError(400, 'these numbers make no questions');
  const title = 'Math Sprint';
  const subject = 'Mathematics';
  return { title, subject, questions: out };
}

/* ---------- AI drafts: written by teacherAi.ts; this reads a plain multiple-choice draft ---------- */

/** Reads the model's JSON, keeps the questions that pass the same checks as hand-written ones. */
export function parseAiQuestions(text: string, count: number): QuizQuestion[] {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  let list: unknown[] = [];
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { questions?: unknown };
    if (Array.isArray(parsed.questions)) list = parsed.questions;
  } catch {
    /* handled below */
  }
  const out: QuizQuestion[] = [];
  for (const raw of list) {
    if (out.length >= count) break;
    try {
      const r = (raw ?? {}) as Record<string, unknown>;
      out.push(normalizeQuestion({ kind: 'choice', prompt: r.prompt, choices: r.choices, correct: r.correct, explain: r.explain }, out.length));
    } catch {
      /* a broken question is dropped */
    }
  }
  if (!out.length) throw new HttpError(502, 'the AI answer could not be read, try again');
  return out;
}
