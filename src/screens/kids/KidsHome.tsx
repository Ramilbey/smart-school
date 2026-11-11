import { useEffect, useRef } from 'react';
import { g4Achievements, g4Meta, g4Stations, type StationId } from '../../../shared/lessons/g4Fractions.ts';
import { tx, type Text } from '../../../shared/types.ts';
import { RishtanPlate } from '../../components/Brand.tsx';
import { BadgeIcon, Icon, TopBar } from '../../components/Chrome.tsx';
import { useStore } from '../../lib/store.tsx';
import { telegram } from '../../lib/telegram.ts';
import { useKids } from './useKids.ts';

/** Each station of the fractions mission is a stall of the Registan bazaar; the last one is the gate itself. */
export const STALL_NAMES: Record<StationId, Text> = {
  equal: { uz: 'Non', ru: 'Лепёшка', en: 'Bread' },
  build: { uz: 'Anor', ru: 'Гранат', en: 'Pomegranate' },
  compare: { uz: 'Qovun', ru: 'Дыня', en: 'Melon' },
  homework: { uz: 'Choyxona', ru: 'Чайхана', en: 'Teahouse' },
  quiz: { uz: 'Registon', ru: 'Регистан', en: 'Registan' },
};

export function XpPill() {
  const { progress, t } = useStore();
  return (
    <span className="xp-pill" aria-label={`${progress.kids.xp} ${t('xp')}`}>
      {Icon.star}
      <b>{progress.kids.xp}</b>
    </span>
  );
}

/** Stall centres in the 390 × 796 scene (the same drawing as the approved design), and the hit box of each one. */
const SPOTS: Record<StationId, { x: number; y: number; box: [number, number, number, number] }> = {
  equal: { x: 88, y: 716, box: [24, 620, 128, 144] },
  build: { x: 302, y: 606, box: [238, 510, 128, 144] },
  compare: { x: 88, y: 496, box: [24, 400, 128, 144] },
  homework: { x: 302, y: 396, box: [238, 300, 128, 144] },
  quiz: { x: 195, y: 160, box: [135, 62, 120, 194] },
};
const W = 390;
const H = 796;
const ROAD = 'M195 800 C195 760 250 745 250 700 C250 650 140 640 140 590 C140 540 250 530 250 480 C250 430 140 430 140 380 C140 330 195 320 195 262';

function Stall({ x, y, name, children }: { x: number; y: number; name: string; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <use href="#bz-tb" />
      {children}
      <use href="#bz-aw" />
      <rect x="-32" y="16" width="64" height="22" rx="5" fill="#8a5a2b" stroke="#4a2f14" strokeWidth="2" />
      <text x="0" y="32" textAnchor="middle" fontFamily="Unbounded, Onest, sans-serif" fontWeight="800" fontSize={name.length > 9 ? 8 : name.length > 7 ? 9.5 : 12} fill="#fff4d9">{name}</text>
    </g>
  );
}

export function KidsHome() {
  const { t, lang, progress } = useStore();
  const { stations, nav } = useKids();
  const done = g4Stations.filter((s) => stations[s.id]).length;
  const upNext = g4Stations.find((s) => !stations[s.id])?.id;
  const allDone = done === g4Stations.length;
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    nextRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  const spot = upNext ? SPOTS[upNext] : SPOTS.quiz;
  const owlAt = upNext && upNext !== 'quiz' ? { x: spot.x < 195 ? spot.x + 64 : spot.x - 94, y: spot.y - 58 } : { x: 160, y: 250 };
  const name = (id: StationId) => tx(STALL_NAMES[id], lang);

  return (
    <main className="screen kids kids-home bazaar-screen">
      <TopBar title={t('gradeN', { n: 4 })} subtitle={tx(g4Meta.subject, lang)} right={<XpPill />} />
      <div className="scroll bazaar-scroll">
        <div className="bazaar">
          <div className="bazaar-hud" aria-hidden="true">
            <div className="bazaar-plate">
              <RishtanPlate parts={g4Stations.length} painted={done} size={58} />
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="bazaar-art" role="img" aria-label={`${tx(g4Meta.title, lang)}. ${t('missionProgress', { done, total: g4Stations.length })}`}>
            <defs>
              <linearGradient id="bz-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4fc3e6" /><stop offset="1" stopColor="#fdebb9" /></linearGradient>
              <pattern id="bz-pave" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#ebc891" /><path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#dcb277" strokeWidth="2" /></pattern>
              <pattern id="bz-tile" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#1d6fb8" /><path d="M8 2 L14 8 L8 14 L2 8 Z" fill="#fff4d9" /><circle cx="8" cy="8" r="2" fill="#ff6b5b" /></pattern>
              <g id="bz-tb">
                <rect x="-52" y="-78" width="6" height="78" fill="#8a5a2b" />
                <rect x="46" y="-78" width="6" height="78" fill="#8a5a2b" />
                <rect x="-58" y="0" width="116" height="12" rx="3" fill="#b27a42" stroke="#6b4220" strokeWidth="2.5" />
                <rect x="-56" y="12" width="112" height="30" fill="#1d44a3" stroke="#0c1f57" strokeWidth="2.5" />
                <path d="M-47 27 l8 -9 l8 9 l-8 9z M31 27 l8 -9 l8 9 l-8 9z" fill="#fff4d9" />
              </g>
              <g id="bz-aw">
                <path d="M-64 -78 L-50 -96 H50 L64 -78 Z" fill="#b8452f" stroke="#6b2a1c" strokeWidth="2" />
                <rect x="-60" y="-78" width="20" height="26" fill="#ff6b5b" /><rect x="-40" y="-78" width="20" height="26" fill="#fff4d9" /><rect x="-20" y="-78" width="20" height="26" fill="#1d6fb8" />
                <rect x="0" y="-78" width="20" height="26" fill="#fff4d9" /><rect x="20" y="-78" width="20" height="26" fill="#ffb547" /><rect x="40" y="-78" width="20" height="26" fill="#fff4d9" />
                <circle cx="-50" cy="-52" r="10" fill="#ff6b5b" /><circle cx="-30" cy="-52" r="10" fill="#fff4d9" /><circle cx="-10" cy="-52" r="10" fill="#1d6fb8" />
                <circle cx="10" cy="-52" r="10" fill="#fff4d9" /><circle cx="30" cy="-52" r="10" fill="#ffb547" /><circle cx="50" cy="-52" r="10" fill="#fff4d9" />
              </g>
            </defs>

            <rect width={W} height="260" fill="url(#bz-sky)" />
            <circle cx="332" cy="52" r="22" fill="#fff3b0" />
            <g fill="#ffffff" opacity=".85"><ellipse cx="70" cy="48" rx="36" ry="11" /><ellipse cx="96" cy="40" rx="22" ry="10" /><ellipse cx="250" cy="86" rx="30" ry="9" /></g>
            <rect y="250" width={W} height="546" fill="url(#bz-pave)" />

            {/* the Registan: two minarets, two domes, the great portal */}
            {[14, 354].map((x) => (
              <g key={x}>
                <rect x={x} y="76" width="22" height="176" fill="#d8a25c" stroke="#b07a3c" strokeWidth="2" />
                <rect x={x} y="104" width="22" height="10" fill="#1d6fb8" /><rect x={x} y="154" width="22" height="10" fill="#1d6fb8" /><rect x={x} y="204" width="22" height="10" fill="#1d6fb8" />
                <path d={`M${x - 2} 76 Q${x + 11} 44 ${x + 24} 76 Z`} fill="#19b6b0" stroke="#0e8a8a" strokeWidth="2" /><path d={`M${x + 11} 46 V30`} stroke="#ffb547" strokeWidth="3" />
              </g>
            ))}
            {[100, 290].map((x) => (
              <g key={x}>
                <rect x={x - 26} y="146" width="52" height="26" fill="#1d6fb8" />
                <path d={`M${x - 30} 146 A30 34 0 0 1 ${x + 30} 146 Z`} fill="#19b6b0" stroke="#0e8a8a" strokeWidth="2" />
                <path d={`M${x - 16} 146 Q${x - 14} 126 ${x} 114 M${x + 16} 146 Q${x + 14} 126 ${x} 114`} fill="none" stroke="#0e8a8a" strokeWidth="2" />
                <path d={`M${x} 112 V98`} stroke="#ffb547" strokeWidth="3" />
              </g>
            ))}
            <rect x="44" y="172" width="302" height="82" fill="#d8a25c" stroke="#b07a3c" strokeWidth="2" />
            <rect x="44" y="172" width="302" height="10" fill="#c98a44" />
            <g fill="#0c1f57">
              {[62, 92, 282, 312].map((x) => <path key={x} d={`M${x} 236 V214 Q${x} 198 ${x + 8} 192 Q${x + 16} 198 ${x + 16} 214 V236 Z`} />)}
            </g>
            <rect x="44" y="240" width="302" height="12" fill="#1d6fb8" />
            <path d="M50 246 H340" stroke="#fff4d9" strokeWidth="3" strokeDasharray="7 6" />
            <rect x="135" y="64" width="120" height="190" fill="#d8a25c" stroke="#b07a3c" strokeWidth="3" />
            <rect x="143" y="96" width="104" height="158" fill="url(#bz-tile)" />
            <rect x="135" y="64" width="120" height="30" fill="#12a3a0" stroke="#0e8a8a" strokeWidth="2" />
            <text x="195" y="85" textAnchor="middle" fontFamily="Unbounded, Onest, sans-serif" fontWeight="800" fontSize="13" fill="#fff4d9">{name('quiz')}</text>
            <path d="M163 254 V176 Q163 130 195 108 Q227 130 227 176 V254 Z" fill="#0c1f57" stroke="#fff4d9" strokeWidth="4" />
            <path d="M172 254 V178 Q172 140 195 124 Q218 140 218 178 V254 Z" fill="#1d44a3" />
            <path d="M180 254 V214 Q180 198 195 198 Q210 198 210 214 V254 Z" fill={allDone ? '#ffd77a' : '#ffb547'} stroke="#7a5a14" strokeWidth="2.5" />
            {allDone && <path d="M195 142 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#ffd77a" />}

            {/* the road */}
            <path d={ROAD} fill="none" stroke="#b98448" strokeWidth="66" strokeLinecap="round" strokeLinejoin="round" />
            <path d={ROAD} fill="none" stroke="#f6e1b2" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" />
            <path d={ROAD} fill="none" stroke="#e0bd82" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 14" />

            <Stall x={SPOTS.homework.x} y={SPOTS.homework.y} name={name('homework')}>
              <ellipse cx="-12" cy="-18" rx="18" ry="14" fill="#1d6fb8" stroke="#0c1f57" strokeWidth="3" />
              <ellipse cx="-12" cy="-32" rx="8" ry="4" fill="#fff4d9" stroke="#0c1f57" strokeWidth="2" />
              <path d="M6 -22 q14 -6 18 -16 l-4 -2 q-4 10 -14 14 z" fill="#1d6fb8" stroke="#0c1f57" strokeWidth="2" />
              <path d="M-30 -24 q-14 4 -4 16" fill="none" stroke="#0c1f57" strokeWidth="3" />
              <path d="M32 -12 H56 Q56 0 44 0 Q32 0 32 -12 Z" fill="#fff" stroke="#1d44a3" strokeWidth="3" />
            </Stall>
            <Stall x={SPOTS.compare.x} y={SPOTS.compare.y} name={name('compare')}>
              {[-34, 0, 38].map((dx) => (
                <g key={dx}>
                  <path d={`M${dx - 20} -2 A20 20 0 0 1 ${dx + 20} -2 Z`} fill="#f4c95d" />
                  <path d={`M${dx - 20} -2 A20 20 0 0 1 ${dx + 20} -2`} fill="none" stroke="#3a9a4a" strokeWidth="5" />
                </g>
              ))}
            </Stall>
            <Stall x={SPOTS.build.x} y={SPOTS.build.y} name={name('build')}>
              {[-32, -4, 26].map((dx, i) => (
                <g key={dx}>
                  <circle cx={dx} cy={-15 - (i === 1 ? 2 : 0)} r="15" fill="#d63a3a" stroke="#8c1f1f" strokeWidth="3" />
                  <path d={`M${dx - 5} ${-28 - (i === 1 ? 2 : 0)} l3 -7 l2 4 l3 -4 l2 7 z`} fill="#8c1f1f" />
                </g>
              ))}
            </Stall>
            <Stall x={SPOTS.equal.x} y={SPOTS.equal.y} name={name('equal')}>
              {[-26, 24].map((dx) => (
                <g key={dx}>
                  <ellipse cx={dx} cy="-19" rx="26" ry="20" fill="#e2a65f" stroke="#9b5a22" strokeWidth="3" />
                  <ellipse cx={dx} cy="-19" rx="12" ry="9" fill="#c98744" />
                  <g fill="#7a4414"><circle cx={dx - 4} cy="-21" r="1.7" /><circle cx={dx + 3} cy="-23" r="1.7" /><circle cx={dx + 4} cy="-16" r="1.7" /><circle cx={dx - 4} cy="-15" r="1.7" /></g>
                </g>
              ))}
            </Stall>

            {/* stamps on finished stalls, and the arrow over the next one */}
            {g4Stations.filter((s) => s.id !== 'quiz' && stations[s.id]).map((s) => (
              <g key={s.id}>
                <circle cx={SPOTS[s.id].x} cy={SPOTS[s.id].y - 106} r="17" fill="#ffb547" stroke="#0c1f57" strokeWidth="3" />
                <path d={`M${SPOTS[s.id].x - 8} ${SPOTS[s.id].y - 106} l6 7 l11 -13`} fill="none" stroke="#0c1f57" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}
            {upNext && upNext !== 'quiz' && (
              <g className="bz-next">
                <ellipse cx={SPOTS[upNext].x} cy={SPOTS[upNext].y + 44} rx="74" ry="14" fill="none" stroke="#ff6b5b" strokeWidth="4" strokeDasharray="8 7" />
                <path d={`M${SPOTS[upNext].x} ${SPOTS[upNext].y - 98} l-15 -17 h10 v-17 h10 v17 h10 z`} fill="#ff6b5b" stroke="#0c1f57" strokeWidth="3" strokeLinejoin="round" />
              </g>
            )}

            {/* Zukko waits beside the next stall */}
            <g transform={`translate(${owlAt.x} ${owlAt.y}) scale(.52)`}>
              <ellipse cx="60" cy="112" rx="30" ry="5" fill="rgba(60,40,10,.3)" />
              <path d="M26 62 C10 70 12 92 30 98 C30 84 32 72 26 62Z" fill="#3B4296" /><path d="M94 62 C110 70 108 92 90 98 C90 84 88 72 94 62Z" fill="#3B4296" />
              <path d="M60 18 C88 18 98 40 98 66 C98 92 82 106 60 106 C38 106 22 92 22 66 C22 40 32 18 60 18Z" fill="#4A54B8" />
              <path d="M60 52 C78 52 84 66 84 80 C84 96 74 102 60 102 C46 102 36 96 36 80 C36 66 42 52 60 52Z" fill="#FFE7B8" />
              <path d="M36 26 L30 10 L48 22Z M84 26 L90 10 L72 22Z" fill="#4A54B8" />
              <circle cx="44" cy="46" r="15" fill="#fff" /><circle cx="76" cy="46" r="15" fill="#fff" />
              <circle cx="49" cy="47" r="6.5" fill="#1E2140" /><circle cx="81" cy="47" r="6.5" fill="#1E2140" /><circle cx="51" cy="45" r="2" fill="#fff" /><circle cx="83" cy="45" r="2" fill="#fff" />
              <path d="M55 56 L65 56 L60 66Z" fill="#FFB547" />
            </g>
          </svg>

          {/* real buttons over each stall, so the map works with a thumb, a keyboard and a screen reader */}
          {g4Stations.map((s) => {
            const [bx, by, bw, bh] = SPOTS[s.id].box;
            const isDone = Boolean(stations[s.id]);
            return (
              <button
                key={s.id}
                ref={s.id === upNext ? nextRef : undefined}
                className={`bz-hit ${isDone ? 'done' : ''} ${s.id === upNext ? 'next' : ''}`}
                style={{ left: `${(bx / W) * 100}%`, top: `${(by / H) * 100}%`, width: `${(bw / W) * 100}%`, height: `${(bh / H) * 100}%` }}
                aria-label={`${name(s.id)}. ${tx(s.blurb, lang)}${isDone ? `. ${t('stationDone')}` : s.id === upNext ? `. ${t('upNext')}` : ''}`}
                onClick={() => {
                  telegram.haptic('light');
                  nav.push({ name: 'kids-station', station: s.id });
                }}
              />
            );
          })}

        </div>

        {allDone && (
          <button className="btn btn-kids btn-block" onClick={() => nav.push({ name: 'kids-complete' })}>
            {t('missionDoneCta')} {Icon.arrow}
          </button>
        )}

        <section className="shelf" aria-labelledby="badges-title">
          <h2 id="badges-title" className="shelf-title">{t('badges')}</h2>
          <div className="shelf-row">
            {g4Achievements.map((a) => {
              const earned = progress.kids.badges.includes(a.id);
              return (
                <div key={a.id} className={`shelf-item ${earned ? '' : 'locked'}`}>
                  <BadgeIcon id={a.id} color={a.color} size={56} locked={!earned} />
                  <span>{tx(a.title, lang)}</span>
                </div>
              );
            })}
          </div>
          <p className="fine-print">{t('hintsFree')}</p>
        </section>
      </div>
    </main>
  );
}
