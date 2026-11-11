import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'ss-study-'));
process.env.REMINDER_TZ = 'Asia/Tashkent';

const { TelegramBot } = await import('../server/bot.ts');
const { getProgress, putProgress } = await import('../server/store.ts');
const { ROUND, questionFor, topicById, topicsForGrade } = await import('../shared/curriculum/index.ts');
const { mergeProgress, levelOf } = await import('../shared/progress.ts');

interface Call {
  method: string;
  body: Record<string, any>;
}

/** A fake Telegram: records every call and hands back message ids, like the real one. */
function telegram(uid: number, lang = 'uz') {
  const calls: Call[] = [];
  let nextId = 100;
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    const method = String(url).split('/').pop()!;
    let body: Record<string, any> = {};
    if (init?.body instanceof FormData) {
      for (const [k, v] of init.body.entries()) body[k] = typeof v === 'string' ? v : '<file>';
      if (body.reply_markup) body.reply_markup = JSON.parse(body.reply_markup);
    } else if (init?.body) body = JSON.parse(String(init.body));
    const id = nextId++;
    calls.push({ method, body: { ...body, _id: id } });
    const result = method === 'getMe' ? { id: 1, is_bot: true, username: 'SmartSchoolsDemoBot' } : method === 'sendPhoto' ? { message_id: id, photo: [{ file_id: `file-${id}` }] } : method === 'sendAnimation' ? { message_id: id, animation: { file_id: `anim-${id}` } } : { message_id: id };
    return new Response(JSON.stringify({ ok: true, result }), { headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  const makeBot = () =>
    new TelegramBot({ token: 'TEST:token', miniAppUrl: 'https://demo.example.org/', miniAppUrlProblem: null, autoconfigure: false, fetchImpl, checkMiniApp: async () => true, log: () => undefined });
  let bot = makeBot();
  const from = { id: uid, first_name: 'Ali', language_code: lang };
  const outgoing = () => calls.filter((c) => ['sendMessage', 'sendPhoto', 'editMessageText', 'editMessageCaption', 'editMessageMedia'].includes(c.method));
  const last = () => outgoing().at(-1)!;
  const textOf = (c: Call) => {
    if (c.method === 'editMessageMedia') {
      const media = typeof c.body.media === 'string' ? JSON.parse(c.body.media) : c.body.media;
      return media?.caption ?? '';
    }
    return c.body.text ?? c.body.caption ?? '';
  };
  const buttons = (c: Call = last()) => (c.body.reply_markup?.inline_keyboard ?? []).flat() as { text: string; callback_data: string }[];
  return {
    calls,
    last,
    textOf,
    buttons,
    outgoing,
    restart: () => {
      bot = makeBot();
    },
    say: (text: string) => bot.handleUpdate({ update_id: nextId++, message: { message_id: nextId++, chat: { id: uid, type: 'private' }, from, text } }),
    photo: () => bot.handleUpdate({ update_id: nextId++, message: { message_id: nextId++, chat: { id: uid, type: 'private' }, from, photo: [{}] } as any }),
    /** Presses a button on the message that carries it. */
    press: async (data: string, on: Call = last()) => {
      const message: any = { message_id: on.body.message_id ?? on.body._id, chat: { id: uid, type: 'private' } };
      if (on.method === 'sendPhoto' || on.method === 'editMessageCaption' || on.method === 'editMessageMedia') message.photo = [{}];
      await bot.handleUpdate({ update_id: nextId++, callback_query: { id: 'cb', from, data, message } as any });
    },
    study: () => (getProgress(uid)?.progress as any)?.bot,
    saved: () => getProgress(uid)?.progress as any,
  };
}

/** Reads the question behind a card's answer buttons. */
function questionOn(buttons: { callback_data: string }[]) {
  const a = buttons.find((b) => b.callback_data.startsWith('a|'))!.callback_data.split('|');
  const q = questionFor(topicById(a[2])!, Number(a[3]), Number(a[4]));
  const pressFor = (choice: number) => buttons.find((b) => b.callback_data.startsWith('a|') && b.callback_data.endsWith(`|${choice}`))!.callback_data;
  return { q, pressFor, wrong: () => [0, 1, 2, 3].filter((c) => c !== q.correct) };
}

test('first visit: language, then grade, then a welcome with the always-on menu and a first step', async () => {
  const t = telegram(1001);
  await t.say('/start');
  const animIdx = t.calls.findIndex((c) => c.method === 'sendAnimation');
  assert.ok(animIdx >= 0, 'a brand-new student sees the loading animation first');
  assert.equal(t.calls[animIdx].body.animation, '<file>');
  assert.ok(animIdx < t.calls.findIndex((c) => c.method === 'sendMessage'), 'before the language question');
  assert.deepEqual(t.buttons().map((b) => b.callback_data), ['l|uz', 'l|ru', 'l|en']);

  await t.press('l|uz');
  assert.match(t.textOf(t.last()), /Nechanchi sinf/);
  assert.deepEqual(t.buttons().map((b) => b.callback_data), ['g|6', 'g|7']);

  await t.press('g|7');
  const welcome = t.outgoing().at(-2)!;
  assert.match(t.textOf(welcome), /Salom, Ali/);
  const keys = welcome.body.reply_markup.keyboard.flat().map((k: any) => k.text);
  assert.ok(keys.includes('📚 Darslar') && keys.includes('🧮 Misolimni yech'), keys.join());
  assert.equal(welcome.body.reply_markup.is_persistent, true);
  assert.equal(t.buttons()[0].callback_data, 'd');
  assert.equal(t.saved().lang, 'uz');
  assert.equal(t.study().grade, 7);
  assert.equal(t.saved().v, 1, 'bot-created records have the shape the Mini App expects');
  assert.ok(t.saved().acad && t.saved().kids && t.saved().teacher);

  const before = t.calls.filter((c) => c.method === 'sendAnimation').length;
  await t.say('/start');
  assert.match(t.textOf(t.outgoing().at(-2)!), /Asosiy menyu/, 'the always-on keyboard rides on a short message');
  assert.equal(t.last().method, 'sendPhoto', 'then the painted home card');
  assert.match(t.textOf(t.last()), /Davom etamizmi/);
  assert.equal(t.buttons()[0].callback_data, 'p', 'one obvious next step');
  assert.equal(t.calls.filter((c) => c.method === 'sendAnimation').length, before, 'a returning student does not see it again');
});

test('a wrong answer gets hints and never the answer; three tries reveal it with no XP', async () => {
  const t = telegram(1002);
  await t.say('/start');
  await t.press('l|en');
  await t.press('g|7');
  await t.press(`t|a7-power`);
  // go straight to a fresh round
  const practice = t.buttons().find((b) => /practice/i.test(b.text))!;
  await t.press(practice.callback_data);
  let card = t.last();
  const { q, wrong } = questionOn(t.buttons());
  const rightLabel = q.choices[q.correct].en;
  // Each press uses the buttons currently on screen: they carry the state so far.
  const choose = (c: number, on: typeof card) => t.press(t.buttons(on).find((b) => b.callback_data.startsWith('a|') && b.callback_data.endsWith(`|${c}`))!.callback_data, on);

  await choose(wrong()[0], card);
  card = t.last();
  assert.match(card.method, /^edit/);
  assert.match(t.textOf(card), /Not yet/);
  assert.ok(t.textOf(card).includes(q.hints[0].en), 'first hint appears');
  assert.ok(t.buttons(card).some((b) => b.text.startsWith('✕') && b.callback_data === 'noop'), 'the wrong choice is marked and dead');
  assert.ok(!t.textOf(card).includes(q.explain.en), 'no worked answer yet');

  await choose(wrong()[1], card);
  card = t.last();
  assert.ok(t.textOf(card).includes(q.hints[1].en), 'second hint appears');

  await choose(wrong()[2], card);
  card = t.last();
  assert.ok(t.textOf(card).includes(rightLabel), 'answer revealed after real attempts');
  assert.ok(t.textOf(card).includes(q.explain.en));
  assert.equal(t.study().xp, 0, 'no XP for a revealed answer');
  assert.equal(t.study().topics['a7-power'].right, 0);
});

test('a full round: XP, streak, stars, and a repeat press cannot earn twice', async () => {
  const t = telegram(1003);
  await t.say('/start');
  await t.press('l|en');
  await t.press('g|6');
  await t.say('/practice');
  assert.match(t.textOf(t.last()), /Today’s pick/);
  assert.ok(t.buttons().some((b) => /^a\|R\|[^|]+\|\d+\|0\|/.test(b.callback_data)), 'starts at question 1');

  for (let i = 0; i < ROUND; i++) {
    const card = t.last();
    const { q, pressFor } = questionOn(t.buttons());
    await t.press(pressFor(q.correct), card);
    const done = t.last();
    assert.match(t.textOf(done), /\+10 XP/);
    if (i === 0) {
      assert.match(t.textOf(done), /1<\/b> days in a row/);
      // Pressing the same button again changes nothing.
      await t.press(pressFor(q.correct), card);
      assert.equal(t.study().xp, 10);
    }
    await t.press(t.buttons(done).at(-1)!.callback_data, done);
  }
  const summary = t.textOf(t.last());
  // The numbers and stars are painted on the card; the caption keeps the praise.
  assert.equal(t.last().method, 'sendPhoto', 'the result is a painted card');
  assert.equal(t.last().body.message_effect_id, '5046509860389126442', 'three stars play the party effect');
  assert.match(summary, /Amazing/);
  assert.equal(t.study().xp, 50);
  assert.equal(t.saved().acad.streak.count, 1);
  const first = topicsForGrade(6)[0].id;
  assert.equal(t.study().topics[first].stars, 3);
  assert.equal(t.study().topics[first].answered, 5);
  assert.ok(t.buttons().some((b) => b.callback_data.startsWith('t|')), 'offers the next topic');

  // Practice now recommends the next untried topic.
  await t.press('p');
  assert.ok(t.textOf(t.last()).includes(topicsForGrade(6)[1].title.en));
});

test('buttons keep working after a server restart', async () => {
  const t = telegram(1004);
  await t.say('/start');
  await t.press('l|en');
  await t.press('g|7');
  await t.press('d');
  const card = t.last();
  const { q, pressFor } = questionOn(t.buttons());
  t.restart();
  await t.press(pressFor(q.correct), card);
  assert.match(t.textOf(t.last()), /\+10 XP/);
  assert.equal(t.study().daily.done, true);
  await t.press('d');
  assert.match(t.textOf(t.last()), /already|done/i);
});

test('lessons: subjects, topics, picture cards with Next, and an app link on the graph lesson', async () => {
  const t = telegram(1005);
  await t.say('/start');
  await t.press('l|en');
  await t.press('g|7');
  await t.say('📚 Lessons');
  assert.deepEqual(t.buttons().slice(0, 3).map((b) => b.callback_data), ['su|algebra7', 'su|geometry7', 'su|physics7']);
  await t.press('su|algebra7');
  assert.match(t.textOf(t.last()), /Algebra 7/);
  await t.press('t|a7-func');
  const card = t.last();
  assert.equal(card.method, 'sendPhoto');
  assert.equal(card.body.photo, '<file>');
  assert.match(t.textOf(card), /y = kx \+ b/);
  await t.press('c|a7-func|1', card);
  await t.press('c|a7-func|2', t.last());
  assert.ok(t.buttons().some((b) => b.callback_data === 'ap|g7'), 'links to the interactive lesson');
  await t.press('ap|g7');
  assert.equal(t.last().body.reply_markup.inline_keyboard[0][0].web_app.url, 'https://demo.example.org/?go=g7');

  // A picture is uploaded once, then reused by its Telegram id.
  await t.press('t|a7-func');
  assert.equal(t.last().body.photo, `file-${card.body._id}`);
});

test('a Grade 6 student goes straight to the only subject', async () => {
  const t = telegram(1006);
  await t.say('/start');
  await t.press('l|uz');
  await t.press('g|6');
  await t.press('ls');
  assert.ok(t.buttons().some((b) => b.callback_data === 't|m6-percent'));
});

test('homework helper: typed problems come back one step at a time, answer last', async () => {
  const t = telegram(1007);
  await t.say('/start');
  await t.press('l|en');
  await t.press('g|7');
  await t.say('2x + 3 = 11');
  let m = t.last();
  assert.match(t.textOf(m), /Step 1/);
  assert.ok(!t.textOf(m).includes('x = 4'), 'the answer waits');
  assert.equal(t.study().lastProblem, '2x + 3 = 11');
  for (let guard = 0; guard < 8 && !t.textOf(t.last()).includes('Answer:'); guard++) {
    await t.press(t.buttons(t.last())[0].callback_data, t.last());
  }
  m = t.last();
  assert.match(t.textOf(m), /Answer:<\/b> <b>x = 4/);
  assert.ok(t.outgoing().some((c) => t.textOf(c).includes('✓')), 'the check step closes with a tick');
  assert.ok(t.buttons(m).some((b) => b.callback_data.includes('a7-eq')), 'offers similar practice');
});

test('topic words and things it cannot read get a useful reply', async () => {
  const t = telegram(1008);
  await t.say('/start');
  await t.press('l|uz');
  await t.press('g|6');
  await t.say('foiz nima?');
  assert.match(t.textOf(t.last()), /Foizlar/);
  assert.ok(t.buttons().some((b) => b.callback_data === 't|m6-percent'));
  await t.photo();
  assert.match(t.textOf(t.last()), /rasm/);
});

test('leaderboard hides names and marks the student', async () => {
  putProgress(5555, { v: 1, bot: { xp: 900, grade: 7, topics: {}, seen: [] }, acad: {} }, 1, 'Dilnoza');
  const t = telegram(1009);
  await t.say('/start');
  await t.press('l|en');
  await t.press('g|7');
  await t.press('d');
  const { q, pressFor } = questionOn(t.buttons());
  await t.press(pressFor(q.correct), t.last());
  await t.press('lb');
  const board = t.textOf(t.last());
  assert.match(board, /D\*\*\*/);
  assert.ok(!board.includes('Dilnoza'));
  assert.match(board, /<b>You<\/b>/);
});

test('settings change the language, grade and reminder', async () => {
  const t = telegram(1010);
  await t.say('/start');
  await t.press('l|en');
  await t.press('g|7');
  await t.say('/settings');
  assert.match(t.textOf(t.last()), /Evening reminder: on/);
  await t.press('rm|off');
  assert.match(t.textOf(t.last()), /Evening reminder: off/);
  await t.press('l|ru');
  assert.equal(t.saved().lang, 'ru');
  await t.press('g|6');
  assert.equal(t.study().grade, 6);
  await t.say('/about');
  assert.match(t.textOf(t.last()), /сервер/);
});

test('an expired or unknown button sends the student back to the menu, not into an error', async () => {
  const t = telegram(1011);
  await t.say('/start');
  await t.press('l|en');
  await t.press('g|7');
  await t.press('q|R|no-such-topic|1|0|0|0');
  assert.match(t.textOf(t.last()), /expired/);
  await t.press('c|a7-eq|99');
  assert.match(t.textOf(t.last()), /expired/);
});

test('progress merges forward: a stale app tab cannot erase what was earned in the chat', () => {
  const server = { v: 1, lang: 'uz', acad: { xp: 40, streak: { count: 3, day: '2026-11-05' } }, bot: { grade: 7, xp: 100, seen: [1, 2], topics: { 'a7-eq': { answered: 5, right: 4, stars: 2, rounds: 1, lastAt: 9 } }, daily: { day: '2026-11-05', done: true } } };
  const stale = { v: 1, lang: 'ru', acad: { xp: 10, streak: { count: 2, day: '2026-11-04' }, sections: { overview: true } }, kids: { xp: 5 } };
  const m = mergeProgress(server, stale) as any;
  assert.equal(m.bot.xp, 100, 'chat XP kept');
  assert.equal(m.bot.topics['a7-eq'].stars, 2);
  assert.equal(m.acad.xp, 40);
  assert.deepEqual(m.acad.streak, { count: 3, day: '2026-11-05' });
  assert.equal(m.acad.sections.overview, true, 'the app still owns its lesson state');
  assert.equal(m.kids.xp, 5);
  assert.equal(m.lang, 'ru');
  assert.equal(mergeProgress(null, stale), stale, 'first save goes through unchanged');
});

test('levels', () => {
  assert.equal(levelOf(0), 0);
  assert.equal(levelOf(49), 0);
  assert.equal(levelOf(50), 1);
  assert.equal(levelOf(1000), 5);
  assert.equal(levelOf(99999), 5);
});
