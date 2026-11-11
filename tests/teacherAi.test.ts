import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import type { StreamParams, Streamer } from '../server/boardAi.ts';
import { classInsights, hardestQuestions, strugglingStudents } from '../server/classInsights.ts';
import { demoSessions } from '../server/demoHistory.ts';
import type { SessionSummary } from '../server/live.ts';
import { createPortal } from '../server/portal.ts';
import { assist, digestFor, generateQuestions, jsonObject, makeMasker, parseGenerated, type AssistantReply } from '../server/teacherAi.ts';

/** A model that answers each call with the next text in the list, and remembers what it was asked. */
function fakeModel(...answers: string[]) {
  const calls: StreamParams[] = [];
  const streamer: Streamer = async function* (p) {
    calls.push(p);
    yield answers[Math.min(calls.length - 1, answers.length - 1)]!;
  };
  return { streamer, calls };
}

const QS = [
  { id: 'a', prompt: 'What is 2 + 2?', kind: 'choice', answer: '4' },
  { id: 'b', prompt: 'Solve x/2 + x/3 = 10', kind: 'number', answer: '12' },
  { id: 'c', prompt: 'Name the longest side of a right triangle', kind: 'text', answer: 'hypotenuse' },
];
/** One finished game; `rows` are [name, res] where res has one character per question. */
function game(code: string, daysAgo: number, rows: [string, string][], over: Partial<SessionSummary> = {}): SessionSummary {
  const finishedAt = 1_800_000_000_000 - daysAgo * 86_400_000;
  const players = rows.map(([name, res]) => ({ name, team: null, score: 0, right: [...res].filter((c) => c === '1').length, answered: [...res].filter((c) => c !== '-').length, res }));
  const questions = QS.map((q, i) => {
    const got = players.filter((p) => p.res[i] !== '-');
    const right = got.filter((p) => p.res[i] === '1').length;
    return { ...q, answered: got.length, correctPercent: got.length ? Math.round((right / got.length) * 100) : 0 };
  });
  return { code, quizId: 'quiz1', title: 'Check', ownerId: 'T1', mode: 'battle', variant: 'classic', teams: 0, startedAt: finishedAt - 600_000, finishedAt, players, teamBoard: [], questions, ...over };
}

describe('class insights', () => {
  const history = [
    game('100003', 1, [['Dilnoza', '111'], ['Bekzod', '000'], ['Timur', '100']]),
    game('100002', 3, [['Dilnoza', '111'], ['Bekzod', '010'], ['Timur', '110']]),
    game('100001', 6, [['dilnoza', '111'], ['Bekzod', '000'], ['Timur', '111']]),
  ];
  const ins = classInsights(history, 'T1');
  const by = (n: string) => ins.students.find((s) => s.name.toLowerCase() === n.toLowerCase())!;

  it('adds up each student over every game, telling names apart only by their first name, ignoring capitals', () => {
    assert.equal(ins.students.length, 3);
    assert.equal(by('Dilnoza').sessions, 3);
    assert.equal(by('Dilnoza').answered, 9);
    assert.equal(by('Dilnoza').accuracy, 100);
    assert.equal(by('Bekzod').accuracy, 11);
    assert.equal(ins.totals.games, 3);
  });
  it('sees who is going down, and what they missed', () => {
    assert.equal(by('Timur').trend, 'down');
    assert.equal(by('Dilnoza').trend, 'flat');
    assert.deepEqual(by('Bekzod').missed.slice(0, 1), ['What is 2 + 2?']);
  });
  it('lists the students who need a look, lowest first, and never the ones with too few answers', () => {
    assert.deepEqual(strugglingStudents(ins).map((s) => s.name), ['Bekzod']);
    const few = classInsights([game('1', 1, [['Ali', '0--']])], 'T1');
    assert.deepEqual(strugglingStudents(few), []);
  });
  it('finds the questions the fewest got right', () => {
    const hard = hardestQuestions(ins, 2);
    assert.equal(hard[0]!.prompt, 'Name the longest side of a right triangle');
    assert.ok(hard[0]!.correctPercent <= hard[1]!.correctPercent);
  });
  it('only counts the teacher\'s own games, newest game first, and says when the data is sample data', () => {
    const other = classInsights([...history, game('9', 1, [['Zed', '000']], { ownerId: 'T2' })], 'T1');
    assert.equal(other.students.length, 3);
    assert.equal(ins.games[0]!.code, '100003');
    assert.equal(ins.sample, false);
    assert.equal(classInsights([game('5', 1, [['A', '111']], { sample: true })], 'T1').sample, true);
    assert.equal(classInsights([], 'T1').totals.accuracy, null);
  });
});

describe('the demo class', () => {
  const ins = classInsights(demoSessions('D', 1_800_000_000_000), 'D');
  it('is the same every time and marked as sample data', () => {
    assert.deepEqual(demoSessions('D', 1), demoSessions('D', 1));
    assert.equal(ins.sample, true);
    assert.equal(ins.totals.games, 4);
  });
  it('has students who struggle, one getting worse and one getting better', () => {
    const names = strugglingStudents(ins, 10).map((s) => s.name);
    assert.ok(['Zarina', 'Bekzod', 'Timur'].every((n) => names.includes(n)), names.join());
    assert.equal(ins.students.find((s) => s.name === 'Timur')!.trend, 'down');
    assert.equal(ins.students.find((s) => s.name === 'Bekzod')!.trend, 'up');
    assert.ok(hardestQuestions(ins, 1)[0]!.correctPercent < 30);
    assert.ok(ins.students.find((s) => s.name === 'Dilnoza')!.accuracy > 90);
  });
});

describe('names stay on the server', () => {
  it('turns names into codes and back, matching whole names only', () => {
    const m = makeMasker(['Ann', 'Annabel', 'Dilnoza', 'Oʻktam']);
    assert.equal(m.mask('How is Annabel doing, and Ann? And dilnoza!'), 'How is S02 doing, and S01? And S03!');
    assert.equal(m.mask('Banner'), 'Banner', 'a name inside another word is left alone');
    assert.equal(m.unmask('S03 and S01 need help, S09 is not a student'), 'Dilnoza and Ann need help, S09 is not a student');
    assert.equal(m.mask('Oʻktam is here'), 'S04 is here');
  });
  it('the digest the model gets has codes, not names', () => {
    const ins = classInsights([game('1', 1, [['Dilnoza', '111'], ['Bekzod', '000']]), game('2', 2, [['Dilnoza', '111'], ['Bekzod', '000']])], 'T1');
    const m = makeMasker(ins.students.map((s) => s.name));
    const text = JSON.stringify(digestFor(ins, m.codeOf));
    assert.ok(!/Dilnoza|Bekzod/.test(text));
    assert.match(text, /S01/);
  });
  it('hands the model the counts, so its answer matches the list under it', () => {
    const ins = classInsights(demoSessions('D', 1_800_000_000_000), 'D');
    const d = digestFor(ins, makeMasker(ins.students.map((s) => s.name)).codeOf);
    assert.equal(d.strugglingCount, strugglingStudents(ins, 999).length);
    assert.ok(d.decliningCount >= 1 && d.improvingCount >= 1);
  });
});

describe('writing questions', () => {
  it('reads every kind, turns true or false into two choices, and drops what is broken or not allowed', () => {
    const text = '```json\n' + JSON.stringify({
      title: 'Matrices', subject: 'Maths',
      questions: [
        { type: 'choice', prompt: 'Order of a 2 by 3 matrix?', choices: ['2 x 3', '3 x 2', '5', '6'], correct: 0, explain: 'rows first' },
        { type: 'truefalse', prompt: 'A matrix has rows and columns.', answer: true },
        { type: 'number', prompt: 'det of [[1,2],[3,4]]?', answer: -2 },
        { type: 'text', prompt: 'Name of the matrix with ones on the diagonal?', text: 'identity', accept: ['identity matrix'] },
        { type: 'choice', prompt: 'broken', choices: ['only one'], correct: 0 },
        { type: 'truefalse', prompt: 'no answer given' },
      ],
    }) + '\n```';
    const r = parseGenerated(text, 10, ['choice', 'truefalse', 'number', 'text'], 'matrices');
    assert.equal(r.title, 'Matrices');
    assert.deepEqual(r.questions.map((q) => q.kind), ['choice', 'choice', 'number', 'text']);
    assert.deepEqual(r.questions[1]!.choices, ['True', 'False']);
    assert.equal(r.questions[1]!.correct, 0);
    assert.equal(r.questions[2]!.answer, -2);
    assert.deepEqual(r.questions[3]!.accept, ['identity matrix']);
    const onlyChoice = parseGenerated(text, 10, ['choice'], 'matrices');
    assert.equal(onlyChoice.questions.length, 1, 'types the teacher did not ask for are dropped');
    assert.equal(parseGenerated(text, 2, ['choice', 'truefalse', 'number', 'text'], 'm').questions.length, 2, 'never more than asked');
    assert.throws(() => parseGenerated('nothing useful', 3, ['choice'], 'x'), /could not be read/);
    assert.equal(parseGenerated('{"questions":[{"prompt":"1+1?","choices":["1","2"],"correct":1}]}', 3, ['choice'], 'A long topic about adding things').title, 'A long topic about adding things');
  });
  it('shuffles the choices so the right answer is not always first, and still knows which is right', () => {
    const one = (i: number) => ({ type: 'choice', prompt: `Q${i}`, choices: ['right', 'w1', 'w2', 'w3'], correct: 0 });
    const text = JSON.stringify({ questions: [one(1), one(2), one(3), one(4), { type: 'truefalse', prompt: 'T', answer: true }] });
    let n = 0;
    const r = parseGenerated(text, 10, ['choice', 'truefalse'], 't', (lo, hi) => lo + (n++ % (hi - lo)));
    const positions = r.questions.slice(0, 4).map((q) => q.correct);
    assert.ok(new Set(positions).size > 1, `the right answer sat at ${positions.join()}`);
    for (const q of r.questions.slice(0, 4)) assert.equal(q.choices![q.correct!], 'right');
    assert.deepEqual(r.questions[4]!.choices, ['True', 'False'], 'true or false keeps its order');
    assert.equal(r.questions[4]!.correct, 0);
    const real = parseGenerated(text, 10, ['choice'], 't');
    for (const q of real.questions) assert.equal(q.choices![q.correct!], 'right', 'with the real random source too');
  });
  it('asks for what the teacher chose: voice, types, count, and only the text when a text is pasted', async () => {
    const ok = JSON.stringify({ title: 'T', questions: [{ type: 'choice', prompt: 'p', choices: ['a', 'b', 'c', 'd'], correct: 1 }] });
    const m = fakeModel(ok);
    await generateQuestions(m.streamer, { topic: 'matrices', count: 99, grade: 9, style: 'gamified', types: ['choice', 'truefalse'] });
    const u = m.calls[0]!.user;
    assert.match(u, /exactly 12 questions/, 'the count is capped');
    assert.match(u, /Grade 9/);
    assert.match(u, /playful, game-like/);
    assert.match(u, /Allowed question types: choice, truefalse\. Mix them/);
    assert.doesNotMatch(u, /ONLY from facts stated in the text/);
    const long = fakeModel(ok);
    await generateQuestions(long.streamer, { topic: 'The Silk Road was a network of trade routes. '.repeat(10), count: 3 });
    assert.match(long.calls[0]!.user, /ONLY from facts stated in the text/);
    await assert.rejects(generateQuestions(m.streamer, { topic: 'x', count: 3 }), /describe the topic/);
  });
  it('a model that never answers is given up on when the caller leaves', async () => {
    const hang: Streamer = async function* ({ signal }) { await new Promise((_r, rej) => signal?.addEventListener('abort', () => rej(new Error('aborted')))); yield ''; };
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), 20);
    await assert.rejects(generateQuestions(hang, { topic: 'matrices', count: 3 }, ctl.signal), /took too long/);
  });
  it('finds JSON inside chatter and refuses what is not an object', () => {
    assert.deepEqual(jsonObject('Sure! {"a":1} done'), { a: 1 });
    assert.equal(jsonObject('[1,2]'), null);
    assert.equal(jsonObject('no json'), null);
  });
});

describe('the assistant', () => {
  const ins = classInsights(demoSessions('D', 1_800_000_000_000), 'D');
  const real = ins.students.map((s) => s.name);

  it('shows the students the saved results say are struggling, whatever words the model used', async () => {
    const code = makeMasker(real).codeOf;
    const weak = strugglingStudents(ins, 5);
    const m = fakeModel(`{"say":"${code(weak[0]!.name)} and ${code(weak[1]!.name)} are the ones to look at.","show":"students","who":"struggling","limit":5,"create":null}`);
    const r = await assist(m.streamer, { message: 'Who is having difficulties?', history: [], insights: ins });
    assert.deepEqual(r.students!.map((s) => s.name), strugglingStudents(ins, 5).map((s) => s.name));
    assert.ok(r.students!.length > 0 && r.students!.every((s) => s.accuracy < 65));
    assert.equal(r.say, `${weak[0]!.name} and ${weak[1]!.name} are the ones to look at.`, 'codes in the answer become names again');
    assert.equal(r.sample, true);
  });
  it('never sends a student name to the model, not in the data, the history or the question', async () => {
    const m = fakeModel('{"say":"ok","show":"none","create":null}');
    await assist(m.streamer, { message: 'How is Bekzod doing?', history: [{ role: 'teacher', text: 'tell me about Zarina' }, { role: 'assistant', text: 'Timur is declining' }], insights: ins });
    const sent = m.calls[0]!.system + m.calls[0]!.user;
    for (const n of real) assert.ok(!sent.includes(n), `${n} was sent`);
    assert.match(m.calls[0]!.user, new RegExp(`How is ${makeMasker(real).codeOf('Bekzod')} doing`));
  });
  it('shows the hardest questions and the recent games from the saved results', async () => {
    const q = await assist(fakeModel('{"say":"These were hardest.","show":"questions","limit":3}').streamer, { message: 'hardest questions', history: [], insights: ins });
    assert.equal(q.questions!.length, 3);
    assert.deepEqual(q.questions, hardestQuestions(ins, 3));
    const g = await assist(fakeModel('{"say":"Here.","show":"games","limit":2}').streamer, { message: 'recent games', history: [], insights: ins });
    assert.equal(g.games!.length, 2);
  });
  it('does not make results up when there are none', async () => {
    const empty = classInsights([], 'T1');
    const r = await assist(fakeModel('{"say":"Five students are struggling!","show":"students","who":"struggling"}').streamer, { message: 'who struggles', history: [], insights: empty });
    assert.match(r.say, /no finished games/);
    assert.equal(r.students, undefined);
    const fine = await assist(fakeModel('{"say":"x","show":"students","who":"struggling"}').streamer, { message: 'who struggles', history: [], insights: classInsights([game('1', 1, [['A', '111'], ['B', '111'], ['C', '111']])], 'T1') });
    assert.match(fine.say, /No student stands out/);
  });
  it('makes a quiz when asked, with the style, types and the game the teacher wanted', async () => {
    const quiz = JSON.stringify({ title: 'Matrix mission', subject: 'Maths', questions: [{ type: 'choice', prompt: 'A rocket matrix has 2 rows and 3 columns. Its order?', choices: ['2x3', '3x2', '5', '6'], correct: 0 }, { type: 'truefalse', prompt: 'Matrices can be added when their orders match.', answer: true }] });
    const m = fakeModel('{"say":"on it","show":"none","create":{"topic":"matrices","count":2,"style":"gamified","types":["choice","truefalse"],"game":"race"}}', quiz);
    const r = await assist(m.streamer, { message: 'make 2 gamified questions about matrices and play them as a race', history: [], insights: ins });
    assert.equal(m.calls.length, 2);
    assert.equal(r.quiz!.questions.length, 2);
    assert.equal(r.quiz!.game, 'race');
    assert.equal(r.quiz!.style, 'gamified');
    assert.match(m.calls[1]!.user, /playful, game-like/);
    assert.match(r.say, /2 gamified questions about matrices/);
    assert.equal(r.sample, undefined, 'a quiz is not sample data');
    const bad = await assist(fakeModel('{"say":"x","show":"none","create":{"topic":"ab","game":"nonsense"}}').streamer, { message: 'x', history: [], insights: ins });
    assert.equal(bad.quiz, undefined, 'a topic that is not a topic makes nothing');
  });
  it('answers in plain words when the model forgets the format, and survives junk', async () => {
    const r = await assist(fakeModel('To teach matrices, start with a seating plan.').streamer, { message: 'how do I teach matrices', history: [], insights: ins });
    assert.match(r.say, /seating plan/);
    assert.equal(r.students, undefined);
    const j = await assist(fakeModel('{"say":"","show":"students","who":"bogus","limit":999}').streamer, { message: 'x', history: [], insights: ins });
    assert.ok(j.students!.length <= 10);
    await assert.rejects(assist((async function* () { throw new Error('down'); }) as Streamer, { message: 'x', history: [], insights: ins }), /did not answer/);
  });
});

describe('the portal routes for the AI', () => {
  async function withPortal(ai: Parameters<typeof createPortal>[0]['ai'], run: (call: (m: string, p: string, body?: unknown, token?: string) => Promise<{ status: number; json: any }>, token: string) => Promise<void>) {
    const portal = createPortal({ dir: mkdtempSync(path.join(tmpdir(), 'ss-ai-')), allowSignup: true, demo: { username: 'ustoz', password: 'ustoz2026', name: 'Demo teacher' }, ai });
    const server = createServer(async (req, res) => { if (!(await portal.handle(req, res, new URL(req.url ?? '/', 'http://x'), {}))) res.writeHead(404).end(); });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const call = async (method: string, p: string, body?: unknown, token?: string) => {
      const r = await fetch(base + p, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: r.status, json: (await r.json()) as any };
    };
    try {
      const login = await call('POST', '/api/portal/auth/login', { username: 'ustoz', password: 'ustoz2026' });
      await run(call, login.json.token);
    } finally {
      server.close();
    }
  }
  const reply: AssistantReply = { say: 'hello' };

  it('needs a login, and says so when the AI is off', async () => {
    await withPortal({ available: () => false, generate: async () => { throw new Error('no'); }, assist: async () => reply }, async (call, token) => {
      assert.equal((await call('POST', '/api/portal/assistant', { message: 'hi there' })).status, 401);
      assert.equal((await call('GET', '/api/portal/insights')).status, 401);
      assert.equal((await call('POST', '/api/portal/assistant', { message: 'hi there' }, token)).status, 503);
      assert.equal((await call('POST', '/api/portal/generate/ai', { topic: 'matrices' }, token)).status, 503);
      assert.equal((await call('GET', '/api/portal/insights', undefined, token)).status, 200, 'the numbers need no AI');
    });
  });
  it('gives the demo teacher sample results, and a new teacher none', async () => {
    await withPortal({ available: () => true, generate: async () => { throw new Error('no'); }, assist: async () => reply }, async (call, token) => {
      const i = (await call('GET', '/api/portal/insights', undefined, token)).json.insights;
      assert.equal(i.sample, true);
      assert.equal(i.totals.games, 4);
      const reg = await call('POST', '/api/portal/auth/register', { username: 'newteacher', password: 'parol-777', name: 'New' });
      const j = (await call('GET', '/api/portal/insights', undefined, reg.json.token)).json.insights;
      assert.equal(j.totals.games, 0);
      assert.equal(j.sample, false);
    });
  });
  it('passes a cleaned message and a short history to the assistant, and keeps to the limits', async () => {
    let seen: any;
    let credits = 0;
    await withPortal({ available: () => true, generate: async () => { throw new Error('no'); }, assist: async (r) => { seen = r; return reply; }, take: () => ++credits <= 4 }, async (call, token) => {
      assert.equal((await call('POST', '/api/portal/assistant', { message: ' ' }, token)).status, 400);
      const history = Array.from({ length: 9 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'bogus', text: `turn ${i}` }));
      const r = await call('POST', '/api/portal/assistant', { message: '  who   is struggling? ', history }, token);
      assert.equal(r.status, 200);
      assert.equal(r.json.say, 'hello');
      assert.equal(seen.message, 'who is struggling?');
      assert.equal(seen.history.length, 6);
      assert.ok(seen.history.every((h: any) => h.role === 'teacher' || h.role === 'assistant'));
      assert.equal(seen.insights.totals.games, 4);
      // the allowance: two credits are taken per request (the teacher's and everyone's), so the second request finds it used up
      assert.equal((await call('POST', '/api/portal/assistant', { message: 'again please' }, token)).status, 200);
      assert.equal((await call('POST', '/api/portal/assistant', { message: 'once more' }, token)).status, 429);
    });
  });
  it('drafts questions with the style and types, and hands back the title', async () => {
    let seen: any;
    await withPortal({ available: () => true, generate: async (req) => { seen = req; return { title: 'Matrices', subject: 'Maths', questions: [] }; }, assist: async () => reply }, async (call, token) => {
      const r = await call('POST', '/api/portal/generate/ai', { topic: 'matrices', count: 4, grade: 9, style: 'gamified', types: ['choice', 'number'] }, token);
      assert.equal(r.status, 200);
      assert.equal(r.json.title, 'Matrices');
      assert.equal(seen.style, 'gamified');
      assert.deepEqual(seen.types, ['choice', 'number']);
      assert.equal(seen.grade, 9);
    });
  });
});
