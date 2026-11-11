import type { Lang } from '../../shared/types.ts';
import type { TrackEvent } from '../lib/track.ts';
import { TOPICS } from '../screens/tutor/strings.ts';

/**
 * What the student has done, kept on this device only (localStorage): counts per day, seconds spent in lessons, and the topics
 * opened with how far they got. It feeds the numbers and charts on the student home page. Nothing is sent anywhere.
 */
export interface Day { lessons: number; questions: number; solved: number; games: number; secs: number }
export interface TopicRec { title: string; id?: string; n: number; pct: number; last: number }
export interface Activity { v: 1; days: Record<string, Day>; topics: Record<string, TopicRec> }

const KEY = 'smart-schools:student-activity:v1';
const KEEP_DAYS = 60;
const KEEP_TOPICS = 40;

export const emptyDay = (): Day => ({ lessons: 0, questions: 0, solved: 0, games: 0, secs: 0 });
export const emptyActivity = (): Activity => ({ v: 1, days: {}, topics: {} });

const two = (n: number) => String(n).padStart(2, '0');
/** The local calendar day, as 2026-11-11. */
export const dayKey = (d: Date): string => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;

/**
 * One key for one topic, however it was started: a prepared lesson by its id, a suggested topic by its English name
 * (so "Photosynthesis" and "Фотосинтез" are the same topic), anything typed by its own words.
 */
export function topicKey(text: string, id?: string): string {
  if (id) return `s:${id}`;
  const t = text.trim().toLowerCase();
  const hit = TOPICS.find((x) => Object.values(x.label).some((l) => l.toLowerCase() === t));
  if (hit) return hit.id ? `s:${hit.id}` : `t:${hit.label.en.toLowerCase()}`;
  return `q:${t.slice(0, 80)}`;
}

function trim(a: Activity): Activity {
  const dayKeys = Object.keys(a.days).sort();
  let days = a.days;
  if (dayKeys.length > KEEP_DAYS) days = Object.fromEntries(dayKeys.slice(-KEEP_DAYS).map((k) => [k, a.days[k]!]));
  const tk = Object.keys(a.topics);
  let topics = a.topics;
  if (tk.length > KEEP_TOPICS) topics = Object.fromEntries(tk.sort((x, y) => a.topics[y]!.last - a.topics[x]!.last).slice(0, KEEP_TOPICS).map((k) => [k, a.topics[k]!]));
  return days === a.days && topics === a.topics ? a : { ...a, days, topics };
}

/** Records one thing that happened. Returns a new object. */
export function apply(a: Activity, e: TrackEvent, now: Date = new Date()): Activity {
  const k = dayKey(now);
  const day = { ...(a.days[k] ?? emptyDay()) };
  let topics = a.topics;
  if (e.kind === 'lesson') {
    day.lessons++;
    const key = topicKey(e.topic, e.id);
    const old = topics[key];
    topics = { ...topics, [key]: { title: e.topic.trim().slice(0, 80), id: e.id ?? old?.id, n: (old?.n ?? 0) + 1, pct: old?.pct ?? 0, last: now.getTime() } };
  } else if (e.kind === 'question') day.questions++;
  else if (e.kind === 'solved') day.solved++;
  else if (e.kind === 'game') day.games++;
  else if (e.kind === 'progress') {
    const key = topicKey(e.topic, e.id);
    const old = topics[key];
    const pct = Math.max(0, Math.min(100, Math.round(e.pct)));
    if (!old || pct <= old.pct) return a;
    topics = { ...topics, [key]: { ...old, pct } };
    return trim({ ...a, topics });
  }
  return trim({ ...a, days: { ...a.days, [k]: day }, topics });
}

/** Adds time spent in lessons (seconds) to today. */
export function addSecs(a: Activity, secs: number, now: Date = new Date()): Activity {
  const k = dayKey(now);
  const day = { ...(a.days[k] ?? emptyDay()), };
  day.secs += secs;
  return trim({ ...a, days: { ...a.days, [k]: day } });
}

/** The last n days, oldest first, today last. Days with nothing done are zeros. */
export function lastDays(a: Activity, n = 7, now: Date = new Date()): { key: string; date: Date; day: Day }[] {
  const out: { key: string; date: Date; day: Day }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12);
    const key = dayKey(date);
    out.push({ key, date, day: a.days[key] ?? emptyDay() });
  }
  return out;
}

export interface TopicRow { key: string; title: string; id?: string; pct: number; n: number; suggested: boolean }

/** Up to n rows: the topics the student opened (latest first), then suggestions to fill the table. */
export function topicRows(a: Activity, lang: Lang, aiOn: boolean, n = 4): TopicRow[] {
  const rows: TopicRow[] = Object.entries(a.topics)
    .sort((x, y) => y[1].last - x[1].last)
    .slice(0, n)
    .map(([key, t]) => ({ key, title: t.title, id: t.id, pct: t.pct, n: t.n, suggested: false }));
  for (const t of TOPICS) {
    if (rows.length >= n) break;
    if (t.ai && !aiOn) continue;
    const key = topicKey(t.label.en, t.id);
    if (rows.some((r) => r.key === key)) continue;
    rows.push({ key, title: t.label[lang], id: t.id, pct: 0, n: 0, suggested: true });
  }
  return rows;
}

/** The topic opened last, to continue with. */
export function lastTopic(a: Activity): TopicRec | undefined {
  return Object.values(a.topics).sort((x, y) => y.last - x.last)[0];
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);

function clean(raw: unknown): Activity {
  const out = emptyActivity();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Partial<Activity>;
  for (const [k, d] of Object.entries(r.days ?? {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !d || typeof d !== 'object') continue;
    const x = d as Partial<Day>;
    out.days[k] = { lessons: num(x.lessons), questions: num(x.questions), solved: num(x.solved), games: num(x.games), secs: num(x.secs) };
  }
  for (const [k, t] of Object.entries(r.topics ?? {})) {
    if (!t || typeof t !== 'object' || typeof (t as TopicRec).title !== 'string') continue;
    const x = t as Partial<TopicRec>;
    out.topics[k.slice(0, 100)] = { title: x.title!.slice(0, 80), id: typeof x.id === 'string' ? x.id.slice(0, 40) : undefined, n: num(x.n), pct: Math.min(100, num(x.pct)), last: num(x.last) };
  }
  return trim(out);
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;
const browserStore = (): Store | null => { try { return window.localStorage; } catch { return null; } };

export function load(store: Store | null = browserStore()): Activity {
  try {
    const raw = store?.getItem(KEY);
    return raw ? clean(JSON.parse(raw)) : emptyActivity();
  } catch {
    return emptyActivity();
  }
}

export function save(a: Activity, store: Store | null = browserStore()): void {
  try { store?.setItem(KEY, JSON.stringify(a)); } catch { /* private mode or full: the numbers just will not survive a reload */ }
}
