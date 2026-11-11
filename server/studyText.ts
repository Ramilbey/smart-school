/** Everything the bot says while teaching. Telegram HTML. Uzbek and Russian are drafts awaiting review by a teacher. */

import type { Lang, Text } from '../shared/types.ts';

const T = (uz: string, ru: string, en: string): Text => ({ uz, ru, en });

export const say = {
  chooseLang: 'Tilni tanlang · Выберите язык · Choose a language',
  chooseGrade: T('Nechanchi sinfda o‘qiysiz?', 'В каком ты классе?', 'Which grade are you in?'),
  grade: (n: number) => T(`${n}-sinf`, `${n} класс`, `Grade ${n}`),

  welcome: (name: string, n: number) =>
    T(
      `Salom${name ? `, ${name}` : ''}! Men <b>Smart Schools</b>, ${n}-sinf uchun yordamchingizman.\n\nDarslik mavzulari rasmlar bilan, mashqda javob emas — maslahat, uy vazifasi qadamma-qadam. Hammasi shu yerda.`,
      `Привет${name ? `, ${name}` : ''}! Я <b>Smart Schools</b>, помощник для ${n} класса.\n\nТемы учебника с картинками, в практике подсказки вместо ответов, домашка по шагам. Всё прямо здесь.`,
      `Hi${name ? `, ${name}` : ''}! I am <b>Smart Schools</b>, your helper for Grade ${n}.\n\nTextbook topics with pictures, hints instead of answers, homework step by step. All right here.`,
    ),
  startFirst: T('▶ Birinchi masala', '▶ Первая задача', '▶ First problem'),
  homeCaption: (name: string) => T(`Salom${name ? `, <b>${name}</b>` : ''}! Davom etamizmi?`, `Привет${name ? `, <b>${name}</b>` : ''}! Продолжим?`, `Hi${name ? `, <b>${name}</b>` : ''}! Shall we carry on?`),
  keepGoing: (title: string) => T(`▶ Davom etish · ${title}`, `▶ Продолжить · ${title}`, `▶ Continue · ${title}`),
  resultCaption: (name: string) => T(`<b>Barakalla${name ? `, ${name}` : ''}!</b> Yana bitta mavzu tayyor.`, `<b>Молодец${name ? `, ${name}` : ''}!</b> Ещё одна тема готова.`, `<b>Well done${name ? `, ${name}` : ''}!</b> One more topic done.`),
  hintLabel: T('Maslahat.', 'Подсказка.', 'Hint.'),
  dailyRibbon: T('Kunlik masala', 'Задача дня', 'Daily problem'),

  menu: {
    daily: T('🎯 Kunlik masala', '🎯 Задача дня', '🎯 Daily problem'),
    lessons: T('📚 Darslar', '📚 Уроки', '📚 Lessons'),
    practice: T('✍️ Mashq', '✍️ Практика', '✍️ Practice'),
    solve: T('🧮 Misolimni yech', '🧮 Реши мой пример', '🧮 Solve my problem'),
    progress: T('🏆 Natijam', '🏆 Мои успехи', '🏆 My progress'),
    app: T('📱 Ilova', '📱 Приложение', '📱 App'),
  },
  menuTitle: T('<b>Asosiy menyu</b>', '<b>Главное меню</b>', '<b>Main menu</b>'),
  statLine: (grade: number, streak: number, xp: number) =>
    T(`${grade}-sinf · ${streak} kun · ${xp} XP`, `${grade} класс · ${streak} дн. · ${xp} XP`, `Grade ${grade} · ${streak} days · ${xp} XP`),
  whatNext: T('Bugun nima qilamiz?', 'Чем займёмся сегодня?', 'What shall we do today?'),
  home: T('Menyu', 'Меню', 'Menu'),
  back: T('← Orqaga', '← Назад', '← Back'),

  chooseSubject: T('<b>Qaysi fan?</b>', '<b>Какой предмет?</b>', '<b>Which subject?</b>'),
  chooseTopic: (title: string, book: string) =>
    T(`${title}\n<i>${book}</i> asosida\n\nMavzuni tanlang:`, `${title}\n<i>По учебнику: ${book}</i>\n\nВыбери тему:`, `${title}\n<i>Based on: ${book}</i>\n\nPick a topic:`),
  cardNext: T('Keyingi ▶', 'Дальше ▶', 'Next ▶'),
  cardPractice: T('Mashqni boshlash', 'Начать практику', 'Start practice'),
  skipToPractice: T('Mashqqa o‘tish', 'Сразу к практике', 'Skip to practice'),
  tryInApp: T('Grafikni qo‘lda sinab ko‘rish', 'Попробовать график руками', 'Try the graph by hand'),

  hint: T('Maslahat', 'Подсказка', 'Hint'),
  hintMore: T('Yana maslahat', 'Ещё подсказка', 'Another hint'),
  notYet: [
    T('Hali emas, lekin yaqin! Yana bir urinib ko‘ring.', 'Пока нет, но ты близко! Попробуй ещё раз.', 'Not yet, but you are close! Try once more.'),
    T('Xato — bu ham o‘rganish. Maslahatga qarang.', 'Ошибка — это тоже учёба. Посмотри на подсказку.', 'A mistake is part of learning. Look at the hint.'),
  ],
  right: [
    T('Barakalla!', 'Молодец!', 'Well done!'),
    T('Zo‘r!', 'Отлично!', 'Great!'),
    T('Ofarin!', 'Здорово!', 'Excellent!'),
    T('Aynan!', 'Точно!', 'Exactly!'),
    T('To‘g‘ri!', 'Верно!', 'Correct!'),
  ],
  theAnswer: T('To‘g‘ri javob', 'Правильный ответ', 'The right answer'),
  nextQuestion: T('Keyingi savol ▶', 'Следующий вопрос ▶', 'Next question ▶'),
  seeResult: T('Natijani ko‘rish', 'Посмотреть итог', 'See my result'),

  roundDone: (title: string, right: number, total: number, stars: string, xp: number) =>
    T(
      `<b>${title}</b>\n\nBirinchi urinishda: <b>${right} / ${total}</b>\n${stars}\n+${xp} XP`,
      `<b>${title}</b>\n\nС первой попытки: <b>${right} / ${total}</b>\n${stars}\n+${xp} XP`,
      `<b>${title}</b>\n\nFirst try: <b>${right} / ${total}</b>\n${stars}\n+${xp} XP`,
    ),
  praise: (right: number, total: number) =>
    right === total
      ? T('Ajoyib! Hammasi birinchi urinishda!', 'Потрясающе! Всё с первой попытки!', 'Amazing! All on the first try!')
      : right >= total - 2
        ? T('Yaxshi natija! Yana bir marta — va mukammal bo‘ladi.', 'Хороший результат! Ещё раз — и будет идеально.', 'Good work! One more go and it will be perfect.')
        : T('Yaxshi boshlanish. Darsni qayta ko‘rib, yana sinab ko‘ring.', 'Хорошее начало. Посмотри урок ещё раз и попробуй снова.', 'A good start. Look at the lesson again and have another go.'),
  streakUp: (n: number) => T(`🔥 Ketma-ket <b>${n}</b> kun!`, `🔥 <b>${n}</b> дн. подряд!`, `🔥 <b>${n}</b> days in a row!`),
  levelUp: (name: string) => T(`Yangi daraja: <b>${name}</b>!`, `Новый уровень: <b>${name}</b>!`, `New level: <b>${name}</b>!`),
  again: T('Yana mashq', 'Ещё раз', 'Practise again'),
  nextTopic: (title: string) => T(`▶ ${title}`, `▶ ${title}`, `▶ ${title}`),
  reviewLesson: T('Darsni qayta ko‘rish', 'Повторить урок', 'Review the lesson'),

  dailyHead: T('<b>Kunlik masala</b>', '<b>Задача дня</b>', '<b>Daily problem</b>'),
  dailyDone: T('Bugungi masala yechilgan. Ertaga yangisi bo‘ladi!\nHozircha mashq qilamizmi?', 'Задача дня решена. Завтра будет новая!\nПока потренируемся?', 'Today’s problem is done. A new one comes tomorrow!\nShall we practise meanwhile?'),
  dailyEnd: T('Ertaga yangi masala kutib turadi!', 'Завтра ждёт новая задача!', 'A new problem is waiting tomorrow!'),

  practiceIntro: (title: string, why: 'new' | 'weak') =>
    why === 'new'
      ? T(`Bugungi tavsiya — yangi mavzu: <b>${title}</b>`, `На сегодня — новая тема: <b>${title}</b>`, `Today’s pick, a new topic: <b>${title}</b>`)
      : T(`Bugungi tavsiya — mustahkamlaymiz: <b>${title}</b>`, `На сегодня — закрепим тему: <b>${title}</b>`, `Today’s pick, let’s strengthen: <b>${title}</b>`),

  solveHow: T(
    '<b>Misolingizni yozib yuboring</b>, men uni qadamma-qadam yechib beraman.\n\nMasalan:\n<code>2x + 3 = 11</code>\n<code>3(x − 2) = 12</code>\n<code>3/4 + 1/2</code>\n<code>80 ning 25%</code>\n<code>(x + 3)²</code>\n\nKlaviaturadagi 🎤 mikrofon bilan aytsangiz ham bo‘ladi.',
    '<b>Напиши свой пример</b>, и я решу его шаг за шагом.\n\nНапример:\n<code>2x + 3 = 11</code>\n<code>3(x − 2) = 12</code>\n<code>3/4 + 1/2</code>\n<code>25% от 80</code>\n<code>(x + 3)²</code>\n\nМожно и надиктовать микрофоном 🎤 на клавиатуре.',
    '<b>Type your problem</b> and I will work through it step by step.\n\nFor example:\n<code>2x + 3 = 11</code>\n<code>3(x − 2) = 12</code>\n<code>3/4 + 1/2</code>\n<code>25% of 80</code>\n<code>(x + 3)²</code>\n\nYou can also dictate it with your keyboard’s 🎤 microphone.',
  ),
  solveTitle: T('<b>Misol:</b>', '<b>Пример:</b>', '<b>Problem:</b>'),
  step: (n: number) => T(`<b>${n}-qadam.</b>`, `<b>Шаг ${n}.</b>`, `<b>Step ${n}.</b>`),
  nextStep: T('Keyingi qadam ▶', 'Следующий шаг ▶', 'Next step ▶'),
  showAnswer: T('Javobni ko‘rish', 'Показать ответ', 'Show the answer'),
  tryFirst: T('O‘zingiz davom ettirib ko‘ring, keyin tekshiring.', 'Попробуй продолжить сам, потом проверь.', 'Try carrying on yourself, then check.'),
  answer: T('<b>Javob:</b>', '<b>Ответ:</b>', '<b>Answer:</b>'),
  similar: T('Shunga o‘xshash mashq', 'Похожая практика', 'Practise something similar'),
  problemGone: T('Bu misol eskirgan. Uni qaytadan yozib yuboring.', 'Этот пример устарел. Напиши его ещё раз.', 'That problem has expired. Please type it again.'),

  topicFound: (title: string) => T(`Bu haqida darsimiz bor: <b>${title}</b>`, `Об этом есть урок: <b>${title}</b>`, `We have a lesson on this: <b>${title}</b>`),
  openLesson: T('Darsni ochish', 'Открыть урок', 'Open the lesson'),
  notUnderstood: T(
    'Buni hali tushunmadim\n\nMen misolni yecha olaman (<code>2x + 3 = 11</code>) yoki mavzuni topaman (<code>foiz</code>, <code>tezlik</code>, <code>uchburchak</code>). Yoki tugmalardan birini tanlang:',
    'Этого я пока не понял\n\nЯ могу решить пример (<code>2x + 3 = 11</code>) или найти тему (<code>проценты</code>, <code>скорость</code>, <code>треугольник</code>). Или выбери кнопку:',
    'I did not get that yet\n\nI can solve a problem (<code>2x + 3 = 11</code>) or find a topic (<code>percent</code>, <code>speed</code>, <code>triangle</code>). Or pick a button:',
  ),
  aiLabel: T('🤖 AI javobi', '🤖 Ответ ИИ', '🤖 AI reply'),
  aiLimit: T(
    'Bugungi AI savollaringiz tugadi. Ertaga yana so‘rashingiz mumkin\n\nHozircha misolni yozib yuboring (<code>2x + 3 = 11</code>) yoki tugmalardan birini tanlang:',
    'На сегодня вопросы к ИИ закончились. Завтра можно спросить снова\n\nА пока напиши пример (<code>2x + 3 = 11</code>) или выбери кнопку:',
    'You have used today’s AI questions. You can ask again tomorrow\n\nUntil then, type a problem (<code>2x + 3 = 11</code>) or pick a button:',
  ),
  nonText: T(
    'Hozircha rasm va ovozli xabarni o‘qiy olmayman.\nMisolni yozib yuboring yoki klaviaturadagi 🎤 mikrofon bilan ayting.',
    'Пока я не умею читать фото и голосовые.\nНапиши пример или надиктуй его микрофоном 🎤 на клавиатуре.',
    'I cannot read photos or voice messages yet.\nType the problem, or dictate it with your keyboard’s 🎤 microphone.',
  ),

  progressTitle: T('<b>Natijam</b>', '<b>Мои успехи</b>', '<b>My progress</b>'),
  progressBody: (streak: number, xp: number, level: string, toNext: number | null, done: number, total: number, answered: number, pct: number) =>
    T(
      `Ketma-ket: <b>${streak} kun</b>\nBall: <b>${xp} XP</b>\nDaraja: <b>${level}</b>${toNext ? `\nKeyingi darajagacha: ${toNext} XP` : ''}\n\nMavzular: <b>${done} / ${total}</b>\nYechilgan savollar: <b>${answered}</b>\nBirinchi urinishda to‘g‘ri: <b>${pct}%</b>`,
      `Подряд: <b>${streak} дн.</b>\nБаллы: <b>${xp} XP</b>\nУровень: <b>${level}</b>${toNext ? `\nДо следующего уровня: ${toNext} XP` : ''}\n\nТемы: <b>${done} / ${total}</b>\nРешено вопросов: <b>${answered}</b>\nС первой попытки: <b>${pct}%</b>`,
      `Streak: <b>${streak} days</b>\nPoints: <b>${xp} XP</b>\nLevel: <b>${level}</b>${toNext ? `\nTo the next level: ${toNext} XP` : ''}\n\nTopics: <b>${done} / ${total}</b>\nQuestions answered: <b>${answered}</b>\nRight first time: <b>${pct}%</b>`,
    ),
  progressStats: (done: number, total: number, answered: number, pct: number) =>
    T(
      `Mavzular: <b>${done} / ${total}</b>\nYechilgan savollar: <b>${answered}</b>\nBirinchi urinishda to‘g‘ri: <b>${pct}%</b>`,
      `Темы: <b>${done} / ${total}</b>\nРешено вопросов: <b>${answered}</b>\nС первой попытки: <b>${pct}%</b>`,
      `Topics: <b>${done} / ${total}</b>\nQuestions answered: <b>${answered}</b>\nRight first time: <b>${pct}%</b>`,
    ),
  weakest: (title: string) => T(`\n\nMustahkamlash kerak: <b>${title}</b>`, `\n\nСтоит закрепить: <b>${title}</b>`, `\n\nWorth strengthening: <b>${title}</b>`),
  leaderboard: T('Reyting', 'Рейтинг', 'Leaderboard'),
  leaderTitle: T('<b>Eng faol o‘quvchilar</b>', '<b>Самые активные ученики</b>', '<b>Most active students</b>'),
  leaderEmpty: T('Hali hech kim ball to‘plamagan. Birinchi bo‘ling!', 'Пока никто не набрал баллов. Будь первым!', 'Nobody has points yet. Be the first!'),
  you: T('Siz', 'Ты', 'You'),
  leaderNote: T('<i>Maxfiylik uchun ismlar yashirilgan.</i>', '<i>Имена скрыты ради приватности.</i>', '<i>Names are hidden for privacy.</i>'),

  settings: (lang: string, grade: number | null, reminders: boolean) =>
    T(
      `<b>Sozlamalar</b>\n\nTil: ${lang}\nSinf: ${grade ?? '—'}\nKechki eslatma: ${reminders ? 'yoqilgan' : 'o‘chirilgan'}`,
      `<b>Настройки</b>\n\nЯзык: ${lang}\nКласс: ${grade ?? '—'}\nВечернее напоминание: ${reminders ? 'включено' : 'выключено'}`,
      `<b>Settings</b>\n\nLanguage: ${lang}\nGrade: ${grade ?? '—'}\nEvening reminder: ${reminders ? 'on' : 'off'}`,
    ),
  settingsBtn: T('Sozlamalar', 'Настройки', 'Settings'),
  changeLang: T('Tilni o‘zgartirish', 'Сменить язык', 'Change language'),
  changeGrade: T('Sinfni o‘zgartirish', 'Сменить класс', 'Change grade'),
  remindOn: T('Eslatmani yoqish', 'Включить напоминание', 'Turn reminder on'),
  remindOff: T('Eslatmani o‘chirish', 'Выключить напоминание', 'Turn reminder off'),
  aboutBtn: T('Loyiha haqida', 'О проекте', 'About the project'),
  about: T(
    '<b>Smart Schools haqida</b>\n\nBu — hakaton uchun ishlaydigan <b>prototip</b>. Telegram faqat shuning uchun tanlangan: o‘rnatish shart emas, hamma darhol sinab ko‘ra oladi.\n\nHaqiqiy tizimda <b>har bir maktabning o‘z serveri</b>, o‘z Wi-Fi tarmog‘i va server ichida ishlaydigan sun’iy intellekti bo‘ladi. O‘quvchilar maxsus maktab ilovasi orqali darsliklar, darslar va yordamni oladi. Bolalar ma’lumotlari maktabdan tashqariga chiqmaydi.\n\n<i>Darslar darslik mavzulari asosida yozilgan; o‘qituvchi tekshiruvi kutilmoqda.</i>',
    '<b>О Smart Schools</b>\n\nЭто работающий <b>прототип</b> для хакатона. Telegram выбран только поэтому: ничего не нужно устанавливать, каждый может попробовать сразу.\n\nВ настоящей системе у <b>каждой школы будет свой сервер</b>, своя сеть Wi-Fi и искусственный интеллект внутри сервера. Ученики получают учебники, уроки и помощь через школьное приложение. Данные детей не покидают школу.\n\n<i>Уроки написаны по темам учебников; проверка учителем ещё впереди.</i>',
    '<b>About Smart Schools</b>\n\nThis is a working <b>prototype</b> for a hackathon. Telegram was chosen for that reason only: nothing to install, and anyone can try it right away.\n\nIn the real system <b>every school has its own server</b>, its own Wi-Fi and AI running inside that server. Students get textbooks, lessons and help through a school app. Children’s data never leaves the school.\n\n<i>Lessons follow the textbook topics and still await review by a teacher.</i>',
  ),
  help: T(
    '<b>Yordam</b>\n\n/daily — kunlik masala\n/lessons — darslar\n/practice — mashq\n/solve — misolimni yech\n/progress — natijam\n/settings — til, sinf, eslatma\n/reminders — kechki eslatma\n/app — ilovani ochish\n/about — loyiha haqida',
    '<b>Помощь</b>\n\n/daily — задача дня\n/lessons — уроки\n/practice — практика\n/solve — реши мой пример\n/progress — мои успехи\n/settings — язык, класс, напоминание\n/reminders — вечернее напоминание\n/app — открыть приложение\n/about — о проекте',
    '<b>Help</b>\n\n/daily — daily problem\n/lessons — lessons\n/practice — practice\n/solve — solve my problem\n/progress — my progress\n/settings — language, grade, reminder\n/reminders — evening reminder\n/app — open the app\n/about — about the project',
  ),
  expired: T('Bu tugma eskirgan. Menyudan davom etamiz.', 'Эта кнопка устарела. Продолжим из меню.', 'That button has expired. Let’s continue from the menu.'),
};

export const LEVEL_NAMES: Text[] = [
  T('Yangi o‘quvchi', 'Новичок', 'Beginner'),
  T('Izlanuvchi', 'Исследователь', 'Explorer'),
  T('Ulug‘bek shogirdi', 'Ученик Улугбека', 'Student of Ulugh Beg'),
  T('Xorazmiy shogirdi', 'Ученик аль-Хорезми', 'Student of al-Khwarizmi'),
  T('Beruniy shogirdi', 'Ученик Беруни', 'Student of al-Biruni'),
  T('Ibn Sino shogirdi', 'Ученик Ибн Сины', 'Student of Ibn Sina'),
];

export const LANG_NAMES: Record<Lang, string> = { uz: 'O‘zbekcha', ru: 'Русский', en: 'English' };
