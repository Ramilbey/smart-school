import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHud, parseMessage, shapeFacts } from '../src/handHud.js';

describe('reading the hand-figure app\'s status line', () => {
  it('finds the number of raised fingers', () => {
    assert.deepEqual(parseHud('Birinchi qo‘l: 3 barmoq · Ikkinchi qo‘l: aniqlanmadi · 58 FPS'), { hand: true, fingers: 3, second: false });
    assert.deepEqual(parseHud('Birinchi qo‘l: 0 barmoq · Ikkinchi qo‘l: masshtab ×1.20 · 60 FPS'), { hand: true, fingers: 0, second: true });
    assert.equal(parseHud('Birinchi qo‘l: 5 barmoq · Ikkinchi qo‘l: aniqlanmadi · 12 FPS').fingers, 5);
  });
  it('knows when no hand is seen, or when there is nothing', () => {
    assert.deepEqual(parseHud('60 FPS'), { hand: false, fingers: null, second: false });
    assert.deepEqual(parseHud(''), { hand: false, fingers: null, second: false });
    assert.deepEqual(parseHud(null), { hand: false, fingers: null, second: false });
  });
  it('recognises the four messages of the app', () => {
    assert.equal(parseMessage('Model va kamera yuklanmoqda…'), 'loading');
    assert.equal(parseMessage('Qo‘lingizni kamera ko‘radigan joyga tuting'), 'look');
    assert.equal(parseMessage('Kameraga ruxsat berilmadi. Sahifa uchun kameraga ruxsat bering va sahifani yangilang.'), 'denied');
    assert.equal(parseMessage('Ishga tushirib bo‘lmadi: something'), 'failed');
    assert.equal(parseMessage('anything else'), 'other');
    assert.equal(parseMessage('  '), null);
  });
});

describe('the shapes the app makes', () => {
  it('gives the prisms n + 2 faces, 3n edges and 2n vertices, so V - E + F is 2', () => {
    for (const n of [3, 4, 5]) {
      const f = shapeFacts(n);
      assert.deepEqual([f.faces, f.edges, f.vertices], [n + 2, 3 * n, 2 * n]);
      assert.equal(f.vertices - f.edges + f.faces, 2);
      assert.equal(f.euler, true);
    }
    assert.equal(shapeFacts(4).name, 'Cube');
  });
  it('describes the cylinder, the line and the flat sheet without an Euler rule', () => {
    assert.deepEqual(shapeFacts(0), { name: 'Cylinder', base: 'round', faces: 3, edges: 2, vertices: 0, euler: false });
    assert.equal(shapeFacts(1).euler, false);
    assert.equal(shapeFacts(2).euler, false);
    assert.equal(shapeFacts(6), null, 'the app has no shape for six');
  });
});
