/**
 * Prepared lessons. They work with no AI key at all, so the tutor and the explainer can always be shown, and they are the
 * examples the AI is taught from. Everything here is written by hand and checked by tests (tests/boardSamples.test.ts).
 * The vocabulary cards in Russian and Uzbek are drafts that a teacher still has to review.
 */
import type { Beat, LessonMeta, Op } from './script.ts';

export interface FollowUp {
  /** The question as the student would ask it (also the label of its chip). */
  q: string;
  beats: Beat[];
}
export interface Sample {
  id: string;
  meta: LessonMeta;
  beats: Beat[];
  followUps: FollowUp[];
  /** The student's first message in the tutor, when this sample is shown as a conversation. */
  opening: string;
}

const A = '#ff6b5b', B = '#7da2ff', C = '#2de2c4', Y = '#ffb547';
const col = (c: string, t: string) => `\\textcolor{${c}}{${t}}`;
const text = (id: string, x: number, y: number, t: string, o: Partial<Extract<Op, { op: 'text' }>> = {}): Op => ({ op: 'text', id, x, y, text: t, hand: true, ...o });

/* ---------------------------------------------------------------- the Pythagorean theorem */

const pythagoras: Sample = {
  id: 'pythagoras',
  opening: 'Explain the Pythagorean theorem.',
  meta: {
    title: 'The Pythagorean theorem',
    chapters: ['The idea', 'See it', 'Why it works', 'Try one'],
    try: { question: 'A right triangle has short sides 6 and 8. How long is the long side?', answer: '10', hint: '6 squared is 36 and 8 squared is 64. Together that is 100.' },
  },
  beats: [
    {
      chapter: 0,
      say: 'A right triangle has one square corner. The two sides that make the corner are shorter. We call them a and b. The long side across from the corner is c.',
      ops: [
        { op: 'poly', id: 'tri', points: [[200, 320], [200, 440], [360, 440]], ink: 'ink', fill: true },
        { op: 'poly', id: 'rt', points: [[200, 418], [222, 418], [222, 440]], ink: 'ink', close: false },
        text('la', 156, 366, 'a', { size: 'l' }),
        text('lb', 268, 468, 'b', { size: 'l' }),
        text('lc', 286, 362, 'c', { size: 'l', rotate: -37 }),
      ],
    },
    {
      chapter: 0,
      say: 'Now let us build a square on each side. The square on a is three by three. That is nine little tiles.',
      ops: [
        { op: 'poly', id: 'sqa', points: [[80, 320], [200, 320], [200, 440], [80, 440]], ink: 'coral', fill: true },
        { op: 'grid', id: 'ga', x: 80, y: 320, cols: 3, rows: 3, cell: 40, ink: 'coral' },
        text('n9', 116, 360, '9', { size: 'xl', ink: 'coral' }),
      ],
    },
    {
      chapter: 0,
      say: 'The square on b is four by four. That is sixteen tiles.',
      ops: [
        { op: 'poly', id: 'sqb', points: [[200, 440], [360, 440], [360, 600], [200, 600]], ink: 'blue', fill: true },
        { op: 'grid', id: 'gb', x: 200, y: 440, cols: 4, rows: 4, cell: 40, ink: 'blue' },
        text('n16', 252, 502, '16', { size: 'xl', ink: 'blue' }),
      ],
    },
    {
      chapter: 1,
      say: 'And the square on the long side, c, is five by five. That is twenty five tiles.',
      ops: [
        { op: 'poly', id: 'sqc', points: [[200, 320], [360, 440], [480, 280], [320, 160]], ink: 'teal', fill: true },
        text('n25', 322, 296, '25', { size: 'xl', ink: 'teal', rotate: -37 }),
      ],
    },
    {
      chapter: 1,
      say: 'Look at the numbers. Nine plus sixteen equals twenty five. The two small squares together have exactly as many tiles as the big one.',
      ops: [
        { op: 'math', id: 'eq', x: 560, y: 120, size: 'l', tex: `${col(A, 'a^2')}+${col(B, 'b^2')}=${col(C, 'c^2')}` },
        text('sum', 566, 214, '9 + 16 = 25 ✓', { size: 'l', ink: 'amber' }),
        { op: 'poly', id: 'ar1', points: [[110, 296], [124, 250], [160, 208], [210, 176], [262, 160], [304, 158]], ink: 'amber', dash: true, close: false, arrow: true },
        { op: 'poly', id: 'ar2', points: [[392, 560], [440, 524], [476, 462], [494, 390], [496, 336], [494, 318]], ink: 'amber', dash: true, close: false, arrow: true },
        { op: 'highlight', target: 'n25', ink: 'amber' },
      ],
    },
    {
      chapter: 2,
      say: 'This is true for every right triangle. Make it bigger or smaller, tilt it, flip it. The squares on the two short sides always add up to the square on the long side.',
      ops: [
        text('t1', 566, 300, 'True for every right triangle', { size: 'm', ink: 'mute', hand: false }),
        { op: 'terms', id: 'voc', x: 560, y: 350, items: [{ en: 'hypotenuse', ru: 'гипотенуза', uz: 'gipotenuza' }, { en: 'leg', ru: 'катет', uz: 'katet' }, { en: 'square', ru: 'квадрат', uz: 'kvadrat' }] },
      ],
    },
    {
      chapter: 2,
      say: 'That also shows why c is always the longest side. The square on c has to hold all the tiles of the other two squares together.',
      ops: [{ op: 'highlight', target: 'sqc', ink: 'teal' }, { op: 'highlight', target: 'lc', ink: 'amber' }],
    },
    {
      chapter: 3,
      say: 'Your turn. A right triangle has short sides six and eight. Square each one, add them, and ask yourself: what number times itself gives that total?',
      ops: [
        { op: 'math', id: 'q', x: 560, y: 450, size: 'l', tex: `6^2+8^2=${col(Y, 'c^2')}` },
        text('q2', 566, 530, 'c = ?', { size: 'l', ink: 'amber' }),
      ],
    },
  ],
  followUps: [
    {
      q: 'Why is c the longest side?',
      beats: [
        {
          say: 'Because the square on c holds all the tiles of the other two squares together. If c were shorter than one of the other sides, its square would be too small to hold that many tiles.',
          ops: [
            { op: 'poly', id: 'sa', points: [[120, 300], [260, 300], [260, 440], [120, 440]], ink: 'coral', fill: true },
            { op: 'poly', id: 'sb', points: [[300, 300], [440, 300], [440, 440], [300, 440]], ink: 'blue', fill: true },
            { op: 'text', id: 'pl', x: 266, y: 346, text: '+', size: 'xl', hand: true },
            { op: 'poly', id: 'sc', points: [[560, 250], [880, 250], [880, 570], [560, 570]], ink: 'teal', fill: true },
            text('bg', 650, 400, 'holds both', { size: 'l', ink: 'teal' }),
          ],
        },
      ],
    },
    {
      q: 'Show it with real numbers',
      beats: [
        {
          say: 'Try five, twelve and thirteen. Five squared is twenty five. Twelve squared is one hundred forty four. Together that is one hundred sixty nine, which is thirteen squared.',
          ops: [
            { op: 'math', id: 'n1', x: 120, y: 150, size: 'xl', tex: `5^2+12^2=13^2` },
            text('n2', 124, 270, '25 + 144 = 169 ✓', { size: 'xl', ink: 'teal' }),
            text('n3', 124, 380, 'Another one: 8, 15, 17', { size: 'l', ink: 'amber' }),
          ],
        },
      ],
    },
    {
      q: 'Where is this used?',
      beats: [
        {
          say: 'Builders use it all the time. A ladder leaning on a wall makes a right triangle. If the ladder is five metres long and its foot is three metres from the wall, it reaches four metres up.',
          ops: [
            { op: 'line', id: 'wall', x1: 560, y1: 120, x2: 560, y2: 560, ink: 'ink' },
            { op: 'line', id: 'floor', x1: 400, y1: 560, x2: 900, y2: 560, ink: 'ink' },
            { op: 'line', id: 'lad', x1: 560, y1: 200, x2: 800, y2: 560, ink: 'amber' },
            text('l5', 700, 340, '5 m', { size: 'l', ink: 'amber', rotate: 56 }),
            text('l3', 660, 590, '3 m', { size: 'l', ink: 'blue' }),
            text('l4', 496, 380, '4 m', { size: 'l', ink: 'coral' }),
          ],
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- quadratic equations */

const quadratic: Sample = {
  id: 'quadratic',
  opening: "I don't understand quadratic equations.",
  meta: {
    title: 'Quadratic equations',
    chapters: ['The equation', 'Find the numbers', 'Check on a graph', 'Try one'],
    try: { question: 'Solve x² − 7x + 12 = 0. What is the smaller answer?', answer: '3', hint: 'Which two numbers multiply to 12 and add up to 7?' },
  },
  beats: [
    {
      chapter: 0,
      say: 'Let us solve one together. Here it is: x squared minus five x plus six equals zero. We want the values of x that make this true.',
      ops: [{ op: 'math', id: 'eq1', x: 70, y: 100, size: 'xl', tex: 'x^2-5x+6=0' }],
    },
    {
      chapter: 1,
      say: 'The trick is to look for two numbers. They must multiply to make six, and add up to make five.',
      ops: [
        { op: 'line', id: 'arw', x1: 560, y1: 150, x2: 628, y2: 122, ink: 'teal', arrow: true },
        text('nt1', 640, 86, 'two numbers that', { size: 'l', ink: 'amber' }),
        text('nt2', 640, 142, '× make 6   + make 5', { size: 'm' }),
      ],
    },
    {
      chapter: 1,
      say: 'Try two and three. Two times three is six. Two plus three is five. Both work!',
      ops: [text('c1', 650, 214, '2 × 3 = 6  ✓', { size: 'l', ink: 'teal' }), text('c2', 650, 268, '2 + 3 = 5  ✓', { size: 'l', ink: 'teal' })],
    },
    {
      chapter: 1,
      say: 'So we can rewrite the equation: x minus two, times x minus three, equals zero.',
      ops: [{ op: 'math', id: 'eq2', x: 70, y: 250, size: 'xl', tex: `(x-${col(Y, '2')})(x-${col(Y, '3')})=0` }],
    },
    {
      chapter: 1,
      say: 'If two numbers multiply to zero, one of them must be zero. So x equals two, or x equals three.',
      ops: [
        { op: 'box', id: 'bx', x: 62, y: 372, w: 520, h: 104, ink: 'teal' },
        { op: 'math', id: 'eq3', x: 96, y: 392, size: 'xl', ink: 'teal', tex: 'x=2\\;\\text{or}\\;x=3' },
      ],
    },
    {
      chapter: 2,
      say: 'Let us check on a graph. The curve crosses the x axis exactly at two and at three. Those crossing points are the answers.',
      ops: [{ op: 'graph', id: 'gr', x: 640, y: 330, w: 320, h: 230, fn: 'x^2-5x+6', xmin: -0.5, xmax: 5.5, ymin: -1.5, ymax: 8, ink: 'lilac', marks: [2, 3], label: 'y = x² − 5x + 6' }],
    },
    {
      chapter: 2,
      say: 'A few words that will help you, in three languages.',
      ops: [{ op: 'terms', id: 'voc', x: 40, y: 520, items: [{ en: 'equation', ru: 'уравнение', uz: 'tenglama' }, { en: 'solution', ru: 'решение', uz: 'yechim' }, { en: 'product', ru: 'произведение', uz: 'ko‘paytma' }, { en: 'sum', ru: 'сумма', uz: 'yig‘indi' }] }],
    },
    {
      chapter: 3,
      say: 'Your turn. Solve x squared minus seven x plus twelve equals zero. Which two numbers multiply to twelve and add up to seven?',
      ops: [
        { op: 'clear' },
        { op: 'math', id: 'q1', x: 70, y: 110, size: 'xl', tex: 'x^2-7x+12=0' },
        text('q2', 74, 230, 'which two numbers:', { size: 'l', ink: 'amber' }),
        text('q3', 74, 290, '× make 12      + make 7', { size: 'l' }),
      ],
    },
  ],
  followUps: [
    {
      q: 'Why multiply to 6?',
      beats: [
        {
          say: 'Great question. When we multiply out x minus p, times x minus q, the last number we get is always p times q. So the two numbers must multiply to the last number in the equation, which is six.',
          ops: [
            { op: 'math', id: 'f1', x: 70, y: 120, size: 'xl', tex: '(x-p)(x-q)' },
            { op: 'math', id: 'f2', x: 70, y: 250, size: 'xl', tex: `=x^2-(p+q)x+${col(Y, 'pq')}` },
            text('f3', 74, 380, 'the last number is p × q', { size: 'l', ink: 'amber' }),
            text('f4', 74, 440, 'the middle number is p + q (with a minus)', { size: 'm' }),
          ],
        },
      ],
    },
    {
      q: 'Show a graph',
      beats: [
        {
          say: 'Here is the graph of y equals x squared minus five x plus six. Wherever the curve touches the x axis, y is zero, so that x is a solution. It touches at two and at three.',
          ops: [{ op: 'graph', id: 'g2', x: 160, y: 90, w: 640, h: 440, fn: 'x^2-5x+6', xmin: -1, xmax: 6, ymin: -2, ymax: 10, ink: 'lilac', marks: [2, 3], label: 'y = x² − 5x + 6' }],
        },
      ],
    },
    {
      q: 'Another example',
      beats: [
        {
          say: 'Let us try x squared minus seven x plus twelve. We need two numbers that multiply to twelve and add up to seven. Three and four do it. So x equals three, or x equals four.',
          ops: [
            { op: 'math', id: 'a1', x: 70, y: 100, size: 'xl', tex: 'x^2-7x+12=0' },
            text('a2', 74, 220, '3 × 4 = 12 ✓     3 + 4 = 7 ✓', { size: 'l', ink: 'teal' }),
            { op: 'math', id: 'a3', x: 70, y: 310, size: 'xl', tex: `(x-${col(Y, '3')})(x-${col(Y, '4')})=0` },
            { op: 'box', id: 'a4', x: 62, y: 432, w: 520, h: 104, ink: 'teal' },
            { op: 'math', id: 'a5', x: 96, y: 452, size: 'xl', ink: 'teal', tex: 'x=3\\;\\text{or}\\;x=4' },
          ],
        },
      ],
    },
  ],
};

export const SAMPLES: Sample[] = [pythagoras, quadratic];
export const sampleById = (id: string): Sample | undefined => SAMPLES.find((s) => s.id === id);

/** The sample that best matches what the student typed, if any ("pythagoras", "теорема пифагора", "quadratic equations"...). */
export function sampleFor(topic: string): Sample | undefined {
  const t = topic.toLowerCase();
  if (/pyth|pifag|пифагор|гипотенуз|hypoten/.test(t)) return pythagoras;
  if (/quadrat|kvadrat tenglama|квадратн|x\^?2|x²|дискриминант|diskriminant/.test(t)) return quadratic;
  return undefined;
}
