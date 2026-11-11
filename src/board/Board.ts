/**
 * The whiteboard. It draws "board script" ops (shared/board/script.ts) with writing animations: strokes are drawn along their
 * length, text and formulas are written in from the left, and a glowing pen follows the writing.
 *
 * The board is 1000 x 620 "units". The stage is scaled to fit its box and every position is `calc(n * var(--u))`, so a resize
 * needs no redraw. Nothing here talks to the network or the voice: the Player decides when a beat is drawn.
 */
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { BOARD_H, BOARD_W, describeOp, type Beat, type Ink, type Op, type Size, type Term } from '../../shared/board/script.ts';
import { compileExpr } from '../../shared/board/expr.ts';

export const COLORS: Record<Ink, string> = { ink: '#eef2ff', teal: '#2de2c4', blue: '#7da2ff', amber: '#ffb547', coral: '#ff6b5b', lilac: '#b79cff', mute: '#8c96ba' };
const FILL: Record<Ink, string> = { ink: 'rgba(238,242,255,.09)', teal: 'rgba(45,226,196,.17)', blue: 'rgba(91,140,255,.2)', amber: 'rgba(255,181,71,.17)', coral: 'rgba(255,107,91,.2)', lilac: 'rgba(183,156,255,.17)', mute: 'rgba(140,150,186,.12)' };
const SIZE_UNITS: Record<Size, number> = { xl: 58, l: 40, m: 28, s: 21 };
const SVG_NS = 'http://www.w3.org/2000/svg';

interface Item {
  els: Element[];
  kind: Op['op'];
  what: string;
}

export interface BoardHooks {
  /** The key words to show under the board (an empty list clears them). They are not drawn on the board: there is no room to promise. */
  onTerms?: (items: Term[]) => void;
}

const svgEl = <K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

/** A path "d" through points, with a very slight hand wobble so shapes do not look ruled. */
const pathOf = (pts: [number, number][], close: boolean): string => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}${close ? ' Z' : ''}`;
const length = (pts: [number, number][], close: boolean): number => {
  let n = 0;
  for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  if (close && pts.length > 2) n += Math.hypot(pts[0]![0] - pts.at(-1)![0], pts[0]![1] - pts.at(-1)![1]);
  return n;
};

export class Board {
  private stage: HTMLDivElement;
  private svg: SVGSVGElement;
  private overlay: HTMLDivElement;
  private pen: HTMLDivElement;
  private items = new Map<string, Item>();
  private serial = 0;
  private observer: ResizeObserver;
  private penAt: [number, number] = [60, 60];

  constructor(private root: HTMLElement, private hooks: BoardHooks = {}) {
    root.classList.add('bd');
    this.stage = document.createElement('div');
    this.stage.className = 'bd-stage';
    this.svg = svgEl('svg', { viewBox: `0 0 ${BOARD_W} ${BOARD_H}`, preserveAspectRatio: 'none', class: 'bd-svg', 'aria-hidden': 'true' });
    this.overlay = document.createElement('div');
    this.overlay.className = 'bd-overlay';
    this.pen = document.createElement('div');
    this.pen.className = 'bd-pen';
    this.stage.append(this.svg, this.overlay, this.pen);
    root.append(this.stage);
    this.observer = new ResizeObserver(() => this.fit());
    this.observer.observe(root);
    this.fit();
  }

  destroy() {
    this.observer.disconnect();
    this.stage.remove();
    this.root.classList.remove('bd');
  }

  /** Scales the stage to the largest 1000 : 620 box that fits, and sets --u, the size of one board unit in pixels. */
  private fit() {
    const w = this.root.clientWidth, h = this.root.clientHeight;
    if (!w || !h) return;
    const k = Math.min(w / BOARD_W, h / BOARD_H);
    this.stage.style.width = `${BOARD_W * k}px`;
    this.stage.style.height = `${BOARD_H * k}px`;
    this.stage.style.setProperty('--u', `${k}px`);
  }

  /** What is on the board, as short lines, for the AI to point at ("eq1: formula x^2-5x+6=0"). Only things with an id the AI chose. */
  describe(): { id: string; what: string }[] {
    return [...this.items].filter(([id]) => !id.startsWith('_')).slice(-30).map(([id, it]) => ({ id, what: it.what }));
  }

  get isEmpty(): boolean {
    return this.items.size === 0;
  }

  clear(instant = false) {
    const els = [...this.items.values()].flatMap((i) => i.els);
    this.items.clear();
    for (const el of els) {
      if (instant) el.remove();
      else el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.then(() => el.remove(), () => el.remove());
    }
    this.hooks.onTerms?.([]);
    this.penAt = [60, 60];
    this.pen.getAnimations().forEach((a) => a.cancel());
    this.pen.style.opacity = '0';
  }

  /**
   * Draws one beat's ops, one after another with a little overlap, and returns how long (ms) the writing takes.
   * With `instant`, everything appears at once (used when jumping to a point in the lesson).
   */
  apply(beat: Beat, opts: { instant?: boolean; speed?: number } = {}): number {
    const instant = !!opts.instant;
    const speed = opts.speed ?? 1;
    let t = 0;
    for (const op of beat.ops) {
      const dur = instant ? 0 : this.draw(op, t, speed);
      t += instant ? 0 : dur * 0.62;
      if (!instant && op.op !== 'highlight' && op.op !== 'erase' && op.op !== 'clear') t += 60;
    }
    if (!instant) this.fadePen(t + 700);
    return instant ? 0 : t + 300;
  }

  /* ------------------------------------------------------------------ one op */

  private register(id: string | undefined, kind: Op['op'], what: string, els: Element[]): void {
    const key = id ?? `_${this.serial++}`;
    const old = this.items.get(key);
    if (old) for (const el of old.els) el.remove(); // an op with an id that is drawn again replaces the old one
    this.items.set(key, { els, kind, what });
  }

  private draw(op: Op, delay: number, speed: number): number {
    switch (op.op) {
      case 'text': return this.drawText(op, delay, speed);
      case 'math': return this.drawMath(op, delay, speed);
      case 'line': return this.drawStroke(op.id, 'line', 'line', [[op.x1, op.y1], [op.x2, op.y2]], false, op.ink ?? 'ink', { arrow: op.arrow, dash: op.dash }, delay, speed);
      case 'poly': return this.drawStroke(op.id, 'poly', 'shape', op.points, op.close ?? false, op.ink ?? 'ink', { fill: op.fill, dash: op.dash, arrow: op.arrow }, delay, speed);
      case 'circle': return this.drawCircle(op, delay, speed);
      case 'grid': return this.drawGrid(op, delay, speed);
      case 'box': return this.drawBox(op, delay, speed);
      case 'graph': return this.drawGraph(op, delay, speed);
      case 'terms': return this.drawTerms(op, delay);
      case 'highlight': this.highlight(op.target, op.ink, delay); return 700;
      case 'erase': this.erase(op.target, delay); return 400;
      case 'clear': this.clear(); return 350;
    }
  }

  private movePen(x: number, y: number, delay: number, dur: number) {
    const [fx, fy] = this.penAt;
    this.penAt = [x, y];
    const pos = (px: number, py: number) => ({ left: `calc(${px} * var(--u))`, top: `calc(${py} * var(--u))` });
    this.pen.animate([{ ...pos(fx, fy), opacity: 1 }, { ...pos(x, y), opacity: 1 }], { delay, duration: Math.max(80, dur), easing: 'ease-in-out', fill: 'forwards' });
  }

  private fadePen(at: number) {
    this.pen.animate([{ opacity: 1 }, { opacity: 0 }], { delay: at, duration: 500, fill: 'forwards' });
  }

  private stroke(path: SVGPathElement, dur: number, delay: number, final = 1) {
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1';
    path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { delay, duration: dur, easing: 'ease-in-out', fill: 'both' });
    if (final !== 1) path.style.opacity = String(final);
  }

  private drawStroke(id: string | undefined, kind: Op['op'], what: string, pts: [number, number][], close: boolean, ink: Ink, o: { arrow?: boolean; dash?: boolean; fill?: boolean }, delay: number, speed: number): number {
    const color = COLORS[ink];
    const g = svgEl('g', { class: 'bd-g' });
    const dur = Math.min(1400, 260 + length(pts, close) * 1.5) / speed;
    if (o.fill && pts.length > 2) {
      const f = svgEl('path', { d: pathOf(pts, true), fill: FILL[ink], stroke: 'none' });
      f.animate([{ opacity: 0 }, { opacity: 1 }], { delay: delay + dur * 0.55, duration: 500, fill: 'both' });
      g.append(f);
    }
    const p = svgEl('path', { d: pathOf(pts, close), fill: 'none', stroke: color, 'stroke-width': ink === 'ink' ? 4.5 : 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'bd-stroke' });
    g.append(p);
    if (o.dash) {
      // a dashed line is drawn as a dashed line first and revealed with a wipe, because the stroke-length trick needs a solid stroke
      p.style.strokeDasharray = '3 12';
      g.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { delay, duration: dur, easing: 'ease-in-out', fill: 'both' });
    } else this.stroke(p, dur, delay);
    const els: Element[] = [g];
    if (o.arrow && pts.length >= 2) {
      const [x2, y2] = pts.at(-1)!, [x1, y1] = pts.at(-2)!;
      const a = Math.atan2(y2 - y1, x2 - x1), s = 17;
      const head = svgEl('path', { d: `M${(x2 - s * Math.cos(a - 0.45)).toFixed(1)} ${(y2 - s * Math.sin(a - 0.45)).toFixed(1)} L${x2} ${y2} L${(x2 - s * Math.cos(a + 0.45)).toFixed(1)} ${(y2 - s * Math.sin(a + 0.45)).toFixed(1)}`, fill: 'none', stroke: color, 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      head.animate([{ opacity: 0 }, { opacity: 1 }], { delay: delay + dur * 0.85, duration: 200, fill: 'both' });
      g.append(head);
    }
    this.svg.append(g);
    const end = pts.at(-1)!;
    this.movePen(end[0], end[1], delay, dur);
    this.register(id, kind, what, els);
    return dur;
  }

  private drawCircle(op: Extract<Op, { op: 'circle' }>, delay: number, speed: number): number {
    const n = 48;
    const pts: [number, number][] = Array.from({ length: n + 1 }, (_, i) => [op.x + op.r * Math.cos((i / n) * Math.PI * 2 - Math.PI / 2), op.y + op.r * Math.sin((i / n) * Math.PI * 2 - Math.PI / 2)]);
    return this.drawStroke(op.id, 'circle', 'circle', pts, false, op.ink ?? 'ink', { fill: op.fill }, delay, speed);
  }

  private drawGrid(op: Extract<Op, { op: 'grid' }>, delay: number, speed: number): number {
    const d: string[] = [];
    for (let c = 1; c < op.cols; c++) d.push(`M${op.x + c * op.cell} ${op.y} V${op.y + op.rows * op.cell}`);
    for (let r = 1; r < op.rows; r++) d.push(`M${op.x} ${op.y + r * op.cell} H${op.x + op.cols * op.cell}`);
    const p = svgEl('path', { d: d.join(' '), fill: 'none', stroke: COLORS[op.ink ?? 'ink'], 'stroke-width': 1.6, opacity: 0.45 });
    const dur = 450 / speed;
    p.animate([{ opacity: 0 }, { opacity: 0.45 }], { delay, duration: dur, fill: 'both' });
    this.svg.append(p);
    this.register(op.id, 'grid', 'grid', [p]);
    return dur;
  }

  private drawBox(op: Extract<Op, { op: 'box' }>, delay: number, speed: number): number {
    // a hand-drawn rounded box: slightly uneven corners, and it does not close quite where it started
    const { x, y, w, h } = op, r = Math.min(22, h / 3);
    const j = (n: number) => (((x * 7 + y * 13 + n * 17) % 9) - 4) * 0.7;
    const d = `M${x + r} ${y + j(1)} L${x + w - r} ${y + j(2)} Q${x + w + j(3)} ${y} ${x + w + j(4)} ${y + r} L${x + w + j(5)} ${y + h - r} Q${x + w} ${y + h + j(6)} ${x + w - r} ${y + h + j(7)} L${x + r} ${y + h + j(8)} Q${x + j(1)} ${y + h} ${x + j(2)} ${y + h - r} L${x + j(3)} ${y + r + 6} Q${x} ${y + j(4)} ${x + r + 14} ${y + j(5)}`;
    const g = svgEl('g');
    const p = svgEl('path', { d, fill: 'none', stroke: COLORS[op.ink ?? 'teal'], 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    g.append(p);
    const dur = Math.min(1100, 400 + (w + h) * 1.1) / speed;
    this.stroke(p, dur, delay);
    this.svg.append(g);
    this.movePen(x + r + 14, y + j(5), delay + dur, 120);
    this.register(op.id, 'box', 'box', [g]);
    return dur;
  }

  private drawGraph(op: Extract<Op, { op: 'graph' }>, delay: number, speed: number): number {
    const f = compileExpr(op.fn);
    const { x, y, w, h, xmin, xmax, ymin, ymax } = op;
    const sx = (X: number) => x + ((X - xmin) / (xmax - xmin)) * w;
    const sy = (Y: number) => y + h - ((Y - ymin) / (ymax - ymin)) * h;
    const ax = Math.min(y + h, Math.max(y, sy(0))); // where the x axis sits
    const ay = Math.min(x + w, Math.max(x, sx(0)));
    const clipId = `bdc${this.serial++}`;
    const g = svgEl('g', { class: 'bd-g' });
    const clip = svgEl('clipPath', { id: clipId });
    clip.append(svgEl('rect', { x: x - 4, y: y - 4, width: w + 8, height: h + 8 }));
    g.append(clip);
    const axes = svgEl('path', { d: `M${x - 18} ${ax} H${x + w + 14} M${ay} ${y + h + 14} V${y - 14} M${x + w + 4} ${ax - 7} L${x + w + 14} ${ax} L${x + w + 4} ${ax + 7} M${ay - 7} ${y - 4} L${ay} ${y - 14} L${ay + 7} ${y - 4}`, fill: 'none', stroke: COLORS.mute, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    axes.animate([{ opacity: 0 }, { opacity: 0.85 }], { delay, duration: 400 / speed, fill: 'both' });
    g.append(axes);
    // the curve: split wherever the function leaves the picture or is undefined
    let d = '';
    let pen = false;
    const N = 220;
    for (let i = 0; i <= N; i++) {
      const X = xmin + ((xmax - xmin) * i) / N, Y = f(X);
      if (!Number.isFinite(Y) || Y < ymin - (ymax - ymin) || Y > ymax + (ymax - ymin)) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${sx(X).toFixed(1)} ${sy(Y).toFixed(1)} `;
      pen = true;
    }
    const curve = svgEl('path', { d: d.trim(), fill: 'none', stroke: COLORS[op.ink ?? 'lilac'], 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'clip-path': `url(#${clipId})` });
    const dur = 1100 / speed;
    this.stroke(curve, dur, delay + 300 / speed);
    g.append(curve);
    const els: Element[] = [g];
    this.svg.append(g);
    // marks on the curve, with their x value under the axis
    for (const m of op.marks ?? []) {
      const dot = svgEl('circle', { cx: sx(m), cy: sy(f(m)), r: 9, fill: COLORS.teal, stroke: '#0a1233', 'stroke-width': 3 });
      dot.animate([{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }], { delay: delay + 300 / speed + dur, duration: 350, easing: 'ease-out', fill: 'both' });
      (dot as SVGElement).style.transformOrigin = `${sx(m)}px ${sy(f(m))}px`;
      g.append(dot);
      const lab = this.label(String(Math.round(m * 100) / 100), sx(m) - 8, Math.min(y + h + 4, ax + 14), 'teal', 'm', delay + 300 / speed + dur + 120);
      els.push(lab);
    }
    if (op.label) els.push(this.label(op.label, x + w * 0.18, y - 34, op.ink ?? 'lilac', 's', delay + 300 / speed + dur * 0.6));
    this.movePen(sx(xmax), sy(f(xmax)), delay + 300 / speed, dur);
    this.register(op.id, 'graph', describeOp(op), els);
    return 300 / speed + dur + 400;
  }

  private label(text: string, x: number, y: number, ink: Ink, size: Size, delay: number): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'bd-t bd-hand';
    el.textContent = text;
    this.place(el, x, y, size, ink);
    el.animate([{ opacity: 0 }, { opacity: 1 }], { delay, duration: 400, fill: 'both' });
    this.overlay.append(el);
    return el;
  }

  private place(el: HTMLElement, x: number, y: number, size: Size, ink: Ink) {
    el.style.left = `calc(${x} * var(--u))`;
    el.style.top = `calc(${y} * var(--u))`;
    el.style.fontSize = `calc(${SIZE_UNITS[size]} * var(--u))`;
    el.style.color = COLORS[ink];
  }

  private write(el: HTMLElement, delay: number, dur: number) {
    el.animate([{ clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% -2% -10% 0)' }], { delay, duration: dur, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'both' });
  }

  private drawText(op: Extract<Op, { op: 'text' }>, delay: number, speed: number): number {
    const el = document.createElement('div');
    el.className = `bd-t${op.hand ? ' bd-hand' : ''}`;
    el.textContent = op.text;
    this.place(el, op.x, op.y, op.size ?? 'm', op.ink ?? 'ink');
    if (op.rotate) { el.style.transform = `rotate(${op.rotate}deg)`; el.style.transformOrigin = '0 50%'; }
    const dur = Math.min(1500, 320 + op.text.length * 34) / speed;
    this.write(el, delay, dur);
    this.overlay.append(el);
    const w = op.text.length * SIZE_UNITS[op.size ?? 'm'] * (op.hand ? 0.36 : 0.52);
    this.movePen(op.x + Math.min(w, 560), op.y + SIZE_UNITS[op.size ?? 'm'] * 0.7, delay, dur);
    this.register(op.id, 'text', describeOp(op), [el]);
    return dur;
  }

  private drawMath(op: Extract<Op, { op: 'math' }>, delay: number, speed: number): number {
    const el = document.createElement('div');
    el.className = 'bd-t bd-m';
    el.innerHTML = katex.renderToString(op.tex, { throwOnError: false, output: 'html', strict: 'ignore', trust: false, maxSize: 20, maxExpand: 200 });
    this.place(el, op.x, op.y, op.size ?? 'l', op.ink ?? 'ink');
    const dur = Math.min(1700, 520 + op.tex.length * 38) / speed;
    this.write(el, delay, dur);
    this.overlay.append(el);
    this.movePen(op.x + Math.min(op.tex.length * SIZE_UNITS[op.size ?? 'l'] * 0.42, 600), op.y + SIZE_UNITS[op.size ?? 'l'] * 0.6, delay, dur);
    this.register(op.id, 'math', describeOp(op), [el]);
    return dur;
  }

  private drawTerms(op: Extract<Op, { op: 'terms' }>, delay: number): number {
    window.setTimeout(() => this.hooks.onTerms?.(op.items.slice(0, 4)), delay);
    this.register(op.id, 'terms', describeOp(op), []);
    return 200;
  }

  private highlight(target: string, ink: Ink | undefined, delay: number) {
    const it = this.items.get(target);
    if (!it) return;
    const glow = ink ? COLORS[ink] : '#2de2c4';
    for (const el of it.els) {
      if (el instanceof SVGElement) el.animate([{ filter: 'none' }, { filter: `drop-shadow(0 0 14px ${glow}) brightness(1.5)` }, { filter: 'none' }], { delay, duration: 1100, easing: 'ease-in-out' });
      else {
        const h = el as HTMLElement;
        const base = h.style.transform || 'none';
        h.animate([{ transform: base, filter: 'none' }, { transform: `${h.style.transform || ''} scale(1.12)`, filter: `drop-shadow(0 0 14px ${glow})`, color: glow }, { transform: base, filter: 'none' }], { delay, duration: 1100, easing: 'ease-in-out' });
      }
    }
  }

  private erase(target: string, delay: number) {
    const it = this.items.get(target);
    if (!it) return;
    this.items.delete(target);
    for (const el of it.els) el.animate([{ opacity: 1 }, { opacity: 0 }], { delay, duration: 350, fill: 'forwards' }).finished.then(() => el.remove(), () => el.remove());
  }
}
