import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { MAX_TEXT, TtsRequestError, VOICES, cacheKey, createTts, parseTtsRequest } from '../server/tts.ts';

const dir = () => mkdtempSync(path.join(os.tmpdir(), 'tts-test-'));
const fakeBin = () => { const p = path.join(dir(), 'edge-tts'); writeFileSync(p, ''); return p; };
const mp3 = Buffer.alloc(400, 7);

test('requests are checked and clipped', () => {
  assert.deepEqual(parseTtsRequest({ text: '  Hello   there ', lang: 'ru' }), { text: 'Hello there', lang: 'ru' });
  assert.equal(parseTtsRequest({ text: 'x', lang: 'fr' }).lang, 'en', 'an unknown language falls back to English');
  assert.equal(parseTtsRequest({ text: 'y'.repeat(5000) }).text.length, MAX_TEXT);
  assert.ok(!/[\u0000-\u001f]/.test(parseTtsRequest({ text: 'a\u0000b\nc' }).text));
  assert.throws(() => parseTtsRequest({ text: '   ' }), TtsRequestError);
  assert.throws(() => parseTtsRequest(null), TtsRequestError);
});

test('the same words with the same voice share one cache key; a different voice or text does not', () => {
  assert.equal(cacheKey(VOICES.en, 'hello'), cacheKey(VOICES.en, 'hello'));
  assert.notEqual(cacheKey(VOICES.en, 'hello'), cacheKey(VOICES.ru, 'hello'));
  assert.notEqual(cacheKey(VOICES.en, 'hello'), cacheKey(VOICES.en, 'hello!'));
});

test('a sentence is made once, then served from the cache', async () => {
  const calls: string[][] = [];
  const t = createTts({ bin: fakeBin(), dir: dir(), exec: async (_b, args) => { calls.push(args); writeFileSync(args.at(-1)!, mp3); } });
  const a = await t.speech('Good morning', 'en');
  const b = await t.speech('Good morning', 'en');
  assert.equal(a.length, 400);
  assert.deepEqual(a, b);
  assert.equal(calls.length, 1, 'the program ran once');
  assert.ok(calls[0]!.includes('--text=Good morning'), 'the text is one argument, never part of a shell line');
  assert.ok(calls[0]!.includes(VOICES.en));
});

test('text that looks like a program option or a shell command stays plain text', async () => {
  const seen: string[][] = [];
  const t = createTts({ bin: fakeBin(), dir: dir(), exec: async (_b, args) => { seen.push(args); writeFileSync(args.at(-1)!, mp3); } });
  await t.speech('--write-media /etc/passwd; rm -rf /', 'en');
  assert.ok(seen[0]!.includes('--text=--write-media /etc/passwd; rm -rf /'));
  assert.equal(seen[0]!.filter((a) => a.startsWith('--write-media')).length, 1, 'only our own --write-media is an option');
});

test('the same sentence asked twice at once is made once; at most a few are made at the same time', async () => {
  let live = 0, peak = 0, runs = 0;
  const t = createTts({ bin: fakeBin(), dir: dir(), concurrency: 2, exec: async (_b, args) => { runs++; live++; peak = Math.max(peak, live); await new Promise((r) => setTimeout(r, 25)); writeFileSync(args.at(-1)!, mp3); live--; } });
  await Promise.all([t.speech('same', 'en'), t.speech('same', 'en'), t.speech('one', 'en'), t.speech('two', 'en'), t.speech('three', 'en'), t.speech('four', 'en')]);
  assert.equal(runs, 5, 'five different sentences, "same" only once');
  assert.ok(peak <= 2, `at most 2 at a time (saw ${peak})`);
});

test('a voice that makes no sound is an error and leaves nothing behind', async () => {
  const d = dir();
  const t = createTts({ bin: fakeBin(), dir: d, exec: async (_b, args) => { writeFileSync(args.at(-1)!, Buffer.alloc(10)); } });
  await assert.rejects(t.speech('quiet', 'en'), /no sound/);
  assert.deepEqual(readdirSync(d), [], 'no half-made file stays in the cache');
});

test('the cache stays under its size limit', async () => {
  const d = dir();
  const t = createTts({ bin: fakeBin(), dir: d, maxBytes: 1500, exec: async (_b, args) => { writeFileSync(args.at(-1)!, mp3); } });
  for (let i = 0; i < 12; i++) await t.speech(`sentence ${i}`, 'en');
  assert.ok(readdirSync(d).length * 400 <= 1500 + 400, 'old sentences were removed');
});

test('a dropped connection is tried once more; two failures in a row are an error', async () => {
  let tries = 0;
  const flaky = createTts({ bin: fakeBin(), dir: dir(), retryMs: 1, exec: async (_b, args) => { tries++; if (tries === 1) throw new Error('connection reset'); writeFileSync(args.at(-1)!, mp3); } });
  assert.equal((await flaky.speech('again', 'en')).length, 400);
  assert.equal(tries, 2);
  let n = 0;
  const down = createTts({ bin: fakeBin(), dir: dir(), retryMs: 1, exec: async () => { n++; throw new Error('offline'); } });
  await assert.rejects(down.speech('never', 'en'), /offline/);
  assert.equal(n, 2, 'one retry, not an endless loop');
});

test('no program means no voice, and it says so', () => {
  assert.equal(createTts({ bin: '', dir: dir() }).available(), false);
  assert.equal(createTts({ bin: '/nope/edge-tts', dir: dir() }).available(), false);
  assert.equal(createTts({ bin: fakeBin(), dir: dir() }).available(), true);
});
