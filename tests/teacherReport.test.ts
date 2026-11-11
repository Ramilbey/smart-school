import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { g4Homework } from '../shared/lessons/g4Fractions.ts';
import { g7Problem, g7Quiz } from '../shared/lessons/g7Linear.ts';
import { buildTeacherReport, shortName, type StoredEntry } from '../shared/report.ts';
import { hideOtherNames, parseTeacherIds, teacherAccess } from '../server/report.ts';
import type { TeacherReport } from '../shared/report.ts';
import { signInitData } from '../server/telegramAuth.ts';

// Isolated data folder: these tests must never touch the real data/ files.
const dir = mkdtempSync(path.join(tmpdir(), 'ss-report-'));
process.env.DATA_DIR = dir;

const ALL_RIGHT = Object.fromEntries(g7Quiz.map((q) => [q.id, q.correct]));
const g7Entry = (name: string | undefined, last: Record<string, string> | null, problem: object, extra: object = {}): StoredEntry => ({
  name,
  updatedAt: 1_700_000_000_000,
  progress: { v: 1, lang: 'uz', acad: { quiz: { best: 6, last, attempts: 1 }, problem }, kids: { quiz: { best: null, last: null, attempts: 0 }, homework: {} }, ...extra },
});

/* ---------- aggregation ---------- */

test('two Grade 7 students: right and wrong per question, scores, class counts, most-missed question', () => {
  const entries = {
    '5001': g7Entry('Bekzod', { ...ALL_RIGHT, g7q3: 'a', g7q4: 'b' }, { solved: false, wrong: 3, hints: 2 }),
    '5002': g7Entry('Aziza', ALL_RIGHT, { solved: true, wrong: 0, hints: 1 }),
  };
  const g7 = buildTeacherReport(entries, 5002, 42).lessons.find((l) => l.lessonId === 'g7-linear')!;

  assert.deepEqual(g7.questions, g7Quiz.map((q) => q.id));
  assert.deepEqual(g7.students.map((s) => s.name), ['Aziza', 'Bekzod']); // alphabetical
  const [aziza, bekzod] = g7.students;

  assert.equal(aziza.score, 6);
  assert.deepEqual(aziza.marks, [true, true, true, true, true, true]);
  assert.equal(aziza.self, true);
  assert.deepEqual(aziza.problems, [{ id: g7Problem.id, started: true, solved: true, wrong: 0, hints: 1 }]);

  assert.equal(bekzod.score, 4);
  assert.deepEqual(bekzod.marks, [true, true, false, false, true, true]);
  assert.equal(bekzod.answers[2], 'a');
  assert.equal(bekzod.answers[3], 'b');
  assert.equal(bekzod.self, false);
  assert.deepEqual(bekzod.problems, [{ id: g7Problem.id, started: true, solved: false, wrong: 3, hints: 2 }]);

  assert.deepEqual(g7.wrongCount, [0, 0, 1, 1, 0, 0]);
  assert.deepEqual(g7.answeredCount, [2, 2, 2, 2, 2, 2]);
  assert.equal(g7.mostMissed, 2); // tie between Q3 and Q4: the first one
  assert.equal(g7.averageScore, 5);

  // Row keys never reveal Telegram ids.
  assert.ok(g7.students.every((s) => !JSON.stringify(s).includes('500')));
});

test('marks are re-checked against the answer key; the client’s own score and junk values are ignored', () => {
  const entries = {
    // Claims best: 6, but answered Q1 wrong; sends a choice that does not exist for Q2 and a number for Q3.
    '7001': g7Entry('Cheater', { ...ALL_RIGHT, g7q1: 'a', g7q2: 'zzz', g7q3: 3 as unknown as string }, { solved: 'yes', wrong: -4, hints: 99 }),
    // Not a Telegram id: skipped.
    abc: g7Entry('Ghost', ALL_RIGHT, {}),
    // Nothing done in Grade 7: not a row.
    '7002': g7Entry('Idle', null, { solved: false, wrong: 0, hints: 0 }),
    // Broken progress objects must not crash the report.
    '7003': { progress: null, updatedAt: 1 },
    '7004': { progress: 'nonsense', updatedAt: 1 },
    '7005': { progress: { acad: { quiz: { last: ['b'] } } }, updatedAt: 1 },
  } as Record<string, StoredEntry>;
  const g7 = buildTeacherReport(entries).lessons.find((l) => l.lessonId === 'g7-linear')!;

  assert.equal(g7.students.length, 1);
  const [s] = g7.students;
  assert.deepEqual(s.marks, [false, null, null, true, true, true]);
  assert.equal(s.score, 3);
  assert.deepEqual(s.problems[0], { id: g7Problem.id, started: true, solved: false, wrong: 0, hints: 4 });
  assert.deepEqual(g7.answeredCount, [1, 0, 0, 1, 1, 1]);
});

test('a student who only worked on the guided problem appears without a score', () => {
  const g7 = buildTeacherReport({ '8001': g7Entry('Diyor', null, { solved: false, wrong: 1, hints: 1 }) }).lessons[0];
  assert.equal(g7.students.length, 1);
  assert.equal(g7.students[0].score, null);
  assert.deepEqual(g7.students[0].marks, Array(g7Quiz.length).fill(null));
  assert.equal(g7.averageScore, null);
  assert.equal(g7.mostMissed, null);
});

test('Grade 4: quiz marks and both homework problems', () => {
  const entries: Record<string, StoredEntry> = {
    '9001': {
      name: 'Laylo',
      updatedAt: 1,
      progress: {
        kids: {
          quiz: { best: 4, last: { g4q1: 'a', g4q2: 'b', g4q3: 'a', g4q4: 'a', g4q5: 'c' }, attempts: 2 },
          homework: { [g4Homework[0].id]: { solved: true, wrong: 2, hints: 1 } },
        },
      },
    },
  };
  const report = buildTeacherReport(entries);
  assert.equal(report.lessons.find((l) => l.lessonId === 'g7-linear')!.students.length, 0);
  const g4 = report.lessons.find((l) => l.lessonId === 'g4-fractions')!;
  const [laylo] = g4.students;
  assert.deepEqual(laylo.marks, [true, true, true, false, true]);
  assert.equal(laylo.score, 4);
  assert.equal(laylo.attempts, 2);
  assert.deepEqual(
    laylo.problems.map((p) => [p.started, p.solved, p.wrong, p.hints]),
    [[true, true, 2, 1], [false, false, 0, 0]],
  );
  assert.equal(g4.mostMissed, 3);
});

test('no entries: empty lessons, nothing highlighted', () => {
  const report = buildTeacherReport({}, null, 5);
  assert.equal(report.generatedAt, 5);
  for (const l of report.lessons) {
    assert.equal(l.students.length, 0);
    assert.equal(l.mostMissed, null);
    assert.equal(l.averageScore, null);
  }
});

test('display names: first name only, cleaned and short; unnamed students sort last', () => {
  assert.equal(shortName('  Aziza  '), 'Aziza');
  assert.equal(shortName('Dil\u0000noza‮'), 'Dilnoza');
  assert.equal(shortName('Muhammadali   Abdurahmonov'), 'Muhammadali Abdurahmonov');
  assert.equal(shortName('X'.repeat(40)), `${'X'.repeat(23)}…`);
  assert.equal(shortName('   '), null);
  assert.equal(shortName(undefined), null);
  assert.equal(shortName(42), null);

  const g7 = buildTeacherReport({
    '1': g7Entry(undefined, ALL_RIGHT, {}),
    '2': g7Entry('Zarina', ALL_RIGHT, {}),
  }).lessons[0];
  assert.deepEqual(g7.students.map((s) => s.name), ['Zarina', null]);
});

test('the store keeps the short name next to the progress, and the report shows it', async () => {
  const { allProgress, flushStore, putProgress } = await import('../server/store.ts');
  putProgress(6001, { acad: { quiz: { last: ALL_RIGHT } } }, 10, shortName('Sardor'));
  putProgress(6002, { acad: { quiz: { last: { ...ALL_RIGHT, g7q2: 'a' } } } }, 11, null);
  flushStore();
  const saved = JSON.parse(readFileSync(path.join(dir, 'progress.json'), 'utf8'));
  assert.equal(saved['6001'].name, 'Sardor');
  assert.equal('name' in saved['6002'], false);

  const g7 = buildTeacherReport(allProgress()).lessons[0];
  assert.deepEqual(g7.students.map((s) => [s.name, s.score]), [['Sardor', 6], [null, 5]]);
});

/* ---------- textbook practice ---------- */

const topic = (answered: unknown, right: unknown) => ({ answered, right, stars: 1, rounds: 1, lastAt: 1 });
const practiser = (name: string | undefined, topics: unknown): StoredEntry => ({ name, updatedAt: 1, progress: { bot: { grade: 7, xp: 0, topics, seen: [] } } });

test('practice per student: topics practised, questions, first-try percent, weakest topic', () => {
  const { practice } = buildTeacherReport(
    {
      '4001': practiser('Bekzod', { 'a7-eq': topic(10, 9), 'a7-power': topic(5, 1), 'g7-tri': topic(5, 5) }),
      '4002': practiser('Aziza', { 'a7-eq': topic(4, 4) }),
    },
    4002,
  );

  assert.deepEqual(practice.students.map((s) => s.name), ['Aziza', 'Bekzod']);
  const [aziza, bekzod] = practice.students;

  assert.equal(bekzod.topics, 3);
  assert.equal(bekzod.answered, 20);
  assert.equal(bekzod.right, 15);
  assert.equal(bekzod.percent, 75);
  assert.deepEqual(bekzod.weakest, { topicId: 'a7-power', percent: 20 });
  assert.equal(bekzod.self, false);

  // Nothing missed: no topic is called weak, however few questions were answered.
  assert.equal(aziza.percent, 100);
  assert.equal(aziza.weakest, null);
  assert.equal(aziza.self, true);

  assert.equal(practice.answered, 24);
  // Row keys never reveal Telegram ids.
  assert.ok(!JSON.stringify(practice).includes('400'));
});

test('practice per topic: students, the mean of each student’s percent, weakest first and highlighted', () => {
  const { practice } = buildTeacherReport({
    // a7-eq: 80% and 0%, so the mean is 40%. Pooling the answers (4 of 6) would hide the weaker student and give 67%.
    '1': practiser('A', { 'a7-eq': topic(5, 4), 'g7-tri': topic(2, 1) }),
    '2': practiser('B', { 'a7-eq': topic(1, 0), 'f7-ohm': topic(3, 3) }),
  });
  assert.deepEqual(practice.topics, [
    { topicId: 'a7-eq', students: 2, answered: 6, averagePercent: 40 },
    { topicId: 'g7-tri', students: 1, answered: 2, averagePercent: 50 },
    { topicId: 'f7-ohm', students: 1, answered: 3, averagePercent: 100 },
  ]);
  assert.equal(practice.weakestTopicId, 'a7-eq');
});

test('practice ties: the topic more students practised comes first, then textbook order', () => {
  const { practice } = buildTeacherReport({
    '1': practiser('A', { 'f7-ohm': topic(2, 1), 'a7-eq': topic(2, 1), 'g7-tri': topic(2, 1) }),
    '2': practiser('B', { 'f7-ohm': topic(4, 2) }),
  });
  assert.deepEqual(practice.topics.map((t) => t.topicId), ['f7-ohm', 'a7-eq', 'g7-tri']);
  assert.equal(practice.weakestTopicId, 'f7-ohm');
  // A student's own tie goes to the first topic in textbook order, as in the bot's /progress.
  assert.equal(practice.students.find((s) => s.name === 'A')!.weakest!.topicId, 'a7-eq');
});

test('practice: nobody who has not answered appears, and nothing is highlighted when nothing was missed', () => {
  const entries = {
    // Rounds or stars with no answered question are not practice.
    '2001': practiser('Started', { 'a7-eq': { answered: 0, right: 0, stars: 3, rounds: 2, lastAt: 9 } }),
    '2002': practiser('Empty', {}),
    // Took a quiz only: a homework row, not a practice row.
    '2003': g7Entry('QuizOnly', ALL_RIGHT, {}),
    '2004': practiser('Perfect', { 'a7-eq': topic(5, 5) }),
  };
  const report = buildTeacherReport(entries);
  assert.deepEqual(report.practice.students.map((s) => s.name), ['Perfect']);
  assert.deepEqual(report.practice.topics.map((t) => t.topicId), ['a7-eq']);
  assert.equal(report.practice.weakestTopicId, null);
  assert.equal(report.lessons[0].students.length, 1);

  const empty = buildTeacherReport({}).practice;
  assert.deepEqual(empty, { students: [], topics: [], weakestTopicId: null, answered: 0 });
});

test('practice: forged and broken numbers cannot invent results or crash the report', () => {
  const entries = {
    '3001': practiser('Forged', {
      'a7-eq': topic(5, 500), // more right than answered
      'a7-power': topic(-3, 2), // negative
      'a7-poly': topic('9', '9'), // not numbers
      'a7-fsu': topic(Number.NaN, 1),
      'g7-tri': topic(2.9, 1.9), // not whole numbers
      'made-up-topic': topic(99, 99), // not in the course
      ['__proto__']: topic(99, 99),
    }),
    '3002': practiser('Array', ['a7-eq']),
    '3003': { progress: { bot: 'nonsense' }, updatedAt: 1 },
    '3004': { progress: { bot: { topics: { 'a7-eq': 'nonsense' } } }, updatedAt: 1 },
    '3005': { progress: null, updatedAt: 1 },
    abc: practiser('NotAnId', { 'a7-eq': topic(5, 5) }),
  } as Record<string, StoredEntry>;
  const { practice } = buildTeacherReport(entries);
  assert.deepEqual(practice.students.map((s) => s.name), ['Forged']);
  const [forged] = practice.students;
  assert.equal(forged.topics, 2);
  assert.equal(forged.answered, 7);
  assert.equal(forged.right, 6);
  assert.deepEqual(forged.weakest, { topicId: 'g7-tri', percent: 50 });
  assert.deepEqual(practice.topics.map((t) => t.topicId), ['g7-tri', 'a7-eq']);
});

/** A fake Telegram for one student: enough to practise through the real bot code. */
async function chatStudent(uid: number, firstName: string) {
  const { TelegramBot } = await import('../server/bot.ts');
  const sent: { method: string; body: Record<string, any> }[] = [];
  let nextId = 100;
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    const method = String(url).split('/').pop()!;
    let body: Record<string, any> = {};
    if (init?.body instanceof FormData) {
      for (const [k, v] of init.body.entries()) body[k] = typeof v === 'string' ? v : '<file>';
      if (body.reply_markup) body.reply_markup = JSON.parse(body.reply_markup);
    } else if (init?.body) body = JSON.parse(String(init.body));
    const id = nextId++;
    sent.push({ method, body: { ...body, _id: id } });
    const result = method === 'getMe' ? { id: 1, is_bot: true, username: 'TestBot' } : method === 'sendPhoto' ? { message_id: id, photo: [{ file_id: `file-${id}` }] } : { message_id: id };
    return new Response(JSON.stringify({ ok: true, result }), { headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  const bot = new TelegramBot({ token: 'TEST:token', miniAppUrl: 'https://demo.example.org/', miniAppUrlProblem: null, autoconfigure: false, fetchImpl, checkMiniApp: async () => true, log: () => undefined });
  const from = { id: uid, first_name: firstName, language_code: 'en' };
  const chat = { id: uid, type: 'private' };
  const card = () => sent.filter((c) => ['sendMessage', 'sendPhoto', 'editMessageText', 'editMessageCaption'].includes(c.method)).at(-1)!;
  const buttons = (on = card()) => (on.body.reply_markup?.inline_keyboard ?? []).flat() as { text: string; callback_data: string }[];
  const press = async (data: string, on = card()) => {
    const message: any = { message_id: on.body.message_id ?? on.body._id, chat };
    if (on.method === 'sendPhoto' || on.method === 'editMessageCaption') message.photo = [{}];
    await bot.handleUpdate({ update_id: nextId++, callback_query: { id: 'cb', from, data, message } as any });
  };
  const start = async (grade: 6 | 7) => {
    await bot.handleUpdate({ update_id: nextId++, message: { message_id: nextId++, chat, from, text: '/start' } } as any);
    await press('l|en');
    await press(`g|${grade}`);
  };
  const openRound = async (topicId: string) => {
    await press(`t|${topicId}`);
    await press(buttons().find((b) => /practice/i.test(b.text))!.callback_data);
  };
  /** Answers the question on screen: right away, or after the given number of wrong tries. */
  const answer = async (wrongTries: number) => {
    const { questionFor, topicById } = await import('../shared/curriculum/index.ts');
    const a = buttons().find((b) => b.callback_data.startsWith('a|'))!.callback_data.split('|');
    const q = questionFor(topicById(a[2])!, Number(a[3]), Number(a[4]));
    const wrong = [0, 1, 2, 3].filter((c) => c !== q.correct).slice(0, wrongTries);
    for (const choice of [...wrong, ...(wrongTries < 3 ? [q.correct] : [])]) {
      const on = card();
      await press(buttons(on).find((b) => b.callback_data.startsWith('a|') && b.callback_data.endsWith(`|${choice}`))!.callback_data, on);
    }
    await press(buttons().at(-1)!.callback_data); // next question
  };
  return { start, openRound, answer };
}

test('a student who practises in the bot appears in the report with the right numbers; a non-teacher still gets 403', async () => {
  const { allProgress } = await import('../server/store.ts');
  const student = 77001;
  const chat = await chatStudent(student, 'Nodira');
  await chat.start(7);

  // Algebra: right first time, right first time, right after one wrong try: 2 of 3 count as first-try.
  await chat.openRound('a7-power');
  await chat.answer(0);
  await chat.answer(0);
  await chat.answer(1);
  // Physics: missed all three tries, so the answer was revealed: 0 of 1.
  await chat.openRound('f7-speed');
  await chat.answer(3);

  const report = buildTeacherReport(allProgress(), 111);
  const row = report.practice.students.find((s) => s.name === 'Nodira')!;
  assert.ok(row, 'the student is in the report');
  assert.equal(row.topics, 2);
  assert.equal(row.answered, 4);
  assert.equal(row.right, 2);
  assert.equal(row.percent, 50);
  assert.deepEqual(row.weakest, { topicId: 'f7-speed', percent: 0 });
  assert.equal(row.self, false);
  assert.deepEqual(
    report.practice.topics.map((t) => [t.topicId, t.students, t.averagePercent]),
    [['f7-speed', 1, 0], ['a7-power', 1, 67]],
  );
  assert.equal(report.practice.weakestTopicId, 'f7-speed');
  assert.ok(!JSON.stringify(report).includes(String(student)), 'the Telegram id never reaches the teacher');

  // Entries saved earlier in this file with no practice stay out of it.
  assert.deepEqual(report.practice.students.map((s) => s.name), ['Nodira']);

  // The same student, signed in properly, still cannot read the report; a listed teacher can.
  assert.deepEqual(teacherAccess(tma(student), opts), { ok: false, status: 403 });
  assert.deepEqual(teacherAccess(tma(111), opts), { ok: true, userId: 111 });
});

/* ---------- authorisation ---------- */

const TOKEN = '123456:TEST-token-for-unit-tests-only';
const now = Math.floor(Date.now() / 1000);
const tma = (id: number, fields: Record<string, string> = {}, token = TOKEN) =>
  `tma ${signInitData({ auth_date: String(now), user: JSON.stringify({ id, first_name: 'T' }), ...fields }, token)}`;
const opts = { botToken: TOKEN, maxAgeSeconds: 3600, teacherIds: parseTeacherIds('111, 222'), nowSeconds: now };

test('TEACHER_IDS parsing ignores anything that is not a positive id', () => {
  assert.deepEqual([...parseTeacherIds(' 111, 222;333 444,,')], [111, 222, 333, 444]);
  assert.deepEqual([...parseTeacherIds('abc, -5, 0, 1.5, 12x, 99999999999999999')], []);
  assert.equal(parseTeacherIds(undefined).size, 0);
  assert.equal(parseTeacherIds('').size, 0);
});

test('a listed teacher with valid initData gets the report', () => {
  assert.deepEqual(teacherAccess(tma(222), opts), { ok: true, userId: 222 });
});

test('a valid Telegram user who is not a teacher gets 403', () => {
  assert.deepEqual(teacherAccess(tma(333), opts), { ok: false, status: 403 });
  assert.deepEqual(teacherAccess(tma(111), { ...opts, teacherIds: new Set() }), { ok: false, status: 403 });
});

test('missing, forged, expired or foreign initData gets 401', () => {
  assert.deepEqual(teacherAccess(undefined, opts), { ok: false, status: 401 });
  assert.deepEqual(teacherAccess('', opts), { ok: false, status: 401 });
  assert.deepEqual(teacherAccess(`Bearer ${tma(111).slice(4)}`, opts), { ok: false, status: 401 });
  // A student who rewrites their id to a teacher's id breaks the signature.
  assert.deepEqual(teacherAccess(tma(333).replace('333', '111'), opts), { ok: false, status: 401 });
  assert.deepEqual(teacherAccess(tma(111, { auth_date: String(now - 7200) }), opts), { ok: false, status: 401 });
  assert.deepEqual(teacherAccess(tma(111, {}, '999:another-bot'), opts), { ok: false, status: 401 });
  assert.deepEqual(teacherAccess(tma(111), { ...opts, botToken: '' }), { ok: false, status: 401 });
  // Signed, but without a user: not a teacher login.
  const noUser = `tma ${signInitData({ auth_date: String(now) }, TOKEN)}`;
  assert.deepEqual(teacherAccess(noUser, opts), { ok: false, status: 401 });
});

test('open mode: any real Telegram user passes, a forged or missing login still does not', () => {
  const open = { ...opts, open: true };
  assert.deepEqual(teacherAccess(tma(333), open), { ok: true, userId: 333 });
  assert.deepEqual(teacherAccess(tma(333, {}, '999999:another-token'), open), { ok: false, status: 401 });
  assert.deepEqual(teacherAccess(undefined, open), { ok: false, status: 401 });
  assert.deepEqual(teacherAccess('tma not-a-real-login', open), { ok: false, status: 401 });
  // and it stays closed when the switch is off
  assert.deepEqual(teacherAccess(tma(333), { ...opts, open: false }), { ok: false, status: 403 });
});

test('hideOtherNames keeps your own name, removes everyone else\'s, and leaves the original alone', () => {
  const st = (name: string | null, self: boolean) => ({ key: 'k', name, self });
  const report = {
    generatedAt: 1,
    lessons: [{ lessonId: 'g7-linear', students: [st('Aziza', false), st('Me', true), st(null, false)] }],
    practice: { students: [st('Aziza', false), st('Me', true)] },
  } as unknown as TeacherReport;
  const hidden = hideOtherNames(report);
  assert.deepEqual(hidden.lessons[0]!.students.map((x) => x.name), [null, 'Me', null]);
  assert.deepEqual(hidden.practice.students.map((x) => x.name), [null, 'Me']);
  assert.equal(hidden.lessons[0]!.students[1]!.self, true);
  assert.ok(!JSON.stringify(hidden).includes('Aziza'), 'no other name is left anywhere');
  assert.equal(report.lessons[0]!.students[0]!.name, 'Aziza', 'the original is not changed');
});
