// Grade 7 Algebra. Follows the chapters of "Algebra 7" (Akmalov et al., Respublika ta'lim markazi, 2022),
// including the al-Xorazmiy method of solving equations. Own wording and own numbers. Draft: awaiting teacher review.

import { lineEq, pt } from '../format.ts';
import { Q, S, T, TN, int, kx, lin, par, pick, s, sup, type Gen, type Topic } from './types.ts';

const expressions: Gen[] = [
  (r) => {
    const a = int(r, 2, 7), b = int(r, 1, 9), minus = r() < 0.4;
    const inner = minus ? `x − ${b}` : `x + ${b}`, v = minus ? -b : b;
    return Q(r, {
      prompt: T(`Qavslarni oching: <b>${a}(${inner})</b>`, `Раскрой скобки: <b>${a}(${inner})</b>`, `Open the brackets: <b>${a}(${inner})</b>`),
      answer: lin(a, a * v),
      wrong: [lin(a, v), lin(1, a * v), lin(a, -a * v), lin(a + 1, a * v)],
      hints: [
        T('Qavs oldidagi son ichidagi har bir hadga ko‘payadi.', 'Число перед скобкой умножается на каждое слагаемое внутри.', 'The number in front multiplies every term inside.'),
        T(`${a} · x va ${a} · ${par(v)} ni toping.`, `Найди ${a} · x и ${a} · ${par(v)}.`, `Work out ${a} · x and ${a} · ${par(v)}.`),
      ],
      explain: S(`${a}(${inner}) = ${lin(a, a * v)}`),
    });
  },
  (r) => {
    const a = int(r, 2, 9), b = int(r, 1, 9), c = int(r, 1, 9);
    return Q(r, {
      prompt: T(`Soddalashtiring: <b>${a}x − (x − ${b}) + ${c}</b>`, `Упрости: <b>${a}x − (x − ${b}) + ${c}</b>`, `Simplify: <b>${a}x − (x − ${b}) + ${c}</b>`),
      answer: lin(a - 1, b + c),
      wrong: [lin(a - 1, c - b), lin(a + 1, b + c), lin(a, b + c), lin(a - 1, b - c === 0 ? 1 : b - c)],
      hints: [
        T('Qavs oldida minus bo‘lsa, ichidagi ishoralar teskarisiga o‘zgaradi.', 'Перед скобкой минус: знаки внутри меняются на противоположные.', 'A minus in front flips every sign inside.'),
        S(`${a}x − x + ${b} + ${c}`),
      ],
      explain: S(`${a}x − x + ${b} + ${c} = ${lin(a - 1, b + c)}`),
    });
  },
  (r) => {
    const k = pick(r, [-7, -5, -4, -3, 2, 3, 5, 6, 8]);
    return Q(r, {
      prompt: T(`<b>${kx(k, 'xy')}</b> birhadning koeffitsiyenti nechaga teng?`, `Чему равен коэффициент одночлена <b>${kx(k, 'xy')}</b>?`, `What is the coefficient of <b>${kx(k, 'xy')}</b>?`),
      answer: k,
      wrong: [-k, k + 1, 2],
      hints: [
        T('Koeffitsiyent — harf oldidagi son.', 'Коэффициент — это число перед буквами.', 'The coefficient is the number in front of the letters.'),
        T('Ishorasiga ham qarang.', 'Обрати внимание и на знак.', 'Watch the sign too.'),
      ],
      explain: T(`${kx(k, 'xy')} da koeffitsiyent ${s(k)}.`, `В ${kx(k, 'xy')} коэффициент равен ${s(k)}.`, `In ${kx(k, 'xy')} the coefficient is ${s(k)}.`),
    });
  },
];

const powers: Gen[] = [
  (r) => {
    const [b, e] = pick(r, [[2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [5, 2], [5, 3], [10, 3]] as const);
    const ans = b ** e;
    const long = Array.from({ length: e }, () => b).join(' · ');
    return Q(r, {
      prompt: T(`Hisoblang: <b>${b}${sup(e)}</b>`, `Вычисли: <b>${b}${sup(e)}</b>`, `Work out: <b>${b}${sup(e)}</b>`),
      answer: ans,
      wrong: [b * e, b + e, ans + b],
      hints: [
        T(`${b}${sup(e)} — bu ${b} ni ${e} marta ko‘paytirish, ${b} · ${e} emas.`, `${b}${sup(e)} — это ${b}, умноженное само на себя ${e} раза, а не ${b} · ${e}.`, `${b}${sup(e)} means ${e} copies of ${b} multiplied, not ${b} · ${e}.`),
        S(long),
      ],
      explain: S(`${b}${sup(e)} = ${long} = ${ans}`),
    });
  },
  (r) => {
    const m = int(r, 2, 6), n = int(r, 2, 6);
    return Q(r, {
      prompt: T(`Soddalashtiring: <b>x${sup(m)} · x${sup(n)}</b>`, `Упрости: <b>x${sup(m)} · x${sup(n)}</b>`, `Simplify: <b>x${sup(m)} · x${sup(n)}</b>`),
      answer: `x${sup(m + n)}`,
      wrong: [`x${sup(m * n)}`, `2x${sup(m + n)}`, `x${sup(Math.abs(m - n) + 1)}`, `x${sup(m + n + 1)}`],
      hints: [
        T('Asoslar bir xil: ko‘rsatkichlar qo‘shiladi.', 'Основания одинаковые: показатели складываются.', 'Same base: add the exponents.'),
        S(`${m} + ${n} = ${m + n}`),
      ],
      explain: S(`x${sup(m)} · x${sup(n)} = x${sup(m + n)}`),
    });
  },
  (r) => {
    const m = int(r, 2, 5), n = int(r, 2, 4);
    return Q(r, {
      prompt: T(`Soddalashtiring: <b>(x${sup(m)})${sup(n)}</b>`, `Упрости: <b>(x${sup(m)})${sup(n)}</b>`, `Simplify: <b>(x${sup(m)})${sup(n)}</b>`),
      answer: `x${sup(m * n)}`,
      wrong: [`x${sup(m + n)}`, `${n}x${sup(m)}`, `x${sup(m * n + 1)}`, `x${sup(m)}`],
      hints: [
        T('Darajaning darajasi: ko‘rsatkichlar ko‘paytiriladi.', 'Степень степени: показатели перемножаются.', 'A power of a power: multiply the exponents.'),
        S(`${m} · ${n} = ${m * n}`),
      ],
      explain: S(`(x${sup(m)})${sup(n)} = x${sup(m * n)}`),
    });
  },
  (r) => {
    const n = int(r, 2, 5), d = int(r, 1, 5), m = n + d;
    return Q(r, {
      prompt: T(`Soddalashtiring: <b>x${sup(m)} : x${sup(n)}</b>`, `Упрости: <b>x${sup(m)} : x${sup(n)}</b>`, `Simplify: <b>x${sup(m)} ÷ x${sup(n)}</b>`),
      answer: d === 1 ? 'x' : `x${sup(d)}`,
      wrong: [`x${sup(m + n)}`, `x${sup(m * n)}`, d > 1 ? `${d}x` : `x${sup(n)}`, `x${sup(d + 1)}`],
      hints: [
        T('Bir xil asosli darajalarni bo‘lganda ko‘rsatkichlar ayriladi.', 'При делении степеней с одним основанием показатели вычитаются.', 'When dividing powers with the same base, subtract the exponents.'),
        S(`${m} − ${n} = ${d}`),
      ],
      explain: S(`x${sup(m)} : x${sup(n)} = ${d === 1 ? 'x' : `x${sup(d)}`}`),
    });
  },
];

const polynomials: Gen[] = [
  (r) => {
    const a = int(r, 3, 9), b = int(r, 2, 8), c = int(r, 1, 5), ans = a + b - c;
    return Q(r, {
      prompt: T(`O‘xshash hadlarni ixchamlang: <b>${a}x + ${b}x − ${c}x</b>`, `Приведи подобные: <b>${a}x + ${b}x − ${c}x</b>`, `Combine like terms: <b>${a}x + ${b}x − ${c}x</b>`),
      visual: { t: 'tiles', groups: [{ n: a, kind: 'x' }, { n: b, kind: 'x' }] },
      answer: kx(ans) || '0',
      wrong: [kx(a + b + c), kx(a - b + c) || 'x', kx(ans + 1), `${a + b - c}`],
      hints: [
        T('x li hadlarning sonlarini qo‘shib-ayiring.', 'Сложи и вычти числа при x.', 'Add and subtract the numbers in front of x.'),
        S(`${a} + ${b} − ${c} = ?`),
      ],
      explain: S(`(${a} + ${b} − ${c})x = ${kx(ans) || '0'}`),
    });
  },
  (r) => {
    const a = int(r, 2, 5), b = int(r, 2, 5), m = int(r, 1, 4), n = int(r, 1, 4);
    const pow = (e: number) => (e === 1 ? 'x' : `x${sup(e)}`);
    return Q(r, {
      prompt: T(`Birhadlarni ko‘paytiring: <b>${a}${pow(m)} · ${b}${pow(n)}</b>`, `Умножь одночлены: <b>${a}${pow(m)} · ${b}${pow(n)}</b>`, `Multiply: <b>${a}${pow(m)} · ${b}${pow(n)}</b>`),
      answer: `${a * b}${pow(m + n)}`,
      wrong: [`${a + b}${pow(m + n)}`, `${a * b}${pow(m * n)}`, `${a * b}${pow(m + n + 1)}`, `${a + b}${pow(m * n)}`],
      hints: [
        T('Sonlarni ko‘paytiring, x larning ko‘rsatkichlarini qo‘shing.', 'Числа перемножь, показатели при x сложи.', 'Multiply the numbers, add the exponents of x.'),
        S(`${a} · ${b} = ${a * b};  ${m} + ${n} = ${m + n}`),
      ],
      explain: S(`${a}${pow(m)} · ${b}${pow(n)} = ${a * b}${pow(m + n)}`),
    });
  },
  (r) => {
    const a = int(r, 2, 6), b = int(r, 1, 9), c = int(r, 1, 6), d = int(r, 1, 9), minus = r() < 0.5;
    const ans = minus ? lin(a - c, b - d) : lin(a + c, b + d);
    const shown = `(${lin(a, b)}) ${minus ? '−' : '+'} (${lin(c, d)})`;
    return Q(r, {
      prompt: T(`Hisoblang: <b>${shown}</b>`, `Вычисли: <b>${shown}</b>`, `Work out: <b>${shown}</b>`),
      answer: ans,
      wrong: [minus ? lin(a + c, b + d) : lin(a + c, b - d), minus ? lin(a - c, b + d) : lin(a, b + d), lin(a + c + 1, b + d), lin(a - c + 2, b - d + 1)],
      hints: [
        minus
          ? T('Minusli qavsni ochganda ishoralar o‘zgaradi.', 'Минус перед скобкой меняет знаки внутри.', 'A minus before the bracket flips the signs inside.')
          : T('Qavslarni oching: ishoralar o‘zgarmaydi.', 'Раскрой скобки: знаки не меняются.', 'Open the brackets: the signs stay.'),
        T('x li hadlarni alohida, sonlarni alohida qo‘shing.', 'Сложи отдельно члены с x, отдельно числа.', 'Add the x terms and the numbers separately.'),
      ],
      explain: S(`${shown} = ${ans}`),
    });
  },
];

const formulas: Gen[] = [
  (r) => {
    const n = int(r, 1, 9), minus = r() < 0.4;
    const shown = `(x ${minus ? '−' : '+'} ${n})²`;
    const mid = (minus ? -2 : 2) * n;
    const ans = `x² ${mid < 0 ? '−' : '+'} ${Math.abs(mid)}x + ${n * n}`;
    return Q(r, {
      prompt: T(`Ochib yozing: <b>${shown}</b>`, `Раскрой: <b>${shown}</b>`, `Expand: <b>${shown}</b>`),
      visual: { t: 'square', a: 'x', b: s(n) },
      answer: ans,
      wrong: [`x² + ${n * n}`, `x² ${mid < 0 ? '−' : '+'} ${n}x + ${n * n}`, `x² ${mid < 0 ? '+' : '−'} ${Math.abs(mid)}x + ${n * n}`, `x² ${mid < 0 ? '−' : '+'} ${Math.abs(mid)}x − ${n * n}`],
      hints: [
        T('Rasmdagi to‘rtta bo‘lakni ko‘ring: o‘rtadagi had ikki marta keladi!', 'Посмотри на четыре части на рисунке: средний член встречается дважды!', 'Look at the four pieces in the picture: the middle term appears twice!'),
        S(`(a ${minus ? '−' : '+'} b)² = a² ${minus ? '−' : '+'} 2ab + b²`),
      ],
      explain: S(`${shown} = ${ans}`),
    });
  },
  (r) => {
    const n = int(r, 1, 12);
    return Q(r, {
      prompt: T(`Ko‘paytiring: <b>(x − ${n})(x + ${n})</b>`, `Умножь: <b>(x − ${n})(x + ${n})</b>`, `Multiply: <b>(x − ${n})(x + ${n})</b>`),
      answer: `x² − ${n * n}`,
      wrong: [`x² + ${n * n}`, `x² − ${2 * n}x + ${n * n}`, `x² − ${n === 2 ? 2 : 2 * n}`, `2x − ${n * n}`],
      hints: [
        T('Bu kvadratlar ayirmasi formulasi.', 'Это формула разности квадратов.', 'This is the difference of squares formula.'),
        S('(a − b)(a + b) = a² − b²'),
      ],
      explain: S(`(x − ${n})(x + ${n}) = x² − ${n * n}`),
    });
  },
  (r) => {
    const base = pick(r, [20, 30, 40, 50, 60, 70]), d = int(r, 1, 3), ans = base * base - d * d;
    return Q(r, {
      prompt: T(
        `Kalkulyatorsiz, formula bilan hisoblang: <b>${base + d} · ${base - d}</b>`,
        `Без калькулятора, по формуле: <b>${base + d} · ${base - d}</b>`,
        `No calculator, use the formula: <b>${base + d} · ${base - d}</b>`,
      ),
      answer: ans,
      wrong: [base * base, base * base + d * d, ans - 2 * d],
      hints: [
        S(`${base + d} = ${base} + ${d};  ${base - d} = ${base} − ${d}`),
        S(`${base}² − ${d}² = ${base * base} − ${d * d}`),
      ],
      explain: S(`(${base} + ${d})(${base} − ${d}) = ${base}² − ${d}² = ${ans}`),
    });
  },
];

const equations: Gen[] = [
  (r) => {
    const a = pick(r, [2, 3, 4, 5, 6, -2, -3]), x = pick(r, [-4, -3, -2, 2, 3, 4, 5, 6]), b = pick(r, [-9, -7, -5, -3, 2, 4, 6, 8]), c = a * x + b;
    const eq = `${lin(a, b)} = ${s(c)}`;
    return Q(r, {
      prompt: T(`Tenglamani yeching: <b>${eq}</b>`, `Реши уравнение: <b>${eq}</b>`, `Solve: <b>${eq}</b>`),
      visual: { t: 'balance', left: lin(a, b), right: s(c) },
      answer: x,
      wrong: [-x, (c + b) / a, x + 1, c - b],
      hints: [
        b < 0
          ? T(`Al-jabr: ${s(b)} narigi tomonga +${-b} bo‘lib o‘tadi.`, `Аль-джабр: ${s(b)} переходит на другую сторону как +${-b}.`, `Al-jabr: ${s(b)} crosses to the other side as +${-b}.`)
          : T(`Al-jabr: +${b} narigi tomonga −${b} bo‘lib o‘tadi.`, `Аль-джабр: +${b} переходит на другую сторону как −${b}.`, `Al-jabr: +${b} crosses to the other side as −${b}.`),
        S(`${kx(a)} = ${s(c)} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${s(c - b)}`),
      ],
      explain: S(`${kx(a)} = ${s(c - b)};  x = ${s(c - b)} : ${par(a)} = ${s(x)}`),
      check: { expression: eq, root: x },
    });
  },
  (r) => {
    const a = int(r, 3, 9), c = int(r, 1, a - 1), x = pick(r, [-3, -2, 2, 3, 4, 5]), b = pick(r, [-6, -4, -2, 1, 3, 5, 7]), d = (a - c) * x + b;
    const eq = `${lin(a, b)} = ${lin(c, d)}`;
    return Q(r, {
      prompt: T(`Tenglamani yeching: <b>${eq}</b>`, `Реши уравнение: <b>${eq}</b>`, `Solve: <b>${eq}</b>`),
      visual: { t: 'balance', left: lin(a, b), right: lin(c, d) },
      answer: x,
      wrong: [-x, d - b, x + 2],
      hints: [
        T('x li hadlarni chapga, sonlarni o‘ngga o‘tkazing. O‘tganda ishorasi o‘zgaradi.', 'Члены с x — налево, числа — направо. При переносе знак меняется.', 'Move x terms left and numbers right. Crossing over flips the sign.'),
        S(`${kx(a)} − ${kx(c) || '0'} = ${s(d)} ${b < 0 ? '+' : '−'} ${Math.abs(b)}`),
      ],
      explain: S(`${kx(a - c)} = ${s(d - b)};  x = ${s(x)}`),
      check: { expression: eq, root: x },
    });
  },
  (r) => {
    const a = int(r, 2, 6), b = pick(r, [-5, -4, -3, -2, 1, 2, 3, 4]), x = int(r, 2, 9), c = a * (x + b);
    const inner = b < 0 ? `x − ${-b}` : `x + ${b}`;
    const eq = `${a}(${inner}) = ${s(c)}`;
    return Q(r, {
      prompt: T(`Tenglamani yeching: <b>${eq}</b>`, `Реши уравнение: <b>${eq}</b>`, `Solve: <b>${eq}</b>`),
      answer: x,
      wrong: [x + b, c - b, c / a],
      hints: [
        T(`Qavsni oching yoki ikkala tomonni ${a} ga bo‘ling.`, `Раскрой скобки или раздели обе части на ${a}.`, `Open the bracket, or divide both sides by ${a}.`),
        S(`${inner} = ${s(c)} : ${a} = ${s(c / a)}`),
      ],
      explain: S(`${inner} = ${s(c / a)};  x = ${x}`),
      check: { expression: eq, root: x },
    });
  },
  (r) => {
    const kind = pick(r, ['one', 'none', 'many'] as const);
    const a = int(r, 2, 5), b = int(r, 1, 6);
    const eq = kind === 'one' ? `${a}x + ${b} = ${a + 1}x` : kind === 'none' ? `x + ${b} = x` : `${a}(x + ${b}) = ${a}x + ${a * b}`;
    const one = T('Bitta ildiz', 'Один корень', 'One root');
    const none = T('Ildizi yo‘q', 'Нет корней', 'No roots');
    const many = T('Cheksiz ko‘p ildiz', 'Бесконечно много корней', 'Infinitely many roots');
    const two = T('Ikkita ildiz', 'Два корня', 'Two roots');
    return Q(r, {
      prompt: T(`<b>${eq}</b> tenglama nechta ildizga ega?`, `Сколько корней у уравнения <b>${eq}</b>?`, `How many roots does <b>${eq}</b> have?`),
      answer: kind === 'one' ? one : kind === 'none' ? none : many,
      wrong: [one, none, many, two].filter((c) => c !== (kind === 'one' ? one : kind === 'none' ? none : many)),
      hints: [
        T('Uni ax = b ko‘rinishiga keltiring.', 'Приведи его к виду ax = b.', 'Bring it to the form ax = b.'),
        T('a = 0 bo‘lib qolsa: 0 = b to‘g‘rimi? To‘g‘ri bo‘lsa — cheksiz ko‘p, noto‘g‘ri bo‘lsa — ildiz yo‘q.', 'Если a = 0: верно ли 0 = b? Верно — бесконечно много, неверно — корней нет.', 'If a = 0: is 0 = b true? True means infinitely many, false means no roots.'),
      ],
      explain:
        kind === 'one'
          ? S(`${a}x + ${b} = ${a + 1}x  →  x = ${b}`)
          : kind === 'none'
            ? S(`x + ${b} = x  →  0 · x = −${b}`)
            : S(`${a}x + ${a * b} = ${a}x + ${a * b}  →  0 · x = 0`),
    });
  },
];

const wordProblems: Gen[] = [
  (r) => {
    const x = int(r, 8, 30), d = int(r, 2, 12), sum = 2 * x + d;
    const [a, b] = pick(r, [['Anvar', 'Dilnoza'], ['Jasur', 'Madina'], ['Sardor', 'Nilufar']] as const);
    return Q(r, {
      prompt: T(
        `${a} va ${b} birgalikda ${sum} ta yong‘oq terdi. ${b} ${a}dan ${d} ta ko‘p terdi. ${a} nechta yong‘oq tergan?`,
        `${a} и ${b} вместе собрали ${sum} орехов. ${b} собрал(а) на ${d} больше. Сколько собрал ${a}?`,
        `${a} and ${b} picked ${sum} walnuts together. ${b} picked ${d} more than ${a}. How many did ${a} pick?`,
      ),
      visual: { t: 'bar', parts: [{ w: x, label: 'x', tone: 'blue' }, { w: x, label: 'x', tone: 'blue' }, { w: Math.max(d, 4), label: s(d), tone: 'amber' }], total: s(sum) },
      answer: x,
      wrong: [x + d, sum - d, sum / 2],
      hints: [
        T(`${a} — x ta, ${b} — x + ${d} ta. Tenglama: x + x + ${d} = ${sum}.`, `${a} — x, ${b} — x + ${d}. Уравнение: x + x + ${d} = ${sum}.`, `${a} has x, ${b} has x + ${d}. Equation: x + x + ${d} = ${sum}.`),
        S(`2x = ${sum} − ${d} = ${sum - d}`),
      ],
      explain: S(`2x + ${d} = ${sum};  2x = ${sum - d};  x = ${x}`),
      check: { expression: `2x + ${d} = ${sum}`, root: x },
    });
  },
  (r) => {
    const son = int(r, 8, 14), k = pick(r, [3, 4]), total = son * (k + 1);
    return Q(r, {
      prompt: T(
        `Ota o‘g‘lidan ${k} marta katta. Ikkalasining yoshi birgalikda ${total} da. O‘g‘il necha yoshda?`,
        `Отец в ${k} раза старше сына. Вместе им ${total} лет. Сколько лет сыну?`,
        `A father is ${k} times as old as his son. Together they are ${total}. How old is the son?`,
      ),
      visual: { t: 'bar', parts: [{ w: 1, label: 'x', tone: 'amber' }, ...Array.from({ length: k }, () => ({ w: 1, label: 'x', tone: 'blue' as const }))], total: s(total) },
      answer: son,
      wrong: [son * k, total / k, son + k],
      hints: [
        T(`O‘g‘il — x, ota — ${k}x. Tenglama: x + ${k}x = ${total}.`, `Сын — x, отец — ${k}x. Уравнение: x + ${k}x = ${total}.`, `Son is x, father is ${k}x. Equation: x + ${k}x = ${total}.`),
        S(`${k + 1}x = ${total}`),
      ],
      explain: S(`${k + 1}x = ${total};  x = ${son}`),
      check: { expression: `x + ${k}x = ${total}`, root: son },
    });
  },
  (r) => {
    const pen = pick(r, [2, 3, 4, 5]), n = int(r, 2, 5), book = int(r, 3, 9), total = n * book + pen;
    return Q(r, {
      prompt: T(
        `${n} ta daftar va bitta ruchka ${total} ming so‘m turadi. Ruchka ${pen} ming so‘m. Bitta daftar necha ming so‘m?`,
        `${n} тетрадей и ручка стоят ${total} тыс. сумов. Ручка стоит ${pen} тыс. Сколько тысяч стоит тетрадь?`,
        `${n} notebooks and a pen cost ${total} thousand so‘m. The pen costs ${pen} thousand. How much is one notebook, in thousand so‘m?`,
      ),
      answer: book,
      wrong: [total - pen, (total + pen) / n, book + 1],
      hints: [
        S(`${n}x + ${pen} = ${total}`),
        S(`${n}x = ${total} − ${pen} = ${total - pen}`),
      ],
      explain: S(`${n}x = ${total - pen};  x = ${book}`),
      check: { expression: `${n}x + ${pen} = ${total}`, root: book },
    });
  },
];

const functions: Gen[] = [
  (r) => {
    const k = pick(r, [-2, -1, 1, 2]), b = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4]);
    return Q(r, {
      prompt: T('Grafikka qarang. To‘g‘ri chiziq OY o‘qini qaysi nuqtada kesib o‘tadi? (b = ?)', 'Посмотри на график. Где прямая пересекает ось OY? (b = ?)', 'Look at the graph. Where does the line cross the y-axis? (b = ?)'),
      visual: { t: 'plane', lines: [{ k, b }], points: [{ x: 0, y: b }] },
      answer: b,
      wrong: [-b, k, b + 1],
      hints: [
        T('Faqat OY o‘qiga qarang — tik chiziq.', 'Смотри только на ось OY — вертикальную линию.', 'Look only at the y-axis, the upright line.'),
        T('Qizil nuqta qaysi son ro‘parasida?', 'Напротив какого числа стоит красная точка?', 'Which number is the red dot next to?'),
      ],
      explain: T(`Chiziq OY ni ${s(b)} da kesadi, demak b = ${s(b)}.`, `Прямая пересекает OY в точке ${s(b)}, значит b = ${s(b)}.`, `The line crosses the y-axis at ${s(b)}, so b = ${s(b)}.`),
    });
  },
  (r) => {
    const k = pick(r, [2, 3, -2, -1, 4]), b = int(r, -5, 5), x = pick(r, [-2, -1, 1, 2, 3]), y = k * x + b;
    return Q(r, {
      prompt: TN(() => T(`<b>${lineEq(k, b, 'uz')}</b> funksiyada x = ${s(x)} bo‘lsa, y nechaga teng?`, `В функции <b>${lineEq(k, b, 'ru')}</b> при x = ${s(x)} чему равен y?`, `In <b>${lineEq(k, b, 'en')}</b>, what is y when x = ${s(x)}?`)),
      answer: y,
      wrong: [k * x - b, k + x + b, -y === y ? y + 1 : -y],
      hints: [
        T(`x o‘rniga ${s(x)} ni qo‘ying.`, `Подставь ${s(x)} вместо x.`, `Put ${s(x)} in place of x.`),
        S(`y = ${s(k)} · ${par(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`),
      ],
      explain: S(`y = ${s(k * x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${s(y)}`),
    });
  },
  (r) => {
    const k = pick(r, [1, 2, -1, -2]), b = pick(r, [-2, -1, 1, 2, 3]);
    const eq = (kk: number, bb: number) => S(lineEq(kk, bb, 'ru'));
    return Q(r, {
      prompt: T('Qaysi tenglama shu grafikka mos keladi?', 'Какое уравнение подходит к этому графику?', 'Which equation matches this graph?'),
      visual: { t: 'plane', lines: [{ k, b }] },
      answer: eq(k, b),
      wrong: [eq(-k, b), eq(k, -b), eq(-k, -b), eq(k + (k > 0 ? 1 : -1), b)],
      hints: [
        T('Chiziq OY ni qayerda kesadi? Bu b.', 'Где прямая пересекает OY? Это b.', 'Where does the line cross the y-axis? That is b.'),
        T('Chiziq chapdan o‘ngga ko‘tariladimi? Ko‘tarilsa, k musbat; tushsa, k manfiy.', 'Идёт ли прямая вверх слева направо? Вверх — k положительный, вниз — отрицательный.', 'Does the line rise from left to right? Rising means k is positive, falling means negative.'),
      ],
      explain: T(`b = ${s(b)} va k = ${s(k)}: ${lineEq(k, b, 'uz')}.`, `b = ${s(b)} и k = ${s(k)}: ${lineEq(k, b, 'ru')}.`, `b = ${s(b)} and k = ${s(k)}: ${lineEq(k, b, 'en')}.`),
    });
  },
];

const systems: Gen[] = [
  (r) => {
    const x = int(r, 2, 12), y = int(r, 1, x - 1 || 1), sum = x + y, diff = x - y;
    const shown = `x + y = ${sum};  x − y = ${s(diff)}`;
    return Q(r, {
      prompt: T(`Sistemani yeching: <b>${shown}</b>. x nechaga teng?`, `Реши систему: <b>${shown}</b>. Чему равен x?`, `Solve the system: <b>${shown}</b>. What is x?`),
      visual: { t: 'plane', lines: [{ k: -1, b: sum > 6 ? 6 : sum, tone: 'blue' }, { k: 1, b: -diff > 6 ? -6 : -diff, tone: 'amber' }] },
      answer: x,
      wrong: [y, sum, diff + 1],
      hints: [
        T('Ikki tenglamani qo‘shing: y lar yo‘qoladi.', 'Сложи два уравнения: y исчезнет.', 'Add the two equations: y disappears.'),
        S(`2x = ${sum} + ${s(diff)} = ${sum + diff}`),
      ],
      explain: S(`2x = ${sum + diff};  x = ${x};  y = ${y}`),
    });
  },
  (r) => {
    const k = pick(r, [2, 3, 4]), x = int(r, 1, 6), y = k * x, total = x + y;
    const shown = `y = ${k}x;  x + y = ${total}`;
    return Q(r, {
      prompt: T(`Sistemani yeching: <b>${shown}</b>. x nechaga teng?`, `Реши систему: <b>${shown}</b>. Чему равен x?`, `Solve the system: <b>${shown}</b>. What is x?`),
      answer: x,
      wrong: [y, total, x + 1],
      hints: [
        T(`O‘rniga qo‘yish: y o‘rniga ${k}x ni yozing.`, `Подстановка: вместо y напиши ${k}x.`, `Substitute: write ${k}x in place of y.`),
        S(`x + ${k}x = ${total}  →  ${k + 1}x = ${total}`),
      ],
      explain: S(`${k + 1}x = ${total};  x = ${x};  y = ${y}`),
      check: { expression: `x + ${k}x = ${total}`, root: x },
    });
  },
  (r) => {
    const book = int(r, 3, 8), pen = int(r, 1, 4), a = book * 2 + pen, b = book + pen;
    return Q(r, {
      prompt: T(
        `2 ta daftar va ruchka ${a} ming so‘m. 1 ta daftar va ruchka ${b} ming so‘m. Bitta daftar necha ming so‘m?`,
        `2 тетради и ручка стоят ${a} тыс. сумов. 1 тетрадь и ручка — ${b} тыс. Сколько тысяч стоит одна тетрадь?`,
        `2 notebooks and a pen cost ${a} thousand so‘m. 1 notebook and a pen cost ${b} thousand. How much is one notebook, in thousand so‘m?`,
      ),
      answer: book,
      wrong: [pen, a - pen, b, a + b],
      hints: [
        T('Ikki xaridni solishtiring: farqi nimada?', 'Сравни две покупки: в чём разница?', 'Compare the two purchases: what is the difference?'),
        S(`${a} − ${b} = ?`),
      ],
      explain: S(`2x + y = ${a};  x + y = ${b};  x = ${a} − ${b} = ${book}`),
    });
  },
];

const combinatorics: Gen[] = [
  (r) => {
    const a = int(r, 2, 5), b = int(r, 2, 5), ans = a * b;
    return Q(r, {
      prompt: T(
        `Jasurda ${a} ta ko‘ylak va ${b} ta shim bor. U necha xil kiyinishi mumkin?`,
        `У Жасура ${a} рубашки и ${b} брюк. Сколькими способами он может одеться?`,
        `Jasur has ${a} shirts and ${b} pairs of trousers. How many different outfits can he wear?`,
      ),
      visual: { t: 'grid', rows: a, cols: b },
      answer: ans,
      wrong: [a + b, a + b + 1, ans + a],
      hints: [
        T('Har bir ko‘ylakka har bir shimni kiyib ko‘ring.', 'К каждой рубашке подходят все брюки.', 'Every shirt can go with every pair of trousers.'),
        S(`${a} · ${b}`),
      ],
      explain: S(`${a} · ${b} = ${ans}`),
    });
  },
  (r) => {
    const n = pick(r, [3, 4, 5]), ans = n === 3 ? 6 : n === 4 ? 24 : 120;
    const long = Array.from({ length: n }, (_, i) => n - i).join(' · ');
    return Q(r, {
      prompt: T(`${n} nafar o‘quvchi navbatga necha xil tartibda turishi mumkin?`, `Сколькими способами ${n} учеников могут встать в очередь?`, `In how many different orders can ${n} pupils stand in a queue?`),
      answer: ans,
      wrong: [n * n, n + n, ans + n],
      hints: [
        T(`Birinchi o‘ringa ${n} ta tanlov, ikkinchisiga ${n - 1} ta...`, `На первое место — ${n} варианта, на второе — ${n - 1}...`, `${n} choices for first place, ${n - 1} for second...`),
        S(long),
      ],
      explain: S(`${long} = ${ans}`),
    });
  },
  (r) => {
    const digits = pick(r, [[1, 2, 3], [2, 5, 7], [1, 4, 6, 8], [3, 5, 7, 9]]), n = digits.length, repeat = r() < 0.5;
    const ans = repeat ? n * n : n * (n - 1);
    const list = digits.join(', ');
    return Q(r, {
      prompt: repeat
        ? T(`${list} raqamlaridan nechta ikki xonali son tuzish mumkin? (Raqam takrorlanishi mumkin.)`, `Сколько двузначных чисел можно составить из цифр ${list}? (Цифры могут повторяться.)`, `How many two-digit numbers can be made from ${list}? (Digits may repeat.)`)
        : T(`${list} raqamlaridan nechta ikki xonali son tuzish mumkin? (Raqam takrorlanmaydi.)`, `Сколько двузначных чисел можно составить из цифр ${list}? (Цифры не повторяются.)`, `How many two-digit numbers can be made from ${list}? (No digit repeats.)`),
      answer: ans,
      wrong: [repeat ? n * (n - 1) : n * n, n + n, ans + 1],
      hints: [
        T(`O‘nlar xonasiga ${n} ta tanlov.`, `На место десятков — ${n} варианта.`, `${n} choices for the tens digit.`),
        repeat
          ? T(`Birlar xonasiga ham ${n} ta: ${n} · ${n}.`, `На место единиц тоже ${n}: ${n} · ${n}.`, `Also ${n} for the units digit: ${n} · ${n}.`)
          : T(`Birlar xonasiga bittasi kam: ${n} · ${n - 1}.`, `На место единиц на одну меньше: ${n} · ${n - 1}.`, `One fewer for the units digit: ${n} · ${n - 1}.`),
      ],
      explain: S(`${n} · ${repeat ? n : n - 1} = ${ans}`),
    });
  },
];

const BOOK = (ch: number) => T(`Algebra 7-sinf, ${ch}-bob`, `Алгебра, 7 класс, глава ${ch}`, `Algebra, Grade 7, chapter ${ch}`);

export const g7AlgebraTopics: Topic[] = [
  {
    id: 'a7-expr', grade: 7, subject: 'algebra7', emoji: '🔣', book: BOOK(1),
    title: T('Ifodalar va qavslar', 'Выражения и скобки', 'Expressions and brackets'),
    keywords: ['qavs', 'koeffitsiyent', 'ifoda', 'скобк', 'коэффициент', 'bracket', 'coefficient'],
    cards: [
      {
        text: T(
          'Qavs oldidagi son ichidagi <b>har bir</b> hadga ko‘payadi.\n<b>3(x + 2) = 3x + 6</b>.\nTasavvur qiling: 3 ta sumka, har birida x ta kitob va 2 ta daftar.',
          'Число перед скобкой умножается на <b>каждое</b> слагаемое.\n<b>3(x + 2) = 3x + 6</b>.\nПредставь: 3 сумки, в каждой x книг и 2 тетради.',
          'The number in front multiplies <b>every</b> term inside.\n<b>3(x + 2) = 3x + 6</b>.\nPicture 3 bags, each with x books and 2 notebooks.',
        ),
        visual: { t: 'tiles', groups: [{ n: 3, kind: 'x' }, { n: 6, kind: '1' }] },
      },
      {
        text: T(
          'Qavs oldida <b>minus</b> bo‘lsa, ichidagi ishoralar teskarisiga o‘zgaradi.\n<b>−(x − 4) = −x + 4</b>.',
          'Если перед скобкой <b>минус</b>, знаки внутри меняются.\n<b>−(x − 4) = −x + 4</b>.',
          'A <b>minus</b> in front flips every sign inside.\n<b>−(x − 4) = −x + 4</b>.',
        ),
        visual: { t: 'formula', main: '−(x − 4) = −x + 4', tone: 'amber' },
      },
      {
        text: T(
          '<b>Koeffitsiyent</b> — harf oldidagi son.\n−5xy da koeffitsiyent <b>−5</b>, x da esa <b>1</b>.',
          '<b>Коэффициент</b> — это число перед буквой.\nВ −5xy коэффициент <b>−5</b>, а в x он равен <b>1</b>.',
          'The <b>coefficient</b> is the number in front of the letters.\nIn −5xy it is <b>−5</b>, and in x it is <b>1</b>.',
        ),
      },
    ],
    gens: expressions,
  },
  {
    id: 'a7-power', grade: 7, subject: 'algebra7', emoji: '⚡', book: BOOK(1),
    title: T('Natural ko‘rsatkichli daraja', 'Степень с натуральным показателем', 'Powers'),
    keywords: ['daraja', 'ko‘rsatkich', 'kvadrat', 'kub', 'степен', 'показател', 'power', 'exponent', 'square'],
    cards: [
      {
        text: T(
          '<b>2³ = 2 · 2 · 2 = 8</b>.\n2 — asos, 3 — ko‘rsatkich: asos necha marta ko‘paytirilishini bildiradi.\n⚠️ 2³ bu 2 · 3 emas!',
          '<b>2³ = 2 · 2 · 2 = 8</b>.\n2 — основание, 3 — показатель: сколько раз умножаем основание.\n⚠️ 2³ — это не 2 · 3!',
          '<b>2³ = 2 · 2 · 2 = 8</b>.\n2 is the base, 3 is the exponent: how many copies are multiplied.\n⚠️ 2³ is not 2 · 3!',
        ),
        visual: { t: 'formula', main: '2³ = 2 · 2 · 2 = 8' },
      },
      {
        text: T(
          'Uchta qoida:\n<b>xᵐ · xⁿ = xᵐ⁺ⁿ</b> — ko‘paytirishda qo‘shiladi.\n<b>xᵐ : xⁿ = xᵐ⁻ⁿ</b> — bo‘lishda ayriladi.\n<b>(xᵐ)ⁿ = xᵐⁿ</b> — darajaning darajasida ko‘paytiriladi.',
          'Три правила:\n<b>xᵐ · xⁿ = xᵐ⁺ⁿ</b> — при умножении складываем.\n<b>xᵐ : xⁿ = xᵐ⁻ⁿ</b> — при делении вычитаем.\n<b>(xᵐ)ⁿ = xᵐⁿ</b> — степень степени: умножаем.',
          'Three rules:\n<b>xᵐ · xⁿ = xᵐ⁺ⁿ</b> — multiplying adds.\n<b>xᵐ ÷ xⁿ = xᵐ⁻ⁿ</b> — dividing subtracts.\n<b>(xᵐ)ⁿ = xᵐⁿ</b> — a power of a power multiplies.',
        ),
        visual: { t: 'formula', main: 'x² · x³ = x⁵', sub: '2 + 3 = 5', tone: 'amber' },
      },
    ],
    gens: powers,
  },
  {
    id: 'a7-poly', grade: 7, subject: 'algebra7', emoji: '🧱', book: BOOK(1),
    title: T('Birhad va ko‘phad', 'Одночлены и многочлены', 'Monomials and polynomials'),
    keywords: ['birhad', 'ko‘phad', 'o‘xshash', 'ixcham', 'одночлен', 'многочлен', 'подобн', 'monomial', 'polynomial', 'like terms'],
    cards: [
      {
        text: T(
          '<b>Birhad</b> — bitta bo‘lak: 3x, −5x², 7.\n<b>Ko‘phad</b> — bir nechta birhad yig‘indisi: 2x² + 3x − 1.',
          '<b>Одночлен</b> — один блок: 3x, −5x², 7.\n<b>Многочлен</b> — сумма нескольких одночленов: 2x² + 3x − 1.',
          'A <b>monomial</b> is one block: 3x, −5x², 7.\nA <b>polynomial</b> is several added together: 2x² + 3x − 1.',
        ),
        visual: { t: 'tiles', groups: [{ n: 2, kind: 'x2' }, { n: 3, kind: 'x' }, { n: 1, kind: '1' }] },
      },
      {
        text: T(
          '<b>O‘xshash hadlar</b> faqat o‘zaro qo‘shiladi:\n4x + 3x − 2x = <b>5x</b>.\nx² va x esa o‘xshash emas: ular alohida qoladi.',
          '<b>Подобные слагаемые</b> складываются только между собой:\n4x + 3x − 2x = <b>5x</b>.\nx² и x не подобны: остаются отдельно.',
          '<b>Like terms</b> only combine with each other:\n4x + 3x − 2x = <b>5x</b>.\nx² and x are not alike: they stay apart.',
        ),
        visual: { t: 'tiles', groups: [{ n: 4, kind: 'x' }, { n: 3, kind: 'x' }] },
      },
      {
        text: T(
          'Birhadlarni ko‘paytirish: sonlar ko‘paytiriladi, ko‘rsatkichlar qo‘shiladi.\n<b>2x² · 3x³ = 6x⁵</b>.',
          'Умножение одночленов: числа перемножаем, показатели складываем.\n<b>2x² · 3x³ = 6x⁵</b>.',
          'To multiply monomials, multiply the numbers and add the exponents.\n<b>2x² · 3x³ = 6x⁵</b>.',
        ),
        visual: { t: 'formula', main: '2x² · 3x³ = 6x⁵', tone: 'amber' },
      },
    ],
    gens: polynomials,
  },
  {
    id: 'a7-fsu', grade: 7, subject: 'algebra7', emoji: '🔲', book: BOOK(2),
    title: T('Qisqa ko‘paytirish formulalari', 'Формулы сокращённого умножения', 'Special products'),
    keywords: ['qisqa', 'formula', 'kvadrat', 'сокращ', 'формул', 'квадрат', 'special product', 'square of'],
    cards: [
      {
        text: T(
          'Yig‘indining kvadrati — rasmdagi kvadrat:\n<b>(a + b)² = a² + 2ab + b²</b>.\nKo‘ring: ab bo‘lagi <b>ikki marta</b> bor!',
          'Квадрат суммы — это квадрат на рисунке:\n<b>(a + b)² = a² + 2ab + b²</b>.\nСмотри: часть ab встречается <b>дважды</b>!',
          'The square of a sum is the square in the picture:\n<b>(a + b)² = a² + 2ab + b²</b>.\nLook: the ab piece appears <b>twice</b>!',
        ),
        visual: { t: 'square', a: 'a', b: 'b' },
      },
      {
        text: T(
          'Ayirmaning kvadrati: <b>(a − b)² = a² − 2ab + b²</b>.\nKvadratlar ayirmasi: <b>(a − b)(a + b) = a² − b²</b>.',
          'Квадрат разности: <b>(a − b)² = a² − 2ab + b²</b>.\nРазность квадратов: <b>(a − b)(a + b) = a² − b²</b>.',
          'Square of a difference: <b>(a − b)² = a² − 2ab + b²</b>.\nDifference of squares: <b>(a − b)(a + b) = a² − b²</b>.',
        ),
        visual: { t: 'formula', main: '(a − b)(a + b) = a² − b²', tone: 'amber' },
      },
      {
        text: T(
          'Sehrli hisob 🪄: <b>31 · 29</b>.\n(30 + 1)(30 − 1) = 900 − 1 = <b>899</b>.\nKalkulyatorsiz, bir zumda!',
          'Волшебный счёт 🪄: <b>31 · 29</b>.\n(30 + 1)(30 − 1) = 900 − 1 = <b>899</b>.\nБез калькулятора, за секунду!',
          'A magic trick 🪄: <b>31 · 29</b>.\n(30 + 1)(30 − 1) = 900 − 1 = <b>899</b>.\nNo calculator, in a second!',
        ),
        visual: { t: 'formula', main: '31 · 29 = 899', sub: '30² − 1²' },
      },
    ],
    gens: formulas,
  },
  {
    id: 'a7-eq', grade: 7, subject: 'algebra7', emoji: '📜', book: BOOK(4),
    title: T('Chiziqli tenglamalar', 'Линейные уравнения', 'Linear equations'),
    keywords: ['tenglama', 'xorazmiy', 'ildiz', 'al-jabr', 'уравнен', 'хорезми', 'корень', 'equation', 'khwarizmi', 'root'],
    cards: [
      {
        text: T(
          'Bilasizmi? <b>“Algebra”</b> so‘zi vatandoshimiz <b>Muhammad al-Xorazmiy</b> kitobidagi “al-jabr” so‘zidan kelib chiqqan. 📜\nUning ikki usuli bilan har qanday chiziqli tenglamani yechamiz.',
          'Знаешь ли ты? Слово <b>«алгебра»</b> произошло от «аль-джабр» из книги нашего земляка <b>Мухаммада аль-Хорезми</b>. 📜\nЕго двумя приёмами решается любое линейное уравнение.',
          'Did you know? The word <b>“algebra”</b> comes from “al-jabr” in the book by <b>Muhammad al-Khwarizmi</b>, from Khorezm in today’s Uzbekistan. 📜\nHis two moves solve any linear equation.',
        ),
        visual: { t: 'formula', main: 'al-jabr', sub: 'algebra', tone: 'amber' },
      },
      {
        text: T(
          '<b>Al-jabr</b>: hadni narigi tomonga o‘tkazamiz, ishorasi o‘zgaradi.\n3x − 4 = 11\n−4 o‘ngga +4 bo‘lib o‘tadi 🏃\n3x = 15, demak <b>x = 5</b>.',
          '<b>Аль-джабр</b>: переносим член на другую сторону, знак меняется.\n3x − 4 = 11\n−4 переходит направо как +4 🏃\n3x = 15, значит <b>x = 5</b>.',
          '<b>Al-jabr</b>: move a term across, and its sign flips.\n3x − 4 = 11\n−4 crosses to the right as +4 🏃\n3x = 15, so <b>x = 5</b>.',
        ),
        visual: { t: 'balance', left: '3x − 4', right: '11' },
      },
      {
        text: T(
          '<b>Val-muqobala</b>: ikkala tomondagi bir xil hadlarni tashlab yuboramiz.\n5x + 2 = 2 + 3x + 8\n+2 lar bilan xayrlashamiz 👋\n5x = 3x + 8, demak <b>x = 4</b>.',
          '<b>Валь-мукабала</b>: убираем одинаковые члены с обеих сторон.\n5x + 2 = 2 + 3x + 8\nПрощаемся с +2 👋\n5x = 3x + 8, значит <b>x = 4</b>.',
          '<b>Val-muqobala</b>: cancel the same terms on both sides.\n5x + 2 = 2 + 3x + 8\nSay goodbye to +2 👋\n5x = 3x + 8, so <b>x = 4</b>.',
        ),
        visual: { t: 'balance', left: '5x', right: '3x + 8' },
      },
      {
        text: T(
          'Tenglama ildizlari uch xil bo‘ladi:\n✅ Bitta ildiz: 2x = 6\n🚫 Ildizi yo‘q: 0 · x = 5\n♾️ Cheksiz ko‘p: 0 · x = 0',
          'Корней может быть:\n✅ Один: 2x = 6\n🚫 Ни одного: 0 · x = 5\n♾️ Бесконечно много: 0 · x = 0',
          'An equation can have:\n✅ One root: 2x = 6\n🚫 No roots: 0 · x = 5\n♾️ Infinitely many: 0 · x = 0',
        ),
      },
    ],
    gens: equations,
  },
  {
    id: 'a7-word', grade: 7, subject: 'algebra7', emoji: '📝', book: BOOK(4),
    title: T('Masalalarni tenglama bilan yechish', 'Задачи с помощью уравнений', 'Word problems with equations'),
    keywords: ['masala', 'matnli', 'задач', 'word problem', 'problem'],
    cards: [
      {
        text: T(
          'Har qanday masala uchun 3 qadam:\n1️⃣ Noma’lumni <b>x</b> deb belgilang.\n2️⃣ Gapni <b>tenglama</b>ga aylantiring.\n3️⃣ Yeching va <b>tekshiring</b>.',
          'Для любой задачи 3 шага:\n1️⃣ Обозначь неизвестное за <b>x</b>.\n2️⃣ Преврати текст в <b>уравнение</b>.\n3️⃣ Реши и <b>проверь</b>.',
          'Three steps for any problem:\n1️⃣ Call the unknown <b>x</b>.\n2️⃣ Turn the words into an <b>equation</b>.\n3️⃣ Solve it and <b>check</b>.',
        ),
      },
      {
        text: T(
          'Misol: ikki do‘st 20 ta yong‘oq terdi, biri 4 ta ko‘p.\nx + x + 4 = 20\n2x = 16, <b>x = 8</b>.\nDemak 8 va 12 ta. Tekshiruv: 8 + 12 = 20 ✓',
          'Пример: два друга собрали 20 орехов, один на 4 больше.\nx + x + 4 = 20\n2x = 16, <b>x = 8</b>.\nЗначит 8 и 12. Проверка: 8 + 12 = 20 ✓',
          'Example: two friends picked 20 walnuts, one picked 4 more.\nx + x + 4 = 20\n2x = 16, <b>x = 8</b>.\nSo 8 and 12. Check: 8 + 12 = 20 ✓',
        ),
        visual: { t: 'bar', parts: [{ w: 8, label: 'x', tone: 'blue' }, { w: 8, label: 'x', tone: 'blue' }, { w: 4, label: '4', tone: 'amber' }], total: '20' },
      },
    ],
    gens: wordProblems,
  },
  {
    id: 'a7-func', grade: 7, subject: 'algebra7', emoji: '📈', book: BOOK(5), appLink: 'g7',
    title: T('Chiziqli funksiya', 'Линейная функция', 'Linear functions'),
    keywords: ['funksiya', 'grafik', 'koordinata', 'функци', 'график', 'координат', 'function', 'graph', 'kx'],
    cards: [
      {
        text: T(
          '<b>y = kx + b</b> — to‘g‘ri chiziq.\n<b>b</b> — chiziq OY o‘qini kesadigan joy.\n<b>k</b> — chiziqning qiyaligi.',
          '<b>y = kx + b</b> — это прямая.\n<b>b</b> — где прямая пересекает ось OY.\n<b>k</b> — наклон прямой.',
          '<b>y = kx + b</b> is a straight line.\n<b>b</b> is where it crosses the y-axis.\n<b>k</b> is how steep it is.',
        ),
        visual: { t: 'plane', lines: [{ k: 2, b: 1 }], points: [{ x: 0, y: 1, label: 'b' }] },
      },
      {
        text: T(
          '<b>k musbat</b>: chiziq chapdan o‘ngga ko‘tariladi 📈\n<b>k manfiy</b>: chiziq tushadi 📉\n<b>k = 0</b>: chiziq gorizontal.',
          '<b>k положительный</b>: прямая идёт вверх 📈\n<b>k отрицательный</b>: прямая идёт вниз 📉\n<b>k = 0</b>: прямая горизонтальна.',
          '<b>k positive</b>: the line rises 📈\n<b>k negative</b>: the line falls 📉\n<b>k = 0</b>: the line is flat.',
        ),
        visual: { t: 'plane', lines: [{ k: 1, b: 0, tone: 'teal' }, { k: -1, b: 0, tone: 'coral' }, { k: 0, b: 3, tone: 'amber' }] },
      },
      {
        text: TN(() => T(
          `Nuqtani topish: x ni qo‘yamiz.\ny = 2x + 1, x = 2 bo‘lsa: y = 5. Nuqta ${pt(2, 5, 'uz')}.`,
          `Находим точку: подставляем x.\ny = 2x + 1, при x = 2: y = 5. Точка ${pt(2, 5, 'ru')}.`,
          `To find a point, put in x.\ny = 2x + 1, with x = 2: y = 5. The point ${pt(2, 5, 'en')}.`,
        )),
        visual: { t: 'plane', lines: [{ k: 2, b: 1 }], points: [{ x: 2, y: 5, label: '(2; 5)' }] },
      },
    ],
    gens: functions,
  },
  {
    id: 'a7-sys', grade: 7, subject: 'algebra7', emoji: '✖️', book: BOOK(6),
    title: T('Chiziqli tenglamalar sistemasi', 'Системы линейных уравнений', 'Systems of linear equations'),
    keywords: ['sistema', 'система', 'system', 'ikki noma’lum', 'simultaneous'],
    cards: [
      {
        text: T(
          'Sistema — ikki tenglama, ikki noma’lum.\nJavob — ikki chiziq <b>kesishgan nuqta</b>.',
          'Система — два уравнения, два неизвестных.\nОтвет — это <b>точка пересечения</b> двух прямых.',
          'A system is two equations with two unknowns.\nThe answer is the point where <b>two lines cross</b>.',
        ),
        visual: { t: 'plane', lines: [{ k: -1, b: 4, tone: 'blue' }, { k: 1, b: -2, tone: 'amber' }], points: [{ x: 3, y: 1 }] },
      },
      {
        text: T(
          '<b>Qo‘shish usuli</b>:\nx + y = 7\nx − y = 3\nQo‘shamiz: 2x = 10, <b>x = 5</b>, keyin <b>y = 2</b>.',
          '<b>Метод сложения</b>:\nx + y = 7\nx − y = 3\nСкладываем: 2x = 10, <b>x = 5</b>, затем <b>y = 2</b>.',
          '<b>The addition method</b>:\nx + y = 7\nx − y = 3\nAdd them: 2x = 10, <b>x = 5</b>, then <b>y = 2</b>.',
        ),
      },
      {
        text: T(
          '<b>O‘rniga qo‘yish usuli</b>:\ny = 2x\nx + y = 9\ny o‘rniga 2x yozamiz: 3x = 9, <b>x = 3</b>, <b>y = 6</b>.',
          '<b>Метод подстановки</b>:\ny = 2x\nx + y = 9\nВместо y пишем 2x: 3x = 9, <b>x = 3</b>, <b>y = 6</b>.',
          '<b>The substitution method</b>:\ny = 2x\nx + y = 9\nWrite 2x for y: 3x = 9, <b>x = 3</b>, <b>y = 6</b>.',
        ),
      },
    ],
    gens: systems,
  },
  {
    id: 'a7-comb', grade: 7, subject: 'algebra7', emoji: '🎲', book: BOOK(7),
    title: T('Kombinatorika', 'Комбинаторика', 'Counting (combinatorics)'),
    keywords: ['kombinatorika', 'tartib', 'комбинатор', 'combinator', 'how many ways'],
    cards: [
      {
        text: T(
          '<b>Ko‘paytirish qoidasi</b>: 3 ta ko‘ylak va 2 ta shim bo‘lsa, <b>3 · 2 = 6</b> xil kiyinish mumkin.',
          '<b>Правило умножения</b>: 3 рубашки и 2 брюк — это <b>3 · 2 = 6</b> вариантов.',
          '<b>The multiplication rule</b>: 3 shirts and 2 pairs of trousers give <b>3 · 2 = 6</b> outfits.',
        ),
        visual: { t: 'grid', rows: 2, cols: 3 },
      },
      {
        text: T(
          '<b>Tartiblash</b>: 3 kishi navbatga turadi.\n1-o‘ringa 3 ta tanlov, 2-o‘ringa 2 ta, 3-o‘ringa 1 ta:\n<b>3 · 2 · 1 = 6</b>.',
          '<b>Перестановки</b>: 3 человека встают в очередь.\nНа 1-е место 3 варианта, на 2-е — 2, на 3-е — 1:\n<b>3 · 2 · 1 = 6</b>.',
          '<b>Orderings</b>: 3 people stand in a queue.\n3 choices for first, 2 for second, 1 for third:\n<b>3 · 2 · 1 = 6</b>.',
        ),
        visual: { t: 'formula', main: '3 · 2 · 1 = 6' },
      },
    ],
    gens: combinatorics,
  },
];
