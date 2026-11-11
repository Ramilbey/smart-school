import assert from 'node:assert/strict';
import { test } from 'node:test';
import { solveProblem } from '../shared/solver.ts';

const value = (s: string) => solveProblem(s)?.value;
const answer = (s: string) => solveProblem(s)?.answer.en;

test('linear equations, including typed variations', () => {
  assert.equal(value('2x + 3 = 11'), 4);
  assert.equal(value('2x+3=11'), 4);
  assert.equal(value('3(x-2)=12'), 6); // same result as the worked example in Algebra 7
  assert.equal(value('5x + 57 = -4x - 15'), -8);
  assert.equal(value('11x - 2 = 21'), 23 / 11);
  assert.equal(value('0,5x = 2'), 4);
  assert.equal(value('x/2 + 1 = 4'), 6);
  assert.equal(value('2х + 3 = 11'), 4, 'Cyrillic х is accepted');
  assert.equal(value('−x + 5 = 49'), -44);
});

test('the three kinds of linear equation from Algebra 7', () => {
  assert.equal(answer('x + 5 = x'), 'No roots');
  assert.equal(answer('2(x - 1) = 2(x - 7) + 12'), 'Infinitely many roots');
  assert.equal(answer('2(5x-4)=8x+2'), 'x = 5');
});

test('every equation shows steps and ends with a passing check', () => {
  const s = solveProblem('3x - 4 = 11')!;
  assert.ok(s.steps.length >= 2);
  assert.match(s.steps[0].uz, /Al-jabr/);
  assert.match(s.steps.at(-1)!.en, /Check/);
  assert.equal(s.answer.en, 'x = 5');
  // The answer must not be given away before the last step.
  assert.ok(!s.steps[0].en.includes('x = 5'));
});

test('fractions', () => {
  assert.equal(value('3/4 + 1/2'), 5 / 4);
  assert.equal(value('2/3 : 4/5'), 5 / 6);
  assert.equal(value('2/3 * 3/4'), 1 / 2);
  assert.equal(value('5/6 - 1/3'), 1 / 2);
  assert.match(solveProblem('3/4 + 1/2')!.steps[0].en, /common denominator/);
});

test('arithmetic and powers', () => {
  assert.equal(value('12*(3+4)'), 84);
  assert.equal(value('2^5'), 32);
  assert.equal(value('2 + 3 * 4'), 14);
  assert.equal(value('10 - 2 - 3'), 5);
  assert.equal(value('7 : 2'), 3.5);
});

test('percentages in three languages', () => {
  assert.equal(value('80 ning 25%'), 20);
  assert.equal(value('80 ning 25% i'), 20);
  assert.equal(value('25% of 80'), 20);
  assert.equal(value('25% от 80'), 20);
});

test('simplifying and squares', () => {
  assert.equal(answer('3x + 2x - 5 + 7'), '5x + 2');
  assert.equal(answer('5x - (x - 3)'), '4x + 3');
  assert.equal(answer('(x+3)^2'), 'x² + 6x + 9');
  assert.equal(answer('(x-3)²'), 'x² − 6x + 9');
});

test('ordinary words and impossible input are not treated as maths', () => {
  for (const s of ['salom', 'kasr nima?', 'привет', 'hello', '2024', 'x', '5 = 5', '3x²+1=0', '1/0 + 1', '2x = ', '= 4', '(((']) {
    assert.equal(solveProblem(s), null, s);
  }
});
