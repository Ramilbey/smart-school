import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'ss-chat-gemini-'));
process.env.ANTHROPIC_API_KEY = '';

const { chatTutorWith } = await import('../server/tutor.ts');
const { streamerComplete } = await import('../server/chatGemini.ts');
type Streamer = import('../server/boardAi.ts').Streamer;
const DAY = '2026-11-11';
const ask = (userId: number, question = 'Why is the sky blue?') => ({ userId, question, lang: 'en' as const, grade: 7, day: DAY });

const model = (...texts: string[]) => {
  const calls: { system: string; user: string }[] = [];
  const streamer: Streamer = async function* (p) { calls.push({ system: p.system, user: p.user }); yield texts[Math.min(calls.length - 1, texts.length - 1)]!; };
  return { streamer, calls };
};

test('the chat tutor answers over Gemini with the same prompt and tags', async () => {
  const m = model('Light from the sun is scattered by the air, and blue light scatters the most.');
  const a = await chatTutorWith(streamerComplete(m.streamer), 5)(ask(7001));
  assert.deepEqual(a, { kind: 'reply', text: 'Light from the sun is scattered by the air, and blue light scatters the most.' });
  assert.match(m.calls[0]!.system, /Telegram chat/);
  assert.match(m.calls[0]!.user, /<question>Why is the sky blue\?<\/question>/);
});
test('markdown markers go, and a lone star in maths stays', async () => {
  const m = model('**Remember**: 2*3 is six, so the area is six squares.');
  const a = await chatTutorWith(streamerComplete(m.streamer), 5)(ask(7002, 'What is area?'));
  assert.equal(a.kind === 'reply' && a.text, 'Remember: 2*3 is six, so the area is six squares.');
});
test('a reply that is too long, empty or fails is "none", and the allowance is still spent', async () => {
  const long = chatTutorWith(streamerComplete(model('x '.repeat(400)).streamer), 5);
  assert.deepEqual(await long(ask(7003)), { kind: 'none' });
  const empty = chatTutorWith(streamerComplete(model('   ').streamer), 5);
  assert.deepEqual(await empty(ask(7004)), { kind: 'none' });
  const down = chatTutorWith(streamerComplete((async function* () { throw new Error('503'); }) as Streamer), 1);
  const before = console.warn; console.warn = () => undefined;
  try {
    assert.deepEqual(await down(ask(7005)), { kind: 'none' });
    assert.deepEqual(await down(ask(7005)), { kind: 'limit' }, 'a failed call may be billed, so it counts');
  } finally { console.warn = before; }
});
test('a model that never answers is given up on', async () => {
  const hang: Streamer = async function* ({ signal }) { await new Promise((_r, rej) => signal?.addEventListener('abort', () => rej(new Error('aborted')))); yield ''; };
  const before = console.warn; console.warn = () => undefined;
  try {
    assert.deepEqual(await chatTutorWith(streamerComplete(hang), 5, 30)(ask(7006)), { kind: 'none' });
  } finally { console.warn = before; }
});
test('it still refuses to hand out homework answers, and keeps the daily limit', async () => {
  const m = model('The answer is 14, because 2 times 7 is 14.');
  const t = chatTutorWith(streamerComplete(m.streamer), 2);
  const homework = { ...ask(7007, 'Solve: 2 times 7 = ?') };
  assert.deepEqual(await t(homework), { kind: 'none' }, 'the guard rejects a reply that gives the result');
  const fine = model('Light is scattered by the air.');
  const t2 = chatTutorWith(streamerComplete(fine.streamer), 1);
  assert.equal((await t2(ask(7008))).kind, 'reply');
  assert.deepEqual(await t2(ask(7008)), { kind: 'limit' });
  assert.deepEqual(await chatTutorWith(streamerComplete(fine.streamer), 0)(ask(7009)), { kind: 'none' }, 'off at zero');
});
