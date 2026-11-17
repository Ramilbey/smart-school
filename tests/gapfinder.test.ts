import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NODES, PREREQ, TARGET, diagnose, makeQuestion, missOf, parseAnswer, rng, type Answered, type GQ, type NodeId } from '../shared/gapfinder.ts';

/** Solves what the pupil sees, independently of the generator: a tiny evaluator for these few shapes. */
function solve(q: GQ): number {
  const s = q.show.replace(/−/g, '-').replace(/·/g, '*').replace(/:/g, '/').replace(/\s+/g, '');
  if (q.ask === 'value') return Function(`return (${s})`)() as number;
  if (q.ask === 'blank') {
    // try every whole number in the blank and keep the one that makes both sides equal for several x
    for (let v = -200; v <= 200; v++) {
      const t = s.replace('□', `(${v})`);
      const [l, rr] = t.split('=');
      const f = (side: string, x: number) => Function('x', `return ${side.replace(/(\d|\))x/g, '$1*x').replace(/(\d)\(/g, '$1*(')}`)(x) as number;
      if ([1, 2, 5].every((x) => Math.abs(f(l!, x) - f(rr!, x)) < 1e-9)) return v;
    }
    throw new Error(`no blank value for ${q.show}`);
  }
  const [l, rr] = s.split('=');
  const f = (side: string, x: number) => Function('x', `return ${side.replace(/(\d|\))x/g, '$1*x').replace(/(\d)\(/g, '$1*(')}`)(x) as number;
  for (let x = -50; x <= 50; x++) if (Math.abs(f(l!, x) - f(rr!, x)) < 1e-9) return x;
  throw new Error(`no whole solution for ${q.show}`);
}

test('every question has a whole-number answer that an independent solver agrees with', () => {
  for (const node of NODES) for (let seed = 1; seed <= 300; seed++) {
    const q = makeQuestion(node, rng(seed * 13 + node.length));
    assert.equal(q.node, node);
    assert.ok(Number.isInteger(q.answer), `${node}: ${q.show}`);
    assert.equal(solve(q), q.answer, `${node} seed ${seed}: ${q.show}`);
    assert.ok(q.misses.every((m) => m.value !== q.answer && Number.isInteger(m.value)), `${node}: a "mistake" equals the answer`);
    const last = q.steps.at(-1)!;
    if (q.ask === 'blank') assert.ok(last.includes(String(Math.abs(q.answer))), `${node}: the worked steps show the answer (${last})`);
    else assert.equal(last.replace(/^x = |^= /, '').replace('−', '-'), String(q.answer), `${node}: the worked steps end on the answer (${last})`);
    assert.ok(!/undefined|NaN|\+ −|− −/.test(q.show + q.steps.join()), `${node}: ${q.show} | ${q.steps.join(' / ')}`);
  }
});

test('typical wrong answers are recognised as the mistake behind them', () => {
  // 3(x − 2) = x + 4: multiplying only the x gives 3x − 2 = x + 4, so x = 3
  const q: GQ = { node: 'eq_br', ask: 'x', show: '3(x − 2) = x + 4', answer: 5, misses: [{ value: 3, miss: 'dist_first' }], steps: [] };
  assert.equal(missOf(q, 3), 'dist_first');
  assert.equal(missOf(q, 99), undefined);
  for (let seed = 1; seed <= 100; seed++) {
    const t = makeQuestion('eq1', rng(seed));
    if (t.show.startsWith('x −')) assert.ok(t.misses.some((m) => m.miss === 'move_sign'), t.show);
    const m = makeQuestion('int_mul', rng(seed));
    assert.ok(m.misses.some((x) => x.miss === 'sign_mul' || x.miss === 'div_sign'), m.show);
  }
  assert.equal(parseAnswer(' −12 '), -12);
  assert.equal(parseAnswer('-3'), -3);
  assert.equal(parseAnswer('3.5'), null);
  assert.equal(parseAnswer(''), null);
});

/** A pupil who knows every skill except the ones in `missing`, answering until the diagnosis ends. */
function run(missing: NodeId[]): { roots: NodeId[]; asked: number } {
  const history: Answered[] = [];
  const knows = (id: NodeId): boolean => !missing.includes(id) && PREREQ[id].every(knows);
  for (let i = 0; i < 40; i++) {
    const d = diagnose(history);
    if (!d.next) return { roots: d.roots, asked: history.length };
    history.push({ node: d.next, correct: knows(d.next) });
  }
  throw new Error('the diagnosis never ended');
}

test('the diagnosis goes down to the real missing skill', () => {
  assert.deepEqual(run([]), { roots: [], asked: 2 }, 'a pupil who knows everything answers two questions');
  assert.deepEqual(run(['int_mul']).roots, ['int_mul'], 'negatives: found under brackets and equations');
  assert.deepEqual(run(['dist']).roots, ['dist']);
  assert.deepEqual(run(['like']).roots, ['like']);
  assert.deepEqual(run(['eq1']).roots, ['eq1']);
  assert.deepEqual(run(['int_add']).roots, ['int_add']);
  assert.deepEqual(run(['eq_br']).roots, ['eq_br'], 'every part known, only the whole is new: the target itself is the gap');
  assert.deepEqual(run(['dist', 'like']).roots.sort(), ['dist', 'like']);
  for (const m of NODES) assert.ok(run([m]).asked <= 16, `${m}: too many questions`);
});

test('one slip does not decide a skill', () => {
  const h: Answered[] = [{ node: TARGET, correct: false }];
  assert.equal(diagnose(h).next, TARGET, 'one wrong answer on the equation: ask once more');
  h.push({ node: TARGET, correct: true });
  assert.equal(diagnose(h).next, TARGET, 'one right, one wrong: a third question decides');
  h.push({ node: TARGET, correct: true });
  assert.deepEqual(diagnose(h), { ...diagnose(h), next: null, roots: [] });
});

test('a mistake on the equation makes the matching skill come first', () => {
  const h: Answered[] = [{ node: TARGET, correct: false, miss: 'dist_first' }, { node: TARGET, correct: false, miss: 'dist_first' }];
  assert.equal(diagnose(h).next, 'dist');
  const h2: Answered[] = [{ node: TARGET, correct: false, miss: 'move_sign' }, { node: TARGET, correct: false, miss: 'move_sign' }];
  assert.equal(diagnose(h2).next, 'eq_both');
});
