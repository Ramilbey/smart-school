import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { createAccounts } from '../server/accounts.ts';
import { isLocalOrigin } from '../server/http.ts';
import { createLive } from '../server/live.ts';
import { createPortal } from '../server/portal.ts';
import { mathQuestions, parseAiQuestions, questionsFromTopic, topicList } from '../server/quizMaker.ts';
import { answerText, isCorrect, normalizeQuiz, normalizeQuestion } from '../server/quizzes.ts';
import { topics } from '../shared/curriculum/index.ts';

const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'portal-test-'));
  dirs.push(d);
  return d;
};
after(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

const choiceQ = (prompt: string, correct = 1) => ({ kind: 'choice', prompt, choices: ['3', '4', '5', '6'], correct });

describe('teacher accounts', () => {
  it('registers, logs in, and rejects a wrong password', () => {
    let t = 1_700_000_000_000;
    const a = createAccounts({ dir: tmp(), now: () => t });
    const reg = a.register('Ustoz.Ali', 'secret123', 'Ali Valiyev');
    assert.equal(reg.teacher.username, 'ustoz.ali');
    assert.equal(a.verify(reg.token)?.id, reg.teacher.id);
    assert.equal(a.login('USTOZ.ALI', 'secret123').teacher.id, reg.teacher.id);
    assert.throws(() => a.login('ustoz.ali', 'wrong-password'), /wrong username or password/);
    assert.throws(() => a.login('nobody', 'secret123'), /wrong username or password/);
    assert.throws(() => a.register('ustoz.ali', 'another1', 'Other'), /taken/);
    assert.throws(() => a.register('ab', 'secret123', 'Short'), /username/);
    assert.throws(() => a.register('valid.name', '123', 'Short pw'), /password/);
    t += 8 * 86400_000;
    assert.equal(a.verify(reg.token), null, 'a token older than 7 days is refused');
  });

  it('never stores the password and refuses tampered tokens', () => {
    const dir = tmp();
    const a = createAccounts({ dir });
    const reg = a.register('teacher1', 'my-password-9', 'T One');
    const raw = readFileSync(path.join(dir, 'teachers.json'), 'utf8');
    assert.ok(!raw.includes('my-password-9'), 'the password is not in the file');
    const [payload, sig] = reg.token.split('.');
    const other = Buffer.from(JSON.stringify({ sub: 'someoneelse', exp: 9_999_999_999 })).toString('base64url');
    assert.equal(a.verify(`${other}.${sig}`), null);
    assert.equal(a.verify(`${payload}.${sig.slice(0, -2)}xx`), null);
    assert.equal(a.verify('garbage'), null);
    assert.equal(a.verify(undefined), null);
    // tokens made by another server (another secret) do not work here
    const b = createAccounts({ dir: tmp() });
    assert.equal(b.verify(reg.token), null);
  });

  it('keeps the signing secret between restarts', () => {
    const dir = tmp();
    const first = createAccounts({ dir }).register('teacher2', 'password-2', 'T Two');
    const again = createAccounts({ dir });
    assert.equal(again.verify(first.token)?.username, 'teacher2');
    assert.ok(existsSync(path.join(dir, 'portal-secret.txt')));
  });
});

describe('quizzes and answer checking', () => {
  it('accepts a good quiz and says what is wrong with a bad one', () => {
    const q = normalizeQuiz({ title: 'Fractions', lang: 'en', questions: [choiceQ('2 + 2 = ?'), { kind: 'number', prompt: 'Half of 9?', answer: '4,5' }] });
    assert.equal(q.questions.length, 2);
    assert.equal(q.questions[1].answer, 4.5);
    assert.throws(() => normalizeQuiz({ title: '', questions: [choiceQ('x')] }), /title/);
    assert.throws(() => normalizeQuiz({ title: 'a', questions: [] }), /at least one/);
    assert.throws(() => normalizeQuiz({ title: 'a', questions: [{ ...choiceQ('x'), correct: 9 }] }), /right answer/);
    assert.throws(() => normalizeQuiz({ title: 'a', questions: [{ ...choiceQ('x'), choices: ['1', '1'] }] }), /same/);
    assert.throws(() => normalizeQuiz({ title: 'a', questions: [{ kind: 'number', prompt: 'x', answer: 'abc' }] }), /number/);
    assert.throws(() => normalizeQuiz({ title: 'a', questions: Array.from({ length: 41 }, (_, i) => choiceQ(`q${i}`)) }), /at most 40/);
  });

  it('checks answers by code', () => {
    const c = normalizeQuestion(choiceQ('p', 2), 0);
    assert.equal(isCorrect(c, { choice: 2 }), true);
    assert.equal(isCorrect(c, { choice: 1 }), false);
    assert.equal(isCorrect(c, { choice: '2' }), false, 'a string is not a choice index');
    assert.equal(isCorrect(c, {}), false);
    const n = normalizeQuestion({ kind: 'number', prompt: 'p', answer: 0.5 }, 0);
    assert.equal(isCorrect(n, { value: '0,5' }), true);
    assert.equal(isCorrect(n, { value: 0.5 }), true);
    assert.equal(isCorrect(n, { value: 'abc' }), false);
    assert.equal(answerText(c), '5');
  });

  it('only keeps a picture the server made itself', () => {
    const bad = normalizeQuestion({ ...choiceQ('x'), svg: '<svg onload="alert(1)"/>' }, 0);
    assert.equal(bad.svg, undefined);
  });
});

describe('questions from the textbook topics', () => {
  it('makes real, different questions with one right answer for every topic', () => {
    assert.ok(topics.length >= 23);
    for (const t of topics) {
      for (const lang of ['en'] as const) {
        const { questions } = questionsFromTopic(t.id, 6, lang, 12345);
        assert.ok(questions.length >= 3, `${t.id}/${lang}: ${questions.length} questions`);
        assert.equal(new Set(questions.map((q) => q.prompt)).size, questions.length, `${t.id}: prompts differ`);
        for (const q of questions) {
          assert.ok((q.choices?.length ?? 0) >= 2 && Number.isInteger(q.correct) && (q.correct as number) < (q.choices?.length ?? 0));
        }
      }
    }
    assert.equal(topicList('en').length, topics.length);
    assert.throws(() => questionsFromTopic('nope', 5, 'en'), /unknown topic/);
  });

  it('gives the same questions for the same seed', () => {
    const a = questionsFromTopic(topics[0].id, 5, 'en', 99).questions.map((q) => q.prompt);
    const b = questionsFromTopic(topics[0].id, 5, 'en', 99).questions.map((q) => q.prompt);
    assert.deepEqual(a, b);
  });
});

describe('Math Sprint questions', () => {
  it('computes every answer from the numbers the teacher chose', () => {
    const made = mathQuestions({ ops: ['add', 'sub', 'mul', 'div', 'sq', 'missing'], min: 2, max: 12, count: 40 });
    assert.ok(made.questions.length >= 30, `got ${made.questions.length}`);
    assert.equal(new Set(made.questions.map((q) => q.prompt)).size, made.questions.length, 'no question twice');
    for (const q of made.questions) {
      assert.equal(q.kind, 'number');
      const m = /^(\d+) ([+−×÷]) (\d+) = \?$/.exec(q.prompt);
      const sq = /^(\d+)² = \?$/.exec(q.prompt);
      const miss = /^\? ([+−×]) (\d+) = (\d+)$/.exec(q.prompt);
      if (m) {
        const [a, b] = [Number(m[1]), Number(m[3])];
        const want = { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[m[2] as '+'];
        assert.equal(q.answer, want, q.prompt);
        assert.ok(Number.isInteger(want) && want >= 0, q.prompt);
      } else if (sq) assert.equal(q.answer, Number(sq[1]) ** 2, q.prompt);
      else if (miss) {
        const x = q.answer as number, a = Number(miss[2]), total = Number(miss[3]);
        assert.equal({ '+': x + a, '−': x - a, '×': x * a }[miss[1] as '+'], total, q.prompt);
      } else assert.fail(`unexpected question ${q.prompt}`);
    }
  });
  it('stays inside the numbers asked for, and refuses nonsense', () => {
    const made = mathQuestions({ ops: ['add'], min: 5, max: 9, count: 10 });
    for (const q of made.questions) for (const n of q.prompt.match(/\d+/g)!) assert.ok(Number(n) >= 5 && Number(n) <= 9, q.prompt);
    assert.equal(made.title, 'Math Sprint');
    assert.throws(() => mathQuestions({ ops: [], min: 1, max: 5, count: 5 }), /at least one kind/);
    assert.throws(() => mathQuestions({ ops: ['hack'], min: 1, max: 5, count: 5 }), /at least one kind/);
    assert.equal(mathQuestions({ ops: ['add'], min: 5, max: 5, count: 10 }).questions.length, 4, 'the largest number is at least one more than the smallest, and a tiny range gives only the different sums there are (5+5, 5+6, 6+5, 6+6)');
  });
});

describe('AI drafts', () => {
  it('reads the JSON, drops broken questions, and survives fences and chatter', () => {
    const text = 'Sure! ```json\n{"questions":[{"prompt":"1+1?","choices":["1","2","3","4"],"correct":1,"explain":"Add."},{"prompt":"bad","choices":["a"],"correct":0},{"prompt":"2+2?","choices":["3","4"],"correct":1}]}\n``` hope it helps';
    const out = parseAiQuestions(text, 5);
    assert.equal(out.length, 2);
    assert.equal(out[0].correct, 1);
    assert.throws(() => parseAiQuestions('no json here', 3), /could not be read/);
    assert.equal(parseAiQuestions(text, 1).length, 1, 'never more than asked');
  });
});

describe('live games', () => {
  const quiz = () => [normalizeQuestion(choiceQ('Q1', 1), 0), normalizeQuestion(choiceQ('Q2', 2), 1), normalizeQuestion({ kind: 'number', prompt: 'Q3', answer: 7 }, 2)];
  const make = (mode: string, teams = 0, seconds = 20, variant?: string, questions = quiz()) => {
    let t = 1_000_000;
    const finished: unknown[] = [];
    const live = createLive({ now: () => t, onFinish: (s) => finished.push(s) });
    const s = live.create({ ownerId: 'T1', quizId: 'quiz1', title: 'Test', lang: 'en', questions, mode, variant, teams, seconds });
    return { live, s, finished, advance: (ms: number) => (t += ms) };
  };
  /** Answers whatever question this student is on (Speed Round students each get their own order), right or wrong. */
  const solve = (live: ReturnType<typeof createLive>, code: string, pid: string, right = true) => {
    const q = (live.state(code, pid) as { question: { prompt: string; kind: string } }).question;
    const key: Record<string, { choice?: number; value?: string }> = { Q1: { choice: 1 }, Q2: { choice: 2 }, Q3: { value: '7' } };
    const wrong = q.kind === 'choice' ? { choice: 0 } : { value: '0' };
    return live.answer(code, pid, right ? key[q.prompt] : wrong);
  };

  it('Quiz Battle: fast right answers score more, wrong ones score nothing, the answer is hidden until the reveal', () => {
    const { live, s, advance, finished } = make('battle', 0, 20);
    const ann = live.join(s.code, 'Ann', undefined);
    const bob = live.join(s.code, 'Bob', undefined);
    assert.equal(live.join(s.code, 'ann', undefined).name, 'ann 2', 'the same name gets a number');
    live.join(s.code, 'Cy', undefined);
    assert.throws(() => live.answer(s.code, ann.pid, { choice: 1 }), /closed/);
    live.act(s.code, 'T1', 'start');
    // what a student can see now must not contain the right answer
    const seen = JSON.stringify(live.state(s.code, ann.pid));
    assert.ok(!seen.includes('"correct"') && !seen.includes('explain'), 'no answer field before the reveal');
    advance(2000);
    live.answer(s.code, ann.pid, { choice: 1 });
    advance(8000);
    live.answer(s.code, bob.pid, { choice: 1 });
    live.answer(s.code, live.join(s.code, 'Dee', undefined).pid, { choice: 0 });
    assert.throws(() => live.answer(s.code, ann.pid, { choice: 1 }), /already answered/);
    const view = live.teacher(s.code, 'T1');
    assert.equal(view.status, 'question', 'still waiting for the others');
    assert.equal(view.stats?.answered, 3);
    advance(20_000);
    const after = live.teacher(s.code, 'T1');
    assert.equal(after.status, 'reveal', 'time is up, so the question closes by itself');
    const [first, second] = after.players;
    assert.equal(first.name, 'Ann');
    assert.equal(first.score, 500 + Math.round(500 * (1 - 2000 / 20000)));
    assert.equal(second.name, 'Bob');
    assert.ok(first.score > second.score);
    assert.equal(after.players.find((p) => p.name === 'Dee')?.score, 0);
    const mine = live.state(s.code, ann.pid) as { reveal?: { right: boolean; answer: string } };
    assert.equal(mine.reveal?.right, true);
    assert.equal(mine.reveal?.answer, '4');
    assert.throws(() => live.answer(s.code, bob.pid, { choice: 1 }), /closed/);
    live.act(s.code, 'T1', 'next');
    live.act(s.code, 'T1', 'next');
    live.act(s.code, 'T1', 'next');
    live.act(s.code, 'T1', 'next');
    live.act(s.code, 'T1', 'next');
    assert.equal(live.teacher(s.code, 'T1').status, 'done');
    assert.equal(finished.length, 1);
    const summary = finished[0] as { players: { name: string }[]; questions: { correctPercent: number }[] };
    assert.equal(summary.players[0].name, 'Ann');
    assert.equal(summary.questions[0].correctPercent, 67);
  });

  it('moves on by itself when everyone has answered', () => {
    const { live, s } = make('battle');
    const a = live.join(s.code, 'A', undefined);
    const b = live.join(s.code, 'B', undefined);
    live.act(s.code, 'T1', 'start');
    live.answer(s.code, a.pid, { choice: 1 });
    assert.equal(live.teacher(s.code, 'T1').status, 'question');
    live.answer(s.code, b.pid, { choice: 3 });
    assert.equal(live.teacher(s.code, 'T1').status, 'reveal');
  });

  it('never shows one student the private id of another', () => {
    const { live, s } = make('battle');
    const a = live.join(s.code, 'A', undefined);
    const b = live.join(s.code, 'B', undefined);
    live.act(s.code, 'T1', 'start');
    live.answer(s.code, a.pid, { choice: 1 });
    live.act(s.code, 'T1', 'reveal');
    const seenByB = JSON.stringify(live.state(s.code, b.pid));
    assert.ok(seenByB.includes('"A"'), 'the leaderboard does show names');
    assert.ok(!seenByB.includes(a.pid), 'but not the id that lets a phone answer as that player');
  });

  it('teams: students are spread out and the team score is the average', () => {
    const { live, s, advance } = make('battle', 2);
    const p = ['A', 'B', 'C', 'D'].map((n) => live.join(s.code, n, undefined));
    const teams = p.map((x) => x.team);
    assert.equal(teams.filter((x) => x === 0).length, 2);
    assert.equal(live.join(s.code, 'E', 1).team, 1, 'a student can choose a team');
    live.act(s.code, 'T1', 'start');
    advance(1000);
    live.answer(s.code, p[0].pid, { choice: 1 });
    live.act(s.code, 'T1', 'reveal');
    const board = live.teacher(s.code, 'T1').teamBoard;
    assert.equal(board.length, 2);
    assert.ok(board[0].average > 0 && board[0].average >= board[1].average);
    assert.throws(() => make('battle').live.act('000000', 'T1', 'start'), /no game/);
  });

  it('Speed Round: each student goes at their own pace, 100 a right answer, and the clock ends it', () => {
    const { live, s, advance, finished } = make('speed', 0, 60);
    const a = live.join(s.code, 'Fast', undefined);
    const b = live.join(s.code, 'Slow', undefined);
    live.act(s.code, 'T1', 'start');
    solve(live, s.code, a.pid);
    solve(live, s.code, a.pid);
    const last = solve(live, s.code, a.pid) as { finished?: boolean; you: { score: number } };
    assert.equal(last.you.score, 300);
    assert.equal(last.finished, true);
    assert.throws(() => live.answer(s.code, a.pid, { choice: 1 }), /everything/);
    solve(live, s.code, b.pid, false);
    const b2 = live.state(s.code, b.pid) as { last?: { right: boolean; answer: string }; index?: number };
    assert.equal(b2.last?.right, false);
    assert.ok(b2.last?.answer, 'after a wrong answer the student is shown the right one');
    assert.equal(b2.index, 1);
    advance(61_000);
    assert.equal(live.teacher(s.code, 'T1').status, 'done');
    assert.equal(finished.length, 1);
  });

  it('Speed Round: every student gets the questions in their own order, and it ends when everyone is done', () => {
    const many = Array.from({ length: 12 }, (_, i) => normalizeQuestion(choiceQ(`Q${i}`, 1), i));
    const { live, s } = make('speed', 0, 60, undefined, many);
    const a = live.join(s.code, 'A', undefined);
    const b = live.join(s.code, 'B', undefined);
    live.act(s.code, 'T1', 'start');
    const firstOf = (pid: string) => (live.state(s.code, pid) as { question: { prompt: string } }).question.prompt;
    const orderOf = (pid: string) => {
      const seen: string[] = [];
      for (let i = 0; i < 12; i++) {
        seen.push(firstOf(pid));
        live.answer(s.code, pid, { choice: 1 });
      }
      return seen;
    };
    const oa = orderOf(a.pid);
    assert.equal(live.teacher(s.code, 'T1').status, 'running', 'one student is still going');
    const ob = orderOf(b.pid);
    assert.deepEqual([...oa].sort(), [...ob].sort(), 'both got every question once');
    assert.notDeepEqual(oa, ob, 'in different orders');
    assert.equal(live.teacher(s.code, 'T1').status, 'done', 'everybody finished, so the round ends without waiting for the clock');
  });

  it('typed answers: capitals, spaces, punctuation and the different apostrophes do not matter', () => {
    const word = normalizeQuestion({ kind: 'text', prompt: 'Opposite of hot', text: 'cold', accept: ['Cold!', 'chilly', ' CHILLY '] }, 0);
    assert.deepEqual(word.accept, ['chilly'], 'the answer itself and repeated spellings are not listed again');
    const tricky = normalizeQuestion({ kind: 'text', prompt: 'Country', text: 'O‘zbekiston' }, 0);
    for (const ok of ['o\'zbekiston', ' O’ZBEKISTON. ', 'Oʻzbekiston']) assert.equal(isCorrect(tricky, { text: ok }), true, ok);
    for (const no of ['ozbekiston', '', 'uzbekiston', 12]) assert.equal(isCorrect(tricky, { text: no }), false, String(no));
    assert.throws(() => normalizeQuestion({ kind: 'text', prompt: 'x' }, 0), /write the answer/);
    assert.equal(answerText(tricky), 'O‘zbekiston');
  });

  it('Last One Standing: a wrong answer puts you out, the last one in wins, and if everyone is wrong nobody is out', () => {
    const { live, s } = make('battle', 0, 20, 'survivor');
    const a = live.join(s.code, 'A', undefined);
    const b = live.join(s.code, 'B', undefined);
    const c = live.join(s.code, 'C', undefined);
    live.act(s.code, 'T1', 'start');
    live.answer(s.code, a.pid, { choice: 1 });
    live.answer(s.code, b.pid, { choice: 1 });
    live.answer(s.code, c.pid, { choice: 0 });
    const r1 = live.teacher(s.code, 'T1');
    assert.equal(r1.status, 'reveal');
    assert.equal(r1.alive, 2);
    assert.equal((live.state(s.code, c.pid) as { reveal: { justOut: boolean } }).reveal.justOut, true);
    live.act(s.code, 'T1', 'next');
    assert.throws(() => live.answer(s.code, c.pid, { choice: 2 }), /out of this game/);
    live.answer(s.code, a.pid, { choice: 2 });
    live.answer(s.code, b.pid, { choice: 0 }); // the last question is still waiting only for those still in, so this closes it
    const r2 = live.teacher(s.code, 'T1');
    assert.equal(r2.status, 'reveal');
    assert.equal(r2.alive, 1);
    assert.equal(r2.lastOneStanding, true);
    assert.throws(() => live.join(s.code, 'Late', undefined), /already started/);
    live.act(s.code, 'T1', 'next');
    const done = live.teacher(s.code, 'T1');
    assert.equal(done.status, 'done', 'one student left, so the game is over');
    assert.deepEqual(done.leaderboard.map((p) => p.name), ['A', 'B', 'C'], 'the one still in first, then whoever lasted longer');

    const mercy = make('battle', 0, 20, 'survivor');
    const x = mercy.live.join(mercy.s.code, 'X', undefined);
    const y = mercy.live.join(mercy.s.code, 'Y', undefined);
    mercy.live.act(mercy.s.code, 'T1', 'start');
    mercy.live.answer(mercy.s.code, x.pid, { choice: 0 });
    mercy.live.answer(mercy.s.code, y.pid, { choice: 3 });
    const m = mercy.live.teacher(mercy.s.code, 'T1');
    assert.equal(m.mercy, true);
    assert.equal(m.alive, 2, 'everybody was wrong, so nobody is out');
    assert.equal(make('speed', 0, 60, 'survivor').s.variant, 'classic', 'Last One Standing only exists as a Quiz Battle');
  });

  it('Team Race: always has teams, and each team gets a track position from its right answers', () => {
    const { live, s } = make('speed', 0, 60, 'race');
    assert.equal(s.variant, 'race');
    assert.equal(s.teams, 3, 'a race with no teams gets three');
    const a = live.join(s.code, 'A', 0);
    const b = live.join(s.code, 'B', 1);
    live.act(s.code, 'T1', 'start');
    solve(live, s.code, a.pid);
    solve(live, s.code, a.pid);
    solve(live, s.code, b.pid, false);
    const board = (live.state(s.code, a.pid) as { teamBoard: { team: number; progress: number; members: number }[] }).teamBoard;
    const lane = (t: number) => board.find((x) => x.team === t)!;
    assert.equal(lane(0).progress, Math.round((2 / 3) * 100), 'two of the three questions right');
    assert.equal(lane(1).progress, 0, 'a wrong answer does not move the team');
    assert.equal(lane(2).members, 0);
  });

  it('only the teacher who made a game can run it, and kicking removes a student', () => {
    const { live, s } = make('battle');
    const a = live.join(s.code, 'A', undefined);
    assert.throws(() => live.act(s.code, 'T2', 'start'), /no game/);
    assert.throws(() => live.teacher(s.code, 'T2'), /no game/);
    live.act(s.code, 'T1', 'kick', a.pid);
    assert.equal(live.teacher(s.code, 'T1').players.length, 0, 'kicked');
    assert.throws(() => live.act(s.code, 'T1', 'start'), /wait until students/);
  });

  it('refuses a stranger and a made-up player id', () => {
    const { live, s } = make('battle');
    live.join(s.code, 'A', undefined);
    assert.throws(() => live.state(s.code, 'f'.repeat(24)), /not in this game/);
    assert.throws(() => live.answer(s.code, undefined, { choice: 1 }), /not in this game/);
    assert.throws(() => live.join(s.code, '   ', undefined), /first name/);
  });
});

describe('the portal over HTTP', () => {
  it('runs a whole class: sign up, make a quiz, play, read the results', async () => {
    const dir = tmp();
    const portal = createPortal({ dir, allowSignup: true, demo: null, ai: { available: () => true, generate: async () => ({ title: 'Fake quiz', subject: 'Maths', questions: [normalizeQuestion(choiceQ('Drafted by the fake AI'), 0)] }), assist: async () => ({ say: 'fake' }) } });
    const server = createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://x');
      try {
        if (!(await portal.handle(req, res, url, { 'access-control-allow-origin': 'https://site.example' }))) res.writeHead(404).end();
      } catch (e) {
        const status = (e as { status?: number }).status ?? 500;
        res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify({ error: (e as Error).message }));
      }
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const call = async (method: string, p: string, body?: unknown, token?: string) => {
      const r = await fetch(base + p, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: r.status, json: (await r.json()) as Record<string, any> };
    };
    try {
      assert.equal((await call('GET', '/api/portal/quizzes')).status, 401, 'no login, no quizzes');
      assert.equal((await call('GET', '/api/portal/info')).json.ai, true);
      const reg = await call('POST', '/api/portal/auth/register', { username: 'maktab7', password: 'parol-777', name: 'Dilnoza' });
      assert.equal(reg.status, 201);
      const token = reg.json.token as string;
      assert.equal((await call('POST', '/api/portal/auth/login', { username: 'maktab7', password: 'xxxxxx' })).status, 401);
      // an error must carry the CORS header too, or a page on another origin sees "server down" instead of the message
      const refused = await fetch(`${base}/api/portal/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'maktab7', password: 'xxxxxx' }) });
      assert.equal(refused.status, 401);
      assert.equal(refused.headers.get('access-control-allow-origin'), 'https://site.example');
      const noGame = await fetch(`${base}/api/play/peek?code=000000`);
      assert.equal(noGame.status, 404);
      assert.equal(noGame.headers.get('access-control-allow-origin'), 'https://site.example');

      const topic = await call('POST', '/api/portal/generate/topic', { topicId: topics[0].id, count: 4, lang: 'en' }, token);
      assert.equal(topic.status, 200);
      assert.equal(topic.json.questions.length, 4);
      const ai = await call('POST', '/api/portal/generate/ai', { topic: 'fractions', count: 2, lang: 'en' }, token);
      assert.equal(ai.status, 200);
      assert.match(ai.json.note, /Read every question/);

      const made = await call('POST', '/api/portal/quizzes', { title: 'Weekly check', lang: 'en', source: 'textbook', questions: topic.json.questions }, token);
      assert.equal(made.status, 201);
      const quizId = made.json.quiz.id as string;
      assert.equal((await call('GET', '/api/portal/quizzes', undefined, token)).json.quizzes.length, 1);
      assert.equal((await call('POST', '/api/portal/quizzes', { title: 'bad', questions: [] }, token)).status, 400);

      // a second teacher cannot see or change the first one's quiz
      const other = (await call('POST', '/api/portal/auth/register', { username: 'maktab8', password: 'parol-888', name: 'Other' })).json.token as string;
      assert.equal((await call('GET', `/api/portal/quizzes/${quizId}`, undefined, other)).status, 404);
      assert.equal((await call('POST', `/api/portal/quizzes/${quizId}/delete`, {}, other)).status, 404);

      // textbook pictures: the browser never sends them back, yet they survive saving; nobody else can attach them or forge one
      let drawn: { id: string; svg?: string }[] = [];
      for (const t of topics) {
        const r = await call('POST', '/api/portal/generate/topic', { topicId: t.id, count: 4, lang: 'en' }, token);
        if ((r.json.questions as { svg?: string }[]).some((q) => q.svg)) { drawn = r.json.questions; break; }
      }
      const withPic = drawn.find((q) => q.svg);
      assert.ok(withPic, 'at least one textbook topic comes with pictures');
      const bare = drawn.map(({ svg, ...rest }) => rest);
      const forged = { kind: 'choice', prompt: 'Forged?', choices: ['a', 'b'], correct: 0, id: 'aaaaaaaaaaaa', svg: '<svg onload="x()"/>' };
      const pic = await call('POST', '/api/portal/quizzes', { title: 'Pictures', lang: 'en', questions: [...bare, forged] }, token);
      assert.equal(pic.status, 201);
      const saved = pic.json.quiz.questions as { id: string; svg?: string }[];
      assert.equal(saved.find((q) => q.id === withPic.id)?.svg, withPic.svg, 'the picture the server drew is attached to the saved question');
      assert.equal(saved.find((q) => q.id === 'aaaaaaaaaaaa')?.svg, undefined, 'a picture sent by the browser is ignored');
      const resaved = await call('PUT', `/api/portal/quizzes/${pic.json.quiz.id}`, { title: 'Pictures', lang: 'en', questions: saved.map(({ svg, ...rest }) => rest) }, token);
      assert.equal((resaved.json.quiz.questions as { id: string; svg?: string }[]).find((q) => q.id === withPic.id)?.svg, withPic.svg, 'editing and saving again keeps it');
      const dropped = await call('PUT', `/api/portal/quizzes/${pic.json.quiz.id}`, { title: 'Pictures', lang: 'en', questions: saved.map(({ svg, ...rest }) => ({ ...rest, dropPicture: rest.id === withPic.id })) }, token);
      assert.equal((dropped.json.quiz.questions as { id: string; svg?: string }[]).find((q) => q.id === withPic.id)?.svg, undefined, 'the teacher can remove a picture');
      const stolen = await call('POST', '/api/portal/quizzes', { title: 'Stolen', lang: 'en', questions: bare }, other);
      assert.ok(!(stolen.json.quiz.questions as { svg?: string }[]).some((q) => q.svg), 'another teacher cannot attach the first teacher’s pictures');
      await call('POST', `/api/portal/quizzes/${pic.json.quiz.id}/delete`, {}, token);
      await call('POST', `/api/portal/quizzes/${stolen.json.quiz.id}/delete`, {}, other);

      const game = await call('POST', '/api/portal/sessions', { quizId, mode: 'battle', teams: 2, seconds: 15 }, token);
      assert.equal(game.status, 201);
      const code = game.json.code as string;
      assert.match(code, /^\d{6}$/);
      const joined = await call('POST', '/api/play/join', { code, name: 'Aziza' });
      assert.equal(joined.status, 200);
      const pid = joined.json.pid as string;
      assert.equal((await call('GET', `/api/play/state?code=${code}&pid=nope`)).status, 403);
      assert.equal((await call('POST', `/api/portal/sessions/${code}/action`, { action: 'start' }, other)).status, 404);
      assert.equal((await call('POST', `/api/portal/sessions/${code}/action`, { action: 'start' }, token)).status, 200);

      const st = await call('GET', `/api/play/state?code=${code}&pid=${pid}`);
      assert.equal(st.json.state.status, 'question');
      assert.ok(!JSON.stringify(st.json).includes('"correct"'), 'the network answer has no right answer in it');
      const right = (await call('GET', `/api/portal/sessions/${code}`, undefined, token)).json.view.question.correct as number;
      assert.equal((await call('POST', '/api/play/answer', { code, pid, choice: right })).status, 200);
      assert.equal((await call('POST', `/api/portal/sessions/${code}/action`, { action: 'end' }, token)).json.view.status, 'done');

      const hist = await call('GET', '/api/portal/history', undefined, token);
      assert.equal(hist.json.sessions.length, 1);
      const detail = await call('GET', `/api/portal/history/${code}`, undefined, token);
      assert.equal(detail.json.summary.players[0].name, 'Aziza');
      assert.ok(detail.json.summary.players[0].score >= 500);
      assert.equal((await call('GET', `/api/portal/history/${code}`, undefined, other)).status, 404);

      // the ready-made games: a Math Sprint made by the server, a typed-answer quiz played as a Team Race
      const math = await call('POST', '/api/portal/generate/math', { ops: ['mul'], min: 2, max: 9, count: 6, lang: 'en' }, token);
      assert.equal(math.status, 200);
      assert.equal(math.json.questions.length, 6);
      assert.equal((await call('POST', '/api/portal/generate/math', { ops: [], min: 1, max: 9, count: 6 }, token)).status, 400);
      assert.equal((await call('POST', '/api/portal/generate/math', { ops: ['add'] })).status, 401);
      const words = await call('POST', '/api/portal/quizzes', { title: 'Words', lang: 'en', source: 'template', questions: [{ kind: 'text', prompt: 'Opposite of hot', text: 'cold', accept: 'chilly, Cold!' }] }, token);
      assert.equal(words.status, 201);
      assert.equal(words.json.quiz.source, 'template');
      const race = await call('POST', '/api/portal/sessions', { quizId: words.json.quiz.id, mode: 'speed', variant: 'race', teams: 0, seconds: 60 }, token);
      assert.equal(race.json.view.variant, 'race');
      assert.equal(race.json.view.teams, 3);
      const rc = race.json.code as string;
      assert.equal((await call('GET', `/api/play/peek?code=${rc}`)).json.variant, 'race');
      const runner = (await call('POST', '/api/play/join', { code: rc, name: 'Runner', team: 1 })).json.pid as string;
      assert.equal((await call('POST', `/api/portal/sessions/${rc}/action`, { action: 'start' }, token)).status, 200);
      const typed = await call('POST', '/api/play/answer', { code: rc, pid: runner, text: ' COLD! ' });
      assert.equal(typed.json.state.you.score, 100, 'a typed answer with capitals and punctuation is right');
      assert.equal(typed.json.state.teamBoard.find((t: { team: number }) => t.team === 1).progress, 100);
      assert.ok(!JSON.stringify(typed.json).includes('"text":"olma"'), 'the stored answer is not sent to the phone');
      assert.equal((await call('POST', `/api/portal/quizzes/${words.json.quiz.id}/delete`, {}, token)).status, 200);

      assert.equal((await call('POST', `/api/portal/quizzes/${quizId}/delete`, {}, token)).status, 200);
      assert.equal((await call('GET', '/api/portal/quizzes', undefined, token)).json.quizzes.length, 0);
    } finally {
      server.close();
    }
  });
});

describe('which web pages may call the API from the school network', () => {
  it('accepts this computer and private networks, nothing else', () => {
    for (const ok of ['http://localhost:5190', 'http://127.0.0.1:5190', 'http://192.168.1.20:5190', 'http://10.0.3.7', 'http://172.16.0.4:8080', 'http://172.31.9.9', 'http://school-pc.local:5190', 'http://[::1]:5190']) assert.equal(isLocalOrigin(ok), true, ok);
    for (const no of ['https://evil.example', 'http://192.168.1.20.evil.example', 'http://172.32.0.1', 'http://8.8.8.8', 'null', 'file:///x', 'ftp://192.168.1.1', '']) assert.equal(isLocalOrigin(no), false, no);
  });
});
