// Small teaching pictures, drawn as SVG from data so they always match the numbers in the question.
// The server turns them into PNGs for Telegram; the Mini App shows the SVG directly.

import { num } from '../format.ts';
import type { Lang, Text } from '../types.ts';
import { drawCard, isCard, type CardVisual } from './cards.ts';
import { PLATE_H, frame, ribbon as plateRibbon, svgDoc } from './plate.ts';

export type Label = string | Text;

export type { CardVisual };

/** A teaching picture, drawn on 800 × 450 and then set into the plate. */
export type Picture =
  /** Bar model, as in the Grade 6 book. Segment widths are relative. `total` draws a bracket above the bar. */
  | { t: 'bar'; parts: { w: number; label?: Label; tone?: Tone }[]; total?: Label }
  /** One or more fraction bars. */
  | { t: 'fraction'; rows: { n: number; d: number; label?: Label }[] }
  /** A balance scale: both sides of an equation. */
  | { t: 'balance'; left: Label; right: Label }
  /** Triangle drawn to scale from its real angles (a, b at the base, c on top). `equal` marks two equal sides, `right` a right angle at corner a. */
  | { t: 'triangle'; deg: [number, number, number]; a: Label; b: Label; c: Label; equal?: boolean; right?: boolean }
  /** Two angles on a straight line. */
  | { t: 'straight'; a: Label; b: Label; ask?: 'a' | 'b'; split?: number }
  /** One angle, drawn at its true size. */
  | { t: 'angle'; deg: number; label?: Label }
  /** Two crossing lines: vertical angles, drawn at their true size. */
  | { t: 'cross'; deg: number; a: Label; b: Label; ask?: 'a' | 'b' }
  /** Two parallel lines and a transversal, drawn so that angle a really measures `deg`. `kind` chooses which pair is labelled. */
  | { t: 'parallel'; deg: number; a: Label; b: Label; kind: 'corresponding' | 'alternate' | 'sameSide'; ask?: 'a' | 'b' }
  /** Coordinate plane with lines and points. */
  | { t: 'plane'; lines?: { k: number; b: number; tone?: Tone }[]; points?: { x: number; y: number; label?: string }[] }
  /** Circle with a radius or diameter drawn. */
  | { t: 'circle'; kind: 'r' | 'd' | 'area' | 'around'; label: Label }
  /** Algebra tiles: x tiles and unit tiles, grouped with plus signs. */
  | { t: 'tiles'; groups: { n: number; kind: 'x' | '1' | 'x2' }[] }
  /** (a + b)² as a cut square. */
  | { t: 'square'; a: string; b: string }
  /** A car on a road: distance, speed, time. */
  | { t: 'road'; s: Label; v: Label; time: Label }
  /** A block with its mass and volume. */
  | { t: 'block'; m: Label; v: Label }
  /** The same force on a small or big area. */
  | { t: 'press'; force: Label; area: Label; wide?: boolean }
  /** Simple circuit: voltage, resistance, current. */
  | { t: 'circuit'; u: Label; r: Label; i: Label }
  /** A line graph on axes, drawn to scale. `marks` drop dashed guides to the axes; a label of "?" is the unknown to read off. */
  | { t: 'chart'; pts: [number, number][]; xMax: number; yMax: number; xStep: number; yStep: number; xName: string; yName: string; marks?: { x: number; y: number; lx?: Label; ly?: Label }[] }
  /** A block in a tank of water: it floats to the depth its density allows, or sinks. */
  | { t: 'float'; rho: number }
  /** Two resistors in series on one battery. */
  | { t: 'series'; u: Label; r1: Label; r2: Label; i: Label }
  /** A big formula on a card, with an optional line under it. */
  | { t: 'formula'; main: Label; sub?: Label; tone?: Tone }
  /** A grid of dots: rows × columns ways to choose. */
  | { t: 'grid'; rows: number; cols: number };

/** Anything the bot or the app can show: a teaching picture on the plate, or one of the bot's own cards. */
export type Visual = Picture | CardVisual;

export type Tone = 'navy' | 'amber' | 'teal' | 'blue' | 'coral' | 'soft';

const COLOR: Record<Tone, string> = {
  navy: '#0c1f57',
  amber: '#ffb547',
  teal: '#139a8c',
  blue: '#1d44a3',
  coral: '#ff6b5b',
  soft: '#e8dcb9',
};
/** Light ("paper") palette for the bot and Telegram; the dark one is for the student area. Swapped around one draw call, never in between. */
const LIGHT = { INK: '#0c1f57', MUTE: '#46507a', LINE: '#cdbd92', ASK: '#e08a00', PILL: '#fffaf0', PILLASK: '#fff1d6', ASKTXT: '#8a5200', CARD: '#fff4d9', CARD2: '#ffe7b8', GRID: '#e8dcb9', GRID2: '#e6dfc9', BOX: '#fff', WATER: '#bcd8ff', ONLIGHT: '#0c1f57' };
const DARK = { INK: '#e9ebf2', MUTE: '#a9b2d3', LINE: 'rgba(255,255,255,0.30)', ASK: '#ffb84d', PILL: 'rgba(255,255,255,0.09)', PILLASK: 'rgba(255,184,77,0.18)', ASKTXT: '#ffd08a', CARD: 'rgba(255,255,255,0.06)', CARD2: 'rgba(255,255,255,0.10)', GRID: 'rgba(255,255,255,0.10)', GRID2: 'rgba(255,255,255,0.09)', BOX: '#171c34', WATER: 'rgba(80,140,255,0.38)', ONLIGHT: '#0c1f57' };
let { INK, MUTE, LINE, ASK, PILL, PILLASK, ASKTXT, CARD, CARD2, GRID, GRID2, BOX, WATER, ONLIGHT } = LIGHT;
const usePalette = (p: typeof LIGHT) => ({ INK, MUTE, LINE, ASK, PILL, PILLASK, ASKTXT, CARD, CARD2, GRID, GRID2, BOX, WATER, ONLIGHT } = p);

export const VISUAL_W = 800;
export const VISUAL_H = 450;

/** Russian schools write км/ч, кг, Н, Па: converts units that directly follow a number. */
export const ruUnits = (v: string) =>
  v
    .replace(/(\d) km\/h/g, '$1 км/ч')
    .replace(/(\d) kg\/m³/g, '$1 кг/м³')
    .replace(/(\d) km/g, '$1 км')
    .replace(/(\d) kg/g, '$1 кг')
    .replace(/(\d) m³/g, '$1 м³')
    .replace(/(\d) m²/g, '$1 м²')
    .replace(/(\d) kPa/g, '$1 кПа')
    .replace(/(\d) Pa/g, '$1 Па')
    .replace(/(\d) g\/cm³/g, '$1 г/см³')
    .replace(/(\d) m\/s/g, '$1 м/с')
    .replace(/(\d) mA/g, '$1 мА')
    .replace(/(\d) N/g, '$1 Н')
    .replace(/(\d) V/g, '$1 В')
    .replace(/(\d) A/g, '$1 А')
    .replace(/(\d) Ω/g, '$1 Ом')
    .replace(/(\d) h/g, '$1 ч');

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (x: number, y: number, v: string, size = 34, fill = INK, anchor: 'middle' | 'start' | 'end' = 'middle') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-family="Onest, DejaVu Sans, sans-serif" font-weight="700">${esc(v)}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, stroke = INK, w = 6) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`;
const rect = (x: number, y: number, w: number, h: number, fill: string, r = 12, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const circle = (cx: number, cy: number, r: number, fill: string, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => [cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180)];

/** Arc between two directions (degrees, counter-clockwise from the +x axis). */
const arc = (cx: number, cy: number, r: number, from: number, to: number, stroke: string, w = 5) => {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `<path d="M${x1} ${y1} A${r} ${r} 0 ${large} 0 ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`;
};

const pill = (x: number, y: number, v: string, ask = false, size = 32) => {
  const w = Math.max(v.length * size * 0.62 + 26, size + 20);
  return (
    rect(x - w / 2, y - size * 0.92, w, size * 1.4, ask ? PILLASK : PILL, 12, `stroke="${ask ? ASK : LINE}" stroke-width="3"`) +
    text(x, y + size * 0.1, v, size, ask ? ASKTXT : INK)
  );
};

function draw(v: Picture, lang: Lang): string {
  const L = (l: Label | undefined) => {
    const s = l === undefined ? '' : typeof l === 'string' ? l : l[lang];
    return lang === 'ru' ? ruUnits(s) : s;
  };
  switch (v.t) {
    case 'bar': {
      const X = 50, W = 700, Y = v.total ? 190 : 150, H = 110;
      const sum = v.parts.reduce((a, p) => a + p.w, 0);
      let x = X, out = '';
      for (const p of v.parts) {
        const w = (p.w / sum) * W;
        out += rect(x + 2, Y, w - 4, H, COLOR[p.tone ?? 'blue'], 12);
        const label = L(p.label);
        if (label) out += text(x + w / 2, Y + H / 2 + 13, label, Math.min(38, Math.max(22, (w - 10) / (label.length * 0.62))), p.tone === 'soft' || p.tone === 'amber' ? ONLIGHT : '#fff');
        x += w;
      }
      if (v.total) {
        out += `<path d="M${X + 2} ${Y - 18} v-22 H${X + W - 2} v22" fill="none" stroke="${MUTE}" stroke-width="4" stroke-linejoin="round"/>`;
        out += pill(400, Y - 44, L(v.total));
      }
      return out;
    }
    case 'fraction': {
      const rowH = v.rows.length > 1 ? 90 : 120;
      const gap = 44;
      const top = (VISUAL_H - v.rows.length * rowH - (v.rows.length - 1) * gap) / 2;
      return v.rows
        .map((row, i) => {
          const y = top + i * (rowH + gap);
          const labelW = row.label ? 150 : 0;
          const X = 50 + labelW, W = 700 - labelW;
          let out = row.label ? text(50, y + rowH / 2 + 12, L(row.label), 36, INK, 'start') : '';
          for (let k = 0; k < row.d; k++) {
            const w = W / row.d;
            out += rect(X + k * w + 2, y, w - 4, rowH, k < row.n ? COLOR.amber : COLOR.soft, 10);
          }
          return out;
        })
        .join('');
    }
    case 'balance': {
      const left = L(v.left), right = L(v.right);
      const pan = (cx: number, label: string) => {
        const size = label.length > 11 ? 26 : 34;
        const w = Math.max(label.length * size * 0.62 + 36, 96);
        return (
          line(cx, 118, cx - 130, 262, COLOR.navy, 4) +
          line(cx, 118, cx + 130, 262, COLOR.navy, 4) +
          `<path d="M${cx - 150} 262 H${cx + 150} Q${cx + 138} 322 ${cx} 322 Q${cx - 138} 322 ${cx - 150} 262Z" fill="${COLOR.teal}" stroke="${COLOR.navy}" stroke-width="6" stroke-linejoin="round"/>` +
          rect(cx - w / 2, 178, w, 78, COLOR.amber, 16, `stroke="${COLOR.navy}" stroke-width="5"`) +
          text(cx, 178 + 52, label, size, COLOR.navy)
        );
      };
      return (
        line(400, 100, 400, 390, COLOR.navy, 14) +
        `<path d="M290 404 h220 l-34 -34 h-152 z" fill="${COLOR.navy}" stroke="${COLOR.navy}" stroke-width="6" stroke-linejoin="round"/>` +
        line(190, 112, 610, 112, COLOR.navy, 16) +
        circle(190, 112, 10, COLOR.amber) +
        circle(610, 112, 10, COLOR.amber) +
        circle(400, 104, 22, COLOR.amber, `stroke="${COLOR.navy}" stroke-width="6"`) +
        pan(190, left) +
        pan(610, right)
      );
    }
    case 'triangle': {
      const [da, db, dc] = v.deg;
      const rad = (d: number) => (d * Math.PI) / 180;
      // Place a, b on the base and c by the law of sines, then scale to fit the picture.
      const ac = Math.sin(rad(db)) / Math.sin(rad(dc));
      const raw: [number, number][] = [[0, 0], [1, 0], [ac * Math.cos(rad(da)), ac * Math.sin(rad(da))]];
      const xs = raw.map((p) => p[0]), ys = raw.map((p) => p[1]);
      const k = Math.min(560 / (Math.max(...xs) - Math.min(...xs)), 262 / Math.max(...ys));
      const offX = 400 - (k * (Math.max(...xs) + Math.min(...xs))) / 2;
      const offY = 235 + (k * Math.max(...ys)) / 2;
      const [A, B, C] = raw.map((p): [number, number] => [offX + k * p[0], offY - k * p[1]]);
      let out = `<path d="M${A} L${B} L${C} Z" fill="${CARD}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
      if (v.right) out += `<path d="M${A[0] + 34} ${A[1]} v-34 h-34" fill="none" stroke="${COLOR.coral}" stroke-width="5"/>`;
      if (v.equal) {
        const tick = (p: [number, number], q: [number, number]) => {
          const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
          const a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2;
          return line(mx - 14 * Math.cos(a), my - 14 * Math.sin(a), mx + 14 * Math.cos(a), my + 14 * Math.sin(a), COLOR.coral, 6);
        };
        out += tick(A, C) + tick(B, C);
      }
      // An arc marks each angle; its label sits just outside the corner, so narrow triangles never get crowded.
      const corner = (p: [number, number], q: [number, number], u: [number, number], l: Label, skipArc: boolean) => {
        const dir = (t: [number, number]) => (Math.atan2(p[1] - t[1], t[0] - p[0]) * 180) / Math.PI;
        let a1 = dir(q), a2 = dir(u);
        if (((a2 - a1 + 360) % 360) > 180) [a1, a2] = [a2, a1];
        const ask = L(l) === '?';
        const mid = a1 + ((a2 - a1 + 360) % 360) / 2;
        const [lx, ly] = polar(p[0], p[1], 56, mid + 180);
        return (skipArc ? '' : arc(p[0], p[1], 34, a1, a2, ask ? ASK : COLOR.teal)) + pill(lx, ly + 11, L(l), ask);
      };
      return out + corner(A, B, C, v.a, Boolean(v.right)) + corner(B, A, C, v.b, false) + corner(C, A, B, v.c, false);
    }
    case 'straight': {
      const cx = 400, cy = 330, split = v.split ?? 125;
      const [rx, ry] = polar(cx, cy, 250, split);
      const [ax, ay] = polar(cx, cy, 150, (split + 180) / 2);
      const [bx, by] = polar(cx, cy, 150, split / 2);
      return (
        line(70, cy, 730, cy) +
        line(cx, cy, rx, ry, COLOR.blue, 7) +
        arc(cx, cy, 72, split, 180, COLOR.amber) +
        arc(cx, cy, 58, 0, split, COLOR.teal) +
        circle(cx, cy, 8, INK) +
        pill(ax, ay, L(v.a), v.ask === 'a') +
        pill(bx, by, L(v.b), v.ask === 'b')
      );
    }
    case 'angle': {
      const cx = 240, cy = 340;
      const [x, y] = polar(cx, cy, 300, v.deg);
      const mark =
        v.deg === 90
          ? `<path d="M${cx + 42} ${cy} v-42 h-42" fill="none" stroke="${COLOR.coral}" stroke-width="6"/>`
          : arc(cx, cy, 72, 0, v.deg, COLOR.amber, 6);
      const [lx, ly] = polar(cx, cy, 130, Math.max(v.deg / 2, 18));
      return line(cx, cy, cx + 400, cy) + line(cx, cy, x, y, COLOR.blue, 7) + mark + circle(cx, cy, 8, INK) + (v.label ? pill(lx + 26, ly, L(v.label)) : '');
    }
    case 'cross': {
      const cx = 400, cy = 225, from = 180 - v.deg < 40 ? 15 : 25, to = from + v.deg;
      const [x1, y1] = polar(cx, cy, 300, from);
      const [x2, y2] = polar(cx, cy, 300, from + 180);
      const [x3, y3] = polar(cx, cy, 215, to);
      const [x4, y4] = polar(cx, cy, 215, to + 180);
      const mid = from + v.deg / 2;
      const [ax, ay] = polar(cx, cy, 130, mid);
      const [bx, by] = polar(cx, cy, 130, mid + 180);
      return (
        line(x1, y1, x2, y2) +
        line(x3, y3, x4, y4, COLOR.blue, 7) +
        arc(cx, cy, 60, from, to, COLOR.amber) +
        arc(cx, cy, 60, from + 180, to + 180, COLOR.amber) +
        circle(cx, cy, 8, INK) +
        pill(ax, ay + 10, L(v.a), v.ask === 'a') +
        pill(bx, by + 10, L(v.b), v.ask === 'b')
      );
    }
    case 'parallel': {
      const y1 = 130, y2 = 320;
      // theta: direction of the transversal, chosen so that the labelled angle truly measures deg.
      const theta = v.kind === 'corresponding' ? v.deg : 180 - v.deg;
      const cot = 1 / Math.tan((theta * Math.PI) / 180);
      const X = (y: number) => 400 + (225 - y) * cot;
      const p1 = X(y1), p2 = X(y2);
      const at = (cx: number, cy: number, from: number, to: number, l: Label, ask: boolean, tone: string) => {
        const [lx, ly] = polar(cx, cy, 104, (from + to) / 2);
        return arc(cx, cy, 44, from, to, tone) + pill(lx, ly + 11, L(l), ask);
      };
      const top = v.kind === 'corresponding' ? at(p1, y1, 0, theta, v.a, v.ask === 'a', COLOR.amber) : at(p1, y1, 180 + theta, 360, v.a, v.ask === 'a', COLOR.amber);
      const bottom =
        v.kind === 'corresponding'
          ? at(p2, y2, 0, theta, v.b, v.ask === 'b', COLOR.amber)
          : v.kind === 'alternate'
            ? at(p2, y2, theta, 180, v.b, v.ask === 'b', COLOR.amber)
            : at(p2, y2, 0, theta, v.b, v.ask === 'b', COLOR.teal);
      return (
        line(60, y1, 740, y1) +
        line(60, y2, 740, y2) +
        line(X(25), 25, X(425), 425, COLOR.blue, 7) +
        top +
        bottom +
        circle(p1, y1, 8, INK) +
        circle(p2, y2, 8, INK) +
        text(726, y1 - 14, 'a', 26, MUTE) +
        text(726, y2 - 14, 'b', 26, MUTE)
      );
    }
    case 'plane': {
      const R = 6, size = 410, step = size / (2 * R), cx = 400, cy = 225;
      const X = (x: number) => cx + x * step;
      const Y = (y: number) => cy - y * step;
      let out = '';
      for (let i = -R; i <= R; i++) {
        out += line(X(i), Y(-R), X(i), Y(R), GRID, 2) + line(X(-R), Y(i), X(R), Y(i), GRID, 2);
      }
      out += line(X(-R), cy, X(R), cy, INK, 4) + line(cx, Y(R), cx, Y(-R), INK, 4);
      out += text(X(R) + 22, cy + 8, 'x', 26) + text(cx, Y(R) - 2 < 18 ? 20 : Y(R) - 2, '', 26) + text(cx + 22, Y(R) + 20, 'y', 26);
      for (const i of [-4, -2, 2, 4]) {
        out += text(X(i), cy + 26, num(i, lang), 19, MUTE) + text(cx - 18, Y(i) + 7, num(i, lang), 19, MUTE);
      }
      out += `<clipPath id="pl"><rect x="${X(-R)}" y="${Y(R)}" width="${size}" height="${size}"/></clipPath>`;
      for (const l of v.lines ?? []) {
        out += `<line clip-path="url(#pl)" x1="${X(-R)}" y1="${Y(l.k * -R + l.b)}" x2="${X(R)}" y2="${Y(l.k * R + l.b)}" stroke="${COLOR[l.tone ?? 'blue']}" stroke-width="6" stroke-linecap="round"/>`;
      }
      for (const p of v.points ?? []) {
        out += circle(X(p.x), Y(p.y), 10, COLOR.coral, 'stroke="#fff" stroke-width="3"');
        if (p.label) out += text(X(p.x) + 16, Y(p.y) - 14, p.label, 22, INK, 'start');
      }
      return out;
    }
    case 'circle': {
      const cx = 400, cy = 225, r = 165;
      let out = circle(cx, cy, r, v.kind === 'area' ? CARD2 : CARD, `stroke="${v.kind === 'around' ? COLOR.amber : INK}" stroke-width="${v.kind === 'around' ? 12 : 6}"`);
      if (v.kind === 'd') out += line(cx - r, cy, cx + r, cy, COLOR.coral, 7) + pill(cx, cy - 26, L(v.label));
      else {
        out += line(cx, cy, cx + r * 0.94, cy - r * 0.34, COLOR.coral, 7) + pill(cx + r * 0.42, cy + 44, L(v.label));
      }
      return out + circle(cx, cy, 8, INK);
    }
    case 'tiles': {
      const sized = v.groups.map((g) => ({ ...g, w: g.kind === 'x2' ? 110 : g.kind === 'x' ? 62 : 40, h: g.kind === 'x2' ? 110 : g.kind === 'x' ? 130 : 40 }));
      const gap = 12, plus = 56;
      const width = sized.reduce((a, g) => a + g.n * (g.w + gap) - gap, 0) + (sized.length - 1) * plus;
      const k = Math.min(1.7, 720 / width);
      let x = (800 - width * k) / 2, out = '';
      sized.forEach((g, gi) => {
        for (let i = 0; i < g.n; i++) {
          const w = g.w * k, h = g.h * k;
          const y = 225 - h / 2;
          out += rect(x, y, w, h, g.kind === '1' ? COLOR.amber : g.kind === 'x2' ? COLOR.teal : COLOR.blue, 10);
          out += text(x + w / 2, y + h / 2 + 12 * k, g.kind === '1' ? '1' : g.kind === 'x2' ? 'x²' : 'x', 34 * k, g.kind === '1' ? ONLIGHT : '#fff');
          x += w + gap * k;
        }
        x -= gap * k;
        if (gi < sized.length - 1) {
          out += text(x + (plus * k) / 2, 225 + 14, '+', 44 * k, MUTE);
          x += plus * k;
        }
      });
      return out;
    }
    case 'square': {
      const X = 210, Y = 45, A = 240, B = 120;
      const cell = (x: number, y: number, w: number, h: number, fill: string, label: string, ink = '#fff') =>
        rect(x + 3, y + 3, w - 6, h - 6, fill, 10) + text(x + w / 2, y + h / 2 + 12, label, 36, ink);
      return (
        cell(X, Y, A, A, COLOR.blue, `${v.a}²`) +
        cell(X + A, Y, B, A, COLOR.amber, `${v.a}${v.b}`, ONLIGHT) +
        cell(X, Y + A, A, B, COLOR.amber, `${v.a}${v.b}`, ONLIGHT) +
        cell(X + A, Y + A, B, B, COLOR.teal, `${v.b}²`) +
        text(X + A / 2, Y + A + B + 34, v.a, 28, MUTE) +
        text(X + A + B / 2, Y + A + B + 34, v.b, 28, MUTE) +
        text(X - 24, Y + A / 2 + 10, v.a, 28, MUTE) +
        text(X - 24, Y + A + B / 2 + 10, v.b, 28, MUTE)
      );
    }
    case 'road': {
      const y = 290;
      return (
        rect(40, y, 720, 62, '#46507a', 14) +
        `<line x1="60" y1="${y + 31}" x2="740" y2="${y + 31}" stroke="#fff" stroke-width="5" stroke-dasharray="34 26"/>` +
        `<path d="M70 ${y - 2} v-44 q0 -12 12 -12 h40 l34 -36 q6 -6 16 -6 h78 q10 0 16 6 l34 36 h26 q14 0 14 14 v42 z" fill="${COLOR.amber}"/>` +
        rect(170, y - 86, 50, 28, '#fff', 6) +
        rect(228, y - 86, 40, 28, '#fff', 6) +
        circle(130, y, 24, INK) +
        circle(290, y, 24, INK) +
        circle(130, y, 13, '#9aa3c7') +
        circle(290, y, 13, '#9aa3c7') +
        circle(130, y, 4, INK) +
        circle(290, y, 4, INK) +
        `<path d="M70 410 H730 m-20 -14 l20 14 l-20 14" fill="none" stroke="${COLOR.coral}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
        pill(400, 410, L(v.s)) +
        pill(520, 90, L(v.v)) +
        pill(520, 170, L(v.time))
      );
    }
    case 'block': {
      const x = 230, y = 130, w = 210, h = 190;
      return (
        `<path d="M${x} ${y} l60 -56 h${w} l-60 56 z" fill="#8fa6ee"/>` +
        `<path d="M${x + w} ${y} l60 -56 v${h} l-60 56 z" fill="#2c49a8"/>` +
        rect(x, y, w, h, COLOR.blue, 4) +
        text(x + w / 2, y + h / 2 + 12, 'V', 40, '#fff') +
        pill(620, 160, L(v.v)) +
        pill(620, 270, L(v.m), false)
      );
    }
    case 'press': {
      const w = v.wide ? 520 : 170;
      const cx = 400;
      return (
        rect(40, 340, 720, 90, GRID, 10) +
        rect(cx - w / 2, 318, w, 26, COLOR.amber, 8) +
        line(cx, 80, cx, 296, COLOR.coral, 14) +
        `<path d="M${cx - 34} 280 L${cx} 322 L${cx + 34} 280 Z" fill="${COLOR.coral}"/>` +
        pill(cx + 130, 150, L(v.force)) +
        pill(cx, 400, L(v.area))
      );
    }
    case 'circuit': {
      const X1 = 170, X2 = 630, Y1 = 90, Y2 = 350;
      return (
        `<rect x="${X1}" y="${Y1}" width="${X2 - X1}" height="${Y2 - Y1}" rx="20" fill="none" stroke="${INK}" stroke-width="6"/>` +
        rect(320, Y1 - 34, 160, 68, COLOR.amber, 12) +
        text(400, Y1 + 12, L(v.r), 34, ONLIGHT) +
        rect(X1 - 44, 170, 88, 100, BOX, 8, `stroke="${INK}" stroke-width="5"`) +
        text(X1, 232, L(v.u), 26, INK) +
        circle(X2, 220, 48, BOX, `stroke="${INK}" stroke-width="5"`) +
        text(X2, 234, 'A', 38, COLOR.blue) +
        pill(400, Y2, L(v.i))
      );
    }
    case 'chart': {
      const X0 = 170, X1 = 740, Y0 = 40, Y1 = 340;
      const sx = (X1 - X0) / v.xMax, sy = (Y1 - Y0) / v.yMax;
      const px = (x: number) => X0 + x * sx, py = (y: number) => Y1 - y * sy;
      let out = '';
      // a marked value is written in its own label, so the plain axis number at that spot is left out (and an unknown stays hidden)
      const hasX = (x: number) => (v.marks ?? []).some((m) => L(m.lx) && Math.abs(m.x - x) < 1e-9);
      const hasY = (y: number) => (v.marks ?? []).some((m) => L(m.ly) && Math.abs(m.y - y) < 1e-9);
      for (let x = v.xStep; x <= v.xMax + 1e-9; x += v.xStep) out += line(px(x), Y0, px(x), Y1, GRID2, 2) + (hasX(x) ? '' : text(px(x), Y1 + 30, num(x, lang), 22, MUTE));
      for (let y = v.yStep; y <= v.yMax + 1e-9; y += v.yStep) out += line(X0, py(y), X1, py(y), GRID2, 2) + (hasY(y) ? '' : text(X0 - 14, py(y) + 8, num(y, lang), 22, MUTE, 'end'));
      out += line(X0, Y1, X1 + 20, Y1, INK, 4) + line(X0, Y1, X0, Y0 - 16, INK, 4);
      out += `<path d="M${X1 + 8} ${Y1 - 10} L${X1 + 22} ${Y1} L${X1 + 8} ${Y1 + 10}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      out += `<path d="M${X0 - 10} ${Y0 - 4} L${X0} ${Y0 - 18} L${X0 + 10} ${Y0 - 4}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      out += text(X1 + 10, Y1 + 66, v.xName, 26, INK, 'end') + text(X0 + 16, Y0 - 12, v.yName, 26, INK, 'start');
      out += `<polyline points="${v.pts.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')}" fill="none" stroke="${COLOR.coral}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
      for (const [x, y] of v.pts) out += circle(px(x), py(y), 7, COLOR.coral, `stroke="#fff" stroke-width="3"`);
      for (const m of v.marks ?? []) {
        out += `<line x1="${px(m.x)}" y1="${py(m.y)}" x2="${px(m.x)}" y2="${Y1}" stroke="${INK}" stroke-width="3" stroke-dasharray="8 7"/>`;
        out += `<line x1="${px(m.x)}" y1="${py(m.y)}" x2="${X0}" y2="${py(m.y)}" stroke="${INK}" stroke-width="3" stroke-dasharray="8 7"/>`;
        out += circle(px(m.x), py(m.y), 10, COLOR.blue, `stroke="#fff" stroke-width="3"`);
        const lx = L(m.lx), ly = L(m.ly);
        if (lx) out += pill(px(m.x), Y1 + 38, lx, lx === '?', 24);
        if (ly) out += pill(X0 - 14 - Math.max(ly.length * 24 * 0.62 + 26, 44) / 2, py(m.y) + 8, ly, ly === '?', 24);
      }
      return out;
    }
    case 'float': {
      const TX = 70, TW = 400, TY = 70, TB = 400, WY = 190, bw = 150, bh = 130;
      const frac = Math.max(0, Math.min(1, v.rho / 1000));
      const floats = v.rho < 1000;
      const top = floats ? WY - (1 - frac) * bh : TB - bh - 6;
      const wname = lang === 'ru' ? 'Вода' : lang === 'uz' ? 'Suv' : 'Water';
      return (
        rect(TX, WY, TW, TB - WY, WATER, 8) +
        `<path d="M${TX} ${WY} q50 -14 100 0 t100 0 t100 0 t100 0" fill="none" stroke="#6fa3ff" stroke-width="5"/>` +
        rect(TX + TW / 2 - bw / 2, top, bw, bh, COLOR.amber, 10, `stroke="${INK}" stroke-width="5"`) +
        `<path d="M${TX} ${TY} V${TB} H${TX + TW} V${TY}" fill="none" stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>` +
        pill(TX + TW + 175, 120, L(`ρ = ${v.rho} kg/m³`), true, 26) +
        pill(TX + TW + 170, 300, L(`${wname}: 1000 kg/m³`), false, 24)
      );
    }
    case 'series': {
      const X1 = 130, X2 = 670, Y1 = 100, Y2 = 350;
      return (
        `<rect x="${X1}" y="${Y1}" width="${X2 - X1}" height="${Y2 - Y1}" rx="20" fill="none" stroke="${INK}" stroke-width="6"/>` +
        rect(240, Y1 - 34, 130, 68, COLOR.amber, 12) + text(305, Y1 + 12, L(v.r1), 30, ONLIGHT) +
        rect(430, Y1 - 34, 130, 68, COLOR.teal, 12) + text(495, Y1 + 12, L(v.r2), 30, '#fff') +
        rect(X1 - 44, 170, 88, 100, BOX, 8, `stroke="${INK}" stroke-width="5"`) +
        text(X1, 232, L(v.u), 26, INK) +
        circle(X2, 220, 48, BOX, `stroke="${INK}" stroke-width="5"`) +
        text(X2, 234, 'A', 38, COLOR.blue) +
        pill(400, Y2, L(v.i))
      );
    }
    case 'formula': {
      const main = L(v.main);
      const size = Math.min(92, 1240 / Math.max(main.length, 6));
      return (
        rect(40, 60, 720, 330, CARD, 28, `stroke="${v.tone === 'amber' ? COLOR.amber : LINE}" stroke-width="4"`) +
        text(400, v.sub ? 215 : 250, main, size, INK) +
        (v.sub ? text(400, 305, L(v.sub), 34, MUTE) : '')
      );
    }
    case 'grid': {
      const size = Math.min(84, 560 / v.cols, 280 / v.rows);
      const X = 400 - ((v.cols - 1) * size * 1.4) / 2;
      const Y = 225 - ((v.rows - 1) * size * 1.4) / 2;
      let out = '';
      for (let i = 0; i < v.rows; i++) {
        for (let j = 0; j < v.cols; j++) {
          out += circle(X + j * size * 1.4, Y + i * size * 1.4, size / 2, j % 2 ? COLOR.amber : COLOR.blue);
        }
      }
      return out;
    }
  }
}

/**
 * The teaching picture in the student area's dark style: light lines and labels on a transparent ground, so it sits on the page's glass
 * card instead of looking like a paper sheet stuck on top. Same drawing code, different palette.
 */
export function visualSvgDark(v: Visual, lang: Lang): string {
  if (isCard(v)) return drawCard(v, lang);
  usePalette(DARK);
  try {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VISUAL_W} ${VISUAL_H}" width="${VISUAL_W}" height="${VISUAL_H}" role="img">${draw(v, lang)}</svg>`;
  } finally {
    usePalette(LIGHT);
  }
}

/**
 * The same teaching picture for Grades 5–11 on the web: a plain diagram on a light sheet, with no tile border.
 * The decorated plate suits the bot and the primary grades; a Grade 7 physics diagram should look like a textbook figure.
 */
export function visualSvgPlain(v: Visual, lang: Lang): string {
  if (isCard(v)) return drawCard(v, lang);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VISUAL_W} ${VISUAL_H}" width="${VISUAL_W}" height="${VISUAL_H}"><rect width="${VISUAL_W}" height="${VISUAL_H}" rx="18" fill="#f7f4ea"/><rect x="1.5" y="1.5" width="${VISUAL_W - 3}" height="${VISUAL_H - 3}" rx="17" fill="none" stroke="#d9d3bf" stroke-width="3"/>${draw(v, lang)}</svg>`;
}

/**
 * The whole picture as an SVG string. Teaching pictures sit on the plate with an optional ribbon (topic and place in the round);
 * the bot's own cards (home, result, reminder, board) bring their own frame. Language only matters for words and decimal marks.
 */
export function visualSvg(v: Visual, lang: Lang, ribbonText?: string): string {
  if (isCard(v)) return drawCard(v, lang);
  const inner = `<svg x="76" y="120" width="904" height="508" viewBox="0 0 ${VISUAL_W} ${VISUAL_H}">${draw(v, lang)}</svg>`;
  return svgDoc(PLATE_H, frame(PLATE_H) + inner + (ribbonText ? plateRibbon(ribbonText) : ''));
}
