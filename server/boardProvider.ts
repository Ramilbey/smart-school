/**
 * Which AI writes the whiteboard lessons: Claude when an ANTHROPIC_API_KEY is set, otherwise Gemini when GEMINI_API_KEYS is set
 * (AI_PROVIDER=anthropic or gemini forces one). The chat tutor in the bot is separate and stays on Claude.
 */
import { config } from './config.ts';
import { anthropicStreamer, type Streamer } from './boardAi.ts';
import { aiClient } from './tutor.ts';
import { geminiStreamer } from './gemini.ts';

let cached: { name: string; streamer: Streamer } | null | undefined;

function build(): { name: string; streamer: Streamer } | null {
  const claude = aiClient();
  const gemini = config.gemini.keys.length > 0;
  const want = config.aiProvider;
  if (claude && want !== 'gemini') return { name: `claude (${config.anthropicModel})`, streamer: anthropicStreamer(claude) };
  if (gemini && want !== 'anthropic') return { name: `gemini (${config.gemini.model}, ${config.gemini.keys.length} key${config.gemini.keys.length === 1 ? '' : 's'})`, streamer: geminiStreamer({ keys: config.gemini.keys, model: config.gemini.model, fallbackModels: config.gemini.fallbackModels, thinking: config.gemini.thinking }) };
  return null;
}

/** The streamer for the whiteboard, or null when no AI is set up (the prepared lessons are shown instead). */
export function boardStreamer(): Streamer | null {
  if (cached === undefined) cached = build();
  return cached?.streamer ?? null;
}

export const boardAvailable = (): boolean => boardStreamer() !== null;
export const boardProviderName = (): string => { boardStreamer(); return cached?.name ?? 'none'; };
