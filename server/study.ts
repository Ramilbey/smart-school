import { ROUND, dailyFor, explainWhy, findTopic, hashString, nextTopic, questionFor, subjects, subjectsForGrade, topicById, topicsForGrade, topicsOf, type Question, type Topic, type Visual } from '../shared/curriculum/index.ts';
import { LEVELS, freshProgressData, freshStudy, levelOf, scoreAnswer, type StudyProgress } from '../shared/progress.ts';
import { shortName } from '../shared/report.ts';
import { solveProblem } from '../shared/solver.ts';
import type { Lang } from '../shared/types.ts';
import { botLang, escapeHtml } from './botText.ts';
import { config } from './config.ts';
import { localClock, previousDay, remindersOn, setReminders } from './reminders.ts';
import { allProgress, getProgress, putProgress } from './store.ts';
import { LANG_NAMES, LEVEL_NAMES, say } from './studyText.ts';
import type { AskTutor } from './tutor.ts';

/**
 * The bot as a tutor: lessons, practice with hints, a daily problem, a homework helper, and progress.
 * All of it works inside the Telegram chat, with no Mini App and no AI service. When an AI key is set,
 * free-form questions also get a short, guarded, labelled AI answer; without one nothing changes.
 *
 * Buttons carry their own state (topic, seed, question number, score, wrong tries), and a question can be rebuilt
 * from its seed. So a server restart in the middle of a round never breaks a button.
 */

export interface StudyUser {
  id: number;
  first_name?: string;
  language_code?: string;
}

export type Button = { text: string; callback_data: string };
export type Inline = { inline_keyboard: Button[][] };
export type ReplyKeyboard = { keyboard: { text: string }[][]; resize_keyboard: boolean; is_persistent: boolean };
export type Markup = Inline | ReplyKeyboard;

/** `ribbon` is the amber tag on a lesson picture, `effect` plays Telegram's party effect, `fallback` is the whole message to send as plain text if the picture cannot be drawn. */
export interface CardOpts {
  ribbon?: string;
  effect?: boolean;
  fallback?: string;
}

export interface StudyIO {
  send(chatId: number, html: string, markup?: Markup): Promise<unknown>;
  /** A message with an optional picture. Returns once it is delivered. */
  card(chatId: number, html: string, visual: Visual | undefined, lang: Lang, markup?: Inline, opts?: CardOpts): Promise<unknown>;
  /** Swaps the picture, caption and buttons of a card this bot sent (the homework board changes step by step). */
  editCard(chatId: number, messageId: number, html: string, visual: Visual, lang: Lang, markup?: Inline, opts?: CardOpts): Promise<unknown>;
  /** Replaces the text and buttons of a message this bot sent. */
  edit(chatId: number, messageId: number, isPhoto: boolean, html: string, markup?: Inline): Promise<unknown>;
  clearButtons(chatId: number, messageId: number): Promise<unknown>;
  openApp(chatId: number, lang: Lang, go?: string): Promise<unknown>;
  /** Shows "typing…" in the chat for about 5 seconds. Never rejects. */
  typing(chatId: number): Promise<unknown>;
  /** The Smart Schools loading animation, played for a student's very first message. Never fails the conversation. */
  animation(chatId: number): Promise<unknown>;
}

type Saved = Record<string, any> & { bot: StudyProgress; lang: Lang | null };
type Mode = 'R' | 'D';


const popcount = (n: number) => n.toString(2).replace(/0/g, '').length;
const stars = (n: number) => '★'.repeat(n);
/** A menu label without its emoji, for the inline buttons (the always-on keyboard keeps its icons). */
const bare = (v: string) => v.replace(/^[^\p{L}\p{N}]+/u, '');
/** A solver step's own maths line, if it has one ("2x = 8"), for the chalkboard. Prose stays in the caption. */
function mathLine(html: string): string | null {
  const last = html.split('\n').map((l) => l.replace(/<[^>]+>/g, '').trim()).filter(Boolean).at(-1) ?? '';
  const ok = (s: string) => s.length > 0 && s.length <= 34 && /[0-9=]/.test(s) && !/[A-Za-zА-Яа-я]{4,}/.test(s.replace(/\b[xyz]\b/g, ''));
  if (ok(last)) return last;
  const bold = [...html.matchAll(/<b>(.*?)<\/b>/g)].map((m) => m[1]).filter(ok).at(-1);
  return bold ?? null;
}
const CHECK_WORD = { uz: 'Tekshiramiz', ru: 'Проверяем', en: 'Check it' } as const;
/** Worth an AI call: a whole sentence or a "?". A bare topic word ("foiz") just opens the lesson. */
const isQuestion = (text: string) => text.includes('?') || text.split(/\s+/).length >= 3;
/** "ok", "12" or "5 km/h" (say, an answer typed to a question on screen) are not questions to spend a call on. */
const hasWord = (text: string) => /\p{L}{3}/u.test(text);

export class Study {
  constructor(
    private io: StudyIO,
    /** Null means no AI at all: every text gets the fixed-rule replies. */
    private ask: AskTutor | null = null,
  ) {}

  /* ---------- saved progress ---------- */

  private load(user: StudyUser): { p: Saved; lang: Lang; study: StudyProgress } {
    const raw = getProgress(user.id)?.progress as Saved | undefined;
    const p: Saved = raw && typeof raw === 'object' ? (structuredClone(raw) as Saved) : (freshProgressData(null) as unknown as Saved);
    p.bot = { ...freshStudy(), ...(p.bot ?? {}) };
    return { p, lang: p.lang ?? botLang(user.language_code), study: p.bot };
  }

  private save(user: StudyUser, p: Saved) {
    p.updatedAt = Date.now();
    putProgress(user.id, p, p.updatedAt, shortName(user.first_name));
  }

  private today() {
    return localClock(new Date(), config.reminderTimeZone).day;
  }

  /** Same rule as the Mini App: practising today keeps the chain; yesterday extends it; older starts over. Returns the new count when it grew. */
  private touchStreak(p: Saved): number | null {
    const day = this.today();
    const cur = p.acad?.streak as { count: number; day: string } | undefined;
    if (cur?.day === day) return null;
    const count = cur?.day === previousDay(day) ? cur.count + 1 : 1;
    p.acad = { ...p.acad, streak: { count, day } };
    return count;
  }

  private liveStreak(p: Saved): number {
    const s = p.acad?.streak as { count: number; day: string } | undefined;
    if (!s) return 0;
    const day = this.today();
    return s.day === day || s.day === previousDay(day) ? s.count : 0;
  }

  private totalXp(p: Saved) {
    return (p.bot?.xp ?? 0) + (p.acad?.xp ?? 0);
  }

  /* ---------- keyboards ---------- */

  private replyKeyboard(lang: Lang): ReplyKeyboard {
    const m = say.menu;
    return {
      keyboard: [
        [{ text: m.daily[lang] }, { text: m.lessons[lang] }],
        [{ text: m.practice[lang] }, { text: m.solve[lang] }],
        [{ text: m.progress[lang] }, { text: m.app[lang] }],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  /** Plain menu, for places that cannot show the home card (a lost picture, an unknown message). */
  private menuKeyboard(lang: Lang): Inline {
    const m = say.menu;
    return {
      inline_keyboard: [
        [{ text: bare(m.daily[lang]), callback_data: 'd' }, { text: bare(m.solve[lang]), callback_data: 'sh' }],
        [{ text: bare(m.lessons[lang]), callback_data: 'ls' }, { text: bare(m.practice[lang]), callback_data: 'p' }],
        [{ text: bare(m.progress[lang]), callback_data: 'r' }, { text: bare(m.app[lang]), callback_data: 'ap' }],
        [{ text: say.settingsBtn[lang], callback_data: 'st' }],
      ],
    };
  }

  /** The numbers behind the home card and the progress screen. */
  private snapshot(p: Saved, lang: Lang, study: StudyProgress, name: string) {
    const grade = study.grade ?? 7;
    const xp = this.totalXp(p);
    const level = levelOf(xp);
    const goal = LEVELS[level + 1] ?? null;
    const into = goal ? Math.max(0, Math.min(1, (xp - LEVELS[level]) / (goal - LEVELS[level]))) : 1;
    const { topic } = this.pick(study, grade);
    const tiles = topicsForGrade(grade).map((t): 'done' | 'now' | 'todo' => (study.topics[t.id]?.rounds ? 'done' : t.id === topic.id ? 'now' : 'todo'));
    const streak = this.liveStreak(p);
    const levelName = LEVEL_NAMES[level][lang];
    const visual: Visual = { t: 'home', level: levelName, xp, goal, into, streak, tiles };
    const fallback = `${say.menuTitle[lang]}\n\n${say.statLine(grade, streak, xp)[lang]}\n${levelName}\n\n${say.homeCaption(escapeHtml(name))[lang]}`;
    return { visual, fallback, topic, grade };
  }

  /** The home screen: one painted status card and one obvious next step. */
  private async home(chatId: number, user: StudyUser) {
    const { p, lang, study } = this.load(user);
    const { visual, fallback, topic } = this.snapshot(p, lang, study, user.first_name ?? '');
    const m = say.menu;
    await this.io.card(
      chatId,
      say.homeCaption(escapeHtml(user.first_name ?? ''))[lang],
      visual,
      lang,
      {
        inline_keyboard: [
          [{ text: say.keepGoing(topic.title[lang])[lang], callback_data: 'p' }],
          [{ text: bare(m.daily[lang]), callback_data: 'd' }, { text: bare(m.solve[lang]), callback_data: 'sh' }],
          [{ text: bare(m.lessons[lang]), callback_data: 'ls' }, { text: bare(m.progress[lang]), callback_data: 'r' }],
          [{ text: say.settingsBtn[lang], callback_data: 'st' }],
        ],
      },
      { fallback },
    );
  }

  /** The always-on keyboard has to ride on a message of its own (a picture can carry only one set of buttons), then the card follows. */
  private async homeWithKeyboard(chatId: number, user: StudyUser, lang: Lang) {
    await this.io.send(chatId, say.menuTitle[lang], this.replyKeyboard(lang));
    await this.home(chatId, user);
  }

  private homeRow = (lang: Lang): Button[] => [{ text: say.home[lang], callback_data: 'm' }];

  /* ---------- entry points ---------- */

  async start(chatId: number, user: StudyUser) {
    const { p, lang, study } = this.load(user);
    if (!p.lang) {
      await this.io.animation(chatId);
      return this.askLang(chatId);
    }
    if (!study.grade) return this.askGrade(chatId, lang);
    return this.homeWithKeyboard(chatId, user, lang);
  }

  private askLang(chatId: number) {
    return this.io.send(chatId, say.chooseLang, {
      inline_keyboard: [
        [{ text: '🇺🇿 O‘zbekcha', callback_data: 'l|uz' }],
        [{ text: '🇷🇺 Русский', callback_data: 'l|ru' }],
        [{ text: '🇬🇧 English', callback_data: 'l|en' }],
      ],
    });
  }

  private askGrade(chatId: number, lang: Lang) {
    return this.io.send(chatId, say.chooseGrade[lang], {
      inline_keyboard: [[6, 7].map((n) => ({ text: say.grade(n)[lang], callback_data: `g|${n}` }))],
    });
  }

  /** /lessons, /practice, /daily, /solve, /progress, /settings, /about and their menu buttons. */
  async command(chatId: number, user: StudyUser, name: string): Promise<boolean> {
    const { p, lang, study } = this.load(user);
    switch (name) {
      case 'menu':
        await this.home(chatId, user);
        return true;
      case 'lessons':
        await this.lessons(chatId, lang, study);
        return true;
      case 'practice':
        await this.practice(chatId, user);
        return true;
      case 'daily':
        await this.daily(chatId, user);
        return true;
      case 'solve':
        await this.io.send(chatId, say.solveHow[lang], { inline_keyboard: [this.homeRow(lang)] });
        return true;
      case 'progress':
        await this.progress(chatId, p, lang, study);
        return true;
      case 'settings':
        await this.settings(chatId, user, lang, study);
        return true;
      case 'about':
        await this.io.animation(chatId);
        await this.io.send(chatId, say.about[lang], { inline_keyboard: [this.homeRow(lang)] });
        return true;
      case 'app':
        await this.io.openApp(chatId, lang);
        return true;
    }
    return false;
  }

  /** Anything typed that is not a command: a menu button, a homework problem, a topic word. */
  async onText(chatId: number, user: StudyUser, raw: string) {
    const { p, lang, study } = this.load(user);
    const text = raw.trim();

    for (const [key, label] of Object.entries(say.menu)) {
      if (Object.values(label).includes(text)) {
        const name = key === 'solve' ? 'solve' : key;
        await this.command(chatId, user, name);
        return;
      }
    }

    if (solveProblem(text)) {
      study.lastProblem = text.slice(0, 80);
      study.solved = (study.solved ?? 0) + 1;
      this.save(user, p);
      await this.io.card(chatId, this.solutionCaption(text, 1, lang), this.boardVisual(text, 1, lang), lang, this.solutionKeyboard(text, 1, lang, study.grade), { fallback: this.solutionText(text, 1, lang) });
      return;
    }

    const topic = findTopic(text, study.grade);
    // The topic search matches most real school questions, so AI goes first for those too: they are where the lesson helps most.
    if ((!topic || isQuestion(text)) && (await this.aiAnswer(chatId, user, text, lang, study.grade, topic))) return;

    if (topic) {
      await this.io.send(chatId, say.topicFound(topic.title[lang])[lang], { inline_keyboard: this.topicRows(topic, lang) });
      return;
    }

    await this.io.send(chatId, say.notUnderstood[lang], this.menuKeyboard(lang));
  }

  private topicRows(topic: Topic, lang: Lang): Button[][] {
    return [
      [{ text: say.openLesson[lang], callback_data: `t|${topic.id}` }],
      [{ text: say.cardPractice[lang], callback_data: this.roundData('R', topic.id, this.newSeed(), 0, 0, 0) }],
      this.homeRow(lang),
    ];
  }

  /**
   * Returns true when the student got a reply here. False means carry on exactly as if there were no AI:
   * no key, a failed or timed-out call, or a reply the guard rejected.
   * Holds no saved progress across the wait, so it cannot overwrite what the student does meanwhile.
   */
  private async aiAnswer(chatId: number, user: StudyUser, text: string, lang: Lang, grade: number | null, topic?: Topic): Promise<boolean> {
    if (!this.ask || !hasWord(text)) return false;
    void this.io.typing(chatId);
    const typing = setInterval(() => void this.io.typing(chatId), 4000);
    let answer: Awaited<ReturnType<AskTutor>>;
    try {
      answer = await this.ask({ userId: user.id, question: text, lang, grade, topic, day: this.today() });
    } catch (e) {
      console.warn('[tutor] chat question failed:', (e as Error).message);
      return false;
    } finally {
      clearInterval(typing);
    }
    if (answer.kind === 'reply') {
      // The text is the model's, so it is escaped: a bare "&" would make Telegram refuse the whole message.
      await this.io.send(chatId, `${escapeHtml(answer.text)}\n\n<i>${say.aiLabel[lang]}</i>`, {
        inline_keyboard: topic ? this.topicRows(topic, lang) : [this.homeRow(lang)],
      });
      return true;
    }
    // With a lesson to offer, that reply is still useful. Otherwise "I did not understand" would be untrue: say what happened.
    if (answer.kind === 'limit' && !topic) {
      await this.io.send(chatId, say.aiLimit[lang], this.menuKeyboard(lang));
      return true;
    }
    return false;
  }

  async onNonText(chatId: number, user: StudyUser) {
    const { lang } = this.load(user);
    await this.io.send(chatId, say.nonText[lang], { inline_keyboard: [this.homeRow(lang)] });
  }

  /** Returns true when the button belonged to this module. */
  async onCallback(chatId: number, messageId: number, isPhoto: boolean, user: StudyUser, data: string): Promise<boolean> {
    const parts = data.split('|');
    const kind = parts[0];
    const { p, lang, study } = this.load(user);
    switch (kind) {
      case 'noop':
        return true;
      case 'l': {
        const chosen = parts[1] as Lang;
        if (chosen !== 'uz' && chosen !== 'ru' && chosen !== 'en') return true;
        p.lang = chosen;
        this.save(user, p);
        await this.io.clearButtons(chatId, messageId);
        if (!study.grade) await this.askGrade(chatId, chosen);
        else await this.homeWithKeyboard(chatId, user, chosen);
        return true;
      }
      case 'g': {
        const grade = Number(parts[1]);
        if (grade !== 6 && grade !== 7) return true;
        const first = !study.grade;
        study.grade = grade;
        this.save(user, p);
        await this.io.clearButtons(chatId, messageId);
        if (first) {
          await this.io.send(chatId, say.welcome(escapeHtml(user.first_name ?? ''), grade)[lang], this.replyKeyboard(lang));
          await this.io.send(chatId, say.whatNext[lang], {
            inline_keyboard: [
              [{ text: say.startFirst[lang], callback_data: 'd' }],
              [{ text: say.menu.lessons[lang], callback_data: 'ls' }],
            ],
          });
        } else {
          await this.home(chatId, user);
        }
        return true;
      }
      case 'm':
        await this.home(chatId, user);
        return true;
      case 'ls':
        await this.lessons(chatId, lang, study);
        return true;
      case 'su':
        await this.subjectTopics(chatId, lang, study, parts[1]);
        return true;
      case 't':
      case 'c':
        await this.io.clearButtons(chatId, messageId);
        await this.lessonCard(chatId, lang, parts[1], Number(parts[2] ?? 0));
        return true;
      case 'p':
        await this.practice(chatId, user);
        return true;
      case 'd':
        await this.daily(chatId, user);
        return true;
      case 'q': {
        const [, mode, topicId, seed, i, right, xp] = parts;
        const topic = topicById(topicId);
        if (!topic) return this.expired(chatId, lang);
        await this.io.clearButtons(chatId, messageId);
        await this.sendQuestion(chatId, user, mode as Mode, topic, Number(seed), Number(i), Number(right), Number(xp));
        return true;
      }
      case 'a':
      case 'h': {
        const [, mode, topicId, seed, i, right, xp, mask, hint, choice] = parts;
        const topic = topicById(topicId);
        if (!topic) return this.expired(chatId, lang);
        const state = { mode: mode as Mode, topic, seed: Number(seed), i: Number(i), right: Number(right), xp: Number(xp), mask: Number(mask), hint: Number(hint) };
        if (kind === 'h') {
          state.hint = Math.min(2, state.hint + 1);
          const q = questionFor(topic, state.seed, state.i);
          await this.io.edit(chatId, messageId, isPhoto, this.questionText(state, q, lang), this.questionKeyboard(state, q, lang));
        } else {
          await this.answer(chatId, messageId, isPhoto, user, state, Number(choice));
        }
        return true;
      }
      case 'sh':
        await this.io.send(chatId, say.solveHow[lang], { inline_keyboard: [this.homeRow(lang)] });
        return true;
      case 'sv': {
        const shown = Number(parts[1]);
        const problem = study.lastProblem;
        if (!problem || !solveProblem(problem)) {
          await this.io.send(chatId, say.problemGone[lang]);
          return true;
        }
        const keys = this.solutionKeyboard(problem, shown, lang, study.grade);
        if (isPhoto) await this.io.editCard(chatId, messageId, this.solutionCaption(problem, shown, lang), this.boardVisual(problem, shown, lang), lang, keys, { fallback: this.solutionText(problem, shown, lang) });
        else await this.io.edit(chatId, messageId, false, this.solutionText(problem, shown, lang), keys);
        return true;
      }
      case 'r':
        await this.progress(chatId, p, lang, study);
        return true;
      case 'lb':
        await this.leaderboard(chatId, user, lang);
        return true;
      case 'st':
        await this.settings(chatId, user, lang, study);
        return true;
      case 'cl':
        await this.askLang(chatId);
        return true;
      case 'cg':
        await this.askGrade(chatId, lang);
        return true;
      case 'rm':
        setReminders(user.id, parts[1] === 'on');
        await this.settings(chatId, user, lang, study);
        return true;
      case 'ab':
        await this.io.send(chatId, say.about[lang], { inline_keyboard: [this.homeRow(lang)] });
        return true;
      case 'ap':
        await this.io.openApp(chatId, lang, parts[1]);
        return true;
    }
    return false;
  }

  private async expired(chatId: number, lang: Lang) {
    await this.io.send(chatId, say.expired[lang], this.menuKeyboard(lang));
    return true;
  }

  /* ---------- lessons ---------- */

  private async lessons(chatId: number, lang: Lang, study: StudyProgress) {
    if (!study.grade) return this.askGrade(chatId, lang);
    const list = subjectsForGrade(study.grade);
    if (list.length === 1) return this.subjectTopics(chatId, lang, study, list[0].id);
    return this.io.send(chatId, say.chooseSubject[lang], {
      inline_keyboard: [...list.map((s) => [{ text: s.title[lang], callback_data: `su|${s.id}` }]), this.homeRow(lang)],
    });
  }

  private async subjectTopics(chatId: number, lang: Lang, study: StudyProgress, subjectId: string) {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return this.expired(chatId, lang);
    const rows: Button[][] = topicsOf(subject.id).map((t) => {
      const earned = study.topics[t.id]?.stars ?? 0;
      return [{ text: `${t.title[lang]}${earned ? ` ${stars(earned)}` : ''}`, callback_data: `t|${t.id}` }];
    });
    return this.io.send(chatId, say.chooseTopic(`<b>${subject.title[lang]}</b>`, subject.book)[lang], {
      inline_keyboard: [...rows, this.homeRow(lang)],
    });
  }

  private async lessonCard(chatId: number, lang: Lang, topicId: string, index: number) {
    const topic = topicById(topicId);
    const card = topic?.cards[index];
    if (!topic || !card) return this.expired(chatId, lang);
    const last = index === topic.cards.length - 1;
    const practice: Button = { text: say.cardPractice[lang], callback_data: this.roundData('R', topic.id, this.newSeed(), 0, 0, 0) };
    const rows: Button[][] = last
      ? [[practice]]
      : [[{ text: say.cardNext[lang], callback_data: `c|${topic.id}|${index + 1}` }], [{ text: say.skipToPractice[lang], callback_data: practice.callback_data }]];
    if (last && topic.appLink) rows.push([{ text: say.tryInApp[lang], callback_data: `ap|${topic.appLink}` }]);
    rows.push(this.homeRow(lang));
    const ribbon = `${topic.title[lang]} · ${index + 1}/${topic.cards.length}`;
    const head = `<b>${ribbon}</b>\n<i>${topic.book[lang]}</i>`;
    // With a picture, the ribbon on it says where we are, so the caption is only the lesson text.
    await this.io.card(chatId, card.visual ? card.text[lang] : `${head}\n\n${card.text[lang]}`, card.visual, lang, { inline_keyboard: rows }, { ribbon, fallback: `${head}\n\n${card.text[lang]}` });
  }

  /* ---------- practice ---------- */

  private newSeed = () => Math.floor(Math.random() * 1_000_000);

  private roundData(mode: Mode, topicId: string, seed: number, i: number, right: number, xp: number) {
    return `q|${mode}|${topicId}|${seed}|${i}|${right}|${xp}`;
  }

  /** The topic to practise next: the first not yet tried, otherwise the weakest. */
  pick(study: StudyProgress, grade: number): { topic: Topic; why: 'new' | 'weak' } {
    const list = topicsForGrade(grade);
    const fresh = list.find((t) => !study.topics[t.id]);
    if (fresh) return { topic: fresh, why: 'new' };
    const weakest = [...list].sort((a, b) => {
      const x = study.topics[a.id], y = study.topics[b.id];
      return x.stars - y.stars || x.lastAt - y.lastAt;
    })[0];
    return { topic: weakest, why: 'weak' };
  }

  private async practice(chatId: number, user: StudyUser) {
    const { lang, study } = this.load(user);
    if (!study.grade) return this.askGrade(chatId, lang);
    const { topic, why } = this.pick(study, study.grade);
    await this.sendQuestion(chatId, user, 'R', topic, this.newSeed(), 0, 0, 0, say.practiceIntro(topic.title[lang], why)[lang]);
  }

  private async daily(chatId: number, user: StudyUser) {
    const { lang, study } = this.load(user);
    if (!study.grade) return this.askGrade(chatId, lang);
    const day = this.today();
    if (study.daily?.day === day && study.daily.done) {
      return this.io.send(chatId, say.dailyDone[lang], {
        inline_keyboard: [[{ text: bare(say.menu.practice[lang]), callback_data: 'p' }], this.homeRow(lang)],
      });
    }
    const { topic, seed } = dailyFor(study.grade, day);
    await this.sendQuestion(chatId, user, 'D', topic, seed, 0, 0, 0);
  }

  private questionText(
    st: { mode: Mode; topic: Topic; i: number; mask: number; hint: number },
    q: Question,
    lang: Lang,
    intro?: string,
  ) {
    // With a picture, the ribbon on it says which topic and which question; a text-only question carries that line itself.
    const head = q.visual ? '' : `<b>${this.ribbonOf(st, lang)}</b>\n\n`;
    let out = `${intro ? `${intro}\n\n` : ''}${head}${q.prompt[lang]}`;
    const tries = popcount(st.mask);
    if (tries > 0) out += `\n\n<i>${say.notYet[Math.min(tries - 1, say.notYet.length - 1)][lang]}</i>`;
    if (st.hint > 0) out += `\n\n<blockquote><b>${say.hintLabel[lang]}</b> ${q.hints.slice(0, st.hint).map((h) => h[lang]).join('\n')}</blockquote>`;
    return out;
  }

  private ribbonOf(st: { mode: Mode; topic: Topic; i: number }, lang: Lang) {
    return st.mode === 'D' ? say.dailyRibbon[lang] : `${st.topic.title[lang]} · ${st.i + 1}/${ROUND}`;
  }

  private questionKeyboard(
    st: { mode: Mode; topic: Topic; seed: number; i: number; right: number; xp: number; mask: number; hint: number },
    q: Question,
    lang: Lang,
  ): Inline {
    const base = `${st.mode}|${st.topic.id}|${st.seed}|${st.i}|${st.right}|${st.xp}|${st.mask}|${st.hint}`;
    const buttons: Button[] = q.choices.map((c, idx) =>
      st.mask & (1 << idx) ? { text: `✕ ${c[lang]}`, callback_data: 'noop' } : { text: c[lang], callback_data: `a|${base}|${idx}` },
    );
    const short = q.choices.every((c) => c[lang].length <= 14);
    const rows: Button[][] = short ? [buttons.slice(0, 2), buttons.slice(2, 4)].filter((r) => r.length) : buttons.map((b) => [b]);
    const row: Button[] = [];
    if (st.hint < 2) row.push({ text: st.hint === 0 ? say.hint[lang] : say.hintMore[lang], callback_data: `h|${base}` });
    row.push({ text: say.home[lang], callback_data: 'm' });
    rows.push(row);
    return { inline_keyboard: rows };
  }

  private async sendQuestion(chatId: number, user: StudyUser, mode: Mode, topic: Topic, seed: number, i: number, right: number, xp: number, intro?: string) {
    const { p, lang } = this.load(user);
    if (mode === 'R' && i >= ROUND) return this.roundEnd(chatId, user, p, lang, topic, right, xp);
    const q = questionFor(topic, seed, i);
    const st = { mode, topic, seed, i, right, xp, mask: 0, hint: 0 };
    await this.io.card(chatId, this.questionText(st, q, lang, intro), q.visual, lang, this.questionKeyboard(st, q, lang), { ribbon: this.ribbonOf(st, lang), fallback: `<b>${this.ribbonOf(st, lang)}</b>\n\n${this.questionText(st, q, lang, intro)}` });
  }

  private async answer(
    chatId: number,
    messageId: number,
    isPhoto: boolean,
    user: StudyUser,
    st: { mode: Mode; topic: Topic; seed: number; i: number; right: number; xp: number; mask: number; hint: number },
    choice: number,
  ) {
    const { p, lang, study } = this.load(user);
    const q = questionFor(st.topic, st.seed, st.i);
    const correct = choice === q.correct;

    if (!correct) {
      st.mask |= 1 << choice;
      const tries = popcount(st.mask);
      if (tries < 3) {
        // Each wrong try opens the next hint rung; the answer itself is not given yet.
        st.hint = Math.max(st.hint, Math.min(2, tries));
        await this.io.edit(chatId, messageId, isPhoto, this.questionText(st, q, lang), this.questionKeyboard(st, q, lang));
        return;
      }
    }

    const wrongTries = popcount(st.mask);
    const before = levelOf(this.totalXp(p));
    const key = hashString(`${st.topic.id}:${st.seed}:${st.i}`);
    const earned = scoreAnswer(study, st.topic.id, key, wrongTries, Date.now());
    const grew = correct ? this.touchStreak(p) : null;
    if (st.mode === 'D') study.daily = { day: this.today(), done: true };
    this.save(user, p);

    const head = q.visual ? '' : `<b>${this.ribbonOf(st, lang)}</b>\n\n`;
    let html = `${head}${q.prompt[lang]}\n\n`;
    if (correct) {
      html += `✓ <b>${say.right[key % say.right.length][lang]}</b> ${q.choices[q.correct][lang]}${earned ? ` · +${earned} XP` : ''}`;
    } else {
      html += `${say.theAnswer[lang]}: <b>${q.choices[q.correct][lang]}</b>`;
    }
    html += `\n\n<blockquote expandable>${explainWhy(q, lang)}</blockquote>`;
    if (grew !== null) html += `\n\n${say.streakUp(grew)[lang]}`;
    const after = levelOf(this.totalXp(p));
    if (after > before) html += `\n${say.levelUp(LEVEL_NAMES[after][lang])[lang]}`;

    const firstTry = correct && wrongTries === 0;
    const right = st.right + (firstTry ? 1 : 0);
    const xp = st.xp + earned;
    const rows: Button[][] = [];
    if (st.mode === 'D') {
      html += `\n\n${say.dailyEnd[lang]}`;
      rows.push([{ text: say.menu.practice[lang], callback_data: 'p' }], this.homeRow(lang));
    } else {
      const next = st.i + 1;
      rows.push([{ text: next >= ROUND ? say.seeResult[lang] : say.nextQuestion[lang], callback_data: this.roundData('R', st.topic.id, st.seed, next, right, xp) }]);
    }
    await this.io.edit(chatId, messageId, isPhoto, html, { inline_keyboard: rows });
  }

  private async roundEnd(chatId: number, user: StudyUser, p: Saved, lang: Lang, topic: Topic, right: number, xp: number) {
    const study = p.bot;
    const earned = right >= ROUND ? 3 : right >= ROUND - 2 ? 2 : 1;
    const t = study.topics[topic.id] ?? { answered: 0, right: 0, stars: 0, rounds: 0, lastAt: 0 };
    study.topics[topic.id] = { ...t, stars: Math.max(t.stars, earned), rounds: t.rounds + 1, lastAt: Date.now() };
    this.save(user, p);
    const next = nextTopic(topic.id);
    const rows: Button[][] = [];
    if (next) rows.push([{ text: say.nextTopic(next.title[lang])[lang], callback_data: `t|${next.id}` }]);
    rows.push([{ text: say.again[lang], callback_data: this.roundData('R', topic.id, this.newSeed(), 0, 0, 0) }]);
    if (right < ROUND - 2) rows.push([{ text: say.reviewLesson[lang], callback_data: `t|${topic.id}` }]);
    rows.push(this.homeRow(lang));
    const visual: Visual = { t: 'result', title: topic.title[lang], stars: earned as 1 | 2 | 3, right, total: ROUND, xp, streak: this.liveStreak(p) };
    await this.io.card(chatId, `<b>${topic.title[lang]}</b>\n${say.praise(right, ROUND)[lang]}`, visual, lang, { inline_keyboard: rows }, {
      effect: earned === 3,
      fallback: `${say.roundDone(topic.title[lang], right, ROUND, stars(earned), xp)[lang]}\n\n${say.praise(right, ROUND)[lang]}`,
    });
  }

  /* ---------- homework helper ---------- */

  private solutionText(problem: string, shown: number, lang: Lang) {
    const s = solveProblem(problem)!;
    let out = `${say.solveTitle[lang]} <code>${escapeHtml(s.problem)}</code>`;
    s.steps.slice(0, shown).forEach((step, i) => {
      out += `\n\n${say.step(i + 1)[lang]} ${step[lang]}`;
    });
    if (shown > s.steps.length) out += `\n\n${say.answer[lang]} <b>${s.answer[lang]}</b>`;
    else out += `\n\n<i>${say.tryFirst[lang]}</i>`;
    return out;
  }

  /** The chalkboard: the problem on top, then each step's maths line as it is revealed. */
  private boardVisual(problem: string, shown: number, lang: Lang): Visual {
    const s = solveProblem(problem)!;
    const upTo = Math.min(shown, s.steps.length);
    const rows = [{ text: s.problem, n: null as number | null }];
    s.steps.slice(0, upTo).forEach((step, i) => rows.push({ text: mathLine(step[lang]) ?? CHECK_WORD[lang], n: i + 1 }));
    const finished = shown > s.steps.length;
    return { t: 'board', rows, at: upTo, total: s.steps.length, answer: finished ? s.answer[lang].replace(/<[^>]+>/g, '') : undefined };
  }

  /** What goes under the board: this step in words (the board itself carries the problem and the maths). */
  private solutionCaption(problem: string, shown: number, lang: Lang) {
    const s = solveProblem(problem)!;
    if (shown > s.steps.length) return `${say.answer[lang]} <b>${s.answer[lang]}</b>`;
    return `${say.step(shown)[lang]} ${s.steps[shown - 1][lang]}\n\n<i>${say.tryFirst[lang]}</i>`;
  }

  private solutionKeyboard(problem: string, shown: number, lang: Lang, grade: number | null): Inline {
    const s = solveProblem(problem)!;
    if (shown > s.steps.length) {
      const six = grade === 6;
      const topicId =
        s.kind === 'equation' ? (six ? 'm6-eq' : 'a7-eq')
        : s.kind === 'percent' ? 'm6-percent'
        : s.kind === 'square' ? 'a7-fsu'
        : s.kind === 'simplify' ? (six ? 'm6-expr' : 'a7-poly')
        : /\^/.test(problem) ? 'a7-power'
        : '/' === problem.match(/[/]/)?.[0] ? 'm6-frac'
        : six ? 'm6-expr' : 'a7-expr';
      return {
        inline_keyboard: [
          [{ text: say.similar[lang], callback_data: this.roundData('R', topicId, this.newSeed(), 0, 0, 0) }],
          this.homeRow(lang),
        ],
      };
    }
    const last = shown === s.steps.length;
    return { inline_keyboard: [[{ text: last ? say.showAnswer[lang] : say.nextStep[lang], callback_data: `sv|${shown + 1}` }], this.homeRow(lang)] };
  }

  /* ---------- progress ---------- */

  private async progress(chatId: number, p: Saved, lang: Lang, study: StudyProgress) {
    if (!study.grade) return this.askGrade(chatId, lang);
    const list = topicsForGrade(study.grade);
    const records = list.map((t) => study.topics[t.id]).filter(Boolean);
    const answered = records.reduce((a, t) => a + t.answered, 0);
    const right = records.reduce((a, t) => a + t.right, 0);
    const xp = this.totalXp(p);
    const level = levelOf(xp);
    const toNext = LEVELS[level + 1] ? LEVELS[level + 1] - xp : null;
    const doneCount = records.filter((t) => t.rounds > 0).length;
    const pct = answered ? Math.round((right / answered) * 100) : 0;
    let tail = '';
    const practised = list.filter((t) => study.topics[t.id]?.answered);
    if (practised.length) {
      const weakest = [...practised].sort((a, b) => study.topics[a.id].right / study.topics[a.id].answered - study.topics[b.id].right / study.topics[b.id].answered)[0];
      if (study.topics[weakest.id].right < study.topics[weakest.id].answered) tail = say.weakest(weakest.title[lang])[lang];
    }
    const full = `${say.progressTitle[lang]}\n\n${say.progressBody(this.liveStreak(p), xp, LEVEL_NAMES[level][lang], toNext, doneCount, list.length, answered, pct)[lang]}${tail}`;
    const { visual } = this.snapshot(p, lang, study, '');
    // The card already shows level, points and streak, so the caption keeps only the three numbers it does not.
    const caption = `${say.progressStats(doneCount, list.length, answered, pct)[lang]}${tail}`;
    return this.io.card(chatId, caption, visual, lang, {
      inline_keyboard: [
        [{ text: say.leaderboard[lang], callback_data: 'lb' }, { text: bare(say.menu.practice[lang]), callback_data: 'p' }],
        this.homeRow(lang),
      ],
    }, { fallback: full });
  }

  private async leaderboard(chatId: number, user: StudyUser, lang: Lang) {
    const rows = Object.entries(allProgress())
      .map(([id, e]) => {
        const pr = e.progress as Saved;
        return { id: Number(id), name: e.name ?? '?', xp: (pr?.bot?.xp ?? 0) + (pr?.acad?.xp ?? 0) };
      })
      .filter((r) => r.xp > 0)
      .sort((a, b) => b.xp - a.xp);
    const medal = ['1.', '2.', '3.', '4.', '5.'];
    // Only the first letter of a name: a live class scoreboard must not expose children.
    const label = (r: { id: number; name: string }) => (r.id === user.id ? `<b>${say.you[lang]}</b>` : `${escapeHtml(Array.from(r.name)[0] ?? '?')}***`);
    let html = `${say.leaderTitle[lang]}\n\n`;
    if (!rows.length) html += say.leaderEmpty[lang];
    html += rows.slice(0, 5).map((r, i) => `${medal[i]} ${label(r)} — ${r.xp} XP`).join('\n');
    const mine = rows.findIndex((r) => r.id === user.id);
    if (mine >= 5) html += `\n…\n${mine + 1}. ${label(rows[mine])} — ${rows[mine].xp} XP`;
    if (rows.length) html += `\n\n${say.leaderNote[lang]}`;
    return this.io.send(chatId, html, { inline_keyboard: [[{ text: bare(say.menu.progress[lang]), callback_data: 'r' }], this.homeRow(lang)] });
  }

  private async settings(chatId: number, user: StudyUser, lang: Lang, study: StudyProgress) {
    const on = remindersOn(user.id);
    return this.io.send(chatId, say.settings(LANG_NAMES[lang], study.grade, on)[lang], {
      inline_keyboard: [
        [{ text: say.changeLang[lang], callback_data: 'cl' }],
        [{ text: say.changeGrade[lang], callback_data: 'cg' }],
        [{ text: on ? say.remindOff[lang] : say.remindOn[lang], callback_data: `rm|${on ? 'off' : 'on'}` }],
        [{ text: say.aboutBtn[lang], callback_data: 'ab' }],
        this.homeRow(lang),
      ],
    });
  }
}
