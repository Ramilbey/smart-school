import type { MissId, NodeId } from '../../../shared/gapfinder.ts';
import type { Lang } from '../../../shared/types.ts';

/** Words of the equation gap finder. The Russian and Uzbek are drafts that a teacher still has to review. */
type T3 = Record<Lang, string>;

export const UI = {
  kicker: { en: 'Grade 7 · Equations', ru: '7 класс · Уравнения', uz: '7-sinf · Tenglamalar' },
  title: { en: 'Stuck on equations? Find the real gap.', ru: 'Не получаются уравнения? Найди настоящий пробел.', uz: 'Tenglamalar chiqmayaptimi? Haqiqiy bo‘shliqni top.' },
  lead: {
    en: 'A wrong answer in Grade 7 usually comes from a skill missed in Grade 5 or 6: negative numbers, brackets, like terms. Solve one equation. If it goes wrong, this traces your answer back to the exact missing skill, fixes it in a few minutes, and gives you the same equation again.',
    ru: 'Ошибка в 7 классе обычно идёт от навыка, пропущенного в 5–6 классе: отрицательные числа, скобки, подобные слагаемые. Реши одно уравнение. Если не выйдет, мы по твоему ответу найдём именно тот пропущенный навык, закроем его за несколько минут и дадим то же уравнение снова.',
    uz: '7-sinfdagi xato odatda 5–6-sinfda o‘tkazib yuborilgan ko‘nikmadan keladi: manfiy sonlar, qavslar, o‘xshash hadlar. Bitta tenglamani yech. Xato chiqsa, javobingdan aynan qaysi ko‘nikma yetishmayotganini topamiz, uni bir necha daqiqada to‘ldiramiz va o‘sha tenglamani yana beramiz.',
  },
  start: { en: 'Start: one equation', ru: 'Начать: одно уравнение', uz: 'Boshlash: bitta tenglama' },
  how1: { en: 'Solve one equation', ru: 'Реши одно уравнение', uz: 'Bitta tenglamani yech' },
  how2: { en: 'Your answer is traced back, skill by skill', ru: 'Ответ разбирается по навыкам, шаг за шагом', uz: 'Javobing ko‘nikmalar bo‘yicha tekshiriladi' },
  how3: { en: 'The missing skill is fixed in 2 minutes', ru: 'Пропущенный навык закрывается за 2 минуты', uz: 'Yetishmagan ko‘nikma 2 daqiqada to‘ldiriladi' },
  how4: { en: 'The same equation again: now it works', ru: 'То же уравнение снова: теперь получается', uz: 'O‘sha tenglama yana: endi chiqadi' },
  evidenceTitle: { en: 'Why look for the gap', ru: 'Зачем искать пробел', uz: 'Nega bo‘shliqni izlash kerak' },
  evidence: {
    en: 'In a 2025 study of Algebra 1 students, those missing earlier skills mastered new content 13% of the time, those who had them 58%. Studies of Grade 9 pupils find the same few mistakes again and again: signs, brackets, moving terms.',
    ru: 'В исследовании 2025 года ученики, у которых не хватало прежних навыков, осваивали новую тему алгебры в 13% случаев, а те, у кого они были, в 58%. Исследования девятиклассников раз за разом находят одни и те же ошибки: знаки, скобки, перенос слагаемых.',
    uz: '2025-yilgi tadqiqotda oldingi ko‘nikmalari yetishmagan o‘quvchilar algebraning yangi mavzusini 13% hollarda, ular bor o‘quvchilar esa 58% hollarda o‘zlashtirgan. 9-sinf o‘quvchilari tadqiqotlari bir xil xatolarni qayta-qayta topadi: ishoralar, qavslar, hadlarni ko‘chirish.',
  },
  sources: { en: 'Sources', ru: 'Источники', uz: 'Manbalar' },
  solveX: { en: 'Solve for x', ru: 'Найди x', uz: 'x ni top' },
  fillBlank: { en: 'What goes in the □?', ru: 'Что стоит вместо □?', uz: '□ o‘rniga nima keladi?' },
  workOut: { en: 'Work it out', ru: 'Вычисли', uz: 'Hisobla' },
  check: { en: 'Check', ru: 'Проверить', uz: 'Tekshirish' },
  checking: { en: 'Now checking: {skill}', ru: 'Проверяем: {skill}', uz: 'Tekshiryapmiz: {skill}' },
  qn: { en: 'Question {n}', ru: 'Вопрос {n}', uz: '{n}-savol' },
  mapTitle: { en: 'Skills map', ru: 'Карта навыков', uz: 'Ko‘nikmalar xaritasi' },
  mapLead: { en: 'Each equation is built on the skills below it. The map fills in as you answer.', ru: 'Каждое уравнение опирается на навыки под ним. Карта заполняется по ходу ответов.', uz: 'Har bir tenglama pastidagi ko‘nikmalarga tayanadi. Xarita javob bergan sari to‘ladi.' },
  lPass: { en: 'Knows it', ru: 'Знает', uz: 'Biladi' },
  lFail: { en: 'Missing', ru: 'Пробел', uz: 'Bo‘shliq' },
  lRoot: { en: 'The real gap', ru: 'Настоящий пробел', uz: 'Haqiqiy bo‘shliq' },
  lOpen: { en: 'Not checked', ru: 'Не проверено', uz: 'Tekshirilmagan' },
  right: { en: 'Right', ru: 'Верно', uz: 'To‘g‘ri' },
  wrong: { en: 'Not quite', ru: 'Не совсем', uz: 'Unchalik emas' },
  next: { en: 'Next', ru: 'Дальше', uz: 'Keyingisi' },
  foundTitle: { en: 'Found it', ru: 'Нашли', uz: 'Topildi' },
  foundGap: { en: 'The equation breaks because of: {skill}', ru: 'Уравнение не выходит из-за навыка: {skill}', uz: 'Tenglama shu ko‘nikma sabab chiqmayapti: {skill}' },
  fromGrade: { en: 'usually taught in Grade {g}', ru: 'обычно проходят в {g} классе', uz: 'odatda {g}-sinfda o‘tiladi' },
  watchOut: { en: 'What to watch for', ru: 'На что обратить внимание', uz: 'Nimaga e’tibor berish kerak' },
  whyAnswer: { en: 'Why your answer was {v}', ru: 'Почему у тебя вышло {v}', uz: 'Nega javobing {v} chiqdi' },
  noGapTitle: { en: 'No gap found', ru: 'Пробелов не найдено', uz: 'Bo‘shliq topilmadi' },
  noGap: { en: 'You solved the equations right. These skills are solid.', ru: 'Ты решил уравнения верно. Эти навыки на месте.', uz: 'Tenglamalarni to‘g‘ri yechding. Bu ko‘nikmalar mustahkam.' },
  fixNow: { en: 'Fix it now (2 minutes)', ru: 'Закрыть пробел (2 минуты)', uz: 'Hozir to‘ldirish (2 daqiqa)' },
  teacherTitle: { en: 'For your teacher', ru: 'Для учителя', uz: 'O‘qituvching uchun' },
  copy: { en: 'Copy', ru: 'Копировать', uz: 'Nusxalash' },
  copied: { en: 'Copied', ru: 'Скопировано', uz: 'Nusxalandi' },
  teacherLine: {
    en: 'Equation check: the gap is "{skill}" (Grade {g}). Mistake seen: {miss}. After practice, the equation {fixed}.',
    ru: 'Проверка уравнений: пробел — «{skill}» ({g} класс). Ошибка: {miss}. После практики уравнение {fixed}.',
    uz: 'Tenglama tekshiruvi: bo‘shliq — «{skill}» ({g}-sinf). Xato: {miss}. Mashqdan keyin tenglama {fixed}.',
  },
  fixedYes: { en: 'was solved', ru: 'решено', uz: 'yechildi' },
  fixedNo: { en: 'is not solved yet', ru: 'пока не решено', uz: 'hali yechilmadi' },
  fixedNotTried: { en: 'was not tried yet', ru: 'ещё не пробовали', uz: 'hali sinab ko‘rilmadi' },
  noMiss: { en: 'no single pattern', ru: 'без явной закономерности', uz: 'aniq qonuniyat yo‘q' },
  lessonOf: { en: 'Fixing: {skill}', ru: 'Закрываем: {skill}', uz: 'To‘ldiryapmiz: {skill}' },
  practice: { en: 'Three quick ones', ru: 'Три быстрых примера', uz: 'Uchta tezkor misol' },
  practiceN: { en: 'Practice {n} of 3', ru: 'Пример {n} из 3', uz: '3 tadan {n}-misol' },
  showSteps: { en: 'The working', ru: 'Решение', uz: 'Yechim' },
  retestTitle: { en: 'Now the equation you got wrong', ru: 'А теперь уравнение, в котором была ошибка', uz: 'Endi xato qilgan tenglamang' },
  closedTitle: { en: 'Gap closed', ru: 'Пробел закрыт', uz: 'Bo‘shliq yopildi' },
  closed: { en: 'You fixed {skill}, and the equation that went wrong now works.', ru: 'Ты закрыл навык «{skill}», и уравнение с ошибкой теперь решено.', uz: '«{skill}» ko‘nikmasini to‘ldirding, xato qilgan tenglama endi yechildi.' },
  notYetTitle: { en: 'Almost', ru: 'Почти', uz: 'Oz qoldi' },
  notYet: { en: 'Look at the working below. The next gap on your map is worth fixing too.', ru: 'Посмотри решение ниже. Следующий пробел на карте тоже стоит закрыть.', uz: 'Quyidagi yechimga qara. Xaritadagi keyingi bo‘shliqni ham to‘ldirish kerak.' },
  nextGap: { en: 'Fix the next gap', ru: 'Закрыть следующий пробел', uz: 'Keyingi bo‘shliqni to‘ldirish' },
  again: { en: 'Start again', ru: 'Начать заново', uz: 'Qaytadan boshlash' },
  pupils: { en: 'Pupil', ru: 'Ученик', uz: 'O‘quvchi' },
  minus: { en: 'minus', ru: 'минус', uz: 'minus' },
  erase: { en: 'erase', ru: 'стереть', uz: 'o‘chirish' },
} satisfies Record<string, T3>;

export type UiKey = keyof typeof UI;
export const ut = (lang: Lang, k: UiKey, v: Record<string, string | number> = {}) => (UI[k][lang] ?? UI[k].en).replace(/\{(\w+)\}/g, (_, x) => String(v[x] ?? ''));

export const SKILL: Record<NodeId, T3> = {
  eq_br: { en: 'Equations with brackets', ru: 'Уравнения со скобками', uz: 'Qavsli tenglamalar' },
  eq_both: { en: 'x on both sides', ru: 'x в обеих частях', uz: 'x ikkala tomonda' },
  dist: { en: 'Opening brackets', ru: 'Раскрытие скобок', uz: 'Qavslarni ochish' },
  eq2: { en: 'Two-step equations', ru: 'Уравнения в два шага', uz: 'Ikki qadamli tenglamalar' },
  like: { en: 'Like terms', ru: 'Подобные слагаемые', uz: 'O‘xshash hadlar' },
  eq1: { en: 'Undoing an operation', ru: 'Обратное действие', uz: 'Teskari amal' },
  int_add: { en: 'Adding and subtracting negatives', ru: 'Сложение и вычитание отрицательных', uz: 'Manfiy sonlarni qo‘shish va ayirish' },
  int_mul: { en: 'Multiplying and dividing negatives', ru: 'Умножение и деление отрицательных', uz: 'Manfiy sonlarni ko‘paytirish va bo‘lish' },
};

export const MISS: Record<MissId, T3> = {
  sign_add: { en: 'Watch the sign: when the signs differ, subtract and take the sign of the bigger number. −7 + 3 = −4.', ru: 'Следи за знаком: при разных знаках вычитай и бери знак большего числа. −7 + 3 = −4.', uz: 'Ishoraga e’tibor ber: ishoralar har xil bo‘lsa, ayir va kattasining ishorasini ol. −7 + 3 = −4.' },
  minus_neg: { en: 'Subtracting a negative number is adding it: 6 − (−2) = 6 + 2 = 8.', ru: 'Вычесть отрицательное число значит прибавить его: 6 − (−2) = 6 + 2 = 8.', uz: 'Manfiy sonni ayirish uni qo‘shish demakdir: 6 − (−2) = 6 + 2 = 8.' },
  sign_mul: { en: 'Same signs give plus, different signs give minus: (−3) · (−4) = 12, (−3) · 4 = −12.', ru: 'Одинаковые знаки дают плюс, разные — минус: (−3) · (−4) = 12, (−3) · 4 = −12.', uz: 'Bir xil ishoralar plyus, har xillari minus beradi: (−3) · (−4) = 12, (−3) · 4 = −12.' },
  div_sign: { en: 'Division follows the same sign rule as multiplication: −12 : 3 = −4, −12 : (−3) = 4.', ru: 'Деление подчиняется тому же правилу знаков: −12 : 3 = −4, −12 : (−3) = 4.', uz: 'Bo‘lishda ham ishora qoidasi bir xil: −12 : 3 = −4, −12 : (−3) = 4.' },
  dist_first: { en: 'The number in front multiplies every term in the brackets, not just the x: 3(x − 2) = 3x − 6.', ru: 'Число перед скобкой умножается на каждое слагаемое, а не только на x: 3(x − 2) = 3x − 6.', uz: 'Qavs oldidagi son qavsdagi har bir hadga ko‘paytiriladi, faqat x ga emas: 3(x − 2) = 3x − 6.' },
  dist_sign: { en: 'A minus in front flips every sign inside: −2(x − 5) = −2x + 10.', ru: 'Минус перед скобкой меняет каждый знак внутри: −2(x − 5) = −2x + 10.', uz: 'Qavs oldidagi minus ichidagi har bir ishorani o‘zgartiradi: −2(x − 5) = −2x + 10.' },
  like_sign: { en: 'Each term keeps the sign in front of it: 2x − 5x = (2 − 5)x = −3x.', ru: 'Каждое слагаемое сохраняет свой знак: 2x − 5x = (2 − 5)x = −3x.', uz: 'Har bir had oldidagi ishorasini saqlaydi: 2x − 5x = (2 − 5)x = −3x.' },
  move_sign: { en: 'A term that crosses the = changes its sign, because you really subtract it from both sides.', ru: 'Слагаемое, переходя через =, меняет знак: на самом деле ты вычитаешь его из обеих частей.', uz: '= orqali o‘tgan had ishorasini o‘zgartiradi: aslida uni ikkala tomondan ayirasan.' },
  inv_op: { en: 'Undo with the opposite operation: undo × with :, and undo + with −.', ru: 'Отменяй обратным действием: × отменяется делением, + — вычитанием.', uz: 'Teskari amal bilan bekor qil: × ni bo‘lish, + ni ayirish bekor qiladi.' },
};

/** What the pupil learns in the two-minute fix: two short cards and the picture that goes with them. */
export type Visual = 'numline' | 'signs' | 'area' | 'tiles' | 'balance';
export const LESSON: Record<NodeId, { visual: Visual; cards: T3[] }> = {
  int_add: {
    visual: 'numline',
    cards: [
      { en: 'On the number line, + moves right and − moves left. −7 + 3: start at −7, take 3 steps right, land on −4.', ru: 'На числовой прямой + ведёт вправо, − влево. −7 + 3: начни с −7, сделай 3 шага вправо, получится −4.', uz: 'Sonlar to‘g‘ri chizig‘ida + o‘ngga, − chapga olib boradi. −7 + 3: −7 dan boshla, 3 qadam o‘ngga yur, −4 chiqadi.' },
      { en: 'Taking away a debt makes you richer: 6 − (−2) = 6 + 2 = 8. Two minuses side by side make a plus.', ru: 'Если убрать долг, станешь богаче: 6 − (−2) = 6 + 2 = 8. Два минуса рядом дают плюс.', uz: 'Qarzni olib tashlasang, boyroq bo‘lasan: 6 − (−2) = 6 + 2 = 8. Yonma-yon ikki minus plyus beradi.' },
    ],
  },
  int_mul: {
    visual: 'signs',
    cards: [
      { en: 'Multiply the numbers, then decide the sign: same signs give +, different signs give −. (−3) · (−4) = 12. (−3) · 4 = −12.', ru: 'Перемножь числа, потом реши, какой знак: одинаковые знаки — плюс, разные — минус. (−3) · (−4) = 12. (−3) · 4 = −12.', uz: 'Sonlarni ko‘paytir, keyin ishorani hal qil: bir xil ishoralar +, har xillari −. (−3) · (−4) = 12. (−3) · 4 = −12.' },
      { en: 'Division uses the same rule: −12 : 3 = −4, and −12 : (−3) = 4.', ru: 'Деление по тому же правилу: −12 : 3 = −4, а −12 : (−3) = 4.', uz: 'Bo‘lish ham shu qoida bilan: −12 : 3 = −4, −12 : (−3) = 4.' },
    ],
  },
  dist: {
    visual: 'area',
    cards: [
      { en: 'Think of a rectangle: the number in front is the height, the brackets are the width in two parts. Each part gets multiplied: 3(x − 4) = 3x − 12.', ru: 'Представь прямоугольник: число перед скобкой — высота, скобка — ширина из двух частей. Умножается каждая часть: 3(x − 4) = 3x − 12.', uz: 'To‘rtburchakni tasavvur qil: qavs oldidagi son — balandlik, qavs — ikki qismli eni. Har bir qism ko‘paytiriladi: 3(x − 4) = 3x − 12.' },
      { en: 'With a minus in front, both products change sign: −2(x − 5) = −2x + 10, because (−2) · (−5) = +10.', ru: 'С минусом перед скобкой меняются оба произведения: −2(x − 5) = −2x + 10, потому что (−2) · (−5) = +10.', uz: 'Oldida minus bo‘lsa, ikkala ko‘paytma ishorasi o‘zgaradi: −2(x − 5) = −2x + 10, chunki (−2) · (−5) = +10.' },
    ],
  },
  like: {
    visual: 'tiles',
    cards: [
      { en: 'Like terms are the same kind of thing, so count them: 7x − 3x + 2x. Seven x’s, take away three, add two: 6x.', ru: 'Подобные слагаемые — одно и то же, их можно считать: 7x − 3x + 2x. Семь иксов, убрать три, добавить два: 6x.', uz: 'O‘xshash hadlar bir xil narsa, ularni sanash mumkin: 7x − 3x + 2x. Yettita x, uchtasini ol, ikkitasini qo‘sh: 6x.' },
      { en: 'The sign in front belongs to the term: 2x − 5x = (2 − 5)x = −3x.', ru: 'Знак перед слагаемым принадлежит ему: 2x − 5x = (2 − 5)x = −3x.', uz: 'Oldidagi ishora hadga tegishli: 2x − 5x = (2 − 5)x = −3x.' },
    ],
  },
  eq1: {
    visual: 'balance',
    cards: [
      { en: 'An equation is a balance: do the same to both sides and it stays level. x − 7 = −3: add 7 to both sides, x = 4.', ru: 'Уравнение — это весы: делай одно и то же с обеими частями, и они в равновесии. x − 7 = −3: прибавь 7 к обеим частям, x = 4.', uz: 'Tenglama — tarozi: ikkala tomonga bir xil amal qilsang, muvozanat saqlanadi. x − 7 = −3: ikkala tomonga 7 qo‘sh, x = 4.' },
      { en: 'Undo with the opposite operation: 4x = −20, divide both sides by 4, x = −5.', ru: 'Отменяй обратным действием: 4x = −20, раздели обе части на 4, x = −5.', uz: 'Teskari amal bilan bekor qil: 4x = −20, ikkala tomonni 4 ga bo‘l, x = −5.' },
    ],
  },
  eq2: {
    visual: 'balance',
    cards: [
      { en: 'Undo in reverse order: first the + or −, then the ×. 3x + 5 = −10: subtract 5 from both sides, 3x = −15.', ru: 'Отменяй в обратном порядке: сначала + или −, потом ×. 3x + 5 = −10: вычти 5 из обеих частей, 3x = −15.', uz: 'Teskari tartibda bekor qil: avval + yoki −, keyin ×. 3x + 5 = −10: ikkala tomondan 5 ni ayir, 3x = −15.' },
      { en: 'Then divide both sides by 3: x = −15 : 3 = −5. Check: 3 · (−5) + 5 = −10. It balances.', ru: 'Потом раздели обе части на 3: x = −15 : 3 = −5. Проверка: 3 · (−5) + 5 = −10. Сходится.', uz: 'Keyin ikkala tomonni 3 ga bo‘l: x = −15 : 3 = −5. Tekshiruv: 3 · (−5) + 5 = −10. To‘g‘ri.' },
    ],
  },
  eq_both: {
    visual: 'balance',
    cards: [
      { en: 'Gather the x’s on one side and the numbers on the other. 5x − 3 = 2x + 9: take 2x from both sides and add 3 to both sides.', ru: 'Собери иксы с одной стороны, числа с другой. 5x − 3 = 2x + 9: вычти 2x из обеих частей и прибавь 3 к обеим.', uz: 'x larni bir tomonga, sonlarni boshqa tomonga yig‘. 5x − 3 = 2x + 9: ikkala tomondan 2x ni ayir va ikkala tomonga 3 qo‘sh.' },
      { en: 'That gives 3x = 12, so x = 4. "Moving a term and changing its sign" is just this: doing the same to both sides.', ru: 'Получаем 3x = 12, значит x = 4. «Перенести и поменять знак» — это и есть одно и то же действие с обеими частями.', uz: '3x = 12 chiqadi, demak x = 4. «Hadni ko‘chirib, ishorasini o‘zgartirish» — aynan ikkala tomonga bir xil amal qilishdir.' },
    ],
  },
  eq_br: {
    visual: 'area',
    cards: [
      { en: 'First open the brackets, every term: 3(x − 2) = x + 4 becomes 3x − 6 = x + 4.', ru: 'Сначала раскрой скобки, каждое слагаемое: 3(x − 2) = x + 4 становится 3x − 6 = x + 4.', uz: 'Avval qavslarni och, har bir hadni: 3(x − 2) = x + 4 dan 3x − 6 = x + 4 chiqadi.' },
      { en: 'Then solve as before: 3x − x = 4 + 6, so 2x = 10 and x = 5. Check: 3 · (5 − 2) = 9 and 5 + 4 = 9.', ru: 'Дальше как обычно: 3x − x = 4 + 6, значит 2x = 10 и x = 5. Проверка: 3 · (5 − 2) = 9 и 5 + 4 = 9.', uz: 'Keyin odatdagidek: 3x − x = 4 + 6, demak 2x = 10 va x = 5. Tekshiruv: 3 · (5 − 2) = 9 va 5 + 4 = 9.' },
    ],
  },
};

export const SOURCES = [
  { label: 'EdWeek (2025): a subset of math skills predicts Algebra 1 success', url: 'https://www.edweek.org/teaching-learning/a-subset-of-math-skills-predicts-algebra-1-success-what-are-they/2025/05' },
  { label: 'South African Journal of Science: errors Grade 9 learners make in linear equations', url: 'https://sajs.co.za/article/view/8125/10522' },
  { label: 'Booth & Newton (2012), via REL Appalachia: fractions and algebra readiness', url: 'https://ies.ed.gov/ncee/edLabs/regions/appalachia/askarel/pdf/05_AAR_508.pdf' },
];

/** The map shows each skill as a tiny example: the same in every language and easier to recognise than a name. */
export const MAP_LABEL: Record<NodeId, string> = {
  eq_br: '3(x − 2) = x + 4', eq_both: '5x − 3 = 2x + 9', dist: '3(x − 4)', eq2: '3x + 5 = −10', like: '7x − 3x + 2x', eq1: 'x − 7 = −3', int_add: '−7 + 3', int_mul: '(−3) · (−4)',
};
export const GRADE_WORD: T3 = { en: 'Grade {g}', ru: '{g} класс', uz: '{g}-sinf' };
/** A mistake in a few words, for the teacher's line. */
export const MISS_SHORT: Record<MissId, T3> = {
  sign_add: { en: 'sign when adding negatives', ru: 'знак при сложении отрицательных', uz: 'manfiylarni qo‘shishda ishora' },
  minus_neg: { en: 'subtracting a negative', ru: 'вычитание отрицательного', uz: 'manfiy sonni ayirish' },
  sign_mul: { en: 'sign when multiplying', ru: 'знак при умножении', uz: 'ko‘paytirishda ishora' },
  div_sign: { en: 'sign when dividing', ru: 'знак при делении', uz: 'bo‘lishda ishora' },
  dist_first: { en: 'multiplied only the first term in brackets', ru: 'умножил только первое слагаемое в скобке', uz: 'qavsdagi faqat birinchi hadni ko‘paytirgan' },
  dist_sign: { en: 'minus before brackets', ru: 'минус перед скобкой', uz: 'qavs oldidagi minus' },
  like_sign: { en: 'signs of like terms', ru: 'знаки подобных слагаемых', uz: 'o‘xshash hadlar ishorasi' },
  move_sign: { en: 'moved a term across = without changing its sign', ru: 'перенёс слагаемое через = без смены знака', uz: 'hadni = orqali ishorasini o‘zgartirmay ko‘chirgan' },
  inv_op: { en: 'used the wrong inverse operation', ru: 'не то обратное действие', uz: 'noto‘g‘ri teskari amal' },
};
