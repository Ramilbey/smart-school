import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ROUND, questionFor, topicById, visualSvg, type Question, type Visual } from '../shared/curriculum/index.ts';
import { LANGS } from '../shared/types.ts';

const SEEDS = Array.from({ length: 120 }, (_, i) => i * 53 + 7);
const PHYSICS = ['f7-speed', 'f7-density', 'f7-pressure', 'f7-ohm'];

function each(fn: (q: Question, where: string) => void) {
  for (const id of PHYSICS) for (const seed of SEEDS) for (let i = 0; i < ROUND; i++) fn(questionFor(topicById(id)!, seed, i), `${id} seed ${seed} q${i}`);
}
const num = (s: string) => Number(s.replace('−', '-').replace(',', '.'));

/** Works the question out again from its English text alone. Returns null for questions it does not cover. */
function oracle(q: Question): number | null {
  const en = q.prompt.en;
  let m: RegExpExecArray | null;
  if ((m = /moves at (\d+) km\/h\. How many metres per second/.exec(en))) return Number(m[1]) / 3.6;
  if ((m = /moves at (\d+) m\/s\. How many kilometres per hour/.exec(en))) return Number(m[1]) * 3.6;
  if ((m = /for (\d+) h at (\d+) km\/h and then for (\d+) h at (\d+) km\/h/.exec(en))) return (Number(m[1]) * Number(m[2]) + Number(m[3]) * Number(m[4])) / (Number(m[1]) + Number(m[3]));
  if ((m = /Two towns are (\d+) km apart.*at (\d+) km\/h and (\d+) km\/h/.exec(en))) return Number(m[1]) / (Number(m[2]) + Number(m[3]));
  if ((m = /mass of (\d+) kg and its density is (\d+) kg\/m³\. What is its volume/.exec(en))) return Number(m[1]) / Number(m[2]);
  if ((m = /density of ([\d.]+) g\/cm³\. How many kg\/m³/.exec(en))) return Math.round(Number(m[1]) * 1000);
  if ((m = /A box of mass (\d+) kg stands on the floor/.exec(en))) return Number(m[1]) * 10;
  if ((m = /student of mass (\d+) kg.*total area of ([\d.]+) m²/.exec(en))) return Math.round((Number(m[1]) * 10) / Number(m[2]));
  if ((m = /diver is (\d+) m under the surface/.exec(en))) return (1000 * 10 * Number(m[1])) / 1000;
  if ((m = /water pressure is (\d+) kPa\. How deep/.exec(en))) return (Number(m[1]) * 1000) / (1000 * 10);
  if ((m = /A (\d+) V battery is connected to two resistors in series: (\d+) Ω and (\d+) Ω/.exec(en))) return Number(m[1]) / (Number(m[2]) + Number(m[3]));
  if ((m = /A (\d+) V battery is connected to resistors of (\d+) Ω and (\d+) Ω in series.*across the (\d+) Ω resistor/.exec(en))) return (Number(m[1]) / (Number(m[2]) + Number(m[3]))) * Number(m[4]);
  return null;
}

test('the new Physics questions agree with an independent re-calculation', () => {
  let checked = 0;
  each((q, where) => {
    const want = oracle(q);
    if (want === null) return;
    const shown = num(q.choices[q.correct].en);
    assert.ok(Math.abs(shown - want) < 1e-9, `${where}: ${q.prompt.en} shows ${shown}, expected ${want}`);
    checked++;
  });
  assert.ok(checked > 800, `only ${checked} checked`);
});

test('a floating block: the fraction under water equals its density over the water’s', () => {
  let checked = 0;
  each((q, where) => {
    const m = /density of (\d+) kg\/m³ and floats/.exec(q.prompt.en);
    if (!m) return;
    const [a, b] = q.choices[q.correct].en.split('/').map(Number);
    assert.ok(Math.abs(a / b - Number(m[1]) / 1000) < 1e-9, `${where}: ${q.choices[q.correct].en} for ${m[1]}`);
    checked++;
  });
  assert.ok(checked > 20, `only ${checked} floating-block questions`);
});

test('questions read from a graph agree with the graph that is drawn', () => {
  let checked = 0;
  each((q, where) => {
    const v = q.visual;
    if (!v || v.t !== 'chart' || !v.marks?.length) return;
    const shown = num(q.choices[q.correct].en);
    const known = v.marks.find((mk) => mk.ly !== '?' && mk.lx !== '?');
    const unknown = v.marks.find((mk) => mk.ly === '?');
    // every drawn point lies on the straight line through the origin, so the slope is the same everywhere
    const slope = v.pts[1][1] / v.pts[1][0];
    for (const mk of v.marks) assert.ok(Math.abs(mk.y - slope * mk.x) < 1e-9, `${where}: mark off the line`);
    if (unknown) assert.ok(Math.abs(shown - unknown.y) < 1e-9, `${where}: asks for ${unknown.y}, answer ${shown}`);
    else if (known) {
      // speed, density or resistance: the answer is the slope, y over x (or x over y for resistance)
      const ok = [known.y / known.x, known.x / known.y].some((s) => Math.abs(s - shown) < 1e-9);
      assert.ok(ok, `${where}: answer ${shown} is not read from the marked point (${known.x}, ${known.y})`);
    }
    checked++;
  });
  assert.ok(checked > 300, `only ${checked} graph questions`);
});

test('the lessons are richer than before and every new picture draws in every language', () => {
  for (const id of PHYSICS) {
    const t = topicById(id)!;
    assert.ok(t.cards.length >= 4, `${id} has ${t.cards.length} cards`);
    assert.ok(t.gens.length >= 6, `${id} has ${t.gens.length} question types`);
    for (const c of t.cards) if (c.visual) for (const l of LANGS) assert.ok(visualSvg(c.visual, l).startsWith('<svg'), `${id} card picture`);
  }
  for (const l of LANGS) {
    const pictures: Visual[] = [
      { t: 'float', rho: 900 }, { t: 'float', rho: 2700 },
      { t: 'series', u: '12 V', r1: '2 Ω', r2: '4 Ω', i: 'I = 2 A' },
      { t: 'chart', pts: [[0, 0], [4, 240]], xMax: 4, yMax: 240, xStep: 1, yStep: 60, xName: 't, h', yName: 's, km', marks: [{ x: 3, y: 180, lx: '3 h', ly: '?' }] },
    ];
    for (const v of pictures) {
      const svg = visualSvg(v, l);
      assert.ok(!/undefined|NaN|Infinity/.test(svg));
    }
  }
});
