import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { num } from '../../shared/format.ts';
import type { Lang } from '../../shared/types.ts';
import { telegram } from '../lib/telegram.ts';

const SIZE = 300;
const PAD = 16;

export const K_MIN = -4;
export const K_MAX = 4;
export const B_MIN = -5;
export const B_MAX = 5;
/** x-position of the slope handle. At x = 2 every half-step of k lands on a grid point. */
const HX = 2;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function makeScale(range: number) {
  const s = (SIZE - 2 * PAD) / (2 * range);
  return {
    s,
    X: (x: number) => PAD + (x + range) * s,
    Y: (y: number) => PAD + (range - y) * s,
    invY: (py: number) => range - (py - PAD) / s,
  };
}

function Grid({ range, labels = true, id }: { range: number; labels?: boolean; id: string }) {
  const { X, Y } = makeScale(range);
  const ticks = Array.from({ length: 2 * range + 1 }, (_, i) => i - range);
  return (
    <g className="grid">
      <defs>
        <clipPath id={id}>
          <rect x={PAD} y={PAD} width={SIZE - 2 * PAD} height={SIZE - 2 * PAD} />
        </clipPath>
      </defs>
      <rect x={PAD} y={PAD} width={SIZE - 2 * PAD} height={SIZE - 2 * PAD} className="grid-bg" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={X(t)} y1={PAD} x2={X(t)} y2={SIZE - PAD} className={t === 0 ? 'axis' : 'gridline'} />
          <line x1={PAD} y1={Y(t)} x2={SIZE - PAD} y2={Y(t)} className={t === 0 ? 'axis' : 'gridline'} />
        </g>
      ))}
      {labels &&
        ticks
          .filter((t) => t !== 0 && t % 2 === 0 && Math.abs(t) < range)
          .map((t) => (
            <g key={`l${t}`} className="tick">
              <text x={X(t)} y={Y(0) + 13} textAnchor="middle">{t < 0 ? `−${-t}` : t}</text>
              <text x={X(0) - 6} y={Y(t) + 4} textAnchor="end">{t < 0 ? `−${-t}` : t}</text>
            </g>
          ))}
      {labels && (
        <g className="axis-name">
          <text x={SIZE - PAD - 4} y={Y(0) - 7} textAnchor="end">x</text>
          <text x={X(0) + 8} y={PAD + 12}>y</text>
          <text x={X(0) - 6} y={Y(0) + 13} textAnchor="end">0</text>
        </g>
      )}
    </g>
  );
}

function LinePath({ k, b, range, className, clip }: { k: number; b: number; range: number; className: string; clip: string }) {
  const { X, Y } = makeScale(range);
  const x1 = -range - 2;
  const x2 = range + 2;
  return <line x1={X(x1)} y1={Y(k * x1 + b)} x2={X(x2)} y2={Y(k * x2 + b)} className={className} clipPath={`url(#${clip})`} />;
}

/** What the student should do, drawn on the graph so it can be understood without reading. */
export type PlaneTarget =
  | { kind: 'point'; x: number; y: number } // glowing ring the line must pass through
  | { kind: 'level' } // dashed guide: the line should lie flat at its current height
  | { kind: 'line'; k: number; b: number }; // dashed ghost line to cover

export interface PlanePoint {
  x: number;
  y: number;
  label?: string;
  tone?: 'k' | 'b' | 'ink' | 'accent' | 'good';
}

interface PlaneProps {
  k: number;
  b: number;
  lang: Lang;
  onChange?: (k: number, b: number) => void;
  range?: number;
  showLine?: boolean;
  ghost?: { k: number; b: number } | null;
  points?: PlanePoint[];
  delta?: { from: [number, number]; to: [number, number] } | null;
  slopeTriangle?: boolean;
  label: string;
  children?: ReactNode;
  target?: PlaneTarget | null;
  /** Which handle to drag: it pulses and gets a direction arrow. */
  pulse?: 'b' | 'k' | 'both' | null;
  /** Success burst at this point (change `id` to replay). */
  burst?: { x: number; y: number; id: number } | null;
}

/** Interactive coordinate plane for y = kx + b. Drag the b-point on the y-axis and the k-point at x = 2. */
export function CoordinatePlane({ k, b, lang, onChange, range = 6, showLine = true, ghost, points = [], delta, slopeTriangle, label, target, pulse, burst }: PlaneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<'b' | 'k' | null>(null);
  const { X, Y, invY } = makeScale(range);
  const clip = `clip-${useRef(Math.random().toString(36).slice(2)).current}`;
  const interactive = Boolean(onChange);

  const toY = (e: PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return invY(p.y);
  };

  const apply = (nk: number, nb: number) => {
    if (nk !== k || nb !== b) {
      telegram.haptic('select');
      onChange?.(nk, nb);
    }
  };

  const onMove = (e: PointerEvent) => {
    if (!drag || !onChange) return;
    const y = toY(e);
    if (drag === 'b') apply(k, clamp(Math.round(y), B_MIN, B_MAX));
    else apply(clamp(Math.round(((y - b) / HX) * 2) / 2, K_MIN, K_MAX), b);
  };

  const start = (which: 'b' | 'k') => (e: PointerEvent) => {
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    setDrag(which);
  };

  const onKey = (which: 'b' | 'k') => (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    if (which === 'b') apply(k, clamp(b + dir, B_MIN, B_MAX));
    else apply(clamp(k + dir * 0.5, K_MIN, K_MAX), b);
  };

  const p1y = b + HX * k;
  const p1Visible = Math.abs(p1y) <= range;
  const triTop = b + k;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={`plane ${interactive ? 'is-interactive' : ''} ${drag ? 'is-dragging' : ''}`}
      role="img"
      aria-label={label}
      onPointerMove={onMove}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
    >
      <Grid range={range} id={clip} />
      {ghost && <LinePath k={ghost.k} b={ghost.b} range={range} className="line-ghost" clip={clip} />}
      {target?.kind === 'line' && <LinePath k={target.k} b={target.b} range={range} className="line-target" clip={clip} />}
      {target?.kind === 'level' && <LinePath k={0} b={b} range={range} className="line-target" clip={clip} />}
      {target?.kind === 'point' && (
        <g className="target-ring" aria-hidden="true">
          <circle cx={X(target.x)} cy={Y(target.y)} r="16" className="ring ring-3" />
          <circle cx={X(target.x)} cy={Y(target.y)} r="11" className="ring ring-2" />
          <circle cx={X(target.x)} cy={Y(target.y)} r="5" className="ring-core" />
        </g>
      )}
      {interactive && pulse && (pulse === 'b' || pulse === 'both') && target?.kind === 'point' && Math.abs(target.y - b) >= 1 && (
        <DragArrow x={X(0) - 24} y1={Y(b)} y2={Y(target.y)} />
      )}
      {interactive && pulse === 'k' && target?.kind === 'level' && Math.abs(b + HX * k) <= range && Math.abs(k) > 0 && (
        <DragArrow x={X(HX) + 24} y1={Y(b + HX * k)} y2={Y(b)} />
      )}
      {showLine && <LinePath k={k} b={b} range={range} className="line-main" clip={clip} />}

      {slopeTriangle && showLine && k !== 0 && Math.abs(triTop) <= range && (
        <g className="slope-tri">
          <path d={`M${X(0)} ${Y(b)} L${X(1)} ${Y(b)} L${X(1)} ${Y(triTop)}`} />
          <text x={(X(0) + X(1)) / 2} y={Y(b) + (k > 0 ? 14 : -6)} textAnchor="middle" className="tri-run">1</text>
          <text x={X(1) + 6} y={(Y(b) + Y(triTop)) / 2 + 4} className="tri-rise">{num(k, lang)}</text>
        </g>
      )}

      {delta && (
        <g className="delta">
          <path d={`M${X(delta.from[0])} ${Y(delta.from[1])} L${X(delta.to[0])} ${Y(delta.from[1])} L${X(delta.to[0])} ${Y(delta.to[1])}`} />
          <text x={(X(delta.from[0]) + X(delta.to[0])) / 2} y={Y(delta.from[1]) + (delta.to[1] < delta.from[1] ? 15 : -7)} textAnchor="middle">
            Δx = {num(delta.to[0] - delta.from[0], lang)}
          </text>
          <text x={X(delta.to[0]) + 6} y={(Y(delta.from[1]) + Y(delta.to[1])) / 2 + 4}>Δy = {num(delta.to[1] - delta.from[1], lang)}</text>
        </g>
      )}

      {points.map((p, i) => (
        <g key={i} className={`pt pt-${p.tone ?? 'ink'}`}>
          <circle cx={X(p.x)} cy={Y(p.y)} r="5.5" />
          {p.label && (
            <text x={X(p.x) + (p.x >= range - 1 ? -8 : 8)} y={Y(p.y) - 8} textAnchor={p.x >= range - 1 ? 'end' : 'start'}>
              {p.label}
            </text>
          )}
        </g>
      ))}

      {interactive && (
        <>
          <g
            className={`handle handle-b ${drag === 'b' ? 'active' : ''} ${pulse === 'b' || pulse === 'both' ? 'is-cue' : ''}`}
            role="slider"
            tabIndex={0}
            aria-label="b"
            aria-valuemin={B_MIN}
            aria-valuemax={B_MAX}
            aria-valuenow={b}
            onPointerDown={start('b')}
            onKeyDown={onKey('b')}
          >
            <circle cx={X(0)} cy={Y(b)} r="20" className="hit" />
            <circle cx={X(0)} cy={Y(b)} r="9" className="knob" />
          </g>
          {p1Visible && (
            <g
              className={`handle handle-k ${drag === 'k' ? 'active' : ''} ${pulse === 'k' || pulse === 'both' ? 'is-cue' : ''}`}
              role="slider"
              tabIndex={0}
              aria-label="k"
              aria-valuemin={K_MIN}
              aria-valuemax={K_MAX}
              aria-valuenow={k}
              onPointerDown={start('k')}
              onKeyDown={onKey('k')}
            >
              <circle cx={X(HX)} cy={Y(p1y)} r="20" className="hit" />
              <circle cx={X(HX)} cy={Y(p1y)} r="9" className="knob" />
            </g>
          )}
        </>
      )}

      {burst && (
        <g key={burst.id} className="burst" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <circle key={i} className={`spark spark-${i % 3}`} cx={X(burst.x)} cy={Y(burst.y)} r="4" style={{ ['--dx' as string]: `${Math.cos(a) * 46}px`, ['--dy' as string]: `${Math.sin(a) * 46}px` }} />;
          })}
          <circle cx={X(burst.x)} cy={Y(burst.y)} r="19" className="burst-disc" />
          <path d={`M${X(burst.x) - 8} ${Y(burst.y)} l5.5 6 l11 -12`} className="burst-check" />
        </g>
      )}
    </svg>
  );
}

/** Animated arrow: "drag this handle from here to there". */
function DragArrow({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  const dir = y2 > y1 ? 1 : -1;
  const end = y2 - dir * 6;
  return (
    <g className="drag-arrow" aria-hidden="true">
      <line x1={x} y1={y1} x2={x} y2={end} />
      <path d={`M${x - 6} ${end - dir * 8} L${x} ${end} L${x + 6} ${end - dir * 8}`} />
    </g>
  );
}

/** Small static graph for picture answers and practice. */
export function MiniGraph({ k, b, size = 132 }: { k: number; b: number; size?: number }) {
  const clip = `mini-${useRef(Math.random().toString(36).slice(2)).current}`;
  const range = 4;
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={size} height={size} className="plane plane-mini" aria-hidden="true">
      <Grid range={range} labels={false} id={clip} />
      <LinePath k={k} b={b} range={range} className="line-main" clip={clip} />
    </svg>
  );
}

/** Two points with an optional Δx/Δy triangle (hint visual). */
export function TwoPointGraph({ a, b, showDelta, lang = 'en', line }: { a: [number, number]; b: [number, number]; showDelta?: boolean; lang?: Lang; line?: { k: number; b: number } }) {
  return (
    <CoordinatePlane
      k={line?.k ?? 0}
      b={line?.b ?? 0}
      lang={lang}
      showLine={Boolean(line)}
      points={[
        { x: a[0], y: a[1], tone: 'accent' },
        { x: b[0], y: b[1], tone: 'accent' },
      ]}
      delta={showDelta ? { from: a, to: b } : null}
      label=""
    />
  );
}
