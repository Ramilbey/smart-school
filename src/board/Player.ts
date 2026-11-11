/**
 * The player: draws each beat on the Board while the Narrator says it, then moves on. It also lets a student pause, jump to a
 * chapter, change speed, and interrupt with a question.
 *
 * Beats can still be arriving from the AI while the first ones play: `feed()` returns a handle to push them in. When the
 * player reaches the end of what has arrived it shows "waiting" instead of "finished".
 *
 * An interruption in a lesson is answered on a clean board and then the lesson comes back (`feed({ scratch: true })`): the board
 * is redrawn instantly to where the lesson was and the sentence that was interrupted is said again, so the lesson "picks up where
 * it left off". In a conversation the answer simply continues on the same board (`feed({ scratch: false })`).
 */
import type { Beat } from '../../shared/board/script.ts';
import type { Board } from './Board.ts';
import type { Narrator, VoiceLang } from './Narrator.ts';

export type PlayState = 'idle' | 'playing' | 'paused' | 'waiting' | 'ended';

export interface PlayerHooks {
  onState?: (s: PlayState) => void;
  /** A beat starts (index into the list that is playing). */
  onBeat?: (index: number, beat: Beat, detour: boolean) => void;
  onWord?: (word: number) => void;
  /** The list of beats or the position changed (the UI redraws its chapter map and progress). */
  onChange?: () => void;
}

export interface Feed {
  push(beat: Beat): void;
  finish(): void;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class Player {
  beats: Beat[] = [];
  index = 0;
  state: PlayState = 'idle';
  lang: VoiceLang = 'en';
  rate = 1;
  private streaming = false;
  private feedSeq = 0;
  private paused = false;
  private epoch = 0;
  private drawn = new WeakSet<Beat>();
  private wake: (() => void) | null = null;
  private saved: { beats: Beat[]; index: number } | null = null;

  constructor(private board: Board, private narrator: Narrator, private hooks: PlayerHooks = {}) {}

  /** True while a clean-board answer to an interruption is playing. */
  get inDetour(): boolean {
    return this.saved !== null;
  }

  /** The beat being said (or about to be). */
  get current(): Beat | undefined {
    return this.beats[this.index];
  }

  private set(s: PlayState) {
    if (this.state === s) return;
    this.state = s;
    this.hooks.onState?.(s);
  }

  private poke() {
    const w = this.wake;
    this.wake = null;
    w?.();
  }

  private idle(): Promise<void> {
    return new Promise((r) => { this.wake = r; });
  }

  /** Starts a new run of the loop, ending any earlier one. */
  private restart() {
    this.epoch++;
    this.poke();
    this.narrator.cancel();
    void this.run(this.epoch);
  }

  /** A fresh lesson: the beats so far (usually none, they arrive through feed) and a clean board. */
  load(beats: Beat[] = [], opts: { streaming?: boolean } = {}) {
    this.epoch++;
    this.feedSeq++; // anything a still-running earlier feed sends is ignored from now on
    this.poke();
    this.narrator.cancel();
    this.board.clear(true);
    this.saved = null;
    this.beats = beats;
    this.index = 0;
    this.streaming = !!opts.streaming;
    this.paused = false;
    this.drawn = new WeakSet();
    this.set('idle');
    this.hooks.onChange?.();
  }

  /** Starts, or resumes after a pause. Must be called from a tap or click the first time, so the browser lets the voice speak. */
  play() {
    if (this.state === 'idle') { this.paused = false; this.restart(); return; }
    if (this.paused) { this.paused = false; this.poke(); }
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.narrator.cancel();
  }

  toggle() {
    if (this.paused || this.state === 'idle') this.play(); else this.pause();
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** The student starts to speak or type: stop talking, but remember where we were. */
  interrupt() {
    this.pause();
  }

  /** Jumps to a beat: the board is redrawn instantly up to it, then the lesson plays from there. */
  seek(i: number) {
    if (this.saved) this.endDetour();
    const target = Math.max(0, Math.min(i, this.beats.length - 1));
    this.epoch++;
    this.poke();
    this.narrator.cancel();
    this.redraw(target);
    this.index = target;
    this.paused = false;
    this.hooks.onChange?.();
    this.restart();
  }

  /** Redraws the board instantly as it is just before beat `upTo`. */
  private redraw(upTo: number) {
    this.board.clear(true);
    this.drawn = new WeakSet();
    for (let j = 0; j < upTo; j++) {
      this.board.apply(this.beats[j]!, { instant: true });
      this.drawn.add(this.beats[j]!);
    }
  }

  setRate(r: number) {
    this.rate = r;
  }

  /**
   * Beats arriving from the AI (or an answer to a question). With `scratch`, the answer gets a clean board and the lesson is kept to
   * come back to. Without it, the answer continues on the same board, and whatever was still to come in the old script is dropped:
   * a question means "stop the script and answer me".
   */
  feed(opts: { scratch?: boolean } = {}): Feed {
    const seq = ++this.feedSeq;
    if (opts.scratch) {
      if (!this.saved) this.saved = { beats: this.beats, index: this.index };
      this.beats = [];
      this.index = 0;
      this.board.clear();
    } else {
      this.beats = this.beats.slice(0, this.index);
    }
    this.paused = false;
    this.streaming = true;
    this.hooks.onChange?.();
    this.restart();
    return {
      push: (beat) => {
        if (seq !== this.feedSeq) return;
        this.beats.push(beat);
        if (this.beats.length <= 2) this.narrator.prefetch(beat.say, this.lang);
        this.hooks.onChange?.();
        this.poke();
      },
      finish: () => {
        if (seq === this.feedSeq) this.streaming = false;
        this.poke();
      },
    };
  }

  /** Leaves the clean-board answer and brings the lesson back instantly, to the sentence that was interrupted. */
  private endDetour() {
    if (!this.saved) return;
    this.beats = this.saved.beats;
    this.index = this.saved.index;
    this.saved = null;
    this.redraw(this.index);
    this.hooks.onChange?.();
  }

  private async run(epoch: number) {
    while (epoch === this.epoch) {
      if (this.paused) { this.set('paused'); await this.idle(); continue; }
      if (this.index >= this.beats.length) {
        if (this.streaming) { this.set('waiting'); await this.idle(); continue; }
        if (this.saved) { this.endDetour(); continue; }
        this.set('ended');
        return;
      }
      this.set('playing');
      const i = this.index;
      const beat = this.beats[i]!;
      this.hooks.onBeat?.(i, beat, this.saved !== null);
      for (let k = 1; k <= 2; k++) { const next = this.beats[i + k]; if (next) this.narrator.prefetch(next.say, this.lang); } // so the next sentences are ready when their turn comes
      const fresh = !this.drawn.has(beat);
      this.drawn.add(beat);
      const drawMs = fresh ? this.board.apply(beat, { speed: this.rate }) : 0;
      const spoken = new Promise<void>((res) => { this.narrator.speak(beat.say, this.lang, { rate: this.rate, onWord: (w) => this.hooks.onWord?.(w), onEnd: res }); });
      await Promise.all([spoken, sleep(drawMs)]);
      if (epoch !== this.epoch) return;
      if (this.paused) continue; // interrupted: wait, then say this sentence again
      await sleep((beat.pause ?? 320) / this.rate);
      if (epoch !== this.epoch) return;
      if (this.paused) continue;
      if (i === this.index) this.index++;
      this.hooks.onChange?.();
    }
  }
}
