import { g7Quiz, g7Sections, g7Skills, type SectionId } from '../../../shared/lessons/g7Linear.ts';
import type { Progress } from '../../lib/store.tsx';

/** Skill-level indicator from the latest check plus targeted practice. Quiz answers are evidence, not a full measure. */
export function skillScores(p: Progress): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const s of g7Skills) {
    const qs = g7Quiz.filter((q) => q.skill === s.id);
    const last = p.acad.quiz.last;
    const quiz = last && qs.length ? qs.filter((q) => last[q.id] === q.correct).length / qs.length : null;
    const pr = p.acad.practice[s.id];
    const practice = pr && pr.attempted ? pr.correct / pr.attempted : null;
    out[s.id] = quiz === null ? practice : practice === null ? quiz : Math.max(quiz, practice);
  }
  return out;
}

export function topicMastery(p: Progress): number | null {
  const vals = Object.values(skillScores(p)).filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

export function misconceptionsFrom(answers: Record<string, string> | null): string[] {
  if (!answers) return [];
  const ids = new Set<string>();
  for (const q of g7Quiz) {
    const choice = q.choices.find((c) => c.id === answers[q.id]);
    if (choice && choice.id !== q.correct && choice.misconception) ids.add(choice.misconception);
  }
  return [...ids];
}

export function nextSection(p: Progress): SectionId {
  return g7Sections.find((s) => !p.acad.sections[s.id])?.id ?? 'check';
}
