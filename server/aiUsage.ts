import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.ts';

/**
 * How many AI questions each student has used today (data/ai-usage.json): one day and a count per Telegram id,
 * never the text of a question. A new day replaces the whole file, so no history builds up.
 *
 * Kept apart from the student's progress on purpose: the Mini App can overwrite progress, and a student
 * must not be able to refill their own allowance. Saved at once, so a server restart does not refill it either.
 */
interface Usage {
  day: string;
  counts: Record<string, number>;
}

const file = () => path.join(config.dataDir, 'ai-usage.json');
let cache: Usage | null = null;

function load(): Usage {
  if (cache) return cache;
  try {
    cache = existsSync(file()) ? (JSON.parse(readFileSync(file(), 'utf8')) as Usage) : { day: '', counts: {} };
  } catch {
    console.warn('[ai usage] file unreadable, starting empty');
    cache = { day: '', counts: {} };
  }
  return cache;
}

function save(usage: Usage) {
  try {
    mkdirSync(config.dataDir, { recursive: true });
    const tmp = `${file()}.tmp`;
    writeFileSync(tmp, JSON.stringify(usage));
    renameSync(tmp, file());
  } catch (e) {
    console.warn('[ai usage] could not save:', (e as Error).message);
  }
}

/**
 * Takes one question from the student's allowance for this day; false when it is used up.
 * Counted before the call, and not given back when a call fails: a call that times out or
 * that the guard rejects may still be billed.
 */
export function takeAiQuestion(userId: number, day: string, limit: number): boolean {
  return takeAiCredit(String(userId), day, limit);
}

/** The same allowance for any key: "u:123" (a Telegram user), "ip:..." (a visitor), "g:lesson" (everybody together). */
export function takeAiCredit(key: string, day: string, limit: number): boolean {
  const usage = load();
  if (usage.day !== day) {
    usage.day = day;
    usage.counts = {};
  }
  const used = usage.counts[key] ?? 0;
  if (used >= limit) return false;
  usage.counts[key] = used + 1;
  save(usage);
  return true;
}
