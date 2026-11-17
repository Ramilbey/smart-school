/**
 * Turns microphone samples into a small WAV file: one channel, 16 kHz, 16-bit. Speech needs no more, every speech model reads it,
 * and 15 seconds come to under half a megabyte. Shared so it can be tested without a browser.
 */
export const WAV_RATE = 16_000;

/** Joins the recorded chunks and resamples them from the microphone's rate to 16 kHz (averaging, which also filters a little). */
export function downsample(chunks: Float32Array[], inRate: number, outRate = WAV_RATE): Float32Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const all = new Float32Array(total);
  let at = 0;
  for (const c of chunks) { all.set(c, at); at += c.length; }
  if (inRate === outRate) return all;
  const ratio = inRate / outRate;
  const out = new Float32Array(Math.floor(total / ratio));
  for (let i = 0; i < out.length; i++) {
    const from = Math.floor(i * ratio), to = Math.min(total, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = from; j < to; j++) sum += all[j]!;
    out[i] = to > from ? sum / (to - from) : 0;
  }
  return out;
}

/** A complete WAV file (RIFF header + 16-bit samples). */
export function encodeWav(samples: Float32Array, rate = WAV_RATE): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const v = new DataView(bytes.buffer);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return bytes;
}

/** Loudest sample: a recording that never goes above a whisper had no speech in it. */
export const peak = (samples: Float32Array) => { let m = 0; for (const s of samples) { const a = Math.abs(s); if (a > m) m = a; } return m; };

/** Whether bytes start like a WAV file we would have made. */
export const looksLikeWav = (b: Uint8Array) => b.length > 44 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WAVE';
