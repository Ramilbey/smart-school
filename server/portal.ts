import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { createAccounts, type PublicTeacher, type Teacher } from './accounts.ts';
import { HttpError, clientIp, makeLimiter, readJson, send } from './http.ts';
import { readJsonFile, writeJsonAtomic } from './jsonFile.ts';
import { createLive, type SessionSummary } from './live.ts';
import { createQuizStore, normalizeQuiz, type QuizLang, type QuizQuestion } from './quizzes.ts';
import { mathQuestions, questionsFromTopic, topicList } from './quizMaker.ts';
import { classInsights } from './classInsights.ts';
import { demoSessions } from './demoHistory.ts';
import type { AssistRequest, AssistantReply, GenRequest, GenResult } from './teacherAi.ts';

/**
 * The website portal: teachers log in, make quizzes, start live games and read results; students join with a code.
 * Routes: /api/portal/* (teacher, with a bearer token) and /api/play/* (students, with a code and a private player id).
 */
export interface PortalOptions {
  dir: string;
  secret?: string;
  allowSignup: boolean;
  demo: { username: string; password: string; name: string } | null;
  ai: {
    available: () => boolean;
    /** Draft questions from a topic or a pasted text. */
    generate: (req: GenRequest) => Promise<GenResult>;
    /** One turn of the teacher assistant. */
    assist: (req: AssistRequest) => Promise<AssistantReply>;
    /** Takes one request from a key's allowance for today (a teacher, or everyone together); false when it is used up. */
    take?: (key: string, limit: number) => boolean;
  };
  now?: () => number;
}

const lang = (): QuizLang => 'en';

export function createPortal(opts: PortalOptions) {
  const now = opts.now ?? Date.now;
  const accounts = createAccounts({ dir: opts.dir, secret: opts.secret, now });
  const quizzes = createQuizStore({ dir: opts.dir, now });
  const historyFile = path.join(opts.dir, 'history.json');
  const history: { sessions: SessionSummary[] } = readJsonFile(historyFile, { sessions: [] });
  const live = createLive({
    now,
    onFinish: (summary) => {
      history.sessions.unshift(summary);
      history.sessions.length = Math.min(history.sessions.length, 300);
      writeJsonAtomic(historyFile, history);
    },
  });
  const tooMany = makeLimiter(now);

  // Textbook questions come with a picture the server drew. The teacher's page cannot send pictures back (that would let
  // anyone put anything into a quiz), so the server remembers what it drew for a while and attaches it again when the quiz is saved.
  const PICTURE_TTL = 6 * 3600_000;
  const MAX_PICTURES = 300;
  const pictures = new Map<string, { svg: string; at: number }>();
  const rememberPictures = (owner: string, list: QuizQuestion[]) => {
    for (const q of list) {
      if (!q.svg) continue;
      pictures.delete(`${owner}:${q.id}`);
      pictures.set(`${owner}:${q.id}`, { svg: q.svg, at: now() });
    }
    for (const key of pictures.keys()) {
      if (pictures.size <= MAX_PICTURES) break;
      pictures.delete(key);
    }
  };
  const pictureOf = (owner: string) => (id: string) => {
    const hit = pictures.get(`${owner}:${id}`);
    return hit && now() - hit.at < PICTURE_TTL ? hit.svg : undefined;
  };
  const demoSeeded = opts.demo ? accounts.seedDemo(opts.demo.username, opts.demo.password, opts.demo.name) || true : false;
  // The demo teacher starts with sample results, so "who is struggling?" has something to answer. Marked as sample wherever shown.
  if (opts.demo) {
    try {
      const id = accounts.login(opts.demo.username, opts.demo.password).teacher.id;
      if (!history.sessions.some((x) => x.ownerId === id)) {
        history.sessions.push(...demoSessions(id, now()));
        history.sessions.sort((x, y) => y.finishedAt - x.finishedAt);
        writeJsonAtomic(historyFile, history);
      }
    } catch {
      /* the demo password was changed by hand: no sample results */
    }
  }

  const bearer = (req: IncomingMessage): Teacher => {
    const h = req.headers.authorization ?? '';
    const teacher = accounts.verify(h.startsWith('Bearer ') ? h.slice(7) : '');
    if (!teacher) throw new HttpError(401, 'please log in');
    return teacher;
  };

  const info = () => ({
    ok: true,
    ai: opts.ai.available(),
    signup: opts.allowSignup,
    demo: demoSeeded && opts.demo ? { username: opts.demo.username, password: opts.demo.password } : null,
  });

  /** Returns true when the request belonged to the portal. A refusal (wrong password, no such game…) is answered here, with the CORS headers,
   *  because a page on another origin cannot read an error response that lacks them and would report "server down" instead. */
  async function handle(req: IncomingMessage, res: ServerResponse, url: URL, cors: Record<string, string>): Promise<boolean> {
    try {
      return await route(req, res, url, cors);
    } catch (e) {
      if (e instanceof HttpError) {
        send(res, e.status, { error: e.message }, cors);
        return true;
      }
      throw e;
    }
  }

  async function route(req: IncomingMessage, res: ServerResponse, url: URL, cors: Record<string, string>): Promise<boolean> {
    const p = url.pathname;
    if (!p.startsWith('/api/portal/') && !p.startsWith('/api/play/')) return false;
    const m = req.method ?? 'GET';
    const ip = clientIp(req);
    const ok = (body: unknown, status = 200) => send(res, status, body, cors);
    const body = async () => ((await readJson(req)) ?? {}) as Record<string, unknown>;

    /* ----- students ----- */
    // A whole class often sits behind one school Wi-Fi address, so the address limits are generous and the
    // real limit for polling and answering is per student (the private player id).
    if (p === '/api/play/peek' && m === 'GET') {
      if (tooMany(`peek:${ip}`, 300, 60_000)) throw new HttpError(429, 'slow down a little');
      ok(live.peek(url.searchParams.get('code')));
      return true;
    }
    if (p === '/api/play/join' && m === 'POST') {
      if (tooMany(`join:${ip}`, 200, 60_000)) throw new HttpError(429, 'slow down a little');
      const b = await body();
      ok(live.join(b.code, b.name, b.team));
      return true;
    }
    if (p === '/api/play/state' && m === 'GET') {
      if (tooMany(`state:${ip}`, 6000, 60_000) || tooMany(`state:${url.searchParams.get('pid')}`.slice(0, 60), 150, 60_000)) throw new HttpError(429, 'slow down a little');
      ok({ state: live.state(url.searchParams.get('code'), url.searchParams.get('pid')) });
      return true;
    }
    if (p === '/api/play/answer' && m === 'POST') {
      const b = await body();
      if (tooMany(`answer:${String(b.pid)}`, 120, 60_000)) throw new HttpError(429, 'slow down a little');
      ok({ state: live.answer(b.code, b.pid, { choice: b.choice, value: b.value, text: b.text }) });
      return true;
    }

    /* ----- accounts ----- */
    if (p === '/api/portal/info' && m === 'GET') {
      ok(info());
      return true;
    }
    if (p === '/api/portal/auth/register' && m === 'POST') {
      if (!opts.allowSignup) throw new HttpError(403, 'new accounts are switched off on this server');
      if (tooMany(`register:${ip}`, 5, 3600_000)) throw new HttpError(429, 'too many accounts from this address, try later');
      const b = await body();
      ok(accounts.register(b.username, b.password, b.name), 201);
      return true;
    }
    if (p === '/api/portal/auth/login' && m === 'POST') {
      const b = await body();
      if (tooMany(`login:${ip}:${String(b.username).toLowerCase()}`, 10, 60_000)) throw new HttpError(429, 'too many tries, wait a minute');
      ok(accounts.login(b.username, b.password));
      return true;
    }

    /* ----- everything below needs a logged in teacher ----- */
    const teacher = bearer(req);
    const me: PublicTeacher = { id: teacher.id, username: teacher.username, name: teacher.name };

    if (p === '/api/portal/me' && m === 'GET') {
      ok({ teacher: me, active: live.activeFor(teacher.id) });
      return true;
    }
    if (p === '/api/portal/topics' && m === 'GET') {
      ok({ topics: topicList(lang()) });
      return true;
    }
    if (p === '/api/portal/quizzes' && m === 'GET') {
      ok({ quizzes: quizzes.list(teacher.id) });
      return true;
    }
    if (p === '/api/portal/quizzes' && m === 'POST') {
      ok({ quiz: quizzes.create(teacher.id, await readJson(req, 256 * 1024), pictureOf(teacher.id)) }, 201);
      return true;
    }
    const one = /^\/api\/portal\/quizzes\/([a-f0-9]+)(\/delete)?$/.exec(p);
    if (one) {
      if (m === 'GET' && !one[2]) ok({ quiz: quizzes.get(teacher.id, one[1]) });
      else if (m === 'PUT' && !one[2]) ok({ quiz: quizzes.update(teacher.id, one[1], await readJson(req, 256 * 1024), pictureOf(teacher.id)) });
      else if (m === 'POST' && one[2]) {
        quizzes.remove(teacher.id, one[1]);
        ok({ ok: true });
      } else throw new HttpError(405, 'method not allowed');
      return true;
    }

    if (p === '/api/portal/generate/topic' && m === 'POST') {
      const b = await body();
      const made = questionsFromTopic(b.topicId, b.count, lang());
      rememberPictures(teacher.id, made.questions);
      ok(made);
      return true;
    }
    if (p === '/api/portal/generate/math' && m === 'POST') {
      const b = await body();
      ok(mathQuestions(b));
      return true;
    }
    /* ----- the AI helpers ----- */
    // One allowance of requests per teacher per day, and one for the whole server, on top of a per-minute limit.
    const takeAi = () => {
      if (opts.ai.take && (!opts.ai.take(`ta:${teacher.id}`, 80) || !opts.ai.take('g:portal', 1500))) throw new HttpError(429, 'the AI has had enough requests for today, try again tomorrow');
    };
    if (p === '/api/portal/generate/ai' && m === 'POST') {
      if (!opts.ai.available()) throw new HttpError(503, 'AI is not set up on this server');
      if (tooMany(`ai:${teacher.id}`, 10, 60_000)) throw new HttpError(429, 'wait a minute before asking the AI again');
      const b = await body();
      takeAi();
      const types = Array.isArray(b.types) ? b.types.map(String) : [];
      const made = await opts.ai.generate({ topic: String(b.topic ?? ''), count: Number(b.count), grade: Number(b.grade) || undefined, style: b.style === 'gamified' ? 'gamified' : 'standard', types: types as GenRequest['types'] });
      ok({ title: made.title, subject: made.subject, questions: made.questions, note: 'Draft written by AI. Read every question before you use it.' });
      return true;
    }
    if (p === '/api/portal/insights' && m === 'GET') {
      ok({ insights: classInsights(history.sessions, teacher.id) });
      return true;
    }
    if (p === '/api/portal/assistant' && m === 'POST') {
      if (!opts.ai.available()) throw new HttpError(503, 'AI is not set up on this server');
      if (tooMany(`assist:${teacher.id}`, 8, 60_000)) throw new HttpError(429, 'wait a moment before asking again');
      const b = await body();
      const message = String(b.message ?? '').replace(/\s+/g, ' ').trim().slice(0, 600);
      if (message.length < 2) throw new HttpError(400, 'write a question or a request');
      const hist = (Array.isArray(b.history) ? b.history : []).slice(-6).map((h) => {
        const r = (h ?? {}) as Record<string, unknown>;
        return { role: r.role === 'assistant' ? ('assistant' as const) : ('teacher' as const), text: String(r.text ?? '').slice(0, 600) };
      });
      takeAi();
      ok(await opts.ai.assist({ message, history: hist, insights: classInsights(history.sessions, teacher.id) }));
      return true;
    }

    if (p === '/api/portal/sessions' && m === 'POST') {
      const b = await body();
      const quiz = quizzes.get(teacher.id, String(b.quizId ?? ''));
      const s = live.create({ ownerId: teacher.id, quizId: quiz.id, title: quiz.title, lang: quiz.lang, questions: quiz.questions, mode: b.mode, variant: b.variant, teams: b.teams, seconds: b.seconds });
      ok({ code: s.code, view: live.teacher(s.code, teacher.id) }, 201);
      return true;
    }
    const sess = /^\/api\/portal\/sessions\/(\d{6})(\/action)?$/.exec(p);
    if (sess) {
      if (m === 'GET' && !sess[2]) ok({ view: live.teacher(sess[1], teacher.id) });
      else if (m === 'POST' && sess[2]) {
        const b = await body();
        ok({ view: live.act(sess[1], teacher.id, b.action, b.pid) });
      } else throw new HttpError(405, 'method not allowed');
      return true;
    }
    if (p === '/api/portal/history' && m === 'GET') {
      ok({ sessions: history.sessions.filter((s) => s.ownerId === teacher.id).map(({ code, title, mode, variant, teams, finishedAt, players }) => ({ code, title, mode, variant, teams, finishedAt, players: players.length })) });
      return true;
    }
    const hist = /^\/api\/portal\/history\/(\d{6})$/.exec(p);
    if (hist && m === 'GET') {
      const s = history.sessions.find((x) => x.code === hist[1] && x.ownerId === teacher.id);
      if (!s) throw new HttpError(404, 'no results for this game');
      ok({ summary: s });
      return true;
    }
    throw new HttpError(404, 'not found');
  }

  return { handle, accounts, quizzes, live, history, info };
}

export type Portal = ReturnType<typeof createPortal>;

/** Used by the server entry and by tests: checks a quiz body without storing it. */
export const validateQuizBody = normalizeQuiz;
