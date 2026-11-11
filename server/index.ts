import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import dns from 'node:dns';
import net from 'node:net';
import { TelegramBot, type TgUpdate } from './bot.ts';
import { config, describeConfig, miniAppUrlProblem } from './config.ts';
import { buildTeacherReport, hideOtherNames, shortName, teacherAccess } from './report.ts';
import { allProgress, flushStore, getProgress, putProgress } from './store.ts';
import { mergeProgress } from '../shared/progress.ts';
import { validateInitData, type TelegramUser } from './telegramAuth.ts';
import { TutorRequestError, aiAvailable, askTutor, chatTutorWith, parseTutorRequest, tutorReply } from './tutor.ts';
import { streamerComplete } from './chatGemini.ts';
import { takeAiCredit } from './aiUsage.ts';
import { BoardRequestError, boardEvents, parseBoardRequest } from './boardAi.ts';
import { boardAvailable, boardStreamer } from './boardProvider.ts';
import { SAMPLES } from '../shared/board/samples.ts';
import { TtsRequestError, parseTtsRequest, tts, ttsAvailable, warmPrepared } from './tts.ts';
import { startReminders } from './reminders.ts';
import { HttpError, send, readJson, isLocalOrigin, clientIp } from './http.ts';
import { createPortal } from './portal.ts';
import { assist, generateQuestions } from './teacherAi.ts';
import { createStatic } from './staticFiles.ts';

const botOnly = process.argv.includes('--bot-only');

// Node's "happy eyeballs" gives the IPv4 address a short time slot, then tries IPv6 and fails if IPv6 is unreachable.
// On a lossy network (campus Wi-Fi) one lost packet then kills the whole request to Telegram.
// Default: connect over IPv4 first and let the operating system retry normally. NET_AUTO_FAMILY=true restores Node's behaviour.
dns.setDefaultResultOrder('ipv4first');
net.setDefaultAutoSelectFamily(process.env.NET_AUTO_FAMILY === 'true');
net.setDefaultAutoSelectFamilyAttemptTimeout?.(Number(process.env.NET_CONNECT_ATTEMPT_MS || 2500));

/* ---------- helpers ---------- */

const files = createStatic({ appDir: config.distDir, siteDir: config.siteDir, enabled: config.serveStatic });

function corsHeaders(req: IncomingMessage): Record<string, string> {
  const origin = req.headers.origin;
  if (origin && (config.corsOrigins.includes(origin) || (config.corsAllowLan && isLocalOrigin(origin)))) {
    return {
      'access-control-allow-origin': origin,
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
      vary: 'Origin',
    };
  }
  return {};
}

/** Authenticates a request with Telegram initData sent as "Authorization: tma <initData>". */
function authenticate(req: IncomingMessage): { user: TelegramUser | null; dev: boolean } | { error: string } {
  const header = req.headers.authorization ?? '';
  const initData = header.startsWith('tma ') ? header.slice(4) : '';
  if (initData) {
    const result = validateInitData(initData, config.botToken, config.initDataMaxAge);
    if (result.ok) return { user: result.user, dev: false };
    if (!config.allowDevAuth) return { error: result.reason };
  }
  if (config.allowDevAuth) return { user: null, dev: true };
  return { error: initData ? 'invalid' : 'missing' };
}

/** Who is asking: a valid Telegram login, or (when allowed) a visitor counted by address. */
function whoIsAsking(req: IncomingMessage): { key: string; anon: boolean } | { error: 401 } {
  const header = req.headers.authorization ?? '';
  if (header.startsWith('tma ')) {
    const v = validateInitData(header.slice(4), config.botToken, config.initDataMaxAge);
    return v.ok && v.user ? { key: `u:${v.user.id}`, anon: false } : { error: 401 };
  }
  return config.board.anonymous ? { key: `ip:${clientIp(req)}`, anon: true } : { error: 401 };
}

/** One sentence as an MP3 (see tts.ts): the voice that works in every browser, Telegram's included. */
async function handleTts(req: IncomingMessage, res: ServerResponse, cors: Record<string, string>) {
  if (!ttsAvailable()) return send(res, 503, { error: 'tts-off' }, cors);
  const who = whoIsAsking(req);
  if ('error' in who) return send(res, 401, { error: 'unauthorized' }, cors);
  if (rateLimited(`tts:${who.key}`, 90)) return send(res, 429, { error: 'slow down', scope: 'you' }, cors);
  let body;
  try {
    body = parseTtsRequest(await readJson(req, 4 * 1024));
  } catch (e) {
    if (e instanceof TtsRequestError) return send(res, 400, { error: e.message }, cors);
    throw e;
  }
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: config.reminderTimeZone }).format(new Date());
  if (!takeAiCredit('g:tts', day, config.board.globalTts)) return send(res, 429, { error: 'limit', scope: 'everyone' }, cors);
  try {
    const mp3 = await tts.speech(body.text, body.lang);
    res.writeHead(200, { ...cors, 'content-type': 'audio/mpeg', 'content-length': String(mp3.length), 'cache-control': 'private, max-age=86400' });
    res.end(mp3);
  } catch (e) {
    console.warn('[tts] failed:', (e as Error).message.split('\n').slice(-3).join(' | ').slice(0, 300));
    return send(res, 502, { error: 'voice failed' }, cors);
  }
}

/** The whiteboard tutor / explainer: streams checked "board script" lines (see boardAi.ts). */
async function handleBoard(req: IncomingMessage, res: ServerResponse, cors: Record<string, string>) {
  const streamer = boardStreamer();
  if (!streamer) return send(res, 503, { error: 'ai-off' }, cors);
  const who = whoIsAsking(req);
  if ('error' in who) return send(res, 401, { error: 'unauthorized' }, cors);
  const { key, anon } = who;
  if (rateLimited(`b:${key}`, 10)) return send(res, 429, { error: 'slow down', scope: 'you' }, cors);

  let body;
  try {
    body = parseBoardRequest(await readJson(req, 16 * 1024));
  } catch (e) {
    if (e instanceof BoardRequestError) return send(res, 400, { error: e.message }, cors);
    throw e;
  }
  const kind = body.mode;
  const mine = kind === 'lesson' ? (anon ? config.board.anonLessons : config.board.userLessons) : anon ? config.board.anonTurns : config.board.userTurns;
  const all = kind === 'lesson' ? config.board.globalLessons : config.board.globalTurns;
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: config.reminderTimeZone }).format(new Date());
  // Counted before the call and not given back: a call that fails may still be billed.
  if (!takeAiCredit(`${kind}:${key}`, day, mine)) return send(res, 429, { error: 'limit', scope: 'you' }, cors);
  if (!takeAiCredit(`g:${kind}`, day, all)) return send(res, 429, { error: 'limit', scope: 'everyone' }, cors);

  res.writeHead(200, { ...cors, 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
  const stop = new AbortController();
  res.on('close', () => stop.abort());
  for await (const event of boardEvents(streamer, body, stop.signal)) {
    if (res.writableEnded || res.destroyed) break;
    res.write(`${JSON.stringify(event)}\n`);
  }
  res.end();
}

/** Tiny fixed-window rate limiter for the AI tutor. */
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(key: string, limit = 15, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now > h.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    return false;
  }
  h.count += 1;
  return h.count > limit;
}

/* ---------- routes ---------- */

let bot: TelegramBot | null = null;

/** Teacher accounts, quizzes and live games for the website (see portal.ts). */
const portal = createPortal({
  dir: config.dataDir,
  secret: config.portalSecret,
  allowSignup: config.portalSignup,
  demo: config.portalDemo ? { username: 'ustoz', password: config.portalDemoPassword, name: 'Demo teacher' } : null,
  ai: {
    available: boardAvailable,
    generate: (req) => generateQuestions(boardStreamer()!, req),
    assist: (req) => assist(boardStreamer()!, req),
    take: (key, limit) => takeAiCredit(key, new Intl.DateTimeFormat('en-CA', { timeZone: config.reminderTimeZone }).format(new Date()), limit),
  },
});

async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL) {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    return res.end();
  }

  if (await portal.handle(req, res, url, cors)) return;

  if (url.pathname === '/api/health' && req.method === 'GET') {
    return send(res, 200, { ok: true, ai: aiAvailable(), bot: Boolean(bot) }, cors);
  }

  if (url.pathname === '/api/session' && req.method === 'POST') {
    const auth = authenticate(req);
    // The whiteboard is open to visitors without a Telegram login (counted by address) unless BOARD_ANONYMOUS=false
    if ('error' in auth) return send(res, 200, { authenticated: false, reason: auth.error, ai: false, board: boardAvailable() && config.board.anonymous, tts: ttsAvailable() }, cors);
    return send(
      res,
      200,
      {
        authenticated: !auth.dev,
        dev: auth.dev,
        ai: aiAvailable(),
        board: boardAvailable(),
        tts: ttsAvailable(),
        user: auth.user ? { id: auth.user.id, firstName: auth.user.first_name ?? '', languageCode: auth.user.language_code ?? '' } : null,
      },
      cors,
    );
  }

  if (url.pathname === '/api/tutor' && req.method === 'POST') {
    const auth = authenticate(req);
    if ('error' in auth) return send(res, 401, { error: 'unauthorized', reason: auth.error }, cors);
    const key = auth.user ? `u:${auth.user.id}` : `ip:${req.socket.remoteAddress}`;
    if (rateLimited(key)) return send(res, 429, { error: 'slow down' }, cors);
    try {
      const body = parseTutorRequest(await readJson(req, 8 * 1024));
      return send(res, 200, await tutorReply(body), cors);
    } catch (e) {
      if (e instanceof TutorRequestError) return send(res, 400, { error: e.message }, cors);
      throw e;
    }
  }

  if (url.pathname === '/api/board' && req.method === 'POST') return handleBoard(req, res, cors);
  if (url.pathname === '/api/tts' && req.method === 'POST') return handleTts(req, res, cors);

  if (url.pathname === '/api/progress') {
    const auth = authenticate(req);
    if ('error' in auth || !auth.user) return send(res, 401, { error: 'telegram login required' }, cors);
    if (req.method === 'GET') {
      const entry = getProgress(auth.user.id);
      return send(res, 200, entry ? { progress: entry.progress, updatedAt: entry.updatedAt } : { progress: null, updatedAt: 0 }, cors);
    }
    if (req.method === 'PUT') {
      const body = (await readJson(req, 40 * 1024)) as { progress?: unknown; updatedAt?: number } | null;
      // The name comes from validated initData, never from the request body.
      // The chat bot may have saved results since this client last loaded: merge rather than overwrite.
      const merged = mergeProgress(getProgress(auth.user.id)?.progress, body?.progress);
      const result = putProgress(auth.user.id, merged, Number(body?.updatedAt), shortName(auth.user.first_name));
      if (result === 'invalid') return send(res, 400, { error: 'progress must be an object' }, cors);
      if (result === 'too-large') return send(res, 413, { error: 'progress too large' }, cors);
      return send(res, 200, { ok: true, updatedAt: result.updatedAt }, cors);
    }
  }

  if (url.pathname === '/api/teacher/report' && req.method === 'GET') {
    const access = teacherAccess(req.headers.authorization, {
      botToken: config.botToken,
      maxAgeSeconds: config.initDataMaxAge,
      teacherIds: config.teacherIds,
      open: config.teacherOpen,
    });
    if (!access.ok) return send(res, access.status, { error: access.status === 401 ? 'telegram login required' : 'teachers only' }, cors);
    const report = buildTeacherReport(allProgress(), access.userId);
    // someone on the teacher list sees every name; anyone else (only possible with TEACHER_OPEN) sees their own and no others
    return send(res, 200, config.teacherIds.has(access.userId) ? report : hideOtherNames(report), cors);
  }

  return send(res, 404, { error: 'not found' }, cors);
}

async function handleWebhook(req: IncomingMessage, res: ServerResponse) {
  if (!bot || config.botMode !== 'webhook') return send(res, 404, { error: 'not found' });
  if (req.headers['x-telegram-bot-api-secret-token'] !== config.webhookSecret) return send(res, 401, { error: 'bad secret' });
  const update = (await readJson(req, 1024 * 1024)) as TgUpdate;
  send(res, 200, { ok: true });
  if (update) void bot.handleUpdate(update);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (url.pathname === '/telegram/webhook' && req.method === 'POST') return await handleWebhook(req, res);
    if (req.method === 'GET' || req.method === 'HEAD') return files.handle(req, res, url);
    send(res, 405, { error: 'method not allowed' });
  } catch (e) {
    // Errors need the CORS headers too: without them a web page on another origin (the website) cannot read a 401 or 404
    // and shows "server down" instead of "wrong password" or "no game with this code".
    if (e instanceof HttpError) return send(res, e.status, { error: e.message }, corsHeaders(req));
    console.error('[http] unhandled error:', (e as Error).message);
    if (!res.headersSent) send(res, 500, { error: 'internal error' }, corsHeaders(req));
  }
});

/* ---------- startup ---------- */

let stopReminders: () => void = () => undefined;

/** The bot's free-text tutor: Claude if there is a key, else the same Gemini the whiteboard uses; off with neither (or with the allowance at 0). */
function chatAsk() {
  if (config.aiQuestionsPerDay <= 0) return undefined;
  if (aiAvailable()) return askTutor;
  const streamer = boardStreamer();
  return streamer ? chatTutorWith(streamerComplete(streamer), config.aiQuestionsPerDay) : undefined;
}

async function startBot() {
  if (!config.botToken) {
    console.log('[bot] TELEGRAM_BOT_TOKEN not set; the bot is disabled (the Mini App and API still work).');
    return;
  }
  const problem = miniAppUrlProblem();
  if (problem) console.warn(`[bot] ${problem}. /start will explain that the app link is not configured.`);
  bot = new TelegramBot({
    token: config.botToken,
    miniAppUrl: config.miniAppUrl,
    miniAppUrlProblem: problem,
    autoconfigure: config.botAutoconfigure,
    ask: chatAsk(),
  });
  try {
    await bot.init();
  } catch (e) {
    console.error(`[bot] could not connect to Telegram: ${(e as Error).message}`);
    bot = null;
    return;
  }
  if (config.botMode === 'webhook') {
    if (problem || !config.webhookSecret || /replace-with/.test(config.webhookSecret)) {
      console.error('[bot] webhook mode needs a valid https MINI_APP_URL and TELEGRAM_WEBHOOK_SECRET. Bot not started.');
      bot = null;
      return;
    }
    const hook = process.env.WEBHOOK_URL || `${new URL(config.miniAppUrl).origin}/telegram/webhook`;
    await bot.setWebhook(hook, config.webhookSecret);
  } else {
    void bot.startPolling();
  }
  const b = bot;
  stopReminders = startReminders({ sendReminder: (chatId, lang, html, streak) => b.sendReminder(chatId, lang, html, streak) });
}

console.log('Smart Schools server');
for (const line of describeConfig()) console.log(`  · ${line}`);
console.log(`  · server voice: ${process.env.TTS_DISABLED === 'true' ? 'off (TTS_DISABLED)' : ttsAvailable() ? 'on (edge-tts, sentences are cached on disk)' : 'off (edge-tts not installed: the browser voice is used)'}`);

if (botOnly) {
  void startBot();
} else {
  const onListening = () => {
    console.log(`  → http://localhost:${config.port}`);
    void startBot();
    // make the voice of the prepared lessons now, one sentence at a time, so the demo never waits for it
    if (ttsAvailable() && process.env.TTS_WARM !== 'false') {
      const lines = SAMPLES.flatMap((s) => [...s.beats, ...s.followUps.flatMap((f) => f.beats)].map((b) => b.say));
      void warmPrepared([...new Set(lines)]).then((n) => console.log(`  · server voice: ${n} sentences of the prepared lessons are ready`));
    }
  };
  if (config.host) server.listen(config.port, config.host, onListening);
  else server.listen(config.port, onListening);
}

function shutdown() {
  stopReminders();
  bot?.stop();
  flushStore();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
