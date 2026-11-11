// Shared content model used by the Mini App (rendering, answer checking)
// and the server (tutor grounding, re-checking answers).

export type Lang = 'uz' | 'ru' | 'en';
export const LANGS: Lang[] = ['uz', 'ru', 'en'];

/** A string in every supported language. */
export type Text = Record<Lang, string>;

export const tx = (text: Text | string, lang: Lang): string =>
  typeof text === 'string' ? text : text[lang] ?? text.en;

/** Declarative visuals, rendered by the client. */
export type Visual =
  | { type: 'pie'; parts: number; filled: number; marked?: 'eaten' }
  | { type: 'bar'; parts: number; filled: number; marked?: 'eaten' }
  | { type: 'split'; shape: 'circle' | 'rect'; cuts: number[]; filled: number[] }
  | { type: 'compare-bars'; fractions: [number, number][] }
  | { type: 'compare-pies'; parts: number[] }
  | { type: 'line'; k: number; b: number }
  | { type: 'two-points'; a: [number, number]; b: [number, number]; showDelta?: boolean };

export interface Choice {
  id: string;
  label?: Text | string;
  visual?: Visual;
  /** Misconception this distractor indicates, for feedback and analytics. */
  misconception?: string;
}

export interface NumberField {
  id: string;
  label: Text | string;
  answer: number;
}

/** A misconception rule: matches when every listed field equals the given value. */
export interface MisconceptionRule {
  id: string;
  when: Record<string, number | string>;
  feedback: Text;
}

/**
 * A homework-style problem with a four-rung hint ladder:
 * 1 concept nudge, 2 visual example, 3 next step, 4 worked guidance (only after real attempts).
 */
export interface GuidedProblem {
  id: string;
  lessonId: string;
  prompt: Text;
  input:
    | { kind: 'numbers'; fields: NumberField[] }
    | { kind: 'choice'; choices: Choice[]; correct: string };
  misconceptions: MisconceptionRule[];
  /** Fallback feedback per field when no rule matches (numbers only). */
  fieldFeedback?: Record<string, Text>;
  hints: [Text, Text, Text, Text];
  /** Visual shown with hint 2 and with the explanation. */
  hintVisual?: Visual;
  explanation: Text;
}

export interface QuizQuestion {
  id: string;
  skill: string;
  prompt: Text;
  visual?: Visual;
  choices: Choice[];
  correct: string;
  explanation: Text;
  /** Render choices as a grid of pictures. */
  pictureChoices?: boolean;
}

export interface Skill {
  id: string;
  name: Text;
  /** Where to review this skill inside the lesson. */
  review: string;
}

export interface Misconception {
  id: string;
  name: Text;
}

/** Status of curriculum content, shown to students and teachers. Never claim approval that did not happen. */
export type ContentStatus = 'draft-unreviewed' | 'teacher-reviewed' | 'approved';
