import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GRADE, NODES, PREREQ, TARGET, diagnose, makeQuestion, missOf, parseAnswer, rng, type Answered, type GQ, type MissId, type NodeId } from '../../../shared/gapfinder.ts';
import type { Lang } from '../../../shared/types.ts';
import { useStore } from '../../lib/store.tsx';
import { track } from '../../lib/track.ts';
import { Ico } from '../icons.tsx';
import { GRADE_WORD, LESSON, MAP_LABEL, MISS, MISS_SHORT, SKILL, SOURCES, ut, type UiKey, type Visual } from './text.ts';

/** When a wrong answer matches no known mistake, the key rule of the missing skill is shown instead. */
const RULE: Record<NodeId, MissId> = { eq_br: 'dist_first', eq_both: 'move_sign', dist: 'dist_first', eq2: 'move_sign', like: 'like_sign', eq1: 'inv_op', int_add: 'sign_add', int_mul: 'sign_mul' };

type Phase = 'intro' | 'diag' | 'result' | 'lesson' | 'practice' | 'retest' | 'done';
type Status = 'pass' | 'fail' | 'open';

/* ---------- the skills map ---------- */
const POS: Record<NodeId, [number, number]> = {
  eq_br: [310, 44], eq_both: [175, 140], dist: [455, 140], eq2: [100, 236], like: [300, 236], eq1: [100, 332], int_add: [250, 416], int_mul: [470, 416],
};
function SkillMap({ status, roots, asking, lang }: { status: Record<NodeId, Status>; roots: NodeId[]; asking: NodeId | null; lang: Lang }) {
  const W = 156, H = 46;
  return (
    <svg viewBox="0 0 620 470" className="gf-map" role="img" aria-label={ut(lang, 'mapTitle')}>
      {NODES.flatMap((a) => PREREQ[a].map((b) => {
        const [x1, y1] = POS[a], [x2, y2] = POS[b];
        const lit = status[a] === 'fail' && status[b] === 'fail';
        return <path key={`${a}-${b}`} d={`M${x1} ${y1 + H / 2} C${x1} ${(y1 + y2) / 2 + 10}, ${x2} ${(y1 + y2) / 2 - 10}, ${x2} ${y2 - H / 2}`} className={`gf-edge ${lit ? 'lit' : ''}`} />;
      }))}
      {NODES.map((id) => {
        const [x, y] = POS[id], st = status[id], root = roots.includes(id), now = asking === id;
        const cls = root ? 'root' : st;
        return (
          <g key={id} transform={`translate(${x - W / 2} ${y - H / 2})`} className={`gf-node ${cls} ${now ? 'now' : ''}`}>
            <title>{SKILL[id][lang]}</title>
            {now && <rect x={-6} y={-6} width={W + 12} height={H + 12} rx={20} className="gf-ring" />}
            <rect width={W} height={H} rx={15} />
            <text x={W / 2} y={21} className="m">{MAP_LABEL[id]}</text>
            <text x={W / 2} y={37} className="g">{GRADE_WORD[lang].replace('{g}', String(GRADE[id]))}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- the pictures of the two-minute lessons ---------- */
function LessonPicture({ visual }: { visual: Visual }) {
  switch (visual) {
    case 'numline': {
      const x = (v: number) => 40 + (v + 10) * 34;
      return (
        <svg viewBox="0 0 600 170" className="gf-pic">
          <line x1="30" y1="110" x2="570" y2="110" className="ax" />
          {Array.from({ length: 16 }, (_, i) => i - 10).map((v) => <g key={v}><line x1={x(v)} y1="102" x2={x(v)} y2="118" className="ax" /><text x={x(v)} y="146" className={`t ${v === -7 || v === -4 ? 'hi' : ''}`}>{v < 0 ? `−${-v}` : v}</text></g>)}
          <path d={`M${x(-7)} 100 C${x(-7)} 40, ${x(-4)} 40, ${x(-4)} 96`} className="jump" />
          <path d={`M${x(-4) - 8} 86 L${x(-4)} 98 L${x(-4) + 8} 86`} className="jump" />
          <text x={(x(-7) + x(-4)) / 2} y="44" className="t hi">+3</text>
          <circle cx={x(-7)} cy="110" r="9" className="dot a" /><circle cx={x(-4)} cy="110" r="9" className="dot b" />
        </svg>
      );
    }
    case 'signs':
      return (
        <svg viewBox="0 0 600 220" className="gf-pic">
          {[['+', '+', '+'], ['+', '−', '−'], ['−', '+', '−'], ['−', '−', '+']].map(([a, b, c], i) => (
            <g key={i} transform={`translate(${60 + (i % 2) * 260} ${30 + Math.floor(i / 2) * 95})`}>
              <rect width="220" height="70" rx="16" className={`cell ${c === '+' ? 'plus' : 'minus'}`} />
              <text x="110" y="46" className="big">{`(${a}) · (${b}) = ${c}`}</text>
            </g>
          ))}
        </svg>
      );
    case 'area':
      return (
        <svg viewBox="0 0 600 230" className="gf-pic">
          <text x="60" y="130" className="t hi">3</text>
          <rect x="90" y="60" width="290" height="120" rx="10" className="r1" /><rect x="380" y="60" width="140" height="120" rx="10" className="r2" />
          <text x="235" y="40" className="t">x</text><text x="450" y="40" className="t">−4</text>
          <text x="235" y="132" className="big">3x</text><text x="450" y="132" className="big">−12</text>
          <text x="300" y="214" className="t hi">3(x − 4) = 3x − 12</text>
        </svg>
      );
    case 'tiles':
      return (
        <svg viewBox="0 0 600 200" className="gf-pic">
          {Array.from({ length: 7 }, (_, i) => <g key={i}><rect x={30 + i * 62} y="40" width="50" height="70" rx="10" className={`tile ${i >= 4 ? 'gone' : ''}`} /><text x={55 + i * 62} y="84" className="t">x</text>{i >= 4 && <path d={`M${36 + i * 62} 46 L${74 + i * 62} 104`} className="cross" />}</g>)}
          {[0, 1].map((i) => <g key={`n${i}`}><rect x={470 + i * 62} y="40" width="50" height="70" rx="10" className="tile new" /><text x={495 + i * 62} y="84" className="t">x</text></g>)}
          <text x="300" y="160" className="t hi">7x − 3x + 2x = 6x</text>
        </svg>
      );
    case 'balance':
      return (
        <svg viewBox="0 0 600 220" className="gf-pic">
          <path d="M300 70 L300 190 M250 190 H350" className="ax" />
          <path d="M120 70 H480" className="beam" />
          <path d="M120 70 L80 130 H160 Z M480 70 L440 130 H520 Z" className="pan" />
          <text x="120" y="162" className="big">x − 7</text><text x="480" y="162" className="big">−3</text>
          <text x="120" y="205" className="t hi">+7</text><text x="480" y="205" className="t hi">+7</text>
          <circle cx="300" cy="70" r="8" className="dot b" />
        </svg>
      );
  }
}

/* ---------- answering: a keypad with a minus key (phone keyboards often have none) ---------- */
function Answer({ q, lang, onSubmit, disabled }: { q: GQ; lang: Lang; onSubmit: (v: number) => void; disabled: boolean }) {
  const [raw, setRaw] = useState('');
  useEffect(() => setRaw(''), [q]);
  const value = parseAnswer(raw);
  const press = useCallback((k: string) => {
    if (disabled) return;
    if (k === '⌫') setRaw((s) => s.slice(0, -1));
    else if (k === '−') setRaw((s) => (s.startsWith('−') ? s.slice(1) : `−${s}`));
    else setRaw((s) => (s.replace('−', '').length < 4 ? s + k : s));
  }, [disabled]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea')) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === '-' || e.key === '−') press('−');
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Enter' && value !== null && !disabled) onSubmit(value);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [press, value, disabled, onSubmit]);
  const label: UiKey = q.ask === 'x' ? 'solveX' : q.ask === 'blank' ? 'fillBlank' : 'workOut';
  return (
    <div className="gf-answer">
      <p className="gf-ask">{ut(lang, label)}</p>
      <div className="gf-eq">{q.show}{q.ask === 'value' ? ' = ?' : ''}</div>
      <div className="gf-input" aria-live="polite">{q.ask === 'x' ? <span>x =</span> : null}<b>{raw || ' '}</b><i className="caret" /></div>
      <div className="gf-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '−', '0', '⌫'].map((k) => (
          <button key={k} type="button" disabled={disabled} onClick={() => press(k)} aria-label={k === '−' ? ut(lang, 'minus') : k === '⌫' ? ut(lang, 'erase') : k}>{k}</button>
        ))}
      </div>
      <button type="button" className="st-main-btn gf-check" disabled={disabled || value === null} onClick={() => value !== null && onSubmit(value)}>{ut(lang, 'check')}</button>
    </div>
  );
}

/* ---------- the page ---------- */
export function GapFinder() {
  const { lang } = useStore();
  const t = (k: UiKey, v?: Record<string, string | number>) => ut(lang, k, v);
  const rand = useRef(rng((Date.now() ^ (Math.random() * 1e9)) >>> 0)).current;
  const [phase, setPhase] = useState<Phase>('intro');
  const [history, setHistory] = useState<Answered[]>([]);
  const [q, setQ] = useState<GQ>(() => makeQuestion(TARGET, rand));
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null);
  const [first, setFirst] = useState<{ q: GQ; value: number; miss?: MissId } | null>(null);
  const [fix, setFix] = useState(0);
  const [card, setCard] = useState(0);
  const [pIdx, setPIdx] = useState(0);
  const [pOut, setPOut] = useState<{ value: number; ok: boolean } | null>(null);
  const [retest, setRetest] = useState<{ value: number; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const d = useMemo(() => diagnose(history), [history]);
  const roots = d.roots;
  const root = roots[fix] ?? null;
  const lastMiss = (node: NodeId) => [...history].reverse().find((h) => h.node === node && h.miss)?.miss;

  const restart = () => {
    setHistory([]); setQ(makeQuestion(TARGET, rand)); setFirst(null); setFix(0); setCard(0); setPIdx(0); setPOut(null); setRetest(null); setCopied(false); setFlash(null); setPhase('diag');
  };

  const answerDiag = (value: number) => {
    const correct = value === q.answer, miss = correct ? undefined : missOf(q, value);
    if (q.node === TARGET && !correct && !first) setFirst({ q, value, miss });
    const h = [...history, { node: q.node, correct, miss }];
    setFlash(correct ? 'right' : 'wrong');
    window.setTimeout(() => {
      setFlash(null);
      setHistory(h);
      const nd = diagnose(h);
      if (nd.next) setQ(makeQuestion(nd.next, rand));
      else { setPhase('result'); track({ kind: 'solved' }); }
    }, 850);
  };

  const startFix = () => { setCard(0); setPhase('lesson'); };
  const startPractice = () => { if (!root) return; setPIdx(0); setPOut(null); setQ(makeQuestion(root, rand)); setPhase('practice'); };
  const answerPractice = (value: number) => setPOut({ value, ok: value === q.answer });
  const nextPractice = () => {
    if (pIdx + 1 >= 3) { setRetest(null); setPhase('retest'); return; }
    setPIdx(pIdx + 1); setPOut(null); setQ(makeQuestion(root!, rand));
  };
  const answerRetest = (value: number) => { setRetest({ value, ok: value === first!.q.answer }); setPhase('done'); };

  const teacherLine = () => {
    if (!root) return '';
    const miss = first?.miss ?? lastMiss(root);
    return t('teacherLine', { skill: SKILL[root][lang], g: GRADE[root], miss: miss ? MISS_SHORT[miss][lang] : t('noMiss'), fixed: retest ? (retest.ok ? t('fixedYes') : t('fixedNo')) : t('fixedNotTried') });
  };
  const copy = async () => { try { await navigator.clipboard.writeText(teacherLine()); setCopied(true); } catch { setCopied(false); } };

  const asking = phase === 'diag' ? q.node : null;
  const map = <SkillMap status={d.status} roots={phase === 'diag' ? [] : roots} asking={asking} lang={lang} />;

  /* ----- intro ----- */
  if (phase === 'intro') {
    return (
      <div className="st-page gf">
        <section className="st-card gf-hero">
          <div>
            <span className="gf-chip">{t('kicker')}</span>
            <h2>{t('title')}</h2>
            <p className="st-lead">{t('lead')}</p>
            <ol className="gf-how">
              {(['how1', 'how2', 'how3', 'how4'] as UiKey[]).map((k, i) => <li key={k}><span>{i + 1}</span>{t(k)}</li>)}
            </ol>
            <button type="button" className="st-main-btn gf-start" onClick={restart}>{t('start')}<Ico name="arrow" size={18} /></button>
          </div>
          <div className="gf-hero-map">{map}</div>
        </section>
        <section className="st-card gf-evidence">
          <h3>{t('evidenceTitle')}</h3>
          <p>{t('evidence')}</p>
          <p className="gf-src"><b>{t('sources')}:</b> {SOURCES.map((s, i) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}{i < SOURCES.length - 1 ? '; ' : ''}</a>)}</p>
        </section>
      </div>
    );
  }

  /* ----- everything else: the stage on the left, the live map on the right ----- */
  let stage;
  if (phase === 'diag') {
    stage = (
      <>
        <div className="gf-top"><span className="gf-chip">{t('qn', { n: history.length + 1 })}</span><span className="gf-now">{t('checking', { skill: SKILL[q.node][lang] })}</span></div>
        <Answer q={q} lang={lang} onSubmit={answerDiag} disabled={flash !== null} />
        {flash && <div className={`gf-flash ${flash}`}>{flash === 'right' ? <Ico name="check" size={22} sw={2.8} /> : <Ico name="close" size={22} sw={2.6} />}{t(flash === 'right' ? 'right' : 'wrong')}</div>}
      </>
    );
  } else if (phase === 'result') {
    stage = root ? (
      <div className="gf-result">
        <span className="gf-chip root">{t('foundTitle')}</span>
        <h2>{t('foundGap', { skill: SKILL[root][lang] })}</h2>
        <p className="gf-sub">{t('fromGrade', { g: GRADE[root] })}</p>
        {first && (
          <div className="gf-why">
            <small>{first.miss ? t('whyAnswer', { v: first.value < 0 ? `−${-first.value}` : first.value }) : t('watchOut')}</small>
            <p className="gf-eq sm">{first.q.show}</p>
            <p>{MISS[first.miss ?? lastMiss(root) ?? RULE[root]][lang]}</p>
          </div>
        )}
        <button type="button" className="st-main-btn" onClick={startFix}>{t('fixNow')}<Ico name="arrow" size={18} /></button>
      </div>
    ) : (
      <div className="gf-result">
        <span className="gf-chip ok">{t('noGapTitle')}</span>
        <h2>{t('noGap')}</h2>
        <button type="button" className="ls-ghost" onClick={restart}>{t('again')}</button>
      </div>
    );
  } else if (phase === 'lesson' && root) {
    const L = LESSON[root];
    stage = (
      <div className="gf-lesson" key={card}>
        <span className="gf-chip">{t('lessonOf', { skill: SKILL[root][lang] })}</span>
        <LessonPicture visual={L.visual} />
        <p className="gf-text">{L.cards[card]![lang]}</p>
        <div className="gf-foot">
          <span className="gf-dots">{L.cards.map((_, i) => <i key={i} className={i === card ? 'on' : ''} />)}</span>
          {card + 1 < L.cards.length
            ? <button type="button" className="st-main-btn" onClick={() => setCard(card + 1)}>{t('next')}<Ico name="arrow" size={18} /></button>
            : <button type="button" className="st-main-btn" onClick={startPractice}>{t('practice')}<Ico name="arrow" size={18} /></button>}
        </div>
      </div>
    );
  } else if (phase === 'practice' && root) {
    stage = (
      <>
        <div className="gf-top"><span className="gf-chip">{t('practiceN', { n: pIdx + 1 })}</span><span className="gf-now">{SKILL[root][lang]}</span></div>
        <Answer q={q} lang={lang} onSubmit={answerPractice} disabled={pOut !== null} />
        {pOut && (
          <div className={`gf-out ${pOut.ok ? 'ok' : 'no'}`}>
            <b>{t(pOut.ok ? 'right' : 'wrong')}</b>
            {!pOut.ok && <p>{MISS[missOf(q, pOut.value) ?? RULE[root]][lang]}</p>}
            <div className="gf-steps"><small>{t('showSteps')}</small>{q.steps.map((s, i) => <code key={i}>{s}</code>)}</div>
            <button type="button" className="st-main-btn" onClick={nextPractice}>{t('next')}<Ico name="arrow" size={18} /></button>
          </div>
        )}
      </>
    );
  } else if (phase === 'retest' && first) {
    stage = (
      <>
        <div className="gf-top"><span className="gf-chip root">{t('retestTitle')}</span></div>
        <Answer q={first.q} lang={lang} onSubmit={answerRetest} disabled={false} />
      </>
    );
  } else if (phase === 'done' && first && root) {
    const more = roots.length > fix + 1;
    stage = (
      <div className="gf-result">
        <span className={`gf-chip ${retest?.ok ? 'ok' : 'root'}`}>{t(retest?.ok ? 'closedTitle' : 'notYetTitle')}</span>
        <h2>{retest?.ok ? t('closed', { skill: SKILL[root][lang] }) : t('notYet')}</h2>
        <div className="gf-steps"><small>{t('showSteps')}</small>{first.q.steps.map((s, i) => <code key={i}>{s}</code>)}</div>
        <div className="gf-foot">
          <button type="button" className="ls-ghost" onClick={restart}>{t('again')}</button>
          {more && <button type="button" className="st-main-btn" onClick={() => { setFix(fix + 1); setCard(0); setPhase('lesson'); }}>{t('nextGap')}<Ico name="arrow" size={18} /></button>}
        </div>
      </div>
    );
  }

  const showTeacher = root && (phase === 'result' || phase === 'done');
  return (
    <div className="st-page gf gf-run">
      <section className={`st-card gf-stage ${flash ? `f-${flash}` : ''}`}>{stage}</section>
      <aside className="gf-side">
        <section className="st-card gf-mapcard">
          <h3>{t('mapTitle')}</h3>
          <p className="gf-sub">{t('mapLead')}</p>
          {map}
          <div className="gf-legend"><span><i className="pass" />{t('lPass')}</span><span><i className="fail" />{t('lFail')}</span><span><i className="root" />{t('lRoot')}</span><span><i className="open" />{t('lOpen')}</span></div>
        </section>
        {showTeacher && (
          <section className="st-card gf-teacher">
            <h3><Ico name="teacher" size={18} /> {t('teacherTitle')}</h3>
            <p>{teacherLine()}</p>
            <button type="button" className="ls-ghost sm" onClick={copy}>{t(copied ? 'copied' : 'copy')}</button>
          </section>
        )}
      </aside>
    </div>
  );
}
