// Grade 7 Geometry. Follows the chapters of "Geometriya 7" (Xaydarov et al., Respublika ta'lim markazi, 2022).
// Own wording and own numbers. Draft: awaiting teacher review.

import { Q, S, T, int, pick, type Gen, type Topic } from './types.ts';

const ACUTE = T('O‘tkir', 'Острый', 'Acute');
const RIGHT = T('To‘g‘ri', 'Прямой', 'Right');
const OBTUSE = T('O‘tmas', 'Тупой', 'Obtuse');
const STRAIGHT = T('Yoyiq', 'Развёрнутый', 'Straight');

const angles: Gen[] = [
  (r) => {
    const deg = pick(r, [25, 35, 45, 60, 70, 90, 100, 120, 135, 150, 180]);
    const answer = deg < 90 ? ACUTE : deg === 90 ? RIGHT : deg < 180 ? OBTUSE : STRAIGHT;
    return Q(r, {
      prompt: T(`Bu ${deg}° li burchak. U qanday burchak?`, `Это угол ${deg}°. Какой это угол?`, `This angle is ${deg}°. What kind of angle is it?`),
      visual: { t: 'angle', deg },
      answer,
      wrong: [ACUTE, RIGHT, OBTUSE, STRAIGHT].filter((c) => c !== answer),
      hints: [
        T('90° bilan solishtiring.', 'Сравни с 90°.', 'Compare it with 90°.'),
        T('90° dan kichik — o‘tkir, 90° — to‘g‘ri, 90° dan katta — o‘tmas, 180° — yoyiq.', 'Меньше 90° — острый, 90° — прямой, больше 90° — тупой, 180° — развёрнутый.', 'Under 90° is acute, 90° is right, over 90° is obtuse, 180° is straight.'),
      ],
      explain: T(`${deg}° — ${answer.uz.toLowerCase()} burchak.`, `${deg}° — ${answer.ru.toLowerCase()} угол.`, `${deg}° is ${answer.en === 'Right' ? 'a right' : answer.en === 'Straight' ? 'a straight' : `an ${answer.en.toLowerCase()}`} angle.`),
    });
  },
  (r) => {
    const a = int(r, 3, 15) * 10, ans = 180 - a;
    return Q(r, {
      prompt: T('Qo‘shni burchaklar. Noma’lum burchakni toping.', 'Смежные углы. Найди неизвестный угол.', 'These are adjacent angles. Find the unknown angle.'),
      visual: { t: 'straight', a: `${a}°`, b: '?', ask: 'b', split: ans },
      answer: `${ans}°`,
      wrong: [`${a}°`, `${360 - a}°`, `${ans + 10}°`, `${ans - 10}°`],
      hints: [
        T('Qo‘shni burchaklar birgalikda yoyiq burchak hosil qiladi.', 'Смежные углы вместе образуют развёрнутый угол.', 'Adjacent angles together make a straight angle.'),
        S(`180° − ${a}°`),
      ],
      explain: S(`180° − ${a}° = ${ans}°`),
    });
  },
  (r) => {
    const a = int(r, 3, 15) * 10;
    return Q(r, {
      prompt: T('Ikki to‘g‘ri chiziq kesishdi. Noma’lum vertikal burchak nechaga teng?', 'Две прямые пересеклись. Чему равен неизвестный вертикальный угол?', 'Two lines cross. What is the unknown vertical angle?'),
      visual: { t: 'cross', deg: a, a: `${a}°`, b: '?', ask: 'b' },
      answer: `${a}°`,
      wrong: [`${180 - a}°`, `${360 - a}°`, `${a + 10}°`, `${90}°`],
      hints: [
        T('Vertikal burchaklar bir-biriga qarama-qarshi turadi.', 'Вертикальные углы стоят напротив друг друга.', 'Vertical angles sit opposite each other.'),
        T('Vertikal burchaklar har doim teng.', 'Вертикальные углы всегда равны.', 'Vertical angles are always equal.'),
      ],
      explain: T(`Vertikal burchaklar teng: ${a}°.`, `Вертикальные углы равны: ${a}°.`, `Vertical angles are equal: ${a}°.`),
    });
  },
];

const triangles: Gen[] = [
  (r) => {
    const a = int(r, 3, 8) * 10, b = int(r, 3, 8) * 10, ans = 180 - a - b;
    return Q(r, {
      prompt: T('Uchburchakning uchinchi burchagini toping.', 'Найди третий угол треугольника.', 'Find the third angle of the triangle.'),
      visual: { t: 'triangle', deg: [a, b, ans], a: `${a}°`, b: `${b}°`, c: '?' },
      answer: `${ans}°`,
      wrong: [`${360 - a - b}°`, `${a + b}°`, `${ans + 10}°`, `${ans + 20}°`],
      hints: [
        T('Ichki burchaklar yig‘indisi 180°.', 'Сумма внутренних углов равна 180°.', 'The inside angles add up to 180°.'),
        S(`180° − ${a}° − ${b}°`),
      ],
      explain: S(`180° − ${a}° − ${b}° = ${ans}°`),
    });
  },
  (r) => {
    const top = pick(r, [20, 40, 60, 80, 100, 120]), base = (180 - top) / 2;
    return Q(r, {
      prompt: T('Teng yonli uchburchak. Uchidagi burchak berilgan. Asosidagi burchak nechaga teng?', 'Равнобедренный треугольник. Дан угол при вершине. Чему равен угол при основании?', 'An isosceles triangle. The top angle is given. What is a base angle?'),
      visual: { t: 'triangle', deg: [base, base, top], a: '?', b: '?', c: `${top}°`, equal: true },
      answer: `${base}°`,
      wrong: [`${180 - top}°`, `${top}°`, `${base + 10}°`, `${base - 10}°`],
      hints: [
        T('Teng yonli uchburchakda asosdagi ikki burchak teng.', 'В равнобедренном треугольнике два угла при основании равны.', 'In an isosceles triangle the two base angles are equal.'),
        S(`(180° − ${top}°) : 2`),
      ],
      explain: S(`(180° − ${top}°) : 2 = ${base}°`),
    });
  },
  (r) => {
    const kind = pick(r, ['acute', 'right', 'obtuse'] as const);
    const [a, b] = kind === 'right' ? [90, pick(r, [30, 40, 50, 60])] : kind === 'obtuse' ? [pick(r, [100, 110, 120]), pick(r, [20, 30, 40])] : [pick(r, [50, 70]), pick(r, [50, 60, 70])];
    const c = 180 - a - b;
    const O = T('O‘tkir burchakli', 'Остроугольный', 'Acute');
    const To = T('To‘g‘ri burchakli', 'Прямоугольный', 'Right');
    const M = T('O‘tmas burchakli', 'Тупоугольный', 'Obtuse');
    const answer = kind === 'acute' ? O : kind === 'right' ? To : M;
    return Q(r, {
      prompt: T(`Uchburchak burchaklari: ${a}°, ${b}°, ${c}°. Bu qanday uchburchak?`, `Углы треугольника: ${a}°, ${b}°, ${c}°. Какой это треугольник?`, `A triangle has angles ${a}°, ${b}°, ${c}°. What type is it?`),
      answer,
      wrong: [O, To, M, T('Teng tomonli', 'Равносторонний', 'Equilateral')].filter((x) => x !== answer),
      hints: [
        T('Eng katta burchakka qarang.', 'Посмотри на самый большой угол.', 'Look at the biggest angle.'),
        T('Eng katta burchak 90° dan kichik, 90° yoki katta?', 'Самый большой угол меньше 90°, равен 90° или больше?', 'Is the biggest angle under 90°, exactly 90°, or over?'),
      ],
      explain: T(`Eng katta burchak ${Math.max(a, b, c)}°.`, `Самый большой угол равен ${Math.max(a, b, c)}°.`, `The biggest angle is ${Math.max(a, b, c)}°.`),
    });
  },
];

const parallels: Gen[] = [
  (r) => {
    const a = int(r, 4, 12) * 10;
    return Q(r, {
      prompt: T('a ∥ b. Mos burchaklar. Noma’lum burchak nechaga teng?', 'a ∥ b. Соответственные углы. Чему равен неизвестный угол?', 'a ∥ b. These are corresponding angles. What is the unknown angle?'),
      visual: { t: 'parallel', deg: a, a: `${a}°`, b: '?', kind: 'corresponding', ask: 'b' },
      answer: `${a}°`,
      wrong: [`${180 - a}°`, `${a + 10}°`, `${90}°`, `${360 - a}°`],
      hints: [
        T('Mos burchaklar bir xil joyda turadi.', 'Соответственные углы стоят на одинаковых местах.', 'Corresponding angles sit in the same position.'),
        T('Parallel chiziqlarda mos burchaklar teng.', 'При параллельных прямых соответственные углы равны.', 'With parallel lines, corresponding angles are equal.'),
      ],
      explain: T(`Mos burchaklar teng: ${a}°.`, `Соответственные углы равны: ${a}°.`, `Corresponding angles are equal: ${a}°.`),
    });
  },
  (r) => {
    const a = int(r, 4, 12) * 10;
    return Q(r, {
      prompt: T('a ∥ b. Ichki almashinuvchi burchaklar. Noma’lum burchak nechaga teng?', 'a ∥ b. Накрест лежащие углы. Чему равен неизвестный угол?', 'a ∥ b. These are alternate angles. What is the unknown angle?'),
      visual: { t: 'parallel', deg: a, a: `${a}°`, b: '?', kind: 'alternate', ask: 'b' },
      answer: `${a}°`,
      wrong: [`${180 - a}°`, `${a + 20}°`, `${90}°`, `${360 - a}°`],
      hints: [
        T('Ular kesuvchining ikki tomonida, ikki chiziq orasida turadi.', 'Они лежат по разные стороны секущей, между прямыми.', 'They sit on opposite sides of the crossing line, between the two lines.'),
        T('Parallel chiziqlarda ular teng.', 'При параллельных прямых они равны.', 'With parallel lines they are equal.'),
      ],
      explain: T(`Ichki almashinuvchi burchaklar teng: ${a}°.`, `Накрест лежащие углы равны: ${a}°.`, `Alternate angles are equal: ${a}°.`),
    });
  },
  (r) => {
    const a = int(r, 4, 12) * 10, ans = 180 - a;
    return Q(r, {
      prompt: T('a ∥ b. Ichki bir tomonli burchaklar. Noma’lum burchak nechaga teng?', 'a ∥ b. Односторонние углы. Чему равен неизвестный угол?', 'a ∥ b. These are same-side interior angles. What is the unknown angle?'),
      visual: { t: 'parallel', deg: a, a: `${a}°`, b: '?', kind: 'sameSide', ask: 'b' },
      answer: `${ans}°`,
      wrong: [`${a}°`, `${360 - a}°`, `${ans + 10}°`, `${ans - 10}°`],
      hints: [
        T('Ular kesuvchining bir tomonida, chiziqlar orasida turadi.', 'Они лежат по одну сторону секущей, между прямыми.', 'They sit on the same side of the crossing line, between the two lines.'),
        T('Ularning yig‘indisi 180°.', 'Их сумма равна 180°.', 'They add up to 180°.'),
      ],
      explain: S(`180° − ${a}° = ${ans}°`),
    });
  },
];

const BOOK = (ch: string) => T(`Geometriya 7-sinf, ${ch}-bob`, `Геометрия, 7 класс, глава ${ch}`, `Geometry, Grade 7, chapter ${ch}`);

export const g7GeometryTopics: Topic[] = [
  {
    id: 'g7-angle', grade: 7, subject: 'geometry7', emoji: '📐', book: BOOK('I'),
    title: T('Burchak turlari', 'Виды углов', 'Types of angles'),
    keywords: ['burchak', 'qo‘shni', 'vertikal', 'угол', 'углы', 'смежн', 'вертикальн', 'angle', 'adjacent', 'vertical'],
    cards: [
      {
        text: T(
          'To‘rt xil burchak:\n<b>O‘tkir</b> — 90° dan kichik.\n<b>To‘g‘ri</b> — roppa-rosa 90°.\n<b>O‘tmas</b> — 90° dan katta.\n<b>Yoyiq</b> — 180°.',
          'Четыре вида углов:\n<b>Острый</b> — меньше 90°.\n<b>Прямой</b> — ровно 90°.\n<b>Тупой</b> — больше 90°.\n<b>Развёрнутый</b> — 180°.',
          'Four kinds of angle:\n<b>Acute</b> — under 90°.\n<b>Right</b> — exactly 90°.\n<b>Obtuse</b> — over 90°.\n<b>Straight</b> — 180°.',
        ),
        visual: { t: 'angle', deg: 60, label: '60°' },
      },
      {
        text: T(
          '<b>Qo‘shni burchaklar</b> bitta to‘g‘ri chiziqda yonma-yon turadi: yig‘indisi <b>180°</b>.',
          '<b>Смежные углы</b> стоят рядом на одной прямой: их сумма <b>180°</b>.',
          '<b>Adjacent angles</b> sit side by side on a straight line: they add up to <b>180°</b>.',
        ),
        visual: { t: 'straight', a: '130°', b: '50°', split: 50 },
      },
      {
        text: T(
          '<b>Vertikal burchaklar</b> kesishgan chiziqlarda qarama-qarshi turadi va doim <b>teng</b>.',
          '<b>Вертикальные углы</b> стоят напротив друг друга при пересечении прямых и всегда <b>равны</b>.',
          '<b>Vertical angles</b> sit opposite each other where two lines cross, and they are always <b>equal</b>.',
        ),
        visual: { t: 'cross', deg: 84, a: '84°', b: '84°' },
      },
    ],
    gens: angles,
  },
  {
    id: 'g7-tri', grade: 7, subject: 'geometry7', emoji: '🔺', book: BOOK('IV'),
    title: T('Uchburchak burchaklari', 'Углы треугольника', 'Angles of a triangle'),
    keywords: ['uchburchak', 'teng yonli', 'треугольник', 'равнобедрен', 'triangle', 'isosceles'],
    cards: [
      {
        text: T(
          'Har qanday uchburchakning ichki burchaklari yig‘indisi <b>180°</b>.\nKatta ham, kichik ham — doim 180°!',
          'Сумма внутренних углов любого треугольника равна <b>180°</b>.\nБольшой или маленький — всегда 180°!',
          'The inside angles of any triangle add up to <b>180°</b>.\nBig or small, it is always 180°!',
        ),
        visual: { t: 'triangle', deg: [50, 60, 70], a: '50°', b: '60°', c: '70°' },
      },
      {
        text: T(
          '<b>Teng yonli</b> uchburchakda ikki tomon teng, asosdagi ikki burchak ham teng.\nUchi 40° bo‘lsa: (180° − 40°) : 2 = <b>70°</b>.',
          'В <b>равнобедренном</b> треугольнике две стороны равны, и углы при основании тоже равны.\nВершина 40°: (180° − 40°) : 2 = <b>70°</b>.',
          'An <b>isosceles</b> triangle has two equal sides, and its two base angles are equal.\nTop angle 40°: (180° − 40°) ÷ 2 = <b>70°</b>.',
        ),
        visual: { t: 'triangle', deg: [70, 70, 40], a: '70°', b: '70°', c: '40°', equal: true },
      },
      {
        text: T(
          'Eng katta burchak uchburchak turini aytadi:\n90° dan kichik — <b>o‘tkir burchakli</b>.\n90° — <b>to‘g‘ri burchakli</b>.\n90° dan katta — <b>o‘tmas burchakli</b>.',
          'Самый большой угол называет вид треугольника:\nменьше 90° — <b>остроугольный</b>.\n90° — <b>прямоугольный</b>.\nбольше 90° — <b>тупоугольный</b>.',
          'The biggest angle names the triangle:\nunder 90° — <b>acute</b>.\n90° — <b>right</b>.\nover 90° — <b>obtuse</b>.',
        ),
        visual: { t: 'triangle', deg: [90, 40, 50], a: '90°', b: '40°', c: '50°', right: true },
      },
    ],
    gens: triangles,
  },
  {
    id: 'g7-par', grade: 7, subject: 'geometry7', emoji: '🛤️', book: BOOK('III'),
    title: T('Parallel to‘g‘ri chiziqlar', 'Параллельные прямые', 'Parallel lines'),
    keywords: ['parallel', 'kesuvchi', 'параллель', 'секущ', 'transversal'],
    cards: [
      {
        text: T(
          'Temiryo‘l relslari 🛤️ hech qachon kesishmaydi. Bunday chiziqlar <b>parallel</b>: a ∥ b.',
          'Рельсы 🛤️ никогда не пересекаются. Такие прямые <b>параллельны</b>: a ∥ b.',
          'Railway rails 🛤️ never meet. Lines like that are <b>parallel</b>: a ∥ b.',
        ),
        visual: { t: 'parallel', deg: 70, a: '70°', b: '70°', kind: 'corresponding' },
      },
      {
        text: T(
          'Uchinchi chiziq — <b>kesuvchi</b>. U burchaklar juftini yasaydi.\n<b>Mos</b> burchaklar teng.\n<b>Ichki almashinuvchi</b> burchaklar teng.',
          'Третья прямая — <b>секущая</b>. Она даёт пары углов.\n<b>Соответственные</b> углы равны.\n<b>Накрест лежащие</b> углы равны.',
          'A third line is the <b>transversal</b>. It makes pairs of angles.\n<b>Corresponding</b> angles are equal.\n<b>Alternate</b> angles are equal.',
        ),
        visual: { t: 'parallel', deg: 70, a: '70°', b: '70°', kind: 'alternate' },
      },
      {
        text: T(
          '<b>Ichki bir tomonli</b> burchaklar teng emas: ularning yig‘indisi <b>180°</b>.',
          '<b>Односторонние</b> углы не равны: их сумма равна <b>180°</b>.',
          '<b>Same-side interior</b> angles are not equal: they add up to <b>180°</b>.',
        ),
        visual: { t: 'parallel', deg: 110, a: '110°', b: '70°', kind: 'sameSide' },
      },
    ],
    gens: parallels,
  },
];
