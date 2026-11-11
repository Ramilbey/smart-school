import { useCallback, useRef, useState } from 'react';
import {
  afterAttempt,
  canRequestHint,
  evaluateAttempt,
  initialLadder,
  requestHint,
  type AttemptInput,
  type Evaluation,
  type LadderState,
} from '../../shared/check.ts';
import { curatedReply } from '../../shared/tutor.ts';
import { tx, type GuidedProblem, type Lang } from '../../shared/types.ts';
import { askTutor } from './api.ts';

export interface TutorMessage {
  id: number;
  from: 'tutor' | 'student';
  text: string;
  /** Where the tutor text came from: shown to the student for transparency. */
  source?: 'ai' | 'curated';
  /** Hint rung this message carries (1–4), for the ladder indicator and visuals. */
  rung?: number;
  kind?: 'feedback' | 'hint' | 'explanation' | 'intro' | 'answer';
}

interface Options {
  problem: GuidedProblem;
  lang: Lang;
  intro: string;
  aiEnabled: boolean;
  /** Called once when the problem is solved. */
  onSolved?: (state: LadderState) => void;
  /** Called on every wrong attempt or hint request, for progress records. */
  onLadder?: (state: LadderState) => void;
}

const MIN_THINK_MS = 450;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs the homework hint ladder: attempt → deterministic check → targeted feedback + next rung → retry.
 * The live AI only rephrases feedback when available; the curated text is always the fallback.
 */
export function useTutor({ problem, lang, intro, aiEnabled, onSolved, onLadder }: Options) {
  const [ladder, setLadder] = useState<LadderState>(initialLadder);
  const [messages, setMessages] = useState<TutorMessage[]>([{ id: 0, from: 'tutor', text: intro, kind: 'intro', source: 'curated' }]);
  const [busy, setBusy] = useState(false);
  const [lastEval, setLastEval] = useState<Evaluation | null>(null);
  const ids = useRef(1);
  const ladderRef = useRef(ladder);
  ladderRef.current = ladder;

  const add = useCallback((m: Omit<TutorMessage, 'id'>) => {
    setMessages((list) => [...list, { ...m, id: ids.current++ }]);
  }, []);

  const submit = useCallback(
    async (input: AttemptInput, studentText: string): Promise<Evaluation> => {
      const ev = evaluateAttempt(problem, input);
      setLastEval(ev);
      if (ev.status === 'invalid') return ev;
      const next = afterAttempt(ladderRef.current, ev);
      setLadder(next);
      add({ from: 'student', text: studentText, kind: 'answer' });
      setBusy(true);
      const started = Date.now();
      let text = curatedReply(problem, ev, next.hintLevel, lang);
      let source: 'ai' | 'curated' = 'curated';
      if (ev.status === 'incorrect' && aiEnabled) {
        const res = await askTutor({ problemId: problem.id, lang, kind: 'attempt', input, ladder: next });
        if (res?.source === 'ai' && res.message) {
          text = res.message;
          source = 'ai';
        }
      }
      const elapsed = Date.now() - started;
      if (elapsed < MIN_THINK_MS) await wait(MIN_THINK_MS - elapsed);
      setBusy(false);
      if (ev.status === 'correct') {
        add({ from: 'tutor', text, kind: 'explanation', source: 'curated' });
        onSolved?.(next);
      } else {
        add({ from: 'tutor', text, kind: 'feedback', source, rung: next.hintLevel });
        onLadder?.(next);
      }
      return ev;
    },
    [problem, lang, aiEnabled, add, onSolved, onLadder],
  );

  const hint = useCallback(async () => {
    const current = ladderRef.current;
    if (!canRequestHint(current) || busy) return;
    const next = requestHint(current);
    setLadder(next);
    setBusy(true);
    await wait(MIN_THINK_MS);
    setBusy(false);
    add({ from: 'tutor', text: tx(problem.hints[next.hintLevel - 1], lang), kind: 'hint', source: 'curated', rung: next.hintLevel });
    onLadder?.(next);
  }, [problem, lang, busy, add, onLadder]);

  const ask = useCallback(
    async (question: string, unavailablePrefix: string) => {
      const q = question.trim();
      if (!q || busy) return;
      add({ from: 'student', text: q, kind: 'answer' });
      setBusy(true);
      const current = ladderRef.current;
      const res = aiEnabled
        ? await askTutor({ problemId: problem.id, lang, kind: 'question', question: q, ladder: current })
        : null;
      setBusy(false);
      if (res?.source === 'ai' && res.message) {
        add({ from: 'tutor', text: res.message, source: 'ai' });
      } else {
        // Honest fallback: no live tutor, so offer the current (or first) curated hint.
        const rung = Math.max(1, Math.min(3, current.hintLevel || 1));
        add({ from: 'tutor', text: `${unavailablePrefix} ${tx(problem.hints[rung - 1], lang)}`, source: 'curated', rung });
      }
    },
    [problem, lang, aiEnabled, busy, add],
  );

  return { ladder, messages, busy, lastEval, submit, hint, ask, canHint: canRequestHint(ladder) };
}
