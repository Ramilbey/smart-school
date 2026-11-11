import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** Reads a JSON file; a missing or unreadable file gives the fallback (the prototype never crashes on bad data). */
export function readJsonFile<T>(file: string, fallback: T): T {
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : fallback;
  } catch {
    console.warn(`[store] ${path.basename(file)} is unreadable, starting empty`);
    return fallback;
  }
}

/** Writes through a temporary file so a crash never leaves half a file. */
export function writeJsonAtomic(file: string, data: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data));
  renameSync(tmp, file);
}
