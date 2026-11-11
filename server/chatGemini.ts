import type { Streamer } from './boardAi.ts';
import type { Complete } from './tutor.ts';

/**
 * Lets the bot's chat tutor run on whatever model the whiteboard uses (Gemini when there is no Claude key).
 * It only turns a streamer into "write a reply": the prompt, the daily allowance and the checks on the reply are the chat tutor's own.
 */
export function streamerComplete(streamer: Streamer): Complete {
  return async (system, user, maxChars, timeoutMs) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    let out = '';
    try {
      for await (const t of streamer({ system, user, maxTokens: 900, signal: ctl.signal })) out += t;
    } catch {
      console.warn(`[tutor] ${ctl.signal.aborted ? 'the AI took too long' : 'AI request failed'}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
    // Only markdown markers go. A lone * can be maths: stripping it would turn "2*3" into "23".
    const text = out.replace(/\*\*|__|^#+\s*/gm, '').replace(/\s+/g, ' ').trim();
    return text.length > 0 && text.length <= maxChars ? text : null;
  };
}
