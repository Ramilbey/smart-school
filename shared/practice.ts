import { lineEq, num, pt } from './format.ts';
import type { Lang, Text, Visual } from './types.ts';

/** A generated practice item for Grade 7 targeted practice. Checked deterministically on the client. */
export interface PracticeItem {
  id: string;
  skill: string;
  prompt: Text;
  answer: number;
  answerLabel: string;
  hint: Text;
  solution: Text;
  visual?: Visual;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, xs: T[]): T => xs[Math.floor(r() * xs.length)];
const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

/** Builds a Text by calling the template once per language. */
const T = (f: (lang: Lang) => string): Text => ({ uz: f('uz'), ru: f('ru'), en: f('en') });

/** Wraps negative numbers in brackets: "(−2)", "3". */
const par = (n: number, l: Lang) => (n < 0 ? `(${num(n, l)})` : num(n, l));
/** "x", "−x", "3x". */
const kx = (k: number, l: Lang) => (k === 1 ? 'x' : k === -1 ? '\u2212x' : `${num(k, l)}x`);

type Gen = (r: () => number, id: string) => PracticeItem;

const generators: Record<string, Gen> = {
  slope(r, id) {
    const k = pick(r, [-3, -2, -1, 1, 2, 3]);
    const b = int(r, -3, 3);
    const x1 = int(r, -3, 0);
    const x2 = x1 + pick(r, [1, 2, 3]);
    const y1 = k * x1 + b;
    const y2 = k * x2 + b;
    const dx = x2 - x1;
    const dy = y2 - y1;
    return {
      id,
      skill: 'slope',
      answer: k,
      answerLabel: 'k',
      prompt: T((l) =>
        ({
          uz: `To‘g‘ri chiziq P${pt(x1, y1, l)} va Q${pt(x2, y2, l)} nuqtalardan o‘tadi. k ni toping.`,
          ru: `Прямая проходит через точки P${pt(x1, y1, l)} и Q${pt(x2, y2, l)}. Найдите k.`,
          en: `A line passes through P${pt(x1, y1, l)} and Q${pt(x2, y2, l)}. Find k.`,
        })[l],
      ),
      hint: T((l) =>
        ({
          uz: 'k = Δy / Δx = (y₂ − y₁) / (x₂ − x₁). Ikkala ayirmani bir xil tartibda oling.',
          ru: 'k = Δy / Δx = (y₂ − y₁) / (x₂ − x₁). Вычитайте в одном и том же порядке.',
          en: 'k = Δy / Δx = (y₂ − y₁) / (x₂ − x₁). Subtract in the same order both times.',
        })[l],
      ),
      solution: T(
        (l) =>
          `Δx = ${num(x2, l)} − ${par(x1, l)} = ${num(dx, l)}, Δy = ${num(y2, l)} − ${par(y1, l)} = ${num(dy, l)}, k = ${num(dy, l)} / ${num(dx, l)} = ${num(k, l)}.`,
      ),
      visual: { type: 'two-points', a: [x1, y1], b: [x2, y2], showDelta: true },
    };
  },

  substitute(r, id) {
    const k = pick(r, [-3, -2, -1, 1, 2, 3]);
    const b = int(r, -4, 4);
    const x0 = pick(r, [-2, -1, 1, 2]);
    const y0 = k * x0 + b;
    return {
      id,
      skill: 'substitute',
      answer: b,
      answerLabel: 'b',
      prompt: T((l) =>
        ({
          uz: `y = ${kx(k, l)} + b grafigi ${pt(x0, y0, l)} nuqtadan o‘tadi. b ni toping.`,
          ru: `График y = ${kx(k, l)} + b проходит через точку ${pt(x0, y0, l)}. Найдите b.`,
          en: `The graph of y = ${kx(k, l)} + b passes through ${pt(x0, y0, l)}. Find b.`,
        })[l],
      ),
      hint: T((l) =>
        ({
          uz: `Nuqtaning koordinatalarini qo‘ying: ${num(y0, l)} = ${num(k, l)}·(${num(x0, l)}) + b.`,
          ru: `Подставьте координаты точки: ${num(y0, l)} = ${num(k, l)}·(${num(x0, l)}) + b.`,
          en: `Substitute the point: ${num(y0, l)} = ${num(k, l)}·(${num(x0, l)}) + b.`,
        })[l],
      ),
      solution: T(
        (l) =>
          `${num(y0, l)} = ${num(k * x0, l)} + b → b = ${num(y0, l)} − ${par(k * x0, l)} = ${num(b, l)}.`,
      ),
    };
  },

  root(r, id) {
    const k = pick(r, [-3, -2, -1, 1, 2, 3]);
    const x0 = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4]);
    const b = -k * x0;
    return {
      id,
      skill: 'root',
      answer: x0,
      answerLabel: 'x',
      prompt: T((l) =>
        ({
          uz: `${lineEq(k, b, l)} grafigi Ox o‘qini qayerda kesadi? x ni kiriting.`,
          ru: `Где график ${lineEq(k, b, l)} пересекает ось Ox? Введите x.`,
          en: `Where does ${lineEq(k, b, l)} cross the x-axis? Enter x.`,
        })[l],
      ),
      hint: T((l) =>
        ({
          uz: 'Ox o‘qida y = 0. kx + b = 0 tenglamani yeching.',
          ru: 'На оси Ox y = 0. Решите уравнение kx + b = 0.',
          en: 'On the x-axis, y = 0. Solve kx + b = 0.',
        })[l],
      ),
      solution: T(
        (l) =>
          `${kx(k, l)} ${b < 0 ? '−' : '+'} ${num(Math.abs(b), l)} = 0 → ${kx(k, l)} = ${num(-b, l)} → x = ${num(x0, l)}.`,
      ),
      visual: { type: 'line', k, b },
    };
  },

  'read-kb'(r, id) {
    const k = pick(r, [-4, -3, -2, 2, 3, 4]);
    const b = pick(r, [-5, -3, -1, 1, 2, 5]);
    // Written with the constant first, a classic trap.
    const written = (l: Lang) => `y = ${num(b, l)} ${k < 0 ? '−' : '+'} ${num(Math.abs(k), l)}x`;
    return {
      id,
      skill: 'read-kb',
      answer: k,
      answerLabel: 'k',
      prompt: T((l) =>
        ({
          uz: `${written(l)} funksiyada k nimaga teng?`,
          ru: `Чему равен k в функции ${written(l)}?`,
          en: `In ${written(l)}, what is k?`,
        })[l],
      ),
      hint: T((l) =>
        ({
          uz: 'k — x ga ko‘paytirilgan son, ishorasi bilan birga. Qo‘shiluvchilar tartibi muhim emas.',
          ru: 'k — число, умноженное на x, вместе со знаком. Порядок слагаемых не важен.',
          en: 'k is the number multiplied by x, together with its sign. The order of the terms does not matter.',
        })[l],
      ),
      solution: T((l) => `${written(l)} = ${lineEq(k, b, l)} → k = ${num(k, l)}, b = ${num(b, l)}.`),
    };
  },

  graph(r, id) {
    const k = pick(r, [-2, -1, 1, 2]);
    const b = int(r, -3, 3);
    return {
      id,
      skill: 'graph',
      answer: b,
      answerLabel: 'b',
      prompt: T((l) =>
        ({
          uz: 'Grafik bo‘yicha b ni toping.',
          ru: 'Найдите b по графику.',
          en: 'Find b from the graph.',
        })[l],
      ),
      hint: T((l) =>
        ({
          uz: 'b — chiziq Oy o‘qini kesib o‘tadigan nuqtaning y qiymati.',
          ru: 'b — значение y в точке, где прямая пересекает ось Oy.',
          en: 'b is the y-value where the line crosses the y-axis.',
        })[l],
      ),
      solution: T((l) => `${lineEq(k, b, l)}: ${pt(0, b, l)} → b = ${num(b, l)}.`),
      visual: { type: 'line', k, b },
    };
  },

  parallel(r, id) {
    const k = pick(r, [-3, -2, -1, 1, 2, 3]);
    const c = int(r, -3, 3);
    const x0 = pick(r, [-2, -1, 1, 2]);
    const b = int(r, -4, 4);
    const y0 = k * x0 + b;
    return {
      id,
      skill: 'parallel',
      answer: b,
      answerLabel: 'b',
      prompt: T((l) =>
        ({
          uz: `To‘g‘ri chiziq ${lineEq(k, c, l)} ga parallel va ${pt(x0, y0, l)} nuqtadan o‘tadi. Uning b sini toping.`,
          ru: `Прямая параллельна ${lineEq(k, c, l)} и проходит через точку ${pt(x0, y0, l)}. Найдите её b.`,
          en: `A line is parallel to ${lineEq(k, c, l)} and passes through ${pt(x0, y0, l)}. Find its b.`,
        })[l],
      ),
      hint: T((l) =>
        ({
          uz: `Parallel chiziqlarning k si bir xil: k = ${num(k, l)}. Endi nuqtani qo‘ying.`,
          ru: `У параллельных прямых одинаковый k: k = ${num(k, l)}. Теперь подставьте точку.`,
          en: `Parallel lines share the same k: k = ${num(k, l)}. Now substitute the point.`,
        })[l],
      ),
      solution: T(
        (l) => `k = ${num(k, l)}; ${num(y0, l)} = ${num(k * x0, l)} + b → b = ${num(b, l)}.`,
      ),
    };
  },
};

export const PRACTICE_SKILLS = Object.keys(generators);

/** Three practice items for one skill. The same seed always gives the same items. */
export function makePractice(skill: string, seed: number, count = 3): PracticeItem[] {
  const gen = generators[skill] ?? generators.slope;
  const r = rng(seed);
  const items: PracticeItem[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (items.length < count && guard++ < 50) {
    const item = gen(r, `${skill}-${seed}-${items.length}`);
    // Graph items share one prompt, so the picture is part of what makes an item distinct.
    const key = `${item.prompt.en}|${JSON.stringify(item.visual ?? null)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }
  return items;
}
