import type { GameId, Miss, Question, StoryKind } from '../../../shared/arcade.ts';
import type { Lang } from '../../../shared/types.ts';

/** Words of the Grades 1–4 games. The Russian and Uzbek are drafts that a teacher still has to review. */
const UI = {
  en: {
    navArcade: 'Games for Grades 1–4', tabArcade: 'Games', subArcade: 'Short games that teach one idea at a time',
    badge: 'Grades 1–4', heroTitle: 'Gamified lessons for primary school',
    heroLead: 'Six short games for children aged 7 to 10. Each one goes after one thing young pupils really get stuck on, so playing is practising the right thing.',
    p1t: 'Own pace', p1: 'Three right in a row and the game gets harder. Two wrong and it steps back. No child is left behind or held back.',
    p2t: 'Explains the mistake', p2: 'A wrong answer gets a picture and a sentence about that exact mistake, then a second try. Never just a red cross.',
    p3t: 'Shows the gaps', p3: 'Every answer feeds a skills map. It shows what is strong and where the gap is, before a test does.',
    grades: 'Grades {a}–{b}', play: 'Play', again: 'Play again', level: 'Level {n}', levelOf: 'Level {n} of {max}', solves: 'The problem it solves',
    mapTitle: 'Skills map', mapLead: 'One square for each level of each game. It fills in as the child plays.',
    mNew: 'Not tried', mPractising: 'Practising', mStrong: 'Strong', mHelp: 'Needs help',
    gapsTitle: 'Where help is needed', gapsNone: 'No gaps found yet. Play a round and the map fills in.', gapsRow: '{right} of {seen} right on the first try',
    mapNote: 'Saved on this device only. No account, no names.', rounds: 'Rounds played: {n}',
    moreTitle: 'More to play', liveTitle: 'Join a live game', liveSub: 'With the class, from the teacher’s code',
    question: 'Question {n} of {total}', check: 'Check', next: 'Next', finish: 'See my result', tryAgain: 'Try once more', quit: 'Back to games',
    right: 'Right!', rightSecond: 'Now it is right.', shown: 'Here is how it works', levelUp: 'Level up! The next ones are a bit harder.', levelDown: 'Stepping back one level to make it solid.',
    follows: 'The level follows you', why: 'Why this game', skill: 'Skill',
    doneTitle: 'Round finished', doneFirst: '{n} of {total} right on the first try', doneLevel: 'You are on level {n}', doneLearned: 'What this round showed',
    tapLine: 'Tap the line where {n} belongs', lineHint: 'Drag the pin, then press Check',
    fillFrame: 'Tap empty squares until the frame is full. How many more does {a} need to make {total}?', added: 'Added: {n}',
    missingTen: 'What goes in the empty place?', bridge: 'Add by making ten first',
    buildNumber: 'Build the number {n} from blocks', readBlocks: 'Which number do these blocks show?', hundreds: 'Hundreds', tens: 'Tens', ones: 'Ones',
    countDots: 'How many dots are there? Count by rows.', buildArray: 'Make {r} rows with {c} in each row', rows: 'Rows', cols: 'In each row', fact: 'How much is it?', missingFactor: 'Which number is missing?',
    bigger: 'Tap the bigger fraction', equal: 'They are equal', pickModel: 'Which picture tells this story?', solveIt: 'Now work it out',
    more: 'More', less: 'Less',
  },
  ru: {
    navArcade: 'Игры для 1–4 классов', tabArcade: 'Игры', subArcade: 'Короткие игры: одна идея за раз',
    badge: '1–4 классы', heroTitle: 'Уроки-игры для начальной школы',
    heroLead: 'Шесть коротких игр для детей 7–10 лет. Каждая направлена на одно место, где младшие школьники действительно застревают, поэтому игра тренирует именно то, что нужно.',
    p1t: 'Свой темп', p1: 'Три верных ответа подряд, и игра становится сложнее. Две ошибки, и она делает шаг назад. Никто не отстаёт и никого не держат.',
    p2t: 'Объясняет ошибку', p2: 'На неверный ответ появляется рисунок и фраза именно об этой ошибке, а затем вторая попытка. Никогда просто красный крестик.',
    p3t: 'Показывает пробелы', p3: 'Каждый ответ попадает на карту умений. Она показывает, что усвоено и где пробел, раньше, чем контрольная.',
    grades: '{a}–{b} классы', play: 'Играть', again: 'Ещё раз', level: 'Уровень {n}', levelOf: 'Уровень {n} из {max}', solves: 'Какую проблему решает',
    mapTitle: 'Карта умений', mapLead: 'Один квадрат на каждый уровень каждой игры. Заполняется по ходу игры.',
    mNew: 'Не пробовал', mPractising: 'Тренируется', mStrong: 'Усвоено', mHelp: 'Нужна помощь',
    gapsTitle: 'Где нужна помощь', gapsNone: 'Пробелов пока не видно. Сыграй раунд, и карта заполнится.', gapsRow: 'с первой попытки верно {right} из {seen}',
    mapNote: 'Хранится только на этом устройстве. Без аккаунта и имён.', rounds: 'Сыграно раундов: {n}',
    moreTitle: 'Ещё поиграть', liveTitle: 'Войти в живую игру', liveSub: 'Вместе с классом, по коду учителя',
    question: 'Вопрос {n} из {total}', check: 'Проверить', next: 'Дальше', finish: 'Мой результат', tryAgain: 'Попробуй ещё раз', quit: 'К играм',
    right: 'Верно!', rightSecond: 'Теперь верно.', shown: 'Вот как это устроено', levelUp: 'Новый уровень! Дальше чуть сложнее.', levelDown: 'Шаг назад на один уровень, чтобы закрепить.',
    follows: 'Уровень подстраивается под тебя', why: 'Зачем эта игра', skill: 'Умение',
    doneTitle: 'Раунд окончен', doneFirst: 'С первой попытки верно {n} из {total}', doneLevel: 'Твой уровень: {n}', doneLearned: 'Что показал этот раунд',
    tapLine: 'Отметь на прямой, где стоит число {n}', lineHint: 'Передвинь метку и нажми «Проверить»',
    fillFrame: 'Нажимай на пустые клетки, пока рамка не заполнится. Сколько не хватает числу {a} до {total}?', added: 'Добавлено: {n}',
    missingTen: 'Что стоит на пустом месте?', bridge: 'Сложи, сначала дополнив до десяти',
    buildNumber: 'Собери число {n} из кубиков', readBlocks: 'Какое число показывают кубики?', hundreds: 'Сотни', tens: 'Десятки', ones: 'Единицы',
    countDots: 'Сколько здесь точек? Считай по рядам.', buildArray: 'Сделай рядов: {r}, в каждом по {c}', rows: 'Ряды', cols: 'В каждом ряду', fact: 'Сколько получится?', missingFactor: 'Какого числа не хватает?',
    bigger: 'Нажми на большую дробь', equal: 'Они равны', pickModel: 'Какая картинка рассказывает эту задачу?', solveIt: 'Теперь посчитай',
    more: 'Больше', less: 'Меньше',
  },
  uz: {
    navArcade: '1–4-sinflar uchun o‘yinlar', tabArcade: 'O‘yinlar', subArcade: 'Har biri bitta g‘oyani o‘rgatadigan qisqa o‘yinlar',
    badge: '1–4-sinflar', heroTitle: 'Boshlang‘ich sinflar uchun o‘yinlashtirilgan darslar',
    heroLead: '7–10 yoshli bolalar uchun oltita qisqa o‘yin. Har biri kichik o‘quvchilar haqiqatan qiynaladigan bitta joyga qaratilgan, shuning uchun o‘ynash kerakli narsani mashq qilishdir.',
    p1t: 'O‘z tezligida', p1: 'Ketma-ket uchta to‘g‘ri javob bo‘lsa, o‘yin qiyinlashadi. Ikkita xato bo‘lsa, bir qadam ortga qaytadi. Hech kim ortda qolmaydi va hech kim kutib turmaydi.',
    p2t: 'Xatoni tushuntiradi', p2: 'Noto‘g‘ri javobga aynan shu xato haqida rasm va gap chiqadi, keyin ikkinchi urinish beriladi. Hech qachon shunchaki qizil belgi emas.',
    p3t: 'Bo‘shliqlarni ko‘rsatadi', p3: 'Har bir javob ko‘nikmalar xaritasiga tushadi. U nima o‘zlashtirilgani va bo‘shliq qayerdaligini nazorat ishidan oldin ko‘rsatadi.',
    grades: '{a}–{b}-sinflar', play: 'O‘ynash', again: 'Yana o‘ynash', level: '{n}-daraja', levelOf: '{max} darajadan {n}-daraja', solves: 'Qaysi muammoni hal qiladi',
    mapTitle: 'Ko‘nikmalar xaritasi', mapLead: 'Har bir o‘yinning har bir darajasi uchun bitta katak. Bola o‘ynagan sari to‘lib boradi.',
    mNew: 'Sinalmagan', mPractising: 'Mashq qilmoqda', mStrong: 'O‘zlashtirilgan', mHelp: 'Yordam kerak',
    gapsTitle: 'Qayerda yordam kerak', gapsNone: 'Hozircha bo‘shliq topilmadi. Bir raund o‘yna, xarita to‘la boshlaydi.', gapsRow: 'birinchi urinishda {seen} tadan {right} tasi to‘g‘ri',
    mapNote: 'Faqat shu qurilmada saqlanadi. Akkauntsiz, ismlarsiz.', rounds: 'O‘ynalgan raundlar: {n}',
    moreTitle: 'Yana o‘ynash uchun', liveTitle: 'Jonli o‘yinga qo‘shil', liveSub: 'Sinf bilan, o‘qituvchi kodi orqali',
    question: '{total} savoldan {n}-savol', check: 'Tekshirish', next: 'Keyingisi', finish: 'Natijamni ko‘rish', tryAgain: 'Yana bir urinib ko‘r', quit: 'O‘yinlarga qaytish',
    right: 'To‘g‘ri!', rightSecond: 'Endi to‘g‘ri.', shown: 'Mana, bu qanday ishlaydi', levelUp: 'Yangi daraja! Keyingilari biroz qiyinroq.', levelDown: 'Mustahkamlash uchun bir daraja ortga qaytamiz.',
    follows: 'Daraja senga moslashadi', why: 'Bu o‘yin nima uchun', skill: 'Ko‘nikma',
    doneTitle: 'Raund tugadi', doneFirst: 'Birinchi urinishda {total} tadan {n} tasi to‘g‘ri', doneLevel: 'Sening darajang: {n}', doneLearned: 'Bu raund nimani ko‘rsatdi',
    tapLine: '{n} soni chiziqning qayerida turishini belgila', lineHint: 'Belgini surib, «Tekshirish»ni bos',
    fillFrame: 'Ramka to‘lguncha bo‘sh kataklarni bos. {a} ga {total} bo‘lishi uchun yana nechta kerak?', added: 'Qo‘shildi: {n}',
    missingTen: 'Bo‘sh joyga qaysi son keladi?', bridge: 'Avval o‘nlikni to‘ldirib qo‘sh',
    buildNumber: '{n} sonini kubiklardan yasa', readBlocks: 'Bu kubiklar qaysi sonni ko‘rsatadi?', hundreds: 'Yuzliklar', tens: 'O‘nliklar', ones: 'Birliklar',
    countDots: 'Bu yerda nechta nuqta bor? Qatorma-qator sana.', buildArray: '{r} ta qator yasa, har birida {c} tadan', rows: 'Qatorlar', cols: 'Har qatorda', fact: 'Nechta bo‘ladi?', missingFactor: 'Qaysi son yetishmayapti?',
    bigger: 'Katta kasrni bos', equal: 'Ular teng', pickModel: 'Qaysi rasm shu masalani ifodalaydi?', solveIt: 'Endi hisobla',
    more: 'Ko‘proq', less: 'Kamroq',
  },
} as const;

export type ArKey = keyof (typeof UI)['en'];
export function at(lang: Lang, key: ArKey, vars: Record<string, string | number> = {}): string {
  return ((UI[lang] ?? UI.en)[key] ?? UI.en[key]).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

type T3 = Record<Lang, string>;
type T3s = Record<Lang, string[]>;
export const GAME_TEXT: Record<GameId, { name: T3; skill: T3; problem: T3; levels: T3s }> = {
  numline: {
    name: { en: 'Number line', ru: 'Числовая прямая', uz: 'Sonlar chizig‘i' },
    skill: { en: 'How big a number is', ru: 'Насколько число велико', uz: 'Sonning kattaligini his qilish' },
    problem: {
      en: 'Many children can count but cannot say how big a number is. Placing numbers on a line builds that feeling for size.',
      ru: 'Многие дети умеют считать, но не чувствуют величину числа. Когда число ставят на прямую, это чувство появляется.',
      uz: 'Ko‘p bola sanashni biladi, lekin sonning kattaligini his qilmaydi. Sonni chiziqqa qo‘yish shu hisni shakllantiradi.',
    },
    levels: { en: ['0 to 10', '0 to 20', '0 to 100', '0 to 1000'], ru: ['от 0 до 10', 'от 0 до 20', 'от 0 до 100', 'от 0 до 1000'], uz: ['0 dan 10 gacha', '0 dan 20 gacha', '0 dan 100 gacha', '0 dan 1000 gacha'] },
  },
  maketen: {
    name: { en: 'Make ten', ru: 'Дополни до десяти', uz: 'O‘nlikni to‘ldir' },
    skill: { en: 'Number pairs that make 10', ru: 'Пары чисел, дающие 10', uz: '10 ni hosil qiluvchi juftliklar' },
    problem: {
      en: 'Counting on fingers is slow and breaks down with bigger numbers. Making ten is the first real strategy for adding.',
      ru: 'Счёт на пальцах медленный и не работает с большими числами. Дополнение до десяти — первый настоящий приём сложения.',
      uz: 'Barmoq bilan sanash sekin va katta sonlarda ishlamaydi. O‘nlikni to‘ldirish — qo‘shishning birinchi haqiqiy usuli.',
    },
    levels: { en: ['Fill up to 10', 'Missing number to 10', 'Fill up to 20', 'Add through 10'], ru: ['Заполни до 10', 'Пропущенное число до 10', 'Заполни до 20', 'Сложение через 10'], uz: ['10 gacha to‘ldir', '10 gacha yetishmagan son', '20 gacha to‘ldir', '10 orqali qo‘shish'] },
  },
  place: {
    name: { en: 'Build the number', ru: 'Собери число', uz: 'Sonni yasa' },
    skill: { en: 'Hundreds, tens and ones', ru: 'Сотни, десятки, единицы', uz: 'Yuzlik, o‘nlik, birlik' },
    problem: {
      en: 'Children see 34 and 43 as the same two digits. Building a number from blocks shows that the place gives a digit its value.',
      ru: 'Дети видят в 34 и 43 одни и те же цифры. Сборка числа из кубиков показывает, что значение цифры зависит от её места.',
      uz: 'Bolalar 34 va 43 ni bir xil raqamlar deb ko‘radi. Sonni kubiklardan yasash raqamning qiymati uning xonasiga bog‘liqligini ko‘rsatadi.',
    },
    levels: { en: ['11 to 19', '20 to 99', '100 to 999', 'Trading ten ones'], ru: ['от 11 до 19', 'от 20 до 99', 'от 100 до 999', 'Обмен десяти единиц'], uz: ['11 dan 19 gacha', '20 dan 99 gacha', '100 dan 999 gacha', 'O‘nta birlikni almashtirish'] },
  },
  arrays: {
    name: { en: 'Rows and columns', ru: 'Ряды и столбцы', uz: 'Qator va ustunlar' },
    skill: { en: 'Multiplication as equal rows', ru: 'Умножение как равные ряды', uz: 'Ko‘paytirish — teng qatorlar' },
    problem: {
      en: 'The times table is often memorised without meaning. Rows and columns show what 3 × 4 really is.',
      ru: 'Таблицу умножения часто заучивают без смысла. Ряды и столбцы показывают, что такое 3 × 4 на самом деле.',
      uz: 'Ko‘paytirish jadvali ko‘pincha ma’nosiz yodlanadi. Qator va ustunlar 3 × 4 aslida nima ekanini ko‘rsatadi.',
    },
    levels: { en: ['Count the rows', 'Build the rows', 'Facts to 9 × 9', 'Missing factor'], ru: ['Считай ряды', 'Построй ряды', 'Примеры до 9 × 9', 'Неизвестный множитель'], uz: ['Qatorlarni sana', 'Qatorlarni yasa', '9 × 9 gacha misollar', 'Noma’lum ko‘paytuvchi'] },
  },
  fractions: {
    name: { en: 'Which is bigger?', ru: 'Что больше?', uz: 'Qaysi biri katta?' },
    skill: { en: 'Comparing fractions', ru: 'Сравнение дробей', uz: 'Kasrlarni taqqoslash' },
    problem: {
      en: 'Pupils think 1/5 is more than 1/3 because 5 is more than 3. Seeing the pieces side by side fixes that idea.',
      ru: 'Ученики думают, что 1/5 больше 1/3, потому что 5 больше 3. Когда части видно рядом, эта ошибка уходит.',
      uz: 'O‘quvchilar 5 soni 3 dan katta bo‘lgani uchun 1/5 ni 1/3 dan katta deb o‘ylaydi. Bo‘laklarni yonma-yon ko‘rish bu xatoni tuzatadi.',
    },
    levels: { en: ['Same bottom number', 'Same top number', 'Against one half', 'Any two fractions'], ru: ['Одинаковый знаменатель', 'Одинаковый числитель', 'Сравнение с половиной', 'Любые две дроби'], uz: ['Maxraji bir xil', 'Surati bir xil', 'Yarim bilan taqqoslash', 'Istalgan ikki kasr'] },
  },
  stories: {
    name: { en: 'Story pictures', ru: 'Задача в картинке', uz: 'Masala rasmi' },
    skill: { en: 'Understanding word problems', ru: 'Понимание текстовых задач', uz: 'Matnli masalani tushunish' },
    problem: {
      en: 'In word problems children often grab the numbers and guess the operation. Choosing a picture of the story first makes them read it.',
      ru: 'В текстовых задачах дети часто берут числа и угадывают действие. Выбор картинки к задаче заставляет сначала её прочитать.',
      uz: 'Matnli masalada bolalar sonlarni olib, amalni taxmin qiladi. Avval masala rasmini tanlash uni o‘qib tushunishga majbur qiladi.',
    },
    levels: { en: ['Add and take away', 'Missing part, compare', 'Numbers to 100', 'Equal groups'], ru: ['Прибавить и отнять', 'Неизвестная часть, сравнение', 'Числа до 100', 'Равные группы'], uz: ['Qo‘shish va ayirish', 'Noma’lum qism, taqqoslash', '100 gacha sonlar', 'Teng guruhlar'] },
  },
};

/* ---------- stories ---------- */

const ruPl = (n: number, f: [string, string, string]) => (n % 10 === 1 && n % 100 !== 11 ? f[0] : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? f[1] : f[2]);
const WHO = [
  { en: 'Ali', uzLoc: 'Alida', ruGen: 'Али' },
  { en: 'Laylo', uzLoc: 'Layloda', ruGen: 'Лайло' },
  { en: 'Bobur', uzLoc: 'Boburda', ruGen: 'Бобура' },
  { en: 'Zarina', uzLoc: 'Zarinada', ruGen: 'Зарины' },
];
const THING: { en: [string, string]; uz: string; ru: [string, string, string] }[] = [
  { en: ['apple', 'apples'], uz: 'olma', ru: ['яблоко', 'яблока', 'яблок'] },
  { en: ['pencil', 'pencils'], uz: 'qalam', ru: ['карандаш', 'карандаша', 'карандашей'] },
  { en: ['book', 'books'], uz: 'kitob', ru: ['книга', 'книги', 'книг'] },
  { en: ['ball', 'balls'], uz: 'koptok', ru: ['мяч', 'мяча', 'мячей'] },
];

export function storyText(lang: Lang, q: Extract<Question, { game: 'stories' }>): string {
  const w = WHO[q.who % WHO.length]!, th = THING[q.thing % THING.length]!, { a, b } = q;
  if (lang === 'uz') {
    const N = w.uzLoc, x = th.uz;
    switch (q.kind) {
      case 'join': return `${N} ${a} ta ${x} bor edi. Unga yana ${b} ta berishdi. Endi ${N} nechta ${x} bor?`;
      case 'separate': return `${N} ${a} ta ${x} bor edi. ${b} tasini do‘stiga berdi. Nechta ${x} qoldi?`;
      case 'missing': return `${N} ${a} ta ${x} bor edi. Sovg‘adan keyin ${b} ta bo‘ldi. Sovg‘ada nechta ${x} bor edi?`;
      case 'compare': return `${N} ${a} ta ${x} bor. Do‘stida ${b} ta. ${N} nechta ko‘proq?`;
      case 'groups': return `${a} ta xalta bor. Har birida ${b} tadan ${x}. Hammasi bo‘lib nechta ${x}?`;
      case 'share': return `${a} ta ${x} ${b} ta do‘stga teng bo‘lib berildi. Har biriga nechtadan tegdi?`;
    }
  }
  if (lang === 'ru') {
    const N = w.ruGen, x = (n: number) => ruPl(n, th.ru), many = th.ru[2];
    switch (q.kind) {
      case 'join': return `У ${N} было ${a} ${x(a)}. Дали ещё ${b}. Сколько теперь ${many} у ${N}?`;
      case 'separate': return `У ${N} было ${a} ${x(a)}. ${b} из них отдали другу. Сколько ${many} осталось?`;
      case 'missing': return `У ${N} было ${a} ${x(a)}. После подарка стало ${b}. Сколько ${many} было в подарке?`;
      case 'compare': return `У ${N} ${a} ${x(a)}, а у друга ${b}. На сколько больше у ${N}?`;
      case 'groups': return `Есть ${a} ${ruPl(a, ['пакет', 'пакета', 'пакетов'])}, в каждом по ${b} ${x(b)}. Сколько всего ${many}?`;
      case 'share': return `${a} ${x(a)} разделили поровну между ${b} друзьями. Сколько получил каждый?`;
    }
  }
  const N = w.en, x = th.en[1];
  switch (q.kind) {
    case 'join': return `${N} has ${a} ${x}. ${N} gets ${b} more. How many ${x} does ${N} have now?`;
    case 'separate': return `${N} had ${a} ${x} and gave ${b} to a friend. How many ${x} are left?`;
    case 'missing': return `${N} had ${a} ${x}. After a gift, ${N} has ${b}. How many ${x} were in the gift?`;
    case 'compare': return `${N} has ${a} ${x}. A friend has ${b}. How many more does ${N} have?`;
    case 'groups': return `There are ${a} bags with ${b} ${x} in each. How many ${x} are there altogether?`;
    case 'share': return `${a} ${x} are shared equally between ${b} friends. How many does each friend get?`;
  }
}

/** The sum behind a story, written out: "12 − 5". */
export function storyExpr(q: Extract<Question, { game: 'stories' }>): string {
  const { a, b } = q;
  return q.kind === 'join' ? `${a} + ${b}` : q.kind === 'missing' ? `${b} − ${a}` : q.kind === 'groups' ? `${a} × ${b}` : q.kind === 'share' ? `${a} ÷ ${b}` : `${a} − ${b}`;
}

const MODEL_WHY: Record<StoryKind, T3> = {
  join: { en: 'Two amounts are put together. The total is what we are looking for.', ru: 'Две части складывают вместе. Ищем целое.', uz: 'Ikki qism birlashtiriladi. Butunni izlaymiz.' },
  separate: { en: 'We know the whole and the part that went away. The part that is left is unknown.', ru: 'Мы знаем целое и часть, которую отдали. Неизвестна оставшаяся часть.', uz: 'Butun va berib yuborilgan qism ma’lum. Qolgan qism noma’lum.' },
  missing: { en: 'We know the whole now and the part from before. The part that was added is unknown.', ru: 'Мы знаем, сколько стало, и часть, которая была. Неизвестна добавленная часть.', uz: 'Hozirgi butun va avvalgi qism ma’lum. Qo‘shilgan qism noma’lum.' },
  compare: { en: 'Two amounts stand side by side. The difference between them is unknown.', ru: 'Два количества стоят рядом. Неизвестна разница между ними.', uz: 'Ikki miqdor yonma-yon turibdi. Ular orasidagi farq noma’lum.' },
  groups: { en: 'Equal groups: the same amount in every bag. The total is unknown.', ru: 'Равные группы: в каждом пакете поровну. Неизвестно, сколько всего.', uz: 'Teng guruhlar: har bir xaltada bir xil miqdor. Hammasi noma’lum.' },
  share: { en: 'The whole is known and is split into equal parts. One part is unknown.', ru: 'Целое известно, его делят на равные части. Неизвестна одна часть.', uz: 'Butun ma’lum va teng qismlarga bo‘linadi. Bitta qism noma’lum.' },
};
const OP: Record<StoryKind, T3> = {
  join: { en: 'add', ru: 'сложить', uz: 'qo‘shish' }, separate: { en: 'subtract', ru: 'вычесть', uz: 'ayirish' }, missing: { en: 'subtract', ru: 'вычесть', uz: 'ayirish' },
  compare: { en: 'subtract', ru: 'вычесть', uz: 'ayirish' }, groups: { en: 'multiply', ru: 'умножить', uz: 'ko‘paytirish' }, share: { en: 'divide', ru: 'разделить', uz: 'bo‘lish' },
};

const fr = (f: [number, number]) => `${f[0]}/${f[1]}`;
const repeat = (n: number, times: number) => Array.from({ length: times }, () => n).join(' + ');
const skip = (n: number, times: number) => Array.from({ length: times }, (_, i) => n * (i + 1)).join(', ');

/** The sentence a child reads after a wrong answer: about this mistake, with these numbers. */
export function hintText(lang: Lang, q: Question, miss: Miss, given?: unknown): string {
  const L = <T,>(t: Record<Lang, T>) => t[lang] ?? t.en;
  switch (q.game) {
    case 'numline': {
      const mid = (q.min + q.max) / 2, t = q.target, lo = Math.floor(t / q.step) * q.step, hi = lo + q.step, less = t < mid;
      if (miss === 'nl_half') return L({
        en: `${t} is ${less ? 'less' : 'more'} than ${mid}, the middle of the line. So it sits on the ${less ? 'left' : 'right'} half.`,
        ru: `${t} ${less ? 'меньше' : 'больше'}, чем ${mid} — середина прямой. Значит, оно в ${less ? 'левой' : 'правой'} половине.`,
        uz: `${t} soni chiziqning o‘rtasi — ${mid} dan ${less ? 'kichik' : 'katta'}. Demak, u ${less ? 'chap' : 'o‘ng'} yarmida turadi.`,
      });
      return L({ en: `Close. Use the marks: ${t} is between ${lo} and ${hi}.`, ru: `Близко. Смотри на отметки: ${t} стоит между ${lo} и ${hi}.`, uz: `Yaqin. Belgilarga qara: ${t} soni ${lo} bilan ${hi} orasida turadi.` });
    }
    case 'maketen': {
      if (q.kind === 'bridge') {
        const k = 10 - q.a, rest = q.b - k;
        return L({
          en: `Make ten first: ${q.a} + ${k} = 10. That leaves ${rest} from the ${q.b}. Then 10 + ${rest} = ${q.total}.`,
          ru: `Сначала дополни до десяти: ${q.a} + ${k} = 10. От ${q.b} останется ${rest}. Потом 10 + ${rest} = ${q.total}.`,
          uz: `Avval o‘nlikni to‘ldir: ${q.a} + ${k} = 10. ${q.b} dan ${rest} qoladi. Keyin 10 + ${rest} = ${q.total}.`,
        });
      }
      return L({
        en: `Count the empty squares one by one: ${q.a} needs ${q.answer} more to make ${q.total}.`,
        ru: `Посчитай пустые клетки по одной: числу ${q.a} до ${q.total} не хватает ${q.answer}.`,
        uz: `Bo‘sh kataklarni bittalab sana: ${q.a} ga ${q.total} bo‘lishi uchun yana ${q.answer} kerak.`,
      });
    }
    case 'place': {
      const t = q.target, H = Math.floor(t / 100), T = Math.floor((t % 100) / 10), O = t % 10;
      if (q.kind === 'read') return L({
        en: `Ten ones make one ten. ${q.ones} ones are 1 ten and ${q.ones - 10} ones. That gives ${q.tens + 1} tens and ${q.ones - 10} ones: ${t}.`,
        ru: `Десять единиц — это один десяток. Единиц ${q.ones}: это 1 десяток и ещё ${q.ones - 10}. Всего десятков ${q.tens + 1}, единиц ${q.ones - 10}: получается ${t}.`,
        uz: `O‘nta birlik bitta o‘nlik bo‘ladi. ${q.ones} ta birlik — 1 ta o‘nlik va ${q.ones - 10} ta birlik. Jami ${q.tens + 1} ta o‘nlik va ${q.ones - 10} ta birlik: ${t}.`,
      });
      if (miss === 'pv_swap') return L({
        en: `The places are swapped. In ${t}, the ${T} stands for tens and the ${O} for ones.`,
        ru: `Разряды поменялись местами. В числе ${t} цифра ${T} — десятки, а ${O} — единицы.`,
        uz: `Xonalar almashib qolgan. ${t} sonida ${T} — o‘nliklar, ${O} — birliklar.`,
      });
      const g = given as { h: number; t: number; o: number } | undefined, v = g ? g.h * 100 + g.t * 10 + g.o : 0;
      const parts = L({
        en: `${H ? `hundreds: ${H}, ` : ''}tens: ${T}, ones: ${O}`,
        ru: `${H ? `сотни: ${H}, ` : ''}десятки: ${T}, единицы: ${O}`,
        uz: `${H ? `${H} ta yuzlik, ` : ''}${T} ta o‘nlik, ${O} ta birlik`,
      });
      return L({ en: `You built ${v}. ${t} needs ${parts}.`, ru: `У тебя получилось ${v}. Для ${t} нужно: ${parts}.`, uz: `Sen ${v} sonini yasading. ${t} uchun kerak: ${parts}.` });
    }
    case 'arrays': {
      const { rows: r, cols: c } = q, p = r * c;
      if (q.kind === 'build') return L({ en: `You need ${r} rows, with ${c} in each row.`, ru: `Нужно рядов: ${r}, и в каждом по ${c}.`, uz: `${r} ta qator kerak, har birida ${c} tadan.` });
      if (q.kind === 'missing') return L({
        en: `Count in steps of ${c}: ${skip(c, r)}. That took ${r} steps, so ${r} × ${c} = ${p}.`,
        ru: `Считай шагами по ${c}: ${skip(c, r)}. Шагов получилось ${r}, значит ${r} × ${c} = ${p}.`,
        uz: `${c} tadan sana: ${skip(c, r)}. ${r} ta qadam bo‘ldi, demak ${r} × ${c} = ${p}.`,
      });
      if (miss === 'arr_add') return L({
        en: `${r} rows of ${c} is not ${r} + ${c}. It is ${repeat(c, r)} = ${p}.`,
        ru: `Рядов ${r}, в каждом по ${c}: это не ${r} + ${c}, а ${repeat(c, r)} = ${p}.`,
        uz: `${r} ta qator, har birida ${c} tadan — bu ${r} + ${c} emas. Bu ${repeat(c, r)} = ${p}.`,
      });
      return L({ en: `Count row by row: ${skip(c, r)}. So ${r} × ${c} = ${p}.`, ru: `Считай по рядам: ${skip(c, r)}. Значит, ${r} × ${c} = ${p}.`, uz: `Qatorma-qator sana: ${skip(c, r)}. Demak, ${r} × ${c} = ${p}.` });
    }
    case 'fractions': {
      const big = q.answer === 'a' ? q.a : q.b, small = q.answer === 'a' ? q.b : q.a;
      if (miss === 'fr_equal') return L({
        en: `These are the same amount. Cut ${fr(q.a[1] < q.b[1] ? q.a : q.b)} into smaller pieces and you get ${fr(q.a[1] < q.b[1] ? q.b : q.a)}: the bars are equally long.`,
        ru: `Они равны. Если ${fr(q.a[1] < q.b[1] ? q.a : q.b)} разрезать на части помельче, получится ${fr(q.a[1] < q.b[1] ? q.b : q.a)}: полоски одной длины.`,
        uz: `Bular teng. ${fr(q.a[1] < q.b[1] ? q.a : q.b)} ni maydaroq bo‘laklarga bo‘lsak, ${fr(q.a[1] < q.b[1] ? q.b : q.a)} chiqadi: tasmalar bir xil uzunlikda.`,
      });
      if (miss === 'fr_bigden') return L({
        en: `More pieces means smaller pieces. Cut into ${small[1]}, each piece is smaller than when cut into ${big[1]}. So ${fr(small)} is less than ${fr(big)}.`,
        ru: `Чем больше частей, тем они меньше. Если делить на ${small[1]}, каждая часть меньше, чем если делить на ${big[1]}. Поэтому ${fr(small)} меньше, чем ${fr(big)}.`,
        uz: `Bo‘laklar ko‘paysa, har biri kichrayadi. ${small[1]} ga bo‘linganda har bir bo‘lak ${big[1]} ga bo‘lingandagidan kichik. Shuning uchun ${fr(small)} kasri ${fr(big)} dan kichik.`,
      });
      if (miss === 'fr_top') return L({
        en: `Bigger numbers do not mean a bigger fraction. Look at the bars: ${fr(small)} covers less than ${fr(big)}.`,
        ru: `Большие числа не значат большую дробь. Посмотри на полоски: ${fr(small)} занимает меньше, чем ${fr(big)}.`,
        uz: `Katta raqamlar kattaroq kasr degani emas. Tasmalarga qara: ${fr(small)} kasri ${fr(big)} dan kam joy egallaydi.`,
      });
      if (q.a[1] === q.b[1]) return L({
        en: `The pieces are the same size here. ${big[0]} pieces are more than ${small[0]}, so ${fr(big)} is bigger.`,
        ru: `Части здесь одного размера. ${big[0]} частей больше, чем ${small[0]}, поэтому ${fr(big)} больше.`,
        uz: `Bu yerda bo‘laklar bir xil kattalikda. ${big[0]} ta bo‘lak ${small[0]} tadan ko‘p, shuning uchun ${fr(big)} katta.`,
      });
      return L({
        en: 'Compare the coloured parts of the two bars. The longer one is the bigger fraction.',
        ru: 'Сравни закрашенные части двух полосок. Какая длиннее, та дробь и больше.',
        uz: 'Ikki tasmaning bo‘yalgan qismini solishtir. Qaysi biri uzun bo‘lsa, o‘sha kasr katta.',
      });
    }
    case 'stories': {
      if (miss === 'st_model') return L(MODEL_WHY[q.kind]);
      const op = L(OP[q.kind]), e = storyExpr(q);
      if (miss === 'st_op') return L({
        en: `Look at the picture again. Here you need to ${op}: ${e} = ${q.answer}.`,
        ru: `Посмотри на картинку ещё раз. Здесь нужно ${op}: ${e} = ${q.answer}.`,
        uz: `Rasmga yana bir qara. Bu yerda ${op} kerak: ${e} = ${q.answer}.`,
      });
      return L({ en: `The picture is right. Check the counting: ${e} = ?`, ru: `Картинка выбрана верно. Проверь счёт: ${e} = ?`, uz: `Rasm to‘g‘ri tanlangan. Hisobni tekshir: ${e} = ?` });
    }
  }
}

/** One line that says why the right answer is right. Shown after a right answer and when the answer is revealed. */
export function whyText(lang: Lang, q: Question): string {
  const L = <T,>(t: Record<Lang, T>) => t[lang] ?? t.en;
  switch (q.game) {
    case 'numline': {
      const lo = Math.floor(q.target / q.step) * q.step, hi = lo + q.step;
      return q.snap ? L({ en: `${q.target} comes right after ${q.target - 1}.`, ru: `${q.target} идёт сразу после ${q.target - 1}.`, uz: `${q.target} soni ${q.target - 1} dan keyin keladi.` })
        : L({ en: `${q.target} is between ${lo} and ${hi}.`, ru: `${q.target} стоит между ${lo} и ${hi}.`, uz: `${q.target} soni ${lo} bilan ${hi} orasida turadi.` });
    }
    case 'maketen':
      return q.kind === 'bridge' ? `${q.a} + ${10 - q.a} = 10,  10 + ${q.b - (10 - q.a)} = ${q.total}` : `${q.a} + ${q.answer} = ${q.total}`;
    case 'place': {
      const t = q.target, H = Math.floor(t / 100), T = Math.floor((t % 100) / 10), O = t % 10;
      return `${t} = ${H ? `${H * 100} + ` : ''}${T * 10} + ${O}`;
    }
    case 'arrays':
      return `${q.rows} × ${q.cols} = ${repeat(q.cols, q.rows)} = ${q.rows * q.cols}`;
    case 'fractions':
      return q.answer === 'eq' ? `${fr(q.a)} = ${fr(q.b)}` : q.answer === 'a' ? `${fr(q.a)} > ${fr(q.b)}` : `${fr(q.a)} < ${fr(q.b)}`;
    case 'stories':
      return `${storyExpr(q)} = ${q.answer}`;
  }
}

/** A mistake as a short label, for the round summary. */
export function missLabel(lang: Lang, miss: Miss): string {
  const M: Record<Miss, T3> = {
    nl_half: { en: 'Put the number on the wrong half of the line', ru: 'Число поставлено не в ту половину прямой', uz: 'Son chiziqning noto‘g‘ri yarmiga qo‘yildi' },
    nl_near: { en: 'Close on the line, but not close enough', ru: 'На прямой близко, но неточно', uz: 'Chiziqda yaqin, lekin aniq emas' },
    ten_off: { en: 'Miscounted the pair that makes ten', ru: 'Ошибка в паре, дающей десять', uz: 'O‘nlikni to‘ldiruvchi juftlikda xato' },
    ten_bridge: { en: 'Adding past ten', ru: 'Сложение с переходом через десять', uz: 'O‘nlikdan o‘tib qo‘shish' },
    pv_swap: { en: 'Swapped tens and ones', ru: 'Перепутаны десятки и единицы', uz: 'O‘nlik va birliklar almashtirildi' },
    pv_build: { en: 'Wrong number of blocks in a place', ru: 'Не то число кубиков в разряде', uz: 'Xonadagi kubiklar soni noto‘g‘ri' },
    pv_regroup: { en: 'Ten ones were not traded for a ten', ru: 'Десять единиц не обменяны на десяток', uz: 'O‘nta birlik o‘nlikka almashtirilmadi' },
    arr_add: { en: 'Added rows and columns instead of multiplying', ru: 'Ряды и столбцы сложены вместо умножения', uz: 'Qator va ustunlar ko‘paytirilmay, qo‘shildi' },
    arr_rows: { en: 'Lost count of the rows', ru: 'Сбился счёт рядов', uz: 'Qatorlarni sanashda adashildi' },
    fr_bigden: { en: 'Thought a bigger bottom number means a bigger fraction', ru: 'Решил, что больший знаменатель — большая дробь', uz: 'Katta maxraj — katta kasr deb o‘ylandi' },
    fr_top: { en: 'Judged a fraction by its big numbers', ru: 'Дробь оценена по большим числам', uz: 'Kasr katta raqamlariga qarab baholandi' },
    fr_equal: { en: 'Did not see that two fractions are equal', ru: 'Не замечено, что дроби равны', uz: 'Kasrlar tengligi payqalmadi' },
    fr_other: { en: 'Compared two fractions the wrong way round', ru: 'Дроби сравнены наоборот', uz: 'Kasrlar teskari taqqoslandi' },
    st_model: { en: 'Picked the wrong picture for the story', ru: 'Выбрана не та картинка к задаче', uz: 'Masalaga noto‘g‘ri rasm tanlandi' },
    st_op: { en: 'Used the wrong operation', ru: 'Выбрано не то действие', uz: 'Noto‘g‘ri amal tanlandi' },
    st_calc: { en: 'Right idea, slip in the counting', ru: 'Идея верная, ошибка в счёте', uz: 'G‘oya to‘g‘ri, hisobda xato' },
  };
  return (M[miss] ?? M.st_calc)[lang] ?? M[miss].en;
}
