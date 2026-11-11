// The Smart Schools loading animation, as one reusable piece.
// A solid logo ring rolls along a glowing floor line. Each letter of the name rises out of the floor as the ring
// rolls off it, and the ring stops after the name. Everything is a function of time, so the same code plays in a
// browser, inside the slides, in the Mini App, and is rendered frame by frame into the bot's video.
// No font is needed: the letters are drawn from strokes.

const NS = 'http://www.w3.org/2000/svg';
const WORD = 'SMART SCHOOLS';
const CAP = 72, SW = 12.5, PTS = 120, TRACK = 14, WGAP = 46, RING = 44;

export interface LoaderOptions {
  width: number;
  height: number;
  /** Fade everything out at the end (for a looping video). Off for a splash that stays on screen. */
  fade?: boolean;
}
export interface Loader {
  setTime(t: number): void;
  /** Seconds until the picture is complete and settled. */
  settled: number;
  /** Seconds of the whole clip, including the fade-out when it is on. */
  duration: number;
}

const T = { ring0: 0.2, ring1: 0.65, roll0: 0.75, roll1: 3.4, back0: 2.95, back1: 3.95, out0: 5.2, end: 5.7 };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const outCubic = (p: number) => 1 - Math.pow(1 - clamp(p), 3);
const inOut = (p: number) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
const outBack = (p: number) => { p = clamp(p); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const rollOf = (u: number) => 0.85 * u + 0.15 * inOut(u);

/* ---------- letters drawn as strokes ---------- */
type Pt = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 64): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = rad(a0 + ((a1 - a0) * i) / n); return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as Pt; });
const DEFS: Record<string, { bw: number; s: () => Pt[][] }> = {
  S: { bw: 46, s: () => { const r = 15.25; return [[...arc(23, 51.25, r, r, 40, 270), ...arc(23, 20.75, r, r, 90, -140)]]; } },
  M: { bw: 66, s: () => [[[6.25, -8], [6.25, 72], [33, 22], [59.75, 72], [59.75, -8]]] },
  A: { bw: 62, s: () => [[[0.3, -8], [29.7, 80]], [[61.7, -8], [32.3, 80]], [[11, 24], [51, 24]]] },
  R: { bw: 46, s: () => [[[6.25, -8], [6.25, 66.5], [26, 66.5], ...arc(26, 50, 14, 16.5, 90, -90), [6.25, 33.5]], [[22, 36], [45.8, -8]]] },
  T: { bw: 54, s: () => [[[27, -8], [27, 66]], [[0, 65.75], [54, 65.75]]] },
  C: { bw: 52, s: () => [arc(27, 36, 21.5, 30.5, 38, 322, 70)] },
  H: { bw: 50, s: () => [[[6.25, -8], [6.25, 80]], [[43.75, -8], [43.75, 80]], [[6.25, 36], [43.75, 36]]] },
  O: { bw: 58, s: () => [arc(29, 36, 23.5, 30.5, -90, 270, 80)] },
  L: { bw: 40, s: () => [[[6.25, 80], [6.25, 6.25], [40, 6.25]]] },
};
function resample(poly: Pt[]): Pt[] {
  const seg = [0];
  for (let i = 1; i < poly.length; i++) seg.push(seg[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const len = seg[seg.length - 1], out: Pt[] = [];
  let j = 1;
  for (let i = 0; i < PTS; i++) {
    const d = (len * i) / (PTS - 1);
    while (j < poly.length - 1 && seg[j] < d) j++;
    const u = seg[j] === seg[j - 1] ? 0 : (d - seg[j - 1]) / (seg[j] - seg[j - 1]);
    out.push([poly[j - 1][0] + (poly[j][0] - poly[j - 1][0]) * u, -(poly[j - 1][1] + (poly[j][1] - poly[j - 1][1]) * u)]);
  }
  return out;
}
const pathD = (pts: Pt[], dx: number) => 'M' + pts.map((p) => (p[0] + dx).toFixed(1) + ' ' + p[1].toFixed(1)).join('L');

interface Slot { x: number; bw: number; g: SVGGElement; }
let counter = 0;

export function createLoader(svg: SVGSVGElement, o: LoaderOptions): Loader {
  const { width: W, height: H } = o;
  const FADE = o.fade ?? false;
  const u = `sl${++counter}`;
  const id = (n: string) => `${u}-${n}`;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `
<defs>
  <linearGradient id="${id('gL')}" gradientUnits="userSpaceOnUse" x1="0" y1="-${CAP}" x2="0" y2="0">
    <stop offset="0" stop-color="#767df9"/><stop offset=".16" stop-color="#a2bcff"/><stop offset=".46" stop-color="#deecfe"/>
    <stop offset=".74" stop-color="#f7e7eb"/><stop offset=".9" stop-color="#e3a58b"/><stop offset="1" stop-color="#d6a576"/>
  </linearGradient>
  <linearGradient id="${id('gF')}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="170">
    <stop offset="0" stop-color="#e9b77f" stop-opacity=".9"/><stop offset=".07" stop-color="#d6a576" stop-opacity=".8"/><stop offset=".18" stop-color="#b3747e" stop-opacity=".72"/>
    <stop offset=".34" stop-color="#7d468e" stop-opacity=".62"/><stop offset=".55" stop-color="#4a2486" stop-opacity=".4"/><stop offset=".8" stop-color="#1b0a47" stop-opacity=".15"/><stop offset="1" stop-color="#0b022b" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="${id('gR')}" gradientUnits="userSpaceOnUse" x1="0" y1="-4" x2="0" y2="9">
    <stop offset="0" stop-color="#ffd9a0" stop-opacity="0"/><stop offset=".45" stop-color="#ffe2a8" stop-opacity=".9"/><stop offset="1" stop-color="#e59a62" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="${id('gH')}" gradientUnits="userSpaceOnUse" x1="0" y1="-190" x2="0" y2="0">
    <stop offset="0" stop-color="#2230ff" stop-opacity="0"/><stop offset="1" stop-color="#4b5cff" stop-opacity=".42"/>
  </linearGradient>
  <linearGradient id="${id('gM')}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0">
    <stop offset="0" stop-color="#000"/><stop offset=".2" stop-color="#fff"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
  </linearGradient>
  <mask id="${id('mk')}" maskUnits="userSpaceOnUse" x="-1500" y="-400" width="6000" height="900"><rect x="-1500" y="-400" width="6000" height="900" fill="url(#${id('gM')})"/></mask>
  <clipPath id="${id('cy')}"><rect x="-4000" y="-${CAP}" width="12000" height="${CAP}"/></clipPath>
  <clipPath id="${id('fl')}"><rect x="-4000" y="-500" width="12000" height="500"/></clipPath>
</defs>
<g></g>`;
  const cam = svg.querySelector('g') as SVGGElement;
  const maskStops = Array.from(svg.querySelectorAll(`#${id('gM')} stop`));
  const maskGrad = svg.querySelector(`#${id('gM')}`) as SVGElement;
  const el = <E extends SVGElement>(tag: string, attrs: Record<string, string | number> = {}, parent: Element = cam): E => {
    const e = document.createElementNS(NS, tag) as E;
    for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    parent.appendChild(e);
    return e;
  };

  // lay the letters out
  const slots: Slot[] = [];
  let x = 0;
  const shapes: { bw: number; strokes: Pt[][] }[] = [];
  [...WORD].forEach((c) => {
    if (c === ' ') { x += WGAP - TRACK; return; }
    const d = DEFS[c];
    shapes.push({ bw: d.bw, strokes: d.s().map(resample) });
    slots.push({ x, bw: d.bw, g: null as unknown as SVGGElement });
    x += d.bw + TRACK;
  });
  const total = slots[slots.length - 1].x + slots[slots.length - 1].bw;

  const haze = el('rect', { x: 0, y: -190, width: 10, height: 190, fill: `url(#${id('gH')})`, mask: `url(#${id('mk')})` });
  const floor = el('rect', { x: 0, y: 0, width: 10, height: 170, fill: `url(#${id('gF')})`, mask: `url(#${id('mk')})` });
  slots.forEach((sl, k) => {
    const wrap = el('g', { 'clip-path': `url(#${id('fl')})` });
    sl.g = el('g', { opacity: 0 }, wrap);
    const glow = el('g', {}, sl.g), main = el('g', { 'clip-path': `url(#${id('cy')})` }, sl.g);
    shapes[k].strokes.forEach((pts) => {
      const d = pathD(pts, sl.x);
      el('path', { d, fill: 'none', stroke: '#6f7cff', 'stroke-width': SW + 26, 'stroke-opacity': 0.05, 'stroke-linejoin': 'round' }, glow);
      el('path', { d, fill: 'none', stroke: '#6f7cff', 'stroke-width': SW + 12, 'stroke-opacity': 0.1, 'stroke-linejoin': 'round' }, glow);
      el('path', { d, fill: 'none', stroke: `url(#${id('gL')})`, 'stroke-width': SW, 'stroke-linejoin': 'miter', 'stroke-miterlimit': 3 }, main);
    });
  });
  const rim = el('rect', { x: 0, y: -4, width: 10, height: 13, fill: `url(#${id('gR')})`, mask: `url(#${id('mk')})` });
  // the logo ring: a solid body, four arcs and a centre dot
  const ring = el('g', { opacity: 0 });
  el('circle', { r: 108, fill: 'none', stroke: '#6f7cff', 'stroke-width': 30, 'stroke-opacity': 0.12 }, ring);
  el('circle', { r: 102, fill: '#0b1330', stroke: '#1d2b64', 'stroke-width': 3 }, ring);
  [['#2DE2C4', 'M12.5 -89.1 A90 90 0 0 1 89.1 -12.5'], ['#5B8CFF', 'M89.1 12.5 A90 90 0 0 1 12.5 89.1'], ['#FF6B5B', 'M-12.5 89.1 A90 90 0 0 1 -89.1 12.5'], ['#FFB547', 'M-89.1 -12.5 A90 90 0 0 1 -12.5 -89.1']]
    .forEach(([c, d]) => el('path', { d, stroke: c, 'stroke-width': 24, fill: 'none', 'stroke-linecap': 'round' }, ring));
  el('circle', { r: 20, fill: '#EEF2FF' }, ring);

  const xStart = -RING * 1.6, xEnd = total + 46 + RING, span = xEnd + RING, rs = RING / 102;
  const ringAt = (tt: number) => lerp(xStart, xEnd, rollOf(clamp((tt - T.roll0) / (T.roll1 - T.roll0))));
  // when the ring has rolled past the middle of each letter
  const tPass = slots.map((sl) => {
    const gx = sl.x + sl.bw * 0.5 + RING * 0.15;
    let lo = T.roll0, hi = T.roll1;
    for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; if (ringAt(m) < gx) lo = m; else hi = m; }
    return hi;
  });

  function setTime(t: number) {
    const born = outBack((t - T.ring0) / (T.ring1 - T.ring0));
    const ringX = ringAt(t), sc = rs * Math.max(born, 0);
    ring.setAttribute('opacity', String(clamp(born * 3)));
    ring.setAttribute('transform', `translate(${ringX} ${-RING * Math.max(born, 0)}) rotate(${((ringX - xStart) / RING) * (180 / Math.PI)}) scale(${Math.max(sc, 0.0001)})`);

    slots.forEach((sl, k) => {
      const p = clamp((t - tPass[k]) / 0.38), e = outCubic(p);
      sl.g.setAttribute('opacity', String(clamp(p * 5)));
      sl.g.setAttribute('transform', `translate(0 ${(1 - e) * (CAP + 40)})`);
    });

    const L = xStart - RING, Rr = Math.min(ringX + RING * 1.6, span + RING);
    const fade = 190, wide = Math.max(Rr - L, 1), full = wide + 2 * fade, o2 = fade / full;
    maskGrad.setAttribute('x1', String(L - fade)); maskGrad.setAttribute('x2', String(Rr + fade));
    [0, o2, 1 - o2, 1].forEach((v, i) => maskStops[i].setAttribute('offset', String(v)));
    const breathe = t > T.back1 ? 0.94 + 0.06 * Math.sin(((t - T.back1) / 1.6) * Math.PI * 2) : 1;
    const lit = clamp((t - 0.05) / 0.35) * (t < 0.35 ? 0.7 + 0.3 * Math.sin(t * 90) : 1);
    const spread = clamp(wide / (span + 2 * RING));
    const grow = Math.max(born * 0.4, spread);
    for (const [r, op] of [[floor, lit * (0.5 + 0.5 * grow) * breathe], [rim, lit * breathe], [haze, clamp((spread - 0.15) * 1.6) * 0.9 * breathe]] as [SVGElement, number][]) {
      r.setAttribute('x', String(L - fade)); r.setAttribute('width', String(full)); r.setAttribute('opacity', String(op));
    }
    floor.setAttribute('transform', `scale(1 ${0.55 + 0.45 * Math.max(born * 0.5, spread)})`);

    // the camera travels with the ring (which drifts across the frame), then pulls back to show the name and the ring
    const fitW = W > H * 1.6 ? 0.62 : 0.88;
    const sFinal = (fitW * W) / span;
    const sPush = Math.min(sFinal * 3.2, (0.2 * H) / CAP);
    const back = inOut((t - T.back0) / (T.back1 - T.back0));
    const s = sPush * Math.pow(sFinal / sPush, back);
    const prog = rollOf(clamp((t - T.roll0) / (T.roll1 - T.roll0))), frac = lerp(0.24, 0.7, prog);
    const cx = lerp(ringX - ((frac - 0.5) * W) / sPush, span / 2 - RING, back);
    const baseY = lerp(0.62, 0.56, back) * H;
    cam.setAttribute('transform', `translate(${W / 2 - cx * s} ${baseY}) scale(${s})`);
    svg.style.opacity = String(FADE ? 1 - clamp((t - T.out0) / (T.end - T.out0)) : 1);
  }
  setTime(0);
  return { setTime, settled: T.back1 + 0.45, duration: FADE ? T.end : T.out0 };
}
