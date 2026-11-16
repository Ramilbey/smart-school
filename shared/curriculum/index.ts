// The Grade 6–7 course: subjects, topics, and repeatable question picks.

import { g6Topics } from './g6Math.ts';
import { g7AlgebraTopics } from './g7Algebra.ts';
import { g7GeometryTopics } from './g7Geometry.ts';
import { g7PhysicsTopics } from './g7Physics.ts';
import { T, hashString, rng, type Question, type Subject, type SubjectId, type Topic } from './types.ts';

export * from './types.ts';
export { visualSvg, visualSvgPlain, visualSvgDark, VISUAL_H, VISUAL_W } from './visuals.ts';

export const subjects: Subject[] = [
  { id: 'math6', grade: 6, emoji: '🧮', title: T('Matematika', 'Математика', 'Mathematics'), book: 'Matematika 6 (Novda Edutainment, 2024)' },
  { id: 'algebra7', grade: 7, emoji: '📜', title: T('Algebra', 'Алгебра', 'Algebra'), book: 'Algebra 7 (Akmalov va b., RTM, 2022)' },
  { id: 'geometry7', grade: 7, emoji: '📐', title: T('Geometriya', 'Геометрия', 'Geometry'), book: 'Geometriya 7 (Xaydarov va b., RTM, 2022)' },
  { id: 'physics7', grade: 7, emoji: '⚡', title: T('Fizika', 'Физика', 'Physics'), book: 'Fizika 7 (Suyarov va b., RTM, 2022)' },
];

export const topics: Topic[] = [...g6Topics, ...g7AlgebraTopics, ...g7GeometryTopics, ...g7PhysicsTopics];

const byId = new Map(topics.map((t) => [t.id, t]));
export const topicById = (id: string) => byId.get(id);
export const topicsOf = (subject: SubjectId) => topics.filter((t) => t.subject === subject);
export const topicsForGrade = (grade: number) => topics.filter((t) => t.grade === grade);
export const subjectsForGrade = (grade: number) => subjects.filter((s) => s.grade === grade);
export const nextTopic = (id: string) => {
  const t = byId.get(id);
  if (!t) return undefined;
  const list = topicsOf(t.subject);
  return list[list.indexOf(t) + 1];
};

/** How many questions a practice round has. */
export const ROUND = 5;

/**
 * The i-th question of a round. The same (topic, seed, i) always gives the same question,
 * so a button pressed later, even after a server restart, still refers to the same question.
 * A round walks through the topic's question types so students meet all of them.
 */
export function questionFor(topic: Topic, seed: number, i: number): Question {
  const base = hashString(`${topic.id}:${seed}`);
  const gen = topic.gens[(base + i) % topic.gens.length];
  return gen(rng(base + i * 7919));
}

/** The same question for every student of a grade on a given day. */
export function dailyFor(grade: number, day: string): { topic: Topic; seed: number } {
  const list = topicsForGrade(grade);
  const h = hashString(`daily:${grade}:${day}`);
  return { topic: list[h % list.length], seed: h % 1_000_000 };
}

/** A keyword must start a word; a short one must be the whole word, so "salom" never finds "Om qonuni". */
const matches = (text: string, keyword: string) => {
  if (!/\p{L}/u.test(keyword)) return text.includes(keyword);
  const k = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<!\\p{L})${k}${keyword.length <= 3 ? '(?!\\p{L})' : ''}`, 'u').test(text);
};

/** Finds a topic from the words a student typed. Longest keyword wins, within the student's grade first. */
export function findTopic(textRaw: string, grade: number | null): Topic | undefined {
  const text = textRaw.toLowerCase();
  let best: Topic | undefined;
  let bestScore = 0;
  for (const t of topics) {
    for (const k of t.keywords) {
      if (!matches(text, k)) continue;
      const score = k.length * 2 + (grade === t.grade ? 1 : 0);
      if (score > bestScore) {
        best = t;
        bestScore = score;
      }
    }
  }
  return best;
}
