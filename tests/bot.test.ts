import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import type { TgUpdate } from '../server/bot.ts';

// The bot now saves progress: these tests must never touch the real data/ files.
process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'ss-bot-'));
const { TelegramBot } = await import('../server/bot.ts');
const { OPEN_BUTTON } = await import('../server/botText.ts');

interface Call {
  method: string;
  body: Record<string, any>;
}

/** A fake Telegram Bot API that records every call. */
function makeBot(opts: { reachable?: boolean; urlProblem?: string | null } = {}) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    const method = String(url).split('/').pop()!;
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    calls.push({ method, body });
    const result = method === 'getMe' ? { id: 1, is_bot: true, username: 'SmartSchoolsDemoBot' } : true;
    return new Response(JSON.stringify({ ok: true, result }), { headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  const bot = new TelegramBot({
    token: 'TEST:token',
    miniAppUrl: 'https://demo.example.org/',
    miniAppUrlProblem: opts.urlProblem ?? null,
    autoconfigure: true,
    fetchImpl,
    checkMiniApp: async () => opts.reachable ?? true,
    log: () => undefined,
  });
  return { bot, calls, sent: () => calls.filter((c) => c.method === 'sendMessage') };
}

const msg = (text: string, lang = 'en', chatType: 'private' | 'group' = 'private'): TgUpdate => ({
  update_id: Math.floor(Math.random() * 1e6),
  message: { message_id: 1, chat: { id: 77, type: chatType }, from: { id: 5, first_name: 'Judge', language_code: lang }, text },
});

test('init registers commands, the menu button and descriptions', async () => {
  const { bot, calls } = makeBot();
  await bot.init();
  assert.equal(bot.username, 'SmartSchoolsDemoBot');
  assert.equal(calls.filter((c) => c.method === 'setMyCommands').length, 3);
  const menu = calls.find((c) => c.method === 'setChatMenuButton');
  assert.equal(menu?.body.menu_button.type, 'web_app');
  assert.equal(menu?.body.menu_button.web_app.url, 'https://demo.example.org/');
});

test('a plain /start begins the tutor in the chat by asking for a language', async () => {
  const { bot, sent } = makeBot();
  await bot.init();
  await bot.handleUpdate(msg('/start'));
  const rows = sent()[0].body.reply_markup.inline_keyboard;
  assert.deepEqual(rows.map((r: any[]) => r[0].callback_data), ['l|uz', 'l|ru', 'l|en']);
});

test('/start with a deep-link payload still opens that lesson in the Mini App', async () => {
  const { bot, sent } = makeBot();
  await bot.init();
  await bot.handleUpdate(msg('/start g7'));
  const m = sent()[0].body;
  assert.match(m.text, /Smart Schools/);
  assert.equal(m.reply_markup.inline_keyboard[0][0].text, OPEN_BUTTON);
  assert.equal(m.reply_markup.inline_keyboard[0][0].web_app.url, 'https://demo.example.org/?go=g7');
  await bot.handleUpdate(msg('/start something-else'));
  assert.ok(sent()[1].body.reply_markup.inline_keyboard[0][0].callback_data, 'an unknown payload starts the tutor');
});

test('replies follow the Telegram language (Russian, Uzbek)', async () => {
  const { bot, sent } = makeBot();
  await bot.init();
  await bot.handleUpdate(msg('/help', 'ru'));
  assert.match(sent()[0].body.text, /Помощь/);
  await bot.handleUpdate(msg('/help', 'uz'));
  assert.match(sent()[1].body.text, /Yordam/);
});

test('/help and /app include the launch button', async () => {
  const { bot, sent } = makeBot();
  await bot.init();
  await bot.handleUpdate(msg('/help'));
  await bot.handleUpdate(msg('/app'));
  for (const s of sent()) assert.equal(s.body.reply_markup.inline_keyboard[0][0].text, 'Open Smart Schools');
  assert.match(sent()[0].body.text, /\/daily/);
});

test('unknown commands get a clear fallback without a button', async () => {
  const { bot, sent } = makeBot();
  await bot.init();
  await bot.handleUpdate(msg('/foo'));
  assert.match(sent()[0].body.text, /don’t know that command/);
  assert.equal(sent()[0].body.reply_markup, undefined);
});

test('commands addressed to another bot are ignored', async () => {
  const { bot, sent } = makeBot();
  await bot.init();
  await bot.handleUpdate(msg('/start@SomeOtherBot'));
  assert.equal(sent().length, 0);
});

test('text the bot cannot place gets a friendly explanation and the menu', async () => {
  const { bot, sent } = makeBot();
  await bot.init();
  await bot.handleUpdate(msg('hello'));
  assert.match(sent()[0].body.text, /did not get that/);
  assert.ok(sent()[0].body.reply_markup.inline_keyboard.flat().some((b: any) => b.callback_data === 'd'));
});

test('in groups the bot sends people to a private chat', async () => {
  const { bot, sent } = makeBot();
  await bot.init();
  await bot.handleUpdate(msg('just chatting', 'en', 'group'));
  assert.equal(sent().length, 0, 'ignores ordinary group messages');
  await bot.handleUpdate(msg('/start@SmartSchoolsDemoBot', 'en', 'group'));
  assert.equal(sent()[0].body.reply_markup.inline_keyboard[0][0].url, 'https://t.me/SmartSchoolsDemoBot?start=group');
});

test('an unreachable Mini App gives an understandable notice plus retry', async () => {
  const { bot, sent, calls } = makeBot({ reachable: false });
  await bot.init();
  await bot.handleUpdate(msg('/app'));
  const m = sent()[0].body;
  assert.match(m.text, /temporarily unavailable/);
  assert.equal(m.reply_markup.inline_keyboard[0][0].web_app.url, 'https://demo.example.org/');
  assert.equal(m.reply_markup.inline_keyboard[1][0].callback_data, 'retry');

  await bot.handleUpdate({ update_id: 9, callback_query: { id: 'q1', from: { id: 5, language_code: 'en' }, data: 'retry', message: { message_id: 2, chat: { id: 77, type: 'private' } } } });
  assert.ok(calls.some((c) => c.method === 'answerCallbackQuery'));
  assert.equal(sent().length, 2);
});

test('a missing or non-HTTPS Mini App URL is explained instead of sending a broken button', async () => {
  const { bot, sent, calls } = makeBot({ urlProblem: 'MINI_APP_URL must start with https://' });
  await bot.init();
  assert.equal(calls.some((c) => c.method === 'setChatMenuButton'), false);
  await bot.handleUpdate(msg('/app'));
  assert.match(sent()[0].body.text, /has not been configured/);
  assert.equal(sent()[0].body.reply_markup, undefined);
});

test('user names are HTML-escaped in the welcome', async () => {
  const { bot, sent } = makeBot();
  await bot.init();
  const update = msg('/start g4');
  update.message!.from!.first_name = '<b>x</b>';
  await bot.handleUpdate(update);
  assert.match(sent()[0].body.text, /&lt;b&gt;x&lt;\/b&gt;/);
});
