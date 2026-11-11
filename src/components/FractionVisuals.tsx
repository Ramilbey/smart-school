import type { Lang, Visual } from '../../shared/types.ts';
import { Frac } from './Brand.tsx';
import { MiniGraph, TwoPointGraph } from './Graph.tsx';

const FILL = '#FFB547';
const FILL_ALT = '#FF8A7C';
const EMPTY = '#FFFFFF';
const STROKE = '#1E2140';
const EATEN = '#E9E4DA';

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function sector(cx: number, cy: number, r: number, from: number, to: number) {
  if (to - from >= 359.999) return null;
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

interface PieProps {
  parts: number;
  filled: number | boolean[];
  size?: number;
  onToggle?: (index: number) => void;
  marked?: 'eaten';
  label?: string;
  highlight?: number;
}

/** A pie cut into equal slices. Interactive when onToggle is given. */
export function Pie({ parts, filled, size = 180, onToggle, marked, label, highlight }: PieProps) {
  const r = 80;
  const isFilled = (i: number) => (Array.isArray(filled) ? Boolean(filled[i]) : i < filled);
  const step = 360 / parts;
  return (
    <svg viewBox="0 0 180 180" width={size} height={size} className={`pie ${onToggle ? 'is-interactive' : ''}`} role={onToggle ? 'group' : 'img'} aria-label={label}>
      <circle cx="90" cy="90" r={r + 4} fill="rgba(30,33,64,.06)" />
      {Array.from({ length: parts }, (_, i) => {
        const d = sector(90, 90, r, i * step, (i + 1) * step);
        const on = isFilled(i);
        const fill = on ? (marked === 'eaten' ? EATEN : highlight === i ? FILL_ALT : FILL) : EMPTY;
        const common = {
          fill,
          stroke: STROKE,
          strokeWidth: 3,
          strokeLinejoin: 'round' as const,
          className: `slice ${on ? 'on' : ''}`,
          ...(onToggle
            ? {
                role: 'button',
                tabIndex: 0,
                'aria-pressed': on,
                'aria-label': `${i + 1} / ${parts}`,
                onClick: () => onToggle(i),
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggle(i);
                  }
                },
              }
            : {}),
        };
        return d ? <path key={i} d={d} {...common} /> : <circle key={i} cx="90" cy="90" r={r} {...common} />;
      })}
      {marked === 'eaten' &&
        Array.from({ length: parts }, (_, i) => {
          if (!isFilled(i)) return null;
          const [x, y] = polar(90, 90, r * 0.6, (i + 0.5) * step);
          return <text key={`x${i}`} x={x} y={y + 6} textAnchor="middle" className="eaten-mark">×</text>;
        })}
    </svg>
  );
}

/** A bar (chocolate, strip) cut into equal parts. */
export function Bar({ parts, filled, width = 300, marked, onToggle, label }: { parts: number; filled: number | boolean[]; width?: number; marked?: 'eaten'; onToggle?: (i: number) => void; label?: string }) {
  const h = 64;
  const w = 300;
  const pw = w / parts;
  const isFilled = (i: number) => (Array.isArray(filled) ? Boolean(filled[i]) : i < filled);
  return (
    <svg viewBox={`-4 -4 ${w + 8} ${h + 8}`} width={width} className="bar-visual" role="img" aria-label={label}>
      <rect x="0" y="0" width={w} height={h} rx="10" fill={EMPTY} stroke={STROKE} strokeWidth="3" />
      {Array.from({ length: parts }, (_, i) => {
        const on = isFilled(i);
        return (
          <g key={i}>
            <rect
              x={i * pw + 3}
              y="3"
              width={pw - 6}
              height={h - 6}
              rx="6"
              fill={on ? (marked === 'eaten' ? EATEN : FILL) : marked === 'eaten' ? '#8A5A3B' : EMPTY}
              stroke={on || marked ? 'none' : 'rgba(30,33,64,.15)'}
              onClick={onToggle ? () => onToggle(i) : undefined}
            />
            {marked === 'eaten' && on && (
              <text x={i * pw + pw / 2} y={h / 2 + 7} textAnchor="middle" className="eaten-mark">×</text>
            )}
            {i > 0 && <line x1={i * pw} y1="0" x2={i * pw} y2={h} stroke={STROKE} strokeWidth="2.5" />}
          </g>
        );
      })}
    </svg>
  );
}

/** Shapes cut into equal or unequal parts (circle: sector angles in degrees; rect: cut positions 0–1). */
export function SplitShape({ shape, cuts, filled, size = 120 }: { shape: 'circle' | 'rect'; cuts: number[]; filled: number[]; size?: number }) {
  if (shape === 'circle') {
    const angles = [...cuts, 360];
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        {cuts.map((from, i) => {
          const to = angles[i + 1];
          const d = sector(60, 60, 52, from, to);
          const fill = filled.includes(i) ? FILL : i % 2 ? '#FFF1D6' : EMPTY;
          return d ? (
            <path key={i} d={d} fill={fill} stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
          ) : (
            <circle key={i} cx="60" cy="60" r="52" fill={fill} stroke={STROKE} strokeWidth="3" />
          );
        })}
      </svg>
    );
  }
  const xs = [0, ...cuts, 1];
  const W = 140;
  const H = 90;
  return (
    <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} width={size * 1.2} aria-hidden="true">
      {xs.slice(0, -1).map((x, i) => (
        <rect key={i} x={x * W} y="0" width={(xs[i + 1] - x) * W} height={H} fill={filled.includes(i) ? FILL : i % 2 ? '#FFF1D6' : EMPTY} stroke={STROKE} strokeWidth="3" />
      ))}
    </svg>
  );
}

/** Fraction strips stacked to compare sizes. */
export function CompareBars({ fractions, width = 300 }: { fractions: [number, number][]; width?: number }) {
  const w = 280;
  const rowH = 44;
    return (
    <div className="compare-bars">
      {fractions.map(([n, d], row) => (
        <div className="compare-row" key={row}>
          <span className="compare-label"><Frac n={n} d={d} /></span>
          <svg viewBox={`-3 -3 ${w + 6} ${rowH + 6}`} width={width - 56} aria-hidden="true">
            {Array.from({ length: d }, (_, i) => {
              // One slice of melon: green rind on top, flesh below. Taken slices are full colour, the rest are pale.
              const x = (i * w) / d;
              const cw = w / d;
              const r = Math.min(10, cw / 2);
              const on = i < n;
              return (
                <g key={i}>
                  <path d={`M${x} 0 H${x + cw} V${rowH - r} Q${x + cw} ${rowH} ${x + cw - r} ${rowH} H${x + r} Q${x} ${rowH} ${x} ${rowH - r} Z`} fill={on ? '#ffc857' : '#fff3d1'} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
                  <rect x={x + 1.2} y="1.2" width={cw - 2.4} height="8" fill={on ? '#3a9a4a' : '#bfe0bf'} />
                </g>
              );
            })}
          </svg>
        </div>
      ))}
    </div>
  );
}

export function ComparePies({ parts }: { parts: number[] }) {
  return (
    <div className="compare-pies">
      {parts.map((p, i) => (
        <figure key={i}>
          <Pie parts={p} filled={1} size={120} />
          <figcaption><Frac n={1} d={p} /></figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Renders any declarative Visual from the lesson content. */
export function VisualView({ visual, size, lang }: { visual: Visual; size?: number; lang?: Lang }) {
  switch (visual.type) {
    case 'pie':
      return <Pie parts={visual.parts} filled={visual.filled} marked={visual.marked} size={size ?? 160} />;
    case 'bar':
      return <Bar parts={visual.parts} filled={visual.filled} marked={visual.marked} width={size ?? 300} />;
    case 'split':
      return <SplitShape shape={visual.shape} cuts={visual.cuts} filled={visual.filled} size={size ?? 110} />;
    case 'compare-bars':
      return <CompareBars fractions={visual.fractions} width={size ?? 320} />;
    case 'compare-pies':
      return <ComparePies parts={visual.parts} />;
    case 'line':
      return <MiniGraph k={visual.k} b={visual.b} size={size ?? 132} />;
    case 'two-points':
      return <TwoPointGraph a={visual.a} b={visual.b} showDelta={visual.showDelta} lang={lang} />;
  }
}

/**
 * A pomegranate cut into equal chambers, full of seeds. Tapping a chamber moves it to the bowl (`filled`), so
 * "colour 3 of 4" becomes "put 3/4 of the fruit in the bowl". Same props and the same keyboard handling as Pie.
 */
export function Pomegranate({ parts, filled, size = 210, onToggle, label }: { parts: number; filled: boolean[]; size?: number; onToggle?: (index: number) => void; label?: string }) {
  const R = 104;
  const step = 360 / parts;
  return (
    <svg viewBox="-130 -130 260 260" width={size} height={size} className={`pomegranate ${onToggle ? 'is-interactive' : ''}`} role={onToggle ? 'group' : 'img'} aria-label={label}>
      <defs>
        <pattern id="ss-seeds" width="14" height="12" patternUnits="userSpaceOnUse">
          <rect width="14" height="12" fill="#a3202e" />
          <circle cx="4" cy="3" r="4.3" fill="#e0303f" />
          <circle cx="11" cy="9" r="4.3" fill="#e0303f" />
          <circle cx="3" cy="2" r="1.3" fill="#ff9a9a" />
          <circle cx="10" cy="8" r="1.3" fill="#ff9a9a" />
        </pattern>
      </defs>
      <circle r="124" fill="#7d1a22" stroke="#4a0f14" strokeWidth="5" />
      <circle r="113" fill="#fffaf0" />
      {Array.from({ length: parts }, (_, i) => {
        const [x1, y1] = polar(0, 0, R, i * step);
        const [x2, y2] = polar(0, 0, R, (i + 1) * step);
        const moved = Boolean(filled[i]);
        const d = parts === 1 ? `M${-R} 0 A${R} ${R} 0 1 1 ${R} 0 A${R} ${R} 0 1 1 ${-R} 0 Z` : `M0 0 L${x1} ${y1} A${R} ${R} 0 ${step > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
        return (
          <path
            key={i}
            d={d}
            fill={moved ? '#ecdcb4' : 'url(#ss-seeds)'}
            stroke="#fffaf0"
            strokeWidth="7"
            strokeLinejoin="round"
            className={`slice ${moved ? 'on' : ''}`}
            {...(onToggle
              ? {
                  role: 'button',
                  tabIndex: 0,
                  'aria-pressed': moved,
                  'aria-label': `${i + 1} / ${parts}`,
                  onClick: () => onToggle(i),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggle(i);
                    }
                  },
                }
              : {})}
          />
        );
      })}
      <circle r="7" fill="#fffaf0" />
    </svg>
  );
}

/** The bowl the chambers go into: one small wedge of seeds for every chamber moved. */
export function Bowl({ count, parts, width = 230 }: { count: number; parts: number; width?: number }) {
  const step = 360 / parts;
  const r = 26;
  const gap = Math.min(54, 190 / Math.max(count, 1));
  const start = 130 - ((count - 1) * gap) / 2;
  const wedge = (cx: number) => {
    const [x1, y1] = polar(0, 0, r, 0);
    const [x2, y2] = polar(0, 0, r, step);
    return <path key={cx} transform={`translate(${cx} 42) rotate(-45)`} d={parts === 1 ? `M${-r} 0 A${r} ${r} 0 1 1 ${r} 0 A${r} ${r} 0 1 1 ${-r} 0 Z` : `M0 0 L${x1} ${y1} A${r} ${r} 0 ${step > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill="url(#ss-seeds)" stroke="#7d1a22" strokeWidth="2" strokeLinejoin="round" />;
  };
  return (
    <svg viewBox="0 0 260 120" width={width} className="bowl" role="img" aria-label={`${count}/${parts}`}>
      <path d="M20 50 Q130 150 240 50 Z" fill="#fffaf0" stroke="#1d44a3" strokeWidth="5" strokeLinejoin="round" />
      <g fill="#1d44a3"><path d="M82 82 l6 -7 l6 7 l-6 7 z" /><path d="M127 94 l6 -7 l6 7 l-6 7 z" /><path d="M172 82 l6 -7 l6 7 l-6 7 z" /></g>
      <ellipse cx="130" cy="50" rx="112" ry="30" fill="#fffaf0" stroke="#1d44a3" strokeWidth="5" />
      <ellipse cx="130" cy="52" rx="96" ry="22" fill="#e9eef9" stroke="#1d44a3" strokeWidth="2.5" />
      {Array.from({ length: count }, (_, i) => wedge(start + i * gap))}
    </svg>
  );
}
