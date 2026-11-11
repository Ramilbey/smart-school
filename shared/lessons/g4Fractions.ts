import type { ContentStatus, GuidedProblem, QuizQuestion, Text, Visual } from '../types.ts';

/**
 * Grade 4 · Mathematics · Fractions: equal parts of a whole.
 * Drafted for the hackathon prototype. NOT yet reviewed by a teacher — the app says so.
 * No textbook page references are given on purpose: none have been verified.
 */

export const G4_LESSON_ID = 'g4-fractions';

export type StationId = 'equal' | 'build' | 'compare' | 'homework' | 'quiz';

export const g4Meta = {
  id: G4_LESSON_ID,
  grade: 4,
  subject: { uz: 'Matematika', ru: 'Математика', en: 'Mathematics' } as Text,
  status: 'draft-unreviewed' as ContentStatus,
  title: {
    uz: 'Kasrlar: butunning teng bo‘laklari',
    ru: 'Дроби: равные части целого',
    en: 'Fractions: equal parts of a whole',
  } as Text,
  mission: {
    uz: 'Zukko bilan adolatli bo‘lishamiz',
    ru: 'Делим поровну вместе с Зукко',
    en: 'Share fairly with Zukko',
  } as Text,
  objective: {
    uz: 'Kasr nimani bildirishini tushunish, surat va maxrajni o‘qish, oddiy kasrlarni taqqoslash.',
    ru: 'Понять, что такое дробь, читать числитель и знаменатель, сравнивать простые дроби.',
    en: 'Understand what a fraction means, read the numerator and denominator, and compare simple fractions.',
  } as Text,
};

export const g4Stations: { id: StationId; title: Text; blurb: Text }[] = [
  {
    id: 'equal',
    title: { uz: 'Teng bo‘laklar', ru: 'Равные части', en: 'Equal parts' },
    blurb: { uz: 'Adolatli bo‘lish nima?', ru: 'Как делить честно?', en: 'What is a fair share?' },
  },
  {
    id: 'build',
    title: { uz: 'Kasr yasaymiz', ru: 'Собираем дробь', en: 'Build a fraction' },
    blurb: { uz: 'Surat va maxraj', ru: 'Числитель и знаменатель', en: 'Numerator and denominator' },
  },
  {
    id: 'compare',
    title: { uz: 'Taqqoslaymiz', ru: 'Сравниваем', en: 'Compare' },
    blurb: { uz: 'Qaysi bo‘lak katta?', ru: 'Какая часть больше?', en: 'Which part is bigger?' },
  },
  {
    id: 'homework',
    title: { uz: 'Uy vazifasi', ru: 'Домашнее задание', en: 'Homework' },
    blurb: { uz: 'Zukko maslahat beradi', ru: 'Зукко подскажет', en: 'Zukko gives hints' },
  },
  {
    id: 'quiz',
    title: { uz: 'Tezkor test', ru: 'Быстрый тест', en: 'Quick quiz' },
    blurb: { uz: '5 ta savol', ru: '5 вопросов', en: '5 questions' },
  },
];

/* ---------- Station 1 · Non (flatbread): equal parts ---------- */

export const g4Equal = {
  intro: {
    uz: 'Nonni teng bo‘laklarga kessak, hamma bir xil oladi. Adolatli bo‘lishning sirri shu.',
    ru: 'Если лепёшку разрезать на равные части, всем достанется поровну. В этом весь секрет честного дележа.',
    en: 'Cut a flatbread into equal pieces and everyone gets the same. That is the secret of sharing fairly.',
  } as Text,
  task: {
    uz: 'Qaysi nonlar teng bo‘laklarga kesilgan? Hammasini bos.',
    ru: 'Какие лепёшки разрезаны на равные части? Нажми на все такие.',
    en: 'Which flatbreads are cut into equal pieces? Tap every one.',
  } as Text,
  shapes: [
    { id: 'a', equal: true, visual: { type: 'split', shape: 'circle', cuts: [0, 90, 180, 270], filled: [] } },
    { id: 'b', equal: false, visual: { type: 'split', shape: 'circle', cuts: [0, 100, 180], filled: [] } },
    { id: 'c', equal: true, visual: { type: 'split', shape: 'circle', cuts: [0, 120, 240], filled: [] } },
    { id: 'd', equal: false, visual: { type: 'split', shape: 'circle', cuts: [0, 70, 200], filled: [] } },
  ] as { id: string; equal: boolean; visual: Visual }[],
  pickedUnequal: {
    uz: 'Yana bir qara: tanlaganlaringdan birida bo‘laklar har xil katta. Kimdir ko‘proq, kimdir kamroq oladi.',
    ru: 'Посмотри ещё раз: в одной из выбранных лепёшек куски разного размера. Кому-то достанется больше, кому-то меньше.',
    en: 'Look again: one flatbread you picked has pieces of different sizes. Someone would get more, someone less.',
  } as Text,
  missedEqual: {
    uz: 'Yana bitta non teng bo‘laklarga kesilgan. Topa olasanmi?',
    ru: 'Есть ещё одна лепёшка, разрезанная на равные части. Найдёшь?',
    en: 'One more flatbread is cut into equal pieces. Can you find it?',
  } as Text,
  success: {
    uz: 'Zo‘r! Teng bo‘laklar — adolatli bo‘lish.',
    ru: 'Отлично! Равные части — это честный дележ.',
    en: 'Great! Equal pieces mean a fair share.',
  } as Text,
  takeaway: {
    uz: 'Kasr — butunning teng bo‘laklaridan biri yoki bir nechtasi.',
    ru: 'Дробь — это одна или несколько равных частей целого.',
    en: 'A fraction is one or more equal parts of a whole.',
  } as Text,
};

/* ---------- Station 2 · Anor (pomegranate): numerator and denominator ---------- */

export const g4Build = {
  intro: {
    uz: 'Pastki son — maxraj: anor nechta teng bo‘lakka kesilgan. Yuqori son — surat: kosaga nechta bo‘lak solding.',
    ru: 'Нижнее число — знаменатель: на сколько равных долек разрезан гранат. Верхнее — числитель: сколько долек ты положил в миску.',
    en: 'The bottom number is the denominator: how many equal pieces the pomegranate is cut into. The top number is the numerator: how many pieces you put in the bowl.',
  } as Text,
  numerator: { uz: 'surat', ru: 'числитель', en: 'numerator' } as Text,
  denominator: { uz: 'maxraj', ru: 'знаменатель', en: 'denominator' } as Text,
  partsLabel: { uz: 'Bo‘laklar soni', ru: 'Сколько долек', en: 'Number of pieces' } as Text,
  tapHint: {
    uz: 'Bo‘lakni kosaga solish uchun ustiga bos.',
    ru: 'Нажми на дольку, чтобы переложить её в миску.',
    en: 'Tap a piece to move it to the bowl.',
  } as Text,
  challenges: [
    {
      parts: 4,
      filled: 3,
      prompt: { uz: 'Anorning 3/4 qismini kosaga sol.', ru: 'Положи в миску 3/4 граната.', en: 'Put 3/4 of the pomegranate in the bowl.' } as Text,
    },
    {
      parts: 8,
      filled: 5,
      prompt: { uz: 'Endi 5/8 qismini sol.', ru: 'Теперь положи 5/8.', en: 'Now put 5/8 in.' } as Text,
    },
  ],
  needParts: {
    uz: 'Avval anorni {n} ta teng bo‘lakka kes: maxraj — {n}.',
    ru: 'Сначала раздели гранат на {n} равных долек: знаменатель — {n}.',
    en: 'First cut the pomegranate into {n} equal pieces: the denominator is {n}.',
  } as Text,
  needFilled: {
    uz: 'Endi kosaga {n} ta bo‘lak sol: surat — {n}.',
    ru: 'Теперь положи в миску {n} долек: числитель — {n}.',
    en: 'Now put {n} pieces in the bowl: the numerator is {n}.',
  } as Text,
  success: {
    uz: 'Ajoyib! {f} — anorning {d} ta teng bo‘lagidan {n} tasi.',
    ru: 'Здорово! {f} — это {n} из {d} равных долек граната.',
    en: 'Brilliant! {f} means {n} of the pomegranate’s {d} equal pieces.',
  } as Text,
};

/* ---------- Station 3 · Qovun (melon): which piece is bigger ---------- */

export const g4Compare = {
  intro: {
    uz: 'Ikkita bir xil qovunni kesamiz. Qancha ko‘p bo‘lakka kessak, har bir bo‘lak shuncha kichik bo‘ladi.',
    ru: 'Берём две одинаковые дыни. Чем на большее число долек режем, тем меньше каждая долька.',
    en: 'Take two melons of the same size. The more slices we cut, the smaller each slice is.',
  } as Text,
  wallHint: {
    uz: 'Ikkita qovunni tanla va bo‘laklarini solishtir.',
    ru: 'Выбери две дыни и сравни дольки.',
    en: 'Pick two melons and compare their slices.',
  } as Text,
  questions: [
    {
      id: 'c1',
      prompt: { uz: 'Qovunning qaysi qismi katta: 1/3 yoki 1/6?', ru: 'Какая часть дыни больше: 1/3 или 1/6?', en: 'Which piece of melon is bigger: 1/3 or 1/6?' } as Text,
      visual: { type: 'compare-bars', fractions: [[1, 3], [1, 6]] } as Visual,
      choices: ['1/3', '1/6'],
      correct: '1/3',
      wrong: {
        uz: '6 katta son, lekin 6 ta bo‘lakka kesilgan qovunning har bir bo‘lagi mayda. Rasmga qara.',
        ru: '6 — большое число, но у дыни, разрезанной на 6 долек, каждая долька маленькая. Посмотри на рисунок.',
        en: '6 is a big number, but a melon cut into 6 gives small slices. Look at the picture.',
      } as Text,
      right: {
        uz: 'To‘g‘ri! 3 ta bo‘lakka kesilgan qovunning bo‘lagi 6 ta bo‘lakka kesilganinikidan katta.',
        ru: 'Верно! Долька дыни, разрезанной на 3 части, больше, чем дыни, разрезанной на 6.',
        en: 'Right! A slice from a melon cut in 3 is bigger than one from a melon cut in 6.',
      } as Text,
    },
    {
      id: 'c2',
      prompt: { uz: 'Qovunning qaysi qismi ko‘p: 3/8 yoki 5/8?', ru: 'Чего больше: 3/8 дыни или 5/8 дыни?', en: 'Which is more melon: 3/8 or 5/8?' } as Text,
      visual: { type: 'compare-bars', fractions: [[3, 8], [5, 8]] } as Visual,
      choices: ['3/8', '5/8'],
      correct: '5/8',
      wrong: {
        uz: 'Ikkala qovun ham 8 ta bo‘lakka kesilgan, bo‘laklar bir xil katta. Qaysi birida ko‘proq bo‘lak olingan?',
        ru: 'Обе дыни разрезаны на 8 долек, дольки одинаковые. Где взято больше долек?',
        en: 'Both melons are cut into 8 slices of the same size. Which one has more slices taken?',
      } as Text,
      right: {
        uz: 'Barakalla! Bo‘laklar bir xil kattalikda bo‘lsa, ko‘proq bo‘lak — ko‘proq qovun: 5/8 > 3/8.',
        ru: 'Молодец! Если дольки одинаковые, то больше долек — больше дыни: 5/8 > 3/8.',
        en: 'Well done! When the slices are the same size, more slices means more melon: 5/8 > 3/8.',
      } as Text,
    },
  ],
};

/* ---------- Station 4 · Choyxona (teahouse): homework with the hint ladder ---------- */

export const g4Homework: GuidedProblem[] = [
  {
    id: 'g4-hw-chocolate',
    lessonId: G4_LESSON_ID,
    prompt: {
      uz: 'Choyxonada holva 8 ta teng bo‘lakka kesilgan. Sardor 3 bo‘lagini yedi. Nechta bo‘lak qoldi?',
      ru: 'В чайхане халву разрезали на 8 равных кусочков. Сардор съел 3 кусочка. Сколько кусочков осталось?',
      en: 'At the teahouse a slab of halva is cut into 8 equal pieces. Sardor ate 3 pieces. How many pieces are left?',
    },
    input: { kind: 'numbers', fields: [{ id: 'n', label: { uz: 'Bo‘laklar', ru: 'Кусочков', en: 'Pieces' }, answer: 5 }] },
    misconceptions: [
      {
        id: 'answered-eaten',
        when: { n: 3 },
        feedback: {
          uz: '3 — Sardor yegan bo‘laklar. Savol esa nechta bo‘lak qolganini so‘rayapti.',
          ru: '3 — это сколько съел Сардор. А вопрос — сколько осталось.',
          en: '3 is how many Sardor ate. The question asks how many are left.',
        },
      },
      {
        id: 'added',
        when: { n: 11 },
        feedback: {
          uz: 'Bu 8 + 3 ga o‘xshaydi. Holvani yeganda bo‘laklar ko‘payadimi yoki kamayadimi?',
          ru: 'Похоже, получилось 8 + 3. Когда халву едят, кусочков становится больше или меньше?',
          en: 'That looks like 8 + 3. When you eat halva, are there more pieces or fewer?',
        },
      },
      {
        id: 'whole',
        when: { n: 8 },
        feedback: {
          uz: '8 — butun holva. Lekin uning bir qismi yeb bo‘lingan.',
          ru: '8 — это вся халва. Но часть уже съели.',
          en: '8 is the whole slab. But some of it is already eaten.',
        },
      },
    ],
    fieldFeedback: {
      n: {
        uz: 'Hali emas. Keling, birga o‘ylaymiz.',
        ru: 'Пока не так. Давай подумаем вместе.',
        en: 'Not yet. Let’s think it through together.',
      },
    },
    hints: [
      {
        uz: 'Holva nechta bo‘lakka kesilgan? Pastki son 8 shuni aytadi.',
        ru: 'На сколько кусочков разрезана халва? Это показывает нижнее число 8.',
        en: 'How many pieces is the halva cut into? The bottom number 8 tells us.',
      },
      {
        uz: 'Rasmga qara: 8 ta bo‘lak, 3 tasi yeyilgan. Qolganlarini sanab chiq.',
        ru: 'Посмотри на рисунок: 8 кусочков, 3 съедены. Посчитай оставшиеся.',
        en: 'Look at the picture: 8 pieces, 3 eaten. Count the ones left.',
      },
      {
        uz: 'Butun holva — 8 bo‘lak. Yeyilgan 3 tasini ayir: 8 − 3 = ?',
        ru: 'Вся халва — 8 кусочков. Убери 3 съеденных: 8 − 3 = ?',
        en: 'The whole slab is 8 pieces. Take away the 3 eaten ones: 8 − 3 = ?',
      },
      {
        uz: '8 − 3 = 5. Demak, 5 ta bo‘lak qoldi — bu holvaning 5/8 qismi. Endi javobni yoz.',
        ru: '8 − 3 = 5. Значит, осталось 5 кусочков — это 5/8 халвы. Теперь впиши ответ.',
        en: '8 − 3 = 5. So 5 pieces are left, which is 5/8 of the halva. Now type the answer.',
      },
    ],
    hintVisual: { type: 'bar', parts: 8, filled: 3, marked: 'eaten' },
    explanation: {
      uz: 'To‘g‘ri! Holva 8 bo‘lak edi, Sardor 3 tasini yedi. Yeganda bo‘laklar kamayadi, shuning uchun ayiramiz: 8 − 3 = 5. Qolgani — holvaning 5/8 qismi.',
      ru: 'Верно! Халва была из 8 кусочков, Сардор съел 3. Когда едят, кусочков становится меньше, поэтому вычитаем: 8 − 3 = 5. Осталось 5/8 халвы.',
      en: 'Right! The halva had 8 pieces and Sardor ate 3. Eating leaves fewer, so we subtract: 8 − 3 = 5. What is left is 5/8 of the halva.',
    },
  },
  {
    id: 'g4-hw-pizza',
    lessonId: G4_LESSON_ID,
    prompt: {
      uz: 'Aziza nonning 1/3 qismini, Bobur esa xuddi shunday nonning 1/4 qismini yedi. Kim ko‘proq yedi?',
      ru: 'Азиза съела 1/3 лепёшки, а Бобур — 1/4 такой же лепёшки. Кто съел больше?',
      en: 'Aziza ate 1/3 of a flatbread. Bobur ate 1/4 of an identical flatbread. Who ate more?',
    },
    input: {
      kind: 'choice',
      choices: [
        { id: 'aziza', label: { uz: 'Aziza', ru: 'Азиза', en: 'Aziza' } },
        { id: 'bobur', label: { uz: 'Bobur', ru: 'Бобур', en: 'Bobur' }, misconception: 'bigger-denominator' },
        { id: 'same', label: { uz: 'Teng', ru: 'Поровну', en: 'The same' }, misconception: 'ignores-size' },
      ],
      correct: 'aziza',
    },
    misconceptions: [
      {
        id: 'bigger-denominator',
        when: { choice: 'bobur' },
        feedback: {
          uz: '4 soni 3 dan katta, lekin pastki son non nechta bo‘lakka kesilganini aytadi. Bo‘laklar ko‘p bo‘lsa, har biri katta bo‘ladimi?',
          ru: '4 больше 3, но нижнее число говорит, на сколько кусков разрезана лепёшка. Если кусков больше, каждый получается больше?',
          en: '4 is bigger than 3, but the bottom number says how many pieces the flatbread is cut into. With more pieces, is each one bigger?',
        },
      },
      {
        id: 'ignores-size',
        when: { choice: 'same' },
        feedback: {
          uz: 'Ikkalasi ham 1 bo‘lakdan yedi. Lekin bo‘laklar bir xil kattalikdami?',
          ru: 'Оба съели по 1 куску. Но одинаковые ли эти куски?',
          en: 'They each ate 1 piece. But are the pieces the same size?',
        },
      },
    ],
    hints: [
      {
        uz: 'Pastki son nimani bildiradi? 1/3 da non nechta bo‘lakka kesilgan, 1/4 da-chi?',
        ru: 'Что показывает нижнее число? На сколько кусков разрезана лепёшка в 1/3, а в 1/4?',
        en: 'What does the bottom number tell us? How many pieces is the flatbread cut into for 1/3, and for 1/4?',
      },
      {
        uz: 'Ikki nonni solishtir: biri 3 bo‘lakka, ikkinchisi 4 bo‘lakka kesilgan. Qaysi bo‘lak kattaroq ko‘rinadi?',
        ru: 'Сравни две лепёшки: одна разрезана на 3 куска, другая на 4. Какой кусок выглядит больше?',
        en: 'Compare the two flatbreads: one cut into 3 pieces, the other into 4. Which piece looks bigger?',
      },
      {
        uz: 'Bo‘lak kam bo‘lsa, har biri katta. Qaysi non kamroq bo‘lakka kesilgan?',
        ru: 'Чем меньше кусков, тем больше каждый. Какая лепёшка разрезана на меньшее число кусков?',
        en: 'Fewer pieces means each piece is bigger. Which flatbread is cut into fewer pieces?',
      },
      {
        uz: '1/3 — 3 bo‘lakdan bittasi, 1/4 — 4 bo‘lakdan bittasi. 3 bo‘lakli nonning bo‘lagi kattaroq, shuning uchun 1/3 > 1/4. Endi javobni tanla.',
        ru: '1/3 — один из 3 кусков, 1/4 — один из 4 кусков. Кусок из лепёшки на 3 части больше, поэтому 1/3 > 1/4. Теперь выбери ответ.',
        en: '1/3 is one of 3 pieces, 1/4 is one of 4 pieces. A piece from the flatbread cut in 3 is bigger, so 1/3 > 1/4. Now choose your answer.',
      },
    ],
    hintVisual: { type: 'compare-pies', parts: [3, 4] },
    explanation: {
      uz: 'Barakalla! Ikkala non bir xil, lekin biri 3 ta, ikkinchisi 4 ta bo‘lakka kesilgan. Kam bo‘lakka kesilsa, har bir bo‘lak katta bo‘ladi, shuning uchun 1/3 > 1/4. Aziza ko‘proq yedi.',
      ru: 'Отлично! Лепёшки одинаковые, но одну разрезали на 3 куска, другую на 4. Чем меньше кусков, тем каждый больше, поэтому 1/3 > 1/4. Азиза съела больше.',
      en: 'Well done! The flatbreads are identical, but one is cut in 3 and the other in 4. Fewer pieces means each is bigger, so 1/3 > 1/4. Aziza ate more.',
    },
  },
];

/* ---------- Station 5 · Registan: quick quiz ---------- */

export const g4Quiz: QuizQuestion[] = [
  {
    id: 'g4q1',
    skill: 'name',
    prompt: { uz: 'Nonning qancha qismi bo‘yalgan?', ru: 'Какая часть лепёшки закрашена?', en: 'What part of the flatbread is colored?' },
    visual: { type: 'pie', parts: 4, filled: 1 },
    choices: [
      { id: 'a', label: '1/4' },
      { id: 'b', label: '1/3', misconception: 'counted-other' },
      { id: 'c', label: '3/4', misconception: 'counted-uncolored' },
      { id: 'd', label: '4/1', misconception: 'flipped' },
    ],
    correct: 'a',
    explanation: {
      uz: 'Non 4 ta teng bo‘lakka kesilgan — maxraj 4. Bo‘yalgani 1 ta — surat 1. Javob: 1/4.',
      ru: 'Лепёшка разрезана на 4 равных куска — знаменатель 4. Закрашен 1 — числитель 1. Ответ: 1/4.',
      en: 'The flatbread is cut into 4 equal pieces, so the denominator is 4. One piece is colored, so the numerator is 1. Answer: 1/4.',
    },
  },
  {
    id: 'g4q2',
    skill: 'equal',
    prompt: { uz: 'Qaysi rasm 1/2 ni ko‘rsatadi?', ru: 'На какой картинке показана 1/2?', en: 'Which picture shows 1/2?' },
    pictureChoices: true,
    choices: [
      { id: 'a', visual: { type: 'split', shape: 'circle', cuts: [0, 125], filled: [0] }, misconception: 'unequal-parts' },
      { id: 'b', visual: { type: 'split', shape: 'rect', cuts: [0.5], filled: [0] } },
      { id: 'c', visual: { type: 'split', shape: 'rect', cuts: [1 / 3, 2 / 3], filled: [0] }, misconception: 'counted-other' },
    ],
    correct: 'b',
    explanation: {
      uz: '1/2 — butun 2 ta TENG bo‘lakka bo‘linib, bittasi olingan. Aylanadagi rasmda bo‘laklar teng emas, uchtaga bo‘lingan rasmda esa 3 ta bo‘lak bor.',
      ru: '1/2 — целое разделено на 2 РАВНЫЕ части, и взята одна. На круге части не равны, а на третьей картинке частей три.',
      en: '1/2 means the whole is cut into 2 EQUAL parts and one is taken. The circle’s parts are not equal, and the third picture has 3 parts.',
    },
  },
  {
    id: 'g4q3',
    skill: 'compare',
    prompt: { uz: 'Qovunning qaysi qismi katta?', ru: 'Какая часть дыни больше?', en: 'Which piece of melon is bigger?' },
    visual: { type: 'compare-bars', fractions: [[1, 2], [1, 4]] },
    choices: [
      { id: 'a', label: '1/2' },
      { id: 'b', label: '1/4', misconception: 'bigger-denominator' },
      { id: 'c', label: { uz: 'Teng', ru: 'Равны', en: 'They are equal' }, misconception: 'ignores-size' },
    ],
    correct: 'a',
    explanation: {
      uz: 'Qovunni 2 ta bo‘lakka kessak, har bir bo‘lak katta bo‘ladi. 4 ta bo‘lakka kessak, har biri kichik. Shuning uchun 1/2 > 1/4.',
      ru: 'Если разрезать дыню на 2 части, каждая часть большая. Если на 4 — каждая меньше. Поэтому 1/2 > 1/4.',
      en: 'Cut a melon in 2 and each piece is big. Cut it in 4 and each piece is smaller. So 1/2 > 1/4.',
    },
  },
  {
    id: 'g4q4',
    skill: 'name',
    prompt: { uz: 'Qancha qismi bo‘yalmagan?', ru: 'Какая часть НЕ закрашена?', en: 'What part is NOT colored?' },
    visual: { type: 'bar', parts: 6, filled: 4 },
    choices: [
      { id: 'a', label: '4/6', misconception: 'counted-colored' },
      { id: 'b', label: '2/6' },
      { id: 'c', label: '2/4', misconception: 'counted-other' },
      { id: 'd', label: '6/2', misconception: 'flipped' },
    ],
    correct: 'b',
    explanation: {
      uz: 'Jami 6 ta teng bo‘lak — maxraj 6. 4 tasi bo‘yalgan, demak 6 − 4 = 2 tasi bo‘yalmagan. Javob: 2/6.',
      ru: 'Всего 6 равных частей — знаменатель 6. Закрашено 4, значит, не закрашено 6 − 4 = 2. Ответ: 2/6.',
      en: 'There are 6 equal parts, so the denominator is 6. 4 are colored, so 6 − 4 = 2 are not. Answer: 2/6.',
    },
  },
  {
    id: 'g4q5',
    skill: 'word',
    prompt: {
      uz: 'Kamola qovunni 8 ta teng bo‘lakka kesdi va 3 tasini yedi. U qovunning qancha qismini yedi?',
      ru: 'Камола разрезала дыню на 8 равных долек и съела 3. Какую часть дыни она съела?',
      en: 'Kamola cut a melon into 8 equal slices and ate 3. What part of the melon did she eat?',
    },
    choices: [
      { id: 'a', label: '8/3', misconception: 'flipped' },
      { id: 'b', label: '5/8', misconception: 'counted-uncolored' },
      { id: 'c', label: '3/8' },
      { id: 'd', label: '3/5', misconception: 'counted-other' },
    ],
    correct: 'c',
    explanation: {
      uz: 'Qovun 8 ta bo‘lakka kesilgan — bu maxraj. Kamola 3 tasini yedi — bu surat. Javob: 3/8. Qolgan 5 ta bo‘lak 5/8 bo‘ladi.',
      ru: 'Дыня разрезана на 8 долек — это знаменатель. Камола съела 3 — это числитель. Ответ: 3/8. Оставшиеся 5 долек — это 5/8.',
      en: 'The melon is cut into 8 slices, so the denominator is 8. Kamola ate 3, so the numerator is 3. Answer: 3/8. The 5 slices left are 5/8.',
    },
  },
];

/* ---------- Rewards ---------- */

export type G4AchievementId = 'fair-share' | 'builder' | 'sharp-eye' | 'persistent' | 'quiz-star' | 'mission';

export const g4Achievements: { id: G4AchievementId; title: Text; how: Text; color: string }[] = [
  {
    id: 'fair-share',
    title: { uz: 'Adolatli bo‘luvchi', ru: 'Делю поровну', en: 'Fair sharer' },
    how: { uz: 'Teng bo‘laklarni topish', ru: 'Найти равные части', en: 'Find the equal parts' },
    color: '#2DE2C4',
  },
  {
    id: 'builder',
    title: { uz: 'Kasr ustasi', ru: 'Мастер дробей', en: 'Fraction builder' },
    how: { uz: 'Ikki kasr yasash', ru: 'Собрать две дроби', en: 'Build two fractions' },
    color: '#5B8CFF',
  },
  {
    id: 'sharp-eye',
    title: { uz: 'Ziyrak ko‘z', ru: 'Зоркий глаз', en: 'Sharp eye' },
    how: { uz: 'Kasrlarni taqqoslash', ru: 'Сравнить дроби', en: 'Compare fractions' },
    color: '#FFB547',
  },
  {
    id: 'persistent',
    title: { uz: 'Taslim bo‘lmaydi', ru: 'Не сдаюсь!', en: 'Never give up' },
    how: { uz: 'Xatodan keyin yana urinib yechish', ru: 'Решить задачу после ошибки', en: 'Solve a task after a mistake' },
    color: '#FF6B5B',
  },
  {
    id: 'quiz-star',
    title: { uz: 'Test yulduzi', ru: 'Звезда теста', en: 'Quiz star' },
    how: { uz: 'Testda 4 yoki 5 ball olish', ru: 'Набрать 4 или 5 баллов в тесте', en: 'Score 4 or 5 in the quiz' },
    color: '#FFB547',
  },
  {
    id: 'mission',
    title: { uz: 'Missiya bajarildi', ru: 'Миссия выполнена', en: 'Mission complete' },
    how: { uz: 'Darsni oxirigacha o‘tish', ru: 'Пройти весь урок', en: 'Finish the whole lesson' },
    color: '#2DE2C4',
  },
];

export const g4Summary: Text[] = [
  {
    uz: 'Kasr — butunning teng bo‘laklari.',
    ru: 'Дробь — это равные части целого.',
    en: 'A fraction is equal parts of a whole.',
  },
  {
    uz: 'Maxraj — nechta bo‘lakka bo‘linganini, surat — nechta bo‘lak olinganini ko‘rsatadi.',
    ru: 'Знаменатель — на сколько частей делим, числитель — сколько частей взяли.',
    en: 'The denominator says how many parts; the numerator says how many we take.',
  },
  {
    uz: 'Bo‘laklar qancha ko‘p bo‘lsa, har biri shuncha kichik: 1/3 > 1/6.',
    ru: 'Чем больше частей, тем меньше каждая: 1/3 > 1/6.',
    en: 'More parts means smaller parts: 1/3 > 1/6.',
  },
];
