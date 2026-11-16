import type { Lang } from '../../../shared/types.ts';

type T3 = Record<Lang, string>;

/** Words of the lessons area. The Russian and Uzbek are drafts that a teacher still has to review. */
const W = {
  pageLead: { en: 'Short lessons that follow your textbook. Missed a class? Pick the topic, learn it in minutes, then practise until it sticks.', ru: 'Короткие уроки по темам учебника. Пропустил занятие? Выбери тему, разберись за несколько минут и потренируйся.', uz: 'Darslik mavzulari bo‘yicha qisqa darslar. Dars o‘tkazib yubordingizmi? Mavzuni tanlang, bir necha daqiqada tushuning va mashq qiling.' },
  continue: { en: 'Continue where you stopped', ru: 'Продолжить с того места', uz: 'Qolgan joyidan davom ettiring' },
  start: { en: 'Start', ru: 'Начать', uz: 'Boshlash' },
  practise: { en: 'Practise', ru: 'Практика', uz: 'Mashq' },
  topics: { en: 'topics', ru: 'тем', uz: 'mavzu' },
  done: { en: 'done', ru: 'пройдено', uz: 'bajarildi' },
  minutes: { en: '{n} min', ru: '{n} мин', uz: '{n} daq' },
  realLife: { en: 'Real life', ru: 'В жизни', uz: 'Hayotda' },
  whyMatters: { en: 'Where you meet this', ru: 'Где это встречается', uz: 'Bu qayerda uchraydi' },
  byTheEnd: { en: 'By the end you can answer it', ru: 'К концу урока ты сможешь ответить', uz: 'Dars oxirida javob bera olasiz' },
  letsSee: { en: 'Show me how', ru: 'Покажи, как', uz: 'Ko‘rsating-chi' },
  learn: { en: 'Learn', ru: 'Урок', uz: 'Dars' },
  path: { en: 'Your path', ru: 'Твой путь', uz: 'Sizning yo‘lingiz' },
  hook: { en: 'The question', ru: 'Вопрос', uz: 'Savol' },
  practice: { en: 'Practice', ru: 'Практика', uz: 'Mashq' },
  back: { en: 'All topics', ru: 'Все темы', uz: 'Barcha mavzular' },
  next: { en: 'Next', ru: 'Дальше', uz: 'Keyingisi' },
  prev: { en: 'Back', ru: 'Назад', uz: 'Orqaga' },
  question: { en: 'Question {n} of {total}', ru: 'Вопрос {n} из {total}', uz: '{total} savoldan {n}-savol' },
  hint: { en: 'Need a hint?', ru: 'Нужна подсказка?', uz: 'Maslahat kerakmi?' },
  right: { en: 'Right!', ru: 'Верно!', uz: 'To‘g‘ri!' },
  notYet: { en: 'Not quite. Try another answer.', ru: 'Пока нет. Попробуй другой ответ.', uz: 'Hali emas. Boshqa javobni sinab ko‘ring.' },
  shown: { en: 'Here is the right answer and why', ru: 'Вот верный ответ и почему', uz: 'To‘g‘ri javob va sababi mana bunday' },
  result: { en: 'Your result', ru: 'Твой результат', uz: 'Natijangiz' },
  firstTry: { en: 'right on the first try', ru: 'верно с первой попытки', uz: 'birinchi urinishda to‘g‘ri' },
  again: { en: 'Practise again', ru: 'Ещё раз', uz: 'Yana mashq' },
  nextTopic: { en: 'Next topic', ru: 'Следующая тема', uz: 'Keyingi mavzu' },
  seeResult: { en: 'See my result', ru: 'Посмотреть итог', uz: 'Natijani ko‘rish' },
  draft: { en: 'Written in our own words from the textbook topics. Still waiting for a teacher’s review.', ru: 'Написано своими словами по темам учебника. Ещё ждёт проверки учителем.', uz: 'Darslik mavzulari asosida o‘z so‘zlarimiz bilan yozilgan. Hali o‘qituvchi tekshiruvini kutmoqda.' },
  figure: { en: 'Figure', ru: 'Рисунок', uz: 'Rasm' },
  saved: { en: 'Progress is saved on this device.', ru: 'Прогресс сохраняется на этом устройстве.', uz: 'Natijalar shu qurilmada saqlanadi.' },
} satisfies Record<string, T3>;

export type LtKey = keyof typeof W;
export function lt(lang: Lang, key: LtKey, vars: Record<string, string | number> = {}): string {
  return (W[key][lang] ?? W[key].en).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

/** The real-life question a lesson opens with, and the one-line answer the lesson leads to. */
export const HOOKS: Record<string, { q: T3; a: T3; place: T3 }> = {
  'f7-speed': {
    place: { en: 'Road trips, trains, flights', ru: 'Дороги, поезда, перелёты', uz: 'Yo‘l, poyezd, parvoz' },
    q: {
      en: 'Tashkent to Samarkand is about 300 km. How long is the drive at 100 km/h, and how much longer if road works slow you to 60 km/h?',
      ru: 'От Ташкента до Самарканда около 300 км. Сколько ехать со скоростью 100 км/ч и насколько дольше, если из-за ремонта дороги придётся ехать 60 км/ч?',
      uz: 'Toshkentdan Samarqandgacha taxminan 300 km. 100 km/soat tezlikda necha soat yo‘l yuriladi va yo‘l ta’mirlanayotgani sabab 60 km/soat bo‘lsa, qancha ko‘p ketadi?',
    },
    a: { en: '300 ÷ 100 = 3 h, but 300 ÷ 60 = 5 h. Two hours more.', ru: '300 : 100 = 3 ч, а 300 : 60 = 5 ч. На два часа дольше.', uz: '300 : 100 = 3 soat, 300 : 60 = 5 soat. Ikki soat ko‘p.' },
  },
  'f7-density': {
    place: { en: 'Ships, icebergs, metals', ru: 'Корабли, айсберги, металлы', uz: 'Kemalar, aysberglar, metallar' },
    q: {
      en: 'An iceberg sticks out of the sea only a little, yet ships keep far away from it. Why is most of it hidden?',
      ru: 'Айсберг лишь немного торчит из моря, но корабли обходят его стороной. Почему большая его часть скрыта под водой?',
      uz: 'Aysberg dengizdan ozgina chiqib turadi, lekin kemalar undan uzoq yuradi. Nega uning katta qismi suv ostida?',
    },
    a: { en: 'Ice is 900 kg/m³, water 1000. So 900 ÷ 1000 = 9/10 of it is under water.', ru: 'Лёд 900 кг/м³, вода 1000. Значит 900 : 1000 = 9/10 льда под водой.', uz: 'Muz 900 kg/m³, suv 1000. Demak 900 : 1000 = 9/10 qismi suv ostida.' },
  },
  'f7-pressure': {
    place: { en: 'Tractors, skis, knives, diving', ru: 'Тракторы, лыжи, ножи, дайвинг', uz: 'Traktor, chang‘i, pichoq, g‘avvoslik' },
    q: {
      en: 'Why do tractors on cotton fields have wide wheels, and why does a camel not sink in the sand?',
      ru: 'Почему у тракторов на хлопковых полях широкие колёса и почему верблюд не проваливается в песок?',
      uz: 'Nega paxta dalasidagi traktorlarning g‘ildiragi keng va nega tuya qumga botmaydi?',
    },
    a: { en: 'A bigger area spreads the same weight, so the pressure p = F ÷ S gets smaller.', ru: 'Большая площадь распределяет тот же вес, поэтому давление p = F : S меньше.', uz: 'Katta yuza bir xil og‘irlikni tarqatadi, shuning uchun p = F : S bosim kichik bo‘ladi.' },
  },
  'f7-ohm': {
    place: { en: 'Chargers, lights, every device', ru: 'Зарядки, лампы, любые приборы', uz: 'Zaryadka, chiroq, har qanday qurilma' },
    q: {
      en: 'Two bulbs on one battery glow dimmer than a single bulb. Why?',
      ru: 'Две лампочки от одной батарейки светят тусклее, чем одна. Почему?',
      uz: 'Bitta batareyaga ulangan ikkita lampochka bittasidan xiraroq yonadi. Nega?',
    },
    a: { en: 'In series the resistances add up, so the current I = U ÷ R drops.', ru: 'При последовательном соединении сопротивления складываются, и ток I = U : R падает.', uz: 'Ketma-ket ulanishda qarshiliklar qo‘shiladi, shuning uchun I = U : R tok kamayadi.' },
  },
  'a7-expr': {
    place: { en: 'Shopping, tickets, tariffs', ru: 'Покупки, билеты, тарифы', uz: 'Xarid, chipta, tariflar' },
    q: {
      en: 'Three friends each buy a ticket for 12 000 so‘m and a drink for 4 000 so‘m. There are two ways to find the total. Which one is quicker?',
      ru: 'Трое друзей покупают по билету за 12 000 сум и по напитку за 4 000 сум. Общую сумму можно найти двумя способами. Какой быстрее?',
      uz: 'Uch do‘st har biri 12 000 so‘mlik chipta va 4 000 so‘mlik ichimlik oladi. Umumiy summani ikki yo‘l bilan topish mumkin. Qaysi biri tezroq?',
    },
    a: { en: '3 · (12 000 + 4 000) = 3 · 16 000 = 48 000. Brackets give the same as 3 · 12 000 + 3 · 4 000.', ru: '3 · (12 000 + 4 000) = 3 · 16 000 = 48 000. Скобки дают то же, что 3 · 12 000 + 3 · 4 000.', uz: '3 · (12 000 + 4 000) = 3 · 16 000 = 48 000. Qavs 3 · 12 000 + 3 · 4 000 bilan bir xil natija beradi.' },
  },
  'a7-power': {
    place: { en: 'Viral videos, memory, bacteria', ru: 'Вирусные видео, память, бактерии', uz: 'Viral videolar, xotira, bakteriyalar' },
    q: {
      en: 'A video is seen by 2 people on day 1. Every day the number of viewers doubles. How many people have seen it after 10 days?',
      ru: 'В первый день видео смотрят 2 человека. Каждый день число зрителей удваивается. Сколько человек увидит его за 10 дней?',
      uz: 'Birinchi kuni videoni 2 kishi ko‘radi. Har kuni tomoshabinlar soni ikki baravar oshadi. 10 kunda necha kishi ko‘radi?',
    },
    a: { en: 'The number on day n is 2ⁿ, so day 10 gives 2¹⁰ = 1024. From 2 to over a thousand.', ru: 'В день n зрителей 2ⁿ, значит в 10-й день 2¹⁰ = 1024. Из двух стало больше тысячи.', uz: 'n-kuni 2ⁿ kishi, demak 10-kuni 2¹⁰ = 1024. Ikkitadan mingdan ko‘pga.' },
  },
  'a7-poly': {
    place: { en: 'Land, fencing, building', ru: 'Участки, заборы, стройка', uz: 'Yer, to‘siq, qurilish' },
    q: {
      en: 'A field is x metres wide and (x + 5) metres long. How do you write its area and the length of fence around it, whatever x is?',
      ru: 'Поле имеет ширину x метров и длину (x + 5) метров. Как записать его площадь и длину забора вокруг, каким бы ни было x?',
      uz: 'Maydonning eni x metr, uzunligi (x + 5) metr. Uning yuzini va atrofidagi to‘siq uzunligini x qanday bo‘lishidan qat’i nazar qanday yozish mumkin?',
    },
    a: { en: 'Area x · (x + 5) = x² + 5x. Fence 2 · (x + x + 5) = 4x + 10. For x = 10: 150 m² and 50 m.', ru: 'Площадь x · (x + 5) = x² + 5x. Забор 2 · (x + x + 5) = 4x + 10. При x = 10: 150 м² и 50 м.', uz: 'Yuz x · (x + 5) = x² + 5x. To‘siq 2 · (x + x + 5) = 4x + 10. x = 10 bo‘lsa: 150 m² va 50 m.' },
  },
  'a7-fsu': {
    place: { en: 'Mental maths, faster checking', ru: 'Счёт в уме, быстрая проверка', uz: 'Og‘zaki hisob, tez tekshirish' },
    q: {
      en: 'How can you work out 99² in your head, without a calculator or long multiplication?',
      ru: 'Как вычислить 99² в уме, без калькулятора и умножения в столбик?',
      uz: '99² ni kalkulyatorsiz va ustunga ko‘paytirmasdan, og‘zaki qanday hisoblash mumkin?',
    },
    a: { en: '99² = (100 − 1)² = 10 000 − 200 + 1 = 9801. The square of a difference does the work.', ru: '99² = (100 − 1)² = 10 000 − 200 + 1 = 9801. Работает квадрат разности.', uz: '99² = (100 − 1)² = 10 000 − 200 + 1 = 9801. Ayirma kvadrati formulasi yordam beradi.' },
  },
  'a7-eq': {
    place: { en: 'Phone plans, bills, budgets', ru: 'Тарифы связи, счета, бюджет', uz: 'Aloqa tariflari, hisoblar, byudjet' },
    q: {
      en: 'A phone plan costs 30 000 so‘m a month plus 200 so‘m for each minute of calls. Your bill is 70 000 so‘m. How many minutes did you talk?',
      ru: 'Тариф стоит 30 000 сум в месяц плюс 200 сум за каждую минуту разговора. Ваш счёт 70 000 сум. Сколько минут вы говорили?',
      uz: 'Tarif oyiga 30 000 so‘m va har bir suhbat daqiqasi uchun 200 so‘m turadi. Hisobingiz 70 000 so‘m. Necha daqiqa gaplashdingiz?',
    },
    a: { en: '200x + 30 000 = 70 000, so 200x = 40 000 and x = 200 minutes.', ru: '200x + 30 000 = 70 000, значит 200x = 40 000 и x = 200 минут.', uz: '200x + 30 000 = 70 000, demak 200x = 40 000 va x = 200 daqiqa.' },
  },
  'a7-word': {
    place: { en: 'Sharing money, prices, ages', ru: 'Деление денег, цены, возраст', uz: 'Pulni bo‘lish, narxlar, yosh' },
    q: {
      en: 'Ali and Bobur share 120 000 so‘m, and Ali gets 20 000 more than Bobur. How much does each one get?',
      ru: 'Али и Бобур делят 120 000 сум, причём Али получает на 20 000 больше Бобура. Сколько получит каждый?',
      uz: 'Ali va Bobur 120 000 so‘mni bo‘lishadi, Ali Boburdan 20 000 so‘m ko‘p oladi. Har biri qancha oladi?',
    },
    a: { en: 'Bobur gets x, Ali x + 20 000: x + x + 20 000 = 120 000, so x = 50 000. Bobur 50 000, Ali 70 000.', ru: 'Бобур получает x, Али x + 20 000: x + x + 20 000 = 120 000, значит x = 50 000. Бобур 50 000, Али 70 000.', uz: 'Bobur x oladi, Ali x + 20 000: x + x + 20 000 = 120 000, demak x = 50 000. Bobur 50 000, Ali 70 000.' },
  },
  'a7-func': {
    place: { en: 'Taxis, data plans, any price per unit', ru: 'Такси, интернет-тарифы, любая цена за единицу', uz: 'Taksi, internet tariflari, har qanday birlik narxi' },
    q: {
      en: 'Taxi A charges 5 000 so‘m plus 3 000 per km. Taxi B charges 4 000 per km and nothing to start. Which is cheaper for a long ride?',
      ru: 'Такси A берёт 5 000 сум плюс 3 000 за км. Такси B берёт 4 000 за км без платы за подачу. Какое дешевле для дальней поездки?',
      uz: 'A taksi 5 000 so‘m va har km uchun 3 000 oladi. B taksi har km uchun 4 000 oladi, boshlang‘ich to‘lovsiz. Uzoq yo‘lga qaysi biri arzon?',
    },
    a: { en: '5 000 + 3 000x = 4 000x at x = 5 km, where both cost 20 000. Beyond 5 km, taxi A is cheaper. On a graph the lines cross at 5.', ru: '5 000 + 3 000x = 4 000x при x = 5 км: оба стоят 20 000. Дальше 5 км дешевле такси A. На графике прямые пересекаются в точке 5.', uz: '5 000 + 3 000x = 4 000x x = 5 km da: ikkalasi 20 000. 5 km dan keyin A taksi arzon. Grafikda to‘g‘ri chiziqlar 5 da kesishadi.' },
  },
  'a7-sys': {
    place: { en: 'Shop prices, mixtures, two unknowns', ru: 'Цены в магазине, смеси, две неизвестные', uz: 'Do‘kon narxlari, aralashmalar, ikkita noma’lum' },
    q: {
      en: 'At a school fair, 3 notebooks and 2 pens cost 13 000 so‘m, and 2 notebooks and 3 pens cost 12 000 so‘m. What does one notebook cost?',
      ru: 'На школьной ярмарке 3 тетради и 2 ручки стоят 13 000 сум, а 2 тетради и 3 ручки стоят 12 000 сум. Сколько стоит одна тетрадь?',
      uz: 'Maktab yarmarkasida 3 daftar va 2 ruchka 13 000 so‘m, 2 daftar va 3 ruchka 12 000 so‘m turadi. Bitta daftar qancha turadi?',
    },
    a: { en: '3n + 2p = 13 and 2n + 3p = 12 (in thousands). Together they give n = 3 and p = 2: a notebook is 3 000, a pen 2 000.', ru: '3n + 2p = 13 и 2n + 3p = 12 (в тысячах). Вместе дают n = 3 и p = 2: тетрадь 3 000, ручка 2 000.', uz: '3n + 2p = 13 va 2n + 3p = 12 (ming so‘mda). Birgalikda n = 3 va p = 2: daftar 3 000, ruchka 2 000.' },
  },
  'a7-comb': {
    place: { en: 'Menus, passwords, tournaments', ru: 'Меню, пароли, турниры', uz: 'Menyu, parollar, turnirlar' },
    q: {
      en: 'A café lets you pick 1 of 4 main dishes, 1 of 3 salads and 1 of 2 drinks. How many different lunches can you build?',
      ru: 'В кафе можно выбрать 1 из 4 основных блюд, 1 из 3 салатов и 1 из 2 напитков. Сколько разных обедов получится?',
      uz: 'Kafeda 4 ta asosiy taomdan 1 tasini, 3 ta salatdan 1 tasini va 2 ta ichimlikdan 1 tasini tanlash mumkin. Necha xil tushlik chiqadi?',
    },
    a: { en: 'Multiply the choices: 4 · 3 · 2 = 24 different lunches.', ru: 'Перемножаем варианты: 4 · 3 · 2 = 24 разных обеда.', uz: 'Tanlovlarni ko‘paytiramiz: 4 · 3 · 2 = 24 xil tushlik.' },
  },
};
