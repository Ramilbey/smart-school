// Grade 7 Physics. Follows the topics and the "Berilgan → Formula → Hisoblash" layout of "Fizika 7" (Suyarov et al., 2022).
// Own wording and own numbers. Draft: awaiting teacher review.

import { Q, S, T, TN, fr, int, pick, type Gen, type Topic } from './types.ts';
import { ruUnits } from './visuals.ts';

/** The book's solution layout: Given → Formula → Calculation. */
const worked = (given: string, formula: string, calc: string) =>
  T(`<b>Berilgan:</b> ${given}\n<b>Formula:</b> ${formula}\n<b>Hisoblash:</b> ${calc}`, `<b>Дано:</b> ${ruUnits(given)}\n<b>Формула:</b> ${formula}\n<b>Решение:</b> ${ruUnits(calc)}`, `<b>Given:</b> ${given}\n<b>Formula:</b> ${formula}\n<b>Working:</b> ${calc}`);

const speed: Gen[] = [
  (r) => {
    const [who, v] = pick(r, [[T('Velosipedchi', 'Велосипедист', 'A cyclist'), 15], [T('Avtobus', 'Автобус', 'A bus'), 60], [T('“Afrosiyob” poyezdi', 'Поезд «Афросиёб»', 'The Afrosiyob train'), 200]] as const);
    const t = int(r, 2, 4), ans = v * t;
    return Q(r, {
      prompt: T(`${who.uz} ${v} km/soat tezlikda ${t} soat yurdi. U qancha yo‘l bosdi?`, `${who.ru} ехал ${t} ч со скоростью ${v} км/ч. Какой путь он прошёл?`, `${who.en} travels at ${v} km/h for ${t} hours. How far does it go?`),
      visual: { t: 'road', s: 's = ?', v: `${v} km/h`, time: `${t} h` },
      answer: T(`${ans} km`, `${ans} км`, `${ans} km`),
      wrong: [T(`${v + t} km`, `${v + t} км`, `${v + t} km`), T(`${v * (t + 1)} km`, `${v * (t + 1)} км`, `${v * (t + 1)} km`), T(`${v} km`, `${v} км`, `${v} km`)],
      hints: [S('s = v · t'), S(`s = ${v} · ${t}`)],
      explain: worked(`v = ${v} km/h, t = ${t} h`, 's = v · t', `s = ${v} · ${t} = ${ans} km`),
    });
  },
  (r) => {
    const v = pick(r, [10, 20, 40, 50, 60, 80]), t = int(r, 2, 5), d = v * t;
    return Q(r, {
      prompt: T(`Mashina ${d} km yo‘lni ${v} km/soat tezlikda bosdi. Necha soat ketdi?`, `Машина прошла ${d} км со скоростью ${v} км/ч. Сколько часов ушло?`, `A car covers ${d} km at ${v} km/h. How many hours does it take?`),
      visual: { t: 'road', s: `${d} km`, v: `${v} km/h`, time: 't = ?' },
      answer: t,
      wrong: [d - v, t + 1, v],
      hints: [S('t = s : v'), S(`t = ${d} : ${v}`)],
      explain: worked(`s = ${d} km, v = ${v} km/h`, 't = s : v', `t = ${d} : ${v} = ${t} h`),
    });
  },
  (r) => {
    const v = pick(r, [5, 10, 12, 15, 20, 30]), t = int(r, 2, 6), d = v * t;
    return Q(r, {
      prompt: T(`Otliq ${d} km yo‘lni ${t} soatda bosdi. Tezligi necha km/soat?`, `Всадник проехал ${d} км за ${t} ч. Какова его скорость в км/ч?`, `A rider covers ${d} km in ${t} hours. What is the speed in km/h?`),
      visual: { t: 'road', s: `${d} km`, v: 'v = ?', time: `${t} h` },
      answer: v,
      wrong: [d - t, d + t, v + 2],
      hints: [S('v = s : t'), S(`v = ${d} : ${t}`)],
      explain: worked(`s = ${d} km, t = ${t} h`, 'v = s : t', `v = ${d} : ${t} = ${v} km/h`),
    });
  },
];

const density: Gen[] = [
  (r) => {
    const rho = pick(r, [500, 800, 900, 1000, 2500, 2700, 7800]), V = pick(r, [2, 3, 4, 5, 10]), m = rho * V;
    return Q(r, {
      prompt: T(`Jism massasi ${m} kg, hajmi ${V} m³. Zichligi necha kg/m³?`, `Масса тела ${m} кг, объём ${V} м³. Какова плотность в кг/м³?`, `A body has a mass of ${m} kg and a volume of ${V} m³. What is its density in kg/m³?`),
      visual: { t: 'block', m: `m = ${m} kg`, v: `V = ${V} m³` },
      answer: rho,
      wrong: [m * V, m + V, rho + 100],
      hints: [S('ρ = m : V'), S(`ρ = ${m} : ${V}`)],
      explain: worked(`m = ${m} kg, V = ${V} m³`, 'ρ = m : V', `ρ = ${m} : ${V} = ${rho} kg/m³`),
    });
  },
  (r) => {
    const [name, rho] = pick(r, [[T('Suv', 'Вода', 'Water'), 1000], [T('Muz', 'Лёд', 'Ice'), 900], [T('Temir', 'Железо', 'Iron'), 7800]] as const);
    const V = int(r, 2, 5), m = rho * V;
    return Q(r, {
      prompt: T(`${name.uz} zichligi ${rho} kg/m³. ${V} m³ hajmdagi massasi necha kg?`, `Плотность: ${name.ru.toLowerCase()} — ${rho} кг/м³. Какова масса объёма ${V} м³?`, `${name.en} has a density of ${rho} kg/m³. What is the mass of ${V} m³?`),
      visual: { t: 'block', m: 'm = ?', v: `V = ${V} m³` },
      answer: m,
      wrong: [rho + V, m + rho, rho],
      hints: [S('m = ρ · V'), S(`m = ${rho} · ${V}`)],
      explain: worked(`ρ = ${rho} kg/m³, V = ${V} m³`, 'm = ρ · V', `m = ${rho} · ${V} = ${m} kg`),
    });
  },
  (r) => {
    const [name, rho] = pick(r, [[T('Muz', 'Лёд', 'Ice'), 900], [T('Qarag‘ay yog‘ochi', 'Сосна', 'Pine wood'), 500], [T('Temir', 'Железо', 'Iron'), 7800], [T('Shisha', 'Стекло', 'Glass'), 2500]] as const);
    const floats = rho < 1000;
    const yes = T('Suzadi', 'Плавает', 'It floats');
    const no = T('Cho‘kadi', 'Тонет', 'It sinks');
    return Q(r, {
      prompt: T(`${name.uz}: zichligi ${rho} kg/m³. Suv zichligi 1000 kg/m³. U suvda nima qiladi?`, `${name.ru}: плотность ${rho} кг/м³. Плотность воды 1000 кг/м³. Что будет в воде?`, `${name.en}: density ${rho} kg/m³. Water is 1000 kg/m³. What happens in water?`),
      answer: floats ? yes : no,
      wrong: [floats ? no : yes, T('Eriydi', 'Растворяется', 'It dissolves'), T('Havoga ko‘tariladi', 'Поднимается в воздух', 'It rises into the air')],
      hints: [
        T('Zichlikni suvnikiga solishtiring.', 'Сравни плотность с плотностью воды.', 'Compare its density with water’s.'),
        T('Suvdan yengilroq (zichligi kichik) jism suzadi.', 'Тело с меньшей плотностью, чем у воды, плавает.', 'Anything less dense than water floats.'),
      ],
      explain: T(`${rho} soni 1000 dan ${floats ? 'kichik' : 'katta'}, demak u ${floats ? 'suzadi' : 'cho‘kadi'}.`, `${rho} ${floats ? 'меньше' : 'больше'} 1000, значит ${floats ? 'плавает' : 'тонет'}.`, `${rho} is ${floats ? 'less' : 'more'} than 1000, so it ${floats ? 'floats' : 'sinks'}.`),
    });
  },
];

const pressure: Gen[] = [
  (r) => {
    const S2 = pick(r, [0.1, 0.2, 0.5, 2, 4, 5]), p = pick(r, [1000, 2000, 3000, 5000]), F = p * S2;
    return Q(r, {
      prompt: TN((n) => T(`${n(F)} N kuch ${n(S2)} m² yuzaga ta’sir qiladi. Bosim necha Pa?`, `Сила ${n(F)} Н действует на площадь ${n(S2)} м². Каково давление в Па?`, `A force of ${n(F)} N acts on ${n(S2)} m². What is the pressure in Pa?`)),
      visual: { t: 'press', force: TN((n) => S(`F = ${n(F)} N`)), area: TN((n) => S(`S = ${n(S2)} m²`)), wide: S2 >= 2 },
      answer: p,
      wrong: [F * S2, F, p + 500],
      hints: [S('p = F : S'), TN((n) => S(`p = ${n(F)} : ${n(S2)}`))],
      explain: TN((n) => worked(`F = ${n(F)} N, S = ${n(S2)} m²`, 'p = F : S', `p = ${n(F)} : ${n(S2)} = ${p} Pa`)),
    });
  },
  (r) => {
    const k = pick(r, [2, 4, 5]);
    const less = T(`${k} marta kamayadi`, `Уменьшится в ${k} раза`, `It becomes ${k} times smaller`);
    return Q(r, {
      prompt: T(`Kuch o‘zgarmadi, yuza esa ${k} marta oshdi. Bosim nima bo‘ladi?`, `Сила та же, а площадь выросла в ${k} раза. Что будет с давлением?`, `The force stays the same, but the area grows ${k} times. What happens to the pressure?`),
      visual: { t: 'press', force: 'F', area: `S · ${k}`, wide: true },
      answer: less,
      wrong: [T(`${k} marta oshadi`, `Вырастет в ${k} раза`, `It becomes ${k} times bigger`), T('O‘zgarmaydi', 'Не изменится', 'It stays the same'), T('Nolga teng bo‘ladi', 'Станет равно нулю', 'It becomes zero')],
      hints: [
        T('Chang‘ida qorga botmaymiz — yuza katta.', 'На лыжах не проваливаемся в снег — площадь большая.', 'On skis you do not sink into snow, because the area is big.'),
        S('p = F : S'),
      ],
      explain: T(`S kattalashsa, p kichiklashadi: ${k} marta kamayadi.`, `S больше — p меньше: в ${k} раза меньше.`, `Bigger S means smaller p: ${k} times smaller.`),
    });
  },
  (r) => {
    const p = pick(r, [1000, 2000, 5000, 10000]), area = pick(r, [2, 3, 4, 5]), F = p * area;
    return Q(r, {
      prompt: T(`Bosim ${p} Pa, yuza ${area} m². Kuch necha N?`, `Давление ${p} Па, площадь ${area} м². Какова сила в Н?`, `The pressure is ${p} Pa and the area is ${area} m². What is the force in N?`),
      visual: { t: 'press', force: 'F = ?', area: `S = ${area} m²`, wide: true },
      answer: F,
      wrong: [p + area, p, F + 500],
      hints: [S('F = p · S'), S(`F = ${p} · ${area}`)],
      explain: worked(`p = ${p} Pa, S = ${area} m²`, 'F = p · S', `F = ${p} · ${area} = ${F} N`),
    });
  },
];

const ohm: Gen[] = [
  (r) => {
    const I = int(r, 1, 6), R = pick(r, [2, 3, 4, 5, 10, 20]), U = I * R;
    return Q(r, {
      prompt: T(`Kuchlanish ${U} V, qarshilik ${R} Ω. Tok kuchi necha A?`, `Напряжение ${U} В, сопротивление ${R} Ом. Какова сила тока в А?`, `The voltage is ${U} V and the resistance is ${R} Ω. What is the current in A?`),
      visual: { t: 'circuit', u: `${U} V`, r: `${R} Ω`, i: 'I = ?' },
      answer: I,
      wrong: [U * R, U + R, I + 1],
      hints: [S('I = U : R'), S(`I = ${U} : ${R}`)],
      explain: worked(`U = ${U} V, R = ${R} Ω`, 'I = U : R', `I = ${U} : ${R} = ${I} A`),
    });
  },
  (r) => {
    const I = int(r, 1, 5), R = pick(r, [3, 4, 5, 6, 10, 12]), U = I * R;
    return Q(r, {
      prompt: T(`Tok kuchi ${I} A, qarshilik ${R} Ω. Kuchlanish necha V?`, `Сила тока ${I} А, сопротивление ${R} Ом. Каково напряжение в В?`, `The current is ${I} A and the resistance is ${R} Ω. What is the voltage in V?`),
      visual: { t: 'circuit', u: 'U = ?', r: `${R} Ω`, i: `I = ${I} A` },
      answer: U,
      wrong: [I + R, R, U + I],
      hints: [S('U = I · R'), S(`U = ${I} · ${R}`)],
      explain: worked(`I = ${I} A, R = ${R} Ω`, 'U = I · R', `U = ${I} · ${R} = ${U} V`),
    });
  },
  (r) => {
    const I = pick(r, [1, 2, 3, 4, 5]), R = pick(r, [2, 4, 5, 6, 10]), U = I * R;
    return Q(r, {
      prompt: T(`Kuchlanish ${U} V, tok kuchi ${I} A. Qarshilik necha Ω?`, `Напряжение ${U} В, сила тока ${I} А. Каково сопротивление в Ом?`, `The voltage is ${U} V and the current is ${I} A. What is the resistance in Ω?`),
      visual: { t: 'circuit', u: `${U} V`, r: 'R = ?', i: `I = ${I} A` },
      answer: R,
      wrong: [U * I, U + I, R + 1],
      hints: [S('R = U : I'), S(`R = ${U} : ${I}`)],
      explain: worked(`U = ${U} V, I = ${I} A`, 'R = U : I', `R = ${U} : ${I} = ${R} Ω`),
    });
  },
];

/* ---------- more practice: units, graphs, several steps ---------- */

const speedMore: Gen[] = [
  // km/h -> m/s
  (r) => {
    const ms = pick(r, [5, 10, 15, 20, 25, 30]), kmh = (ms * 18) / 5;
    return Q(r, {
      prompt: T(`Velosiped ${kmh} km/soat tezlikda ketyapti. Bu necha m/s?`, `Велосипед едет со скоростью ${kmh} км/ч. Сколько это в м/с?`, `A bicycle moves at ${kmh} km/h. How many metres per second is that?`),
      visual: { t: 'formula', main: `${kmh} km/h = ? m/s`, sub: '1 km = 1000 m,  1 h = 3600 s', tone: 'amber' },
      answer: ms,
      wrong: [ms * 2, kmh / 3, kmh],
      hints: [TN((n) => T(`1 m/s = ${n(3.6)} km/soat. km/soat dan m/s ga o‘tish uchun ${n(3.6)} ga bo‘ling.`, `1 м/с = ${n(3.6)} км/ч. Чтобы перейти от км/ч к м/с, раздели на ${n(3.6)}.`, `1 m/s = ${n(3.6)} km/h. To go from km/h to m/s, divide by ${n(3.6)}.`)), TN((n) => S(`${kmh} : ${n(3.6)}`))],
      explain: TN((n) => worked(`v = ${kmh} km/h`, `v = km/h : ${n(3.6)}`, `v = ${kmh} : ${n(3.6)} = ${ms} m/s`)),
    });
  },
  // m/s -> km/h
  (r) => {
    const ms = pick(r, [5, 10, 15, 20, 25]), kmh = (ms * 18) / 5;
    return Q(r, {
      prompt: T(`Sportchi ${ms} m/s tezlikda yuguryapti. Bu necha km/soat?`, `Спортсмен бежит со скоростью ${ms} м/с. Сколько это в км/ч?`, `A runner moves at ${ms} m/s. How many kilometres per hour is that?`),
      visual: { t: 'formula', main: `${ms} m/s = ? km/h`, sub: '1 m/s = 3.6 km/h', tone: 'amber' },
      answer: kmh,
      wrong: [ms * 3, ms * 4, kmh + 6],
      hints: [TN((n) => T(`m/s dan km/soat ga o‘tish uchun ${n(3.6)} ga ko‘paytiring.`, `Чтобы перейти от м/с к км/ч, умножь на ${n(3.6)}.`, `To go from m/s to km/h, multiply by ${n(3.6)}.`)), TN((n) => S(`${ms} · ${n(3.6)}`))],
      explain: TN((n) => worked(`v = ${ms} m/s`, `v = m/s · ${n(3.6)}`, `v = ${ms} · ${n(3.6)} = ${kmh} km/h`)),
    });
  },
  // average speed over two stages
  (r) => {
    let v1 = 60, v2 = 90, t1 = 2, t2 = 1, avg = 70;
    for (let k = 0; k < 200; k++) {
      const a = int(r, 1, 3), b = int(r, 1, 3), x = pick(r, [30, 40, 50, 60, 80]), y = pick(r, [30, 40, 50, 60, 80, 100]), m = (x * a + y * b) / (a + b);
      if (Number.isInteger(m) && x !== y) { v1 = x; v2 = y; t1 = a; t2 = b; avg = m; break; }
    }
    const s1 = v1 * t1, s2 = v2 * t2;
    return Q(r, {
      prompt: T(`Avtobus ${t1} soat ${v1} km/soat tezlikda, keyin ${t2} soat ${v2} km/soat tezlikda yurdi. Butun yo‘l bo‘yicha o‘rtacha tezligi necha km/soat?`, `Автобус ехал ${t1} ч со скоростью ${v1} км/ч, затем ${t2} ч со скоростью ${v2} км/ч. Какова его средняя скорость на всём пути в км/ч?`, `A bus drives for ${t1} h at ${v1} km/h and then for ${t2} h at ${v2} km/h. What is its average speed for the whole trip, in km/h?`),
      visual: { t: 'bar', parts: [{ w: t1, label: `${s1} km`, tone: 'amber' }, { w: t2, label: `${s2} km`, tone: 'teal' }], total: `${t1 + t2} h` },
      answer: avg,
      wrong: [(v1 + v2) / 2, s1 + s2, avg + 10],
      hints: [T('O‘rtacha tezlik = butun yo‘l : butun vaqt. Tezliklarning o‘rtachasi emas!', 'Средняя скорость = весь путь : всё время. Это не среднее двух скоростей!', 'Average speed = all the distance ÷ all the time. It is not the average of the two speeds!'), S(`(${v1} · ${t1} + ${v2} · ${t2}) : (${t1} + ${t2})`)],
      explain: worked(`v₁ = ${v1} km/h, t₁ = ${t1} h, v₂ = ${v2} km/h, t₂ = ${t2} h`, 'v = (s₁ + s₂) : (t₁ + t₂)', `s = ${s1} + ${s2} = ${s1 + s2} km,  t = ${t1 + t2} h,  v = ${s1 + s2} : ${t1 + t2} = ${avg} km/h`),
    });
  },
  // two vehicles approach each other
  (r) => {
    const v1 = pick(r, [40, 50, 60, 70, 80]), v2 = pick(r, [30, 40, 50, 60, 90]), t = int(r, 2, 5), d = (v1 + v2) * t;
    return Q(r, {
      prompt: T(`Ikki shahar orasi ${d} km. Ikki mashina bir vaqtda bir-biriga qarab ${v1} km/soat va ${v2} km/soat tezlikda yo‘lga chiqdi. Necha soatdan keyin uchrashadi?`, `Расстояние между двумя городами ${d} км. Две машины выехали одновременно навстречу друг другу со скоростями ${v1} км/ч и ${v2} км/ч. Через сколько часов они встретятся?`, `Two towns are ${d} km apart. Two cars leave at the same moment and drive towards each other at ${v1} km/h and ${v2} km/h. After how many hours do they meet?`),
      visual: { t: 'bar', parts: [{ w: v1, label: `${v1} km/h`, tone: 'amber' }, { w: v2, label: `${v2} km/h`, tone: 'teal' }], total: `${d} km` },
      answer: t,
      wrong: [t + 1, t * 2, v1 + v2],
      hints: [T('Ular bir-biriga yaqinlashadi: yaqinlashish tezligi tezliklar yig‘indisiga teng.', 'Они сближаются: скорость сближения равна сумме скоростей.', 'They close in on each other: the closing speed is the sum of the speeds.'), S(`t = ${d} : (${v1} + ${v2})`)],
      explain: worked(`s = ${d} km, v₁ = ${v1} km/h, v₂ = ${v2} km/h`, 'v = v₁ + v₂,  t = s : v', `v = ${v1} + ${v2} = ${v1 + v2} km/h,  t = ${d} : ${v1 + v2} = ${t} h`),
    });
  },
  // read the speed off a distance-time graph
  (r) => {
    const v = pick(r, [20, 30, 40, 60, 80]), t = int(r, 2, 5), s = v * t;
    return Q(r, {
      prompt: T('Grafik poyezd yo‘lining vaqtga bog‘liqligini ko‘rsatadi. Belgilangan nuqtadan tezlikni toping (km/soat).', 'График показывает, как путь поезда зависит от времени. По отмеченной точке найди скорость (км/ч).', 'The graph shows how far a train has gone over time. Use the marked point to find its speed, in km/h.'),
      visual: { t: 'chart', pts: [[0, 0], [t + 1, v * (t + 1)]], xMax: t + 1, yMax: v * (t + 1), xStep: 1, yStep: v, xName: 't, h', yName: 's, km', marks: [{ x: t, y: s, lx: `${t} h`, ly: `${s} km` }] },
      answer: v,
      wrong: [s + t, s - t, v + 10],
      hints: [S('v = s : t'), S(`v = ${s} : ${t}`)],
      explain: worked(`t = ${t} h, s = ${s} km (from the graph)`, 'v = s : t', `v = ${s} : ${t} = ${v} km/h`),
    });
  },
  // read a distance off the same kind of graph
  (r) => {
    const v = pick(r, [20, 30, 40, 50, 60]), t = int(r, 3, 6), s = v * t;
    return Q(r, {
      prompt: T('Grafikdagi chiziq tekis harakatni bildiradi. Poyezd t soatda qancha yo‘l bosadi? Savol belgisi o‘rniga qo‘yiladigan sonni toping (km).', 'Прямая на графике — равномерное движение. Какой путь пройдёт поезд за указанное время? Найди число вместо знака вопроса (км).', 'The straight line is steady motion. How far has the train gone at the time marked? Find the number in place of the question mark, in km.'),
      visual: { t: 'chart', pts: [[0, 0], [t + 1, v * (t + 1)]], xMax: t + 1, yMax: v * (t + 1), xStep: 1, yStep: v, xName: 't, h', yName: 's, km', marks: [{ x: 1, y: v, lx: '1 h', ly: `${v} km` }, { x: t, y: s, lx: `${t} h`, ly: '?' }] },
      answer: s,
      wrong: [v + t, s + v, s - v],
      hints: [T('Birinchi nuqtadan tezlikni toping: 1 soatda necha km?', 'По первой точке найди скорость: сколько км за 1 час?', 'Find the speed from the first point: how many km in 1 hour?'), S('s = v · t')],
      explain: worked(`v = ${v} km/h (from 1 h), t = ${t} h`, 's = v · t', `s = ${v} · ${t} = ${s} km`),
    });
  },
];

const densityMore: Gen[] = [
  // volume from mass and density
  (r) => {
    const [name, rho] = pick(r, [[T('alyuminiy', 'алюминиевая', 'aluminium'), 2700], [T('temir', 'железная', 'iron'), 7800], [T('mis', 'медная', 'copper'), 8900]] as const);
    const V = int(r, 2, 6), m = rho * V;
    return Q(r, {
      prompt: T(`${name.uz[0].toUpperCase()}${name.uz.slice(1)} to‘singa massasi ${m} kg, zichligi ${rho} kg/m³. Uning hajmi necha m³?`, `Масса ${name.ru} балки ${m} кг, плотность ${rho} кг/м³. Каков её объём в м³?`, `A ${name.en} beam has a mass of ${m} kg and its density is ${rho} kg/m³. What is its volume in m³?`),
      visual: { t: 'block', m: `m = ${m} kg`, v: 'V = ?' },
      answer: V,
      wrong: [m - rho, V + 1, m * rho],
      hints: [S('V = m : ρ'), S(`V = ${m} : ${rho}`)],
      explain: worked(`m = ${m} kg, ρ = ${rho} kg/m³`, 'V = m : ρ', `V = ${m} : ${rho} = ${V} m³`),
    });
  },
  // g/cm³ -> kg/m³
  (r) => {
    const [name, g] = pick(r, [[T('Muz', 'Лёд', 'Ice'), 0.9], [T('Alyuminiy', 'Алюминий', 'Aluminium'), 2.7], [T('Temir', 'Железо', 'Iron'), 7.8], [T('Mis', 'Медь', 'Copper'), 8.9], [T('Qo‘rg‘oshin', 'Свинец', 'Lead'), 11.3]] as const);
    const rho = Math.round(g * 1000);
    return Q(r, {
      prompt: TN((n) => T(`${name.uz} zichligi ${n(g)} g/sm³. Bu necha kg/m³?`, `Плотность: ${name.ru.toLowerCase()} — ${n(g)} г/см³. Сколько это в кг/м³?`, `${name.en} has a density of ${n(g)} g/cm³. How many kg/m³ is that?`)),
      visual: { t: 'formula', main: '1 g/cm³ = 1000 kg/m³', sub: '× 1000', tone: 'amber' },
      answer: rho,
      wrong: [Math.round(g * 100), Math.round(g * 10), Math.round(g * 10000)],
      hints: [S('1 g/cm³ = 1000 kg/m³'), TN((n) => S(`${n(g)} · 1000`))],
      explain: TN((n) => worked(`ρ = ${n(g)} g/cm³`, '1 g/cm³ = 1000 kg/m³', `ρ = ${n(g)} · 1000 = ${rho} kg/m³`)),
    });
  },
  // density from a mass-volume graph
  (r) => {
    const rho = pick(r, [500, 1000, 2000, 2500]), V = int(r, 2, 4), m = rho * V;
    return Q(r, {
      prompt: T('Grafik bir xil moddadan yasalgan jismlarning massasi hajmga qanday bog‘liqligini ko‘rsatadi. Modda zichligi necha kg/m³?', 'График показывает, как масса тел из одного вещества зависит от объёма. Какова плотность вещества в кг/м³?', 'The graph shows how the mass of pieces of one material depends on volume. What is the density of the material, in kg/m³?'),
      visual: { t: 'chart', pts: [[0, 0], [5, rho * 5]], xMax: 5, yMax: rho * 5, xStep: 1, yStep: rho, xName: 'V, m³', yName: 'm, kg', marks: [{ x: V, y: m, lx: `${V} m³`, ly: `${m} kg` }] },
      answer: rho,
      wrong: [m * V, m + V, rho * 2],
      hints: [S('ρ = m : V'), S(`ρ = ${m} : ${V}`)],
      explain: worked(`m = ${m} kg, V = ${V} m³ (from the graph)`, 'ρ = m : V', `ρ = ${m} : ${V} = ${rho} kg/m³`),
    });
  },
  // how much of a floating block is under water
  (r) => {
    const rho = pick(r, [200, 400, 500, 600, 700, 800, 900]);
    const right = fr(rho, 1000), others = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => fr(k * 100, 1000)).filter((f) => f !== right);
    const wrong = [fr(1000 - rho, 1000), ...others.filter((f) => f !== fr(1000 - rho, 1000)).sort(() => r() - 0.5)].slice(0, 3);
    return Q(r, {
      prompt: T(`Yog‘och brusning zichligi ${rho} kg/m³. U suvda (1000 kg/m³) suzadi. Hajmining qaysi qismi suv ostida?`, `Плотность деревянного бруска ${rho} кг/м³. Он плавает в воде (1000 кг/м³). Какая часть его объёма под водой?`, `A wooden block has a density of ${rho} kg/m³ and floats in water (1000 kg/m³). What fraction of its volume is under the water?`),
      visual: { t: 'float', rho },
      answer: S(right),
      wrong: wrong.map(S),
      hints: [T('Suv ostidagi qism = jism zichligi : suv zichligi.', 'Погружённая часть = плотность тела : плотность воды.', 'Fraction under water = density of the block ÷ density of water.'), S(`${rho} : 1000`)],
      explain: worked(`ρ₁ = ${rho} kg/m³ (block), ρ₂ = 1000 kg/m³ (water)`, 'V₁ : V = ρ₁ : ρ₂', `${rho} : 1000 = ${right}`),
    });
  },
];

const pressureMore: Gen[] = [
  // weight of a body
  (r) => {
    const m = pick(r, [20, 40, 45, 60, 75, 80]), F = m * 10;
    return Q(r, {
      prompt: T(`Massasi ${m} kg bo‘lgan quti polda turibdi. U polga qanday kuch bilan bosadi (N)? g = 10 N/kg deb oling.`, `Ящик массой ${m} кг стоит на полу. С какой силой он давит на пол (в Н)? Возьми g = 10 Н/кг.`, `A box of mass ${m} kg stands on the floor. With what force does it press on the floor, in N? Take g = 10 N/kg.`),
      visual: { t: 'press', force: 'F = ?', area: 'S', wide: true },
      answer: F,
      wrong: [m, m + 10, F * 10],
      hints: [S('F = m · g'), S(`F = ${m} · 10`)],
      explain: worked(`m = ${m} kg, g = 10 N/kg`, 'F = m · g', `F = ${m} · 10 = ${F} N`),
    });
  },
  // pressure of a person standing: weight first, then pressure
  (r) => {
    const [m, A] = pick(r, [[40, 0.02], [50, 0.04], [60, 0.05], [80, 0.08], [60, 0.03], [50, 0.05]] as const);
    const F = m * 10, p = Math.round(F / A);
    return Q(r, {
      prompt: TN((n) => T(`Massasi ${m} kg bo‘lgan o‘quvchi ikkala oyoqda turibdi. Poshnalar yuzasi jami ${n(A)} m². U polga qanday bosim beradi (Pa)? g = 10 N/kg.`, `Ученик массой ${m} кг стоит на двух ногах. Общая площадь подошв ${n(A)} м². Какое давление он оказывает на пол (в Па)? g = 10 Н/кг.`, `A student of mass ${m} kg stands on both feet. The soles have a total area of ${n(A)} m². What pressure does the student exert on the floor, in Pa? Take g = 10 N/kg.`)),
      visual: { t: 'press', force: 'F = m · g', area: TN((n) => S(`S = ${n(A)} m²`)), wide: A >= 0.05 },
      answer: p,
      wrong: [Math.round(m / A), Math.round(F * A), p * 10],
      hints: [T('Avval og‘irlik kuchi: F = m · g. Keyin p = F : S.', 'Сначала сила: F = m · g. Потом p = F : S.', 'First the force: F = m · g. Then p = F ÷ S.'), TN((n) => S(`F = ${m} · 10 = ${F}, p = ${F} : ${n(A)}`))],
      explain: TN((n) => worked(`m = ${m} kg, S = ${n(A)} m², g = 10 N/kg`, 'F = m · g,  p = F : S', `F = ${m} · 10 = ${F} N,  p = ${F} : ${n(A)} = ${p} Pa`)),
    });
  },
  // liquid pressure at a depth
  (r) => {
    const h = pick(r, [2, 3, 5, 8, 10, 15, 20]), p = 10 * h;
    return Q(r, {
      prompt: T(`G‘avvos chuchuk suv yuzasidan ${h} m chuqurlikda. Suvning unga bosimi necha kPa? (ρ = 1000 kg/m³, g = 10 N/kg)`, `Водолаз находится на глубине ${h} м в пресной воде. Каково давление воды на него в кПа? (ρ = 1000 кг/м³, g = 10 Н/кг)`, `A diver is ${h} m under the surface of fresh water. What is the water pressure on the diver, in kPa? (ρ = 1000 kg/m³, g = 10 N/kg)`),
      visual: { t: 'formula', main: 'p = ρ · g · h', sub: `h = ${h} m`, tone: 'amber' },
      answer: p,
      wrong: [h, p * 10, p * 1000],
      hints: [S('p = ρ · g · h'), S(`p = 1000 · 10 · ${h}  (Pa)`)],
      explain: worked(`ρ = 1000 kg/m³, g = 10 N/kg, h = ${h} m`, 'p = ρ · g · h', `p = 1000 · 10 · ${h} = ${p * 1000} Pa = ${p} kPa`),
    });
  },
  // depth from pressure
  (r) => {
    const h = pick(r, [3, 4, 5, 6, 8, 12]), p = 10 * h;
    return Q(r, {
      prompt: T(`Basseyn tubida suv bosimi ${p} kPa. Basseyn necha metr chuqur? (ρ = 1000 kg/m³, g = 10 N/kg)`, `На дне бассейна давление воды ${p} кПа. Какова глубина бассейна в метрах? (ρ = 1000 кг/м³, g = 10 Н/кг)`, `At the bottom of a pool the water pressure is ${p} kPa. How deep is the pool, in metres? (ρ = 1000 kg/m³, g = 10 N/kg)`),
      visual: { t: 'formula', main: 'p = ρ · g · h', sub: 'h = ?', tone: 'amber' },
      answer: h,
      wrong: [p, h + 2, p / 2],
      hints: [S('h = p : (ρ · g)'), S(`h = ${p * 1000} : (1000 · 10)`)],
      explain: worked(`p = ${p} kPa = ${p * 1000} Pa, ρ = 1000 kg/m³, g = 10 N/kg`, 'h = p : (ρ · g)', `h = ${p * 1000} : (1000 · 10) = ${h} m`),
    });
  },
];

const ohmMore: Gen[] = [
  // series: current
  (r) => {
    let R1 = 2, R2 = 4;
    do { R1 = int(r, 1, 10); R2 = int(r, 1, 10); } while (R1 === R2);
    const I = int(r, 1, 4), U = I * (R1 + R2);
    return Q(r, {
      prompt: T(`${U} V li batareyaga ketma-ket ikkita qarshilik ulangan: ${R1} Ω va ${R2} Ω. Zanjirdagi tok kuchi necha A?`, `К батарее ${U} В последовательно подключены два резистора: ${R1} Ом и ${R2} Ом. Какова сила тока в цепи в А?`, `A ${U} V battery is connected to two resistors in series: ${R1} Ω and ${R2} Ω. What is the current in the circuit, in A?`),
      visual: { t: 'series', u: `${U} V`, r1: `${R1} Ω`, r2: `${R2} Ω`, i: 'I = ?' },
      answer: I,
      wrong: [U - R1 - R2, I + 1, U * (R1 + R2)],
      hints: [T('Ketma-ket ulanishda qarshiliklar qo‘shiladi: R = R₁ + R₂.', 'При последовательном соединении сопротивления складываются: R = R₁ + R₂.', 'In series the resistances add: R = R₁ + R₂.'), S(`I = ${U} : (${R1} + ${R2})`)],
      explain: worked(`U = ${U} V, R₁ = ${R1} Ω, R₂ = ${R2} Ω`, 'R = R₁ + R₂,  I = U : R', `R = ${R1} + ${R2} = ${R1 + R2} Ω,  I = ${U} : ${R1 + R2} = ${I} A`),
    });
  },
  // series: voltage across one resistor
  (r) => {
    let R1 = 2, R2 = 4;
    do { R1 = int(r, 1, 10); R2 = int(r, 1, 10); } while (R1 === R2);
    const I = int(r, 1, 4), U = I * (R1 + R2), U2 = I * R2;
    return Q(r, {
      prompt: T(`${U} V li batareyaga ketma-ket ${R1} Ω va ${R2} Ω qarshiliklar ulangan. ${R2} Ω li qarshilikdagi kuchlanish necha V?`, `К батарее ${U} В последовательно подключены резисторы ${R1} Ом и ${R2} Ом. Каково напряжение на резисторе ${R2} Ом в В?`, `A ${U} V battery is connected to resistors of ${R1} Ω and ${R2} Ω in series. What is the voltage across the ${R2} Ω resistor, in V?`),
      visual: { t: 'series', u: `${U} V`, r1: `${R1} Ω`, r2: `${R2} Ω`, i: 'U₂ = ?' },
      answer: U2,
      wrong: [I * R1, U, R2],
      hints: [T('Avval tok kuchini toping: I = U : (R₁ + R₂). Keyin U₂ = I · R₂.', 'Сначала найди ток: I = U : (R₁ + R₂). Потом U₂ = I · R₂.', 'First find the current: I = U ÷ (R₁ + R₂). Then U₂ = I · R₂.'), S(`I = ${U} : ${R1 + R2} = ${I}`)],
      explain: worked(`U = ${U} V, R₁ = ${R1} Ω, R₂ = ${R2} Ω`, 'I = U : (R₁ + R₂),  U₂ = I · R₂', `I = ${U} : ${R1 + R2} = ${I} A,  U₂ = ${I} · ${R2} = ${U2} V`),
    });
  },
  // resistance from an I-U graph
  (r) => {
    const R = pick(r, [2, 4, 5, 10]), I0 = int(r, 2, 4), U = R * I0;
    return Q(r, {
      prompt: T('Grafik o‘tkazgichdagi tok kuchining kuchlanishga bog‘liqligini ko‘rsatadi. O‘tkazgich qarshiligi necha Ω?', 'График показывает, как сила тока в проводнике зависит от напряжения. Каково сопротивление проводника в Ом?', 'The graph shows how the current in a wire depends on the voltage. What is the resistance of the wire, in Ω?'),
      visual: { t: 'chart', pts: [[0, 0], [R * 5, 5]], xMax: R * 5, yMax: 5, xStep: R, yStep: 1, xName: 'U, V', yName: 'I, A', marks: [{ x: U, y: I0, lx: `${U} V`, ly: `${I0} A` }] },
      answer: R,
      wrong: [U * I0, I0, R + 1],
      hints: [S('R = U : I'), S(`R = ${U} : ${I0}`)],
      explain: worked(`U = ${U} V, I = ${I0} A (from the graph)`, 'R = U : I', `R = ${U} : ${I0} = ${R} Ω`),
    });
  },
  // what happens when resistance changes
  (r) => {
    const k = pick(r, [2, 3, 4, 5]);
    return Q(r, {
      prompt: T(`Kuchlanish o‘zgarmadi, qarshilik ${k} marta oshdi. Tok kuchi qanday o‘zgaradi?`, `Напряжение не изменилось, а сопротивление выросло в ${k} раз(а). Что произойдёт с силой тока?`, `The voltage stays the same and the resistance becomes ${k} times bigger. What happens to the current?`),
      visual: { t: 'circuit', u: 'U', r: `R · ${k}`, i: 'I = ?' },
      answer: T(`${k} marta kamayadi`, `Уменьшится в ${k} раз(а)`, `It becomes ${k} times smaller`),
      wrong: [T(`${k} marta oshadi`, `Увеличится в ${k} раз(а)`, `It becomes ${k} times bigger`), T('O‘zgarmaydi', 'Не изменится', 'It stays the same'), T('Nolga teng bo‘ladi', 'Станет равна нулю', 'It becomes zero')],
      hints: [S('I = U : R'), T('Bo‘linuvchi o‘zgarmaydi, bo‘luvchi oshadi.', 'Делимое то же, делитель больше.', 'The top stays the same, the bottom gets bigger.')],
      explain: T(`I = U : R. R ${k} marta katta bo‘lsa, I ${k} marta kichik.`, `I = U : R. Если R больше в ${k} раз(а), то I меньше в ${k} раз(а).`, `I = U ÷ R. If R is ${k} times bigger, I is ${k} times smaller.`),
    });
  },
];

const BOOK = (ch: string) => T(`Fizika 7-sinf, ${ch}-bob`, `Физика, 7 класс, глава ${ch}`, `Physics, Grade 7, chapter ${ch}`);

export const g7PhysicsTopics: Topic[] = [
  {
    id: 'f7-speed', grade: 7, subject: 'physics7', emoji: '🚗', book: BOOK('I'),
    title: T('Tezlik va yo‘l', 'Скорость и путь', 'Speed and distance'),
    keywords: ['tezlik', 'harakat', 'yo‘l', 'скорост', 'движен', 'путь', 'speed', 'velocity', 'distance'],
    cards: [
      {
        text: T(
          '<b>Tezlik</b> — jism 1 soatda (yoki 1 sekundda) qancha yo‘l bosishi.\nPiyoda ≈ 5 km/soat, velosiped ≈ 15 km/soat, mashina ≈ 60 km/soat, yo‘lovchi samolyoti ≈ 800 km/soat.',
          '<b>Скорость</b> — какой путь тело проходит за 1 час (или 1 секунду).\nПешеход ≈ 5 км/ч, велосипед ≈ 15 км/ч, машина ≈ 60 км/ч, пассажирский самолёт ≈ 800 км/ч.',
          '<b>Speed</b> is how far something goes in 1 hour (or 1 second).\nWalking ≈ 5 km/h, a bicycle ≈ 15 km/h, a car ≈ 60 km/h, an airliner ≈ 800 km/h.',
        ),
        visual: { t: 'road', s: '60 km', v: '60 km/h', time: '1 h' },
      },
      {
        text: T(
          'Bitta formula, uch shakl:\n<b>s = v · t</b> — yo‘l.\n<b>v = s : t</b> — tezlik.\n<b>t = s : v</b> — vaqt.\nTekis harakatda tezlik o‘zgarmaydi.',
          'Одна формула, три вида:\n<b>s = v · t</b> — путь.\n<b>v = s : t</b> — скорость.\n<b>t = s : v</b> — время.\nПри равномерном движении скорость не меняется.',
          'One formula, three forms:\n<b>s = v · t</b> — distance.\n<b>v = s ÷ t</b> — speed.\n<b>t = s ÷ v</b> — time.\nIn steady motion the speed does not change.',
        ),
        visual: { t: 'formula', main: 's = v · t', tone: 'amber' },
      },
      {
        text: T(
          'Masalani darslikdagidek yechamiz:\n<b>Berilgan:</b> v = 60 km/soat, t = 2 soat\n<b>Formula:</b> s = v · t\n<b>Hisoblash:</b> s = 60 · 2 = 120 km',
          'Решаем как в учебнике:\n<b>Дано:</b> v = 60 км/ч, t = 2 ч\n<b>Формула:</b> s = v · t\n<b>Решение:</b> s = 60 · 2 = 120 км',
          'Solve it the textbook way:\n<b>Given:</b> v = 60 km/h, t = 2 h\n<b>Formula:</b> s = v · t\n<b>Working:</b> s = 60 · 2 = 120 km',
        ),
        visual: { t: 'road', s: '120 km', v: '60 km/h', time: '2 h' },
      },
      {
        text: T(
          'Tekis harakat grafigi — to‘g‘ri chiziq.\n1 soatda poyezd 60 km, 2 soatda 120 km, 3 soatda 180 km yuradi.\n<b>Chiziq qanchalik tik bo‘lsa, tezlik shunchalik katta.</b>\nIstalgan nuqtadan: v = s : t = 180 : 3 = 60 km/soat.',
          'График равномерного движения — прямая линия.\nЗа 1 час поезд проходит 60 км, за 2 часа 120 км, за 3 часа 180 км.\n<b>Чем круче линия, тем больше скорость.</b>\nПо любой точке: v = s : t = 180 : 3 = 60 км/ч.',
          'The graph of steady motion is a straight line.\nThe train goes 60 km in 1 h, 120 km in 2 h, 180 km in 3 h.\n<b>The steeper the line, the greater the speed.</b>\nFrom any point: v = s ÷ t = 180 ÷ 3 = 60 km/h.',
        ),
        visual: { t: 'chart', pts: [[0, 0], [4, 240]], xMax: 4, yMax: 240, xStep: 1, yStep: 60, xName: 't, h', yName: 's, km', marks: [{ x: 3, y: 180, lx: '3 h', ly: '180 km' }] },
      },
      {
        text: TN((n) => T(
          `Birliklar: 1 m/s = ${n(3.6)} km/soat.\nkm/soat dan m/s ga o‘tish uchun ${n(3.6)} ga <b>bo‘ling</b>, orqaga o‘tish uchun <b>ko‘paytiring</b>.\nNega? 1 km = 1000 m, 1 soat = 3600 s, 1000 : 3600 = 1 : ${n(3.6)}.\nMisol: 72 km/soat = 72 : ${n(3.6)} = 20 m/s.`,
          `Единицы: 1 м/с = ${n(3.6)} км/ч.\nЧтобы перейти от км/ч к м/с, <b>раздели</b> на ${n(3.6)}, обратно — <b>умножь</b>.\nПочему? 1 км = 1000 м, 1 ч = 3600 с, 1000 : 3600 = 1 : ${n(3.6)}.\nПример: 72 км/ч = 72 : ${n(3.6)} = 20 м/с.`,
          `Units: 1 m/s = ${n(3.6)} km/h.\nTo go from km/h to m/s, <b>divide</b> by ${n(3.6)}; to go back, <b>multiply</b>.\nWhy? 1 km = 1000 m and 1 h = 3600 s, so 1000 ÷ 3600 = 1 ÷ ${n(3.6)}.\nExample: 72 km/h = 72 ÷ ${n(3.6)} = 20 m/s.`,
        )),
        visual: { t: 'formula', main: '72 km/h = 20 m/s', sub: '72 : 3.6', tone: 'amber' },
      },
      {
        text: T(
          '<b>O‘rtacha tezlik</b> = butun yo‘l : butun vaqt. Bu tezliklarning o‘rtachasi emas.\n<b>Berilgan:</b> 1 soat 40 km/soat, 2 soat 70 km/soat\n<b>Formula:</b> v = (s₁ + s₂) : (t₁ + t₂)\n<b>Hisoblash:</b> s = 40 + 140 = 180 km, t = 3 soat, v = 180 : 3 = 60 km/soat.\n40 va 70 ning o‘rtachasi 55 bo‘lardi — xato: avtobus 70 da ko‘proq vaqt yurdi.',
          '<b>Средняя скорость</b> = весь путь : всё время. Это не среднее двух скоростей.\n<b>Дано:</b> 1 ч со скоростью 40 км/ч, 2 ч со скоростью 70 км/ч\n<b>Формула:</b> v = (s₁ + s₂) : (t₁ + t₂)\n<b>Решение:</b> s = 40 + 140 = 180 км, t = 3 ч, v = 180 : 3 = 60 км/ч.\nСреднее от 40 и 70 дало бы 55 — это ошибка: на скорости 70 автобус ехал дольше.',
          '<b>Average speed</b> = all the distance ÷ all the time. It is not the average of the speeds.\n<b>Given:</b> 1 h at 40 km/h, then 2 h at 70 km/h\n<b>Formula:</b> v = (s₁ + s₂) ÷ (t₁ + t₂)\n<b>Working:</b> s = 40 + 140 = 180 km, t = 3 h, v = 180 ÷ 3 = 60 km/h.\nAveraging 40 and 70 gives 55, which is wrong: the bus spends longer at 70.',
        ),
        visual: { t: 'bar', parts: [{ w: 1, label: '40 km', tone: 'amber' }, { w: 2, label: '140 km', tone: 'teal' }], total: '3 h' },
      },
    ],
    gens: [...speed, ...speedMore],
  },
  {
    id: 'f7-density', grade: 7, subject: 'physics7', emoji: '🧊', book: BOOK('II'),
    title: T('Massa va zichlik', 'Масса и плотность', 'Mass and density'),
    keywords: ['zichlik', 'massa', 'hajm', 'плотност', 'масса', 'объём', 'density', 'mass', 'volume'],
    cards: [
      {
        text: T(
          '<b>Zichlik</b> — 1 m³ moddaning massasi: <b>ρ = m : V</b>.\nBundan: m = ρ · V va V = m : ρ.\nZichliklar (kg/m³): qarag‘ay 500, muz 900, suv 1000, alyuminiy 2700, temir 7800, mis 8900, oltin 19 300.',
          '<b>Плотность</b> — масса 1 м³ вещества: <b>ρ = m : V</b>.\nОтсюда: m = ρ · V и V = m : ρ.\nПлотности (кг/м³): сосна 500, лёд 900, вода 1000, алюминий 2700, железо 7800, медь 8900, золото 19 300.',
          '<b>Density</b> is the mass of 1 m³ of a material: <b>ρ = m ÷ V</b>.\nSo m = ρ · V and V = m ÷ ρ.\nDensities (kg/m³): pine 500, ice 900, water 1000, aluminium 2700, iron 7800, copper 8900, gold 19 300.',
        ),
        visual: { t: 'formula', main: 'ρ = m : V', tone: 'amber' },
      },
      {
        text: T(
          'Jism suvdan <b>kam zich</b> bo‘lsa suzadi, <b>ko‘proq zich</b> bo‘lsa cho‘kadi.\nMuz 900 kg/m³, suv 1000 kg/m³: muz suzadi. Suv ostidagi qismi 900 : 1000 = 9/10, faqat 1/10 qismi suv ustida.',
          'Тело плавает, если оно <b>менее плотное</b>, чем жидкость, и тонет, если <b>более плотное</b>.\nЛёд 900 кг/м³, вода 1000 кг/м³: лёд плавает. Под водой 900 : 1000 = 9/10 его объёма, над водой только 1/10.',
          'A body floats if it is <b>less dense</b> than the liquid and sinks if it is <b>denser</b>.\nIce is 900 kg/m³, water 1000 kg/m³: ice floats. 900 ÷ 1000 = 9/10 of it is under water and only 1/10 sticks out.',
        ),
        visual: { t: 'float', rho: 900 },
      },
      {
        text: T(
          'Bir xil moddadan yasalgan jismlarda massa hajmga mutanosib.\nm ning V ga grafigi — koordinata boshidan o‘tuvchi to‘g‘ri chiziq. Uning tikligi — zichlik.\nBitta nuqtadan: ρ = m : V = 8100 : 3 = 2700 kg/m³ (alyuminiy).',
          'У тел из одного вещества масса пропорциональна объёму.\nГрафик m от V — прямая через начало координат. Её крутизна — это плотность.\nПо одной точке: ρ = m : V = 8100 : 3 = 2700 кг/м³ (алюминий).',
          'For pieces of one material, mass is proportional to volume.\nThe graph of m against V is a straight line through the origin, and its steepness is the density.\nFrom one point: ρ = m ÷ V = 8100 ÷ 3 = 2700 kg/m³ (aluminium).',
        ),
        visual: { t: 'chart', pts: [[0, 0], [4, 10800]], xMax: 4, yMax: 10800, xStep: 1, yStep: 2700, xName: 'V, m³', yName: 'm, kg', marks: [{ x: 3, y: 8100, lx: '3 m³', ly: '8100 kg' }] },
      },
      {
        text: TN((n) => T(
          `Jadvallarda zichlik ko‘pincha g/sm³ da beriladi.\n<b>1 g/sm³ = 1000 kg/m³</b>, ya’ni 1000 ga ko‘paytiriladi.\nTemir: ${n(7.8)} g/sm³ = 7800 kg/m³. Suv: 1 g/sm³ = 1000 kg/m³.`,
          `В таблицах плотность часто дают в г/см³.\n<b>1 г/см³ = 1000 кг/м³</b>, то есть умножаем на 1000.\nЖелезо: ${n(7.8)} г/см³ = 7800 кг/м³. Вода: 1 г/см³ = 1000 кг/м³.`,
          `Tables often give density in g/cm³.\n<b>1 g/cm³ = 1000 kg/m³</b>, so multiply by 1000.\nIron: ${n(7.8)} g/cm³ = 7800 kg/m³. Water: 1 g/cm³ = 1000 kg/m³.`,
        )),
        visual: { t: 'formula', main: TN((n) => S(`${n(7.8)} g/cm³ = 7800 kg/m³`)), sub: '× 1000', tone: 'amber' },
      },
      {
        text: T(
          'Masala: hajmi 3 m³ bo‘lgan po‘lat to‘singa massasi qancha? Po‘lat zichligi 7800 kg/m³.\n<b>Berilgan:</b> ρ = 7800 kg/m³, V = 3 m³\n<b>Formula:</b> m = ρ · V\n<b>Hisoblash:</b> m = 7800 · 3 = 23 400 kg = 23,4 t',
          'Задача: какова масса стальной балки объёмом 3 м³? Плотность стали 7800 кг/м³.\n<b>Дано:</b> ρ = 7800 кг/м³, V = 3 м³\n<b>Формула:</b> m = ρ · V\n<b>Решение:</b> m = 7800 · 3 = 23 400 кг = 23,4 т',
          'Problem: what is the mass of a steel beam of volume 3 m³? Steel has a density of 7800 kg/m³.\n<b>Given:</b> ρ = 7800 kg/m³, V = 3 m³\n<b>Formula:</b> m = ρ · V\n<b>Working:</b> m = 7800 · 3 = 23 400 kg = 23.4 t',
        ),
        visual: { t: 'block', m: 'm = ?', v: 'V = 3 m³' },
      },
    ],
    gens: [...density, ...densityMore],
  },
  {
    id: 'f7-pressure', grade: 7, subject: 'physics7', emoji: '🎿', book: BOOK('II'),
    title: T('Bosim', 'Давление', 'Pressure'),
    keywords: ['bosim', 'kuch', 'paskal', 'давлен', 'паскаль', 'сила', 'pressure', 'pascal', 'force'],
    cards: [
      {
        text: T(
          'Nega chuqur qorda oyoq botadi, chang‘ida esa yo‘q?\nKuch bir xil, lekin chang‘ining <b>yuzasi katta</b>. Bosim kichrayadi.',
          'Почему в глубоком снегу нога проваливается, а на лыжах нет?\nСила та же, но <b>площадь</b> лыж <b>больше</b>. Давление меньше.',
          'Why do boots sink into deep snow, but skis do not?\nThe force is the same, but skis have a <b>bigger area</b>. The pressure is smaller.',
        ),
        visual: { t: 'press', force: 'F', area: 'S', wide: true },
      },
      {
        text: T(
          '<b>p = F : S</b>\nF — kuch (N), S — yuza (m²), p — bosim. Birligi paskal: 1 Pa = 1 N/m².\nPaskal juda kichik, shuning uchun kPa ham ishlatiladi: 1 kPa = 1000 Pa.\nO‘tkir pichoq yaxshi kesadi: yuzasi kichik, bosimi katta.',
          '<b>p = F : S</b>\nF — сила (Н), S — площадь (м²), p — давление. Единица — паскаль: 1 Па = 1 Н/м².\nПаскаль очень мал, поэтому используют и кПа: 1 кПа = 1000 Па.\nОстрый нож режет хорошо: площадь мала, давление велико.',
          '<b>p = F ÷ S</b>\nF is force (N), S is area (m²), p is pressure. The unit is the pascal: 1 Pa = 1 N/m².\nA pascal is tiny, so kPa is also used: 1 kPa = 1000 Pa.\nA sharp knife cuts well: small area, big pressure.',
        ),
        visual: { t: 'press', force: 'F', area: 'S' },
      },
      {
        text: TN((n) => T(
          `Jism tayanchga o‘z og‘irligi bilan bosadi: <b>F = m · g</b>, g ≈ 10 N/kg.\nMasala: massasi 60 kg o‘quvchi ikki oyoqda turibdi, poshnalar yuzasi ${n(0.04)} m². Bosim qancha?\n<b>Berilgan:</b> m = 60 kg, S = ${n(0.04)} m²\n<b>Formula:</b> F = m · g, p = F : S\n<b>Hisoblash:</b> F = 60 · 10 = 600 N, p = 600 : ${n(0.04)} = 15 000 Pa = 15 kPa`,
          `Тело давит на опору своим весом: <b>F = m · g</b>, g ≈ 10 Н/кг.\nЗадача: ученик массой 60 кг стоит на двух ногах, площадь подошв ${n(0.04)} м². Каково давление?\n<b>Дано:</b> m = 60 кг, S = ${n(0.04)} м²\n<b>Формула:</b> F = m · g, p = F : S\n<b>Решение:</b> F = 60 · 10 = 600 Н, p = 600 : ${n(0.04)} = 15 000 Па = 15 кПа`,
          `A body presses on its support with its weight: <b>F = m · g</b>, g ≈ 10 N/kg.\nProblem: a 60 kg student stands on both feet, soles ${n(0.04)} m² in total. What is the pressure?\n<b>Given:</b> m = 60 kg, S = ${n(0.04)} m²\n<b>Formula:</b> F = m · g, p = F ÷ S\n<b>Working:</b> F = 60 · 10 = 600 N, p = 600 ÷ ${n(0.04)} = 15 000 Pa = 15 kPa`,
        )),
        visual: { t: 'press', force: 'F = 600 N', area: TN((n) => S(`S = ${n(0.04)} m²`)), wide: true },
      },
      {
        text: T(
          'Suyuqlik tubiga va devorlariga bosadi. Chuqurroq — bosim kattaroq:\n<b>p = ρ · g · h</b>\nSuvda 10 m chuqurlikda: p = 1000 · 10 · 10 = 100 000 Pa = 100 kPa.\nBosim idish shakliga bog‘liq emas, faqat chuqurlik va zichlikka. Havo ham bosadi: atmosfera bosimi ≈ 100 kPa.',
          'Жидкость давит на дно и стенки. Чем глубже, тем больше давление:\n<b>p = ρ · g · h</b>\nВ воде на глубине 10 м: p = 1000 · 10 · 10 = 100 000 Па = 100 кПа.\nДавление не зависит от формы сосуда, только от глубины и плотности. Воздух тоже давит: атмосферное давление ≈ 100 кПа.',
          'A liquid presses on the bottom and the walls, and the deeper, the more:\n<b>p = ρ · g · h</b>\nIn water at 10 m: p = 1000 · 10 · 10 = 100 000 Pa = 100 kPa.\nThe shape of the vessel does not matter, only depth and density. Air presses too: atmospheric pressure is about 100 kPa.',
        ),
        visual: { t: 'formula', main: 'p = ρ · g · h', sub: 'water, h = 10 m: 100 kPa', tone: 'amber' },
      },
    ],
    gens: [...pressure, ...pressureMore],
  },
  {
    id: 'f7-ohm', grade: 7, subject: 'physics7', emoji: '💡', book: BOOK('IV'),
    title: T('Om qonuni', 'Закон Ома', 'Ohm’s law'),
    keywords: ['om', 'tok', 'kuchlanish', 'qarshilik', 'elektr', 'ток', 'напряжен', 'сопротивлен', 'ohm', 'current', 'voltage', 'resistance'],
    cards: [
      {
        text: T(
          'Elektr zanjirini suv quvuriga o‘xshating.\n<b>Kuchlanish (U)</b> — suvni itaruvchi kuch.\n<b>Tok kuchi (I)</b> — oqim.\n<b>Qarshilik (R)</b> — quvurning torligi.',
          'Представь цепь как водопровод.\n<b>Напряжение (U)</b> — то, что толкает воду.\n<b>Сила тока (I)</b> — поток.\n<b>Сопротивление (R)</b> — узость трубы.',
          'Think of a circuit as a water pipe.\n<b>Voltage (U)</b> is what pushes the water.\n<b>Current (I)</b> is the flow.\n<b>Resistance (R)</b> is how narrow the pipe is.',
        ),
        visual: { t: 'circuit', u: 'U', r: 'R', i: 'I' },
      },
      {
        text: T(
          '<b>Om qonuni: I = U : R</b>\nKuchlanish oshsa, tok oshadi. Qarshilik oshsa, tok kamayadi.\nBirliklar: U — volt (V), I — amper (A), R — om (Ω).\nU = 12 V, R = 4 Ω bo‘lsa: I = <b>3 A</b>.',
          '<b>Закон Ома: I = U : R</b>\nНапряжение больше — ток больше. Сопротивление больше — ток меньше.\nЕдиницы: U — вольт (В), I — ампер (А), R — ом (Ом).\nU = 12 В, R = 4 Ом: I = <b>3 А</b>.',
          '<b>Ohm’s law: I = U ÷ R</b>\nMore voltage, more current. More resistance, less current.\nUnits: U in volts (V), I in amperes (A), R in ohms (Ω).\nU = 12 V, R = 4 Ω: I = <b>3 A</b>.',
        ),
        visual: { t: 'circuit', u: '12 V', r: '4 Ω', i: 'I = 3 A' },
      },
      {
        text: T(
          'Tok kuchining kuchlanishga grafigi — koordinata boshidan o‘tuvchi to‘g‘ri chiziq: tok kuchlanishga mutanosib.\nChiziq qanchalik tik bo‘lsa, qarshilik shunchalik kichik.\nBitta nuqtadan: R = U : I = 12 : 3 = 4 Ω.',
          'График тока от напряжения — прямая через начало координат: ток пропорционален напряжению.\nЧем круче линия, тем меньше сопротивление.\nПо одной точке: R = U : I = 12 : 3 = 4 Ом.',
          'The graph of current against voltage is a straight line through the origin: current is proportional to voltage.\nThe steeper the line, the smaller the resistance.\nFrom one point: R = U ÷ I = 12 ÷ 3 = 4 Ω.',
        ),
        visual: { t: 'chart', pts: [[0, 0], [20, 5]], xMax: 20, yMax: 5, xStep: 4, yStep: 1, xName: 'U, V', yName: 'I, A', marks: [{ x: 12, y: 3, lx: '12 V', ly: '3 A' }] },
      },
      {
        text: T(
          'Ketma-ket ulanishda tok hamma joyda bir xil, qarshiliklar qo‘shiladi: <b>R = R₁ + R₂</b>.\n<b>Berilgan:</b> U = 12 V, R₁ = 2 Ω, R₂ = 4 Ω\n<b>Formula:</b> R = R₁ + R₂, I = U : R\n<b>Hisoblash:</b> R = 6 Ω, I = 12 : 6 = 2 A. Kuchlanishlar: U₁ = 2 · 2 = 4 V, U₂ = 2 · 4 = 8 V. Yig‘indisi 12 V.',
          'При последовательном соединении ток везде одинаков, а сопротивления складываются: <b>R = R₁ + R₂</b>.\n<b>Дано:</b> U = 12 В, R₁ = 2 Ом, R₂ = 4 Ом\n<b>Формула:</b> R = R₁ + R₂, I = U : R\n<b>Решение:</b> R = 6 Ом, I = 12 : 6 = 2 А. Напряжения: U₁ = 2 · 2 = 4 В, U₂ = 2 · 4 = 8 В. Вместе 12 В.',
          'In series the current is the same everywhere and the resistances add: <b>R = R₁ + R₂</b>.\n<b>Given:</b> U = 12 V, R₁ = 2 Ω, R₂ = 4 Ω\n<b>Formula:</b> R = R₁ + R₂, I = U ÷ R\n<b>Working:</b> R = 6 Ω, I = 12 ÷ 6 = 2 A. Voltages: U₁ = 2 · 2 = 4 V, U₂ = 2 · 4 = 8 V. Together 12 V.',
        ),
        visual: { t: 'series', u: '12 V', r1: '2 Ω', r2: '4 Ω', i: 'I = 2 A' },
      },
    ],
    gens: [...ohm, ...ohmMore],
  },
];
