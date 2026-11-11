import assert from 'node:assert/strict';
import test from 'node:test';
import { geminiStreamer } from '../server/gemini.ts';

/** Server-sent events as Google sends them, cut into the given pieces. */
const sse = (events: unknown[], cuts: number[] = []): Response => {
  const text = events.map((e) => `data: ${JSON.stringify(e)}\r\n\r\n`).join('');
  const pieces: string[] = [];
  let at = 0;
  for (const c of [...cuts, text.length]) { pieces.push(text.slice(at, c)); at = c; }
  const enc = new TextEncoder();
  return new Response(new ReadableStream({ start(ctl) { for (const p of pieces) ctl.enqueue(enc.encode(p)); ctl.close(); } }), { status: 200, headers: { 'content-type': 'text/event-stream' } });
};
const part = (text: string, thought = false) => ({ candidates: [{ content: { parts: [{ text, ...(thought ? { thought: true } : {}) }] } }] });
const run = async (s: ReturnType<typeof geminiStreamer>) => { let out = ''; for await (const t of s({ system: 'sys', user: 'hi', maxTokens: 100 })) out += t; return out; };

test('the text comes through in order, however the events are cut, and private thoughts are skipped', async () => {
  const events = [part('{"say":"He'), part('llo"}\n'), part('secret reasoning', true), part('{"say":"Bye"}\n')];
  const total = events.map((e) => `data: ${JSON.stringify(e)}\r\n\r\n`).join('').length;
  const s = geminiStreamer({ keys: ['k1'], model: 'm', thinking: 'minimal', fetchImpl: (async () => sse(events, [7, 40, Math.floor(total / 2)])) as typeof fetch });
  assert.equal(await run(s), '{"say":"Hello"}\n{"say":"Bye"}\n');
});

test('the request: key in a header (never in the address), system prompt and thinking level', async () => {
  const seen: { url: string; headers: Record<string, string>; body: any }[] = [];
  const f = (async (url: string, init: RequestInit) => { seen.push({ url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) }); return sse([part('ok')]); }) as unknown as typeof fetch;
  await run(geminiStreamer({ keys: ['SECRET-KEY'], model: 'gemini-x', thinking: 'minimal', fetchImpl: f, baseUrl: 'https://example.test/v1beta' }));
  assert.equal(seen[0]!.url, 'https://example.test/v1beta/models/gemini-x:streamGenerateContent?alt=sse');
  assert.ok(!seen[0]!.url.includes('SECRET-KEY'), 'the key is not in the address');
  assert.equal(seen[0]!.headers['x-goog-api-key'], 'SECRET-KEY');
  assert.equal(seen[0]!.body.systemInstruction.parts[0].text, 'sys');
  assert.equal(seen[0]!.body.generationConfig.thinkingConfig.thinkingLevel, 'minimal');
});

test('a key that is out of quota hands over to the next one, which is then tried first', async () => {
  const used: string[] = [];
  const f = (async (_u: string, init: RequestInit) => {
    const key = (init.headers as Record<string, string>)['x-goog-api-key']!;
    used.push(key);
    return key === 'A' ? new Response('{"error":{"status":"RESOURCE_EXHAUSTED"}}', { status: 429 }) : sse([part('fine')]);
  }) as unknown as typeof fetch;
  const s = geminiStreamer({ keys: ['A', 'B', 'C'], model: 'm', thinking: '', fetchImpl: f });
  assert.equal(await run(s), 'fine');
  assert.deepEqual(used, ['A', 'B']);
  used.length = 0;
  await run(s);
  assert.deepEqual(used, ['B'], 'the key that worked goes first next time');
});

test('when every key fails, the error says so and never contains a key', async () => {
  const s = geminiStreamer({ keys: ['KEY-ONE', 'KEY-TWO'], model: 'm', thinking: '', fetchImpl: (async () => new Response('quota', { status: 429 })) as typeof fetch });
  await assert.rejects(run(s), (e: Error) => /every key and model failed/.test(e.message) && !/KEY-/.test(e.message));
  const down = geminiStreamer({ keys: ['K'], model: 'm', thinking: '', fetchImpl: (async () => { throw new Error('ECONNRESET'); }) as typeof fetch });
  await assert.rejects(run(down), /not reachable/);
});

test('a model that does not take the thinking setting is asked again without it', async () => {
  const bodies: any[] = [];
  const f = (async (_u: string, init: RequestInit) => {
    const b = JSON.parse(init.body as string);
    bodies.push(b);
    return b.generationConfig.thinkingConfig ? new Response('{"error":{"message":"thinking level not supported"}}', { status: 400 }) : sse([part('ok')]);
  }) as unknown as typeof fetch;
  const s = geminiStreamer({ keys: ['K'], model: 'm', thinking: 'minimal', fetchImpl: f });
  assert.equal(await run(s), 'ok');
  assert.equal(bodies.length, 2);
  assert.equal(bodies[1].generationConfig.thinkingConfig, undefined);
  bodies.length = 0;
  await run(s);
  assert.equal(bodies.length, 1, 'and it remembers');
});

test('an answer that Google blocked is an error, not an empty board', async () => {
  const blocked = geminiStreamer({ keys: ['K'], model: 'm', thinking: '', fetchImpl: (async () => sse([{ promptFeedback: { blockReason: 'SAFETY' } }])) as typeof fetch });
  await assert.rejects(run(blocked), /blocked/);
});

const modelOf = (u: string) => /models\/([^:]+):/.exec(u)![1]!;

test('when the first model is overloaded, the next model answers, and the first is left alone for a minute', async () => {
  const used: string[] = [];
  let clock = 1_000_000;
  const f = (async (u: string) => { const m = modelOf(u); used.push(m); return m === 'big' ? new Response('{"error":{"status":"UNAVAILABLE"}}', { status: 503 }) : sse([part('from ' + m)]); }) as unknown as typeof fetch;
  const s = geminiStreamer({ keys: ['K'], model: 'big', fallbackModels: ['small'], thinking: '', fetchImpl: f, now: () => clock });
  assert.equal(await run(s), 'from small');
  assert.deepEqual(used, ['big', 'small']);
  used.length = 0;
  assert.equal(await run(s), 'from small');
  assert.deepEqual(used, ['small'], 'the overloaded model is skipped while it rests');
  used.length = 0;
  clock += 61_000;
  await run(s);
  assert.deepEqual(used, ['big', 'small'], 'and tried again after the rest');
});

test('a model that does not exist for us is skipped without trying its other keys', async () => {
  const used: string[] = [];
  const f = (async (u: string) => { used.push(modelOf(u)); return modelOf(u) === 'old' ? new Response('{"error":{"status":"NOT_FOUND"}}', { status: 404 }) : sse([part('ok')]); }) as unknown as typeof fetch;
  const s = geminiStreamer({ keys: ['A', 'B', 'C'], model: 'old', fallbackModels: ['new'], thinking: '', fetchImpl: f });
  assert.equal(await run(s), 'ok');
  assert.deepEqual(used, ['old', 'new']);
});

test('a model that stays silent is given up on after the wait, and the next one is tried', async () => {
  const f = ((u: string, init: RequestInit) => {
    if (modelOf(u) !== 'quiet') return Promise.resolve(sse([part('spoke')]));
    return new Promise<Response>((_res, rej) => init.signal!.addEventListener('abort', () => rej(new Error('aborted')), { once: true }));
  }) as unknown as typeof fetch;
  const s = geminiStreamer({ keys: ['K'], model: 'quiet', fallbackModels: ['loud'], thinking: '', fetchImpl: f, firstByteMs: 30 });
  assert.equal(await run(s), 'spoke');
});

test('the caller leaving still stops everything at once', async () => {
  const ctl = new AbortController();
  const f = ((_u: string, init: RequestInit) => new Promise<Response>((_r, rej) => init.signal!.addEventListener('abort', () => rej(new Error('aborted')), { once: true }))) as unknown as typeof fetch;
  const s = geminiStreamer({ keys: ['K'], model: 'a', fallbackModels: ['b'], thinking: '', fetchImpl: f, firstByteMs: 10_000 });
  setTimeout(() => ctl.abort(), 20);
  await assert.rejects(async () => { for await (const _ of s({ system: 's', user: 'u', maxTokens: 10, signal: ctl.signal })) void _; }, /aborted/);
});

test('the thinking setting is remembered per model', async () => {
  const bodies: { m: string; thinking: boolean }[] = [];
  const f = (async (u: string, init: RequestInit) => {
    const b = JSON.parse(init.body as string);
    bodies.push({ m: modelOf(u), thinking: !!b.generationConfig.thinkingConfig });
    return b.generationConfig.thinkingConfig && modelOf(u) === 'picky' ? new Response('{"error":{"message":"thinking level not supported"}}', { status: 400 }) : sse([part('ok')]);
  }) as unknown as typeof fetch;
  const s = geminiStreamer({ keys: ['K'], model: 'picky', thinking: 'minimal', fetchImpl: f });
  await run(s);
  await run(s);
  assert.deepEqual(bodies, [{ m: 'picky', thinking: true }, { m: 'picky', thinking: false }, { m: 'picky', thinking: false }]);
});
