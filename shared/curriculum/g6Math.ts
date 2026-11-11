// Grade 6 Mathematics. Follows the topics and the bar-model approach of "Matematika 6, 1-qism" (Novda Edutainment, 2024).
// Own wording and own numbers; nothing is copied from the book. Draft: awaiting teacher review.

import { Q, S, T, TN, fr, int, pick, s, type Gen, type Topic } from './types.ts';

const expr: Gen[] = [
  (r) => {
    const a = int(r, 2, 6), b = int(r, 1, 9), x = int(r, 2, 6);
    const p = a * x, ans = p + b;
    return Q(r, {
      prompt: T(`x = ${x} bo‘lsa, <b>${a}x + ${b}</b> nechaga teng?`, `Если x = ${x}, чему равно <b>${a}x + ${b}</b>?`, `If x = ${x}, what is <b>${a}x + ${b}</b>?`),
      answer: ans,
      wrong: [a + x + b, a * (x + b), p, p - b],
      hints: [
        T(`x o‘rniga ${x} sonini qo‘ying.`, `Подставь ${x} вместо x.`, `Put ${x} in place of x.`),
        T(`Avval ko‘paytiring: ${a} · ${x} = ${p}. Endi ${b} ni qo‘shing.`, `Сначала умножь: ${a} · ${x} = ${p}. Теперь прибавь ${b}.`, `Multiply first: ${a} · ${x} = ${p}. Now add ${b}.`),
      ],
      explain: S(`${a} · ${x} + ${b} = ${p} + ${b} = ${ans}`),
    });
  },
  (r) => {
    const a = int(r, 2, 6), b = int(r, 2, 5), c = int(r, 1, 9);
    return Q(r, {
      prompt: T(`Soddalashtiring: <b>${a}x + ${b}x + ${c}</b>`, `Упрости: <b>${a}x + ${b}x + ${c}</b>`, `Simplify: <b>${a}x + ${b}x + ${c}</b>`),
      visual: { t: 'tiles', groups: [{ n: a, kind: 'x' }, { n: b, kind: 'x' }, { n: c, kind: '1' }] },
      answer: `${a + b}x + ${c}`,
      wrong: [`${a + b + c}x`, `${a * b}x + ${c}`, `${a + b}x`, `${a}x + ${b + c}`],
      hints: [
        T('Faqat x li qutilarni birga sanang. Son alohida qoladi.', 'Считай вместе только коробки с x. Число остаётся отдельно.', 'Count only the x boxes together. The number stays apart.'),
        T(`${a}x + ${b}x = ${a + b}x. Endi ${c} ni yonida yozing.`, `${a}x + ${b}x = ${a + b}x. Теперь допиши ${c}.`, `${a}x + ${b}x = ${a + b}x. Now write ${c} next to it.`),
      ],
      explain: S(`${a}x + ${b}x + ${c} = ${a + b}x + ${c}`),
    });
  },
  (r) => {
    const n = int(r, 3, 15);
    return Q(r, {
      prompt: T(
        `Savatda ${n} ta anor bor edi. Yana x ta anor solindi. Endi savatda nechta anor bor?`,
        `В корзине было ${n} гранатов. Положили ещё x гранатов. Сколько их теперь?`,
        `A basket had ${n} pomegranates. Then x more were added. How many are there now?`,
      ),
      visual: { t: 'bar', parts: [{ w: 3, label: s(n), tone: 'blue' }, { w: 2, label: 'x', tone: 'amber' }], total: '?' },
      answer: `${n} + x`,
      wrong: [`${n} − x`, `${n} · x`, `x − ${n}`],
      hints: [
        T('“Yana solindi” — demak ko‘paydi.', '«Положили ещё» — значит, стало больше.', '“Added” means there are more now.'),
        T('Ko‘payganda qaysi amal ishlatiladi?', 'Какое действие показывает «стало больше»?', 'Which operation shows “more”?'),
      ],
      explain: T(`Bor edi ${n} ta, yana x ta: ${n} + x.`, `Было ${n}, добавили x: ${n} + x.`, `Started with ${n}, added x: ${n} + x.`),
    });
  },
];

const equations: Gen[] = [
  (r) => {
    const x = int(r, 3, 30), a = int(r, 3, 20), b = x + a;
    return Q(r, {
      prompt: T(`Tenglamani yeching: <b>x + ${a} = ${b}</b>`, `Реши уравнение: <b>x + ${a} = ${b}</b>`, `Solve: <b>x + ${a} = ${b}</b>`),
      visual: { t: 'balance', left: `x + ${a}`, right: s(b) },
      answer: x,
      wrong: [b + a, x + 1, a],
      hints: [
        T('Tarozi teng turishi kerak: ikkala pallaga bir xil ish qiling.', 'Весы должны остаться в равновесии: делай одно и то же с обеими чашами.', 'Keep the scale level: do the same to both sides.'),
        T(`Ikkala tomondan ${a} ni ayiring.`, `Вычти ${a} из обеих частей.`, `Subtract ${a} from both sides.`),
      ],
      explain: S(`x = ${b} − ${a} = ${x}`),
      check: { expression: `x + ${a} = ${b}`, root: x },
    });
  },
  (r) => {
    const a = int(r, 2, 5), x = int(r, 2, 9), b = int(r, 1, 9), c = a * x + b;
    return Q(r, {
      prompt: T(`Tenglamani yeching: <b>${a}x + ${b} = ${c}</b>`, `Реши уравнение: <b>${a}x + ${b} = ${c}</b>`, `Solve: <b>${a}x + ${b} = ${c}</b>`),
      visual: { t: 'balance', left: `${a}x + ${b}`, right: s(c) },
      answer: x,
      wrong: [c - b, (c + b) / a, c - a - b],
      hints: [
        T(`Avval ${b} ni olib tashlang, keyin ${a} ga bo‘ling.`, `Сначала убери ${b}, потом раздели на ${a}.`, `First remove ${b}, then divide by ${a}.`),
        T(`${a}x = ${c} − ${b} = ${c - b}. Endi ${c - b} ni ${a} ga bo‘ling.`, `${a}x = ${c} − ${b} = ${c - b}. Теперь раздели ${c - b} на ${a}.`, `${a}x = ${c} − ${b} = ${c - b}. Now divide ${c - b} by ${a}.`),
      ],
      explain: S(`${a}x = ${c - b};  x = ${c - b} : ${a} = ${x}`),
      check: { expression: `${a}x + ${b} = ${c}`, root: x },
    });
  },
  (r) => {
    const a = int(r, 4, 15), x = int(r, 3, 15), b = a + x;
    const name = pick(r, ['Madina', 'Jasur', 'Nilufar', 'Sardor']);
    return Q(r, {
      prompt: T(
        `Savatda ${a} ta olma bor edi. ${name} yana bir nechta olma soldi va jami ${b} ta bo‘ldi. ${name} nechta olma solgan?`,
        `В корзине было ${a} яблок. ${name} положил(а) ещё несколько, и стало ${b}. Сколько яблок положил(а) ${name}?`,
        `A basket had ${a} apples. ${name} added some and now there are ${b}. How many did ${name} add?`,
      ),
      visual: { t: 'bar', parts: [{ w: a, label: s(a), tone: 'blue' }, { w: x, label: 'x', tone: 'amber' }], total: s(b) },
      answer: x,
      wrong: [a + b, b, x + 2],
      hints: [
        T(`Tenglama tuzing: ${a} + x = ${b}.`, `Составь уравнение: ${a} + x = ${b}.`, `Write an equation: ${a} + x = ${b}.`),
        T(`Butun bo‘lakdan ma’lum bo‘lakni ayiring: ${b} − ${a}.`, `Из целого вычти известную часть: ${b} − ${a}.`, `Take the known part from the whole: ${b} − ${a}.`),
      ],
      explain: S(`${a} + x = ${b};  x = ${b} − ${a} = ${x}`),
      check: { expression: `${a} + x = ${b}`, root: x },
    });
  },
];

const fractions: Gen[] = [
  (r) => {
    const n = int(r, 2, 6), d = int(r, 2, 5), ans = n * d;
    return Q(r, {
      prompt: T(
        `${n} ta nonning har birini ${d} ta teng bo‘lakka bo‘ldik. Hammasi bo‘lib nechta bo‘lak chiqdi? (${n} : 1/${d})`,
        `Каждую из ${n} лепёшек разрезали на ${d} равные части. Сколько всего частей? (${n} : 1/${d})`,
        `Each of ${n} loaves of non is cut into ${d} equal pieces. How many pieces in all? (${n} ÷ 1/${d})`,
      ),
      visual: { t: 'fraction', rows: Array.from({ length: Math.min(n, 3) }, () => ({ n: d, d })) },
      answer: ans,
      wrong: [n + d, d, n],
      hints: [
        T(`Bitta nondan ${d} ta bo‘lak chiqadi.`, `Из одной лепёшки получается ${d} части.`, `One loaf gives ${d} pieces.`),
        T(`${n} ta nondan: ${n} · ${d}.`, `Из ${n} лепёшек: ${n} · ${d}.`, `From ${n} loaves: ${n} · ${d}.`),
      ],
      explain: S(`${n} : 1/${d} = ${n} · ${d} = ${ans}`),
    });
  },
  (r) => {
    const q = pick(r, [3, 4, 5, 7]), p = int(r, 1, q - 1), n = int(r, 2, 4);
    return Q(r, {
      prompt: T(`Hisoblang: <b>${p}/${q} : ${n}</b>`, `Вычисли: <b>${p}/${q} : ${n}</b>`, `Work out: <b>${p}/${q} ÷ ${n}</b>`),
      visual: { t: 'fraction', rows: [{ n: p, d: q }] },
      answer: fr(p, q * n),
      wrong: [fr(p * n, q), fr(p, q + n), fr(p + n, q + n), `${p}/${q}`],
      hints: [
        T('Kasrni songa bo‘lganda maxraj ko‘payadi.', 'При делении дроби на число знаменатель умножается на него.', 'When you divide a fraction by a number, the denominator gets multiplied.'),
        T(`${p}/${q} : ${n} = ${p}/(${q} · ${n}).`, `${p}/${q} : ${n} = ${p}/(${q} · ${n}).`, `${p}/${q} ÷ ${n} = ${p}/(${q} · ${n}).`),
      ],
      explain: S(`${p}/(${q} · ${n}) = ${fr(p, q * n)}`),
    });
  },
  (r) => {
    const b = pick(r, [3, 4, 5, 7]), a = int(r, 1, b - 1), d = pick(r, [2, 3, 5, 7].filter((v) => v !== b)), c = int(r, 1, d - 1);
    return Q(r, {
      prompt: T(`Hisoblang: <b>${a}/${b} : ${c}/${d}</b>`, `Вычисли: <b>${a}/${b} : ${c}/${d}</b>`, `Work out: <b>${a}/${b} ÷ ${c}/${d}</b>`),
      answer: fr(a * d, b * c),
      wrong: [fr(a * c, b * d), fr(b * c, a * d), fr(a + c, b + d), fr(a * d + 1, b * c)],
      hints: [
        T('Kasrga bo‘lish — uning teskarisiga ko‘paytirish.', 'Делить на дробь — значит умножать на обратную дробь.', 'Dividing by a fraction means multiplying by its flip.'),
        T(`${c}/${d} ni aylantiring: ${a}/${b} · ${d}/${c}.`, `Переверни ${c}/${d}: ${a}/${b} · ${d}/${c}.`, `Flip ${c}/${d}: ${a}/${b} · ${d}/${c}.`),
      ],
      explain: S(`${a}/${b} · ${d}/${c} = ${a * d}/${b * c}${fr(a * d, b * c) === `${a * d}/${b * c}` ? '' : ` = ${fr(a * d, b * c)}`}`),
    });
  },
];

const ratios: Gen[] = [
  (r) => {
    const [a, b] = pick(r, [[1, 2], [2, 3], [3, 4], [1, 3], [3, 5], [2, 5]] as const), k = int(r, 2, 9), total = (a + b) * k;
    return Q(r, {
      prompt: T(
        `Anvar va Sardor ${total} ta yong‘oqni ${a} : ${b} nisbatda bo‘lishdi. Sardorga nechta yong‘oq tegdi?`,
        `Анвар и Сардор разделили ${total} орехов в отношении ${a} : ${b}. Сколько орехов у Сардора?`,
        `Anvar and Sardor share ${total} walnuts in the ratio ${a} : ${b}. How many does Sardor get?`,
      ),
      visual: { t: 'bar', parts: [...Array.from({ length: a }, () => ({ w: 1, tone: 'blue' as const })), ...Array.from({ length: b }, () => ({ w: 1, tone: 'amber' as const }))], total: s(total) },
      answer: b * k,
      wrong: [a * k, total - k, k],
      hints: [
        T(`Jami ${a} + ${b} = ${a + b} bo‘lak.`, `Всего ${a} + ${b} = ${a + b} частей.`, `That is ${a} + ${b} = ${a + b} parts in all.`),
        T(`Bitta bo‘lak: ${total} : ${a + b} = ${k}. Sardorda ${b} ta bo‘lak bor.`, `Одна часть: ${total} : ${a + b} = ${k}. У Сардора ${b} части.`, `One part: ${total} ÷ ${a + b} = ${k}. Sardor has ${b} parts.`),
      ],
      explain: S(`${total} : ${a + b} = ${k};  ${k} · ${b} = ${b * k}`),
    });
  },
  (r) => {
    const [a, b] = pick(r, [[2, 3], [3, 4], [3, 5], [4, 5], [5, 7], [1, 4]] as const), g = int(r, 2, 9);
    return Q(r, {
      prompt: T(`Nisbatni qisqartiring: <b>${a * g} : ${b * g}</b>`, `Сократи отношение: <b>${a * g} : ${b * g}</b>`, `Simplify the ratio: <b>${a * g} : ${b * g}</b>`),
      answer: `${a} : ${b}`,
      wrong: [`${b} : ${a}`, `${a + 1} : ${b + 1}`, `${a * g} : ${b}`, `${a} : ${b * g}`],
      hints: [
        T('Ikkala sonni bir xil songa bo‘ling.', 'Раздели оба числа на одно и то же число.', 'Divide both numbers by the same number.'),
        T(`Ikkalasi ham ${g} ga bo‘linadi.`, `Оба делятся на ${g}.`, `Both divide by ${g}.`),
      ],
      explain: S(`${a * g} : ${g} = ${a};  ${b * g} : ${g} = ${b}`),
    });
  },
  (r) => {
    const [a, b] = pick(r, [[2, 3], [3, 4], [3, 2], [4, 5], [5, 3]] as const), k = int(r, 2, 6), first = a * k;
    return Q(r, {
      prompt: T(
        `Sinfda o‘g‘il bolalar va qizlar soni nisbati ${a} : ${b}. O‘g‘il bolalar ${first} nafar. Qizlar nechta?`,
        `Отношение мальчиков к девочкам в классе ${a} : ${b}. Мальчиков ${first}. Сколько девочек?`,
        `The ratio of boys to girls in a class is ${a} : ${b}. There are ${first} boys. How many girls?`,
      ),
      answer: b * k,
      wrong: [first + b, a * b, first + (b - a)],
      hints: [
        T(`O‘g‘il bolalarning ${a} bo‘lagi ${first} ta.`, `${a} части мальчиков — это ${first}.`, `The ${a} parts of boys make ${first}.`),
        T(`Bitta bo‘lak: ${first} : ${a} = ${k}. Qizlar ${b} bo‘lak.`, `Одна часть: ${first} : ${a} = ${k}. Девочки — ${b} части.`, `One part: ${first} ÷ ${a} = ${k}. Girls are ${b} parts.`),
      ],
      explain: S(`${first} : ${a} = ${k};  ${k} · ${b} = ${b * k}`),
    });
  },
];

const percents: Gen[] = [
  (r) => {
    const p = pick(r, [5, 10, 20, 25, 50, 75]), N = pick(r, [40, 60, 80, 100, 120, 160, 200, 240, 300, 400]);
    const ans = (N * p) / 100, one = N / 100;
    return Q(r, {
      prompt: T(`<b>${N}</b> ning <b>${p}%</b> i nechaga teng?`, `Сколько будет <b>${p}%</b> от <b>${N}</b>?`, `What is <b>${p}%</b> of <b>${N}</b>?`),
      visual: { t: 'bar', parts: [{ w: p, label: `${p}%`, tone: 'amber' }, { w: 100 - p, tone: 'soft' }], total: s(N) },
      answer: ans,
      wrong: [N - ans, ans * 2, p, N / p],
      hints: [
        T('Avval 1% ni toping: sonni 100 ga bo‘ling.', 'Сначала найди 1%: раздели число на 100.', 'Find 1% first: divide the number by 100.'),
        TN((n) => T(`1% = ${n(one)}. Endi ${p} ga ko‘paytiring.`, `1% = ${n(one)}. Теперь умножь на ${p}.`, `1% = ${n(one)}. Now multiply by ${p}.`)),
      ],
      explain: TN((n) => S(`${N} : 100 · ${p} = ${n(ans)}`)),
    });
  },
  (r) => {
    const p = pick(r, [10, 20, 25, 40, 50]), whole = pick(r, [40, 60, 80, 120, 160, 200, 240, 300]), part = (whole * p) / 100, one = whole / 100;
    return Q(r, {
      prompt: T(
        `Maktabda ${part} nafar o‘quvchi to‘garakka qatnashadi. Bu barcha o‘quvchilarning ${p}% i. Maktabda jami nechta o‘quvchi bor?`,
        `${part} учеников ходят в кружок. Это ${p}% всех учеников школы. Сколько всего учеников?`,
        `${part} pupils go to a club. That is ${p}% of all pupils. How many pupils are there?`,
      ),
      visual: { t: 'bar', parts: [{ w: p, label: s(part), tone: 'amber' }, { w: 100 - p, tone: 'soft' }], total: '100% = ?' },
      answer: whole,
      wrong: [(part * p) / 100, part + p, whole / 2, whole + part],
      hints: [
        T(`${p}% → ${part}. Avval 1% ni toping.`, `${p}% → ${part}. Сначала найди 1%.`, `${p}% is ${part}. Find 1% first.`),
        TN((n) => T(`1% = ${part} : ${p} = ${n(one)}. Endi 100 ga ko‘paytiring.`, `1% = ${part} : ${p} = ${n(one)}. Теперь умножь на 100.`, `1% = ${part} ÷ ${p} = ${n(one)}. Now multiply by 100.`)),
      ],
      explain: TN((n) => S(`${part} : ${p} · 100 = ${n(one)} · 100 = ${whole}`)),
    });
  },
  (r) => {
    const p = pick(r, [10, 20, 25, 50]), price = pick(r, [20, 40, 60, 80, 100, 120, 200]), off = (price * p) / 100, left = price - off;
    return Q(r, {
      prompt: T(
        `Daftar to‘plami ${price} ming so‘m turadi. Bozorda ${p}% chegirma bo‘ldi. Endi narxi necha ming so‘m?`,
        `Набор тетрадей стоит ${price} тыс. сумов. На базаре скидка ${p}%. Сколько тысяч сумов он стоит теперь?`,
        `A set of notebooks costs ${price} thousand so‘m. There is a ${p}% discount at the bazaar. What is the new price, in thousand so‘m?`,
      ),
      visual: { t: 'bar', parts: [{ w: 100 - p, label: '?', tone: 'blue' }, { w: p, label: `−${p}%`, tone: 'amber' }], total: s(price) },
      answer: left,
      wrong: [off, price + off, price - p],
      hints: [
        T(`Chegirmani toping: ${price} ning ${p}% i.`, `Найди скидку: ${p}% от ${price}.`, `Find the discount: ${p}% of ${price}.`),
        T(`Chegirma ${off} ming so‘m. Narxdan ayiring.`, `Скидка ${off} тыс. Вычти из цены.`, `The discount is ${off} thousand. Subtract it from the price.`),
      ],
      explain: S(`${price} − ${off} = ${left}`),
    });
  },
];

const angles: Gen[] = [
  (r) => {
    const a = int(r, 5, 16) * 10, ans = 180 - a;
    return Q(r, {
      prompt: T('To‘g‘ri chiziqda ikki burchak bor. Noma’lum burchak nechaga teng?', 'На прямой два угла. Чему равен неизвестный угол?', 'Two angles sit on a straight line. What is the unknown angle?'),
      visual: { t: 'straight', a: `${a}°`, b: '?', ask: 'b', split: ans },
      answer: `${ans}°`,
      wrong: [`${360 - a}°`, `${a}°`, `${90 - (a % 90)}°`, `${ans + 10}°`],
      hints: [
        T('To‘g‘ri chiziqdagi burchaklar yig‘indisi 180°.', 'Сумма углов на прямой равна 180°.', 'Angles on a straight line add up to 180°.'),
        S(`180° − ${a}° = ?`),
      ],
      explain: S(`180° − ${a}° = ${ans}°`),
    });
  },
  (r) => {
    const a = int(r, 3, 8) * 10, b = int(r, 3, 8) * 10, ans = 180 - a - b;
    return Q(r, {
      prompt: T('Uchburchakning noma’lum burchagini toping.', 'Найди неизвестный угол треугольника.', 'Find the unknown angle of the triangle.'),
      visual: { t: 'triangle', deg: [a, b, ans], a: `${a}°`, b: `${b}°`, c: '?' },
      answer: `${ans}°`,
      wrong: [`${360 - a - b}°`, `${a + b}°`, `${ans + 10}°`, `${Math.abs(a - b) + 10}°`],
      hints: [
        T('Uchburchak burchaklarining yig‘indisi 180°.', 'Сумма углов треугольника равна 180°.', 'A triangle’s angles add up to 180°.'),
        S(`180° − ${a}° − ${b}° = ?`),
      ],
      explain: S(`180° − ${a}° − ${b}° = ${ans}°`),
    });
  },
  (r) => {
    const a = int(r, 2, 7) * 10, ans = 90 - a;
    return Q(r, {
      prompt: T('Bu to‘g‘ri burchakli uchburchak. Noma’lum burchakni toping.', 'Это прямоугольный треугольник. Найди неизвестный угол.', 'This is a right triangle. Find the unknown angle.'),
      visual: { t: 'triangle', deg: [90, a, ans], a: '90°', b: `${a}°`, c: '?', right: true },
      answer: `${ans}°`,
      wrong: [`${180 - a}°`, `${a}°`, `${ans + 10}°`, `${ans + 20}°`],
      hints: [
        T('Bir burchak 90°, jami esa 180°.', 'Один угол 90°, а всего 180°.', 'One angle is 90°, and the total is 180°.'),
        S(`180° − 90° − ${a}° = ?`),
      ],
      explain: S(`180° − 90° − ${a}° = ${ans}°`),
    });
  },
];

const circles: Gen[] = [
  (r) => {
    const R = int(r, 2, 12);
    return Q(r, {
      prompt: T(`Doiraning radiusi ${R} sm. Diametri necha sm?`, `Радиус круга ${R} см. Чему равен диаметр?`, `A circle’s radius is ${R} cm. What is its diameter?`),
      visual: { t: 'circle', kind: 'r', label: `r = ${R}` },
      answer: 2 * R,
      wrong: [R, R + 2, R * R],
      hints: [
        T('Diametr doiraning o‘rtasidan o‘tadi: ikkita radius.', 'Диаметр проходит через центр: это два радиуса.', 'A diameter runs through the centre: that is two radii.'),
        S(`d = 2 · ${R}`),
      ],
      explain: S(`d = 2 · r = 2 · ${R} = ${2 * R}`),
    });
  },
  (r) => {
    const R = int(r, 1, 10), c = Math.round(2 * 3.14 * R * 100) / 100, a = Math.round(3.14 * R * R * 100) / 100;
    return Q(r, {
      prompt: TN((n) => T(
        `Aylananing radiusi ${R} sm. Uzunligini toping (π ≈ ${n(3.14)}).`,
        `Радиус окружности ${R} см. Найди её длину (π ≈ ${n(3.14)}).`,
        `A circle’s radius is ${R} cm. Find its circumference (π ≈ ${n(3.14)}).`,
      )),
      visual: { t: 'circle', kind: 'around', label: `r = ${R}` },
      answer: c,
      wrong: [Math.round(3.14 * R * 100) / 100, R === 2 ? c + 3.14 : a, Math.round((c + 6.28) * 100) / 100],
      hints: [
        S('C = 2 · π · r'),
        TN((n) => S(`C = 2 · ${n(3.14)} · ${R}`)),
      ],
      explain: TN((n) => S(`C = 2 · ${n(3.14)} · ${R} = ${n(c)}`)),
    });
  },
  (r) => {
    const R = int(r, 2, 10), a = Math.round(3.14 * R * R * 100) / 100, c = Math.round(2 * 3.14 * R * 100) / 100;
    return Q(r, {
      prompt: TN((n) => T(
        `Doiraning radiusi ${R} sm. Yuzini toping (π ≈ ${n(3.14)}).`,
        `Радиус круга ${R} см. Найди его площадь (π ≈ ${n(3.14)}).`,
        `A circle’s radius is ${R} cm. Find its area (π ≈ ${n(3.14)}).`,
      )),
      visual: { t: 'circle', kind: 'area', label: `r = ${R}` },
      answer: a,
      wrong: [R === 2 ? a + 3.14 : c, Math.round(3.14 * R * 100) / 100, R * R],
      hints: [
        S('S = π · r²'),
        TN((n) => S(`S = ${n(3.14)} · ${R} · ${R}`)),
      ],
      explain: TN((n) => S(`S = ${n(3.14)} · ${R * R} = ${n(a)}`)),
    });
  },
];

const BOOK = T('Matematika 6-sinf', 'Математика, 6 класс', 'Mathematics, Grade 6');

export const g6Topics: Topic[] = [
  {
    id: 'm6-expr', grade: 6, subject: 'math6', emoji: '📦', book: BOOK,
    title: T('Algebraik ifodalar', 'Алгебраические выражения', 'Algebraic expressions'),
    keywords: ['ifoda', 'soddalashtir', 'выражен', 'упрост', 'expression', 'simplif'],
    cards: [
      {
        text: T(
          'Harf — noma’lum son uchun “quti”. 📦\nHar bir qutida x tadan yong‘oq bo‘lsa, 3 ta qutida jami <b>3x</b> ta yong‘oq bor.',
          'Буква — это «коробка» для неизвестного числа. 📦\nЕсли в каждой коробке x орехов, то в 3 коробках всего <b>3x</b> орехов.',
          'A letter is a “box” for an unknown number. 📦\nIf each box holds x walnuts, 3 boxes hold <b>3x</b> walnuts.',
        ),
        visual: { t: 'tiles', groups: [{ n: 3, kind: 'x' }] },
      },
      {
        text: T(
          'Bir xillarni qo‘shamiz: <b>3x + 2x = 5x</b>.\nQuti qutiga qo‘shiladi. Son alohida turadi: <b>3x + 2</b> shundayligicha qoladi.',
          'Складываем одинаковое: <b>3x + 2x = 5x</b>.\nКоробки складываем с коробками. Число стоит отдельно: <b>3x + 2</b> так и остаётся.',
          'Add what is alike: <b>3x + 2x = 5x</b>.\nBoxes go with boxes. A plain number stays apart: <b>3x + 2</b> stays as it is.',
        ),
        visual: { t: 'tiles', groups: [{ n: 3, kind: 'x' }, { n: 2, kind: 'x' }, { n: 2, kind: '1' }] },
      },
      {
        text: T(
          'Qiymatini topish oson: x o‘rniga sonni qo‘yamiz.\nx = 4 bo‘lsa: 3 · 4 + 2 = <b>14</b>.',
          'Найти значение просто: подставляем число вместо x.\nЕсли x = 4: 3 · 4 + 2 = <b>14</b>.',
          'Finding the value is easy: put the number in place of x.\nIf x = 4: 3 · 4 + 2 = <b>14</b>.',
        ),
        visual: { t: 'formula', main: '3 · 4 + 2 = 14', sub: 'x = 4' },
      },
    ],
    gens: expr,
  },
  {
    id: 'm6-eq', grade: 6, subject: 'math6', emoji: '⚖️', book: BOOK,
    title: T('Tenglamalarni yechish', 'Решение уравнений', 'Solving equations'),
    keywords: ['tenglama', 'noma’lum', "noma'lum", 'уравнен', 'equation', 'solve'],
    cards: [
      {
        text: T(
          'Tenglama — bu tarozi. ⚖️\nIkki palla teng turadi. Bir pallaga nima qilsangiz, ikkinchisiga ham shuni qiling.',
          'Уравнение — это весы. ⚖️\nЧаши в равновесии. Что делаешь с одной чашей, делай и с другой.',
          'An equation is a balance scale. ⚖️\nBoth sides stay level. Whatever you do to one side, do to the other.',
        ),
        visual: { t: 'balance', left: 'x + 7', right: '18' },
      },
      {
        text: T(
          'x ni yolg‘iz qoldiramiz.\nx + 7 = 18 — ikkala tomondan 7 ni olamiz:\n<b>x = 18 − 7 = 11</b>.',
          'Оставляем x одного.\nx + 7 = 18 — убираем 7 с обеих сторон:\n<b>x = 18 − 7 = 11</b>.',
          'Leave x on its own.\nx + 7 = 18 — take 7 from both sides:\n<b>x = 18 − 7 = 11</b>.',
        ),
        visual: { t: 'balance', left: 'x', right: '11' },
      },
      {
        text: T(
          'Ikki qadamli tenglama: <b>2x + 4 = 20</b>.\n1) 4 ni olamiz: 2x = 16.\n2) 2 ga bo‘lamiz: <b>x = 8</b>.\nTekshiring: 2 · 8 + 4 = 20 ✓',
          'Уравнение в два шага: <b>2x + 4 = 20</b>.\n1) Убираем 4: 2x = 16.\n2) Делим на 2: <b>x = 8</b>.\nПроверка: 2 · 8 + 4 = 20 ✓',
          'A two-step equation: <b>2x + 4 = 20</b>.\n1) Take away 4: 2x = 16.\n2) Divide by 2: <b>x = 8</b>.\nCheck: 2 · 8 + 4 = 20 ✓',
        ),
        visual: { t: 'bar', parts: [{ w: 8, label: 'x', tone: 'blue' }, { w: 8, label: 'x', tone: 'blue' }, { w: 4, label: '4', tone: 'amber' }], total: '20' },
      },
    ],
    gens: equations,
  },
  {
    id: 'm6-frac', grade: 6, subject: 'math6', emoji: '🫓', book: BOOK,
    title: T('Oddiy kasrlarni bo‘lish', 'Деление дробей', 'Dividing fractions'),
    keywords: ['kasr', 'maxraj', 'surat', 'дроб', 'знаменат', 'fraction', 'denominator'],
    cards: [
      {
        text: T(
          'Bitta nonni 3 ta teng bo‘lakka bo‘lsak, har bir bo‘lak — <b>1/3</b>. 🫓\n2 ta nondan 6 ta bo‘lak chiqadi:\n<b>2 : 1/3 = 2 · 3 = 6</b>.',
          'Разрежем лепёшку на 3 равные части: каждая часть — <b>1/3</b>. 🫓\nИз 2 лепёшек получится 6 частей:\n<b>2 : 1/3 = 2 · 3 = 6</b>.',
          'Cut a loaf of non into 3 equal pieces: each piece is <b>1/3</b>. 🫓\nTwo loaves give 6 pieces:\n<b>2 ÷ 1/3 = 2 · 3 = 6</b>.',
        ),
        visual: { t: 'fraction', rows: [{ n: 3, d: 3 }, { n: 3, d: 3 }] },
      },
      {
        text: T(
          'Kasrni songa bo‘lganda bo‘laklar kichrayadi, maxraj ko‘payadi:\n<b>3/4 : 2 = 3/(4 · 2) = 3/8</b>.',
          'При делении дроби на число части становятся меньше, знаменатель умножается:\n<b>3/4 : 2 = 3/(4 · 2) = 3/8</b>.',
          'Dividing a fraction by a number makes the pieces smaller, so the denominator is multiplied:\n<b>3/4 ÷ 2 = 3/(4 · 2) = 3/8</b>.',
        ),
        visual: { t: 'fraction', rows: [{ n: 3, d: 4, label: '3/4' }, { n: 3, d: 8, label: '3/8' }] },
      },
      {
        text: T(
          'Kasrga bo‘lish qoidasi: ikkinchi kasrni aylantirib, ko‘paytiramiz.\n<b>2/3 : 4/5 = 2/3 · 5/4 = 10/12 = 5/6</b>.',
          'Правило: вторую дробь переворачиваем и умножаем.\n<b>2/3 : 4/5 = 2/3 · 5/4 = 10/12 = 5/6</b>.',
          'The rule: flip the second fraction and multiply.\n<b>2/3 ÷ 4/5 = 2/3 · 5/4 = 10/12 = 5/6</b>.',
        ),
        visual: { t: 'formula', main: 'a/b : c/d = a/b · d/c', tone: 'amber' },
      },
    ],
    gens: fractions,
  },
  {
    id: 'm6-ratio', grade: 6, subject: 'math6', emoji: '🧮', book: BOOK,
    title: T('Nisbatlar', 'Отношения', 'Ratios'),
    keywords: ['nisbat', 'отношен', 'ratio', 'proporsiya', 'пропорц', 'proportion'],
    cards: [
      {
        text: T(
          'Nisbat <b>2 : 3</b> degani: har 2 ta ko‘k bo‘lakka 3 ta sariq bo‘lak to‘g‘ri keladi.',
          'Отношение <b>2 : 3</b> значит: на каждые 2 синие части приходится 3 жёлтые.',
          'A ratio of <b>2 : 3</b> means: for every 2 blue parts there are 3 yellow parts.',
        ),
        visual: { t: 'bar', parts: [{ w: 1, tone: 'blue' }, { w: 1, tone: 'blue' }, { w: 1, tone: 'amber' }, { w: 1, tone: 'amber' }, { w: 1, tone: 'amber' }] },
      },
      {
        text: T(
          '30 ta olmani 2 : 3 nisbatda bo‘lamiz.\n1) Jami 5 bo‘lak.\n2) Bitta bo‘lak: 30 : 5 = 6.\n3) <b>2 · 6 = 12</b> va <b>3 · 6 = 18</b>.',
          'Делим 30 яблок в отношении 2 : 3.\n1) Всего 5 частей.\n2) Одна часть: 30 : 5 = 6.\n3) <b>2 · 6 = 12</b> и <b>3 · 6 = 18</b>.',
          'Share 30 apples in the ratio 2 : 3.\n1) That is 5 parts.\n2) One part: 30 ÷ 5 = 6.\n3) <b>2 · 6 = 12</b> and <b>3 · 6 = 18</b>.',
        ),
        visual: { t: 'bar', parts: [{ w: 2, label: '12', tone: 'blue' }, { w: 3, label: '18', tone: 'amber' }], total: '30' },
      },
      {
        text: T(
          'Nisbatni qisqartirish: ikkala sonni bir xil songa bo‘lamiz.\n<b>12 : 18 = 2 : 3</b> (ikkalasini 6 ga bo‘ldik).',
          'Сокращаем отношение: делим оба числа на одно и то же число.\n<b>12 : 18 = 2 : 3</b> (разделили на 6).',
          'To simplify a ratio, divide both numbers by the same number.\n<b>12 : 18 = 2 : 3</b> (both divided by 6).',
        ),
        visual: { t: 'formula', main: '12 : 18 = 2 : 3', sub: ': 6' },
      },
    ],
    gens: ratios,
  },
  {
    id: 'm6-percent', grade: 6, subject: 'math6', emoji: '💯', book: BOOK,
    title: T('Foizlar', 'Проценты', 'Percentages'),
    keywords: ['foiz', '%', 'chegirma', 'процент', 'скидк', 'percent', 'discount'],
    cards: [
      {
        text: T(
          '<b>1%</b> — butunning yuzdan bir qismi.\n<b>100%</b> — butun. 50% — yarmi, 25% — choragi.',
          '<b>1%</b> — это одна сотая часть целого.\n<b>100%</b> — всё целое. 50% — половина, 25% — четверть.',
          '<b>1%</b> is one hundredth of the whole.\n<b>100%</b> is the whole. 50% is half, 25% is a quarter.',
        ),
        visual: { t: 'bar', parts: [{ w: 25, label: '25%', tone: 'amber' }, { w: 75, label: '75%', tone: 'soft' }], total: '100%' },
      },
      {
        text: T(
          'Sonning foizini topamiz: <b>80 ning 25% i</b>.\n1% = 80 : 100 = 0,8.\n25% = 0,8 · 25 = <b>20</b>.',
          'Находим процент от числа: <b>25% от 80</b>.\n1% = 80 : 100 = 0,8.\n25% = 0,8 · 25 = <b>20</b>.',
          'Find a percentage of a number: <b>25% of 80</b>.\n1% = 80 ÷ 100 = 0.8.\n25% = 0.8 · 25 = <b>20</b>.',
        ),
        visual: { t: 'bar', parts: [{ w: 25, label: '20', tone: 'amber' }, { w: 75, label: '60', tone: 'soft' }], total: '80' },
      },
      {
        text: T(
          'Foiziga ko‘ra butunni topamiz: <b>12% → 96</b>.\n1% = 96 : 12 = 8.\n100% = 8 · 100 = <b>800</b>.',
          'Находим целое по проценту: <b>12% → 96</b>.\n1% = 96 : 12 = 8.\n100% = 8 · 100 = <b>800</b>.',
          'Find the whole from a percentage: <b>12% is 96</b>.\n1% = 96 ÷ 12 = 8.\n100% = 8 · 100 = <b>800</b>.',
        ),
        visual: { t: 'bar', parts: [{ w: 12, label: '96', tone: 'amber' }, { w: 88, tone: 'soft' }], total: '100% = ?' },
      },
    ],
    gens: percents,
  },
  {
    id: 'm6-angle', grade: 6, subject: 'math6', emoji: '📐', book: BOOK,
    title: T('Shakllardagi burchaklar', 'Углы в фигурах', 'Angles in shapes'),
    keywords: ['burchak', 'uchburchak', 'угол', 'углы', 'треугольник', 'angle', 'triangle'],
    cards: [
      {
        text: T(
          'To‘g‘ri chiziqda burchaklar yig‘indisi <b>180°</b>.\nBittasini bilsangiz, ikkinchisini topasiz.',
          'Углы на прямой в сумме дают <b>180°</b>.\nЗнаешь один — найдёшь другой.',
          'Angles on a straight line add up to <b>180°</b>.\nKnow one, and you can find the other.',
        ),
        visual: { t: 'straight', a: '125°', b: '55°', split: 55 },
      },
      {
        text: T(
          'Uchburchakda ham yig‘indi <b>180°</b>.\nIkki burchakni bilsangiz: 180° dan ayiring.',
          'В треугольнике сумма тоже <b>180°</b>.\nЗнаешь два угла — вычти их из 180°.',
          'In a triangle the total is also <b>180°</b>.\nKnow two angles? Subtract them from 180°.',
        ),
        visual: { t: 'triangle', deg: [60, 50, 70], a: '60°', b: '50°', c: '70°' },
      },
    ],
    gens: angles,
  },
  {
    id: 'm6-circle', grade: 6, subject: 'math6', emoji: '⭕', book: BOOK,
    title: T('Doira va aylana', 'Круг и окружность', 'Circles'),
    keywords: ['doira', 'aylana', 'radius', 'diametr', 'круг', 'окружност', 'диаметр', 'circle', 'diameter', 'pi'],
    cards: [
      {
        text: T(
          '<b>Radius</b> (r) — markazdan chetgacha.\n<b>Diametr</b> (d) — butun doira bo‘ylab, ikkita radius: <b>d = 2r</b>.',
          '<b>Радиус</b> (r) — от центра до края.\n<b>Диаметр</b> (d) — через весь круг, два радиуса: <b>d = 2r</b>.',
          'The <b>radius</b> (r) goes from the centre to the edge.\nThe <b>diameter</b> (d) goes right across, two radii: <b>d = 2r</b>.',
        ),
        visual: { t: 'circle', kind: 'd', label: 'd = 2r' },
      },
      {
        text: T(
          'Aylana uzunligi — doira atrofini bir marta aylanib chiqish.\n<b>C = 2 · π · r</b>, bunda π ≈ 3,14.',
          'Длина окружности — один обход вокруг круга.\n<b>C = 2 · π · r</b>, где π ≈ 3,14.',
          'The circumference is one trip around the circle.\n<b>C = 2 · π · r</b>, where π ≈ 3.14.',
        ),
        visual: { t: 'circle', kind: 'around', label: 'r' },
      },
      {
        text: T(
          'Doira yuzi — ichidagi hamma joy.\n<b>S = π · r²</b>.',
          'Площадь круга — всё место внутри.\n<b>S = π · r²</b>.',
          'The area is all the space inside.\n<b>S = π · r²</b>.',
        ),
        visual: { t: 'circle', kind: 'area', label: 'r' },
      },
    ],
    gens: circles,
  },
];
