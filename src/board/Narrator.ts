/**
 * The voice. Speaking uses the browser's built-in speech synthesis, listening uses its speech recognition: no audio goes through our
 * server and no extra service is paid for. Both are optional. With no voice for a language the lesson still plays: the words are
 * shown one by one at reading speed, so a student never waits on a silent screen.
 *
 * Honest limits: speech recognition exists in Chrome, Edge and Safari but not in Firefox, and Telegram's phone webviews often have
 * none; there the student types or uses the keyboard's microphone key.
 */

import { fetchSpeech } from '../lib/api.ts';

export type VoiceLang = 'en' | 'ru' | 'uz';
const BCP: Record<VoiceLang, string> = { en: 'en-US', ru: 'ru-RU', uz: 'uz-UZ' };

/** The parts of the browser's recognition object that we use (it is missing from the standard type definitions). */
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;
const recognitionCtor = (): RecognitionCtor | null => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

// the shortest valid sound file: played inside a tap, it lets the browser play our sentences later
const SILENCE = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';

// One audio element for the whole page. A phone lets it play once any tap has "unlocked" it, so the first tap anywhere
// (see armAudioUnlock) is enough for every lesson that starts later, even one started by a link and not by a tap.
let sharedAudio: HTMLAudioElement | null = null;
const sharedEl = (): HTMLAudioElement => {
  if (!sharedAudio) { sharedAudio = new Audio(); sharedAudio.preload = 'auto'; }
  return sharedAudio;
};
let armed = false;
/** Call once at start-up: the first tap or key press unlocks sound for the rest of the visit. */
export function armAudioUnlock() {
  if (armed || typeof document === 'undefined') return;
  armed = true;
  const go = () => {
    document.removeEventListener('pointerdown', go, true);
    document.removeEventListener('keydown', go, true);
    const a = sharedEl();
    if (a.paused && !a.src) { a.src = SILENCE; void a.play().then(() => a.pause()).catch(() => undefined); }
  };
  document.addEventListener('pointerdown', go, true);
  document.addEventListener('keydown', go, true);
}

export interface SpeakOptions {
  rate?: number;
  /** Called with the index of the word being spoken, as it is spoken. */
  onWord?: (index: number) => void;
  /** Called once when the sentence is finished, cancelled, or could not be spoken. */
  onEnd: () => void;
}

const PREFERRED = /natural|online|google|aria|jenny|samantha|daniel|madina|sardor|svetlana|dmitry|milena|yuri/i;

export class Narrator {
  readonly canSpeak = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  readonly canListen = recognitionCtor() !== null;
  muted = false;
  /** True when the server can make the voice: it plays in every browser, Telegram's included, and has Uzbek. */
  serverVoice = false;
  private sounds = new Map<string, Promise<string | null>>();
  private stopCurrent: (() => void) | null = null;
  private listening: Recognition | null = null;

  constructor() {
    // voices arrive a moment after the page loads in some browsers
    if (this.canSpeak) speechSynthesis.getVoices();
  }

  voiceFor(lang: VoiceLang): SpeechSynthesisVoice | null {
    if (!this.canSpeak) return null;
    const all = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang));
    return all.find((v) => PREFERRED.test(v.name)) ?? all.find((v) => v.localService) ?? all[0] ?? null;
  }

  /** True when this device can really speak that language (otherwise the words are shown at reading speed). The server's voice speaks all three. */
  canSpeakIn(lang: VoiceLang): boolean {
    return !this.muted && (this.serverVoice || this.voiceFor(lang) !== null);
  }

  private audioEl(): HTMLAudioElement {
    return sharedEl();
  }

  /** Call inside a tap or click: it lets the browser play the server voice for the rest of the session (phones need this). */
  unlock() {
    if (!this.serverVoice) return;
    const a = this.audioEl();
    a.src = SILENCE;
    void a.play().then(() => a.pause()).catch(() => undefined);
  }

  /** Starts making the audio for a sentence that will be spoken soon, so there is no gap when its turn comes. */
  prefetch(text: string, lang: VoiceLang) {
    if (this.serverVoice && !this.muted) void this.sound(text, lang);
  }

  private sound(text: string, lang: VoiceLang): Promise<string | null> {
    const key = `${lang}|${text}`;
    let p = this.sounds.get(key);
    if (!p) {
      p = fetchSpeech(text, lang).then((b) => (b ? URL.createObjectURL(b) : null));
      this.sounds.set(key, p);
      if (this.sounds.size > 40) {
        const [oldKey, old] = this.sounds.entries().next().value as [string, Promise<string | null>];
        this.sounds.delete(oldKey);
        void old.then((u) => u && URL.revokeObjectURL(u));
      }
    }
    return p;
  }

  /** Speaks one sentence. Returns a cancel function; cancelling still calls onEnd, so a waiting Promise never hangs. */
  speak(text: string, lang: VoiceLang, o: SpeakOptions): () => void {
    this.cancel();
    return this.serverVoice && !this.muted ? this.speakServer(text, lang, o) : this.speakLocal(text, lang, o);
  }

  /** The server's voice, played as an audio file. If it cannot be played, the browser's voice or reading speed takes over. */
  private speakServer(text: string, lang: VoiceLang, o: SpeakOptions): () => void {
    const audio = this.audioEl();
    const words = text.split(/\s+/).filter(Boolean);
    let done = false;
    let inner: (() => void) | null = null;
    let watchdog = 0;
    const detach = () => { audio.onended = null; audio.onerror = null; audio.ontimeupdate = null; };
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      detach();
      if (this.stopCurrent === cancel) this.stopCurrent = null;
      o.onEnd();
    };
    const cancel = () => {
      if (done) return;
      if (inner) { inner(); return; }
      try { audio.pause(); } catch { /* nothing playing */ }
      finish();
    };
    this.stopCurrent = cancel;
    const local = () => {
      if (done || inner) return;
      clearTimeout(watchdog);
      try { audio.pause(); } catch { /* nothing playing */ }
      detach();
      inner = this.speakLocal(text, lang, { ...o, onEnd: () => { inner = null; finish(); } });
    };
    watchdog = window.setTimeout(local, 12000); // the server took too long to make the sentence
    void this.sound(text, lang).then((url) => {
      if (done || inner) return;
      if (!url) return local();
      clearTimeout(watchdog);
      audio.src = url;
      audio.playbackRate = o.rate ?? 1;
      let last = -1;
      audio.ontimeupdate = () => {
        if (!(audio.duration > 0)) return;
        const i = Math.min(words.length - 1, Math.floor((audio.currentTime / audio.duration) * words.length));
        if (i !== last) { last = i; o.onWord?.(i); }
      };
      audio.onended = finish;
      audio.onerror = local;
      audio.play().catch(local);
    });
    return cancel;
  }

  private speakLocal(text: string, lang: VoiceLang, o: SpeakOptions): () => void {
    const rate = o.rate ?? 1;
    const words = text.split(/\s+/).filter(Boolean);
    const starts: number[] = [];
    { let at = 0; for (const w of words) { const i = text.indexOf(w, at); starts.push(i); at = i + w.length; } }
    let done = false;
    let timers: number[] = [];
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach((t) => clearTimeout(t));
      timers = [];
      if (this.stopCurrent === cancel) this.stopCurrent = null;
      o.onEnd();
    };
    const cancel = () => {
      if (!done && this.canSpeak) speechSynthesis.cancel();
      finish();
    };
    this.stopCurrent = cancel;

    // reading-speed fallback: shows the words one by one and ends on time, with or without a voice
    const readAloud = (fromWord = 0) => {
      const per = 60000 / (165 * rate);
      for (let i = fromWord; i < words.length; i++) timers.push(window.setTimeout(() => !done && o.onWord?.(i), (i - fromWord) * per));
      timers.push(window.setTimeout(finish, (words.length - fromWord) * per + 250));
    };

    const voice = this.muted ? null : this.voiceFor(lang);
    if (!this.canSpeak || !voice) {
      readAloud();
      return cancel;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    let sawBoundary = false;
    let started = false;
    u.onstart = () => {
      started = true;
      // some voices never report word boundaries: after a moment, estimate them
      timers.push(window.setTimeout(() => { if (!sawBoundary && !done) { const per = 60000 / (165 * rate); const passed = Math.floor(700 / per); for (let i = passed; i < words.length; i++) timers.push(window.setTimeout(() => !done && o.onWord?.(i), (i - passed) * per)); } }, 700));
    };
    u.onboundary = (e) => {
      sawBoundary = true;
      let idx = 0;
      for (let i = 0; i < starts.length; i++) if (starts[i]! <= e.charIndex) idx = i;
      o.onWord?.(idx);
    };
    u.onend = finish;
    u.onerror = () => { if (!done) { done = false; timers.forEach((t) => clearTimeout(t)); timers = []; readAloud(); } };
    // if the browser accepts the sentence but never starts (blocked until a tap, or no audio device), carry on at reading speed
    timers.push(window.setTimeout(() => { if (!started && !done) { speechSynthesis.cancel(); timers.forEach((t) => clearTimeout(t)); timers = []; readAloud(); } }, 3000));
    speechSynthesis.speak(u);
    return cancel;
  }

  cancel() {
    this.stopCurrent?.();
  }

  /** Listens once. Returns a stop function, or null when this browser has no speech recognition. */
  listen(lang: VoiceLang, h: { onInterim?: (t: string) => void; onFinal: (t: string) => void; onEnd: () => void; onError?: (code: string) => void }): (() => void) | null {
    const Ctor = recognitionCtor();
    if (!Ctor) return null;
    this.cancel(); // never listen over the tutor's own voice
    this.stopListening();
    const r = new Ctor();
    r.lang = BCP[lang];
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    let final = '';
    r.onresult = (e) => {
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const alt = e.results[i]![0]!;
        if (e.results[i]!.isFinal) final += alt.transcript;
        else interim += alt.transcript;
      }
      if (interim) h.onInterim?.((final + interim).trim());
    };
    r.onerror = (e) => h.onError?.(e.error);
    r.onend = () => {
      this.listening = null;
      if (final.trim()) h.onFinal(final.trim());
      h.onEnd();
    };
    this.listening = r;
    try { r.start(); } catch { this.listening = null; return null; }
    return () => this.stopListening();
  }

  stopListening() {
    try { this.listening?.stop(); } catch { /* already stopped */ }
  }
}
