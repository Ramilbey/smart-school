/** Bot messages (Telegram HTML parse mode). Language follows the user's Telegram language. */

export type BotLang = 'uz' | 'ru' | 'en';

export const OPEN_BUTTON = 'Open Smart Schools';

export function botLang(code: string | undefined): BotLang {
  const c = (code ?? '').toLowerCase();
  if (c.startsWith('uz')) return 'uz';
  if (c.startsWith('ru') || c.startsWith('be') || c.startsWith('kk') || c.startsWith('uk')) return 'ru';
  return 'en';
}

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const text = {
  welcome: {
    en: (name: string) =>
      [
        `🎓 <b>Smart Schools</b>${name ? ` — welcome, ${escapeHtml(name)}!` : ''}`,
        '<i>AI supports the teacher. Understanding leads the way.</i>',
        '',
        'Smart Schools is a prototype of one AI-supported school platform: smart attendance, end-of-lesson comprehension checks, teacher-led AI explanations and homework support that adapts to the student’s age.',
        '',
        '<b>Try the demo (about 3 minutes):</b>',
        '• <b>Grade 4 · Fractions</b>: a gamified mission. Answer a homework question wrong on purpose, and the tutor gives a hint instead of the answer.',
        '• <b>Grade 7 · Linear functions</b>: drag the line and watch <code>y = kx + b</code> and the graph change together.',
        '',
        'Tap <b>Open Smart Schools</b> below. Lessons are in O‘zbekcha and Русский.',
        '',
        'To reopen later, tap the <b>Smart Schools</b> button next to the message field, or send /app.',
        '',
        '<i>Prototype: the lesson content is a draft awaiting teacher review, and the teacher dashboard uses simulated data.</i>',
      ].join('\n'),
    ru: (name: string) =>
      [
        `🎓 <b>Smart Schools</b>${name ? ` — добро пожаловать, ${escapeHtml(name)}!` : ''}`,
        '<i>AI supports the teacher. Understanding leads the way.</i>',
        '',
        'Smart Schools — прототип единой школьной платформы с поддержкой ИИ: умная посещаемость, проверка понимания в конце урока, объяснения ИИ под руководством учителя и помощь с домашним заданием с учётом возраста ученика.',
        '',
        '<b>Попробуйте демо (около 3 минут):</b>',
        '• <b>4 класс · Дроби</b>: игровая миссия. Ответьте на задачу неверно специально, и наставник даст подсказку, а не готовый ответ.',
        '• <b>7 класс · Линейная функция</b>: перетаскивайте прямую и смотрите, как <code>y = kx + b</code> и график меняются вместе.',
        '',
        'Нажмите <b>Open Smart Schools</b> ниже. Уроки доступны на узбекском и русском.',
        '',
        'Чтобы открыть приложение снова, нажмите кнопку <b>Smart Schools</b> рядом с полем ввода или отправьте /app.',
        '',
        '<i>Прототип: учебные материалы — черновик, который ещё не проверен учителем; данные панели учителя смоделированы.</i>',
      ].join('\n'),
    uz: (name: string) =>
      [
        `🎓 <b>Smart Schools</b>${name ? ` — xush kelibsiz, ${escapeHtml(name)}!` : ''}`,
        '<i>AI supports the teacher. Understanding leads the way.</i>',
        '',
        'Smart Schools — sun’iy intellekt yordamidagi yagona maktab platformasining prototipi: aqlli davomat, dars oxirida tushunishni tekshirish, o‘qituvchi boshqaradigan AI tushuntirishlari va o‘quvchi yoshiga moslashadigan uy vazifasi yordami.',
        '',
        '<b>Demoni sinab ko‘ring (taxminan 3 daqiqa):</b>',
        '• <b>4-sinf · Kasrlar</b>: o‘yin tarzidagi missiya. Uy vazifasiga ataylab noto‘g‘ri javob bering: yordamchi javobni emas, maslahatni beradi.',
        '• <b>7-sinf · Chiziqli funksiya</b>: chiziqni suring va <code>y = kx + b</code> hamda grafik birga o‘zgarishini kuzating.',
        '',
        'Pastdagi <b>Open Smart Schools</b> tugmasini bosing. Darslar o‘zbek va rus tillarida.',
        '',
        'Ilovani qayta ochish uchun xabar maydoni yonidagi <b>Smart Schools</b> tugmasini bosing yoki /app yuboring.',
        '',
        '<i>Prototip: dars materiallari hali o‘qituvchi tomonidan tekshirilmagan qoralama; o‘qituvchi paneli ma’lumotlari namunaviy.</i>',
      ].join('\n'),
  },

  help: {
    en: [
      '<b>How to use Smart Schools</b>',
      '1. Tap <b>Open Smart Schools</b>, or the <b>Smart Schools</b> menu button next to the message field.',
      '2. Choose O‘zbekcha or Русский.',
      '3. Pick <b>Grade 4</b> (gamified fractions) or <b>Grade 7</b> (interactive linear graphs).',
      '4. Grade 4: complete the mission stations, try the homework helper, then take the 5-question quiz.',
      '5. Grade 7: explore the graph, follow the step-by-step example, solve the guided problem, then take the check.',
      '',
      '<b>Reopen the app:</b> menu button · /app · the button under /start.',
      '<b>Start over:</b> in the app, open settings (⚙) → Reset demo progress.',
      '',
      '<b>Commands</b>',
      '/start — welcome and launch button',
      '/app — open the app',
      '/reminders — evening streak reminders (on / off)',
      '/help — this message',
      '',
      'If the app does not load, check your connection and try again in a minute.',
    ].join('\n'),
    ru: [
      '<b>Как пользоваться Smart Schools</b>',
      '1. Нажмите <b>Open Smart Schools</b> или кнопку меню <b>Smart Schools</b> рядом с полем ввода.',
      '2. Выберите O‘zbekcha или Русский.',
      '3. Выберите <b>4 класс</b> (игровые дроби) или <b>7 класс</b> (интерактивные графики).',
      '4. 4 класс: пройдите станции миссии, попробуйте помощника по домашнему заданию и быстрый тест из 5 вопросов.',
      '5. 7 класс: исследуйте график, разберите пример по шагам, решите задачу с подсказками и пройдите проверку.',
      '',
      '<b>Открыть снова:</b> кнопка меню · /app · кнопка под /start.',
      '<b>Начать заново:</b> в приложении откройте настройки (⚙) → «Сбросить прогресс демо».',
      '',
      '<b>Команды</b>',
      '/start — приветствие и кнопка запуска',
      '/app — открыть приложение',
      '/reminders — вечерние напоминания о серии (вкл / выкл)',
      '/help — это сообщение',
      '',
      'Если приложение не открывается, проверьте подключение и попробуйте через минуту.',
    ].join('\n'),
    uz: [
      '<b>Smart Schools’dan qanday foydalanish</b>',
      '1. <b>Open Smart Schools</b> tugmasini yoki xabar maydoni yonidagi <b>Smart Schools</b> menyu tugmasini bosing.',
      '2. O‘zbekcha yoki Русский tilini tanlang.',
      '3. <b>4-sinf</b> (o‘yin tarzidagi kasrlar) yoki <b>7-sinf</b> (interaktiv grafiklar)ni tanlang.',
      '4. 4-sinf: missiya bosqichlarini o‘ting, uy vazifasi yordamchisini sinab ko‘ring va 5 savollik testni yeching.',
      '5. 7-sinf: grafikni o‘rganing, misolni qadamma-qadam ko‘ring, masalani maslahatlar bilan yeching va tekshiruvdan o‘ting.',
      '',
      '<b>Qayta ochish:</b> menyu tugmasi · /app · /start ostidagi tugma.',
      '<b>Qaytadan boshlash:</b> ilovada sozlamalar (⚙) → «Demo natijalarini tozalash».',
      '',
      '<b>Buyruqlar</b>',
      '/start — salomlashish va ishga tushirish tugmasi',
      '/app — ilovani ochish',
      '/reminders — kechki seriya eslatmalari (yoqish / o‘chirish)',
      '/help — ushbu xabar',
      '',
      'Ilova ochilmasa, internetni tekshiring va bir daqiqadan so‘ng qayta urinib ko‘ring.',
    ].join('\n'),
  },

  app: {
    en: 'Tap the button to open Smart Schools.',
    ru: 'Нажмите кнопку, чтобы открыть Smart Schools.',
    uz: 'Smart Schools’ni ochish uchun tugmani bosing.',
  },

  unknownCommand: {
    en: 'I don’t know that command. Send /start to open Smart Schools or /help for instructions.',
    ru: 'Такой команды нет. Отправьте /start, чтобы открыть Smart Schools, или /help для инструкции.',
    uz: 'Bunday buyruq yo‘q. Smart Schools’ni ochish uchun /start, yo‘riqnoma uchun /help yuboring.',
  },

  plainText: {
    en: 'This bot is the doorway to the Smart Schools app; the lessons happen inside the app. Tap the button below to open it, or send /help.',
    ru: 'Этот бот — вход в приложение Smart Schools, а уроки проходят внутри приложения. Нажмите кнопку ниже или отправьте /help.',
    uz: 'Bu bot Smart Schools ilovasiga kirish eshigi, darslar esa ilova ichida. Pastdagi tugmani bosing yoki /help yuboring.',
  },

  unavailable: {
    en: '⚠️ Smart Schools seems to be temporarily unavailable. Please try again in a minute. If it keeps happening, the demo server may be restarting.',
    ru: '⚠️ Похоже, Smart Schools временно недоступен. Попробуйте через минуту. Если проблема повторяется, возможно, демо-сервер перезапускается.',
    uz: '⚠️ Smart Schools vaqtincha ishlamayotganga o‘xshaydi. Bir daqiqadan so‘ng qayta urinib ko‘ring. Muammo takrorlansa, demo server qayta ishga tushayotgan bo‘lishi mumkin.',
  },

  notConfigured: {
    en: 'The Smart Schools app link has not been configured yet, so the app cannot be opened from here. (Bot admin: set MINI_APP_URL to an HTTPS address and restart the bot.)',
    ru: 'Ссылка на приложение Smart Schools ещё не настроена, поэтому открыть его отсюда нельзя. (Администратору бота: укажите HTTPS-адрес в MINI_APP_URL и перезапустите бота.)',
    uz: 'Smart Schools ilovasi havolasi hali sozlanmagan, shuning uchun uni bu yerdan ochib bo‘lmaydi. (Bot administratoriga: MINI_APP_URL ga HTTPS manzil kiriting va botni qayta ishga tushiring.)',
  },

  group: {
    en: 'Smart Schools opens in a private chat. Tap below to continue there.',
    ru: 'Smart Schools открывается в личном чате с ботом. Нажмите ниже, чтобы продолжить.',
    uz: 'Smart Schools bot bilan shaxsiy chatda ochiladi. Davom etish uchun pastdagi tugmani bosing.',
  },

  tryAgain: { en: 'Try again', ru: 'Попробовать снова', uz: 'Qayta urinish' },
  openAnyway: { en: 'Open anyway', ru: 'Всё равно открыть', uz: 'Baribir ochish' },
  privateChat: { en: 'Open private chat', ru: 'Открыть личный чат', uz: 'Shaxsiy chatni ochish' },

  description: {
    en: 'A tutor for Grades 6–7. Textbook topics with pictures, hints instead of answers, homework step by step.',
    ru: 'Помощник для 6–7 классов. Темы учебника с картинками, подсказки вместо ответов, домашка по шагам.',
    uz: '6–7-sinflar uchun yordamchi. Darslik mavzulari rasmlar bilan, javob emas — maslahat, uy vazifasi qadamma-qadam.',
  },
  shortDescription: {
    en: 'Tutor for Grades 6–7: lessons, hints, homework help. Hackathon prototype.',
    ru: 'Помощник для 6–7 классов: уроки, подсказки, домашка. Прототип для хакатона.',
    uz: '6–7-sinflar uchun yordamchi: darslar, maslahatlar, uy vazifasi. Xakaton prototipi.',
  },

  commands: {
    en: [
      { command: 'start', description: 'Start or go to the menu' },
      { command: 'daily', description: 'Today’s problem' },
      { command: 'lessons', description: 'Lessons from your textbook' },
      { command: 'practice', description: 'Practise with hints' },
      { command: 'solve', description: 'Solve my homework problem step by step' },
      { command: 'progress', description: 'My points, streak and level' },
      { command: 'settings', description: 'Language, grade, reminder' },
      { command: 'reminders', description: 'Evening streak reminders: on / off' },
      { command: 'app', description: 'Open the interactive app' },
      { command: 'about', description: 'About this prototype' },
      { command: 'help', description: 'All commands' },
    ],
    ru: [
      { command: 'start', description: 'Начать или открыть меню' },
      { command: 'daily', description: 'Задача дня' },
      { command: 'lessons', description: 'Уроки по твоему учебнику' },
      { command: 'practice', description: 'Практика с подсказками' },
      { command: 'solve', description: 'Реши пример из домашки по шагам' },
      { command: 'progress', description: 'Мои баллы, серия и уровень' },
      { command: 'settings', description: 'Язык, класс, напоминание' },
      { command: 'reminders', description: 'Вечерние напоминания: вкл / выкл' },
      { command: 'app', description: 'Открыть интерактивное приложение' },
      { command: 'about', description: 'Об этом прототипе' },
      { command: 'help', description: 'Все команды' },
    ],
    uz: [
      { command: 'start', description: 'Boshlash yoki menyuni ochish' },
      { command: 'daily', description: 'Kunlik masala' },
      { command: 'lessons', description: 'Darsligingiz bo‘yicha darslar' },
      { command: 'practice', description: 'Maslahatlar bilan mashq' },
      { command: 'solve', description: 'Uy vazifasidagi misolni qadamma-qadam yechish' },
      { command: 'progress', description: 'Ballarim, seriyam va darajam' },
      { command: 'settings', description: 'Til, sinf, eslatma' },
      { command: 'reminders', description: 'Kechki eslatmalar: yoqish / o‘chirish' },
      { command: 'app', description: 'Interaktiv ilovani ochish' },
      { command: 'about', description: 'Prototip haqida' },
      { command: 'help', description: 'Barcha buyruqlar' },
    ],
  },

  /** Evening streak reminder: short, warm, one clear action. The picture carries the number. */
  reminder: {
    en: (n: number) => `<b>Your ${n}-day streak is at risk!</b>\nOne problem, just 2 minutes.`,
    ru: (n: number) => `<b>Серия в ${n} дн. под угрозой!</b>\nОдна задача, всего 2 минуты.`,
    uz: (n: number) => `<b>${n} kunlik seriya xavf ostida!</b>\nBitta masala, atigi 2 daqiqa.`,
  } as Record<BotLang, (n: number) => string>,
  reminderButton: {
    en: '🔥 Keep my streak',
    ru: '🔥 Продолжить серию',
    uz: '🔥 Seriyani saqlash',
  } as Record<BotLang, string>,
  reminderOffButton: {
    en: 'Turn reminders off',
    ru: 'Отключить напоминания',
    uz: 'Eslatmalarni o‘chirish',
  } as Record<BotLang, string>,
  remindersStatus: {
    en: (on: boolean) => `Evening streak reminders are <b>${on ? 'on' : 'off'}</b>.\nIf you keep a streak going in Grade 7 and haven’t practised by 19:00, I send one short reminder.\n\n/reminders on · /reminders off · /reminders test`,
    ru: (on: boolean) => `Вечерние напоминания о серии <b>${on ? 'включены' : 'выключены'}</b>.\nЕсли у вас идёт серия в 7 классе, а к 19:00 вы ещё не занимались, я пришлю одно короткое напоминание.\n\n/reminders on · /reminders off · /reminders test`,
    uz: (on: boolean) => `Kechki seriya eslatmalari <b>${on ? 'yoqilgan' : 'o‘chirilgan'}</b>.\n7-sinfda seriyangiz bo‘lsa va soat 19:00 gacha mashq qilmagan bo‘lsangiz, bitta qisqa eslatma yuboraman.\n\n/reminders on · /reminders off · /reminders test`,
  } as Record<BotLang, (on: boolean) => string>,
  remindersOn: {
    en: 'Done: evening reminders are on. 🔥',
    ru: 'Готово: вечерние напоминания включены. 🔥',
    uz: 'Tayyor: kechki eslatmalar yoqildi. 🔥',
  } as Record<BotLang, string>,
  remindersOff: {
    en: 'Done: no more evening reminders. You can turn them back on with /reminders on.',
    ru: 'Готово: вечерних напоминаний больше не будет. Включить снова: /reminders on.',
    uz: 'Tayyor: kechki eslatmalar o‘chirildi. Qayta yoqish: /reminders on.',
  } as Record<BotLang, string>,
  remindersTestNote: {
    en: 'This is a preview of the evening reminder:',
    ru: 'Так выглядит вечернее напоминание:',
    uz: 'Kechki eslatma shunday ko‘rinadi:',
  } as Record<BotLang, string>,
};
