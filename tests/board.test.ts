import assert from 'node:assert/strict';
import test from 'node:test';
import { compileExpr, ExprError } from '../shared/board/expr.ts';
import { answerMatches, fixTex, normalizeBeat, normalizeMeta, normalizeOp } from '../shared/board/script.ts';

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} should be ${b}`);

test('formulas: the maths a school graph needs', () => {
  close(compileExpr('x^2 - 5x + 6')(2), 0);
  close(compileExpr('x^2 - 5x + 6')(0), 6);
  close(compileExpr('x² − 5x + 6')(3), 0); // the characters a textbook uses
  close(compileExpr('2x+1')(4), 9); // implicit multiplication
  close(compileExpr('3(x+1)')(1), 6);
  close(compileExpr('x(x-1)')(4), 12);
  close(compileExpr('-x^2')(3), -9); // minus binds looser than the power
  close(compileExpr('2^3^2')(0), 512); // right-associative
  close(compileExpr('x^-1')(4), 0.25);
  close(compileExpr('sqrt(x)')(9), 3);
  close(compileExpr('sin(pi/2)')(0), 1);
  close(compileExpr('abs(x-5)')(2), 3);
  close(compileExpr('1/x')(4), 0.25);
});

test('formulas: anything that is not plain maths is refused, never run', () => {
  for (const bad of ['alert(1)', 'x.constructor', 'process.exit()', '__proto__', 'x;x', '2 +', '(x', 'x)', 'foo(x)', 'sin', 'x ** ** 2', '`x`', 'a+b']) {
    assert.throws(() => compileExpr(bad), ExprError, bad);
  }
  assert.throws(() => compileExpr('x+'.repeat(80)), ExprError, 'too long');
});

test('a beat from the AI is checked and trimmed', () => {
  const beat = normalizeBeat({
    say: '  So we need two numbers\n that multiply to six.  ',
    chapter: 1.4,
    ops: [
      { op: 'math', id: 'eq1', x: 80, y: 130, tex: 'x^2-5x+6=0', size: 'xl', ink: 'ink' },
      { op: 'text', x: 5000, y: -40, text: 'far outside', ink: 'purple' },
      { op: 'unknown', foo: 1 },
      { op: 'line', x1: 10, y1: 10, x2: 'NaN', y2: 5 },
      'nonsense',
      null,
    ],
  });
  assert.ok(beat);
  assert.equal(beat.say, 'So we need two numbers that multiply to six.');
  assert.equal(beat.chapter, 1);
  assert.equal(beat.ops.length, 2, 'the two good ops stay, the broken ones go');
  const text = beat.ops[1]!;
  assert.equal(text.op, 'text');
  if (text.op === 'text') {
    assert.equal(text.x, 1000, 'pulled back onto the board');
    assert.equal(text.y, 0);
    assert.equal(text.ink, undefined, 'a colour that is not in the palette is dropped');
  }
});

test('a beat with nothing to say is dropped; markup and control characters never reach the page', () => {
  assert.equal(normalizeBeat({ say: '   ', ops: [] }), null);
  assert.equal(normalizeBeat('hello'), null);
  assert.equal(normalizeBeat(null), null);
  const b = normalizeBeat({ say: 'Look <img src=x onerror=alert(1)> here\u0000', ops: [{ op: 'text', x: 1, y: 1, text: '<script>alert(1)</script>' }] });
  assert.ok(b);
  assert.ok(!/[<>\u0000]/.test(b.say));
  assert.ok(!/[<>]/.test(JSON.stringify(b.ops)));
});

test('limits: a runaway answer cannot flood the board', () => {
  const ops = Array.from({ length: 100 }, (_, i) => ({ op: 'text', x: i, y: i, text: 'x'.repeat(500) }));
  const b = normalizeBeat({ say: 'y'.repeat(2000), ops });
  assert.ok(b);
  assert.ok(b.say.length <= 280);
  assert.equal(b.ops.length, 16);
  const t = b.ops[0]!;
  if (t.op === 'text') assert.ok(t.text.length <= 90);
  const poly = normalizeOp({ op: 'poly', points: Array.from({ length: 500 }, (_, i) => [i, i]) });
  assert.ok(poly && poly.op === 'poly' && poly.points.length === 40);
});

test('a graph keeps only formulas that can be drawn', () => {
  const ok = normalizeOp({ op: 'graph', x: 600, y: 300, w: 300, h: 220, fn: 'x^2-5x+6', xmin: -1, xmax: 6, ymin: -2, ymax: 10, marks: [2, 3, 99] });
  assert.ok(ok && ok.op === 'graph');
  if (ok && ok.op === 'graph') assert.deepEqual(ok.marks, [2, 3, 6], 'a mark outside the range is pulled to the edge');
  assert.equal(normalizeOp({ op: 'graph', x: 1, y: 1, w: 300, h: 200, fn: 'alert(1)', xmin: 0, xmax: 1, ymin: 0, ymax: 1 }), null);
  assert.equal(normalizeOp({ op: 'graph', x: 1, y: 1, w: 300, h: 200, fn: 'x', xmin: 5, xmax: 1, ymin: 0, ymax: 1 }), null, 'an empty range');
});

test('vocabulary cards keep three languages and drop empty entries', () => {
  const t = normalizeOp({ op: 'terms', items: [{ en: 'hypotenuse', ru: 'гипотенуза', uz: 'gipotenuza' }, { ru: 'нет английского' }, { en: 'leg' }] });
  assert.ok(t && t.op === 'terms');
  if (t && t.op === 'terms') {
    assert.equal(t.items.length, 2);
    assert.equal(t.items[0]!.uz, 'gipotenuza');
  }
});

test('lesson meta: title, chapters and the question to try', () => {
  const m = normalizeMeta({ title: 'The Pythagorean theorem', chapters: ['The idea', 'See it', '', 7, 'Try one'], try: { question: 'Legs 6 and 8: how long is c?', answer: '10' } });
  assert.ok(m);
  assert.deepEqual(m.chapters, ['The idea', 'See it', 'Try one']);
  assert.equal(m.try?.answer, '10');
  assert.equal(normalizeMeta({ chapters: ['x'] }), null, 'a title is required');
  assert.deepEqual(normalizeMeta({ title: 'T' })?.chapters, ['The lesson']);
});

test('typed answers: numbers by value, words ignoring case and spaces', () => {
  assert.ok(answerMatches('10', '10'));
  assert.ok(answerMatches(' 10.0 ', '10'));
  assert.ok(answerMatches('2,5', '2.5'));
  assert.ok(!answerMatches('11', '10'));
  assert.ok(!answerMatches('', '10'));
  assert.ok(answerMatches('Right Angle', 'right angle'));
  assert.ok(!answerMatches('acute', 'right angle'));
});

test('LaTeX with a single backslash in JSON is repaired instead of showing "imes"', () => {
  // JSON "\\times" with one backslash is read as a TAB; "\\frac" as a form feed; "\\beta" as a backspace; "\\textcolor" as a TAB
  const broken = JSON.parse('{"tex":"3.14\\times5^2 + \\frac{1}{2} + \\beta + \\textcolor{#ffb547}{2}"}').tex as string;
  assert.ok(/[\t\f\b]/.test(broken), 'the broken text really holds control characters');
  assert.equal(fixTex(broken), '3.14\\times5^2 + \\frac{1}{2} + \\beta + \\textcolor{#ffb547}{2}');
  const op = normalizeOp(JSON.parse('{"op":"math","x":10,"y":10,"tex":"a\\times b"}'));
  assert.ok(op && op.op === 'math' && op.tex === 'a\\times b');
  assert.equal(fixTex('\\frac{1}{2}'), '\\frac{1}{2}', 'a correct formula is left alone');
  assert.equal(fixTex(5), 5);
});
