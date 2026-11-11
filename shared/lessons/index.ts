import type { GuidedProblem, Text } from '../types.ts';
import { g4Homework, g4Meta, g4Summary } from './g4Fractions.ts';
import { g7Meta, g7Problem } from './g7Linear.ts';

export interface LessonInfo {
  id: string;
  grade: number;
  subject: Text;
  title: Text;
  objective: Text;
  /** Key ideas the tutor may draw on. Nothing outside these. */
  keyIdeas: Text[];
}

export const lessons: Record<string, LessonInfo> = {
  [g4Meta.id]: {
    id: g4Meta.id,
    grade: g4Meta.grade,
    subject: g4Meta.subject,
    title: g4Meta.title,
    objective: g4Meta.objective,
    keyIdeas: g4Summary,
  },
  [g7Meta.id]: {
    id: g7Meta.id,
    grade: g7Meta.grade,
    subject: g7Meta.subject,
    title: g7Meta.title,
    objective: g7Meta.objective,
    keyIdeas: [
      {
        uz: 'y = kx + b da k — burchak koeffitsienti: x 1 ga oshganda y k ga o‘zgaradi.',
        ru: 'В y = kx + b коэффициент k — угловой: при увеличении x на 1 значение y меняется на k.',
        en: 'In y = kx + b, k is the slope: when x increases by 1, y changes by k.',
      },
      {
        uz: 'b — chiziqning Oy o‘qi bilan kesishish nuqtasidagi y qiymati (x = 0 da).',
        ru: 'b — значение y в точке пересечения прямой с осью Oy (при x = 0).',
        en: 'b is the y-value where the line crosses the y-axis (at x = 0).',
      },
      {
        uz: 'Ikki nuqta orqali: k = Δy / Δx, keyin b ni bitta nuqtani qo‘yib topamiz.',
        ru: 'По двум точкам: k = Δy / Δx, затем b находим подстановкой одной точки.',
        en: 'From two points: k = Δy / Δx, then find b by substituting one point.',
      },
      {
        uz: 'k bir xil bo‘lgan chiziqlar parallel; Ox bilan kesishish kx + b = 0 tenglamaning yechimi.',
        ru: 'Прямые с одинаковым k параллельны; пересечение с Ox — корень уравнения kx + b = 0.',
        en: 'Lines with equal k are parallel; the x-intercept solves kx + b = 0.',
      },
    ],
  },
};

export const guidedProblems: Record<string, GuidedProblem> = Object.fromEntries(
  [...g4Homework, g7Problem].map((p) => [p.id, p]),
);
