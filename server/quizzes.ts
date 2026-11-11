import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { HttpError } from './http.ts';
import { readJsonFile, writeJsonAtomic } from './jsonFile.ts';

/**
 * A quiz made by a teacher: by hand, from a textbook topic, or drafted by AI and then approved by the teacher.
 * Every answer is stored as data and checked by code on the server. Students never receive it before the reveal.
 */
/** Quizzes are in English only. (Older saved quizzes may still say another language; it is ignored and set to 'en' when they are loaded.) */
export type QuizLang = 'en';
export type QuestionKind = 'choice' | 'number' | 'text';
export type QuizSource = 'hand' | 'textbook' | 'ai' | 'template';

export interface QuizQuestion {
  id: string;
  kind: QuestionKind;
  prompt: string;
  /** choice: 2 to 6 answers. */
  choices?: string[];
  /** choice: the index of the right answer. */
  correct?: number;
  /** number: the right answer. */
  answer?: number;
  /** text: the word or short phrase to type, and other spellings that are also right. */
  text?: string;
  accept?: string[];
  explain?: string;
  /** A picture made by the server from a textbook visual. Teachers cannot upload their own. */
  svg?: string;
}

export interface Quiz {
  id: string;
  ownerId: string;
  title: string;
  subject: string;
  lang: QuizLang;
  source: QuizSource;
  questions: QuizQuestion[];
  createdAt: number;
  updatedAt: number;
}

export interface QuizSummary {
  id: string;
  title: string;
  subject: string;
  lang: QuizLang;
  source: QuizSource;
  questions: number;
  updatedAt: number;
}

export const LIMITS = { title: 80, subject: 40, prompt: 400, choice: 120, word: 60, explain: 300, questions: 40, perTeacher: 100 };
const SOURCES: QuizSource[] = ['hand', 'textbook', 'ai', 'template'];

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max) : '';

const newId = () => randomBytes(6).toString('hex');

/** Typed answers are compared without capitals, extra spaces, end punctuation or the different apostrophes of Uzbek (o', o‘, oʻ). */
export const normalizeAnswer = (s: string): string =>
  s.normalize('NFKC').toLowerCase().replace(/[’‘ʻʼ`´ʹ′]/g, "'").replace(/[.,!?;:"«»()]/g, ' ').replace(/\s+/g, ' ').trim();

/** Turns whatever the browser sent into a safe question, or says exactly what is wrong. */
export function normalizeQuestion(raw: unknown, index: number, keepSvg?: string): QuizQuestion {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const where = `question ${index + 1}`;
  const kind: QuestionKind = r.kind === 'number' ? 'number' : r.kind === 'text' ? 'text' : 'choice';
  const prompt = clean(r.prompt, LIMITS.prompt);
  if (!prompt) throw new HttpError(400, `${where}: write the question`);
  const id = typeof r.id === 'string' && /^[a-f0-9]{6,16}$/.test(r.id) ? r.id : newId();
  const explain = clean(r.explain, LIMITS.explain);
  const q: QuizQuestion = { id, kind, prompt, ...(explain ? { explain } : {}), ...(keepSvg ? { svg: keepSvg } : {}) };
  if (kind === 'number') {
    const n = typeof r.answer === 'number' ? r.answer : Number(String(r.answer ?? '').replace(',', '.'));
    if (!Number.isFinite(n) || Math.abs(n) > 1e9) throw new HttpError(400, `${where}: the answer must be a number`);
    q.answer = n;
    return q;
  }
  if (kind === 'text') {
    const text = clean(r.text, LIMITS.word);
    if (!text) throw new HttpError(400, `${where}: write the answer`);
    const rawAccept = Array.isArray(r.accept) ? r.accept : typeof r.accept === 'string' ? r.accept.split(',') : [];
    const accept: string[] = [];
    for (const a of rawAccept) {
      const w = clean(a, LIMITS.word);
      if (w && normalizeAnswer(w) !== normalizeAnswer(text) && !accept.some((x) => normalizeAnswer(x) === normalizeAnswer(w))) accept.push(w);
    }
    q.text = text;
    if (accept.length) q.accept = accept.slice(0, 5);
    return q;
  }
  const choicesRaw = Array.isArray(r.choices) ? r.choices : [];
  const choices = choicesRaw.map((c) => clean(c, LIMITS.choice));
  if (choices.length < 2 || choices.length > 6) throw new HttpError(400, `${where}: give 2 to 6 answers`);
  if (choices.some((c) => !c)) throw new HttpError(400, `${where}: an answer is empty`);
  if (new Set(choices).size !== choices.length) throw new HttpError(400, `${where}: two answers are the same`);
  const correct = Number(r.correct);
  if (!Number.isInteger(correct) || correct < 0 || correct >= choices.length) throw new HttpError(400, `${where}: pick the right answer`);
  q.choices = choices;
  q.correct = correct;
  return q;
}

/**
 * `previous` is the saved version of this quiz; `fresh` finds a picture the server drew a moment ago for this teacher
 * (a textbook question that was not saved yet). A browser can never send a picture of its own: only these two sources count.
 */
export function normalizeQuiz(raw: unknown, previous?: Quiz, fresh?: (questionId: string) => string | undefined) {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const title = clean(r.title, LIMITS.title);
  if (!title) throw new HttpError(400, 'give the quiz a title');
  const lang: QuizLang = 'en';
  const source = SOURCES.includes(r.source as QuizSource) ? (r.source as QuizSource) : 'hand';
  const list = Array.isArray(r.questions) ? r.questions : [];
  if (list.length < 1) throw new HttpError(400, 'add at least one question');
  if (list.length > LIMITS.questions) throw new HttpError(400, `a quiz can have at most ${LIMITS.questions} questions`);
  const oldSvg = new Map((previous?.questions ?? []).filter((q) => q.svg).map((q) => [q.id, q.svg as string]));
  const questions = list.map((q, i) => {
    const { id, dropPicture } = (q ?? {}) as { id?: unknown; dropPicture?: unknown };
    const svg = typeof id === 'string' && dropPicture !== true ? (oldSvg.get(id) ?? fresh?.(id)) : undefined;
    return normalizeQuestion(q, i, svg);
  });
  const ids = new Set<string>();
  for (const q of questions) {
    while (ids.has(q.id)) q.id = newId();
    ids.add(q.id);
  }
  return { title, subject: clean(r.subject, LIMITS.subject), lang, source, questions };
}

/** Is this answer right? The only place that decides. */
export function isCorrect(q: QuizQuestion, input: { choice?: unknown; value?: unknown; text?: unknown }): boolean {
  if (q.kind === 'choice') return Number.isInteger(input.choice) && input.choice === q.correct;
  if (q.kind === 'text') {
    const typed = typeof input.text === 'string' ? normalizeAnswer(input.text.slice(0, 200)) : '';
    return typed !== '' && [q.text ?? '', ...(q.accept ?? [])].some((a) => normalizeAnswer(a) === typed);
  }
  const v = typeof input.value === 'number' ? input.value : Number(String(input.value ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(v) || q.answer === undefined) return false;
  return Math.abs(v - q.answer) <= Math.max(1e-9, Math.abs(q.answer) * 1e-9);
}

/** The right answer as text, for the reveal and the results. */
export const answerText = (q: QuizQuestion): string =>
  q.kind === 'choice' ? (q.choices?.[q.correct ?? -1] ?? '') : q.kind === 'text' ? (q.text ?? '') : String(q.answer ?? '');

export function createQuizStore(opts: { dir: string; now?: () => number }) {
  const now = opts.now ?? Date.now;
  const file = path.join(opts.dir, 'quizzes.json');
  const db: { quizzes: Quiz[] } = readJsonFile(file, { quizzes: [] });
  for (const q of db.quizzes) q.lang = 'en';
  const save = () => writeJsonAtomic(file, db);

  const summary = (q: Quiz): QuizSummary => ({
    id: q.id, title: q.title, subject: q.subject, lang: q.lang, source: q.source, questions: q.questions.length, updatedAt: q.updatedAt,
  });
  const mine = (ownerId: string, id: string) => {
    const q = db.quizzes.find((x) => x.id === id && x.ownerId === ownerId);
    if (!q) throw new HttpError(404, 'quiz not found');
    return q;
  };

  return {
    list: (ownerId: string) => db.quizzes.filter((q) => q.ownerId === ownerId).sort((a, b) => b.updatedAt - a.updatedAt).map(summary),
    get: (ownerId: string, id: string) => mine(ownerId, id),
    create(ownerId: string, raw: unknown, fresh?: (questionId: string) => string | undefined): Quiz {
      if (db.quizzes.filter((q) => q.ownerId === ownerId).length >= LIMITS.perTeacher) throw new HttpError(409, `at most ${LIMITS.perTeacher} quizzes each`);
      const body = normalizeQuiz(raw, undefined, fresh);
      const quiz: Quiz = { id: newId(), ownerId, ...body, createdAt: now(), updatedAt: now() };
      db.quizzes.push(quiz);
      save();
      return quiz;
    },
    update(ownerId: string, id: string, raw: unknown, fresh?: (questionId: string) => string | undefined): Quiz {
      const old = mine(ownerId, id);
      Object.assign(old, normalizeQuiz(raw, old, fresh), { updatedAt: now() });
      save();
      return old;
    },
    remove(ownerId: string, id: string) {
      const q = mine(ownerId, id);
      db.quizzes.splice(db.quizzes.indexOf(q), 1);
      save();
    },
  };
}

export type QuizStore = ReturnType<typeof createQuizStore>;
