import type { SessionSummary } from './live.ts';

/**
 * Sample results for the demo teacher account, so a visitor can try "who is struggling?" without running a real class first.
 * Everything here is made up (and marked `sample`, which the portal shows as "Sample data"). The numbers are deterministic:
 * the same students struggle every time, one gets worse over the games, one gets better.
 */
const STUDENTS: [name: string, ability: number, drift: number][] = [
  ['Dilnoza', 0.9, 0], ['Jasur', 0.82, 0], ['Madina', 0.86, 0], ['Aziz', 0.7, 0], ['Malika', 0.76, 0.02], ['Bekzod', 0.34, 0.12], ['Nodira', 0.66, 0],
  ['Sardor', 0.56, 0], ['Zarina', 0.42, 0], ['Otabek', 0.62, -0.04], ['Lola', 0.78, 0], ['Timur', 0.7, -0.14], ['Gulnora', 0.7, 0], ['Rustam', 0.5, 0.05],
];
/** [prompt, right answer, difficulty 0 to 1]: a student answers right when their ability, plus a little luck, is above the difficulty. */
const QUESTIONS: [prompt: string, answer: string, difficulty: number][] = [
  ['What is 1/2 + 1/4?', '3/4', 0.15],
  ['Simplify 6/8.', '3/4', 0.22],
  ['What is 2/3 of 12?', '8', 0.3],
  ['Solve: 3x + 5 = 20', '5', 0.42],
  ['Solve: 2x − 7 = 9', '8', 0.5],
  ['Which is larger: 3/5 or 2/3?', '2/3', 0.6],
  ['Solve: x/2 + x/3 = 10', '12', 0.78],
  ['A rectangle is (3x + 2) wide and 5 tall. Its area is 55. Find x.', '3', 0.88],
];
const DAYS_AGO = [9, 6, 3, 1];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Four finished games of one quiz, newest first, as the history file stores them. */
export function demoSessions(ownerId: string, now: number): SessionSummary[] {
  const out: SessionSummary[] = [];
  DAYS_AGO.forEach((days, g) => {
    const players = STUDENTS.map(([name, ability, drift], si) => {
      const r = rng(1000 * (g + 1) + si);
      if (g > 0 && r() < 0.1) return null; // absent that day
      const a = Math.min(0.97, Math.max(0.05, ability + drift * g));
      const res = QUESTIONS.map(([, , hard], qi) => (a + (rng(77 * (g + 1) + 13 * si + qi)() - 0.5) * 0.2 > hard ? '1' : '0')).join('');
      const right = [...res].filter((c) => c === '1').length;
      return { name, team: null, score: right * 780 + Math.round(r() * 300), right, answered: QUESTIONS.length, res };
    }).filter((p): p is NonNullable<typeof p> => p !== null).sort((x, y) => y.score - x.score);
    const questions = QUESTIONS.map(([prompt, answer], qi) => {
      const right = players.filter((p) => p.res[qi] === '1').length;
      return { id: `q${qi + 1}`, prompt, kind: 'choice', answer, answered: players.length, correctPercent: Math.round((right / players.length) * 100) };
    });
    const finishedAt = now - days * 86_400_000 - 3_600_000 * (2 + g);
    out.push({
      code: String(940100 + g), quizId: 'demo-fractions', title: 'Fractions and equations', ownerId, mode: 'battle', variant: 'classic', teams: 0,
      startedAt: finishedAt - 12 * 60_000, finishedAt, players, teamBoard: [], questions, sample: true,
    });
  });
  return out.reverse(); // newest first
}
