/**
 * A voice made on the server, so a student hears the lesson everywhere, even where the browser has no voices of its own
 * (Telegram's built-in browser often has none, and almost no browser has an Uzbek voice).
 *
 * Each sentence is turned into an MP3 with the `edge-tts` program (Microsoft's neural voices, free: the text is sent to
 * Microsoft's text-to-speech service, so only lesson sentences go through here, never names or accounts). Finished sentences are
 * kept on disk by a hash of the voice and the words, so a sentence that has been said once is instant the next time, and the
 * prepared lessons are served from the cache almost entirely. At most a few run at once, and the cache has a size limit.
 *
 * The program is run with an argument list, never through a shell, so the text cannot run anything.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { config } from './config.ts';

export type TtsLang = 'en' | 'ru' | 'uz';
export const VOICES: Record<TtsLang, string> = { en: 'en-US-JennyNeural', ru: 'ru-RU-SvetlanaNeural', uz: 'uz-UZ-MadinaNeural' };
export const MAX_TEXT = 320;

export class TtsRequestError extends Error {}

export function parseTtsRequest(body: unknown): { text: string; lang: TtsLang } {
  if (!body || typeof body !== 'object') throw new TtsRequestError('bad request');
  const b = body as Record<string, unknown>;
  const text = typeof b.text === 'string' ? b.text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT) : '';
  if (text.length < 1) throw new TtsRequestError('nothing to say');
  const lang: TtsLang = b.lang === 'ru' || b.lang === 'uz' ? b.lang : 'en';
  return { text, lang };
}

export const cacheKey = (voice: string, text: string): string => createHash('sha1').update(`${voice}\n${text}`).digest('hex');

export interface TtsOptions {
  /** Path of the edge-tts program ('' = no voice on this server). */
  bin: string;
  dir: string;
  maxBytes?: number;
  concurrency?: number;
  /** Pause before the second try, in milliseconds. */
  retryMs?: number;
  /** Runs the program (a parameter so tests do not need it). Must write the MP3 to `out`. */
  exec?: (bin: string, args: string[], timeoutMs: number) => Promise<void>;
}

const runProgram = (bin: string, args: string[], timeoutMs: number) =>
  new Promise<void>((resolve, reject) => {
    execFile(bin, args, { timeout: timeoutMs, windowsHide: true }, (err) => (err ? reject(err) : resolve()));
  });

export function createTts(o: TtsOptions) {
  const exec = o.exec ?? runProgram;
  const limit = o.concurrency ?? 3;
  const maxBytes = o.maxBytes ?? 200 * 1024 * 1024;
  let running = 0;
  const waiting: (() => void)[] = [];
  const inflight = new Map<string, Promise<Buffer>>();

  const available = () => o.bin !== '' && existsSync(o.bin);

  const slot = async <T>(job: () => Promise<T>): Promise<T> => {
    if (running >= limit) await new Promise<void>((r) => waiting.push(r));
    running++;
    try { return await job(); } finally { running--; waiting.shift()?.(); }
  };

  /** Keeps the cache under its size limit by deleting the oldest files. */
  function prune() {
    try {
      const files = readdirSync(o.dir).map((f) => { const p = path.join(o.dir, f); const s = statSync(p); return { p, size: s.size, t: s.mtimeMs }; });
      let total = files.reduce((a, f) => a + f.size, 0);
      for (const f of files.sort((a, b) => a.t - b.t)) {
        if (total <= maxBytes * 0.8) break;
        unlinkSync(f.p);
        total -= f.size;
      }
    } catch { /* the cache is only a speed-up */ }
  }

  /** The MP3 for one sentence: from the cache, or made now. */
  async function speech(text: string, lang: TtsLang): Promise<Buffer> {
    const voice = VOICES[lang];
    const key = cacheKey(voice, text);
    const file = path.join(o.dir, `${key}.mp3`);
    try { if (existsSync(file)) return readFileSync(file); } catch { /* fall through and make it again */ }
    const running = inflight.get(key);
    if (running) return running; // the same sentence asked twice at once is made once
    const job = slot(async () => {
      mkdirSync(o.dir, { recursive: true });
      const tmp = path.join(o.dir, `${key}.${process.pid}.${Date.now()}.tmp`);
      try {
        const args = ['--voice', voice, `--text=${text}`, '--rate=-4%', '--write-media', tmp];
        // Microsoft's free service now and then drops a connection: one more try before giving up
        try { await exec(o.bin, args, 25_000); } catch { await new Promise((r) => setTimeout(r, o.retryMs ?? 400)); await exec(o.bin, args, 25_000); }
        const bytes = readFileSync(tmp);
        if (bytes.length < 200) throw new Error('the voice made no sound');
        writeFileSync(file, bytes);
        prune();
        return bytes;
      } finally {
        try { unlinkSync(tmp); } catch { /* it was never made */ }
      }
    }).finally(() => inflight.delete(key));
    inflight.set(key, job);
    return job;
  }

  return { available, speech };
}

/** Where to look for the program: TTS_BIN, a virtual environment next to the app, or the usual places. */
function findBin(): string {
  const candidates = [process.env.TTS_BIN ?? '', path.resolve(process.cwd(), 'tts-venv/bin/edge-tts'), '/usr/local/bin/edge-tts', path.join(os.homedir(), '.local/bin/edge-tts')].filter(Boolean);
  return candidates.find((c) => existsSync(c)) ?? '';
}

/** The sentences of the prepared lessons, so they are made once at start-up and are instant for every student after. */
export async function warmPrepared(sentences: string[], lang: TtsLang = 'en'): Promise<number> {
  let made = 0;
  for (const s of sentences) {
    if (!tts.available()) break;
    try { await tts.speech(s.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT), lang); made++; } catch { /* a missed one is made when somebody asks for it */ }
  }
  return made;
}

export const tts = createTts({ bin: process.env.TTS_DISABLED === 'true' ? '' : findBin(), dir: path.join(config.dataDir, 'tts') });
export const ttsAvailable = (): boolean => tts.available();
