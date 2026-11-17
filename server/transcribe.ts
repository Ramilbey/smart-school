/**
 * Speech to text for browsers that cannot listen by themselves (Firefox, Telegram's in-app browser, many phones): the page records
 * a few seconds of the student's voice as a small WAV file and Gemini writes down what was said. Same keys and model order as the
 * whiteboard; a key that is out of quota is skipped. The audio is not stored: it goes to Google once and is dropped.
 */
export type SttLang = 'en' | 'ru' | 'uz';

export interface TranscribeOptions {
  keys: string[];
  models: string[];
  thinking: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const NAMES: Record<SttLang, string> = { en: 'English', ru: 'Russian', uz: 'Uzbek (Latin script)' };

export function prompt(lang: SttLang): string {
  return (
    `A school pupil is asking a question about a lesson. Write down exactly what they say in this recording, word for word, ` +
    `in the language they speak. They most likely speak ${NAMES[lang]}; Uzbek must be written in the Latin script. ` +
    `Reply with the words only: no quotes, no translation, no comments. If there is no speech, reply with an empty line.`
  );
}

/** Cleans the model's reply: no quotes or labels around it, and "no speech" answers become empty. */
export function clean(text: string): string {
  let t = text.trim().replace(/^["“«]+|["”»]+$/g, '').replace(/^(transcript|transcription)\s*:\s*/i, '').trim();
  if (/^\[?(no speech|silence|inaudible|empty)\]?\.?$/i.test(t)) t = '';
  return t.slice(0, 400);
}

export async function transcribe(o: TranscribeOptions, wavBase64: string, lang: SttLang): Promise<string> {
  const f = o.fetchImpl ?? fetch;
  const base = o.baseUrl ?? BASE;
  let lastStatus = 0;
  for (const model of o.models) {
    for (const key of o.keys) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const thinking = o.thinking !== '' && attempt === 0;
        const body = {
          contents: [{ role: 'user', parts: [{ text: prompt(lang) }, { inlineData: { mimeType: 'audio/wav', data: wavBase64 } }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 300, ...(thinking ? { thinkingConfig: { thinkingLevel: o.thinking } } : {}) },
        };
        let res: Response;
        try {
          res = await f(`${base}/models/${model}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal: AbortSignal.timeout(o.timeoutMs ?? 20_000) });
        } catch {
          lastStatus = 0;
          break; // network or timeout: next key
        }
        lastStatus = res.status;
        if (res.status === 400 && thinking) {
          const msg = await res.text().catch(() => '');
          if (/think/i.test(msg)) continue; // this model does not take the thinking setting: once more without it
          throw new Error('gemini rejected the recording (400)');
        }
        if (res.status === 404) { await res.body?.cancel().catch(() => undefined); break; }
        if (res.status === 429 || res.status === 403 || res.status >= 500) { await res.body?.cancel().catch(() => undefined); break; }
        if (!res.ok) throw new Error(`gemini HTTP ${res.status}`);
        const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
        const text = (data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('');
        return clean(text);
      }
    }
  }
  throw new Error(lastStatus ? `transcribe: every key and model failed (last HTTP ${lastStatus})` : 'transcribe: not reachable');
}
