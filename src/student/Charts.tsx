import type { Lang } from '../../shared/types.ts';
import { TOPICS } from '../screens/tutor/strings.ts';
import { topicKey, type Activity, type Day } from './activity.ts';
import { href } from './route.ts';
import type { StKey } from './strings.ts';

type T = (k: StKey, v?: Record<string, string | number>) => string;
type Week = { key: string; date: Date; day: Day }[];

const weekday = (d: Date, lang: Lang) => {
  try { return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(d); } catch { return String(d.getDate()); }
};

/** A smooth line through the points (Catmull-Rom turned into Béziers). */
function smooth(pts: [number, number][], lo: number, hi: number): string {
  if (pts.length < 2) return '';
  const cl = (y: number) => Math.max(lo, Math.min(hi, y));
  let d = `M${pts[0]![0]} ${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!, p1 = pts[i]!, p2 = pts[i + 1]!, p3 = pts[i + 2] ?? p2;
    const c1y = cl(p1[1] + (p2[1] - p0[1]) / 6), c2y = cl(p2[1] - (p3[1] - p1[1]) / 6);
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${c1y.toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${c2y.toFixed(1)} ${p2[0]} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const niceMax = (m: number) => (m <= 4 ? 4 : m <= 8 ? 8 : m <= 12 ? 12 : m <= 20 ? 20 : m <= 40 ? 40 : Math.ceil(m / 20) * 20);

const SERIES = [
  { k: 'lessons', color: '#2f7bff', label: 'legendLessons' },
  { k: 'questions', color: '#f2894e', label: 'legendQuestions' },
  { k: 'solved', color: '#2fb86b', label: 'legendSolved' },
] as const;

/** Lessons, questions and solved problems for the last seven days, three glowing lines that draw themselves in. */
export function ActivityChart({ week, lang, t }: { week: Week; lang: Lang; t: T }) {
  const X0 = 56, STEP = 51, Y0 = 188, H = 168;
  const max = niceMax(Math.max(1, ...week.flatMap((w) => SERIES.map((s) => w.day[s.k]))));
  const total = week.reduce((n, w) => n + w.day.lessons + w.day.questions + w.day.solved, 0);
  const pt = (i: number, v: number): [number, number] => [X0 + i * STEP, Y0 - (v / max) * H];
  const today = week.length - 1;
  const tip = SERIES.map((s) => ({ s, v: week[today]!.day[s.k] })).sort((a, b) => b.v - a.v)[0]!;
  const ticks = [max, Math.round(max / 2), 0];
  return (
    <>
      <svg className="st-chart" viewBox="0 0 420 220" role="img" aria-label={t('activityTitle')}>
        <g stroke="rgba(255,255,255,.07)"><path d={`M44 20H410M44 ${Y0 - H / 2}H410M44 ${Y0}H410`} /></g>
        <g className="st-axis" textAnchor="end">{ticks.map((v, i) => <text key={i} x="36" y={Y0 - (v / max) * H + 3}>{v}</text>)}</g>
        <g className="st-axis" textAnchor="middle">{week.map((w, i) => <text key={w.key} x={X0 + i * STEP} y="208">{weekday(w.date, lang)}</text>)}</g>
        {total === 0 ? (
          <>
            <path d={`M${X0} ${Y0 - 6}H${X0 + 6 * STEP}`} stroke="rgba(255,255,255,.25)" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
            <text x="209" y="92" textAnchor="middle" className="st-empty-t">{t('emptyActivity')}</text>
          </>
        ) : (
          <>
            {SERIES.map((s, n) => (
              <path key={s.k} className="st-line" pathLength={1} d={smooth(week.map((w, i) => pt(i, w.day[s.k])), 12, Y0)} stroke={s.color} style={{ animationDelay: `${0.15 + n * 0.2}s`, filter: `drop-shadow(0 0 6px ${s.color}b3)` }} />
            ))}
            {tip.v > 0 && (
              <g className="st-tip" style={{ color: tip.s.color }}>
                <path d={`M${X0 + today * STEP} 20V${Y0}`} stroke="currentColor" strokeOpacity=".45" />
                <circle className="st-ping" cx={X0 + today * STEP} cy={pt(today, tip.v)[1]} r="5" fill="currentColor" />
                <circle cx={X0 + today * STEP} cy={pt(today, tip.v)[1]} r="5" fill="currentColor" stroke="#fff" strokeWidth="1.5" />
              </g>
            )}
          </>
        )}
      </svg>
      <div className="st-leg">{SERIES.map((s) => <span key={s.k}><i style={{ background: s.color }} />{t(s.label)}</span>)}</div>
    </>
  );
}

/** Minutes in lessons and questions asked, day by day: two thin bars per day, each scaled to its own week's biggest day. */
export function TimeBars({ week, lang, t }: { week: Week; lang: Lang; t: T }) {
  const Y = 140, MAXH = 116;
  const mins = week.map((w) => Math.round(w.day.secs / 60));
  const qs = week.map((w) => w.day.questions);
  const mMax = Math.max(1, ...mins), qMax = Math.max(1, ...qs);
  const sumM = mins.reduce((a, b) => a + b, 0), sumQ = qs.reduce((a, b) => a + b, 0);
  return (
    <>
      <svg className="st-chart" viewBox="0 0 220 168" role="img" aria-label={t('timeTitle')}>
        <path d={`M4 ${Y}H216`} stroke="rgba(255,255,255,.14)" />
        {week.map((w, i) => {
          const x = 10 + i * 29;
          const hm = Math.max(mins[i]! > 0 ? 3 : 0, (mins[i]! / mMax) * MAXH), hq = Math.max(qs[i]! > 0 ? 3 : 0, (qs[i]! / qMax) * MAXH);
          return (
            <g key={w.key}>
              <rect className="st-bar" style={{ animationDelay: `${i * 0.08}s` }} x={x} y={Y - hm} width="9" height={hm} rx="2" fill="#2f7bff"><title>{mins[i]}</title></rect>
              <rect className="st-bar" style={{ animationDelay: `${i * 0.08 + 0.05}s` }} x={x + 11} y={Y - hq} width="9" height={hq} rx="2" fill="#b5702f"><title>{qs[i]}</title></rect>
              <text className="st-axis" x={x + 10} y="158" textAnchor="middle">{weekday(w.date, lang).slice(0, 2)}</text>
            </g>
          );
        })}
      </svg>
      <div className="st-ax">
        <div><span><i style={{ background: '#2f7bff' }} />{t('legendMinutes')}</span><em>{sumM}</em></div>
        <div><span><i style={{ background: '#b5702f' }} />{t('legendAsked')}</span><em>{sumQ}</em></div>
      </div>
    </>
  );
}

const SHORT: Record<Lang, string[]> = {
  en: ['Pythagoras', 'Quadratics', 'Fractions', 'Newton', 'Circles', 'Photosynthesis'],
  ru: ['Пифагор', 'Квадратные', 'Дроби', 'Ньютон', 'Круг', 'Фотосинтез'],
  uz: ['Pifagor', 'Kvadrat', 'Kasrlar', 'Nyuton', 'Doira', 'Fotosintez'],
};
// where each of TOPICS sits on the map, and its colour (maths purple, physics blue, biology green)
const SPOTS: { x: number; y: number; r: number; c: string }[] = [
  { x: 70, y: 56, r: 8, c: '#8b6cf6' },
  { x: 112, y: 104, r: 6.5, c: '#8b6cf6' },
  { x: 46, y: 116, r: 5.5, c: '#8b6cf6' },
  { x: 176, y: 52, r: 8, c: '#2f9bff' },
  { x: 96, y: 156, r: 5.5, c: '#8b6cf6' },
  { x: 258, y: 70, r: 8, c: '#2fb86b' },
];
const STARS: [number, number, number, string][] = [[212, 98, 5, '#2f9bff'], [160, 126, 4.5, '#2f9bff'], [284, 120, 4.5, '#2fb86b'], [236, 146, 5.5, '#2fb86b'], [152, 168, 5, '#f2a24e']];
const EDGES = 'M70 56L46 116M70 56L112 104M112 104L96 156M70 56L176 52M176 52L212 98M176 52L160 126M212 98L258 70M258 70L284 120M258 70L236 146M160 126L236 146M112 104L160 126M96 156L152 168M160 126L152 168';

/** A small sky of topics. The big stars are real lessons: tap one to start it; stars you have opened glow brighter. */
export function TopicMap({ activity, lang, aiOn, t }: { activity: Activity; lang: Lang; aiOn: boolean; t: T }) {
  return (
    <svg className="st-chart st-map" viewBox="0 0 320 200" role="group" aria-label={t('mapTitle')}>
      <path className="st-edge" d={EDGES} fill="none" stroke="rgba(160,180,255,.45)" strokeWidth="1.2" />
      {STARS.map(([x, y, r, c], i) => <circle key={i} className="st-node" style={{ ['--i' as string]: i + 6 }} cx={x} cy={y} r={r} fill={c} />)}
      {TOPICS.map((tp, i) => {
        const sp = SPOTS[i]!;
        const on = !tp.ai || aiOn;
        const opened = !!activity.topics[topicKey(tp.label.en, tp.id)];
        const dot = <circle className={`st-node ${opened ? 'on' : ''}`} style={{ ['--i' as string]: i }} cx={sp.x} cy={sp.y} r={sp.r} fill={on ? sp.c : '#59607a'} />;
        const label = <text className="st-axis" x={sp.x} y={sp.y + sp.r + 14} textAnchor="middle">{SHORT[lang][i]}</text>;
        return on ? (
          <a key={i} className="st-star" href={href('tutor', { q: tp.label[lang], ...(tp.id ? { s: tp.id } : {}) })} aria-label={tp.label[lang]}>
            <circle cx={sp.x} cy={sp.y} r={sp.r + 10} fill="transparent" />
            {dot}{label}
          </a>
        ) : <g key={i}>{dot}{label}</g>;
      })}
    </svg>
  );
}
