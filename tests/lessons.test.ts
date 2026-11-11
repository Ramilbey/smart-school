import assert from 'node:assert/strict';
import { test } from 'node:test';
import { afterAttempt, canRequestHint, evaluateAttempt, initialLadder, requestHint } from '../shared/check.ts';
import { lineEq, num, parseNumber, pt } from '../shared/format.ts';
import * as g4 from '../shared/lessons/g4Fractions.ts';
import * as g7 from '../shared/lessons/g7Linear.ts';
import { guidedProblems } from '../shared/lessons/index.ts';
import { PRACTICE_SKILLS, makePractice } from '../shared/practice.ts';
import { acceptableText, curatedReply, revealsAnswer, safeLevel } from '../shared/tutor.ts';
import type { QuizQuestion } from '../shared/types.ts';

const choc = guidedProblems['g4-hw-chocolate'];
const pizza = guidedProblems['g4-hw-pizza'];
const line = guidedProblems['g7-hw-two-points'];

/* ---------- content integrity ---------- */

function walkTexts(value: unknown, path: string, out: string[]) {
  if (!value || typeof value !== 'object') return;
  const obj = value as Record<string, unknown>;
  if ('uz' in obj || 'ru' in obj || 'en' in obj) {
    for (const lang of ['uz', 'ru', 'en']) {
      if (typeof obj[lang] !== 'string' || !(obj[lang] as string).trim()) out.push(`${path}.${lang}`);
    }
    return;
  }
  for (const [k, v] of Object.entries(obj)) walkTexts(v, `${path}.${k}`, out);
}

test('every lesson text exists in Uzbek, Russian and English', () => {
  const missing: string[] = [];
  walkTexts(g4, 'g4', missing);
  walkTexts(g7, 'g7', missing);
  assert.deepEqual(missing, []);
});

test('Russian lesson text uses Cyrillic and Uzbek text does not', () => {
  const bad: string[] = [];
  const check = (value: unknown, path: string) => {
    if (!value || typeof value !== 'object') return;
    const obj = value as Record<string, unknown>;
    if (typeof obj.ru === 'string' && typeof obj.uz === 'string') {
      const ruLetters = (obj.ru as string).replace(/[^A-Za-zА-Яа-яЁё]/g, '');
      if (ruLetters.length > 6 && !/[А-Яа-яЁё]/.test(obj.ru as string)) bad.push(`${path}.ru`);
      if (/[А-Яа-яЁё]/.test(obj.uz as string)) bad.push(`${path}.uz`);
      return;
    }
    for (const [k, v] of Object.entries(obj)) check(v, `${path}.${k}`);
  };
  check(g4, 'g4');
  check(g7, 'g7');
  assert.deepEqual(bad, []);
});

test('quiz answer keys point at real choices', () => {
  const all: QuizQuestion[] = [...g4.g4Quiz, ...g7.g7Quiz];
  for (const q of all) {
    assert.ok(q.choices.some((c) => c.id === q.correct), `${q.id} correct id`);
    assert.equal(new Set(q.choices.map((c) => c.id)).size, q.choices.length, `${q.id} unique ids`);
  }
  for (const s of g7.g7Steps.steps) if (s.choices) assert.ok(s.choices.some((c) => c.id === s.correct), s.id);
  assert.ok(g7.g7Quiz.every((q) => g7.g7Skills.some((s) => s.id === q.skill)));
});

test('the Grade 7 guided problem answer satisfies both points', () => {
  const [k, b] = line.input.kind === 'numbers' ? line.input.fields.map((f) => f.answer) : [];
  assert.equal(k * -1 + b, 4);
  assert.equal(k * 2 + b, -2);
});

test('every guided problem has four hint rungs', () => {
  for (const p of Object.values(guidedProblems)) assert.equal(p.hints.length, 4, p.id);
});

/* ---------- formatting and parsing ---------- */

test('numbers are written the school way in each language', () => {
  assert.equal(num(-2, 'ru'), '−2');
  assert.equal(num(0.5, 'uz'), '0,5');
  assert.equal(num(0.5, 'en'), '0.5');
  assert.equal(pt(2, -5, 'ru'), '(2; −5)');
  assert.equal(pt(2, -5, 'en'), '(2, −5)');
  assert.equal(lineEq(-2, 2, 'en'), 'y = −2x + 2');
  assert.equal(lineEq(1, -1, 'en'), 'y = x − 1');
  assert.equal(lineEq(0, 3, 'en'), 'y = 3');
});

test('student input parsing accepts minus variants, commas and fractions', () => {
  assert.equal(parseNumber('−2'), -2);
  assert.equal(parseNumber(' -2 '), -2);
  assert.equal(parseNumber('0,5'), 0.5);
  assert.equal(parseNumber('-1/2'), -0.5);
  assert.equal(parseNumber('1/0'), null);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
});

/* ---------- answer checking ---------- */

test('numeric answers: correct, known misconceptions, invalid input', () => {
  assert.equal(evaluateAttempt(choc, { kind: 'numbers', values: { n: '5' } }).status, 'correct');
  const eaten = evaluateAttempt(choc, { kind: 'numbers', values: { n: '3' } });
  assert.equal(eaten.status, 'incorrect');
  assert.equal(eaten.misconceptionId, 'answered-eaten');
  assert.equal(evaluateAttempt(choc, { kind: 'numbers', values: { n: '' } }).status, 'invalid');
  assert.equal(evaluateAttempt(choc, { kind: 'numbers', values: { n: '6' } }).misconceptionId, undefined);
});

test('two-field answers recognise the sign and substitution mistakes', () => {
  const ev = (k: string, b: string) => evaluateAttempt(line, { kind: 'numbers', values: { k, b } });
  assert.equal(ev('−2', '2').status, 'correct');
  assert.equal(ev('-2', '2').status, 'correct');
  assert.equal(ev('2', '2').misconceptionId, 'sign');
  assert.equal(ev('-1/2', '0').misconceptionId, 'inverted');
  assert.equal(ev('-2', '6').misconceptionId, 'neg-times-neg');
  assert.equal(ev('-2', '4').misconceptionId, 'y-as-b');
  const other = ev('-2', '9');
  assert.equal(other.status, 'incorrect');
  assert.equal(other.feedback?.en, line.fieldFeedback?.b.en);
});

test('choice answers', () => {
  assert.equal(evaluateAttempt(pizza, { kind: 'choice', choice: 'aziza' }).status, 'correct');
  assert.equal(evaluateAttempt(pizza, { kind: 'choice', choice: 'bobur' }).misconceptionId, 'bigger-denominator');
  assert.equal(evaluateAttempt(pizza, { kind: 'choice', choice: 'nobody' }).status, 'invalid');
});

/* ---------- hint ladder ---------- */

test('the student must attempt before any hint, and worked guidance needs real attempts', () => {
  let s = initialLadder;
  assert.equal(canRequestHint(s), false, 'no hint before the first attempt');
  const wrong = evaluateAttempt(choc, { kind: 'numbers', values: { n: '3' } });
  s = afterAttempt(s, wrong);
  assert.deepEqual([s.wrong, s.hintLevel], [1, 1]);
  s = requestHint(s);
  assert.equal(s.hintLevel, 2);
  s = requestHint(s);
  assert.equal(s.hintLevel, 3);
  assert.equal(canRequestHint(s), false, 'rung 4 locked after only one wrong attempt');
  s = afterAttempt(s, wrong);
  assert.equal(s.hintLevel, 3, 'rung stays at 3 on further wrong attempts');
  assert.equal(canRequestHint(s), true, 'rung 4 unlocked after two wrong attempts');
  s = requestHint(s);
  assert.equal(s.hintLevel, 4);
  s = afterAttempt(s, evaluateAttempt(choc, { kind: 'numbers', values: { n: '5' } }));
  assert.equal(s.solved, true);
  assert.equal(canRequestHint(s), false);
});

test('invalid input never counts as an attempt', () => {
  const s = afterAttempt(initialLadder, { status: 'invalid' });
  assert.deepEqual(s, initialLadder);
});

test('the server caps rung 4 when too few attempts are claimed', () => {
  assert.equal(safeLevel(4, 0), 3);
  assert.equal(safeLevel(4, 2), 4);
  assert.equal(safeLevel(99, 5), 4);
  assert.equal(safeLevel(-3, 0), 0);
});

test('curated replies combine targeted feedback with the current rung', () => {
  const ev = evaluateAttempt(choc, { kind: 'numbers', values: { n: '3' } });
  const reply = curatedReply(choc, ev, 1, 'en');
  assert.match(reply, /3 is how many Sardor ate/);
  assert.match(reply, /bottom number 8/);
  assert.doesNotMatch(reply, /\b5\b/);
  const solved = curatedReply(choc, { status: 'correct' }, 2, 'ru');
  assert.equal(solved, choc.explanation.ru);
});

/* ---------- AI output guardrails ---------- */

test('the guard catches answers revealed by generated text', () => {
  const ctx = `${choc.prompt.en} ${choc.hints[2].en}`;
  assert.equal(revealsAnswer('So 5 pieces are left!', choc, 'en', ctx), true);
  assert.equal(revealsAnswer('The bar has 8 pieces and 3 were eaten. Try 8 − 3.', choc, 'en', ctx), false);
  assert.equal(revealsAnswer('That is 5/8 of the bar', choc, 'en', ctx), false, 'a fraction is not the count');

  const lctx = `${line.prompt.en} ${line.hints[1].en}`;
  assert.equal(revealsAnswer('Check the sign: k = −2 here.', line, 'en', lctx), true);
  assert.equal(revealsAnswer('So b = 2.', line, 'en', lctx), true);
  assert.equal(revealsAnswer('The answer is y = −2x + 2.', line, 'en', lctx), true);
  assert.equal(revealsAnswer('From C(−1; 4) to D(2; −2), Δy = −6. What is Δy / Δx?', line, 'en', lctx), false);

  assert.equal(revealsAnswer('Aziza ate more.', pizza, 'en', pizza.prompt.en), true);
  assert.equal(revealsAnswer('Which flatbread has fewer pieces?', pizza, 'en', pizza.prompt.en), false);
});

test('generated text must be in the right script and short enough', () => {
  assert.equal(acceptableText('Проверьте знак k: y убывает?', 'ru', 280), true);
  assert.equal(acceptableText('Check the sign of k.', 'ru', 280), false);
  assert.equal(acceptableText('k ning ishorasini tekshiring.', 'uz', 280), true);
  assert.equal(acceptableText('Проверьте знак', 'uz', 280), false);
  assert.equal(acceptableText('x'.repeat(300), 'en', 280), false);
  assert.equal(acceptableText('See https://example.com', 'en', 280), false);
});

/* ---------- targeted practice ---------- */

test('generated practice items are mathematically correct and reproducible', () => {
  for (const skill of PRACTICE_SKILLS) {
    for (let seed = 1; seed < 60; seed++) {
      const items = makePractice(skill, seed);
      assert.equal(items.length, 3, `${skill}/${seed}`);
      for (const it of items) {
        assert.ok(Number.isFinite(it.answer));
        const sol = it.solution.en.trim().replace(/\.$/, '');
        if (skill === 'read-kb') assert.ok(sol.includes(`k = ${num(it.answer, 'en')}`), sol);
        else assert.ok(sol.endsWith(num(it.answer, 'en')), `${skill}: ${sol}`);
        const v = it.visual;
        if (skill === 'slope' && v?.type === 'two-points') assert.equal((v.b[1] - v.a[1]) / (v.b[0] - v.a[0]), it.answer);
        if (skill === 'root' && v?.type === 'line') assert.equal(v.k * it.answer + v.b, 0);
        if (skill === 'graph' && v?.type === 'line') assert.equal(v.b, it.answer);
      }
    }
    assert.deepEqual(makePractice(skill, 7), makePractice(skill, 7));
  }
});
