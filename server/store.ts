import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.ts';

/**
 * Minimal JSON-file store for demo progress, keyed by a *validated* Telegram user id.
 * Stores learning progress plus a short first name for the teacher's homework report (no surnames,
 * usernames or messages). Suitable for a single-instance prototype.
 */
interface Entry {
  progress: unknown;
  updatedAt: number;
  /** Short display name from validated initData (first_name only). */
  name?: string;
}

const MAX_BYTES = 32 * 1024;
const file = path.join(config.dataDir, 'progress.json');
let cache: Record<string, Entry> | null = null;
let writeTimer: NodeJS.Timeout | null = null;

function load(): Record<string, Entry> {
  if (cache) return cache;
  try {
    cache = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  } catch {
    console.warn('[store] progress file unreadable, starting empty');
    cache = {};
  }
  return cache!;
}

function flush() {
  writeTimer = null;
  try {
    mkdirSync(config.dataDir, { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(load()));
    renameSync(tmp, file);
  } catch (e) {
    console.warn('[store] could not save progress:', (e as Error).message);
  }
}

export function getProgress(userId: number): Entry | null {
  return load()[String(userId)] ?? null;
}

export function putProgress(userId: number, progress: unknown, updatedAt: number, name?: string | null): Entry | 'too-large' | 'invalid' {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return 'invalid';
  if (Buffer.byteLength(JSON.stringify(progress)) > MAX_BYTES) return 'too-large';
  const entry: Entry = { progress, updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now() };
  if (name) entry.name = name;
  load()[String(userId)] = entry;
  if (!writeTimer) writeTimer = setTimeout(flush, 500);
  return entry;
}

/** Every saved progress entry, keyed by Telegram user id (evening reminders, teacher report). */
export function allProgress(): Record<string, Entry> {
  return load();
}

export function flushStore() {
  if (writeTimer) {
    clearTimeout(writeTimer);
    flush();
  }
}
