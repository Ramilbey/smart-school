import { randomBytes, randomInt } from 'node:crypto';
import { HttpError } from './http.ts';
import { answerText, isCorrect, type QuizLang, type QuizQuestion } from './quizzes.ts';

/**
 * Live games. A teacher starts a game from a quiz; students join on their own phones with a 6 digit code and a first name.
 * The server keeps the clock and the score. Students only ever receive the right answer after the reveal (or right after
 * their own answer in the Speed Round), so looking at the network traffic does not help.
 *
 *  - Quiz Battle: the teacher moves through the questions. Fast right answers score more. Teams are optional.
 *  - Speed Round: everyone answers at their own pace until the clock runs out. The most right answers wins.
 *
 * Two of the ready-made games are variants of these (the other ready-made games only change where the questions come from):
 *  - Last One Standing (a Quiz Battle): a wrong or missing answer puts a student out. If everybody would be out at once, nobody is.
 *  - Team Race (a Speed Round with teams): the teams' progress is drawn as a race.
 */
export type Mode = 'battle' | 'speed';
export type Variant = 'classic' | 'survivor' | 'race';
export type Status = 'lobby' | 'question' | 'reveal' | 'running' | 'done';
export type Action = 'start' | 'reveal' | 'next' | 'end' | 'kick';

interface PlayerAnswer {
  choice?: number;
  value?: number;
  text?: string;
  correct: boolean;
  points: number;
  ms: number;
}

interface Player {
  id: string;
  name: string;
  team: number | null;
  score: number;
  /** How many answers were right. (The index of the right answer of a question is called correct; they are never mixed up.) */
  right: number;
  answers: Record<string, PlayerAnswer>;
  joinedAt: number;
  seen: number;
  /** Speed Round: the question this student is on (a position in `order`). */
  cursor: number;
  /** Speed Round: each student gets the questions in their own order, so a neighbour's answers are no use. */
  order: number[];
  /** Last One Standing: the question after which this student was put out; null while still in. */
  outAt: number | null;
  /** Speed Round: what happened with the last answer. */
  last?: { right: boolean; answer: string; explain?: string };
}

export interface SessionSummary {
  code: string;
  quizId: string;
  title: string;
  ownerId: string;
  mode: Mode;
  variant: Variant;
  teams: number;
  startedAt: number;
  finishedAt: number;
  /** `res` has one character per question, in the quiz's order: 1 right, 0 wrong, - not answered. */
  players: { name: string; team: number | null; score: number; right: number; answered: number; res?: string; out?: boolean }[];
  teamBoard: { team: number; members: number; average: number; progress?: number }[];
  questions: { id: string; prompt: string; kind: string; answer: string; answered: number; correctPercent: number }[];
  /** Made up for the demo account: the portal says so wherever it shows these numbers. */
  sample?: boolean;
}

interface Session {
  code: string;
  ownerId: string;
  quizId: string;
  title: string;
  lang: QuizLang;
  questions: QuizQuestion[];
  mode: Mode;
  variant: Variant;
  /** Last One Standing: everybody got the last question wrong, so nobody was put out. */
  mercy: boolean;
  teams: number;
  qSeconds: number;
  speedSeconds: number;
  status: Status;
  qIndex: number;
  qStart: number;
  startedAt: number;
  endsAt: number;
  finishedAt: number;
  createdAt: number;
  players: Map<string, Player>;
}

export interface LiveOptions {
  now?: () => number;
  onFinish?: (summary: SessionSummary) => void;
}

const MAX_PLAYERS = 80;
const MAX_TEAMS = 6;
const GRACE_MS = 1500;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const plain = (s: string, max: number) => s.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

export function createLive(opts: LiveOptions = {}) {
  const now = opts.now ?? Date.now;
  const sessions = new Map<string, Session>();

  /* ---------- helpers ---------- */

  const publicQuestion = (s: Session, i: number) => {
    const q = s.questions[i];
    return { id: q.id, index: i, kind: q.kind, prompt: q.prompt, choices: q.choices ?? null, svg: q.svg ?? null };
  };

  // In Last One Standing the ones still in come first, then whoever lasted longest; everywhere else it is the score.
  const lasted = (p: Player) => (p.outAt === null ? Infinity : p.outAt);
  const alive = (s: Session) => [...s.players.values()].filter((p) => p.outAt === null);
  const ranked = (s: Session) =>
    [...s.players.values()].sort(
      (a, b) => (s.variant === 'survivor' ? lasted(b) - lasted(a) : 0) || b.score - a.score || b.right - a.right || a.joinedAt - b.joinedAt,
    );

  const teamBoard = (s: Session) => {
    if (!s.teams) return [];
    const rows = Array.from({ length: s.teams }, (_, team) => {
      const members = [...s.players.values()].filter((p) => p.team === team);
      const total = members.reduce((n, p) => n + p.score, 0);
      // progress: how far along the race track, 0 to 100 (right answers out of everything the team could have got right)
      const possible = members.length * s.questions.length;
      const rights = members.reduce((n, p) => n + p.right, 0);
      return { team, members: members.length, average: members.length ? Math.round(total / members.length) : 0, progress: possible ? Math.round((rights / possible) * 100) : 0 };
    });
    return rows.sort((a, b) => b.average - a.average || a.team - b.team);
  };

  const board = (s: Session, limit: number) =>
    // No player id here: the board is sent to every student, and the id is what lets a phone answer as that player.
    ranked(s).slice(0, limit).map((p) => ({ name: p.name, team: p.team, score: p.score, right: p.right, out: p.outAt !== null }));

  const questionStats = (s: Session) =>
    s.questions.map((q) => {
      const rows = [...s.players.values()].map((p) => p.answers[q.id]).filter(Boolean);
      const right = rows.filter((a) => a.correct).length;
      return { id: q.id, prompt: q.prompt, kind: q.kind, answer: answerText(q), answered: rows.length, correctPercent: rows.length ? Math.round((right / rows.length) * 100) : 0 };
    });

  function finish(s: Session) {
    if (s.status === 'done') return;
    s.status = 'done';
    s.finishedAt = now();
    opts.onFinish?.({
      code: s.code,
      quizId: s.quizId,
      title: s.title,
      ownerId: s.ownerId,
      mode: s.mode,
      variant: s.variant,
      teams: s.teams,
      startedAt: s.startedAt || s.createdAt,
      finishedAt: s.finishedAt,
      players: ranked(s).map((p) => ({ name: p.name, team: p.team, score: p.score, right: p.right, answered: Object.keys(p.answers).length, res: s.questions.map((q) => { const a = p.answers[q.id]; return !a ? '-' : a.correct ? '1' : '0'; }).join(''), ...(s.variant === 'survivor' ? { out: p.outAt !== null } : {}) })),
      teamBoard: teamBoard(s),
      questions: questionStats(s),
    });
  }

  /** 0..n-1 in a random order (Fisher-Yates with a proper random source). */
  const shuffled = (n: number) => {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = randomInt(0, i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /** The clock: moves a session on when time is up or everyone has answered. Called before every read. */
  function tick(s: Session) {
    const t = now();
    if (s.mode === 'battle' && s.status === 'question') {
      const q = s.questions[s.qIndex];
      const waitingFor = [...s.players.values()].filter((p) => p.outAt === null); // those who are out are not waited for
      const all = waitingFor.length > 0 && waitingFor.every((p) => p.answers[q.id]);
      if (all || t >= s.qStart + s.qSeconds * 1000) toReveal(s);
    }
    if (s.mode === 'speed' && s.status === 'running') {
      const everyoneDone = s.players.size > 0 && [...s.players.values()].every((p) => p.cursor >= s.questions.length);
      if (everyoneDone || t >= s.endsAt) finish(s);
    }
  }

  /** The question is over. In Last One Standing this is where students are put out. */
  function toReveal(s: Session) {
    if (s.status !== 'question') return;
    s.status = 'reveal';
    s.mercy = false;
    if (s.variant !== 'survivor') return;
    const q = s.questions[s.qIndex];
    const still = alive(s);
    const failed = still.filter((p) => !p.answers[q.id]?.correct);
    if (failed.length && failed.length === still.length) s.mercy = true;
    else for (const p of failed) p.outAt = s.qIndex;
  }

  function cleanup() {
    const t = now();
    for (const [code, s] of sessions) {
      if ((s.status === 'done' && t - s.finishedAt > 2 * 3600_000) || t - s.createdAt > 8 * 3600_000) sessions.delete(code);
    }
  }

  const find = (codeRaw: unknown): Session => {
    const s = sessions.get(String(codeRaw ?? '').replace(/\D/g, ''));
    if (!s) throw new HttpError(404, 'no game with this code');
    tick(s);
    return s;
  };

  const owned = (codeRaw: unknown, ownerId: string): Session => {
    const s = find(codeRaw);
    if (s.ownerId !== ownerId) throw new HttpError(404, 'no game with this code');
    return s;
  };

  const player = (s: Session, pid: unknown): Player => {
    const p = typeof pid === 'string' ? s.players.get(pid) : undefined;
    if (!p) throw new HttpError(403, 'you are not in this game');
    p.seen = now();
    return p;
  };

  /* ---------- teacher ---------- */

  function create(input: { ownerId: string; quizId: string; title: string; lang: QuizLang; questions: QuizQuestion[]; mode: unknown; variant?: unknown; teams: unknown; seconds: unknown }): Session {
    cleanup();
    if (sessions.size >= 300) throw new HttpError(503, 'too many games are running on this server');
    if ([...sessions.values()].filter((s) => s.ownerId === input.ownerId && s.status !== 'done').length >= 5) throw new HttpError(409, 'finish or end your other games first');
    const mode: Mode = input.mode === 'speed' ? 'speed' : 'battle';
    // Last One Standing is a Quiz Battle; Team Race is a Speed Round and always has teams.
    const variant: Variant = input.variant === 'survivor' && mode === 'battle' ? 'survivor' : input.variant === 'race' && mode === 'speed' ? 'race' : 'classic';
    let teams = clamp(Math.floor(Number(input.teams)) || 0, 0, MAX_TEAMS) >= 2 ? clamp(Math.floor(Number(input.teams)), 2, MAX_TEAMS) : 0;
    if (variant === 'race' && !teams) teams = 3;
    if (variant === 'survivor') teams = 0;
    const seconds = Math.floor(Number(input.seconds)) || 0;
    let code = '';
    do code = String(randomInt(100000, 1000000));
    while (sessions.has(code));
    const s: Session = {
      code, ownerId: input.ownerId, quizId: input.quizId, title: input.title, lang: input.lang,
      questions: structuredClone(input.questions), mode, variant, mercy: false, teams,
      qSeconds: clamp(mode === 'battle' ? seconds || 20 : 20, 5, 120),
      speedSeconds: clamp(mode === 'speed' ? seconds || 120 : 120, 30, 900),
      status: 'lobby', qIndex: 0, qStart: 0, startedAt: 0, endsAt: 0, finishedAt: 0, createdAt: now(), players: new Map(),
    };
    sessions.set(code, s);
    return s;
  }

  function act(codeRaw: unknown, ownerId: string, action: unknown, pid?: unknown) {
    const s = owned(codeRaw, ownerId);
    const t = now();
    switch (action as Action) {
      case 'start':
        if (s.status !== 'lobby') throw new HttpError(409, 'the game already started');
        if (!s.players.size) throw new HttpError(409, 'wait until students have joined');
        s.startedAt = t;
        if (s.mode === 'battle') {
          s.status = 'question';
          s.qIndex = 0;
          s.qStart = t;
        } else {
          s.status = 'running';
          s.endsAt = t + s.speedSeconds * 1000;
        }
        break;
      case 'reveal':
        if (s.mode === 'battle') toReveal(s);
        break;
      case 'next':
        if (s.mode !== 'battle') throw new HttpError(409, 'the Speed Round has no next question');
        if (s.status === 'question') toReveal(s);
        else if (s.status === 'reveal') {
          const lastOneStanding = s.variant === 'survivor' && s.players.size > 1 && alive(s).length <= 1;
          if (s.qIndex + 1 >= s.questions.length || lastOneStanding) finish(s);
          else {
            s.qIndex += 1;
            s.qStart = t;
            s.status = 'question';
          }
        }
        break;
      case 'end':
        finish(s);
        break;
      case 'kick':
        if (typeof pid === 'string') s.players.delete(pid);
        break;
      default:
        throw new HttpError(400, 'unknown action');
    }
    return teacherView(s);
  }

  function teacherView(s: Session) {
    tick(s);
    const t = now();
    const q = s.mode === 'battle' && (s.status === 'question' || s.status === 'reveal') ? s.questions[s.qIndex] : null;
    let stats: { answered: number; counts: number[] | null; right: number } | null = null;
    if (q) {
      const rows = [...s.players.values()].map((p) => p.answers[q.id]).filter(Boolean);
      const counts = q.kind === 'choice' ? (q.choices ?? []).map((_, i) => rows.filter((a) => a.choice === i).length) : null;
      stats = { answered: rows.length, counts, right: rows.filter((a) => a.correct).length };
    }
    return {
      code: s.code, mode: s.mode, variant: s.variant, status: s.status, title: s.title, lang: s.lang, teams: s.teams,
      total: s.questions.length, qIndex: s.qIndex, qSeconds: s.qSeconds, speedSeconds: s.speedSeconds,
      alive: s.variant === 'survivor' ? alive(s).length : undefined, mercy: s.mercy,
      lastOneStanding: s.variant === 'survivor' && s.players.size > 1 && alive(s).length <= 1,
      serverNow: t, qEndsAt: s.status === 'question' ? s.qStart + s.qSeconds * 1000 : 0, endsAt: s.status === 'running' ? s.endsAt : 0,
      players: ranked(s).map((p) => ({
        id: p.id, name: p.name, team: p.team, score: p.score, right: p.right,
        answered: q ? Boolean(p.answers[q.id]) : false, progress: s.mode === 'speed' ? p.cursor : 0, online: t - p.seen < 10_000, out: p.outAt !== null, outAt: p.outAt,
      })),
      question: q ? { ...publicQuestion(s, s.qIndex), correct: q.correct ?? null, answer: answerText(q), explain: q.explain ?? '' } : null,
      stats,
      leaderboard: board(s, 10),
      teamBoard: teamBoard(s),
      questions: s.status === 'done' ? questionStats(s) : undefined,
    };
  }

  /* ---------- students ---------- */

  function join(codeRaw: unknown, nameRaw: unknown, teamRaw: unknown) {
    const s = find(codeRaw);
    if (s.status === 'done') throw new HttpError(409, 'this game has finished');
    if (s.variant === 'survivor' && s.status !== 'lobby') throw new HttpError(409, 'this game has already started');
    if (s.players.size >= MAX_PLAYERS) throw new HttpError(409, 'this game is full');
    const base = plain(typeof nameRaw === 'string' ? nameRaw : '', 20);
    if (!base) throw new HttpError(400, 'type your first name');
    const taken = new Set([...s.players.values()].map((p) => p.name.toLowerCase()));
    let name = base;
    for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${base.slice(0, 17)} ${n}`;
    let team: number | null = null;
    if (s.teams) {
      const asked = Number(teamRaw);
      if (Number.isInteger(asked) && asked >= 0 && asked < s.teams) team = asked;
      else {
        const sizes = Array.from({ length: s.teams }, (_, i) => [...s.players.values()].filter((p) => p.team === i).length);
        team = sizes.indexOf(Math.min(...sizes));
      }
    }
    const p: Player = { id: randomBytes(12).toString('hex'), name, team, score: 0, right: 0, answers: {}, joinedAt: now(), seen: now(), cursor: 0, order: shuffled(s.questions.length), outAt: null };
    s.players.set(p.id, p);
    return { pid: p.id, name, team, state: playerView(s, p) };
  }

  function playerView(s: Session, p: Player) {
    tick(s);
    const t = now();
    const order = ranked(s);
    const you = { name: p.name, team: p.team, score: p.score, right: p.right, rank: order.indexOf(p) + 1, of: order.length, out: p.outAt !== null, outAt: p.outAt };
    const base = {
      code: s.code, mode: s.mode, variant: s.variant, status: s.status, title: s.title, lang: s.lang, teams: s.teams, total: s.questions.length, serverNow: t, you,
      alive: s.variant === 'survivor' ? alive(s).length : undefined,
      players: s.status === 'lobby' ? order.map((x) => x.name) : undefined,
    };
    if (s.mode === 'battle' && s.status === 'question') {
      const q = s.questions[s.qIndex];
      return { ...base, question: publicQuestion(s, s.qIndex), seconds: s.qSeconds, endsAt: s.qStart + s.qSeconds * 1000, answered: Boolean(p.answers[q.id]) };
    }
    if (s.mode === 'battle' && s.status === 'reveal') {
      const q = s.questions[s.qIndex];
      const mine = p.answers[q.id];
      return {
        ...base,
        question: publicQuestion(s, s.qIndex),
        reveal: {
          correct: q.correct ?? null, answer: answerText(q), explain: q.explain ?? '', answered: Boolean(mine), right: Boolean(mine?.correct), points: mine?.points ?? 0,
          justOut: p.outAt === s.qIndex, mercy: s.mercy,
        },
        leaderboard: board(s, 8), teamBoard: teamBoard(s),
      };
    }
    if (s.mode === 'speed' && s.status === 'running') {
      const finished = p.cursor >= s.questions.length;
      return { ...base, seconds: s.speedSeconds, endsAt: s.endsAt, question: finished ? null : publicQuestion(s, p.order[p.cursor]), finished, last: p.last ?? null, index: p.cursor, teamBoard: s.variant === 'race' ? teamBoard(s) : undefined };
    }
    if (s.status === 'done') return { ...base, leaderboard: board(s, 10), teamBoard: teamBoard(s) };
    return base;
  }

  /** What the student typed or tapped, in the form that is stored with the answer. */
  const given = (q: QuizQuestion, input: { choice?: unknown; value?: unknown; text?: unknown }): Pick<PlayerAnswer, 'choice' | 'value' | 'text'> =>
    q.kind === 'choice' ? { choice: Number(input.choice) } : q.kind === 'text' ? { text: String(input.text ?? '').slice(0, 200) } : { value: Number(String(input.value).replace(',', '.')) };

  function answer(codeRaw: unknown, pid: unknown, input: { choice?: unknown; value?: unknown; text?: unknown }) {
    const s = find(codeRaw);
    const p = player(s, pid);
    const t = now();
    if (s.mode === 'battle') {
      if (s.status !== 'question') throw new HttpError(409, 'this question is closed');
      if (p.outAt !== null) throw new HttpError(409, 'you are out of this game');
      const q = s.questions[s.qIndex];
      if (p.answers[q.id]) throw new HttpError(409, 'you already answered');
      const limit = s.qSeconds * 1000;
      const elapsed = t - s.qStart;
      if (elapsed > limit + GRACE_MS) throw new HttpError(409, 'time is up');
      const correct = isCorrect(q, input);
      const points = correct ? 500 + Math.round(500 * Math.max(0, 1 - elapsed / limit)) : 0;
      p.answers[q.id] = { ...given(q, input), correct, points, ms: elapsed };
      p.score += points;
      if (correct) p.right += 1;
      return playerView(s, p);
    }
    if (s.status !== 'running') throw new HttpError(409, 'the round is not running');
    if (p.cursor >= s.questions.length) throw new HttpError(409, 'you answered everything');
    const q = s.questions[p.order[p.cursor]];
    const correct = isCorrect(q, input);
    p.answers[q.id] = { ...given(q, input), correct, points: correct ? 100 : 0, ms: t - s.startedAt };
    p.score += correct ? 100 : 0;
    if (correct) p.right += 1;
    p.last = { right: correct, answer: answerText(q), explain: q.explain };
    p.cursor += 1;
    return playerView(s, p);
  }

  return {
    create, act, join, answer,
    teacher: (code: unknown, ownerId: string) => teacherView(owned(code, ownerId)),
    state: (code: unknown, pid: unknown) => {
      const s = find(code);
      return playerView(s, player(s, pid));
    },
    /** What the join page may know before a student has joined: the title and whether there are teams. No questions. */
    peek: (code: unknown) => {
      const s = find(code);
      return { code: s.code, title: s.title, mode: s.mode, variant: s.variant, status: s.status, teams: s.teams, players: s.players.size, full: s.players.size >= MAX_PLAYERS };
    },
    activeFor: (ownerId: string) =>
      [...sessions.values()].filter((s) => s.ownerId === ownerId && s.status !== 'done').map((s) => ({ code: s.code, title: s.title, mode: s.mode, status: s.status, players: s.players.size })),
    size: () => sessions.size,
  };
}

export type Live = ReturnType<typeof createLive>;
