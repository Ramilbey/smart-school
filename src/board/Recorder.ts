import { downsample, encodeWav, peak } from '../../shared/wav.ts';

/**
 * Records the student's voice for browsers without built-in speech recognition (Firefox, Telegram's in-app browser, most phones).
 * It keeps the raw microphone samples, stops by itself after a short pause once the student has spoken (or after 15 seconds), and
 * hands back a small WAV file for the server to write down. Nothing is kept after that.
 */
type Ctx = typeof AudioContext;
const ctxCtor = (): Ctx | null => (typeof window === 'undefined' ? null : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctx }).webkitAudioContext ?? null));

export interface RecordHooks {
  /** Called once the student has spoken and then been quiet for a moment, or when time is up. */
  onAutoStop: () => void;
}

export class Recorder {
  static supported(): boolean {
    return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(ctxCtor());
  }

  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private node: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private spoke = false;
  private quietSince = 0;
  private timer = 0;
  private done = false;

  /** Asks for the microphone and starts recording. Rejects with 'denied' when the student or the browser says no. */
  async start(h: RecordHooks, maxMs = 15_000): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      throw new Error((e as Error)?.name === 'NotAllowedError' || (e as Error)?.name === 'SecurityError' ? 'denied' : 'no-mic');
    }
    const C = ctxCtor()!;
    this.ctx = new C();
    await this.ctx.resume().catch(() => undefined);
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    const started = performance.now();
    this.node.onaudioprocess = (ev) => {
      if (this.done) return;
      const data = new Float32Array(ev.inputBuffer.getChannelData(0));
      this.chunks.push(data);
      const loud = peak(data) > 0.06;
      const now = performance.now();
      if (loud) { this.spoke = true; this.quietSince = 0; } else if (this.spoke && !this.quietSince) this.quietSince = now;
      // after real speech, about 1.4 s of quiet ends the question
      if (this.spoke && this.quietSince && now - this.quietSince > 1400 && now - started > 1200) h.onAutoStop();
    };
    src.connect(this.node);
    this.node.connect(this.ctx.destination); // some browsers only run the processor when it is connected
    this.timer = window.setTimeout(() => h.onAutoStop(), maxMs);
  }

  /** Stops and returns the recording, or null when nothing was said. */
  async stop(): Promise<Uint8Array | null> {
    if (this.done) return null;
    this.done = true;
    const rate = this.ctx?.sampleRate ?? 48_000;
    this.release();
    const samples = downsample(this.chunks, rate);
    this.chunks = [];
    if (!this.spoke || samples.length < 4000 || peak(samples) < 0.06) return null;
    return encodeWav(samples);
  }

  cancel() {
    this.done = true;
    this.chunks = [];
    this.release();
  }

  private release() {
    window.clearTimeout(this.timer);
    try { this.node?.disconnect(); } catch { /* already gone */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close().catch(() => undefined);
    this.node = null; this.stream = null; this.ctx = null;
  }
}
