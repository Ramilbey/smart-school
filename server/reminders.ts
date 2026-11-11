import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { BotLang } from './botText.ts';
import { text } from './botText.ts';
import { config } from './config.ts';
import { allProgress } from './store.ts';

/**
 * Evening streak reminders.
 * Once a day, after the reminder hour (Tashkent time by default), students whose streak is still alive
 * but who have not practised today get one friendly message with the button that opens the lesson.
 * Never after the quiet hour, never twice a day, never to students without a streak, and /reminders off stops it.
 */

export interface Streak {
  count: number;
  day: string; // YYYY-MM-DD in the student's local time
}
export interface ReminderState {
  last?: string; // day of the last reminder sent
  off?: true; // student turned reminders off
  blocked?: true; // Telegram says we cannot message this chat (bot blocked or chat gone)
}
export interface DueReminder {
  userId: number;
  lang: BotLang;
  streak: number;
}

export const QUIET_HOUR = 22;

/** Calendar day and hour in a time zone (default: Asia/Tashkent, UTC+5, no daylight saving). */
export function localClock(now: Date, timeZone: string): { day: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

export function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const langOf = (l: unknown): BotLang => (l === 'ru' || l === 'en' ? l : 'uz');

function streakOf(progress: unknown): Streak | null {
  const s = (progress as { acad?: { streak?: Streak } } | null)?.acad?.streak;
  return s && typeof s.count === 'number' && s.count > 0 && typeof s.day === 'string' ? s : null;
}

/** Pure decision: who should get a reminder right now. */
export function dueReminders(
  entries: Record<string, { progress: unknown }>,
  state: Record<string, ReminderState>,
  now: Date,
  opts: { hour: number; timeZone: string },
): DueReminder[] {
  const { day, hour } = localClock(now, opts.timeZone);
  if (hour < opts.hour || hour >= QUIET_HOUR) return [];
  const yesterday = previousDay(day);
  const due: DueReminder[] = [];
  for (const [id, entry] of Object.entries(entries)) {
    const userId = Number(id);
    if (!Number.isSafeInteger(userId) || userId <= 0) continue;
    const st = state[id] ?? {};
    if (st.off || st.blocked || st.last === day) continue;
    const s = streakOf(entry.progress);
    // Alive but at risk: the last practice day was yesterday. Practised today = nothing to protect; older = already broken.
    if (!s || s.day !== yesterday) continue;
    due.push({ userId, lang: langOf((entry.progress as { lang?: unknown }).lang), streak: s.count });
  }
  return due;
}

/* ---------- reminder state on disk (data/reminders.json) ---------- */

const file = () => path.join(config.dataDir, 'reminders.json');
let cache: Record<string, ReminderState> | null = null;

export function reminderState(): Record<string, ReminderState> {
  if (cache) return cache;
  try {
    cache = existsSync(file()) ? JSON.parse(readFileSync(file(), 'utf8')) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

function save() {
  try {
    mkdirSync(config.dataDir, { recursive: true });
    const tmp = `${file()}.tmp`;
    writeFileSync(tmp, JSON.stringify(reminderState()));
    renameSync(tmp, file());
  } catch (e) {
    console.warn('[reminders] could not save state:', (e as Error).message);
  }
}

export function setReminders(userId: number, on: boolean) {
  const st = reminderState();
  const cur = st[String(userId)] ?? {};
  if (on) {
    delete cur.off;
    delete cur.blocked; // they are talking to the bot again, so it can message them
  } else cur.off = true;
  st[String(userId)] = cur;
  save();
}

export const remindersOn = (userId: number) => !reminderState()[String(userId)]?.off;

/** The student's current streak for the /reminders test preview (falls back to a sample). */
export function streakForPreview(progress: unknown): number {
  return streakOf(progress)?.count ?? 3;
}

/* ---------- scheduler ---------- */

export interface ReminderSender {
  /** Sends the reminder with the Open button; throws a TelegramApiError-like error on failure. */
  sendReminder: (chatId: number, lang: BotLang, html: string, streak: number) => Promise<unknown>;
}

const CHECK_EVERY_MS = 10 * 60 * 1000;

export async function runReminders(sender: ReminderSender, now = new Date()): Promise<{ sent: number; failed: number }> {
  const state = reminderState();
  const { day } = localClock(now, config.reminderTimeZone);
  const due = dueReminders(allProgress(), state, now, { hour: config.reminderHour, timeZone: config.reminderTimeZone });
  let sent = 0;
  let failed = 0;
  for (const r of due) {
    try {
      await sender.sendReminder(r.userId, r.lang, text.reminder[r.lang](r.streak), r.streak);
      state[String(r.userId)] = { ...(state[String(r.userId)] ?? {}), last: day };
      sent++;
    } catch (e) {
      const code = (e as { code?: number }).code;
      if (code === 403 || code === 400) state[String(r.userId)] = { ...(state[String(r.userId)] ?? {}), blocked: true, last: day };
      failed++;
      if (code === 429) break; // rate limited: try the rest on the next check
    }
    await new Promise((res) => setTimeout(res, 60)); // stay far below Telegram's ~30 messages/second
  }
  if (due.length) save();
  return { sent, failed };
}

export function startReminders(sender: ReminderSender): () => void {
  if (!config.reminders) {
    console.log('[reminders] off (REMINDERS=false)');
    return () => undefined;
  }
  console.log(`[reminders] on: daily from ${String(config.reminderHour).padStart(2, '0')}:00 to ${QUIET_HOUR}:00 (${config.reminderTimeZone})`);
  const tick = () =>
    void runReminders(sender)
      .then(({ sent, failed }) => (sent || failed) && console.log(`[reminders] sent ${sent}, failed ${failed}`))
      .catch((e) => console.warn('[reminders] run failed:', (e as Error).message));
  tick();
  const timer = setInterval(tick, CHECK_EVERY_MS);
  timer.unref();
  return () => clearInterval(timer);
}
