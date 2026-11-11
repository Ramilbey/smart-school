import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseTeacherIds } from './report.ts';

/** Loads KEY=VALUE pairs from .env without overriding variables already set in the environment. */
function loadDotEnv(file = path.resolve(process.cwd(), '.env')) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trimStart().startsWith('#')) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

loadDotEnv();

const bool = (v: string | undefined, fallback: boolean) =>
  v === undefined || v === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());

/** A whole number of 0 or more; a blank or invalid value means the fallback. */
const count = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v?.trim() && Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
};

const PLACEHOLDER_TOKEN = /replace-with|^123456789:/;

const rawToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
const rawMiniAppUrl = process.env.MINI_APP_URL?.trim() ?? '';

export const config = {
  port: Number(process.env.PORT || 8787),
  /** Which address to listen on. Empty = every address (the default). Behind a reverse proxy on the same machine, set 127.0.0.1 so the app can only be reached through it. */
  host: process.env.HOST?.trim() ?? '',
  serveStatic: bool(process.env.SERVE_STATIC, true),
  distDir: path.resolve(process.cwd(), 'dist'),
  /** The built website (npm run build:site). When it is there it is served at "/" and the Mini App moves to "/app/". */
  siteDir: path.resolve(process.cwd(), process.env.SITE_DIR || 'dist-site'),
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || 'data'),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  allowDevAuth: bool(process.env.ALLOW_DEV_AUTH, false),
  /** Telegram user ids allowed to read the homework report (TEACHER_IDS, comma-separated). */
  teacherIds: parseTeacherIds(process.env.TEACHER_IDS),
  /** Let every Telegram user open the teacher report (for a demo or an MVP). They see the other students' progress without names. Off by default. */
  teacherOpen: bool(process.env.TEACHER_OPEN, false),
  initDataMaxAge: Number(process.env.INIT_DATA_MAX_AGE || 86400),

  botToken: rawToken && !PLACEHOLDER_TOKEN.test(rawToken) ? rawToken : '',
  miniAppUrl: rawMiniAppUrl,
  miniAppDirectLink: process.env.MINI_APP_DIRECT_LINK?.trim() ?? '',
  botMode: (process.env.BOT_MODE ?? 'polling').toLowerCase() === 'webhook' ? 'webhook' : 'polling',
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? '',
  botAutoconfigure: bool(process.env.BOT_SET_MENU_BUTTON, true),

  anthropicKey: process.env.ANTHROPIC_API_KEY?.trim() ?? '',
  anthropicModel: process.env.ANTHROPIC_MODEL?.trim() || 'claude-opus-5-5',
  /** AI answers one student can ask for in the bot chat per day (Tashkent day). 0 turns them off. */
  aiQuestionsPerDay: count(process.env.AI_QUESTIONS_PER_DAY, 20),
  /** Which AI writes the whiteboard lessons: "auto" = Claude if it has a key, else Gemini; or force "anthropic" / "gemini". */
  aiProvider: ((): 'auto' | 'anthropic' | 'gemini' => { const v = (process.env.AI_PROVIDER ?? 'auto').toLowerCase(); return v === 'anthropic' || v === 'gemini' ? v : 'auto'; })(),
  /** Google Gemini (free tier keys work). Several keys, separated by commas: the next is used when one is out of quota. */
  gemini: {
    keys: (process.env.GEMINI_API_KEYS ?? process.env.GEMINI_API_KEY ?? '').split(',').map((k) => k.trim()).filter(Boolean),
    model: process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview',
    /** Tried in this order when the main model is overloaded (comma separated; empty = none). */
    fallbackModels: (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.6-flash,gemini-3.1-flash-lite').split(',').map((m) => m.trim()).filter(Boolean),
    thinking: (process.env.GEMINI_THINKING ?? 'minimal').trim(),
  },
  /** The whiteboard tutor and explainer. Allowances are per day (Tashkent). Without a Telegram login a visitor is counted by address. */
  board: {
    anonymous: bool(process.env.BOARD_ANONYMOUS, true),
    userLessons: count(process.env.BOARD_USER_LESSONS, 8),
    userTurns: count(process.env.BOARD_USER_TURNS, 60),
    anonLessons: count(process.env.BOARD_ANON_LESSONS, 3),
    anonTurns: count(process.env.BOARD_ANON_TURNS, 12),
    /** Everybody together, so a surprise crowd cannot run up the bill. */
    globalLessons: count(process.env.BOARD_GLOBAL_LESSONS, 300),
    globalTurns: count(process.env.BOARD_GLOBAL_TURNS, 1500),
    /** Sentences the server voice may make in a day, everybody together. */
    globalTts: count(process.env.BOARD_GLOBAL_TTS, 6000),
  },

  /** The website portal: teacher accounts, quizzes and live games. */
  portalSecret: process.env.PORTAL_SECRET?.trim() ?? '',
  portalSignup: bool(process.env.PORTAL_SIGNUP, true),
  /** A ready-made teacher account for trying the portal. Off in production unless PORTAL_DEMO=true. */
  portalDemo: bool(process.env.PORTAL_DEMO, process.env.NODE_ENV !== 'production'),
  portalDemoPassword: process.env.PORTAL_DEMO_PASSWORD?.trim() || 'ustoz2026',
  /** Let web pages served from this computer or from the school network (localhost, 192.168.x.x, 10.x.x.x, …) call the API. Off in production unless CORS_ALLOW_LAN=true. */
  corsAllowLan: bool(process.env.CORS_ALLOW_LAN, process.env.NODE_ENV !== 'production'),

  reminders: bool(process.env.REMINDERS, true),
  reminderHour: Math.min(21, Math.max(0, Number(process.env.REMINDER_HOUR ?? 19) || 19)),
  reminderTimeZone: process.env.REMINDER_TZ?.trim() || 'Asia/Tashkent',
};

export const miniAppUrlProblem = (): string | null => {
  if (!config.miniAppUrl) return 'MINI_APP_URL is not set';
  try {
    const u = new URL(config.miniAppUrl);
    if (u.protocol !== 'https:') return 'MINI_APP_URL must start with https:// (Telegram requires HTTPS)';
    if (/example\.com$/.test(u.hostname)) return 'MINI_APP_URL is still the placeholder from .env.example';
    return null;
  } catch {
    return 'MINI_APP_URL is not a valid URL';
  }
};

function staticSummary(): string {
  if (!config.serveStatic) return 'off';
  const site = existsSync(path.join(config.siteDir, 'index.html'));
  const app = existsSync(path.join(config.distDir, 'index.html'));
  if (site && app) return 'website at / and Mini App at /app/';
  if (site) return 'website at / (no Mini App build)';
  if (app) return 'Mini App at / (no website build: run npm run build:site to add the website)';
  return 'nothing built yet (run npm run build:all)';
}

/** Startup summary that never prints secret values (TEACHER_IDS: only how many). */
export function describeConfig(): string[] {
  const urlProblem = miniAppUrlProblem();
  return [
    `port: ${config.port}${config.host ? ` (listening on ${config.host} only)` : ''}`,
    `static files: ${staticSummary()}`,
    `telegram bot token: ${config.botToken ? 'set' : 'not set (bot disabled)'}`,
    `mini app url: ${urlProblem ? `problem: ${urlProblem}` : config.miniAppUrl}`,
    `bot mode: ${config.botMode}`,
    `dev auth without Telegram: ${config.allowDevAuth ? 'ALLOWED (development only)' : 'off'}`,
    `teacher report: ${config.teacherOpen ? 'open to every Telegram user (other students\' names hidden)' : config.teacherIds.size ? `${config.teacherIds.size} teacher id(s) allowed` : 'no TEACHER_IDS set (everyone gets 403)'}`,
    `AI tutor: ${config.anthropicKey ? `live (${config.anthropicModel})` : 'curated fallback only (no ANTHROPIC_API_KEY)'}`,
    `whiteboard tutor: ${config.anthropicKey || config.gemini.keys.length ? `live, per day ${config.board.userLessons} lessons and ${config.board.userTurns} questions each, ${config.board.globalLessons}/${config.board.globalTurns} in all${config.anthropicKey && config.aiProvider !== 'gemini' ? ' (Claude)' : ` (Gemini ${config.gemini.model}${config.gemini.fallbackModels.length ? ` then ${config.gemini.fallbackModels.join(', ')}` : ''}, ${config.gemini.keys.length} key(s))`}` : 'sample lessons only (no ANTHROPIC_API_KEY or GEMINI_API_KEYS)'}`,
    `AI questions in the bot chat: ${(config.anthropicKey || config.gemini.keys.length) && config.aiQuestionsPerDay > 0 ? `on, ${config.aiQuestionsPerDay} per student per day (${config.anthropicKey ? 'Claude' : 'Gemini'})` : 'off'}`,
    `teacher portal: accounts ${config.portalSignup ? 'can be created' : 'are closed'}; demo teacher ${config.portalDemo ? 'ustoz (for trying it out)' : 'off'}`,
    `streak reminders: ${config.reminders ? `on, from ${config.reminderHour}:00 (${config.reminderTimeZone})` : 'off'}`,
  ];
}
