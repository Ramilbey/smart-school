import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addSecs, apply, dayKey, emptyActivity, lastDays, lastTopic, load, save, topicKey, topicRows } from '../src/student/activity.ts';

const at = (iso: string) => new Date(iso);

test('topicKey gives one key to a topic however it was started', () => {
  assert.equal(topicKey('Photosynthesis'), topicKey('Фотосинтез'));
  assert.equal(topicKey('Pythagorean theorem', 'pythagoras'), 's:pythagoras');
  assert.equal(topicKey('The Pythagorean theorem'), 's:pythagoras');
  assert.equal(topicKey('  Black Holes '), 'q:black holes');
});

test('apply counts lessons, questions, solved problems and games on the right day', () => {
  let a = emptyActivity();
  const d = at('2026-11-11T10:00:00');
  a = apply(a, { kind: 'lesson', topic: 'Adding fractions' }, d);
  a = apply(a, { kind: 'question' }, d);
  a = apply(a, { kind: 'question' }, d);
  a = apply(a, { kind: 'solved' }, d);
  a = apply(a, { kind: 'game' }, d);
  assert.deepEqual(a.days[dayKey(d)], { lessons: 1, questions: 2, solved: 1, games: 1, secs: 0 });
});

test('apply does not change the object it was given', () => {
  const a = emptyActivity();
  const b = apply(a, { kind: 'lesson', topic: 'x' }, at('2026-11-11T10:00:00'));
  assert.deepEqual(a, emptyActivity());
  assert.notEqual(a, b);
});

test('opening a topic again counts it again and keeps the progress made', () => {
  const d = at('2026-11-11T10:00:00');
  let a = apply(emptyActivity(), { kind: 'lesson', topic: 'The Pythagorean theorem', id: 'pythagoras' }, d);
  a = apply(a, { kind: 'progress', topic: 'The Pythagorean theorem', id: 'pythagoras', pct: 60 }, d);
  a = apply(a, { kind: 'progress', topic: 'The Pythagorean theorem', id: 'pythagoras', pct: 40 }, d); // going back does not lower it
  a = apply(a, { kind: 'lesson', topic: 'The Pythagorean theorem', id: 'pythagoras' }, at('2026-11-12T09:00:00'));
  const rec = a.topics['s:pythagoras']!;
  assert.equal(rec.n, 2);
  assert.equal(rec.pct, 60);
});

test('progress for a topic that was never opened is ignored', () => {
  const a = emptyActivity();
  assert.equal(apply(a, { kind: 'progress', topic: 'nothing', pct: 50 }), a);
});

test('addSecs adds time to today', () => {
  const d = at('2026-11-11T10:00:00');
  const a = addSecs(addSecs(emptyActivity(), 10, d), 10, d);
  assert.equal(a.days[dayKey(d)]!.secs, 20);
});

test('lastDays returns n days, oldest first, today last, zeros for days with nothing', () => {
  const now = at('2026-11-11T10:00:00');
  const a = apply(emptyActivity(), { kind: 'lesson', topic: 'x' }, at('2026-11-09T10:00:00'));
  const w = lastDays(a, 7, now);
  assert.equal(w.length, 7);
  assert.equal(w[6]!.key, '2026-11-11');
  assert.equal(w[0]!.key, '2026-11-05');
  assert.equal(w[4]!.day.lessons, 1);
  assert.equal(w[5]!.day.lessons, 0);
});

test('lastDays crosses a month end', () => {
  const w = lastDays(emptyActivity(), 3, at('2026-12-01T08:00:00'));
  assert.deepEqual(w.map((x) => x.key), ['2026-11-29', '2026-11-30', '2026-12-01']);
});

test('topicRows lists opened topics first, newest first, then suggestions', () => {
  let a = emptyActivity();
  a = apply(a, { kind: 'lesson', topic: 'Black holes' }, at('2026-11-10T10:00:00'));
  a = apply(a, { kind: 'lesson', topic: 'Quadratic equations', id: 'quadratic' }, at('2026-11-11T10:00:00'));
  const rows = topicRows(a, 'en', true, 4);
  assert.equal(rows.length, 4);
  assert.equal(rows[0]!.title, 'Quadratic equations');
  assert.equal(rows[1]!.title, 'Black holes');
  assert.ok(rows.slice(2).every((r) => r.suggested && r.pct === 0));
  assert.equal(new Set(rows.map((r) => r.key)).size, 4);
});

test('topicRows leaves out suggestions that need the AI when it is off', () => {
  const rows = topicRows(emptyActivity(), 'en', false, 4);
  assert.deepEqual(rows.map((r) => r.id), ['pythagoras', 'quadratic']);
});

test('lastTopic is the one opened most recently', () => {
  let a = apply(emptyActivity(), { kind: 'lesson', topic: 'A' }, at('2026-11-10T10:00:00'));
  a = apply(a, { kind: 'lesson', topic: 'B' }, at('2026-11-11T10:00:00'));
  assert.equal(lastTopic(a)!.title, 'B');
  assert.equal(lastTopic(emptyActivity()), undefined);
});

test('old days are dropped after 60 days of history', () => {
  let a = emptyActivity();
  for (let i = 0; i < 70; i++) a = apply(a, { kind: 'question' }, new Date(2026, 0, 1 + i, 12));
  assert.equal(Object.keys(a.days).length, 60);
  assert.ok(!a.days['2026-01-01']);
});

test('save and load round-trip, and broken data loads as empty', () => {
  const mem = new Map<string, string>();
  const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  const a = apply(emptyActivity(), { kind: 'lesson', topic: 'Newton' }, at('2026-11-11T10:00:00'));
  save(a, store);
  assert.deepEqual(load(store), a);
  mem.set([...mem.keys()][0]!, '{not json');
  assert.deepEqual(load(store), emptyActivity());
  mem.set([...mem.keys()][0]!, JSON.stringify({ v: 1, days: { 'x': { lessons: 'many' }, '2026-11-11': { lessons: -5, questions: 3 } }, topics: { a: 7 } }));
  const c = load(store);
  assert.deepEqual(Object.keys(c.days), ['2026-11-11']);
  assert.equal(c.days['2026-11-11']!.lessons, 0);
  assert.equal(c.days['2026-11-11']!.questions, 3);
  assert.deepEqual(c.topics, {});
});

test('a missing storage never throws', () => {
  assert.deepEqual(load(null), emptyActivity());
  save(emptyActivity(), null);
});
