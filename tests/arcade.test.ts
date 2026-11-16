import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GAME_IDS, MAX_LEVEL, check, emptyArcade, gaps, makeQuestion, mastery, record, rng, solution, starsFor, step, type Answer, type Question } from '../shared/arcade.ts';

/** The answer a child who understood the question would give. */
function rightAnswer(q: Question): Answer {
  if (q.game === 'place' && q.kind === 'build') return { h: Math.floor(q.target / 100), t: Math.floor((q.target % 100) / 10), o: q.target % 10 };
  if (q.game === 'arrays' && q.kind === 'build') return { rows: q.rows, cols: q.cols };
  return solution(q);
}

test('every game makes questions at every level, and the right answer is accepted', () => {
  for (const game of GAME_IDS) for (let level = 1; level <= MAX_LEVEL; level++) for (let seed = 1; seed <= 150; seed++) {
    const q = makeQuestion(game, level, rng(seed * 7 + level));
    assert.equal(q.game, game);
    assert.equal(q.level, level);
    assert.deepEqual(check(q, rightAnswer(q)), { ok: true }, `${game} L${level} seed ${seed}: ${JSON.stringify(q)}`);
    if ('options' in q) {
      assert.equal(new Set(q.options).size, q.options.length, 'no repeated choices');
      assert.equal(q.options.filter((o) => o === solution(q)).length, 1, 'the right answer is among the choices, once');
      assert.ok(q.options.every((o) => o >= 0), 'no negative choices');
    }
  }
});

test('questions stay inside what the level promises', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const r = rng(seed);
    const n1 = makeQuestion('numline', 1, r); assert.ok(n1.game === 'numline' && n1.max === 10 && n1.target > 0 && n1.target < 10 && !n1.labels.includes(n1.target));
    const n4 = makeQuestion('numline', 4, r); assert.ok(n4.game === 'numline' && n4.max === 1000 && n4.target % 10 === 0);
    const t4 = makeQuestion('maketen', 4, r); assert.ok(t4.game === 'maketen' && t4.a + t4.b > 10 && t4.b <= 9, 'bridging goes past ten');
    const p4 = makeQuestion('place', 4, r); assert.ok(p4.game === 'place' && p4.kind === 'read' && p4.ones > 9, 'more than nine ones, so a ten must be traded');
    const f2 = makeQuestion('fractions', 2, r); assert.ok(f2.game === 'fractions' && f2.a[0] === f2.b[0] && f2.a[1] !== f2.b[1], 'same numerator, different denominators');
    const f1 = makeQuestion('fractions', 1, r); assert.ok(f1.game === 'fractions' && f1.a[1] === f1.b[1] && f1.showBars);
    const s1 = makeQuestion('stories', 1, r); assert.ok(s1.game === 'stories' && s1.answer > 0 && s1.models.includes(s1.model) && s1.models.length === 3);
    const s4 = makeQuestion('stories', 4, r); assert.ok(s4.game === 'stories' && (s4.kind === 'groups' ? s4.a * s4.b === s4.answer : s4.a / s4.b === s4.answer));
  }
});

test('a wrong answer is matched to the mistake behind it', () => {
  // the classic: 1/5 looks bigger than 1/3 because 5 is bigger than 3
  assert.deepEqual(check({ game: 'fractions', level: 2, a: [1, 3], b: [1, 5], answer: 'a', showBars: false, withEqual: false }, 'b'), { ok: false, miss: 'fr_bigden' });
  assert.deepEqual(check({ game: 'fractions', level: 4, a: [1, 2], b: [2, 4], answer: 'eq', showBars: false, withEqual: true }, 'b'), { ok: false, miss: 'fr_equal' });
  // 3 rows of 4 answered as 3 + 4
  assert.deepEqual(check({ game: 'arrays', level: 1, kind: 'count', rows: 3, cols: 4, answer: 12, options: [12, 7, 16, 9] }, 7), { ok: false, miss: 'arr_add' });
  // 34 built as 4 tens and 3 ones
  assert.deepEqual(check({ game: 'place', level: 2, kind: 'build', target: 34, places: 2 }, { h: 0, t: 4, o: 3 }), { ok: false, miss: 'pv_swap' });
  // 2 tens and 14 ones read as 214
  assert.deepEqual(check({ game: 'place', level: 4, kind: 'read', tens: 2, ones: 14, target: 34, options: [34, 214, 24, 44] }, 214), { ok: false, miss: 'pv_regroup' });
  // 37 put on the right half of a 0–100 line
  assert.deepEqual(check({ game: 'numline', level: 3, min: 0, max: 100, target: 37, step: 10, labels: [0, 50, 100], snap: false, tol: 5 }, 70), { ok: false, miss: 'nl_half' });
  assert.deepEqual(check({ game: 'numline', level: 3, min: 0, max: 100, target: 37, step: 10, labels: [0, 50, 100], snap: false, tol: 5 }, 40), { ok: true });
  // a "how many are left" story answered by adding
  const story: Question = { game: 'stories', level: 1, kind: 'separate', a: 12, b: 5, answer: 7, who: 0, thing: 0, model: 'part', models: ['sum', 'part', 'diff'], options: [7, 17, 8, 6] };
  assert.deepEqual(check(story, 17), { ok: false, miss: 'st_op' });
  assert.deepEqual(check(story, { model: 'sum' }), { ok: false, partial: true, miss: 'st_model' });
  assert.deepEqual(check(story, { model: 'part' }), { ok: true, partial: true });
  // rows and columns may be swapped: 3 rows of 5 is as many as 5 rows of 3
  assert.deepEqual(check({ game: 'arrays', level: 2, kind: 'build', rows: 3, cols: 5, answer: 15 }, { rows: 5, cols: 3 }), { ok: true });
});

test('the level follows the child: three right in a row goes up, two wrong in a row goes down', () => {
  let p = { level: 1, up: 0, down: 0 };
  p = step(p, true); p = step(p, true); assert.equal(p.level, 1);
  const up = step(p, true); assert.equal(up.level, 2); assert.equal(up.moved, 1);
  p = step(up, false); assert.equal(p.level, 2);
  const down = step(p, false); assert.equal(down.level, 1); assert.equal(down.moved, -1);
  assert.equal(step({ level: 1, up: 0, down: 1 }, false).level, 1, 'never below level 1');
  assert.equal(step({ level: MAX_LEVEL, up: 2, down: 0 }, true).level, MAX_LEVEL, 'never above the top level');
  assert.equal(step({ level: 2, up: 2, down: 0 }, false).up, 0, 'a wrong answer breaks the streak');
});

test('the skills map: strong, practising, needs help', () => {
  assert.equal(mastery(undefined), 'new');
  assert.equal(mastery({ seen: 5, right: 5 }), 'strong');
  assert.equal(mastery({ seen: 2, right: 2 }), 'practising', 'two answers are too few to call it strong');
  assert.equal(mastery({ seen: 4, right: 1 }), 'help');
  let s = emptyArcade();
  for (let i = 0; i < 4; i++) s = record(s, 'fractions', 2, false, 'fr_bigden');
  for (let i = 0; i < 5; i++) s = record(s, 'maketen', 1, true);
  assert.deepEqual(s.skills['fractions:2'], { seen: 4, right: 0 });
  assert.equal(s.misses.fr_bigden, 4);
  assert.deepEqual(gaps(s).map((g) => `${g.game}:${g.level}`), ['fractions:2']);
  assert.equal(starsFor(8, 8), 3); assert.equal(starsFor(5, 8), 2); assert.equal(starsFor(2, 8), 1);
});
