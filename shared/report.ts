// Teacher homework report: its shape and the pure aggregation that builds it.
// The server builds the real report from saved progress; the Mini App runs the same code on fictional sample data.
// Every quiz mark is re-checked here against the answer keys in shared/lessons; a client's own score is never trusted.
// Textbook practice is saved only as totals per topic, so it cannot be re-checked question by question: impossible values are cleaned up instead.

import { topics as courseTopics } from './curriculum/index.ts';
import { g4Homework, g4Quiz } from './lessons/g4Fractions.ts';
import { g7Problem, g7Quiz } from './lessons/g7Linear.ts';
import type { QuizQuestion } from './types.ts';

export type ReportLessonId = 'g7-linear' | 'g4-fractions';

export interface ReportProblem {
  id: string;
  /** False when the student has not opened this problem yet. */
  started: boolean;
  solved: boolean;
  wrong: number;
  hints: number;
}

export interface ReportStudent {
  /** Opaque row key, stable within one report. Never the Telegram id. */
  key: string;
  /** Short display name from the student's validated Telegram first name; null if never saved. */
  name: string | null;
  /** True for the teacher's own row (a teacher who also took the check). */
  self: boolean;
  /** Choice id per quiz question, in quiz order; null if unanswered. */
  answers: (string | null)[];
  /** Re-checked on the server against the answer key: true right, false wrong, null unanswered. */
  marks: (boolean | null)[];
  /** Right answers in the last attempt; null if the student has not taken the check. */
  score: number | null;
  attempts: number;
  problems: ReportProblem[];
  updatedAt: number;
}

export interface LessonReport {
  lessonId: ReportLessonId;
  grade: number;
  /** Quiz question ids, in order. */
  questions: string[];
  students: ReportStudent[];
  /** Per question: how many students answered it wrong / answered it at all. */
  wrongCount: number[];
  answeredCount: number[];
  /** Index of the question most students got wrong; null when nobody got anything wrong. */
  mostMissed: number | null;
  /** Mean score of the students who took the check; null if nobody did. */
  averageScore: number | null;
}

/** One student's Grade 6–7 textbook practice (in the chat or the Mini App). */
export interface PracticeStudent {
  /** Opaque row key, stable within one report. Never the Telegram id. */
  key: string;
  name: string | null;
  self: boolean;
  /** Topics with at least one answered question. */
  topics: number;
  answered: number;
  /** Answered right on the first try. */
  right: number;
  /** Percent right on the first try, rounded. */
  percent: number;
  /** The topic with the lowest first-try percent; null when nothing was missed. */
  weakest: { topicId: string; percent: number } | null;
  updatedAt: number;
}

export interface PracticeTopic {
  topicId: string;
  /** How many students answered at least one question in this topic. */
  students: number;
  answered: number;
  /** Mean of each student's first-try percent, so one very busy student cannot outweigh the others. */
  averagePercent: number;
}

export interface PracticeReport {
  /** Only students who answered at least one question. */
  students: PracticeStudent[];
  /** Only topics somebody practised, weakest first. */
  topics: PracticeTopic[];
  /** Lowest average; null when nobody practised or nobody missed anything. */
  weakestTopicId: string | null;
  answered: number;
}

export interface TeacherReport {
  generatedAt: number;
  lessons: LessonReport[];
  practice: PracticeReport;
}

/**
 * The report for someone who is not on the teacher list (the report is open to every Telegram user, see TEACHER_OPEN):
 * the names of the other students are removed, so the page still works but one visitor never reads another's first name.
 * The viewer's own row keeps its name. Returns a copy.
 */
export function hideOtherNames(report: TeacherReport): TeacherReport {
  return {
    ...report,
    lessons: report.lessons.map((l) => ({ ...l, students: l.students.map((s) => (s.self ? s : { ...s, name: null })) })),
    practice: { ...report.practice, students: report.practice.students.map((s) => (s.self ? s : { ...s, name: null })) },
  };
}

/** One saved progress entry, as stored per Telegram user id. */
export interface StoredEntry {
  progress: unknown;
  updatedAt: number;
  name?: string;
}

/* ---------- display names ---------- */

const NAME_MAX = 24;

/** First name only, single-spaced, no control characters, at most 24 characters. Null if nothing is left. */
export function shortName(firstName: unknown): string | null {
  if (typeof firstName !== 'string') return null;
  const clean = firstName.replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  const chars = [...clean];
  return chars.length > NAME_MAX ? `${chars.slice(0, NAME_MAX - 1).join('').trimEnd()}…` : clean;
}

/* ---------- aggregation ---------- */

interface LessonSpec {
  lessonId: ReportLessonId;
  grade: number;
  quiz: QuizQuestion[];
  problemIds: string[];
  quizOf: (p: Record<string, unknown>) => unknown;
  problemOf: (p: Record<string, unknown>, id: string) => unknown;
}

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const count = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(Math.floor(v), max) : 0);

const LESSONS: LessonSpec[] = [
  {
    lessonId: 'g7-linear',
    grade: 7,
    quiz: g7Quiz,
    problemIds: [g7Problem.id],
    quizOf: (p) => obj(p.acad).quiz,
    problemOf: (p) => obj(p.acad).problem,
  },
  {
    lessonId: 'g4-fractions',
    grade: 4,
    quiz: g4Quiz,
    problemIds: g4Homework.map((h) => h.id),
    quizOf: (p) => obj(p.kids).quiz,
    problemOf: (p, id) => obj(obj(p.kids).homework)[id],
  },
];

function problemRecord(id: string, raw: unknown): ReportProblem {
  const r = obj(raw);
  const solved = r.solved === true;
  const wrong = count(r.wrong, 99);
  const hints = count(r.hints, 4);
  return { id, started: solved || wrong > 0 || hints > 0, solved, wrong, hints };
}

/** One student's row for one lesson, or null if they have not done any of it. */
function studentRow(spec: LessonSpec, progress: Record<string, unknown>): Omit<ReportStudent, 'key' | 'name' | 'self' | 'updatedAt'> | null {
  const quiz = obj(spec.quizOf(progress));
  const last = quiz.last && typeof quiz.last === 'object' && !Array.isArray(quiz.last) ? (quiz.last as Record<string, unknown>) : null;
  const answers = spec.quiz.map((q) => {
    const a = last?.[q.id];
    // Only choice ids that exist in the question count; anything else is treated as unanswered.
    return typeof a === 'string' && q.choices.some((c) => c.id === a) ? a : null;
  });
  const marks = spec.quiz.map((q, i) => (answers[i] === null ? null : answers[i] === q.correct));
  const tookCheck = answers.some((a) => a !== null);
  const problems = spec.problemIds.map((id) => problemRecord(id, spec.problemOf(progress, id)));
  if (!tookCheck && !problems.some((p) => p.started)) return null;
  return {
    answers,
    marks,
    score: tookCheck ? marks.filter((m) => m === true).length : null,
    attempts: Math.max(tookCheck ? 1 : 0, count(quiz.attempts, 999)),
    problems,
  };
}

const collator = new Intl.Collator('uz', { sensitivity: 'base' });

/** Named students alphabetically, then unnamed ones by most recent activity. */
const byName = (a: { name: string | null; updatedAt: number }, b: { name: string | null; updatedAt: number }) =>
  a.name && b.name ? collator.compare(a.name, b.name) : a.name ? -1 : b.name ? 1 : b.updatedAt - a.updatedAt;

function lessonReport(spec: LessonSpec, entries: [string, StoredEntry][], viewerId: number | null): LessonReport {
  const rows: Omit<ReportStudent, 'key'>[] = [];
  for (const [id, entry] of entries) {
    const row = studentRow(spec, obj(entry?.progress));
    if (!row) continue;
    rows.push({
      ...row,
      name: shortName(entry.name),
      self: viewerId !== null && id === String(viewerId),
      updatedAt: Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0,
    });
  }
  rows.sort(byName);
  const students: ReportStudent[] = rows.map((r, i) => ({ key: `s${i + 1}`, ...r }));

  const wrongCount = spec.quiz.map((_, q) => students.filter((s) => s.marks[q] === false).length);
  const answeredCount = spec.quiz.map((_, q) => students.filter((s) => s.marks[q] !== null).length);
  const worst = Math.max(0, ...wrongCount);
  const scored = students.filter((s) => s.score !== null);
  return {
    lessonId: spec.lessonId,
    grade: spec.grade,
    questions: spec.quiz.map((q) => q.id),
    students,
    wrongCount,
    answeredCount,
    mostMissed: worst > 0 ? wrongCount.indexOf(worst) : null,
    averageScore: scored.length ? Math.round((scored.reduce((sum, s) => sum + s.score!, 0) / scored.length) * 10) / 10 : null,
  };
}

/* ---------- textbook practice ---------- */

const ANSWERED_MAX = 100_000;
const asPercent = (share: number) => Math.round(share * 100);

/** A student's practised topics, in textbook order. Unknown topics and topics with no answers are left out; right can never exceed answered. */
function practisedTopics(progress: Record<string, unknown>) {
  const saved = obj(obj(progress.bot).topics);
  return courseTopics.flatMap((topic) => {
    const record = obj(saved[topic.id]);
    const answered = count(record.answered, ANSWERED_MAX);
    if (answered === 0) return [];
    const right = Math.min(count(record.right, ANSWERED_MAX), answered);
    return [{ topicId: topic.id, answered, right, share: right / answered }];
  });
}

function practiceReport(entries: [string, StoredEntry][], viewerId: number | null): PracticeReport {
  const rows: Omit<PracticeStudent, 'key'>[] = [];
  const perTopic = new Map<string, { answered: number; shares: number[] }>();
  for (const [id, entry] of entries) {
    const practised = practisedTopics(obj(entry?.progress));
    if (practised.length === 0) continue;
    const answered = practised.reduce((sum, t) => sum + t.answered, 0);
    const right = practised.reduce((sum, t) => sum + t.right, 0);
    // First lowest in textbook order: the same topic the bot names to the student in /progress.
    const weakest = practised.reduce((low, t) => (t.share < low.share ? t : low));
    rows.push({
      name: shortName(entry.name),
      self: viewerId !== null && id === String(viewerId),
      topics: practised.length,
      answered,
      right,
      percent: asPercent(right / answered),
      weakest: weakest.share < 1 ? { topicId: weakest.topicId, percent: asPercent(weakest.share) } : null,
      updatedAt: Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0,
    });
    for (const t of practised) {
      const sum = perTopic.get(t.topicId) ?? { answered: 0, shares: [] };
      sum.answered += t.answered;
      sum.shares.push(t.share);
      perTopic.set(t.topicId, sum);
    }
  }
  rows.sort(byName);

  // Weakest first; on a tie, the topic more students practised. The sort is stable, so textbook order decides the rest.
  const ranked = courseTopics
    .flatMap((topic) => {
      const sum = perTopic.get(topic.id);
      if (!sum) return [];
      return [{ topicId: topic.id, answered: sum.answered, students: sum.shares.length, mean: sum.shares.reduce((a, b) => a + b, 0) / sum.shares.length }];
    })
    .sort((a, b) => a.mean - b.mean || b.students - a.students);

  return {
    students: rows.map((r, i) => ({ key: `p${i + 1}`, ...r })),
    topics: ranked.map(({ mean, ...t }) => ({ ...t, averagePercent: asPercent(mean) })),
    weakestTopicId: ranked.length > 0 && ranked[0].mean < 1 ? ranked[0].topicId : null,
    answered: rows.reduce((sum, r) => sum + r.answered, 0),
  };
}

/** The whole report from every saved progress entry (keyed by Telegram user id). */
export function buildTeacherReport(
  entries: Record<string, StoredEntry>,
  viewerId: number | null = null,
  now = Date.now(),
): TeacherReport {
  const list = Object.entries(entries ?? {}).filter(([id]) => /^\d+$/.test(id));
  return {
    generatedAt: now,
    lessons: LESSONS.map((spec) => lessonReport(spec, list, viewerId)),
    practice: practiceReport(list, viewerId),
  };
}
