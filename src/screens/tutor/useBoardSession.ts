import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Beat, LessonMeta, Term } from '../../../shared/board/script.ts';
import { sampleById, sampleFor, type Sample } from '../../../shared/board/samples.ts';
import { Board } from '../../board/Board.ts';
import { Narrator, type VoiceLang } from '../../board/Narrator.ts';
import { Player, type PlayState } from '../../board/Player.ts';
import { streamBoard, type BoardOutcome } from '../../lib/api.ts';
import { useStore } from '../../lib/store.tsx';
import { track } from '../../lib/track.ts';
import type { TxKey } from './strings.ts';

export type Mode = 'tutor' | 'explainer';
export interface Msg { role: 'student' | 'tutor'; text: string }

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * Everything a board screen needs: the board, the voice and the player, the AI stream, the prepared lessons as a fallback,
 * the transcript, and the microphone. The screen only draws buttons around it.
 */
export function useBoardSession(mode: Mode) {
  const { lang, session } = useStore();
  const aiOn = !!session?.board;
  const canvas = useRef<HTMLDivElement | null>(null);
  const engine = useRef<{ board: Board; narrator: Narrator; player: Player } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const asked = useRef(false);

  const [phase, setPhase] = useState<'start' | 'loading' | 'live'>('start');
  const [meta, setMeta] = useState<LessonMeta | null>(null);
  const [sample, setSample] = useState<Sample | null>(null);
  const [source, setSource] = useState<'sample' | 'ai' | null>(null);
  const [chapterOf, setChapterOf] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [caption, setCaption] = useState({ text: '', word: -1 });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [thinking, setThinking] = useState(false);
  const [notice, setNotice] = useState<TxKey | ''>('');
  const [rate, setRateState] = useState(1);
  const [detour, setDetour] = useState(false);
  const [topic, setTopic] = useState('');
  const [terms, setTerms] = useState<Term[]>([]);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // the tutor's sentences are grouped into bubbles of a readable size
  const addTutorText = useCallback((text: string) => setMsgs((m) => {
    const last = m.at(-1);
    if (last?.role === 'tutor' && last.text.length + text.length < 180) return [...m.slice(0, -1), { role: 'tutor', text: `${last.text} ${text}` }];
    return [...m, { role: 'tutor', text }];
  }), []);

  // build the board, the voice and the player once, when the canvas is on screen
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const narrator = new Narrator();
    const board = new Board(el, { onTerms: setTerms });
    const player = new Player(board, narrator, {
      onState: setPlayState,
      onBeat: (i, beat, isDetour) => {
        setCaption({ text: beat.say, word: -1 });
        setDetour(isDetour);
        if (!isDetour) setIndex(i);
        setThinking(false);
        if (modeRef.current === 'tutor' || isDetour) addTutorText(beat.say);
      },
      onWord: (w) => setCaption((c) => ({ ...c, word: w })),
      onChange: () => {
        if (!player.inDetour) {
          setTotal(player.beats.length);
          setChapterOf(player.beats.map((b) => b.chapter ?? 0));
          setIndex(player.index);
        }
      },
    });
    narrator.serverVoice = !!session?.tts;
    engine.current = { board, narrator, player };
    return () => {
      abort.current?.abort();
      narrator.cancel();
      narrator.stopListening();
      player.load([]);
      board.destroy();
      engine.current = null;
    };
  }, [addTutorText]);

  // the server voice, when the server has one
  useEffect(() => { if (engine.current) engine.current.narrator.serverVoice = !!session?.tts; }, [session?.tts, phase]);

  // the spoken language follows the app's language
  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    e.player.lang = lang;
    if (phase === 'live') {
      const t = window.setTimeout(() => { if (!e.narrator.canSpeakIn(lang) && e.narrator.canSpeak) setNotice((n) => n || 'noVoice'); }, 700);
      return () => clearTimeout(t);
    }
  }, [lang, phase]);

  const startSample = useCallback((s: Sample, why: TxKey | '' = '') => {
    const e = engine.current;
    if (!e) return;
    setSource('sample');
    setSample(s);
    setMeta(s.meta);
    setTopic(s.meta.title);
    setNotice(why);
    setPhase('live');
    setThinking(false);
    setMsgs(modeRef.current === 'tutor' ? [{ role: 'student', text: s.opening }] : []);
    e.player.load(s.beats);
    e.player.play(); // called from the tap that started it, so the browser lets the voice speak
  }, []);

  const outcomeNotice = (o: BoardOutcome): TxKey | '' => (o === 'ai-off' ? 'aiOff' : o === 'limit-you' ? 'limitYou' : o === 'limit-all' ? 'limitAll' : o === 'error' ? 'failed' : '');

  /** A lesson or a first question from the start screen. */
  const begin = useCallback(async (text: string, sampleId?: string) => {
    const e = engine.current;
    const q = text.trim();
    if (!e || !q) return;
    e.narrator.unlock(); // inside the tap: lets the voice play on phones
    track({ kind: 'lesson', topic: q, id: sampleId });
    abort.current?.abort();
    const known = (sampleId ? sampleById(sampleId) : undefined) ?? sampleFor(q);
    // a prepared lesson the student picked, or any topic when there is no AI
    if (sampleId || !aiOn) {
      if (known) return startSample(known, aiOn ? '' : 'aiOff');
      setNotice('sampleOnly');
      return;
    }
    setNotice('');
    setTopic(q);
    setThinking(true);
    setPhase('loading');
    setSource('ai');
    setMsgs(mode === 'tutor' ? [{ role: 'student', text: q }] : []);
    const ctl = new AbortController();
    abort.current = ctl;
    e.player.load([], { streaming: true });
    const feed = e.player.feed();
    let beats = 0;
    const outcome = await streamBoard(
      mode === 'explainer' ? { mode: 'lesson', topic: q, lang } : { mode: 'turn', message: q, lang, board: [], history: [], scratch: false },
      (ev) => {
        if (ev.type === 'meta') { setMeta(ev.meta); setTopic(ev.meta.title); }
        if (ev.type === 'beat') { beats++; setPhase('live'); feed.push(ev.beat); }
        if (ev.type === 'error' && beats === 0) setNotice('failed');
      },
      ctl.signal,
    );
    feed.finish();
    setThinking(false);
    if (ctl.signal.aborted) return;
    if (beats === 0) {
      // the AI did not deliver: show a prepared lesson if there is one that matches, else go back and say why
      if (known) startSample(known, outcomeNotice(outcome) || 'failed');
      else { setPhase('start'); setNotice(outcomeNotice(outcome) || 'failed'); e.player.load([]); }
    }
  }, [aiOn, lang, mode, startSample]);

  /** A question typed or spoken while a lesson or conversation is on. */
  const ask = useCallback(async (text: string) => {
    const e = engine.current;
    const q = text.trim();
    if (!e || !q) return;
    asked.current = true;
    e.narrator.unlock();
    if (phase !== 'live') return begin(q);
    track({ kind: 'question' });
    const scratch = mode === 'explainer';
    setMsgs((m) => [...m, { role: 'student', text: q }]);
    setNotice('');
    const saying = e.player.current?.say;
    const history = msgs.slice(-8).map((m) => ({ role: m.role, text: m.text }));
    const board = scratch ? [] : e.board.describe();

    const playCanned = (): boolean => {
      const f = sample?.followUps.find((x) => norm(x.q) === norm(q) || norm(x.q).includes(norm(q)) || norm(q).includes(norm(x.q)));
      if (!f) return false;
      const feed = e.player.feed({ scratch });
      f.beats.forEach((b, i) => feed.push(i === 0 && !scratch ? { ...b, ops: [{ op: 'clear' as const }, ...b.ops] } : b));
      feed.finish();
      return true;
    };
    if (!aiOn) {
      if (!playCanned()) { setNotice('sampleOnly'); e.player.play(); }
      return;
    }
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setThinking(true);
    const feed = e.player.feed({ scratch });
    let beats = 0;
    const outcome = await streamBoard(
      { mode: 'turn', message: q, lang, topic: meta?.title ?? topic, board, history, scratch, saying },
      (ev) => {
        if (ev.type === 'beat') { beats++; feed.push(ev.beat); }
        if (ev.type === 'error' && beats === 0) setNotice('failed');
      },
      ctl.signal,
    );
    feed.finish();
    setThinking(false);
    if (ctl.signal.aborted) return;
    if (beats === 0) {
      const n = outcomeNotice(outcome) || 'failed';
      if (!playCanned()) setNotice(n);
    }
  }, [aiOn, begin, lang, meta, mode, msgs, phase, sample, topic]);

  const toggleMic = useCallback(() => {
    const e = engine.current;
    if (!e) return;
    e.narrator.unlock();
    if (listening) { e.narrator.stopListening(); return; }
    setNotice('');
    asked.current = false;
    e.player.interrupt();
    const stop = e.narrator.listen(lang, {
      onInterim: setInterim,
      onFinal: (t) => { setInterim(''); void ask(t); },
      onEnd: () => { setListening(false); setInterim(''); if (!asked.current) e.player.play(); },
      onError: (code) => { if (code === 'not-allowed' || code === 'service-not-allowed') setNotice('micDenied'); else if (code !== 'no-speech' && code !== 'aborted') setNotice('noMic'); },
    });
    if (!stop) { setNotice('noMic'); e.player.play(); return; }
    setListening(true);
  }, [ask, lang, listening]);

  // Space talks (on a laptop), unless the student is typing
  useEffect(() => {
    if (phase !== 'live') return;
    const down = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      if (ev.code !== 'Space' || ev.repeat || t?.closest('input, textarea, button, [contenteditable]')) return;
      ev.preventDefault();
      toggleMic();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [phase, toggleMic]);

  const reset = useCallback(() => {
    abort.current?.abort();
    const e = engine.current;
    e?.player.load([]);
    setTerms([]); setPhase('start'); setMeta(null); setSample(null); setSource(null); setMsgs([]); setCaption({ text: '', word: -1 }); setNotice(''); setThinking(false); setIndex(0); setTotal(0); setChapterOf([]); setDetour(false);
  }, []);

  /** The student taps a key word: say it (in the language they tap), pausing the lesson for a moment. */
  const speakTerm = (text: string, l: VoiceLang) => {
    const e = engine.current;
    if (!e) return;
    const wasPaused = e.player.isPaused;
    e.player.pause();
    e.narrator.speak(text, l, { onEnd: () => { if (!wasPaused) e.player.play(); } });
  };

  const player = () => engine.current?.player;
  const chapters = meta?.chapters ?? [];
  const chapter = chapterOf[index] ?? 0;
  const canListen = useMemo(() => new Narrator().canListen, []);

  return {
    canvas, terms, speakTerm, phase, meta, sample, source, aiOn, lang, topic, index, total, chapter, chapters, chapterOf, playState, caption, msgs, listening, interim, thinking, notice, rate, detour, canListen,
    begin, ask, toggleMic, reset,
    toggle: () => player()?.toggle(),
    seek: (i: number) => player()?.seek(i),
    seekChapter: (c: number) => { const i = chapterOf.indexOf(c); if (i >= 0) player()?.seek(i); },
    replay: () => player()?.seek(0),
    setRate: (r: number) => { setRateState(r); const p = player(); if (p) p.setRate(r); },
    isPaused: () => player()?.isPaused ?? false,
    beats: (): Beat[] => player()?.beats ?? [],
  };
}
