import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ROUND, dailyFor, findTopic, questionFor, subjects, topicById, topics, topicsForGrade, visualSvg, type Question } from '../shared/curriculum/index.ts';
import { solveProblem } from '../shared/solver.ts';
import { LANGS, type Lang } from '../shared/types.ts';

const SEEDS = Array.from({ length: 80 }, (_, i) => i * 37 + 1);
const each = (fn: (q: Question, where: string) => void) => {
  for (const t of topics) for (const seed of SEEDS) for (let i = 0; i < ROUND; i++) fn(questionFor(t, seed, i), `${t.id} seed ${seed} q${i}`);
};
const CLEAN = /undefined|NaN|\[object|Infinity/;
const balanced = (s: string) => (s.match(/<b>/g)?.length ?? 0) === (s.match(/<\/b>/g)?.length ?? 0) && (s.match(/<i>/g)?.length ?? 0) === (s.match(/<\/i>/g)?.length ?? 0);
/** Telegram's HTML mode rejects a bare "<" or ">"; the only angle brackets allowed are real tags. */
const safeHtml = (s: string) => !/<(?!\/?(b|i|code)>)/.test(s);

test('the course covers both grades and follows the four textbooks', () => {
  assert.equal(topics.length, 23);
  assert.equal(topicsForGrade(6).length, 7);
  assert.equal(topicsForGrade(7).length, 16);
  assert.equal(subjects.length, 4);
  assert.equal(new Set(topics.map((t) => t.id)).size, topics.length, 'unique ids');
});

test('every lesson card is written in all three languages and fits a Telegram caption', () => {
  for (const t of topics) {
    assert.ok(t.cards.length >= 2, t.id);
    assert.ok(t.gens.length >= 2, t.id);
    for (const l of LANGS) {
      assert.ok(t.title[l] && t.book[l], t.id);
      for (const c of t.cards) {
        assert.ok(c.text[l].length > 10, `${t.id} ${l}`);
        assert.ok(c.text[l].length + 120 < 1024, `${t.id} ${l} card too long`);
        assert.ok(balanced(c.text[l]), `${t.id} ${l} tags`);
        assert.ok(safeHtml(c.text[l]), `${t.id} ${l} html`);
      }
    }
  }
});

test('every generated question has four different answers in every language', () => {
  each((q, where) => {
    assert.equal(q.choices.length, 4, where);
    assert.ok(q.correct >= 0 && q.correct < 4, where);
    for (const l of LANGS) {
      const labels = q.choices.map((c) => c[l]);
      assert.equal(new Set(labels).size, 4, `${where} ${l}: ${labels}`);
      for (const part of [q.prompt[l], q.explain[l], q.hints[0][l], q.hints[1][l], ...labels]) {
        assert.ok(part.length > 0, where);
        assert.ok(!CLEAN.test(part), `${where} ${l}: ${part}`);
        assert.ok(balanced(part), `${where} ${l}: ${part}`);
        assert.ok(safeHtml(part), `${where} ${l}: ${part}`);
      }
      // Question, both hints and the worked answer must fit one Telegram caption.
      const size = q.prompt[l].length + q.hints[0][l].length + q.hints[1][l].length + q.explain[l].length;
      assert.ok(size < 800, `${where} ${l}: ${size}`);
    }
  });
});

test('every button fits Telegram’s 64-byte limit', () => {
  for (const t of topics) {
    const longest = `a|R|${t.id}|999999|4|5|50|15|2|3`;
    assert.ok(Buffer.byteLength(longest) <= 64, longest);
  }
});

test('equation questions agree with the independent solver', () => {
  let checked = 0;
  each((q, where) => {
    if (!q.check) return;
    const solved = solveProblem(q.check.expression);
    assert.ok(solved, `${where}: ${q.check.expression}`);
    assert.ok(Math.abs(solved!.value! - q.check.root) < 1e-9, `${where}: ${q.check.expression} gives ${solved!.value}, expected ${q.check.root}`);
    assert.equal(q.choices[q.correct].ru, String(q.check.root).replace('-', '−'), where);
    checked++;
  });
  assert.ok(checked > 1000, `only ${checked} checked`);
});

/** An independent oracle: re-reads the English question and works it out from scratch. */
function oracle(en: string): number | null {
  let m: RegExpExecArray | null;
  if ((m = /What is <b>(\d+)%<\/b> of <b>(\d+)<\/b>/.exec(en))) return (Number(m[1]) * Number(m[2])) / 100;
  if ((m = /If x = (\d+), what is <b>(\d+)x \+ (\d+)<\/b>/.exec(en))) return Number(m[2]) * Number(m[1]) + Number(m[3]);
  if ((m = /covers (\d+) km at (\d+) km\/h/.exec(en))) return Number(m[1]) / Number(m[2]);
  if ((m = /covers (\d+) km in (\d+) hours/.exec(en))) return Number(m[1]) / Number(m[2]);
  if ((m = /mass of (\d+) kg and a volume of (\d+) m³/.exec(en))) return Number(m[1]) / Number(m[2]);
  if ((m = /voltage is (\d+) V and the resistance is (\d+) Ω/.exec(en))) return Number(m[1]) / Number(m[2]);
  if ((m = /current is (\d+) A and the resistance is (\d+) Ω/.exec(en))) return Number(m[1]) * Number(m[2]);
  if ((m = /voltage is (\d+) V and the current is (\d+) A/.exec(en))) return Number(m[1]) / Number(m[2]);
  if ((m = /pressure is (\d+) Pa and the area is (\d+) m²/.exec(en))) return Number(m[1]) * Number(m[2]);
  if ((m = /Work out: <b>(\d+)([²³⁴⁵])<\/b>/.exec(en))) return Number(m[1]) ** '  ²³⁴⁵'.indexOf(m[2]);
  if ((m = /radius is (\d+) cm. What is its diameter/.exec(en))) return 2 * Number(m[1]);
  if ((m = /Work out: <b>(\d+) ÷ (\d+)<\/b>/.exec(en))) return Number(m[1]) / Number(m[2]);
  if ((m = /No calculator, use the formula: <b>(\d+) · (\d+)<\/b>/.exec(en))) return Number(m[1]) * Number(m[2]);
  if ((m = /Each of (\d+) loaves of non is cut into (\d+)/.exec(en))) return Number(m[1]) * Number(m[2]);
  if ((m = /has (\d+) shirts and (\d+) pairs/.exec(en))) return Number(m[1]) * Number(m[2]);
  return null;
}

test('computed answers match an independent re-calculation', () => {
  let checked = 0;
  each((q, where) => {
    const expected = oracle(q.prompt.en);
    if (expected === null) return;
    const shown = Number(q.choices[q.correct].en.replace('−', '-'));
    assert.ok(Math.abs(shown - expected) < 1e-9, `${where}: ${q.prompt.en} shows ${shown}, expected ${expected}`);
    checked++;
  });
  assert.ok(checked > 1000, `only ${checked} checked`);
});

test('every picture is valid in every language, and geometry is real geometry', () => {
  const look = (v: NonNullable<Question['visual']>, where: string) => {
    for (const l of LANGS as Lang[]) {
      const svg = visualSvg(v, l);
      assert.ok(svg.startsWith('<svg'), where);
      assert.ok(!CLEAN.test(svg), `${where}: ${JSON.stringify(v)}`);
    }
    if (v.t === 'triangle') {
      assert.equal(v.deg[0] + v.deg[1] + v.deg[2], 180, `${where}: ${v.deg}`);
      assert.ok(v.deg.every((d) => d > 0), `${where}: ${v.deg}`);
    }
    if (v.t === 'straight' && v.split !== undefined) assert.ok(v.split > 0 && v.split < 180, where);
    if (v.t === 'cross') assert.ok(v.deg > 0 && v.deg < 180, where);
    if (v.t === 'parallel') assert.ok(v.deg > 0 && v.deg < 180, where);
    if (v.t === 'fraction') for (const r of v.rows) assert.ok(r.n <= r.d && r.d > 0, where);
  };
  for (const t of topics) for (const c of t.cards) if (c.visual) look(c.visual, t.id);
  each((q, where) => {
    if (q.visual) look(q.visual, where);
  });
});

test('a question can always be rebuilt from its seed, even after a restart', () => {
  const t = topicById('a7-eq')!;
  assert.deepEqual(JSON.stringify(questionFor(t, 123, 2)), JSON.stringify(questionFor(t, 123, 2)));
  assert.notEqual(JSON.stringify(questionFor(t, 123, 2)), JSON.stringify(questionFor(t, 124, 2)));
});

test('the daily problem is the same for a grade all day and changes the next day', () => {
  const a = dailyFor(7, '2026-11-05');
  assert.deepEqual(a, dailyFor(7, '2026-11-05'));
  assert.equal(a.topic.grade, 7);
  assert.equal(dailyFor(6, '2026-11-05').topic.grade, 6);
  const days = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(dailyFor(7, `2026-11-${10 + i}`))));
  assert.ok(days.size > 15);
});

test('students can find a topic by typing a word, in any language', () => {
  assert.equal(findTopic('foiz nima?', 6)?.id, 'm6-percent');
  assert.equal(findTopic('что такое проценты', 6)?.id, 'm6-percent');
  assert.equal(findTopic('tezlik qanday topiladi', 7)?.id, 'f7-speed');
  assert.equal(findTopic('uchburchak', 7)?.grade, 7);
  assert.equal(findTopic('uchburchak', 6)?.grade, 6);
  assert.equal(findTopic('salom', 7), undefined);
});
