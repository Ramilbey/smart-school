import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeBeat, normalizeMeta, answerMatches, type Beat } from '../shared/board/script.ts';
import { SAMPLES, sampleFor } from '../shared/board/samples.ts';
import { compileExpr } from '../shared/board/expr.ts';

const allBeats = (s: (typeof SAMPLES)[number]): Beat[] => [...s.beats, ...s.followUps.flatMap((f) => f.beats)];

test('every prepared lesson survives the same checks the AI output gets', () => {
  for (const s of SAMPLES) {
    assert.ok(normalizeMeta(s.meta), `${s.id}: meta`);
    for (const [i, beat] of allBeats(s).entries()) {
      const n = normalizeBeat(beat);
      assert.ok(n, `${s.id} beat ${i}: has words`);
      assert.equal(n.ops.length, beat.ops.length, `${s.id} beat ${i}: no op was dropped by the checks`);
      assert.ok(beat.say.length <= 280, `${s.id} beat ${i}: short enough to say`);
    }
  }
});

test('lessons are sensible: chapters in order, ids unique per board, highlights point at something drawn', () => {
  for (const s of SAMPLES) {
    let last = 0;
    for (const b of s.beats) {
      assert.ok((b.chapter ?? 0) >= last, `${s.id}: chapters never go backwards`);
      last = b.chapter ?? 0;
      assert.ok((b.chapter ?? 0) < s.meta.chapters.length);
    }
    const drawn = new Set<string>();
    for (const b of s.beats) {
      for (const op of b.ops) {
        if (op.op === 'clear') drawn.clear();
        if (op.op === 'highlight' || op.op === 'erase') assert.ok(drawn.has(op.target), `${s.id}: "${op.target}" is highlighted or erased before it is drawn`);
        if ('id' in op && op.id) { assert.ok(!drawn.has(op.id), `${s.id}: id "${op.id}" is used twice on one board`); drawn.add(op.id); }
      }
    }
    for (const f of s.followUps) {
      const ids = new Set<string>();
      for (const b of f.beats) for (const op of b.ops) if ('id' in op && op.id) { assert.ok(!ids.has(op.id), `${s.id}/${f.q}: id "${op.id}" twice`); ids.add(op.id); }
    }
  }
});

test('the numbers on the board are true', () => {
  // Pythagoras: 3-4-5 squares, and the written sums
  const p = SAMPLES.find((s) => s.id === 'pythagoras')!;
  assert.equal(3 * 3 + 4 * 4, 5 * 5);
  assert.equal(5 * 5 + 12 * 12, 13 * 13);
  assert.equal(25 + 144, 169);
  assert.equal(8 * 8 + 15 * 15, 17 * 17);
  assert.ok(answerMatches('10', p.meta.try!.answer));
  assert.equal(Math.sqrt(6 * 6 + 8 * 8), 10);
  // Quadratics: x² − 5x + 6 has roots 2 and 3; x² − 7x + 12 has roots 3 and 4
  const f = compileExpr('x^2-5x+6');
  assert.equal(f(2), 0);
  assert.equal(f(3), 0);
  const g = compileExpr('x^2-7x+12');
  assert.equal(g(3), 0);
  assert.equal(g(4), 0);
  const q = SAMPLES.find((s) => s.id === 'quadratic')!;
  assert.ok(answerMatches('3', q.meta.try!.answer), 'the smaller root of x² − 7x + 12 is 3');
});

test('prepared lessons are found from what a student types, in three languages', () => {
  assert.equal(sampleFor('Pythagorean theorem')?.id, 'pythagoras');
  assert.equal(sampleFor('теорема Пифагора')?.id, 'pythagoras');
  assert.equal(sampleFor('Pifagor teoremasi')?.id, 'pythagoras');
  assert.equal(sampleFor('quadratic equations')?.id, 'quadratic');
  assert.equal(sampleFor('квадратные уравнения')?.id, 'quadratic');
  assert.equal(sampleFor('photosynthesis'), undefined);
});
