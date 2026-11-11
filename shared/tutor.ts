import { WORKED_MIN_WRONG, type AttemptInput, type Evaluation, type HintLevel } from './check.ts';
import type { GuidedProblem, Lang, Text } from './types.ts';
import { tx } from './types.ts';

/** Request from the Mini App to POST /api/tutor. */
export interface TutorRequest {
  problemId: string;
  lang: Lang;
  kind: 'attempt' | 'question';
  input?: AttemptInput;
  question?: string;
  ladder: { wrong: number; hintLevel: HintLevel; solved: boolean };
}

export interface TutorResponse {
  /** ai: phrased by the live model (guarded); curated: predefined lesson text; unavailable: no live tutor for free questions. */
  source: 'ai' | 'curated' | 'unavailable';
  message: string;
  status?: Evaluation['status'];
}

export const QUESTION_MAX_CHARS = 300;

const notYet: Text = {
  uz: 'Hali to‘g‘ri emas.',
  ru: 'Пока неверно.',
  en: 'Not quite yet.',
};

/** Rung 4 is never shown before real attempts, whatever the client claims. */
export function safeLevel(level: number, wrong: number): HintLevel {
  const capped = Math.max(0, Math.min(4, Math.floor(level || 0)));
  if (capped === 4 && wrong < WORKED_MIN_WRONG) return 3;
  return capped as HintLevel;
}

/** The deterministic, predefined tutor reply. Always available, even offline. */
export function curatedReply(problem: GuidedProblem, ev: Evaluation, level: HintLevel, lang: Lang): string {
  if (ev.status === 'correct') return tx(problem.explanation, lang);
  const feedback = tx(ev.feedback ?? problem.fieldFeedback?.[firstWrongField(ev) ?? ''] ?? notYet, lang);
  const hint = level > 0 ? tx(problem.hints[level - 1], lang) : '';
  return hint ? `${feedback} ${hint}` : feedback;
}

function firstWrongField(ev: Evaluation): string | undefined {
  if (!ev.fields) return undefined;
  return Object.entries(ev.fields).find(([, r]) => r === 'incorrect')?.[0];
}

/** Values the tutor must not state before the student has solved the problem (unless rung 4). */
export function forbiddenAnswers(problem: GuidedProblem, lang: Lang): { fields: [string, number][]; labels: string[] } {
  if (problem.input.kind === 'numbers') {
    return { fields: problem.input.fields.map((f) => [f.id, f.answer]), labels: [] };
  }
  const { choices, correct } = problem.input;
  const choice = choices.find((c) => c.id === correct);
  const label = choice?.label ? tx(choice.label, lang) : '';
  return { fields: [], labels: label ? [label] : [] };
}

const numberPattern = (n: number) => {
  const abs = Math.abs(n);
  const body = String(abs).replace('.', '[.,]');
  return n < 0 ? `[-−–]\\s?${body}` : `(?<![-−–\\d.,])${body}`;
};

/** Not followed by more digits or a decimal part. A sentence-ending full stop is fine. */
const END = '(?!\\d|[.,]\\d)';

/**
 * Guardrail for model output: true if the text reveals the answer.
 * A number counts as revealed when it is stated as a field value ("k = −2") or,
 * for single-number problems, when it appears although neither the problem nor the hint mentions it.
 */
export function revealsAnswer(text: string, problem: GuidedProblem, lang: Lang, context: string): boolean {
  const { fields, labels } = forbiddenAnswers(problem, lang);
  for (const [id, value] of fields) {
    const assign = new RegExp(`\\b${id}\\s*=\\s*${numberPattern(value)}${END}`, 'i');
    if (assign.test(text)) return true;
    if (fields.length === 1) {
      // A fraction like "5/8" is not the same as stating the count 5.
      const standalone = new RegExp(`${numberPattern(value)}${END}(?!\\/)`);
      const contextHasIt = standalone.test(context);
      if (!contextHasIt && standalone.test(text)) return true;
    }
  }
  if (problem.input.kind === 'numbers' && fields.length === 2) {
    // "y = −2x + 2" style full equation
    const [[, k], [, b]] = fields;
    const eq = new RegExp(`${numberPattern(k)}\\s*x\\s*[+\\-−]\\s*${String(Math.abs(b))}${END}`);
    if (eq.test(text)) return true;
  }
  for (const label of labels) {
    if (label && text.toLowerCase().includes(label.toLowerCase())) return true;
  }
  return false;
}

const numbersIn = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.'));

/** Unit facts a hint may always use: 1 km = 1000 m, 1 hour = 60 minutes, 100%. */
const UNIT_FACTS = ['1', '10', '60', '100', '1000'];

/**
 * Guard for free-form chat replies, which have no answer key for `revealsAnswer` to check against.
 * A question with numbers in it is probably homework, so the reply may only use the student's numbers, the lesson's,
 * or unit facts: any other number is most likely a result the student was meant to work out. It reads no words,
 * so it works the same in every language. It is a heuristic: a result spelled out in words gets past it,
 * which is why the prompt also tells the model not to calculate.
 */
export function givesHomeworkAnswer(reply: string, question: string, lesson = ''): boolean {
  const given = numbersIn(question);
  if (given.length === 0) return false;
  const known = new Set([...given, ...numbersIn(lesson), ...UNIT_FACTS]);
  return numbersIn(reply).some((n) => !known.has(n));
}

/** Basic sanity checks on generated text before it reaches a child. */
export function acceptableText(text: string, lang: Lang, maxChars: number): boolean {
  const t = text.trim();
  if (!t || t.length > maxChars) return false;
  if (/[<>{}`]|https?:\/\//.test(t)) return false;
  const cyr = (t.match(/[Ѐ-ӿ]/g) ?? []).length;
  const lat = (t.match(/[A-Za-z]/g) ?? []).length;
  // Formulas use Latin letters, so allow some; but the prose must be in the requested script.
  if (lang === 'ru' && (cyr === 0 || cyr < lat / 2)) return false;
  if (lang !== 'ru' && cyr > lat / 4) return false;
  return true;
}
