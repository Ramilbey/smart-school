import type { SessionSummary } from './live.ts';

/**
 * What a teacher's finished games say about the class: which students are having a hard time, which questions few got right,
 * how the last games went. Plain arithmetic over the saved results (history.json): nothing here asks an AI, so the numbers
 * the assistant shows are always the real ones.
 *
 * Students are told apart by first name only (that is all a student types to join), so two children with the same name count
 * as one. That is a known limit of joining without an account.
 */
export interface StudentInsight {
  name: string;
  /** In how many finished games this student answered at least once. */
  sessions: number;
  answered: number;
  right: number;
  /** Share of answers that were right, 0 to 100. */
  accuracy: number;
  /** Going up or down: the last two games against the ones before. Null until there are three games. */
  trend: 'up' | 'down' | 'flat' | null;
  /** The questions this student missed most often in the last three games (the question texts). */
  missed: string[];
  /** Some of these numbers come from the demo account's made-up games. */
  sample: boolean;
}

export interface QuestionInsight {
  quizTitle: string;
  prompt: string;
  answered: number;
  correctPercent: number;
  sample: boolean;
}

export interface GameInsight {
  code: string;
  title: string;
  finishedAt: number;
  players: number;
  /** Share of all answers in the game that were right; null when nobody answered. */
  accuracy: number | null;
  sample: boolean;
}

export interface Insights {
  /** True when at least one game counted is demo sample data (made up), mixed in with real ones or not. Each row says for itself. */
  sample: boolean;
  students: StudentInsight[];
  questions: QuestionInsight[];
  games: GameInsight[];
  totals: { games: number; students: number; answers: number; accuracy: number | null };
}

const nameKey = (s: string) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
const pct = (right: number, all: number) => (all > 0 ? Math.round((right / all) * 100) : 0);

export function classInsights(history: SessionSummary[], ownerId: string): Insights {
  const mine = history.filter((s) => s.ownerId === ownerId).sort((a, b) => a.finishedAt - b.finishedAt); // oldest first
  const who = new Map<string, { name: string; rounds: { right: number; answered: number; wrong: string[]; sample: boolean }[] }>();
  const qs = new Map<string, { quizTitle: string; prompt: string; answered: number; right: number; sample: boolean }>();
  let answers = 0, rights = 0;

  for (const s of mine) {
    for (const p of s.players) {
      if (!p.answered) continue;
      const key = nameKey(p.name);
      if (!key) continue;
      const rec = who.get(key) ?? { name: p.name, rounds: [] };
      rec.name = p.name; // the latest spelling
      const wrong: string[] = [];
      if (typeof p.res === 'string' && p.res.length === s.questions.length) {
        for (let i = 0; i < p.res.length; i++) if (p.res[i] === '0') wrong.push(s.questions[i]!.prompt);
      }
      rec.rounds.push({ right: p.right, answered: p.answered, wrong, sample: s.sample === true });
      who.set(key, rec);
      answers += p.answered;
      rights += p.right;
    }
    for (const q of s.questions) {
      if (!q.answered) continue;
      const key = `${s.quizId}:${q.id}`;
      const rec = qs.get(key) ?? { quizTitle: s.title, prompt: q.prompt, answered: 0, right: 0, sample: false };
      rec.quizTitle = s.title;
      rec.answered += q.answered;
      rec.right += Math.round((q.correctPercent / 100) * q.answered);
      if (s.sample === true) rec.sample = true;
      qs.set(key, rec);
    }
  }

  const students: StudentInsight[] = [...who.values()].map((r) => {
    const answered = r.rounds.reduce((n, x) => n + x.answered, 0);
    const right = r.rounds.reduce((n, x) => n + x.right, 0);
    let trend: StudentInsight['trend'] = null;
    if (r.rounds.length >= 3) {
      const recent = r.rounds.slice(-2), before = r.rounds.slice(0, -2);
      const a = pct(recent.reduce((n, x) => n + x.right, 0), recent.reduce((n, x) => n + x.answered, 0));
      const b = pct(before.reduce((n, x) => n + x.right, 0), before.reduce((n, x) => n + x.answered, 0));
      trend = a - b >= 10 ? 'up' : b - a >= 10 ? 'down' : 'flat';
    }
    const missCount = new Map<string, number>();
    for (const round of r.rounds.slice(-3)) for (const w of round.wrong) missCount.set(w, (missCount.get(w) ?? 0) + 1);
    const missed = [...missCount].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([prompt]) => prompt);
    return { name: r.name, sessions: r.rounds.length, answered, right, accuracy: pct(right, answered), trend, missed, sample: r.rounds.some((x) => x.sample) };
  });

  const questions: QuestionInsight[] = [...qs.values()].map((q) => ({ quizTitle: q.quizTitle, prompt: q.prompt, answered: q.answered, correctPercent: pct(q.right, q.answered), sample: q.sample }));

  const games: GameInsight[] = [...mine].reverse().map((s) => {
    const a = s.players.reduce((n, p) => n + p.answered, 0), r = s.players.reduce((n, p) => n + p.right, 0);
    return { code: s.code, title: s.title, finishedAt: s.finishedAt, players: s.players.length, accuracy: a ? pct(r, a) : null, sample: s.sample === true };
  });

  return {
    sample: mine.some((s) => s.sample === true),
    students,
    questions,
    games,
    totals: { games: mine.length, students: students.length, answers, accuracy: answers ? pct(rights, answers) : null },
  };
}

/** Students who need a look: answered enough to tell, and fewer than two in three right. Lowest first. */
export function strugglingStudents(i: Insights, limit = 5): StudentInsight[] {
  return i.students.filter((s) => s.answered >= 4 && s.accuracy < 65).sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered).slice(0, limit);
}

/** The questions the fewest students got right (asked at least three times). */
export function hardestQuestions(i: Insights, limit = 5): QuestionInsight[] {
  return i.questions.filter((q) => q.answered >= 3).sort((a, b) => a.correctPercent - b.correctPercent || b.answered - a.answered).slice(0, limit);
}
