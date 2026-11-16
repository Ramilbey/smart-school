import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { Answer, ModelId, Question } from '../../../shared/arcade.ts';
import type { Lang } from '../../../shared/types.ts';
import { at, storyText, type ArKey } from './text.ts';

/** ask: waiting for an answer. hint: one wrong try, helpers are showing, the child can answer again. done: over, the solution shows. */
export type Mode = 'ask' | 'hint' | 'done';
interface BoardProps<Q> { q: Q; lang: Lang; mode: Mode; phase: number; onAnswer: (a: Answer) => void }
type Q<G extends Question['game']> = Extract<Question, { game: G }>;
const useT = (lang: Lang) => (k: ArKey, v?: Record<string, string | number>) => at(lang, k, v);

function Options({ values, onPick, disabled, right, label }: { values: number[]; onPick: (n: number) => void; disabled: boolean; right?: number; label?: (n: number) => string }) {
  return (
    <div className="ar-opts">
      {values.map((n) => (
        <button key={n} type="button" className={`ar-opt ${disabled && right === n ? 'is-right' : ''}`} disabled={disabled} onClick={() => onPick(n)}>{label ? label(n) : n}</button>
      ))}
    </div>
  );
}
function Stepper({ label, value, set, min, max, disabled }: { label: string; value: number; set: (n: number) => void; min: number; max: number; disabled: boolean }) {
  return (
    <div className="ar-step">
      <span>{label}</span>
      <div>
        <button type="button" aria-label={`${label} −`} disabled={disabled || value <= min} onClick={() => set(value - 1)}>−</button>
        <b aria-live="polite">{value}</b>
        <button type="button" aria-label={`${label} +`} disabled={disabled || value >= max} onClick={() => set(value + 1)}>+</button>
      </div>
    </div>
  );
}

/* ---------- 1. number line ---------- */
export function NumLineBoard({ q, lang, mode, onAnswer }: BoardProps<Q<'numline'>>) {
  const t = useT(lang);
  const [guess, setGuess] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const X0 = 50, X1 = 750, W = X1 - X0;
  const x = (v: number) => X0 + ((v - q.min) / (q.max - q.min)) * W;
  const unit = q.snap ? 1 : q.max >= 1000 ? 10 : 1;
  const place = (e: RPointerEvent) => {
    if (mode === 'done' || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const raw = q.min + ((((e.clientX - r.left) / r.width) * 800 - X0) / W) * (q.max - q.min);
    setGuess(Math.max(q.min, Math.min(q.max, Math.round(raw / unit) * unit)));
  };
  const nudge = (d: number) => setGuess((g) => Math.max(q.min, Math.min(q.max, (g ?? (q.min + q.max) / 2) + d * unit)));
  const ticks: number[] = [];
  for (let v = q.min; v <= q.max; v += q.step) ticks.push(v);
  const mid = (q.min + q.max) / 2;
  return (
    <div className="ar-board">
      <div className="ar-target"><small>{t('tapLine', { n: q.target })}</small><b>{q.target}</b></div>
      <svg ref={svg} className="ar-line" viewBox="0 0 800 150" role="slider" tabIndex={0} aria-valuemin={q.min} aria-valuemax={q.max} aria-valuenow={guess ?? undefined} aria-label={t('tapLine', { n: q.target })}
        onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); place(e); }} onPointerMove={(e) => { if (e.buttons) place(e); }}
        onKeyDown={(e) => { if (e.key === 'ArrowLeft') nudge(-1); else if (e.key === 'ArrowRight') nudge(1); else if (e.key === 'Enter' && guess !== null && mode !== 'done') onAnswer(guess); }}>
        {mode !== 'ask' && <rect x={q.target < mid ? X0 : x(mid)} y={52} width={W / 2} height={46} rx={10} className="ar-half" />}
        <line x1={X0} y1={75} x2={X1} y2={75} className="ar-axis" />
        {ticks.map((v) => <line key={v} x1={x(v)} y1={q.labels.includes(v) ? 58 : 66} x2={x(v)} y2={q.labels.includes(v) ? 92 : 84} className={q.labels.includes(v) ? 'ar-tick big' : 'ar-tick'} />)}
        {q.labels.map((v) => <text key={v} x={x(v)} y={122} className="ar-lab">{v}</text>)}
        {mode === 'done' && <g transform={`translate(${x(q.target)},75)`} className="ar-pin ok"><circle r={11} /><text y={-22}>{q.target}</text></g>}
        {guess !== null && <g transform={`translate(${x(guess)},75)`} className={`ar-pin ${mode === 'done' ? 'was' : ''}`}><path d="M0 0L-13 -26A15 15 0 1 1 13 -26Z" /></g>}
      </svg>
      <div className="ar-actions">
        <span className="ar-tip">{t('lineHint')}</span>
        <button type="button" className="st-main-btn" disabled={guess === null || mode === 'done'} onClick={() => guess !== null && onAnswer(guess)}>{t('check')}</button>
      </div>
    </div>
  );
}

/* ---------- 2. make ten ---------- */
function TenFrame({ filled, extra = 0, ghost = 0, onCell }: { filled: number; extra?: number; ghost?: number; onCell?: (i: number) => void }) {
  return (
    <div className="ar-frame">
      {Array.from({ length: 10 }, (_, i) => {
        const kind = i < filled ? 'a' : i < filled + extra ? 'b' : i < filled + extra + ghost ? 'g' : '';
        return <button key={i} type="button" className={`ar-cell ${kind}`} disabled={!onCell || kind === 'a'} onClick={() => onCell?.(i)} tabIndex={onCell && kind !== 'a' ? 0 : -1} aria-label={kind === 'b' ? '−' : '+'}><i /></button>;
      })}
    </div>
  );
}
export function MakeTenBoard({ q, lang, mode, onAnswer }: BoardProps<Q<'maketen'>>) {
  const t = useT(lang);
  const [added, setAdded] = useState(0);
  const done = mode === 'done', help = mode !== 'ask';
  if (q.kind === 'fill') {
    const frames = q.total / 10, need = q.total - q.a;
    const cell = (frame: number) => (i: number) => {
      if (done) return;
      const idx = frame * 10 + i;
      setAdded((n) => (idx < q.a + n ? Math.max(0, n - 1) : Math.min(need, n + 1)));
    };
    return (
      <div className="ar-board">
        <p className="ar-prompt">{t('fillFrame', { a: q.a, total: q.total })}</p>
        <div className="ar-frames">
          {Array.from({ length: frames }, (_, f) => {
            const base = f * 10, filled = Math.max(0, Math.min(10, q.a - base)), extra = Math.max(0, Math.min(10 - filled, q.a + added - base - filled));
            return <TenFrame key={f} filled={filled} extra={done ? Math.max(0, Math.min(10 - filled, q.total - base - filled)) : extra} onCell={done ? undefined : cell(f)} />;
          })}
        </div>
        <div className="ar-eq">{q.a} + <b className="ar-blank">{done ? q.answer : added}</b> = {done ? q.total : q.a + added}</div>
        <div className="ar-actions">
          <span className="ar-tip">{t('added', { n: done ? q.answer : added })}</span>
          <button type="button" className="st-main-btn" disabled={done} onClick={() => onAnswer(added)}>{t('check')}</button>
        </div>
      </div>
    );
  }
  if (q.kind === 'missing') {
    return (
      <div className="ar-board">
        <p className="ar-prompt">{t('missingTen')}</p>
        <div className="ar-eq big">{q.a} + <b className="ar-blank">{done ? q.answer : '?'}</b> = {q.total}</div>
        {help && <div className="ar-frames"><TenFrame filled={q.a} ghost={done ? 0 : q.answer} extra={done ? q.answer : 0} /></div>}
        <Options values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} onPick={onAnswer} disabled={done} right={q.answer} />
      </div>
    );
  }
  const k = 10 - q.a, rest = q.b - k;
  return (
    <div className="ar-board">
      <p className="ar-prompt">{t('bridge')}</p>
      <div className="ar-eq big">{q.a} + {q.b} = <b className="ar-blank">{done ? q.answer : '?'}</b></div>
      {help && <div className="ar-frames"><TenFrame filled={q.a} extra={k} /><TenFrame filled={0} extra={rest} /></div>}
      {help && <div className="ar-eq small">{q.a} + {k} = 10 &nbsp;·&nbsp; 10 + {rest} = {done ? q.total : '?'}</div>}
      <Options values={[10, 11, 12, 13, 14, 15, 16, 17, 18]} onPick={onAnswer} disabled={done} right={q.answer} />
    </div>
  );
}

/* ---------- 3. place value ---------- */
function Blocks({ h = 0, t, o, trade = false }: { h?: number; t: number; o: number; trade?: boolean }) {
  return (
    <div className="ar-blocks" aria-hidden="true">
      {h > 0 && <div className="grp">{Array.from({ length: h }, (_, i) => <i key={i} className="bh" />)}</div>}
      {t > 0 && <div className="grp">{Array.from({ length: t }, (_, i) => <i key={i} className="bt" />)}</div>}
      {o > 0 && <div className="grp ones">{Array.from({ length: o }, (_, i) => <i key={i} className={`bo ${trade && i < 10 ? 'tr' : ''}`} />)}</div>}
      {h + t + o === 0 && <span className="ar-tip">0</span>}
    </div>
  );
}
export function PlaceBoard({ q, lang, mode, onAnswer }: BoardProps<Q<'place'>>) {
  const t = useT(lang);
  const [n, setN] = useState({ h: 0, t: 0, o: 0 });
  const done = mode === 'done';
  if (q.kind === 'read') {
    return (
      <div className="ar-board">
        <p className="ar-prompt">{t('readBlocks')}</p>
        <Blocks t={q.tens} o={q.ones} trade={mode !== 'ask'} />
        <div className="ar-eq small">{t('tens')}: {q.tens} &nbsp;·&nbsp; {t('ones')}: {q.ones}</div>
        <Options values={q.options} onPick={onAnswer} disabled={done} right={q.target} />
      </div>
    );
  }
  const T = Math.floor((q.target % 100) / 10), O = q.target % 10, H = Math.floor(q.target / 100);
  const show = done ? { h: H, t: T, o: O } : n;
  return (
    <div className="ar-board">
      <div className="ar-target"><small>{t('buildNumber', { n: q.target })}</small><b>{q.target}</b></div>
      <Blocks h={show.h} t={show.t} o={show.o} />
      <div className="ar-steps">
        {q.places === 3 && <Stepper label={t('hundreds')} value={show.h} set={(v) => setN({ ...n, h: v })} min={0} max={9} disabled={done} />}
        <Stepper label={t('tens')} value={show.t} set={(v) => setN({ ...n, t: v })} min={0} max={9} disabled={done} />
        <Stepper label={t('ones')} value={show.o} set={(v) => setN({ ...n, o: v })} min={0} max={9} disabled={done} />
      </div>
      <div className="ar-actions">
        <span className="ar-tip">{mode === 'hint' ? `${n.h * 100 + n.t * 10 + n.o}` : ''}</span>
        <button type="button" className="st-main-btn" disabled={done} onClick={() => onAnswer(n)}>{t('check')}</button>
      </div>
    </div>
  );
}

/* ---------- 4. arrays ---------- */
function Dots({ rows, cols, mark = false }: { rows: number; cols: number; mark?: boolean }) {
  return (
    <div className={`ar-dots ${mark ? 'mark' : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: `${cols * 46}px` }} aria-hidden="true">
      {Array.from({ length: rows * cols }, (_, i) => <i key={i} style={{ animationDelay: `${Math.floor(i / cols) * 90}ms` }} />)}
    </div>
  );
}
export function ArraysBoard({ q, lang, mode, onAnswer }: BoardProps<Q<'arrays'>>) {
  const t = useT(lang);
  const [v, setV] = useState({ rows: 1, cols: 1 });
  const done = mode === 'done', help = mode !== 'ask';
  if (q.kind === 'build') {
    const show = done ? { rows: q.rows, cols: q.cols } : v;
    return (
      <div className="ar-board">
        <p className="ar-prompt">{t('buildArray', { r: q.rows, c: q.cols })}</p>
        <Dots rows={show.rows} cols={show.cols} mark={help} />
        <div className="ar-steps">
          <Stepper label={t('rows')} value={show.rows} set={(n) => setV({ ...v, rows: n })} min={1} max={9} disabled={done} />
          <Stepper label={t('cols')} value={show.cols} set={(n) => setV({ ...v, cols: n })} min={1} max={9} disabled={done} />
        </div>
        <div className="ar-actions">
          <span className="ar-tip">{done ? `${q.rows} × ${q.cols} = ${q.answer}` : ''}</span>
          <button type="button" className="st-main-btn" disabled={done} onClick={() => onAnswer(v)}>{t('check')}</button>
        </div>
      </div>
    );
  }
  const p = q.rows * q.cols;
  return (
    <div className="ar-board">
      <p className="ar-prompt">{q.kind === 'count' ? t('countDots') : q.kind === 'fact' ? t('fact') : t('missingFactor')}</p>
      {q.kind !== 'count' && (
        <div className="ar-eq big">
          {q.kind === 'fact' ? <>{q.rows} × {q.cols} = <b className="ar-blank">{done ? p : '?'}</b></> : <><b className="ar-blank">{done ? q.rows : '?'}</b> × {q.cols} = {p}</>}
        </div>
      )}
      {(q.kind === 'count' || help) && <Dots rows={q.rows} cols={q.cols} mark={help} />}
      <Options values={q.options} onPick={onAnswer} disabled={done} right={q.answer} />
    </div>
  );
}

/* ---------- 5. fractions ---------- */
function FracCard({ f, bar, state, onPick, disabled }: { f: [number, number]; bar: boolean; state: '' | 'right' | 'dim'; onPick: () => void; disabled: boolean }) {
  return (
    <button type="button" className={`ar-frac ${state}`} onClick={onPick} disabled={disabled}>
      <span className="num"><b>{f[0]}</b><i /><b>{f[1]}</b></span>
      {bar && <span className="bar" style={{ gridTemplateColumns: `repeat(${f[1]}, 1fr)` }}>{Array.from({ length: f[1] }, (_, i) => <i key={i} className={i < f[0] ? 'on' : ''} />)}</span>}
    </button>
  );
}
export function FractionsBoard({ q, lang, mode, onAnswer }: BoardProps<Q<'fractions'>>) {
  const t = useT(lang);
  const done = mode === 'done', bars = q.showBars || mode !== 'ask';
  const st = (side: 'a' | 'b') => (done ? (q.answer === side || q.answer === 'eq' ? 'right' : 'dim') : '');
  return (
    <div className="ar-board">
      <p className="ar-prompt">{t('bigger')}</p>
      <div className="ar-fracs">
        <FracCard f={q.a} bar={bars} state={st('a')} onPick={() => onAnswer('a')} disabled={done} />
        <span className="ar-vs">{done ? (q.answer === 'eq' ? '=' : q.answer === 'a' ? '>' : '<') : '?'}</span>
        <FracCard f={q.b} bar={bars} state={st('b')} onPick={() => onAnswer('b')} disabled={done} />
      </div>
      {q.withEqual && <button type="button" className={`ar-opt wide ${done && q.answer === 'eq' ? 'is-right' : ''}`} disabled={done} onClick={() => onAnswer('eq')}>{t('equal')}</button>}
    </div>
  );
}

/* ---------- 6. story pictures ---------- */
type Cell = number | '?';
function shape(q: Q<'stories'>, model: ModelId): { whole: Cell; parts: Cell[]; kind: ModelId } {
  const { a, b } = q, hi = Math.max(a, b), lo = Math.min(a, b);
  const own = model === q.model;
  switch (model) {
    case 'sum': return { kind: model, whole: '?', parts: [a, b] };
    case 'part': return own ? (q.kind === 'separate' ? { kind: model, whole: a, parts: [b, '?'] } : { kind: model, whole: b, parts: [a, '?'] }) : { kind: model, whole: hi, parts: [lo, '?'] };
    case 'diff': return { kind: model, whole: hi, parts: [lo, '?'] };
    case 'groups': return own ? { kind: model, whole: '?', parts: Array.from({ length: a }, () => b) } : { kind: model, whole: '?', parts: Array.from({ length: Math.min(lo, 6) }, () => hi) };
    case 'share': return own ? { kind: model, whole: a, parts: Array.from({ length: b }, () => '?' as Cell) } : { kind: model, whole: hi, parts: Array.from({ length: Math.min(lo, 6) }, () => '?' as Cell) };
  }
}
function ModelPic({ q, model, solved }: { q: Q<'stories'>; model: ModelId; solved?: boolean }) {
  const s = shape(q, model);
  const val = (c: Cell) => (c === '?' ? (solved ? q.answer : '?') : c);
  const W = 240, x0 = 12, w = W - 24;
  if (s.kind === 'diff') {
    const long = s.whole as number, short = s.parts[0] as number, sw = Math.max(0.3, Math.min(0.8, short / long)) * w;
    return (
      <svg viewBox="0 0 240 118" className="ar-model" aria-hidden="true">
        <rect x={x0} y={14} width={w} height={36} rx={8} className="m-a" /><text x={x0 + w / 2} y={38}>{long}</text>
        <rect x={x0} y={66} width={sw} height={36} rx={8} className="m-b" /><text x={x0 + sw / 2} y={90}>{short}</text>
        <rect x={x0 + sw + 4} y={66} width={w - sw - 4} height={36} rx={8} className="m-q" /><text x={x0 + sw + 4 + (w - sw - 4) / 2} y={90} className="q">{val('?')}</text>
      </svg>
    );
  }
  const n = s.parts.length, equal = s.kind === 'groups' || s.kind === 'share';
  const total = equal ? n : (s.parts as number[]).reduce((sum: number, p) => sum + (typeof p === 'number' ? p : 0), 0) || 1;
  let x = x0;
  const boxes = s.parts.map((p, i) => {
    let bw: number;
    if (equal) bw = w / n;
    else if (p === '?') bw = w - (x - x0);
    else if (s.parts.includes('?')) bw = Math.max(0.28, Math.min(0.72, (p as number) / (s.whole as number))) * w;
    else bw = Math.max(0.28, Math.min(0.72, (p as number) / total)) * w;
    if (!equal && i === n - 1) bw = w - (x - x0);
    const box = { x, bw, p };
    x += bw;
    return box;
  });
  return (
    <svg viewBox="0 0 240 118" className="ar-model" aria-hidden="true">
      <rect x={x0} y={12} width={w} height={34} rx={8} className={s.whole === '?' ? 'm-q' : 'm-a'} /><text x={W / 2} y={35} className={s.whole === '?' ? 'q' : ''}>{val(s.whole)}</text>
      {boxes.map((b, i) => (
        <g key={i}>
          <rect x={b.x + 2} y={62} width={b.bw - 4} height={40} rx={8} className={b.p === '?' ? 'm-q' : i % 2 ? 'm-c' : 'm-b'} />
          <text x={b.x + b.bw / 2} y={88} className={b.p === '?' ? 'q' : ''} style={n > 5 ? { fontSize: 15 } : undefined}>{val(b.p)}</text>
        </g>
      ))}
    </svg>
  );
}
export function StoriesBoard({ q, lang, mode, phase, onAnswer }: BoardProps<Q<'stories'>>) {
  const t = useT(lang);
  const done = mode === 'done';
  const [picked, setPicked] = useState<ModelId | null>(null);
  useEffect(() => { setPicked(null); }, [q]);
  return (
    <div className="ar-board">
      <p className="ar-story">{storyText(lang, q)}</p>
      {phase === 0 && !done ? (
        <>
          <p className="ar-prompt">{t('pickModel')}</p>
          <div className="ar-models">
            {q.models.map((m) => (
              <button key={m} type="button" className={`ar-modelbtn ${picked === m && mode === 'hint' ? 'is-wrong' : ''}`} onClick={() => { setPicked(m); onAnswer({ model: m }); }}><ModelPic q={q} model={m} /></button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="ar-prompt">{t('solveIt')}</p>
          <div className="ar-models one"><div className="ar-modelbtn is-right"><ModelPic q={q} model={q.model} solved={done} /></div></div>
          <Options values={q.options} onPick={onAnswer} disabled={done} right={q.answer} />
        </>
      )}
    </div>
  );
}

/** Small pictures for the game cards on the hub. */
export function GameArt({ game }: { game: Question['game'] }) {
  switch (game) {
    case 'numline': return (
      <svg viewBox="0 0 120 70" className="ar-art"><line x1="10" y1="42" x2="110" y2="42" className="l" />{[10, 35, 60, 85, 110].map((x) => <line key={x} x1={x} y1="36" x2={x} y2="48" className="l" />)}<path d="M72 42L63 22a10 10 0 1 1 18 0z" className="f" /></svg>
    );
    case 'maketen': return (
      <svg viewBox="0 0 120 70" className="ar-art">{Array.from({ length: 10 }, (_, i) => <g key={i}><rect x={12 + (i % 5) * 20} y={14 + Math.floor(i / 5) * 22} width="17" height="19" rx="4" className="b" />{i < 7 && <circle cx={20.5 + (i % 5) * 20} cy={23.5 + Math.floor(i / 5) * 22} r="5.5" className="f" />}</g>)}</svg>
    );
    case 'place': return (
      <svg viewBox="0 0 120 70" className="ar-art"><rect x="12" y="14" width="40" height="40" rx="5" className="f" />{[62, 72, 82].map((x) => <rect key={x} x={x} y="14" width="7" height="40" rx="3" className="g" />)}{[0, 1, 2, 3].map((i) => <rect key={i} x={96 + (i % 2) * 10} y={34 + Math.floor(i / 2) * 10} width="8" height="8" rx="2" className="h" />)}</svg>
    );
    case 'arrays': return (
      <svg viewBox="0 0 120 70" className="ar-art">{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={30 + (i % 4) * 20} cy={17 + Math.floor(i / 4) * 18} r="6.5" className={Math.floor(i / 4) === 0 ? 'f' : 'g'} />)}</svg>
    );
    case 'fractions': return (
      <svg viewBox="0 0 120 70" className="ar-art">{[0, 1, 2].map((i) => <rect key={i} x={12 + i * 32.6} y="14" width="30" height="16" rx="4" className={i < 1 ? 'f' : 'b'} />)}{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={12 + i * 19.6} y="40" width="17.5" height="16" rx="4" className={i < 1 ? 'g' : 'b'} />)}</svg>
    );
    case 'stories': return (
      <svg viewBox="0 0 120 70" className="ar-art"><rect x="12" y="12" width="96" height="18" rx="5" className="b" /><text x="60" y="26" className="t">?</text><rect x="12" y="38" width="56" height="20" rx="5" className="f" /><rect x="72" y="38" width="36" height="20" rx="5" className="g" /></svg>
    );
  }
}
