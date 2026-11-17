import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clean, prompt, transcribe } from '../server/transcribe.ts';
import { downsample, encodeWav, looksLikeWav, peak } from '../shared/wav.ts';

test('a recording becomes a small 16 kHz mono WAV', () => {
  const second = new Float32Array(48_000).map((_, i) => Math.sin(i / 10) * 0.5);
  const s = downsample([second.subarray(0, 24_000), second.subarray(24_000)], 48_000);
  assert.equal(s.length, 16_000, 'one second at 16 kHz');
  const wav = encodeWav(s);
  assert.equal(wav.length, 44 + 32_000);
  assert.ok(looksLikeWav(wav));
  const v = new DataView(wav.buffer);
  assert.equal(v.getUint16(22, true), 1, 'mono');
  assert.equal(v.getUint32(24, true), 16_000, '16 kHz');
  assert.equal(v.getUint16(34, true), 16, '16-bit');
  assert.ok(peak(s) > 0.3 && peak(new Float32Array(10)) === 0);
  assert.ok(!looksLikeWav(new Uint8Array(100)));
});

test('the model’s reply is cleaned: quotes and labels go, "no speech" becomes empty', () => {
  assert.equal(clean('  "What is a fraction?"  '), 'What is a fraction?');
  assert.equal(clean('«Что такое дробь?»'), 'Что такое дробь?');
  assert.equal(clean('Transcript: Kasr nima?'), 'Kasr nima?');
  assert.equal(clean('[no speech]'), '');
  assert.equal(clean('Silence.'), '');
  assert.ok(prompt('uz').includes('Uzbek') && prompt('uz').includes('Latin'));
});

test('transcribe sends the WAV to Gemini, skips a key that is out of quota, and returns the words', async () => {
  const calls: { key: string; body: { contents: { parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[]; generationConfig: { thinkingConfig?: unknown } } }[] = [];
  const fake = (async (_url: string, init: RequestInit) => {
    const key = (init.headers as Record<string, string>)['x-goog-api-key']!;
    calls.push({ key, body: JSON.parse(String(init.body)) });
    if (key === 'k1') return new Response('quota', { status: 429 });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'thinking…', thought: true }, { text: '"Pifagor teoremasi nima?"' }] } }] }), { status: 200 });
  }) as typeof fetch;
  const text = await transcribe({ keys: ['k1', 'k2'], models: ['m1'], thinking: 'minimal', fetchImpl: fake }, 'UklGRg==', 'uz');
  assert.equal(text, 'Pifagor teoremasi nima?');
  assert.deepEqual(calls.map((c) => c.key), ['k1', 'k2']);
  const part = calls[1]!.body.contents[0]!.parts[1]!;
  assert.equal(part.inlineData?.mimeType, 'audio/wav');
  assert.equal(part.inlineData?.data, 'UklGRg==');
  assert.ok(calls[1]!.body.contents[0]!.parts[0]!.text!.includes('Uzbek'));
});

test('a model that refuses the thinking setting is asked again without it; a total failure throws', async () => {
  let n = 0;
  const fake = (async (_url: string, init: RequestInit) => {
    n++;
    const body = JSON.parse(String(init.body)) as { generationConfig: { thinkingConfig?: unknown } };
    if (body.generationConfig.thinkingConfig) return new Response('thinking is not supported', { status: 400 });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hello' }] } }] }), { status: 200 });
  }) as typeof fetch;
  assert.equal(await transcribe({ keys: ['k'], models: ['m'], thinking: 'minimal', fetchImpl: fake }, 'x', 'en'), 'Hello');
  assert.equal(n, 2);
  const down = (async () => new Response('busy', { status: 503 })) as typeof fetch;
  await assert.rejects(() => transcribe({ keys: ['a', 'b'], models: ['m1', 'm2'], thinking: '', fetchImpl: down }, 'x', 'en'), /every key and model failed/);
});
