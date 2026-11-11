import { approxEqual, parseNumber } from './format.ts';
import type { GuidedProblem, Text } from './types.ts';

export type AttemptInput =
  | { kind: 'numbers'; values: Record<string, string> }
  | { kind: 'choice'; choice: string };

export type FieldResult = 'correct' | 'incorrect' | 'invalid';

export interface Evaluation {
  status: 'correct' | 'incorrect' | 'invalid';
  fields?: Record<string, FieldResult>;
  misconceptionId?: string;
  /** Targeted feedback for this specific wrong answer, if we recognise it. */
  feedback?: Text;
}

function matches(when: Record<string, number | string>, values: Record<string, number | string>) {
  return Object.entries(when).every(([key, expected]) => {
    const got = values[key];
    if (typeof expected === 'number') return typeof got === 'number' && approxEqual(got, expected);
    return got === expected;
  });
}

/** Deterministic answer checking. The AI never decides whether an answer is correct. */
export function evaluateAttempt(problem: GuidedProblem, input: AttemptInput): Evaluation {
  if (problem.input.kind === 'choice') {
    if (input.kind !== 'choice') return { status: 'invalid' };
    const { choices, correct } = problem.input;
    if (!choices.some((c) => c.id === input.choice)) return { status: 'invalid' };
    if (input.choice === correct) return { status: 'correct' };
    const rule = problem.misconceptions.find((m) => matches(m.when, { choice: input.choice }));
    return { status: 'incorrect', misconceptionId: rule?.id, feedback: rule?.feedback };
  }

  if (input.kind !== 'numbers') return { status: 'invalid' };
  const parsed: Record<string, number> = {};
  const fields: Record<string, FieldResult> = {};
  for (const f of problem.input.fields) {
    const n = parseNumber(input.values[f.id] ?? '');
    if (n === null) {
      fields[f.id] = 'invalid';
      continue;
    }
    parsed[f.id] = n;
    fields[f.id] = approxEqual(n, f.answer) ? 'correct' : 'incorrect';
  }
  if (Object.values(fields).some((r) => r === 'invalid')) return { status: 'invalid', fields };
  if (Object.values(fields).every((r) => r === 'correct')) return { status: 'correct', fields };

  const rule = problem.misconceptions.find((m) => matches(m.when, parsed));
  if (rule) return { status: 'incorrect', fields, misconceptionId: rule.id, feedback: rule.feedback };
  const firstWrong = problem.input.fields.find((f) => fields[f.id] === 'incorrect');
  const feedback = firstWrong ? problem.fieldFeedback?.[firstWrong.id] : undefined;
  return { status: 'incorrect', fields, feedback };
}

/* ---------- Hint ladder ---------- */

export type HintLevel = 0 | 1 | 2 | 3 | 4;

export interface LadderState {
  attempts: number;
  wrong: number;
  hintLevel: HintLevel;
  solved: boolean;
}

export const initialLadder: LadderState = { attempts: 0, wrong: 0, hintLevel: 0, solved: false };

/** Worked guidance (rung 4) only after this many wrong attempts, and only after rung 3. */
export const WORKED_MIN_WRONG = 2;

export function afterAttempt(state: LadderState, ev: Evaluation): LadderState {
  if (ev.status === 'invalid' || state.solved) return state;
  if (ev.status === 'correct') return { ...state, attempts: state.attempts + 1, solved: true };
  return {
    attempts: state.attempts + 1,
    wrong: state.wrong + 1,
    hintLevel: Math.min(3, Math.max(state.hintLevel, 0) + 1) as HintLevel,
    solved: false,
  };
}

/** The student must try first; after that they can climb the ladder one rung at a time. */
export function canRequestHint(state: LadderState): boolean {
  if (state.solved || state.attempts === 0) return false;
  if (state.hintLevel < 3) return true;
  return state.hintLevel === 3 && state.wrong >= WORKED_MIN_WRONG;
}

export function requestHint(state: LadderState): LadderState {
  if (!canRequestHint(state)) return state;
  return { ...state, hintLevel: (state.hintLevel + 1) as HintLevel };
}
