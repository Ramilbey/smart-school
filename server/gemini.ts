/**
 * Google Gemini as the whiteboard's AI (a second provider next to Claude), through its plain HTTP API: no extra dependency.
 *
 * It fits the same Streamer shape as the Claude one: it takes a system prompt and a user message and yields the text as it is
 * written. Several keys can be given; if one is out of free quota (or Google has a hiccup) the next one is tried, and the key that
 * worked is tried first next time. If a whole model is overloaded (HTTP 503), the next model on the list takes over, and the
 * overloaded one is left alone for a minute. A key is only ever sent to Google in a header: it is never logged or put in an error message.
 */
import type { Streamer, StreamParams } from './boardAi.ts';

export interface GeminiOptions {
  keys: string[];
  model: string;
  /** "minimal", "low", "medium" or "high": how much the model thinks before it writes. Minimal is the fastest. Empty = leave it to Google. */
  thinking: string;
  /** Other models to fall back on when the first is overloaded (Google's newest models often answer "503, high demand"). */
  fallbackModels?: string[];
  /** How long to wait for Google to start answering before trying the next key or model. */
  firstByteMs?: number;
  now?: () => number;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** The text pieces in one server-sent event, skipping the model's private "thought" parts. Throws when Google blocked the answer. */
function textOf(data: unknown): string {
  const d = data as {
    promptFeedback?: { blockReason?: string };
    candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  };
  if (d.promptFeedback?.blockReason) throw new Error(`blocked (${d.promptFeedback.blockReason})`);
  const c = d.candidates?.[0];
  let out = '';
  for (const p of c?.content?.parts ?? []) if (typeof p.text === 'string' && !p.thought) out += p.text;
  if (!out && (c?.finishReason === 'SAFETY' || c?.finishReason === 'PROHIBITED_CONTENT' || c?.finishReason === 'RECITATION')) throw new Error(`blocked (${c.finishReason})`);
  return out;
}

/** The "data:" events of a server-sent-events body, however the bytes were cut. */
async function* events(body: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const flush = function* (final: boolean): Generator<unknown> {
    let i: number;
    while ((i = buf.search(/\r?\n\r?\n/)) >= 0 || (final && buf.trim())) {
      const block = i >= 0 ? buf.slice(0, i) : buf;
      buf = i >= 0 ? buf.slice(i).replace(/^\r?\n\r?\n/, '') : '';
      const data = block.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n');
      if (data && data !== '[DONE]') { try { yield JSON.parse(data); } catch { /* a broken event is skipped */ } }
      if (i < 0) break;
    }
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    yield* flush(false);
  }
  yield* flush(true);
}

export function geminiStreamer(o: GeminiOptions): Streamer {
  const f = o.fetchImpl ?? fetch;
  const base = o.baseUrl ?? BASE;
  const now = o.now ?? Date.now;
  const firstByteMs = o.firstByteMs ?? 15_000;
  const models = [o.model, ...(o.fallbackModels ?? [])].filter((m, i, all) => m && all.indexOf(m) === i);
  const coolUntil = new Map<string, number>(); // a model that failed is left alone for a while: the next ones are tried first
  const noThinking = new Set<string>(); // models that refused the thinking setting
  const goodKey = new Map<string, number>(); // per model, the key that worked last
  return async function* ({ system, user, maxTokens, signal }: StreamParams) {
    let lastStatus = 0;
    const t = now();
    const order = [...models.filter((m) => (coolUntil.get(m) ?? 0) <= t), ...models.filter((m) => (coolUntil.get(m) ?? 0) > t)];
    for (const model of order) {
      let gone = false; // this model does not exist for us: no point trying its other keys
      const first = goodKey.get(model) ?? 0;
      for (let n = 0; n < o.keys.length && !gone; n++) {
        const i = (first + n) % o.keys.length;
        for (let attempt = 0; attempt < 2; attempt++) {
          const thinking = o.thinking !== '' && !noThinking.has(model);
          const body = {
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5, ...(thinking ? { thinkingConfig: { thinkingLevel: o.thinking } } : {}) },
          };
          // a model that does not answer at all must not eat the whole lesson's time: give up on it after a few seconds
          const wait = new AbortController();
          const timer = setTimeout(() => wait.abort(), firstByteMs);
          let res: Response;
          try {
            res = await f(`${base}/models/${model}:streamGenerateContent?alt=sse`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': o.keys[i]! }, body: JSON.stringify(body), signal: signal ? AbortSignal.any([signal, wait.signal]) : wait.signal });
          } catch (e) {
            if (signal?.aborted) throw e;
            lastStatus = 0;
            break; // a network failure or silence: try the next key
          } finally {
            clearTimeout(timer);
          }
          lastStatus = res.status;
          if (res.status === 400 && thinking && attempt === 0) {
            // this model may not take the thinking setting: try again once without it, and remember
            const msg = await res.text().catch(() => '');
            if (/think/i.test(msg)) { noThinking.add(model); continue; }
            throw new Error('gemini rejected the request (400)');
          }
          if (res.status === 404) { await res.body?.cancel().catch(() => undefined); coolUntil.set(model, now() + 30 * 60_000); gone = true; break; }
          if (res.status === 429 || res.status === 403 || res.status >= 500) { await res.body?.cancel().catch(() => undefined); break; } // out of quota, or Google is struggling: next key
          if (!res.ok || !res.body) throw new Error(`gemini HTTP ${res.status}`);
          goodKey.set(model, i);
          for await (const ev of events(res.body)) {
            const text = textOf(ev);
            if (text) yield text;
          }
          return;
        }
      }
      if (!gone) coolUntil.set(model, now() + 60_000); // overloaded or out of quota: a minute's rest
    }
    throw new Error(lastStatus ? `gemini: every key and model failed (last HTTP ${lastStatus})` : 'gemini: not reachable');
  };
}
