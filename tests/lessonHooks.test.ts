import assert from 'node:assert/strict';
import { test } from 'node:test';
import { topicsOf } from '../shared/curriculum/index.ts';
import { HOOKS } from '../src/student/lessons/text.ts';
import { LANGS } from '../shared/types.ts';

test('every Algebra 7 and Physics 7 topic opens with a real-life question in all three languages', () => {
  for (const topic of [...topicsOf('algebra7'), ...topicsOf('physics7')]) {
    const h = HOOKS[topic.id];
    assert.ok(h, `${topic.id} has no real-life question`);
    for (const l of LANGS) {
      for (const part of [h.q[l], h.a[l], h.place[l]]) assert.ok(part && part.length > 8 && !/undefined|NaN/.test(part), `${topic.id} ${l}`);
      assert.ok(h.q[l].length < 330 && h.a[l].length < 330, `${topic.id} ${l} is too long to read at a glance`);
    }
    assert.ok(/[А-Яа-яЁё]/.test(h.q.ru) && !/[А-Яа-яЁё]/.test(h.q.uz) && !/[А-Яа-яЁё]/.test(h.q.en), `${topic.id} script`);
  }
  for (const id of Object.keys(HOOKS)) assert.ok(topicsOf('algebra7').concat(topicsOf('physics7')).some((t) => t.id === id), `${id} is not a real topic`);
});

test('the numbers in the Algebra 7 answers are right', () => {
  const a = (id: string) => HOOKS[id].a.en;
  assert.equal(3 * (12000 + 4000), 48000);
  assert.ok(a('a7-expr').includes('48 000'));
  assert.equal(2 ** 10, 1024);
  assert.ok(a('a7-power').includes('1024'));
  const x = 10;
  assert.equal(x * (x + 5), 150);
  assert.equal(2 * (x + x + 5), 50);
  assert.ok(a('a7-poly').includes('150') && a('a7-poly').includes('50 m'));
  assert.equal(99 ** 2, 9801);
  assert.equal(10000 - 200 + 1, 9801);
  assert.ok(a('a7-fsu').includes('9801'));
  assert.equal((70000 - 30000) / 200, 200);
  assert.ok(a('a7-eq').includes('200 minutes'));
  assert.equal((120000 - 20000) / 2, 50000);
  assert.ok(a('a7-word').includes('50 000') && a('a7-word').includes('70 000'));
  // taxi A: 5000 + 3000x, taxi B: 4000x
  const cross = 5000 / (4000 - 3000);
  assert.equal(cross, 5);
  assert.equal(5000 + 3000 * cross, 4000 * cross);
  assert.ok(a('a7-func').includes('20 000'));
  // 3n + 2p = 13, 2n + 3p = 12
  const det = 3 * 3 - 2 * 2, n = (13 * 3 - 2 * 12) / det, p = (3 * 12 - 2 * 13) / det;
  assert.deepEqual([n, p], [3, 2]);
  assert.ok(a('a7-sys').includes('n = 3') && a('a7-sys').includes('p = 2'));
  assert.equal(4 * 3 * 2, 24);
  assert.ok(a('a7-comb').includes('24'));
});
