// What is saved per student, and how the bot's and the Mini App's copies are combined.
// Both can write at once (a student has the app open and also answers in the chat), so progress only ever moves forward.

import type { Lang } from './types.ts';

export interface StudyTopic {
  answered: number;
  /** Answered right on the first try. */
  right: number;
  /** Best round: 1 to 3 stars. */
  stars: number;
  rounds: number;
  lastAt: number;
}

export interface StudyProgress {
  grade: 6 | 7 | null;
  xp: number;
  topics: Record<string, StudyTopic>;
  daily?: { day: string; done: boolean };
  /** Recently answered questions, so pressing an old button twice cannot earn XP twice. */
  seen: number[];
  /** The last problem typed for the homework helper. */
  lastProblem?: string;
  solved?: number;
}

export const freshStudy = (): StudyProgress => ({ grade: null, xp: 0, topics: {}, seen: [] });

const emptyQuiz = () => ({ best: null, last: null, attempts: 0 });

/** A brand-new saved record. The Mini App and the bot share this shape. */
export const freshProgressData = (lang: Lang | null = null) => ({
  v: 1 as const,
  lang,
  kids: { xp: 0, stations: {}, homework: {}, quiz: emptyQuiz(), badges: [], completedAt: null },
  acad: {
    sections: {},
    challenges: {},
    steps: 0,
    problem: { solved: false, wrong: 0, hints: 0 },
    quiz: emptyQuiz(),
    practice: {},
  },
  teacher: { absent: null, confirmedAt: null, reviews: {} },
  updatedAt: 0,
});

type Loose = Record<string, any>;

const later = (a?: { day?: string; count?: number }, b?: { day?: string; count?: number }) => {
  if (!a?.day) return b;
  if (!b?.day) return a;
  if (a.day !== b.day) return a.day > b.day ? a : b;
  return (a.count ?? 0) >= (b.count ?? 0) ? a : b;
};

function mergeStudy(a: Loose | undefined, b: Loose | undefined): StudyProgress | undefined {
  if (!a && !b) return undefined;
  const x = (a ?? {}) as Partial<StudyProgress>;
  const y = (b ?? {}) as Partial<StudyProgress>;
  const topics: Record<string, StudyTopic> = { ...(x.topics ?? {}) };
  for (const [id, t] of Object.entries(y.topics ?? {})) {
    const o = topics[id];
    topics[id] = !o
      ? t
      : { answered: Math.max(o.answered, t.answered), right: Math.max(o.right, t.right), stars: Math.max(o.stars, t.stars), rounds: Math.max(o.rounds, t.rounds), lastAt: Math.max(o.lastAt, t.lastAt) };
  }
  const daily = x.daily && y.daily ? (x.daily.day === y.daily.day ? { day: x.daily.day, done: x.daily.done || y.daily.done } : x.daily.day > y.daily.day ? x.daily : y.daily) : x.daily ?? y.daily;
  return {
    grade: x.grade ?? y.grade ?? null,
    xp: Math.max(x.xp ?? 0, y.xp ?? 0),
    topics,
    ...(daily ? { daily } : {}),
    seen: [...new Set([...(x.seen ?? []), ...(y.seen ?? [])])].slice(-60),
    ...(x.lastProblem ?? y.lastProblem ? { lastProblem: x.lastProblem ?? y.lastProblem } : {}),
    ...(x.solved ?? y.solved ? { solved: Math.max(x.solved ?? 0, y.solved ?? 0) } : {}),
  };
}

/**
 * Combines what the server has with what a client just sent. The client wins on everything it owns;
 * XP, streak and practice results are merged, so a stale app tab cannot erase what was earned in the chat.
 */
export function mergeProgress(server: unknown, incoming: unknown): unknown {
  if (!server || typeof server !== 'object' || !incoming || typeof incoming !== 'object') return incoming;
  const s = server as Loose, c = incoming as Loose;
  const out: Loose = { ...c };
  const study = mergeStudy(s.bot, c.bot);
  if (study) out.bot = study;
  if (c.acad || s.acad) {
    const streak = later(s.acad?.streak, c.acad?.streak);
    const xp = Math.max(s.acad?.xp ?? 0, c.acad?.xp ?? 0);
    out.acad = { ...(c.acad ?? s.acad), ...(streak ? { streak } : {}), ...(xp ? { xp } : {}) };
  }
  out.lang = c.lang ?? s.lang ?? null;
  return out;
}

const SEEN_MAX = 60;

/** Points for one answered question: more for getting there with fewer wrong tries. */
export const xpFor = (wrongTries: number) => (wrongTries === 0 ? 10 : wrongTries === 1 ? 6 : wrongTries === 2 ? 3 : 0);

/** Pure scoring for one answered question. Returns the XP earned (0 if this question was already scored). */
export function scoreAnswer(study: StudyProgress, topicId: string, key: number, wrongTries: number, now: number): number {
  const repeat = study.seen.includes(key);
  const t = study.topics[topicId] ?? { answered: 0, right: 0, stars: 0, rounds: 0, lastAt: 0 };
  if (repeat) return 0;
  const correctFirst = wrongTries === 0;
  const xp = xpFor(wrongTries);
  study.seen = [...study.seen, key].slice(-SEEN_MAX);
  study.topics[topicId] = { ...t, answered: t.answered + 1, right: t.right + (correctFirst ? 1 : 0), lastAt: now };
  study.xp += xp;
  return xp;
}

export const LEVELS = [0, 50, 150, 300, 600, 1000];

export function levelOf(xp: number): number {
  let level = 0;
  LEVELS.forEach((need, i) => {
    if (xp >= need) level = i;
  });
  return level;
}
