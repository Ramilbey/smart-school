import type { ContentStatus, GuidedProblem, Misconception, QuizQuestion, Skill, Text } from '../types.ts';

/**
 * Grade 7 · Algebra · The linear function y = kx + b and its graph.
 * Drafted for the hackathon prototype. NOT yet reviewed by a teacher — the app says so.
 * No textbook page references are given on purpose: none have been verified.
 */

export const G7_LESSON_ID = 'g7-linear';

export type SectionId = 'overview' | 'explore' | 'steps' | 'problem' | 'check';

export const g7Meta = {
  id: G7_LESSON_ID,
  grade: 7,
  subject: { uz: 'Algebra', ru: 'Алгебра', en: 'Algebra' } as Text,
  status: 'draft-unreviewed' as ContentStatus,
  title: {
    uz: 'Chiziqli funksiya va uning grafigi',
    ru: 'Линейная функция и её график',
    en: 'The linear function and its graph',
  } as Text,
  formula: 'y = kx + b',
  objective: {
    uz: 'k va b koeffitsientlari grafikni qanday o‘zgartirishini tushunish, ikki nuqta orqali to‘g‘ri chiziq tenglamasini topish va grafikni tenglama bilan bog‘lash.',
    ru: 'Понять, как коэффициенты k и b меняют график, находить уравнение прямой по двум точкам и связывать график с уравнением.',
    en: 'Understand how k and b change the graph, find the equation of a line through two points, and connect the graph with the equation.',
  } as Text,
  prerequisites: [
    { uz: 'Koordinata tekisligi', ru: 'Координатная плоскость', en: 'The coordinate plane' },
    { uz: 'Ifodaga son qo‘yish', ru: 'Подстановка чисел в выражение', en: 'Substituting numbers into an expression' },
    { uz: 'Manfiy sonlar bilan amallar', ru: 'Действия с отрицательными числами', en: 'Operations with negative numbers' },
  ] as Text[],
  minutes: 12,
};

export const g7Sections: { id: SectionId; title: Text; blurb: Text }[] = [
  {
    id: 'overview',
    title: { uz: 'Mavzu bilan tanishuv', ru: 'Обзор темы', en: 'Topic overview' },
    blurb: { uz: 'Maqsad va oldingi bilimlar', ru: 'Цель и что нужно знать', en: 'Goal and prerequisites' },
  },
  {
    id: 'explore',
    title: { uz: 'Grafikni o‘rganing', ru: 'Исследуйте график', en: 'Explore the graph' },
    blurb: { uz: 'k va b ni o‘zgartiring', ru: 'Меняйте k и b', en: 'Change k and b' },
  },
  {
    id: 'steps',
    title: { uz: 'Qadamma-qadam', ru: 'Шаг за шагом', en: 'Step by step' },
    blurb: { uz: 'Ikki nuqta orqali tenglama', ru: 'Уравнение по двум точкам', en: 'Equation from two points' },
  },
  {
    id: 'problem',
    title: { uz: 'Mustaqil masala', ru: 'Самостоятельная задача', en: 'Guided problem' },
    blurb: { uz: 'Bosqichli maslahatlar bilan', ru: 'С поэтапными подсказками', en: 'With staged hints' },
  },
  {
    id: 'check',
    title: { uz: 'Tushunishni tekshirish', ru: 'Проверка понимания', en: 'Comprehension check' },
    blurb: { uz: '6 ta savol', ru: '6 вопросов', en: '6 questions' },
  },
];

/* ---------- Explore ---------- */

export const g7Explore = {
  intro: {
    uz: 'Nuqtalarni suring yoki slayderlardan foydalaning. Tenglama, grafik va qiymatlar jadvali birga o‘zgaradi.',
    ru: 'Перетаскивайте точки или используйте ползунки. Уравнение, график и таблица значений меняются вместе.',
    en: 'Drag the points or use the sliders. The equation, the graph and the table of values change together.',
  } as Text,
  kName: { uz: 'burchak koeffitsienti', ru: 'угловой коэффициент', en: 'slope' } as Text,
  bName: { uz: 'ozod had', ru: 'свободный член', en: 'y-intercept' } as Text,
  kPos: {
    uz: 'k > 0: chiziq chapdan o‘ngga ko‘tariladi.',
    ru: 'k > 0: прямая возрастает слева направо.',
    en: 'k > 0: the line rises from left to right.',
  } as Text,
  kNeg: {
    uz: 'k < 0: chiziq chapdan o‘ngga pasayadi.',
    ru: 'k < 0: прямая убывает слева направо.',
    en: 'k < 0: the line falls from left to right.',
  } as Text,
  kZero: {
    uz: 'k = 0: chiziq gorizontal, y = b.',
    ru: 'k = 0: прямая горизонтальна, y = b.',
    en: 'k = 0: the line is horizontal, y = b.',
  } as Text,
  kStep: {
    uz: 'x 1 ga oshganda, y {k} ga o‘zgaradi.',
    ru: 'Когда x увеличивается на 1, y изменяется на {k}.',
    en: 'When x increases by 1, y changes by {k}.',
  } as Text,
  bCross: {
    uz: 'Chiziq Oy o‘qini {p} nuqtada kesib o‘tadi.',
    ru: 'Прямая пересекает ось Oy в точке {p}.',
    en: 'The line crosses the y-axis at {p}.',
  } as Text,
  handleHint: {
    uz: 'Oy o‘qidagi nuqta b ni, x = 2 dagi nuqta k ni o‘zgartiradi.',
    ru: 'Точка на оси Oy меняет b, точка при x = 2 меняет k.',
    en: 'The point on the y-axis changes b; the point at x = 2 changes k.',
  } as Text,
  tableTitle: { uz: 'Qiymatlar jadvali', ru: 'Таблица значений', en: 'Table of values' } as Text,
  challengesTitle: { uz: 'Topshiriqlar', ru: 'Задания', en: 'Tasks' } as Text,
  challenges: [
    {
      id: 'horizontal',
      goal: { k: 0 } as { k?: number; b?: number },
      prompt: {
        uz: 'Chiziqni gorizontal qiling.',
        ru: 'Сделайте прямую горизонтальной.',
        en: 'Make the line horizontal.',
      } as Text,
      insight: {
        uz: 'k = 0 bo‘lsa, x qanday bo‘lmasin y = b. Grafik — gorizontal chiziq.',
        ru: 'При k = 0 значение y = b при любом x. График — горизонтальная прямая.',
        en: 'With k = 0, y = b for every x. The graph is a horizontal line.',
      } as Text,
    },
    {
      id: 'intercept',
      goal: { b: -2 } as { k?: number; b?: number },
      prompt: {
        uz: 'Chiziq Oy o‘qini (0; −2) nuqtada kesib o‘tsin.',
        ru: 'Пусть прямая пересекает ось Oy в точке (0; −2).',
        en: 'Make the line cross the y-axis at (0, −2).',
      } as Text,
      insight: {
        uz: 'x = 0 da y = k·0 + b = b. Shuning uchun b — chiziqning Oy o‘qi bilan kesishish nuqtasi.',
        ru: 'При x = 0 получаем y = k·0 + b = b. Поэтому b — точка пересечения прямой с осью Oy.',
        en: 'At x = 0, y = k·0 + b = b. That is why b is where the line meets the y-axis.',
      } as Text,
    },
    {
      id: 'match',
      goal: { k: 2, b: -1 } as { k?: number; b?: number },
      ghost: { k: 2, b: -1 },
      prompt: {
        uz: 'Chiziqni punktir chiziq bilan ustma-ust tushiring.',
        ru: 'Совместите прямую с пунктирной.',
        en: 'Make your line match the dashed line.',
      } as Text,
      insight: {
        uz: 'Bu y = 2x − 1: u Oy o‘qini (0; −1) da kesadi va x 1 ga oshganda y 2 ga oshadi.',
        ru: 'Это y = 2x − 1: прямая пересекает Oy в точке (0; −1), и при увеличении x на 1 значение y растёт на 2.',
        en: 'That is y = 2x − 1: it crosses the y-axis at (0, −1), and y grows by 2 each time x grows by 1.',
      } as Text,
    },
  ],
};

/* ---------- Step by step (predict, then reveal) ---------- */

export interface ReasoningStep {
  id: string;
  question?: Text;
  choices?: { id: string; label: Text | string }[];
  correct?: string;
  reveal: Text;
  why: Text;
  /** What the graph highlights during this step. */
  focus: 'A' | 'delta' | 'slope' | 'line' | 'check';
}

export const g7Steps = {
  problem: {
    uz: 'A(0; 1) va B(2; 5) nuqtalardan o‘tuvchi to‘g‘ri chiziq tenglamasini toping.',
    ru: 'Найдите уравнение прямой, проходящей через точки A(0; 1) и B(2; 5).',
    en: 'Find the equation of the line through A(0, 1) and B(2, 5).',
  } as Text,
  predictLabel: {
    uz: 'Avval o‘zingiz taxmin qiling:',
    ru: 'Сначала предположите сами:',
    en: 'Predict first:',
  } as Text,
  a: [0, 1] as [number, number],
  b: [2, 5] as [number, number],
  steps: [
    {
      id: 's1',
      question: { uz: 'b nimaga teng?', ru: 'Чему равно b?', en: 'What is b?' },
      choices: [
        { id: '0', label: '0' },
        { id: '1', label: '1' },
        { id: '2', label: '2' },
        { id: '5', label: '5' },
      ],
      correct: '1',
      reveal: {
        uz: 'A nuqta Oy o‘qida yotadi (x = 0). x = 0 da y = b, demak b = 1.',
        ru: 'Точка A лежит на оси Oy (x = 0). При x = 0 имеем y = b, значит, b = 1.',
        en: 'Point A is on the y-axis (x = 0). At x = 0, y = b, so b = 1.',
      },
      why: {
        uz: 'y = k·0 + b = b — x nolga teng bo‘lganda k ta’sir qilmaydi.',
        ru: 'y = k·0 + b = b: при x = 0 коэффициент k ни на что не влияет.',
        en: 'y = k·0 + b = b: when x is 0, k has no effect.',
      },
      focus: 'A',
    },
    {
      id: 's2',
      question: {
        uz: 'A dan B ga o‘tganda x va y qanchaga o‘zgaradi?',
        ru: 'На сколько меняются x и y при переходе от A к B?',
        en: 'How much do x and y change from A to B?',
      },
      choices: [
        { id: 'a', label: 'Δx = 2, Δy = 4' },
        { id: 'b', label: 'Δx = 4, Δy = 2' },
        { id: 'c', label: 'Δx = 2, Δy = 5' },
        { id: 'd', label: 'Δx = 2, Δy = 6' },
      ],
      correct: 'a',
      reveal: {
        uz: 'Δx = 2 − 0 = 2, Δy = 5 − 1 = 4.',
        ru: 'Δx = 2 − 0 = 2, Δy = 5 − 1 = 4.',
        en: 'Δx = 2 − 0 = 2, Δy = 5 − 1 = 4.',
      },
      why: {
        uz: 'O‘zgarish = oxirgi qiymat − boshlang‘ich qiymat. Ikkala koordinata uchun ham bir xil tartibda ayiramiz.',
        ru: 'Изменение = конечное значение − начальное. Вычитаем в одном и том же порядке для обеих координат.',
        en: 'Change = final value − starting value, subtracted in the same order for both coordinates.',
      },
      focus: 'delta',
    },
    {
      id: 's3',
      question: { uz: 'k nimaga teng?', ru: 'Чему равно k?', en: 'What is k?' },
      choices: [
        { id: '2', label: '2' },
        { id: 'half', label: { uz: '0,5', ru: '0,5', en: '0.5' } },
        { id: '4', label: '4' },
        { id: '3', label: '3' },
      ],
      correct: '2',
      reveal: {
        uz: 'k = Δy / Δx = 4 / 2 = 2.',
        ru: 'k = Δy / Δx = 4 / 2 = 2.',
        en: 'k = Δy / Δx = 4 / 2 = 2.',
      },
      why: {
        uz: 'k — x 1 ga oshganda y qanchaga o‘zgarishi. x 2 ga oshganda y 4 ga oshdi, demak har bir birlikka 2 to‘g‘ri keladi.',
        ru: 'k показывает, на сколько меняется y при увеличении x на 1. x вырос на 2, y — на 4, значит, на каждую единицу x приходится 2.',
        en: 'k is how much y changes when x increases by 1. x grew by 2 and y grew by 4, so y grows by 2 per unit of x.',
      },
      focus: 'slope',
    },
    {
      id: 's4',
      question: { uz: 'Tenglama qanday?', ru: 'Какое получается уравнение?', en: 'What is the equation?' },
      choices: [
        { id: 'a', label: 'y = x + 2' },
        { id: 'b', label: 'y = 2x + 1' },
        { id: 'c', label: 'y = 2x + 5' },
        { id: 'd', label: 'y = 4x + 1' },
      ],
      correct: 'b',
      reveal: {
        uz: 'k = 2 va b = 1 ni y = kx + b ga qo‘yamiz: y = 2x + 1.',
        ru: 'Подставляем k = 2 и b = 1 в y = kx + b: y = 2x + 1.',
        en: 'Put k = 2 and b = 1 into y = kx + b: y = 2x + 1.',
      },
      why: {
        uz: 'Chiziqli funksiya ikkita son bilan to‘liq aniqlanadi: k va b.',
        ru: 'Линейная функция полностью задаётся двумя числами: k и b.',
        en: 'A linear function is fully determined by two numbers: k and b.',
      },
      focus: 'line',
    },
    {
      id: 's5',
      reveal: {
        uz: 'Tekshiruv: B(2; 5) uchun 2·2 + 1 = 5 ✓. Tenglama to‘g‘ri.',
        ru: 'Проверка: для B(2; 5) получаем 2·2 + 1 = 5 ✓. Уравнение верное.',
        en: 'Check: for B(2, 5), 2·2 + 1 = 5 ✓. The equation is correct.',
      },
      why: {
        uz: 'Har doim ikkinchi nuqtani tenglamaga qo‘yib tekshiring — bu hisoblash xatolarini topishning eng tez yo‘li.',
        ru: 'Всегда подставляйте вторую точку для проверки — это самый быстрый способ найти ошибку в вычислениях.',
        en: 'Always substitute the second point to check — it is the fastest way to catch an arithmetic slip.',
      },
      focus: 'check',
    },
  ] as ReasoningStep[],
};

/* ---------- Guided problem with the hint ladder ---------- */

export const g7Problem: GuidedProblem = {
  id: 'g7-hw-two-points',
  lessonId: G7_LESSON_ID,
  prompt: {
    uz: 'To‘g‘ri chiziq C(−1; 4) va D(2; −2) nuqtalardan o‘tadi. k va b ni toping.',
    ru: 'Прямая проходит через точки C(−1; 4) и D(2; −2). Найдите k и b.',
    en: 'A line passes through C(−1, 4) and D(2, −2). Find k and b.',
  },
  input: {
    kind: 'numbers',
    fields: [
      { id: 'k', label: 'k', answer: -2 },
      { id: 'b', label: 'b', answer: 2 },
    ],
  },
  misconceptions: [
    {
      id: 'sign',
      when: { k: 2 },
      feedback: {
        uz: 'k ning ishorasini tekshiring: x −1 dan 2 gacha oshganda y oshadimi yoki kamayadimi?',
        ru: 'Проверьте знак k: когда x растёт от −1 до 2, y растёт или убывает?',
        en: 'Check the sign of k: as x goes from −1 to 2, does y go up or down?',
      },
    },
    {
      id: 'inverted',
      when: { k: -0.5 },
      feedback: {
        uz: 'Δx ni Δy ga bo‘lganga o‘xshaydi. k = Δy / Δx: avval y ning o‘zgarishi.',
        ru: 'Похоже, Δx разделили на Δy. Нужно k = Δy / Δx: сначала изменение y.',
        en: 'It looks like Δx was divided by Δy. k = Δy / Δx: the change in y goes on top.',
      },
    },
    {
      id: 'inverted',
      when: { k: 0.5 },
      feedback: {
        uz: 'k = Δy / Δx bo‘lishi kerak, Δx / Δy emas. Ishorasini ham tekshiring.',
        ru: 'Должно быть k = Δy / Δx, а не Δx / Δy. Проверьте и знак.',
        en: 'It should be k = Δy / Δx, not Δx / Δy. Check the sign as well.',
      },
    },
    {
      id: 'neg-times-neg',
      when: { k: -2, b: 6 },
      feedback: {
        uz: 'k to‘g‘ri! b ni topishda (−2)·(−1) ga e’tibor bering: manfiy son manfiyga ko‘paytirilsa, musbat chiqadi.',
        ru: 'k найден верно! При поиске b проверьте (−2)·(−1): минус на минус даёт плюс.',
        en: 'k is right! When finding b, check (−2)·(−1): a negative times a negative is positive.',
      },
    },
    {
      id: 'y-as-b',
      when: { k: -2, b: 4 },
      feedback: {
        uz: 'k to‘g‘ri! Lekin b = 4 emas: C nuqta Oy o‘qida yotmaydi (x = −1). C ning koordinatalarini y = −2x + b ga qo‘ying.',
        ru: 'k верно! Но b ≠ 4: точка C не лежит на оси Oy (x = −1). Подставьте координаты C в y = −2x + b.',
        en: 'k is right! But b is not 4: point C is not on the y-axis (x = −1). Substitute C into y = −2x + b.',
      },
    },
  ],
  fieldFeedback: {
    k: {
      uz: 'k ni qayta hisoblang: k = Δy / Δx.',
      ru: 'Пересчитайте k: k = Δy / Δx.',
      en: 'Recalculate k: k = Δy / Δx.',
    },
    b: {
      uz: 'k to‘g‘ri. Endi b ni toping: nuqtalardan birini y = −2x + b ga qo‘ying.',
      ru: 'k верно. Теперь найдите b: подставьте одну из точек в y = −2x + b.',
      en: 'k is right. Now find b: substitute one of the points into y = −2x + b.',
    },
  },
  hints: [
    {
      uz: 'k — x 1 ga oshganda y qanchaga o‘zgarishini ko‘rsatadi. b — x = 0 dagi y qiymati.',
      ru: 'k показывает, на сколько меняется y при увеличении x на 1. b — значение y при x = 0.',
      en: 'k tells how much y changes when x increases by 1. b is the value of y when x = 0.',
    },
    {
      uz: 'Grafikka qarang: C dan D ga o‘tganda Δx = 3, Δy = −6.',
      ru: 'Посмотрите на график: от C к D получаем Δx = 3, Δy = −6.',
      en: 'Look at the graph: from C to D, Δx = 3 and Δy = −6.',
    },
    {
      uz: 'k = Δy / Δx = −6 / 3. So‘ng C(−1; 4) ni y = kx + b ga qo‘yib, b ni toping.',
      ru: 'k = Δy / Δx = −6 / 3. Затем подставьте C(−1; 4) в y = kx + b и найдите b.',
      en: 'k = Δy / Δx = −6 / 3. Then substitute C(−1, 4) into y = kx + b to find b.',
    },
    {
      uz: 'k = −6 / 3 = −2. C nuqta: 4 = −2·(−1) + b → 4 = 2 + b → b = 2. Tekshiruv D: −2·2 + 2 = −2 ✓. Endi javobni kiriting.',
      ru: 'k = −6 / 3 = −2. Точка C: 4 = −2·(−1) + b → 4 = 2 + b → b = 2. Проверка по D: −2·2 + 2 = −2 ✓. Теперь введите ответ.',
      en: 'k = −6 / 3 = −2. Point C: 4 = −2·(−1) + b → 4 = 2 + b → b = 2. Check with D: −2·2 + 2 = −2 ✓. Now enter your answer.',
    },
  ],
  hintVisual: { type: 'two-points', a: [-1, 4], b: [2, -2], showDelta: true },
  explanation: {
    uz: 'y = −2x + 2. k < 0, shuning uchun chiziq pasayadi; u Oy o‘qini (0; 2) da kesadi. Ikkala nuqta ham tenglamani qanoatlantiradi.',
    ru: 'y = −2x + 2. Поскольку k < 0, прямая убывает; она пересекает ось Oy в точке (0; 2). Обе точки удовлетворяют уравнению.',
    en: 'y = −2x + 2. Since k < 0, the line falls; it crosses the y-axis at (0, 2). Both points satisfy the equation.',
  },
};

/* ---------- Comprehension check ---------- */

export const g7Skills: Skill[] = [
  { id: 'read-kb', name: { uz: 'k va b ni o‘qish', ru: 'Чтение k и b', en: 'Reading k and b' }, review: 'explore' },
  { id: 'graph', name: { uz: 'Grafik va ishoralar', ru: 'График и знаки k, b', en: 'Graph and the signs of k, b' }, review: 'explore' },
  { id: 'slope', name: { uz: 'Ikki nuqta bo‘yicha k', ru: 'k по двум точкам', en: 'k from two points' }, review: 'steps' },
  { id: 'substitute', name: { uz: 'Nuqtani qo‘yish', ru: 'Подстановка точки', en: 'Substituting a point' }, review: 'problem' },
  { id: 'parallel', name: { uz: 'Parallel chiziqlar', ru: 'Параллельные прямые', en: 'Parallel lines' }, review: 'explore' },
  { id: 'root', name: { uz: 'Ox bilan kesishish', ru: 'Пересечение с Ox', en: 'Crossing the x-axis' }, review: 'explore' },
];

export const g7Misconceptions: Misconception[] = [
  { id: 'k-b-swap', name: { uz: 'k va b almashtirilgan', ru: 'Путаница k и b', en: 'Mixing up k and b' } },
  { id: 'sign', name: { uz: 'Ishora xatosi', ru: 'Ошибка в знаке', en: 'Sign error' } },
  { id: 'inverted', name: { uz: 'Δy / Δx o‘rniga Δx / Δy', ru: 'Δx / Δy вместо Δy / Δx', en: 'Δx / Δy instead of Δy / Δx' } },
  { id: 'y-as-b', name: { uz: 'Nuqtaning y qiymatini b deb olish', ru: 'y точки принят за b', en: 'Taking a point’s y as b' } },
  { id: 'axis-swap', name: { uz: 'Ox va Oy bilan kesishish almashtirilgan', ru: 'Путаница пересечений с Ox и Oy', en: 'Mixing up the x- and y-intercepts' } },
  { id: 'parallel-meaning', name: { uz: 'Bir xil k ning ma’nosi', ru: 'Смысл одинакового k', en: 'What an equal k means' } },
  { id: 'unfinished', name: { uz: 'Tenglama oxirigacha yechilmagan', ru: 'Уравнение решено не до конца', en: 'Equation not fully solved' } },
];

export const g7Quiz: QuizQuestion[] = [
  {
    id: 'g7q1',
    skill: 'read-kb',
    prompt: { uz: 'y = −3x + 4 da k nimaga teng?', ru: 'Чему равен k в уравнении y = −3x + 4?', en: 'In y = −3x + 4, what is k?' },
    choices: [
      { id: 'a', label: '4', misconception: 'k-b-swap' },
      { id: 'b', label: '−3' },
      { id: 'c', label: '3', misconception: 'sign' },
      { id: 'd', label: '−3x', misconception: 'k-b-swap' },
    ],
    correct: 'b',
    explanation: {
      uz: 'y = kx + b ko‘rinishida k — x oldidagi son (ishorasi bilan): k = −3, b = 4.',
      ru: 'В записи y = kx + b коэффициент k — число перед x (вместе со знаком): k = −3, b = 4.',
      en: 'In y = kx + b, k is the number in front of x (with its sign): k = −3, b = 4.',
    },
  },
  {
    id: 'g7q2',
    skill: 'graph',
    prompt: { uz: 'Qaysi grafikda k < 0 va b > 0?', ru: 'На каком графике k < 0 и b > 0?', en: 'Which graph has k < 0 and b > 0?' },
    pictureChoices: true,
    choices: [
      { id: 'a', label: 'A', visual: { type: 'line', k: 1, b: 2 }, misconception: 'sign' },
      { id: 'b', label: 'B', visual: { type: 'line', k: -1, b: -2 }, misconception: 'sign' },
      { id: 'c', label: 'C', visual: { type: 'line', k: -1, b: 2 } },
      { id: 'd', label: 'D', visual: { type: 'line', k: 1, b: -2 }, misconception: 'sign' },
    ],
    correct: 'c',
    explanation: {
      uz: 'k < 0 — chiziq chapdan o‘ngga pasayadi; b > 0 — Oy o‘qini koordinata boshidan yuqorida kesadi.',
      ru: 'k < 0 — прямая убывает слева направо; b > 0 — пересекает ось Oy выше начала координат.',
      en: 'k < 0 means the line falls from left to right; b > 0 means it crosses the y-axis above the origin.',
    },
  },
  {
    id: 'g7q3',
    skill: 'slope',
    prompt: {
      uz: 'To‘g‘ri chiziq (0; −2) va (1; 1) nuqtalardan o‘tadi. k ni toping.',
      ru: 'Прямая проходит через точки (0; −2) и (1; 1). Найдите k.',
      en: 'A line passes through (0, −2) and (1, 1). Find k.',
    },
    choices: [
      { id: 'a', label: '1/3', misconception: 'inverted' },
      { id: 'b', label: '−3', misconception: 'sign' },
      { id: 'c', label: '3' },
      { id: 'd', label: '−2', misconception: 'k-b-swap' },
    ],
    correct: 'c',
    explanation: {
      uz: 'k = Δy / Δx = (1 − (−2)) / (1 − 0) = 3 / 1 = 3.',
      ru: 'k = Δy / Δx = (1 − (−2)) / (1 − 0) = 3 / 1 = 3.',
      en: 'k = Δy / Δx = (1 − (−2)) / (1 − 0) = 3 / 1 = 3.',
    },
  },
  {
    id: 'g7q4',
    skill: 'substitute',
    prompt: {
      uz: 'b ning qaysi qiymatida y = 2x + b grafigi (1; 5) nuqtadan o‘tadi?',
      ru: 'При каком b график y = 2x + b проходит через точку (1; 5)?',
      en: 'For which b does the graph of y = 2x + b pass through (1, 5)?',
    },
    choices: [
      { id: 'a', label: '3' },
      { id: 'b', label: '5', misconception: 'y-as-b' },
      { id: 'c', label: '7', misconception: 'sign' },
      { id: 'd', label: '−3', misconception: 'sign' },
    ],
    correct: 'a',
    explanation: {
      uz: 'Nuqtani qo‘yamiz: 5 = 2·1 + b → b = 5 − 2 = 3.',
      ru: 'Подставляем точку: 5 = 2·1 + b → b = 5 − 2 = 3.',
      en: 'Substitute the point: 5 = 2·1 + b → b = 5 − 2 = 3.',
    },
  },
  {
    id: 'g7q5',
    skill: 'parallel',
    prompt: {
      uz: 'y = 2x + 1 va y = 2x − 3 to‘g‘ri chiziqlari qanday joylashgan?',
      ru: 'Как расположены прямые y = 2x + 1 и y = 2x − 3?',
      en: 'How are the lines y = 2x + 1 and y = 2x − 3 positioned?',
    },
    choices: [
      { id: 'a', label: { uz: 'Parallel', ru: 'Параллельны', en: 'Parallel' } },
      { id: 'b', label: { uz: '(0; 1) nuqtada kesishadi', ru: 'Пересекаются в точке (0; 1)', en: 'They intersect at (0, 1)' }, misconception: 'parallel-meaning' },
      { id: 'c', label: { uz: 'Ustma-ust tushadi', ru: 'Совпадают', en: 'They are the same line' }, misconception: 'parallel-meaning' },
      { id: 'd', label: { uz: 'Perpendikulyar', ru: 'Перпендикулярны', en: 'Perpendicular' }, misconception: 'parallel-meaning' },
    ],
    correct: 'a',
    explanation: {
      uz: 'k bir xil (2), b esa har xil — demak, chiziqlar parallel va hech qachon kesishmaydi.',
      ru: 'k одинаковые (2), а b разные — прямые параллельны и не пересекаются.',
      en: 'Same k (2), different b, so the lines are parallel and never meet.',
    },
  },
  {
    id: 'g7q6',
    skill: 'root',
    prompt: {
      uz: 'y = 2x − 6 grafigi Ox o‘qini qaysi nuqtada kesib o‘tadi?',
      ru: 'В какой точке график y = 2x − 6 пересекает ось Ox?',
      en: 'Where does the graph of y = 2x − 6 cross the x-axis?',
    },
    choices: [
      { id: 'a', label: { uz: '(0; −6)', ru: '(0; −6)', en: '(0, −6)' }, misconception: 'axis-swap' },
      { id: 'b', label: { uz: '(−3; 0)', ru: '(−3; 0)', en: '(−3, 0)' }, misconception: 'sign' },
      { id: 'c', label: { uz: '(6; 0)', ru: '(6; 0)', en: '(6, 0)' }, misconception: 'unfinished' },
      { id: 'd', label: { uz: '(3; 0)', ru: '(3; 0)', en: '(3, 0)' } },
    ],
    correct: 'd',
    explanation: {
      uz: 'Ox o‘qida y = 0: 2x − 6 = 0 → 2x = 6 → x = 3. Bu chiziqli tenglamaning yechimi.',
      ru: 'На оси Ox y = 0: 2x − 6 = 0 → 2x = 6 → x = 3. Это корень линейного уравнения.',
      en: 'On the x-axis y = 0: 2x − 6 = 0 → 2x = 6 → x = 3. That is the solution of the linear equation.',
    },
  },
];

/** Topics shown on the subject page. Only the first one exists in the prototype. */
export const g7Topics: { id: string; title: Text; available: boolean }[] = [
  { id: G7_LESSON_ID, title: g7Meta.title, available: true },
  {
    id: 'g7-systems',
    title: { uz: 'Chiziqli tenglamalar sistemasi', ru: 'Системы линейных уравнений', en: 'Systems of linear equations' },
    available: false,
  },
  {
    id: 'g7-powers',
    title: { uz: 'Natural ko‘rsatkichli daraja', ru: 'Степень с натуральным показателем', en: 'Powers with natural exponents' },
    available: false,
  },
];
