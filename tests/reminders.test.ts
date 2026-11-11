import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

// Isolated data folder: these tests must never touch the real data/ files.
const dir = mkdtempSync(path.join(tmpdir(), 'ss-reminders-'));
process.env.DATA_DIR = dir;
process.env.REMINDERS = 'true';
process.env.REMINDER_HOUR = '19';
process.env.REMINDER_TZ = 'Asia/Tashkent';

const streak = (count: number, day: string, lang?: string) => ({ progress: { lang, acad: { streak: { count, day } } }, updatedAt: 1 });
writeFileSync(
  path.join(dir, 'progress.json'),
  JSON.stringify({ '201': streak(4, '2026-10-18', 'ru'), '202': streak(2, '2026-10-19', 'en'), '203': streak(1, '2026-10-18') }),
);

const { dueReminders, localClock, previousDay, runReminders, reminderState } = await import('../server/reminders.ts');
const { TelegramBot } = await import('../server/bot.ts');

// 14:30 UTC = 19:30 in Tashkent (UTC+5)
const evening = new Date('2026-10-19T14:30:00Z');
const opts = { hour: 19, timeZone: 'Asia/Tashkent' };

test('Tashkent clock: day and hour, including the day change after midnight', () => {
  assert.deepEqual(localClock(evening, 'Asia/Tashkent'), { day: '2026-10-19', hour: 19 });
  assert.deepEqual(localClock(new Date('2026-10-19T19:30:00Z'), 'Asia/Tashkent'), { day: '2026-10-20', hour: 0 });
  assert.equal(previousDay('2026-03-01'), '2026-02-28');
  assert.equal(previousDay('2027-01-01'), '2026-12-31');
});

test('only students whose streak is alive but not done today are due', () => {
  const entries = {
    '101': streak(3, '2026-10-18', 'ru'), // practised yesterday: due
    '102': streak(5, '2026-10-19'), // practised today: nothing to protect
    '103': streak(2, '2026-10-16'), // already broken
    '104': { progress: { lang: 'en' } }, // never started Grade 7
    '105': streak(1, '2026-10-18'), // turned reminders off
    '106': streak(1, '2026-10-18'), // already reminded today
    '107': streak(1, '2026-10-18'), // blocked the bot
    abc: streak(1, '2026-10-18'), // not a Telegram id
    '108': streak(7, '2026-10-18'), // no language saved: Uzbek
  };
  const state = { '105': { off: true as const }, '106': { last: '2026-10-19' }, '107': { blocked: true as const } };
  assert.deepEqual(dueReminders(entries, state, evening, opts), [
    { userId: 101, lang: 'ru', streak: 3 },
    { userId: 108, lang: 'uz', streak: 7 },
  ]);
});

test('nothing before 19:00 or from 22:00 Tashkent time', () => {
  const entries = { '101': streak(3, '2026-10-18') };
  assert.equal(dueReminders(entries, {}, new Date('2026-10-19T13:59:00Z'), opts).length, 0); // 18:59
  assert.equal(dueReminders(entries, {}, new Date('2026-10-19T14:00:00Z'), opts).length, 1); // 19:00
  assert.equal(dueReminders(entries, {}, new Date('2026-10-19T16:59:00Z'), opts).length, 1); // 21:59
  assert.equal(dueReminders(entries, {}, new Date('2026-10-19T17:00:00Z'), opts).length, 0); // 22:00
});

test('the scheduler sends once per day, in the student’s language, and remembers blocked chats', async () => {
  const sent: { chatId: number; lang: string; html: string; streak: number }[] = [];
  const sender = {
    sendReminder: async (chatId: number, lang: 'uz' | 'ru' | 'en', html: string, streak: number) => {
      if (chatId === 203) throw Object.assign(new Error('Forbidden: bot was blocked by the user'), { code: 403 });
      sent.push({ chatId, lang, html, streak });
    },
  };
  assert.deepEqual(await runReminders(sender, evening), { sent: 1, failed: 1 });
  assert.equal(sent[0].chatId, 201);
  assert.equal(sent[0].lang, 'ru');
  assert.match(sent[0].html, /4 дн/);
  assert.equal(sent[0].streak, 4, 'the picture is drawn from the real streak');

  // a second check the same evening sends nothing
  assert.deepEqual(await runReminders(sender, new Date('2026-10-19T15:30:00Z')), { sent: 0, failed: 0 });

  const saved = JSON.parse(readFileSync(path.join(dir, 'reminders.json'), 'utf8'));
  assert.equal(saved['201'].last, '2026-10-19');
  assert.equal(saved['203'].blocked, true);
});

test('/reminders off, on, status and test in the bot', async () => {
  const calls: { method: string; body: Record<string, any> }[] = [];
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ method: String(url).split('/').pop()!, body: init?.body ? JSON.parse(String(init.body)) : {} });
    return new Response(JSON.stringify({ ok: true, result: { id: 1, is_bot: true, username: 'SmartSchoolsDemoBot' } }));
  }) as typeof fetch;
  const bot = new TelegramBot({
    token: 'TEST:token',
    miniAppUrl: 'https://demo.example.org/',
    miniAppUrlProblem: null,
    autoconfigure: true,
    fetchImpl,
    checkMiniApp: async () => true,
    log: () => undefined,
  });
  const say = (text: string) =>
    bot.handleUpdate({ update_id: 1, message: { message_id: 1, chat: { id: 201, type: 'private' }, from: { id: 201, first_name: 'S', language_code: 'en' }, text } });
  const last = () => calls.filter((c) => c.method === 'sendMessage').at(-1)!.body;

  await bot.init();
  const commands = calls.find((c) => c.method === 'setMyCommands' && c.body.language_code === 'uz')!.body.commands;
  assert.ok(commands.some((c: { command: string }) => c.command === 'reminders'), 'listed in the command menu');

  await say('/reminders off');
  assert.equal(reminderState()['201'].off, true);
  assert.match(last().text, /no more evening reminders/);

  await say('/reminders');
  assert.match(last().text, /<b>off<\/b>/);

  await say('/reminders on');
  assert.equal(reminderState()['201'].off, undefined);
  await say('/reminders');
  assert.match(last().text, /<b>on<\/b>/);

  // preview uses the student's saved app language (Russian) and real streak (4); one tap starts today's problem in the chat
  await say('/reminders test');
  const preview = last();
  assert.match(preview.text, /4 дн/);
  assert.equal(preview.reply_markup.inline_keyboard[1][0].callback_data, 'rm|off', 'one tap turns reminders off');
  const button = preview.reply_markup.inline_keyboard[0][0];
  assert.equal(button.text, '🔥 Продолжить серию');
  assert.equal(button.callback_data, 'd');
});
