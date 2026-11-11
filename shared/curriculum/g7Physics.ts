// Grade 7 Physics. Follows the topics and the "Berilgan → Formula → Hisoblash" layout of "Fizika 7" (Suyarov et al., 2022).
// Own wording and own numbers. Draft: awaiting teacher review.

import { Q, S, T, TN, int, pick, type Gen, type Topic } from './types.ts';
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

const BOOK = (ch: string) => T(`Fizika 7-sinf, ${ch}-bob`, `Физика, 7 класс, глава ${ch}`, `Physics, Grade 7, chapter ${ch}`);

export const g7PhysicsTopics: Topic[] = [
  {
    id: 'f7-speed', grade: 7, subject: 'physics7', emoji: '🚗', book: BOOK('I'),
    title: T('Tezlik va yo‘l', 'Скорость и путь', 'Speed and distance'),
    keywords: ['tezlik', 'harakat', 'yo‘l', 'скорост', 'движен', 'путь', 'speed', 'velocity', 'distance'],
    cards: [
      {
        text: T(
          '<b>Tezlik</b> — jism 1 soatda (yoki 1 sekundda) qancha yo‘l bosishi.\nMashina 60 km/soat: har soatda 60 km.',
          '<b>Скорость</b> — какой путь тело проходит за 1 час (или 1 секунду).\nМашина 60 км/ч: каждый час 60 км.',
          '<b>Speed</b> is how far something goes in 1 hour (or 1 second).\nA car at 60 km/h covers 60 km every hour.',
        ),
        visual: { t: 'road', s: '60 km', v: '60 km/h', time: '1 h' },
      },
      {
        text: T(
          'Bitta formula, uch shakl:\n<b>s = v · t</b> — yo‘l.\n<b>v = s : t</b> — tezlik.\n<b>t = s : v</b> — vaqt.',
          'Одна формула, три вида:\n<b>s = v · t</b> — путь.\n<b>v = s : t</b> — скорость.\n<b>t = s : v</b> — время.',
          'One formula, three forms:\n<b>s = v · t</b> — distance.\n<b>v = s ÷ t</b> — speed.\n<b>t = s ÷ v</b> — time.',
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
    ],
    gens: speed,
  },
  {
    id: 'f7-density', grade: 7, subject: 'physics7', emoji: '🧊', book: BOOK('II'),
    title: T('Massa va zichlik', 'Масса и плотность', 'Mass and density'),
    keywords: ['zichlik', 'massa', 'hajm', 'плотност', 'масса', 'объём', 'density', 'mass', 'volume'],
    cards: [
      {
        text: T(
          '<b>Zichlik</b> — 1 m³ moddaning massasi.\nBir xil hajmda temir yog‘ochdan ancha og‘ir: zichligi katta.',
          '<b>Плотность</b> — масса 1 м³ вещества.\nПри одном объёме железо намного тяжелее дерева: плотность больше.',
          '<b>Density</b> is the mass of 1 m³ of a material.\nFor the same volume, iron is far heavier than wood: it is denser.',
        ),
        visual: { t: 'formula', main: 'ρ = m : V', tone: 'amber' },
      },
      {
        text: T(
          'Nega muz suvda suzadi? 🧊\nMuz: 900 kg/m³. Suv: 1000 kg/m³.\nSuvdan <b>kam zich</b> jism suzadi, <b>ko‘proq zich</b> jism cho‘kadi.',
          'Почему лёд плавает? 🧊\nЛёд: 900 кг/м³. Вода: 1000 кг/м³.\nТело <b>менее плотное</b>, чем вода, плавает, а <b>более плотное</b> тонет.',
          'Why does ice float? 🧊\nIce: 900 kg/m³. Water: 1000 kg/m³.\nAnything <b>less dense</b> than water floats, and anything <b>denser</b> sinks.',
        ),
        visual: { t: 'block', m: '900 kg', v: '1 m³' },
      },
    ],
    gens: density,
  },
  {
    id: 'f7-pressure', grade: 7, subject: 'physics7', emoji: '🎿', book: BOOK('II'),
    title: T('Bosim', 'Давление', 'Pressure'),
    keywords: ['bosim', 'kuch', 'paskal', 'давлен', 'паскал', 'сила', 'pressure', 'pascal', 'force'],
    cards: [
      {
        text: T(
          'Nega chuqur qorda oyoq botadi, chang‘ida esa yo‘q? 🎿\nKuch bir xil, lekin chang‘ining <b>yuzasi katta</b>. Bosim kichrayadi.',
          'Почему в глубоком снегу нога проваливается, а на лыжах нет? 🎿\nСила та же, но <b>площадь</b> лыж <b>больше</b>. Давление меньше.',
          'Why do boots sink into deep snow, but skis do not? 🎿\nThe force is the same, but skis have a <b>bigger area</b>. The pressure is smaller.',
        ),
        visual: { t: 'press', force: 'F', area: 'S', wide: true },
      },
      {
        text: T(
          '<b>p = F : S</b>\nF — kuch (N), S — yuza (m²), p — bosim (paskal, Pa).\nO‘tkir pichoq yaxshi kesadi: yuzasi kichik, bosimi katta.',
          '<b>p = F : S</b>\nF — сила (Н), S — площадь (м²), p — давление (паскаль, Па).\nОстрый нож режет хорошо: площадь мала, давление велико.',
          '<b>p = F ÷ S</b>\nF is force (N), S is area (m²), p is pressure (pascal, Pa).\nA sharp knife cuts well: small area, big pressure.',
        ),
        visual: { t: 'press', force: 'F', area: 'S' },
      },
    ],
    gens: pressure,
  },
  {
    id: 'f7-ohm', grade: 7, subject: 'physics7', emoji: '💡', book: BOOK('IV'),
    title: T('Om qonuni', 'Закон Ома', 'Ohm’s law'),
    keywords: ['om', 'tok', 'kuchlanish', 'qarshilik', 'elektr', 'ток', 'напряжен', 'сопротивлен', 'ohm', 'current', 'voltage', 'resistance'],
    cards: [
      {
        text: T(
          'Elektr zanjirini suv quvuriga o‘xshating 💧\n<b>Kuchlanish (U)</b> — suvni itaruvchi kuch.\n<b>Tok kuchi (I)</b> — oqim.\n<b>Qarshilik (R)</b> — quvurning torligi.',
          'Представь цепь как водопровод 💧\n<b>Напряжение (U)</b> — то, что толкает воду.\n<b>Сила тока (I)</b> — поток.\n<b>Сопротивление (R)</b> — узость трубы.',
          'Think of a circuit as a water pipe 💧\n<b>Voltage (U)</b> is what pushes the water.\n<b>Current (I)</b> is the flow.\n<b>Resistance (R)</b> is how narrow the pipe is.',
        ),
        visual: { t: 'circuit', u: 'U', r: 'R', i: 'I' },
      },
      {
        text: T(
          '<b>Om qonuni: I = U : R</b>\nKuchlanish oshsa, tok oshadi. Qarshilik oshsa, tok kamayadi.\nU = 12 V, R = 4 Ω bo‘lsa: I = <b>3 A</b>.',
          '<b>Закон Ома: I = U : R</b>\nНапряжение больше — ток больше. Сопротивление больше — ток меньше.\nU = 12 В, R = 4 Ом: I = <b>3 А</b>.',
          '<b>Ohm’s law: I = U ÷ R</b>\nMore voltage, more current. More resistance, less current.\nU = 12 V, R = 4 Ω: I = <b>3 A</b>.',
        ),
        visual: { t: 'circuit', u: '12 V', r: '4 Ω', i: 'I = 3 A' },
      },
    ],
    gens: ohm,
  },
];
