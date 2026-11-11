import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OPEN_BUTTON, botLang, text, type BotLang } from './botText.ts';
import { remindersOn, setReminders, streakForPreview } from './reminders.ts';
import { svgToPng } from './render.ts';
import { getProgress } from './store.ts';
import { Study, type CardOpts, type Inline, type Markup } from './study.ts';
import { say } from './studyText.ts';
import type { AskTutor } from './tutor.ts';
import { hashString, visualSvg, type Visual } from '../shared/curriculum/index.ts';

const API_TIMEOUT_MS = 20_000;
/** Long-poll wait. Kept well under the idle limits of campus and mobile networks, which may drop silent connections. */
const POLL_SECONDS = 20;
const META_KEYS = new Set(['message_id', 'message_thread_id', 'from', 'sender_chat', 'chat', 'date', 'edit_date', 'forward_origin', 'reply_to_message', 'entities', 'is_topic_message', 'has_protected_content', 'via_bot', 'author_signature', 'link_preview_options']);

/** "fetch failed" alone says nothing; add the network cause (ETIMEDOUT, ECONNRESET, ...) when there is one. */
function describeError(e: unknown): string {
  const err = e as Error & { cause?: { code?: string; message?: string } };
  const cause = err.cause?.code ?? err.cause?.message;
  return cause ? `${err.message} (${cause})` : err.message;
}

/** Minimal client for the official Telegram Bot API (https://core.telegram.org/bots/api). */

interface TgUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
  language_code?: string;
}
interface TgMessage {
  message_id: number;
  chat: { id: number; type: 'private' | 'group' | 'supergroup' | 'channel' };
  from?: TgUser;
  text?: string;
}
interface TgCallbackQuery {
  id: string;
  from: TgUser;
  data?: string;
  message?: TgMessage;
}
export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
}

export class TelegramApiError extends Error {
  constructor(
    public method: string,
    public code: number,
    public description: string,
  ) {
    super(`Telegram ${method} failed (${code}): ${description}`);
  }
}

export interface BotOptions {
  token: string;
  miniAppUrl: string;
  /** Null when the URL is fine; otherwise a reason it cannot be used. */
  miniAppUrlProblem: string | null;
  autoconfigure: boolean;
  fetchImpl?: typeof fetch;
  /** Override the reachability check (tests). */
  checkMiniApp?: () => Promise<boolean>;
  log?: (msg: string) => void;
  /** Answers free-form questions with AI. Left out: no AI, and no way for this bot to reach a paid API. */
  ask?: AskTutor;
}

type Keyboard = { inline_keyboard: Record<string, unknown>[][] };

const START_PARAMS = new Set(['g4', 'g7', 'teacher', 'tutor', 'explainer']);

export class TelegramBot {
  private offset = 0;
  private running = false;
  private abort: AbortController | null = null;
  private health: { ok: boolean; at: number } | null = null;
  username = '';
  private readonly fetchImpl: typeof fetch;
  private readonly log: (msg: string) => void;
  private readonly study: Study;
  /** Telegram's id for each picture already uploaded, so a picture is only ever sent once. */
  private readonly photoIds = new Map<number, string>();
  /** The last update still running in each chat, so a chat's updates stay in order. */
  private readonly chatQueues = new Map<number, Promise<void>>();

  constructor(private readonly opts: BotOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.log = opts.log ?? ((m) => console.log(`[bot ${new Date().toTimeString().slice(0, 8)}] ${m}`));
    this.study = new Study({
      send: (chatId, html, markup) => this.sendMarkup(chatId, html, markup),
      card: (chatId, html, visual, lang, markup, opts) => this.sendCard(chatId, html, visual, lang, markup, opts),
      editCard: (chatId, messageId, html, visual, lang, markup, opts) => this.editCard(chatId, messageId, html, visual, lang, markup, opts),
      edit: (chatId, messageId, isPhoto, html, markup) => this.editMessage(chatId, messageId, isPhoto, html, markup),
      clearButtons: (chatId, messageId) =>
        this.api('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }).catch(() => undefined),
      openApp: (chatId, lang, go) => this.sendOpen(chatId, lang, text.app[lang], go),
      typing: (chatId) => this.api('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => undefined),
      animation: (chatId) => this.sendLoading(chatId),
    }, opts.ask ?? null);
  }

  async api<T = unknown>(method: string, params: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
    const res = await this.fetchImpl(`https://api.telegram.org/bot${this.opts.token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params),
      // Never wait forever: on a lossy network a stalled request would otherwise freeze the bot without a trace.
      signal: signal ?? AbortSignal.timeout(API_TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => null)) as { ok: boolean; result?: T; error_code?: number; description?: string } | null;
    if (!body?.ok) throw new TelegramApiError(method, body?.error_code ?? res.status, body?.description ?? res.statusText);
    return body.result as T;
  }

  /** getMe plus optional profile setup: commands, menu button, descriptions. */
  async init(): Promise<void> {
    const me = await this.api<TgUser>('getMe');
    this.username = me.username ?? '';
    this.log(`connected as @${this.username}`);
    if (!this.opts.autoconfigure) return;
    const tasks: Promise<unknown>[] = [];
    for (const lang of ['en', 'ru', 'uz'] as BotLang[]) {
      const scope = lang === 'en' ? {} : { language_code: lang };
      tasks.push(this.api('setMyCommands', { commands: text.commands[lang], ...scope }));
      tasks.push(this.ensureDescription(lang));
    }
    if (!this.opts.miniAppUrlProblem) {
      tasks.push(
        this.api('setChatMenuButton', {
          menu_button: { type: 'web_app', text: 'Smart Schools', web_app: { url: this.opts.miniAppUrl } },
        }),
      );
    }
    const results = await Promise.allSettled(tasks);
    const failed = results.filter((r) => r.status === 'rejected').length;
    this.log(failed ? `profile setup: ${failed} call(s) failed (non-fatal)` : 'commands, menu button and descriptions configured');
  }

  private async ensureDescription(lang: BotLang) {
    const scope = lang === 'en' ? {} : { language_code: lang };
    const current = await this.api<{ description: string }>('getMyDescription', scope).catch(() => null);
    if (current?.description !== text.description[lang]) {
      await this.api('setMyDescription', { description: text.description[lang], ...scope });
    }
    const short = await this.api<{ short_description: string }>('getMyShortDescription', scope).catch(() => null);
    if (short?.short_description !== text.shortDescription[lang]) {
      await this.api('setMyShortDescription', { short_description: text.shortDescription[lang], ...scope });
    }
  }

  /* ---------- update handling ---------- */

  async handleUpdate(update: TgUpdate): Promise<void> {
    // What arrived, without names or ids, so a missing reply can be traced in the log.
    const m = update.message;
    const cmd = /^\/[a-zA-Z0-9_]+(?:\s+\S+)?/.exec(m?.text?.trim() ?? '')?.[0];
    const kind = m && !m.text ? Object.keys(m).find((k) => !META_KEYS.has(k)) ?? 'empty' : 'text';
    this.log(`← ${update.callback_query ? 'button press' : cmd ? cmd.slice(0, 40) : `message (${kind})`}`);
    try {
      if (update.callback_query) await this.onCallback(update.callback_query);
      else if (update.message) await this.onMessage(update.message);
    } catch (e) {
      this.log(`update ${update.update_id} failed: ${describeError(e)}`);
    }
  }

  private async onMessage(msg: TgMessage) {
    const lang = botLang(msg.from?.language_code);
    const raw = msg.text?.trim() ?? '';
    const cmd = /^\/([a-zA-Z0-9_]+)(?:@([A-Za-z0-9_]+))?(?:\s+(.*))?$/.exec(raw);

    if (msg.chat.type !== 'private') {
      // In groups, only answer our own commands, and send people to a private chat (Web App buttons need one).
      if (!cmd || (cmd[2] && cmd[2].toLowerCase() !== this.username.toLowerCase())) return;
      if (!cmd[2] && !['start', 'help', 'app'].includes(cmd[1].toLowerCase())) return;
      return this.send(msg.chat.id, text.group[lang], {
        inline_keyboard: [[{ text: text.privateChat[lang], url: `https://t.me/${this.username}?start=group` }]],
      });
    }

    const user = { id: msg.from?.id ?? msg.chat.id, first_name: msg.from?.first_name, language_code: msg.from?.language_code };
    if (!raw) return this.study.onNonText(msg.chat.id, user);
    if (!cmd) return this.study.onText(msg.chat.id, user, raw);
    if (cmd[2] && cmd[2].toLowerCase() !== this.username.toLowerCase()) return;
    const name = cmd[1].toLowerCase();
    const arg = (cmd[3] ?? '').trim();
    switch (name) {
      case 'start':
        // A deep link goes straight to that lesson in the app. Everyone else starts the tutor right here in the chat.
        if (START_PARAMS.has(arg)) return this.sendOpen(msg.chat.id, lang, text.welcome[lang](msg.from?.first_name ?? ''), arg);
        return this.study.start(msg.chat.id, user);
      case 'help':
        return this.sendOpen(msg.chat.id, lang, say.help[lang]);
      case 'menu':
      case 'lessons':
      case 'practice':
      case 'daily':
      case 'solve':
      case 'progress':
      case 'settings':
      case 'about':
      case 'app':
        await this.study.command(msg.chat.id, user, name);
        return;
      case 'darslar':
        await this.study.command(msg.chat.id, user, 'lessons');
        return;
      case 'mashq':
        await this.study.command(msg.chat.id, user, 'practice');
        return;
      case 'kunlik':
        await this.study.command(msg.chat.id, user, 'daily');
        return;
      case 'natija':
        await this.study.command(msg.chat.id, user, 'progress');
        return;
      case 'misol':
        await this.study.command(msg.chat.id, user, 'solve');
        return;
      case 'reminders': {
        const userId = msg.from?.id ?? msg.chat.id;
        const a = arg.toLowerCase();
        if (a === 'off' || a === 'stop' || a === 'выкл') {
          setReminders(userId, false);
          return this.send(msg.chat.id, text.remindersOff[lang]);
        }
        if (a === 'on' || a === 'вкл') {
          setReminders(userId, true);
          return this.send(msg.chat.id, text.remindersOn[lang]);
        }
        if (a === 'test') {
          const p = getProgress(userId)?.progress as { lang?: string } | undefined;
          const rlang: BotLang = p?.lang === 'ru' || p?.lang === 'en' || p?.lang === 'uz' ? p.lang : lang;
          await this.send(msg.chat.id, text.remindersTestNote[lang]);
          const streak = streakForPreview(p);
          return this.sendReminder(msg.chat.id, rlang, text.reminder[rlang](streak), streak);
        }
        return this.send(msg.chat.id, text.remindersStatus[lang](remindersOn(userId)));
      }
      default:
        return this.send(msg.chat.id, text.unknownCommand[lang]);
    }
  }

  private async onCallback(q: TgCallbackQuery) {
    await this.api('answerCallbackQuery', { callback_query_id: q.id }).catch(() => undefined);
    if (!q.message) return;
    if (q.data === 'retry') {
      this.health = null;
      await this.sendOpen(q.message.chat.id, botLang(q.from.language_code), text.app[botLang(q.from.language_code)]);
      return;
    }
    if (q.data) {
      const isPhoto = Boolean((q.message as { photo?: unknown }).photo);
      await this.study.onCallback(q.message.chat.id, q.message.message_id, isPhoto, q.from, q.data);
    }
  }

  private webAppUrl(go?: string) {
    if (!go) return this.opts.miniAppUrl;
    const u = new URL(this.opts.miniAppUrl);
    u.searchParams.set('go', go);
    return u.toString();
  }

  /** Sends a message with the "Open Smart Schools" Web App button, or a clear error if the app is unavailable. */
  async sendOpen(chatId: number, lang: BotLang, html: string, go?: string) {
    if (this.opts.miniAppUrlProblem) {
      return this.send(chatId, `${html}\n\n${text.notConfigured[lang]}`);
    }
    const url = this.webAppUrl(go);
    if (await this.miniAppReachable()) {
      return this.send(chatId, html, { inline_keyboard: [[{ text: OPEN_BUTTON, web_app: { url } }]] });
    }
    // Still offer the button: the check can fail for reasons that do not affect the user.
    return this.send(chatId, `${html}\n\n${text.unavailable[lang]}`, {
      inline_keyboard: [
        [{ text: text.openAnyway[lang], web_app: { url } }],
        [{ text: text.tryAgain[lang], callback_data: 'retry' }],
      ],
    });
  }

  /** Evening reminder: one tap starts today's problem, right here in the chat. */
  sendReminder(chatId: number, lang: BotLang, html: string, streak: number) {
    return this.sendCard(
      chatId,
      html,
      { t: 'reminder', streak },
      lang,
      { inline_keyboard: [[{ text: text.reminderButton[lang], callback_data: 'd' }], [{ text: text.reminderOffButton[lang], callback_data: 'rm|off' }]] },
      { fallback: html },
    );
  }

  /** The loading animation: uploaded once, then sent by Telegram's own file id. If anything goes wrong the chat simply carries on without it. */
  private loadingId: string | null = null;
  private async sendLoading(chatId: number) {
    try {
      if (this.loadingId) return await this.api('sendAnimation', { chat_id: chatId, animation: this.loadingId });
      const here = path.dirname(fileURLToPath(import.meta.url));
      const file = [path.resolve('server/assets/loading.mp4'), path.join(here, 'assets/loading.mp4'), path.join(here, '../server/assets/loading.mp4')].find((f) => existsSync(f));
      if (!file) return;
      const bytes = await readFile(file);
      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append('width', '720');
      form.append('height', '720');
      form.append('duration', '6');
      form.append('animation', new Blob([new Uint8Array(bytes)], { type: 'video/mp4' }), 'smart-schools.mp4');
      const res = await this.fetchImpl(`https://api.telegram.org/bot${this.opts.token}/sendAnimation`, { method: 'POST', body: form, signal: AbortSignal.timeout(30_000) });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; result?: { animation?: { file_id: string }; document?: { file_id: string } } } | null;
      if (body?.ok) this.loadingId = body.result?.animation?.file_id ?? body.result?.document?.file_id ?? null;
    } catch (e) {
      this.log(`loading animation skipped: ${describeError(e)}`);
    }
  }

  private sendMarkup(chatId: number, html: string, markup?: Markup) {
    return this.api('sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      ...(markup ? { reply_markup: markup } : {}),
    });
  }

  /** Telegram's built-in party effect, played when a student earns three stars (private chats only). */
  private static readonly PARTY_EFFECT = '5046509860389126442';

  /** Picture plus caption and buttons. Falls back to plain text, so a lesson never fails because of a picture. */
  private async sendCard(chatId: number, html: string, visual: Visual | undefined, lang: BotLang, markup?: Inline, opts: CardOpts = {}) {
    if (!visual) return this.sendMarkup(chatId, html, markup);
    const fallback = opts.fallback ?? html;
    try {
      const svg = visualSvg(visual, lang, opts.ribbon);
      const key = hashString(svg);
      const known = this.photoIds.get(key);
      const common = { chat_id: chatId, caption: html, parse_mode: 'HTML', ...(markup ? { reply_markup: markup } : {}) };
      const effectRejected = (e: unknown) => opts.effect && e instanceof TelegramApiError && /effect/i.test(e.description);
      if (known) {
        try {
          return await this.api('sendPhoto', { ...common, photo: known, ...(opts.effect ? { message_effect_id: TelegramBot.PARTY_EFFECT } : {}) });
        } catch (e) {
          if (!effectRejected(e)) throw e;
          return await this.api('sendPhoto', { ...common, photo: known });
        }
      }
      const png = await svgToPng(svg);
      if (!png) return await this.sendMarkup(chatId, fallback, markup);
      const upload = async (withEffect: boolean) => {
        const form = new FormData();
        form.append('chat_id', String(chatId));
        form.append('caption', html);
        form.append('parse_mode', 'HTML');
        if (markup) form.append('reply_markup', JSON.stringify(markup));
        if (withEffect) form.append('message_effect_id', TelegramBot.PARTY_EFFECT);
        form.append('photo', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'picture.png');
        const res = await this.fetchImpl(`https://api.telegram.org/bot${this.opts.token}/sendPhoto`, { method: 'POST', body: form, signal: AbortSignal.timeout(30_000) });
        const body = (await res.json().catch(() => null)) as { ok?: boolean; description?: string; error_code?: number; result?: { photo?: { file_id: string }[] } } | null;
        if (!body?.ok) throw new TelegramApiError('sendPhoto', body?.error_code ?? res.status, body?.description ?? res.statusText);
        return body.result;
      };
      let result;
      try {
        result = await upload(Boolean(opts.effect));
      } catch (e) {
        if (!effectRejected(e)) throw e;
        result = await upload(false);
      }
      const id = result?.photo?.at(-1)?.file_id;
      if (id) this.photoIds.set(key, id);
      return result;
    } catch (e) {
      this.log(`sendPhoto: ${describeError(e)}, sending text instead`);
      return this.sendMarkup(chatId, fallback, markup);
    }
  }

  /** Swaps the picture, caption and buttons of a card already in the chat (the homework board, step by step). */
  private async editCard(chatId: number, messageId: number, html: string, visual: Visual, lang: BotLang, markup?: Inline, opts: CardOpts = {}) {
    const fallback = opts.fallback ?? html;
    try {
      const svg = visualSvg(visual, lang, opts.ribbon);
      const key = hashString(svg);
      const known = this.photoIds.get(key);
      const where = { chat_id: chatId, message_id: messageId, reply_markup: markup ?? { inline_keyboard: [] } };
      if (known) {
        await this.api('editMessageMedia', { ...where, media: { type: 'photo', media: known, caption: html, parse_mode: 'HTML' } });
        return;
      }
      const png = await svgToPng(svg);
      if (!png) {
        await this.sendMarkup(chatId, fallback, markup);
        return;
      }
      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append('message_id', String(messageId));
      form.append('reply_markup', JSON.stringify(where.reply_markup));
      form.append('media', JSON.stringify({ type: 'photo', media: 'attach://picture', caption: html, parse_mode: 'HTML' }));
      form.append('picture', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'picture.png');
      const res = await this.fetchImpl(`https://api.telegram.org/bot${this.opts.token}/editMessageMedia`, { method: 'POST', body: form, signal: AbortSignal.timeout(30_000) });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; description?: string; error_code?: number; result?: { photo?: { file_id: string }[] } } | null;
      if (!body?.ok) throw new TelegramApiError('editMessageMedia', body?.error_code ?? res.status, body?.description ?? res.statusText);
      const id = body.result?.photo?.at(-1)?.file_id;
      if (id) this.photoIds.set(key, id);
    } catch (e) {
      // Pressing a button twice asks for the same picture again; that is not a failure.
      if (e instanceof TelegramApiError && /not modified/i.test(e.description)) return;
      this.log(`editMessageMedia: ${describeError(e)}, sending text instead`);
      await this.sendMarkup(chatId, fallback, markup);
    }
  }

  private async editMessage(chatId: number, messageId: number, isPhoto: boolean, html: string, markup?: Inline) {
    const where = { chat_id: chatId, message_id: messageId, parse_mode: 'HTML', ...(markup ? { reply_markup: markup } : {}) };
    try {
      if (isPhoto) await this.api('editMessageCaption', { ...where, caption: html });
      else await this.api('editMessageText', { ...where, text: html, link_preview_options: { is_disabled: true } });
    } catch (e) {
      // Pressing a button twice asks for the same text again; that is not a failure.
      if (!(e instanceof TelegramApiError && /not modified/i.test(e.description))) throw e;
    }
  }

  private async miniAppReachable(): Promise<boolean> {
    if (this.health && Date.now() - this.health.at < 60_000) return this.health.ok;
    let ok = false;
    try {
      ok = this.opts.checkMiniApp
        ? await this.opts.checkMiniApp()
        : (await this.fetchImpl(this.opts.miniAppUrl, { method: 'GET', signal: AbortSignal.timeout(4000) })).status < 400;
    } catch {
      ok = false;
    }
    if (!ok) this.log('mini app URL did not respond; sending the unavailable notice');
    this.health = { ok, at: Date.now() };
    return ok;
  }

  private async send(chatId: number, html: string, keyboard?: Keyboard) {
    const params = {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      ...(keyboard ? { reply_markup: keyboard } : {}),
    };
    try {
      return await this.api('sendMessage', params);
    } catch (e) {
      if (e instanceof TelegramApiError) throw e;
      // Network failure or timeout: one retry. In the rare case the first attempt did arrive, the student sees it twice.
      this.log(`sendMessage: ${describeError(e)}, retrying once`);
      await new Promise((r) => setTimeout(r, 1500));
      return this.api('sendMessage', params);
    }
  }

  /* ---------- delivery: long polling or webhook ---------- */

  /**
   * An AI answer can take seconds, and it must not hold up every other student.
   * So chats run side by side, while each chat's own updates still run in order.
   */
  private enqueue(u: TgUpdate) {
    const chatId = u.message?.chat.id ?? u.callback_query?.message?.chat.id ?? 0;
    const run = (this.chatQueues.get(chatId) ?? Promise.resolve()).then(() => this.handleUpdate(u));
    this.chatQueues.set(chatId, run);
    void run.then(() => {
      if (this.chatQueues.get(chatId) === run) this.chatQueues.delete(chatId);
    });
  }

  async startPolling(): Promise<void> {
    await this.api('deleteWebhook', { drop_pending_updates: false });
    this.running = true;
    this.log('long polling started');
    let backoff = 1000;
    while (this.running) {
      try {
        this.abort = new AbortController();
        const timer = setTimeout(() => this.abort?.abort(), (POLL_SECONDS + 15) * 1000);
        const updates = await this.api<TgUpdate[]>(
          'getUpdates',
          { offset: this.offset, timeout: POLL_SECONDS, allowed_updates: ['message', 'callback_query'] },
          this.abort.signal,
        );
        clearTimeout(timer);
        backoff = 1000;
        for (const u of updates) {
          this.offset = u.update_id + 1;
          this.enqueue(u);
        }
      } catch (e) {
        if (!this.running) break;
        if (e instanceof TelegramApiError && e.code === 401) {
          this.log('the bot token was rejected (401). Check TELEGRAM_BOT_TOKEN. Bot stopped.');
          this.running = false;
          break;
        }
        if (e instanceof TelegramApiError && e.code === 409) {
          this.log('conflict (409): another instance is polling or a webhook is set. Retrying in 5 s.');
          backoff = 5000;
        } else if ((e as Error).name === 'AbortError') {
          this.log(`no answer from Telegram for ${POLL_SECONDS + 15} s (network problem?), reconnecting`);
        } else {
          this.log(`polling error: ${describeError(e)}. Retrying in ${backoff / 1000} s.`);
        }
        await new Promise((r) => setTimeout(r, backoff));
        backoff = Math.min(backoff * 2, 30_000);
      }
    }
  }

  async setWebhook(url: string, secret: string): Promise<void> {
    await this.api('setWebhook', {
      url,
      secret_token: secret,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    });
    this.log(`webhook set to ${new URL(url).origin}/…`);
  }

  stop() {
    this.running = false;
    this.abort?.abort();
  }
}
