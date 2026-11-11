import { useState, type ReactNode } from 'react';
import { visualSvg, type Visual } from '../../shared/curriculum/index.ts';
import type { Label } from '../../shared/curriculum/visuals.ts';
import { lin } from '../../shared/curriculum/types.ts';
import type { Lang } from '../../shared/types.ts';
import { useStore } from '../lib/store.tsx';

/**
 * Live versions of the lesson pictures: the student drags a slider and the picture and the rule move together.
 * Only pictures where moving something teaches the idea get one; the rest stay plain pictures (see `isExplorable`).
 */

type L3 = Record<Lang, string>;
const WORDS = {
  drag: { uz: 'Surib ko‘r', ru: 'Подвигай', en: 'Drag it' },
  rises: { uz: 'chiziq ko‘tariladi', ru: 'прямая растёт', en: 'the line rises' },
  falls: { uz: 'chiziq tushadi', ru: 'прямая убывает', en: 'the line falls' },
  flat: { uz: 'chiziq tekis', ru: 'прямая горизонтальна', en: 'the line is flat' },
  crosses: { uz: 'y o‘qini kesadi', ru: 'пересекает ось y', en: 'crosses the y-axis' },
  sum: { uz: 'yig‘indisi', ru: 'сумма', en: 'total' },
  acute: { uz: 'o‘tkir burchak', ru: 'острый угол', en: 'acute angle' },
  right: { uz: 'to‘g‘ri burchak', ru: 'прямой угол', en: 'right angle' },
  obtuse: { uz: 'o‘tmas burchak', ru: 'тупой угол', en: 'obtuse angle' },
  straight: { uz: 'yoyiq burchak', ru: 'развёрнутый угол', en: 'straight angle' },
  level: { uz: 'tarozi teng — x topildi!', ru: 'весы в равновесии — x найден!', en: 'the scale is level — x found!' },
  leftHeavier: { uz: 'chap palla og‘ir', ru: 'левая чаша тяжелее', en: 'the left side is heavier' },
  rightHeavier: { uz: 'o‘ng palla og‘ir', ru: 'правая чаша тяжелее', en: 'the right side is heavier' },
  vertical: { uz: 'vertikal burchaklar doim teng', ru: 'вертикальные углы всегда равны', en: 'vertical angles are always equal' },
  corresponding: { uz: 'mos burchaklar teng', ru: 'соответственные углы равны', en: 'corresponding angles are equal' },
  alternate: { uz: 'ichki almashinuvchi burchaklar teng', ru: 'накрест лежащие углы равны', en: 'alternate angles are equal' },
  sameSide: { uz: 'bir tomonli burchaklar yig‘indisi 180°', ru: 'односторонние углы в сумме дают 180°', en: 'same-side angles add up to 180°' },
  circumference: { uz: 'aylana uzunligi', ru: 'длина окружности', en: 'circumference' },
  area: { uz: 'yuzi', ru: 'площадь', en: 'area' },
  diameter: { uz: 'diametr', ru: 'диаметр', en: 'diameter' },
  speed: { uz: 'tezlik', ru: 'скорость', en: 'speed' },
  time: { uz: 'vaqt', ru: 'время', en: 'time' },
  distance: { uz: 'masofa', ru: 'путь', en: 'distance' },
  current: { uz: 'tok kuchi', ru: 'сила тока', en: 'current' },
  value: { uz: 'qiymati', ru: 'значение', en: 'value' },
  pressure: { uz: 'bosim', ru: 'давление', en: 'pressure' },
  density: { uz: 'zichlik', ru: 'плотность', en: 'density' },
  partsTotal: { uz: 'jami qism', ru: 'всего частей', en: 'parts in all' },
  onePart: { uz: '1 qism', ru: '1 часть', en: '1 part' },
  piecesAll: { uz: 'jami bo‘lak', ru: 'всего кусков', en: 'pieces in all' },
  smaller: { uz: 'bo‘laklar mayda bo‘ladi, maxraj o‘sadi', ru: 'доли мельчают, знаменатель растёт', en: 'the pieces get smaller, so the denominator grows' },
  loaves: { uz: 'non soni', ru: 'лепёшек', en: 'loaves' },
  eachCut: { uz: 'har biri nechta bo‘lak', ru: 'на сколько кусков', en: 'pieces per loaf' },
} satisfies Record<string, L3>;

type Lin = { k: number; c: number };
/** "3x − 4" or "2 + 3x + 8" as k·x + c; null for anything this explorer cannot read. */
function parseLin(src: string): Lin | null {
  const t = src.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/,/g, '.');
  if (!/^[0-9x+\-.]+$/.test(t)) return null;
  const terms = t.match(/[+-]?[^+-]+/g);
  if (!terms) return null;
  let k = 0, c = 0;
  for (const term of terms) {
    if (term.includes('x')) {
      if (!term.endsWith('x') || term.indexOf('x') !== term.length - 1) return null;
      const co = term.slice(0, -1);
      const n = co === '' || co === '+' ? 1 : co === '-' ? -1 : Number(co);
      if (!Number.isFinite(n)) return null;
      k += n;
    } else {
      const n = Number(term);
      if (!Number.isFinite(n)) return null;
      c += n;
    }
  }
  return { k, c };
}
const plainLabel = (l: Label, lang: Lang) => (typeof l === 'string' ? l : l[lang]);

/** The percent bar of the Grade 6 book: two parts, the first one is the share. Only in the percent topic, where bars mean percentages. */
const isPercentBar = (v: Visual, topicId?: string) => topicId === 'm6-percent' && v.t === 'bar' && v.parts.length === 2 && !v.parts.some((p) => typeof p.label === 'string' && /[?x]/.test(p.label));

/** The ratio bars of the Grade 6 book: coloured parts side by side. */
const isRatioBar = (v: Visual, topicId?: string) => topicId === 'm6-ratio' && v.t === 'bar' && v.parts.length >= 2;
/** Rows of cut pieces: whole loaves (n = d) or a fraction against a smaller one. */
const isFractionRows = (v: Visual) => v.t === 'fraction' && v.rows.length >= 1 && v.rows.length <= 3;

export const isExplorable = (v: Visual, topicId?: string) =>
  (v.t === 'plane' && (v.lines?.length ?? 0) === 1) ||
  (v.t === 'triangle' && !v.equal) ||
  v.t === 'straight' ||
  v.t === 'angle' ||
  v.t === 'cross' ||
  v.t === 'parallel' ||
  v.t === 'circle' ||
  v.t === 'road' ||
  v.t === 'circuit' ||
  (v.t === 'balance' && parseLin(plainLabel(v.left, 'en')) !== null && parseLin(plainLabel(v.right, 'en')) !== null) ||
  (v.t === 'tiles' && v.groups.every((g) => g.kind !== 'x2')) ||
  v.t === 'square' ||
  v.t === 'press' ||
  v.t === 'block' ||
  isPercentBar(v, topicId) ||
  isRatioBar(v, topicId) ||
  isFractionRows(v);

function Slider({ label, value, min, max, step = 1, onChange, tone }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; tone: string }) {
  return (
    <label className="xp-slider" style={{ ['--tone' as string]: tone }}>
      <span className="xp-slider-name">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="xp-slider-val">{value}</span>
    </label>
  );
}

function Frame({ svg, children, lang }: { svg: string; children: ReactNode; lang: Lang }) {
  return (
    <div className="xplore">
      {/* the SVG comes from our own generator, which escapes every label */}
      <div className="course-pic" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="xp-controls">
        <span className="xp-tag">{WORDS.drag[lang]}</span>
        {children}
      </div>
    </div>
  );
}

function LineExplorer({ start }: { start: { k: number; b: number } }) {
  const { lang } = useStore();
  const [k, setK] = useState(start.k);
  const [b, setB] = useState(start.b);
  const svg = visualSvg({ t: 'plane', lines: [{ k, b }], points: [{ x: 0, y: b, label: 'b' }] }, lang);
  const trend = k > 0 ? WORDS.rises : k < 0 ? WORDS.falls : WORDS.flat;
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>y = {lin(k, b)}</b>
        <span>{trend[lang]} · {WORDS.crosses[lang]} {b}</span>
      </div>
      <Slider label="k" value={k} min={-4} max={4} onChange={setK} tone="#1d44a3" />
      <Slider label="b" value={b} min={-4} max={4} onChange={setB} tone="#d8412f" />
    </Frame>
  );
}

function TriangleExplorer({ start }: { start: [number, number, number] }) {
  const { lang } = useStore();
  const [a, setA] = useState(Math.min(start[0], 120));
  const [b, setB] = useState(Math.min(start[1], 120));
  const bMax = Math.min(150 - a, 120);
  const bb = Math.min(b, bMax);
  const c = 180 - a - bb;
  const svg = visualSvg({ t: 'triangle', deg: [a, bb, c], a: `${a}°`, b: `${bb}°`, c: `${c}°` }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{a}° + {bb}° + {c}° = 180°</b>
        <span>{WORDS.sum[lang]}: 180°</span>
      </div>
      <Slider label="A" value={a} min={20} max={120} step={5} onChange={setA} tone="#1d44a3" />
      <Slider label="B" value={bb} min={20} max={bMax} step={5} onChange={setB} tone="#139a8c" />
    </Frame>
  );
}

function StraightExplorer({ start }: { start: number }) {
  const { lang } = useStore();
  const [split, setSplit] = useState(start);
  const svg = visualSvg({ t: 'straight', a: `${180 - split}°`, b: `${split}°`, split }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{180 - split}° + {split}° = 180°</b>
      </div>
      <Slider label="°" value={split} min={20} max={160} step={5} onChange={setSplit} tone="#139a8c" />
    </Frame>
  );
}

function AngleExplorer({ start }: { start: number }) {
  const { lang } = useStore();
  const [deg, setDeg] = useState(start);
  const svg = visualSvg({ t: 'angle', deg, label: `${deg}°` }, lang);
  const kind = deg < 90 ? WORDS.acute : deg === 90 ? WORDS.right : deg < 180 ? WORDS.obtuse : WORDS.straight;
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{deg}°</b>
        <span>{kind[lang]}</span>
      </div>
      <Slider label="°" value={deg} min={10} max={180} step={5} onChange={setDeg} tone="#ffb547" />
    </Frame>
  );
}

const round1 = (v: number) => Math.round(v * 10) / 10;

function BalanceExplorer({ left, right }: { left: Lin; right: Lin }) {
  const { lang } = useStore();
  const [x, setX] = useState(0);
  const L = left.k * x + left.c;
  const R = right.k * x + right.c;
  const level = L === R;
  const tilt = Math.max(-16, Math.min(16, (L - R) * 2.2));
  const rad = (tilt * Math.PI) / 180;
  const ex = 120 * Math.cos(rad), ey = 120 * Math.sin(rad);
  // left end goes down when the left side is heavier
  const lx = 200 - ex, ly = 70 + ey, rx = 200 + ex, ry = 70 - ey;
  const pan = (cx: number, cy: number, val: number, fill: string) => (
    <g>
      <path d={`M${cx} ${cy} L${cx - 36} ${cy + 58} M${cx} ${cy} L${cx + 36} ${cy + 58}`} stroke="#0c1f57" strokeWidth="3" />
      <path d={`M${cx - 48} ${cy + 58} H${cx + 48} Q${cx + 46} ${cy + 88} ${cx} ${cy + 88} Q${cx - 46} ${cy + 88} ${cx - 48} ${cy + 58} Z`} fill={fill} stroke="#0c1f57" strokeWidth="3" strokeLinejoin="round" />
      <text x={cx} y={cy + 81} textAnchor="middle" fontFamily="Onest, sans-serif" fontWeight="800" fontSize="22" fill="#0c1f57">{val}</text>
    </g>
  );
  return (
    <div className="xplore">
      <div className="course-pic xp-board" aria-hidden="true">
        <svg viewBox="0 0 400 250" role="img">
          <rect width="400" height="250" fill="#f7f0df" />
          <path d="M200 70 L170 232 H230 Z" fill="#1d44a3" stroke="#0c1f57" strokeWidth="3" strokeLinejoin="round" />
          <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#0c1f57" strokeWidth="9" strokeLinecap="round" />
          {pan(lx, ly, L, '#139a8c')}
          {pan(rx, ry, R, '#ffb547')}
          <circle cx="200" cy="70" r="9" fill="#ffb547" stroke="#0c1f57" strokeWidth="3" />
          {level && <text x="200" y="36" textAnchor="middle" fontFamily="Onest, sans-serif" fontWeight="800" fontSize="22" fill="#0f7f72">=</text>}
        </svg>
      </div>
      <div className="xp-controls">
        <span className="xp-tag">{WORDS.drag[lang]}</span>
        <div className="xp-rule" aria-live="polite">
          <b>x = {x}</b>
          <span>{level ? WORDS.level[lang] : L > R ? WORDS.leftHeavier[lang] : WORDS.rightHeavier[lang]}</span>
        </div>
        <Slider label="x" value={x} min={-10} max={20} onChange={setX} tone="#1d44a3" />
      </div>
    </div>
  );
}

function CircleExplorer({ kind }: { kind: 'r' | 'd' | 'area' | 'around' }) {
  const { lang } = useStore();
  const [r, setR] = useState(3);
  const svg = visualSvg({ t: 'circle', kind, label: `r = ${r}` }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>r = {r}</b>
        <span>{WORDS.diameter[lang]}: d = 2 · {r} = {2 * r}</span>
        <span>{WORDS.circumference[lang]}: C = 2 · 3.14 · {r} = {round1(2 * 3.14 * r)}</span>
        <span>{WORDS.area[lang]}: S = 3.14 · {r}² = {round1(3.14 * r * r)}</span>
      </div>
      <Slider label="r" value={r} min={1} max={10} onChange={setR} tone="#139a8c" />
    </Frame>
  );
}

function RoadExplorer() {
  const { lang } = useStore();
  const [v, setV] = useState(60);
  const [t, setT] = useState(2);
  const svg = visualSvg({ t: 'road', s: `${v * t} km`, v: `${v} km/h`, time: `${t} h` }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>s = v · t = {v} · {t} = {v * t}</b>
        <span>{WORDS.distance[lang]}: {v * t} km</span>
      </div>
      <Slider label="v" value={v} min={10} max={120} step={10} onChange={setV} tone="#1d44a3" />
      <Slider label="t" value={t} min={1} max={8} onChange={setT} tone="#d8412f" />
    </Frame>
  );
}

function CircuitExplorer() {
  const { lang } = useStore();
  const [u, setU] = useState(12);
  const [r, setR] = useState(4);
  const i = round1(u / r);
  const svg = visualSvg({ t: 'circuit', u: `${u} V`, r: `${r} Ω`, i: `I = ${i} A` }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>I = U ÷ R = {u} ÷ {r} = {i} A</b>
        <span>{WORDS.current[lang]}: {i} A</span>
      </div>
      <Slider label="U" value={u} min={2} max={24} step={2} onChange={setU} tone="#1d44a3" />
      <Slider label="R" value={r} min={1} max={20} onChange={setR} tone="#d8412f" />
    </Frame>
  );
}

function CrossExplorer({ start }: { start: number }) {
  const { lang } = useStore();
  const [deg, setDeg] = useState(start);
  const svg = visualSvg({ t: 'cross', deg, a: `${deg}°`, b: `${deg}°` }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{deg}° = {deg}°</b>
        <span>{WORDS.vertical[lang]}</span>
      </div>
      <Slider label="°" value={deg} min={20} max={160} step={5} onChange={setDeg} tone="#139a8c" />
    </Frame>
  );
}

function ParallelExplorer({ kind, start }: { kind: 'corresponding' | 'alternate' | 'sameSide'; start: number }) {
  const { lang } = useStore();
  const [deg, setDeg] = useState(start);
  const other = kind === 'sameSide' ? 180 - deg : deg;
  const svg = visualSvg({ t: 'parallel', deg, a: `${deg}°`, b: `${other}°`, kind }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{kind === 'sameSide' ? `${deg}° + ${other}° = 180°` : `${deg}° = ${other}°`}</b>
        <span>{WORDS[kind][lang]}</span>
      </div>
      <Slider label="°" value={deg} min={30} max={150} step={5} onChange={setDeg} tone="#139a8c" />
    </Frame>
  );
}

function TilesExplorer({ groups }: { groups: { n: number; kind: 'x' | '1' | 'x2' }[] }) {
  const { lang } = useStore();
  const [x, setX] = useState(3);
  const k = groups.filter((g) => g.kind === 'x').reduce((a, g) => a + g.n, 0);
  const c = groups.filter((g) => g.kind === '1').reduce((a, g) => a + g.n, 0);
  const svg = visualSvg({ t: 'tiles', groups }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{lin(k, c)} = {k} · {x} + {c} = {k * x + c}</b>
        <span>x = {x}</span>
      </div>
      <Slider label="x" value={x} min={1} max={10} onChange={setX} tone="#1d44a3" />
    </Frame>
  );
}

function PercentExplorer({ visual }: { visual: Visual }) {
  const { lang } = useStore();
  const startTotal = visual.t === 'bar' && typeof visual.total === 'string' && /^\d+$/.test(visual.total) ? Number(visual.total) : 200;
  const startPct = visual.t === 'bar' ? Math.min(95, Math.max(5, Math.round((visual.parts[0].w / (visual.parts[0].w + visual.parts[1].w)) * 20) * 5)) : 25;
  const [p, setP] = useState(startPct);
  const [total, setTotal] = useState(startTotal);
  const svg = visualSvg({ t: 'bar', parts: [{ w: p, label: `${p}%`, tone: 'amber' }, { w: 100 - p, tone: 'soft' }], total: `${total}` }, lang);
  const part = round1((total * p) / 100);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{total} · {p}% = {part}</b>
        <span>1% = {total} ÷ 100 = {round1(total / 100)}; {p}% = {round1(total / 100)} · {p}</span>
      </div>
      <Slider label="%" value={p} min={5} max={95} step={5} onChange={setP} tone="#d8412f" />
      <Slider label="N" value={total} min={20} max={500} step={20} onChange={setTotal} tone="#1d44a3" />
    </Frame>
  );
}

function SquareExplorer() {
  const { lang } = useStore();
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const svg = visualSvg({ t: 'square', a: String(a), b: String(b) }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>({a} + {b})² = {(a + b) ** 2}</b>
        <span>{a}² + 2 · {a} · {b} + {b}² = {a * a} + {2 * a * b} + {b * b} = {a * a + 2 * a * b + b * b}</span>
      </div>
      <Slider label="a" value={a} min={1} max={8} onChange={setA} tone="#1d44a3" />
      <Slider label="b" value={b} min={1} max={8} onChange={setB} tone="#d8412f" />
    </Frame>
  );
}

function PressExplorer() {
  const { lang } = useStore();
  const [f, setF] = useState(500);
  const [a, setA] = useState(0.5);
  const p = Math.round(f / a);
  const svg = visualSvg({ t: 'press', force: `F = ${f} N`, area: `S = ${a} m²`, wide: a >= 1 }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>p = F ÷ S = {f} ÷ {a} = {p} Pa</b>
        <span>{WORDS.pressure[lang]}: {p} Pa</span>
      </div>
      <Slider label="F" value={f} min={100} max={1000} step={100} onChange={setF} tone="#1d44a3" />
      <Slider label="S" value={a} min={0.1} max={2} step={0.1} onChange={(v) => setA(round1(v))} tone="#139a8c" />
    </Frame>
  );
}

function BlockExplorer() {
  const { lang } = useStore();
  const [m, setM] = useState(2500);
  const [vol, setVol] = useState(5);
  const rho = round1(m / vol);
  const svg = visualSvg({ t: 'block', m: `m = ${m} kg`, v: `V = ${vol} m³` }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>ρ = m ÷ V = {m} ÷ {vol} = {rho} kg/m³</b>
        <span>{WORDS.density[lang]}: {rho} kg/m³</span>
      </div>
      <Slider label="m" value={m} min={500} max={5000} step={500} onChange={setM} tone="#1d44a3" />
      <Slider label="V" value={vol} min={1} max={10} onChange={setVol} tone="#139a8c" />
    </Frame>
  );
}

function RatioExplorer({ visual }: { visual: Visual }) {
  const { lang } = useStore();
  let a0 = 2, b0 = 3, u0 = 1;
  if (visual.t === 'bar') {
    const p = visual.parts;
    if (p.every((x) => x.w === 1) && p.length >= 3) {
      a0 = p.filter((x) => x.tone === p[0].tone).length;
      b0 = p.length - a0;
    } else {
      a0 = p[0].w;
      b0 = p[1].w;
      const lab = Number(typeof p[0].label === 'string' ? p[0].label : NaN);
      if (Number.isFinite(lab) && lab > 0 && lab % a0 === 0) u0 = lab / a0;
    }
  }
  const [a, setA] = useState(Math.min(6, Math.max(1, a0)));
  const [b, setB] = useState(Math.min(6, Math.max(1, b0)));
  const [u, setU] = useState(Math.min(10, Math.max(1, u0)));
  const parts = [
    ...Array.from({ length: a }, () => ({ w: 1, label: String(u), tone: 'blue' as const })),
    ...Array.from({ length: b }, () => ({ w: 1, label: String(u), tone: 'amber' as const })),
  ];
  const svg = visualSvg({ t: 'bar', parts, total: String((a + b) * u) }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{u === 1 ? `${a} : ${b}` : `${a} : ${b} = ${a * u} : ${b * u}`}</b>
        <span>{a} + {b} = {a + b} {WORDS.partsTotal[lang]} · {WORDS.onePart[lang]} = {u}</span>
      </div>
      <Slider label="a" value={a} min={1} max={6} onChange={setA} tone="#1d44a3" />
      <Slider label="b" value={b} min={1} max={6} onChange={setB} tone="#e0a020" />
      <Slider label="1" value={u} min={1} max={10} onChange={setU} tone="#139a8c" />
    </Frame>
  );
}

function LoavesExplorer({ start }: { start: { w: number; d: number } }) {
  const { lang } = useStore();
  const [w, setW] = useState(Math.min(3, Math.max(1, start.w)));
  const [d, setD] = useState(Math.min(8, Math.max(2, start.d)));
  const svg = visualSvg({ t: 'fraction', rows: Array.from({ length: w }, () => ({ n: d, d })) }, lang);
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{w} ÷ 1/{d} = {w} · {d} = {w * d}</b>
        <span>{WORDS.piecesAll[lang]}: {w * d}</span>
      </div>
      <Slider label="n" value={w} min={1} max={3} onChange={setW} tone="#e0a020" />
      <Slider label="d" value={d} min={2} max={8} onChange={setD} tone="#1d44a3" />
    </Frame>
  );
}

function FractionDivExplorer({ start }: { start: { n: number; d: number; m: number } }) {
  const { lang } = useStore();
  const [d, setD] = useState(Math.min(8, Math.max(2, start.d)));
  const [n, setN] = useState(Math.min(start.n, d - 1));
  const [m, setM] = useState(Math.min(4, Math.max(2, start.m)));
  const nn = Math.min(n, d - 1);
  const svg = visualSvg(
    { t: 'fraction', rows: [{ n: nn, d, label: `${nn}/${d}` }, { n: nn, d: d * m, label: `${nn}/${d * m}` }] },
    lang,
  );
  return (
    <Frame svg={svg} lang={lang}>
      <div className="xp-rule" aria-live="polite">
        <b>{nn}/{d} ÷ {m} = {nn}/({d} · {m}) = {nn}/{d * m}</b>
        <span>{WORDS.smaller[lang]}</span>
      </div>
      <Slider label="d" value={d} min={2} max={8} onChange={(v) => { setD(v); setN((x) => Math.min(x, v - 1)); }} tone="#1d44a3" />
      <Slider label="n" value={nn} min={1} max={d - 1} onChange={setN} tone="#e0a020" />
      <Slider label="÷" value={m} min={2} max={4} onChange={setM} tone="#d8412f" />
    </Frame>
  );
}

/** The live version of a lesson picture, or null when this picture has none. */
export function Explorer({ visual, topicId }: { visual: Visual; topicId?: string }) {
  const { lang } = useStore();
  if (visual.t === 'plane' && visual.lines?.length === 1) return <LineExplorer start={{ k: visual.lines[0].k, b: visual.lines[0].b }} />;
  if (visual.t === 'triangle' && !visual.equal) return <TriangleExplorer start={visual.deg as [number, number, number]} />;
  if (visual.t === 'straight') return <StraightExplorer start={visual.split ?? 125} />;
  if (visual.t === 'angle') return <AngleExplorer start={visual.deg} />;
  if (visual.t === 'cross') return <CrossExplorer start={visual.deg} />;
  if (visual.t === 'parallel') return <ParallelExplorer kind={visual.kind} start={visual.deg} />;
  if (visual.t === 'circle') return <CircleExplorer kind={visual.kind} />;
  if (visual.t === 'road') return <RoadExplorer />;
  if (visual.t === 'circuit') return <CircuitExplorer />;
  if (visual.t === 'tiles') return <TilesExplorer groups={visual.groups} />;
  if (visual.t === 'square') return <SquareExplorer />;
  if (visual.t === 'press') return <PressExplorer />;
  if (visual.t === 'block') return <BlockExplorer />;
  if (isPercentBar(visual, topicId)) return <PercentExplorer visual={visual} />;
  if (isRatioBar(visual, topicId)) return <RatioExplorer visual={visual} />;
  if (visual.t === 'fraction' && isFractionRows(visual)) {
    const [r0, r1] = visual.rows;
    if (visual.rows.every((r) => r.n === r.d)) return <LoavesExplorer start={{ w: visual.rows.length, d: r0.d }} />;
    if (r1 && r1.d % r0.d === 0 && r1.d > r0.d) return <FractionDivExplorer start={{ n: r0.n, d: r0.d, m: r1.d / r0.d }} />;
    return <FractionDivExplorer start={{ n: Math.min(r0.n, r0.d - 1) || 1, d: r0.d, m: 2 }} />;
  }
  if (visual.t === 'balance') {
    const l = parseLin(plainLabel(visual.left, lang));
    const r = parseLin(plainLabel(visual.right, lang));
    if (l && r) return <BalanceExplorer left={l} right={r} />;
  }
  return null;
}
