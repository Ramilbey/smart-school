import { useEffect, useState, type ReactNode } from 'react';
import { lineEq, num, pt } from '../../../shared/format.ts';
import {
  g7Explore,
  g7Meta,
  g7Problem,
  g7Quiz,
  g7Sections,
  g7Steps,
  type SectionId,
} from '../../../shared/lessons/g7Linear.ts';
import { tx, type Text } from '../../../shared/types.ts';
import { Icon, TopBar } from '../../components/Chrome.tsx';
import { B_MAX, B_MIN, CoordinatePlane, K_MAX, K_MIN, type PlanePoint, type PlaneTarget } from '../../components/Graph.tsx';
import { QuizRunner } from '../../components/QuizRunner.tsx';
import { AcadTutor } from '../../components/TutorPanel.tsx';
import { fill } from '../../lib/i18n.ts';
import { useNav } from '../../lib/nav.tsx';
import { liveStreak, useStore } from '../../lib/store.tsx';
import { telegram } from '../../lib/telegram.ts';

const MINUS = '−';

/** The word on each index tab of the notebook, short enough to read sideways. */
const TAB_NAMES: Record<SectionId, Text> = {
  overview: { uz: 'Mavzu', ru: 'Тема', en: 'Topic' },
  explore: { uz: 'Tadqiq', ru: 'Опыт', en: 'Explore' },
  steps: { uz: 'Misol', ru: 'Пример', en: 'Example' },
  problem: { uz: 'Masala', ru: 'Задача', en: 'Problem' },
  check: { uz: 'Test', ru: 'Тест', en: 'Check' },
};

function useSections() {
  const { update, progress } = useStore();
  const nav = useNav();
  const markDone = (id: SectionId) => update((p) => void (p.acad.sections[id] = true));
  const goTo = (id: SectionId) => nav.replace({ name: 'acad-section', section: id });
  const nextOf = (id: SectionId): SectionId | null => {
    const i = g7Sections.findIndex((s) => s.id === id);
    return g7Sections[i + 1]?.id ?? null;
  };
  return { progress, markDone, goTo, nextOf, nav };
}

function NextSectionButton({ from, disabled }: { from: SectionId; disabled?: boolean }) {
  const { t } = useStore();
  const { goTo, nextOf } = useSections();
  const next = nextOf(from);
  if (!next) return null;
  return (
    <div className="dock">
      <button className="btn btn-acad btn-block" disabled={disabled} onClick={() => goTo(next)}>
        {t('nextSection')} {Icon.arrow}
      </button>
    </div>
  );
}

/* ---------- motivation: XP and streak in the top bar ---------- */

export function AcadStats() {
  const { progress, t } = useStore();
  const xp = (progress.acad.xp ?? 0) + (progress.bot?.xp ?? 0);
  const streak = liveStreak(progress.acad.streak);
  return (
    <span className="acad-stats" aria-label={`${t('xpTotal', { n: xp })} · ${t('streakDays', { n: streak })}`}>
      <span className={`acad-stat streak ${streak ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 3.5 5 5.5 5 10.5A5 5 0 0 1 7 12.6c0-2 1-3.4 2.2-4.4.2 1.6 1 2.6 2.1 3C11 8.4 10.8 5 12 2Z" /></svg>
        {streak}
      </span>
      <span className="acad-stat xp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20.1l1.4-6.4L2.7 9.3l6.5-.7Z" /></svg>
        {xp}
      </span>
    </span>
  );
}

type Goal = { k?: number; b?: number };
const goalTarget = (g: Goal): PlaneTarget =>
  g.k !== undefined && g.b !== undefined ? { kind: 'line', k: g.k, b: g.b } : g.b !== undefined ? { kind: 'point', x: 0, y: g.b } : { kind: 'level' };
const goalPulse = (g: Goal) => (g.k !== undefined && g.b !== undefined ? 'both' : g.b !== undefined ? 'b' : 'k') as 'both' | 'b' | 'k';

/** Tiny picture of the task, so the goal is clear at a glance. */
function GoalPicture({ target }: { target: PlaneTarget }) {
  return (
    <svg viewBox="0 0 48 48" className="goal-pic" aria-hidden="true">
      <path d="M24 5v38M5 24h38" className="gp-axis" />
      {target.kind === 'level' && (
        <>
          <path d="M9 37 39 11" className="gp-old" />
          <path d="M7 24h34" className="gp-goal" />
          <path d="M33 13c4 3 5 6 5 9" className="gp-turn" />
        </>
      )}
      {target.kind === 'point' && (
        <>
          <path d="M8 22 40 14" className="gp-old" />
          <circle cx="24" cy="33" r="6" className="gp-ring" />
          <circle cx="24" cy="33" r="2.4" className="gp-dot" />
          <path d="M18 19v9m-3-3 3 3 3-3" className="gp-turn" />
        </>
      )}
      {target.kind === 'line' && (
        <>
          <path d="M14 42 34 6" className="gp-goal" />
          <path d="M8 36 40 20" className="gp-old" />
        </>
      )}
    </svg>
  );
}

/* ---------- Overview ---------- */

function Overview() {
  const { t, lang } = useStore();
  const { markDone, goTo } = useSections();
  return (
    <>
      <section className="panel">
        <h2 className="panel-title">{t('objective')}</h2>
        <p className="body-text">{tx(g7Meta.objective, lang)}</p>
      </section>
      <section className="panel">
        <h2 className="panel-title">{t('prerequisites')}</h2>
        <ul className="check-list">
          {g7Meta.prerequisites.map((p, i) => (
            <li key={i}>{tx(p, lang)}</li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2 className="panel-title">{t('inThisTopic')}</h2>
        <ol className="plain-steps">
          {g7Sections.slice(1).map((s) => (
            <li key={s.id}>
              <span>
                <b>{tx(s.title, lang)}</b> — {tx(s.blurb, lang)}
              </span>
            </li>
          ))}
        </ol>
        <p className="panel-sub">
          {t('minutes', { n: g7Meta.minutes })} · {t('contentDraft')}
        </p>
      </section>
      <div className="dock">
        <button
          className="btn btn-acad btn-block"
          onClick={() => {
            markDone('overview');
            goTo('explore');
          }}
        >
          {t('startTopic')} {Icon.arrow}
        </button>
      </div>
    </>
  );
}

/* ---------- Explore: interactive graph ---------- */

function LiveEquation({ k, b }: { k: number; b: number }) {
  const { lang } = useStore();
  return (
    <div className="live-eq" aria-live="polite">
      <span className="formula formula-xl">
        <i>y</i> = <b className="k">{num(k, lang)}</b>
        <i>x</i> {b < 0 ? MINUS : '+'} <b className="b">{num(Math.abs(b), lang)}</b>
      </span>
      <span className="sr-only">{lineEq(k, b, lang)}</span>
    </div>
  );
}

function Explore() {
  const { t, lang, progress, update, acadReward } = useStore();
  const { markDone } = useSections();
  const [k, setK] = useState(1);
  const [b, setB] = useState(1);
  const done = progress.acad.challenges;
  const active = g7Explore.challenges.find((c) => !done[c.id]);
  const allDone = !active;

  useEffect(() => {
    if (!active) return;
    const g = active.goal;
    if ((g.k === undefined || g.k === k) && (g.b === undefined || g.b === b)) {
      telegram.haptic('success');
      const gotXp = acadReward(`explore:${active.id}`, 10);
      setWin({ id: active.id, at: { x: g.b !== undefined && g.k === undefined ? 0 : 1, y: g.b !== undefined && g.k === undefined ? b : k + b }, n: Date.now(), xp: gotXp });
      window.setTimeout(() => setWin(null), 1700);
      update((p) => {
        p.acad.challenges[active.id] = true;
        if (g7Explore.challenges.every((c) => c.id === active.id || p.acad.challenges[c.id])) p.acad.sections.explore = true;
      });
    }
  }, [k, b, active, update, acadReward]);

  useEffect(() => {
    if (allDone && !progress.acad.sections.explore) markDone('explore');
  }, [allDone, progress.acad.sections.explore, markDone]);

  const insightK = k > 0 ? g7Explore.kPos : k < 0 ? g7Explore.kNeg : g7Explore.kZero;
  // The goal of the active task, drawn on the graph; a short success moment when it is reached.
  const [win, setWin] = useState<{ id: string; at: { x: number; y: number }; n: number; xp: boolean } | null>(null);
  const shown = win ? g7Explore.challenges.find((c) => c.id === win.id)! : active;
  const target = shown && !win ? goalTarget(shown.goal) : null;

  const activeIndex = active ? g7Explore.challenges.findIndex((c) => c.id === active.id) : -1;
  return (
    <>
      <section className={`taskcard ${win ? 'is-win' : ''} ${allDone && !win ? 'is-done' : ''}`} aria-live="polite">
        <div className="taskcard-pic">
          {win || (allDone && !win) ? (
            <svg viewBox="0 0 48 48" className="goal-pic" aria-hidden="true"><path d="M13 25l7 7 15-16" className="gp-check" /></svg>
          ) : (
            target && <GoalPicture target={target} />
          )}
        </div>
        <div className="taskcard-body">
          <div className="taskcard-top">
            <span className="taskcard-label">{win ? t('great') : tx(g7Explore.challengesTitle, lang)}</span>
            {win?.xp && <span className="taskcard-xp">+10 XP</span>}
            <span className="taskcard-dots" aria-label={`${allDone ? g7Explore.challenges.length : activeIndex + 1}/${g7Explore.challenges.length}`}>
              {g7Explore.challenges.map((c) => (
                <i key={c.id} className={done[c.id] ? 'done' : c.id === shown?.id ? 'on' : ''} />
              ))}
            </span>
          </div>
          <h2 className="taskcard-q">{shown ? tx(shown.prompt, lang) : t('solved')}</h2>
        </div>
      </section>
      <section className="panel panel-graph">
        <LiveEquation k={k} b={b} />
        <div className="plane-wrap">
          <CoordinatePlane
            k={k}
            b={b}
            lang={lang}
            onChange={(nk, nb) => {
              setK(nk);
              setB(nb);
            }}
            target={target}
            pulse={shown && !win ? goalPulse(shown.goal) : null}
            burst={win ? { ...win.at, id: win.n } : null}
            slopeTriangle
            label={lineEq(k, b, lang)}
          />
        </div>
        <p className="under-plane">{tx(g7Explore.handleHint, lang)}</p>
        <div className="sliders">
          <label className="slider slider-k">
            <span>
              <b className="k">k</b> — {tx(g7Explore.kName, lang)} <output>{num(k, lang)}</output>
            </span>
            <input type="range" min={K_MIN} max={K_MAX} step={0.5} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label={`k, ${tx(g7Explore.kName, lang)}`} />
          </label>
          <label className="slider slider-b">
            <span>
              <b className="b">b</b> — {tx(g7Explore.bName, lang)} <output>{num(b, lang)}</output>
            </span>
            <input type="range" min={B_MIN} max={B_MAX} step={1} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label={`b, ${tx(g7Explore.bName, lang)}`} />
          </label>
        </div>
      </section>

      <section className="panel insights" aria-live="polite">
        <p><span className="dot dot-k" /> {tx(insightK, lang)} {k !== 0 && fill(tx(g7Explore.kStep, lang), { k: num(k, lang) })}</p>
        <p><span className="dot dot-b" /> {fill(tx(g7Explore.bCross, lang), { p: pt(0, b, lang) })}</p>
        <table className="values">
          <caption>{tx(g7Explore.tableTitle, lang)}</caption>
          <tbody>
            <tr>
              <th scope="row">x</th>
              {[-2, -1, 0, 1, 2].map((x) => <td key={x}>{num(x, lang)}</td>)}
            </tr>
            <tr>
              <th scope="row">y</th>
              {[-2, -1, 0, 1, 2].map((x) => <td key={x} className={x === 0 ? 'b' : ''}>{num(k * x + b, lang)}</td>)}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="panel-title">{tx(g7Explore.challengesTitle, lang)}</h2>
        <ol className="challenges">
          {g7Explore.challenges.map((c, i) => {
            const isDone = Boolean(done[c.id]);
            const isActive = active?.id === c.id;
            return (
              <li key={c.id} className={`${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                <span className="ch-num">{isDone ? Icon.check : i + 1}</span>
                <div>
                  <b>{tx(c.prompt, lang)}</b>
                  {isDone && <p className="ch-insight">{tx(c.insight, lang)}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <NextSectionButton from="explore" />
    </>
  );
}

/* ---------- Step by step ---------- */

function Steps() {
  const { t, lang, progress, update, acadReward } = useStore();
  const { markDone } = useSections();
  const steps = g7Steps.steps;
  const [index, setIndex] = useState(Math.min(progress.acad.steps, steps.length - 1));
  const [picked, setPicked] = useState<string | null>(null);
  const step = steps[index];
  const revealed = !step.question || picked !== null;
  const last = index === steps.length - 1;
  const [ax, ay] = g7Steps.a;
  const [bx, by] = g7Steps.b;

  const focus = revealed ? step.focus : steps[Math.max(0, index - 1)]?.focus;
  const showLine = revealed ? step.focus === 'line' || step.focus === 'check' : index >= 4;
  const points: PlanePoint[] = [
    { x: ax, y: ay, label: `A${pt(ax, ay, lang)}`, tone: focus === 'A' ? 'b' : 'accent' },
    { x: bx, y: by, label: `B${pt(bx, by, lang)}`, tone: focus === 'check' ? 'good' : 'accent' },
  ];

  const advance = () => {
    if (last) {
      markDone('steps');
      update((p) => void (p.acad.steps = steps.length));
      return;
    }
    setIndex(index + 1);
    setPicked(null);
    update((p) => void (p.acad.steps = Math.max(p.acad.steps, index + 1)));
  };

  const finished = Boolean(progress.acad.sections.steps) && last && revealed;

  useEffect(() => {
    if (picked === null) return;
    const el = document.querySelector('.reveal');
    if (!el) return;
    const overflow = el.getBoundingClientRect().bottom - (window.innerHeight - 96);
    if (overflow > 0) window.scrollBy({ top: overflow, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [picked]);

  return (
    <>
      <section className="qcard" aria-live="polite">
        <p className="qcard-label">
          {step.question ? tx(g7Steps.predictLabel, lang) : t('stepOf', { n: index + 1, total: steps.length })}
          <span className="dots-row qcard-count" aria-label={`${index + 1}/${steps.length}`}>
            {steps.map((s, i) => <i key={s.id} className={i < index ? 'done' : i === index ? 'on' : ''} />)}
          </span>
        </p>
        <p className="qcard-context">{tx(g7Steps.problem, lang)}</p>
        {step.question && <h2 className="qcard-q">{tx(step.question, lang)}</h2>}
      </section>
      <section className="panel panel-steps-graph">
        <div className="plane-wrap">
          <CoordinatePlane
            k={2}
            b={1}
            lang={lang}
            showLine={showLine}
            points={points}
            delta={focus === 'delta' || focus === 'slope' ? { from: [ax, ay], to: [bx, by] } : null}
            label={tx(g7Steps.problem, lang)}
          />
        </div>
      </section>

      <section className="panel step-card" aria-live="polite">
        {step.question && (
          <>
            <div className="choices choices-compact" role="group" aria-label={tx(step.question, lang)}>
              {step.choices!.map((c) => {
                const state = picked === null ? '' : c.id === step.correct ? 'is-correct' : c.id === picked ? 'is-wrong' : 'is-dim';
                return (
                  <button
                    key={c.id}
                    className={`choice ${state}`}
                    disabled={picked !== null}
                    onClick={() => {
                      setPicked(c.id);
                      telegram.haptic(c.id === step.correct ? 'success' : 'warning');
                      if (c.id === step.correct) acadReward(`step:${step.id}`, 5);
                    }}
                  >
                    <span className="choice-label">{tx(c.label, lang)}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {revealed && (
          <div className="reveal">
            {step.question && <p className={`verdict ${picked === step.correct ? 'good' : 'warn'}`}>{picked === step.correct ? t('predictionRight') : t('predictionWrong')}</p>}
            <p className="reveal-text">{tx(step.reveal, lang)}</p>
            <details className="why" open={!step.question}>
              <summary>{t('whyItWorks')}</summary>
              <p>{tx(step.why, lang)}</p>
            </details>
          </div>
        )}
      </section>

      {finished ? (
        <NextSectionButton from="steps" />
      ) : (
        <div className="dock">
          <button className="btn btn-acad btn-block" disabled={!revealed} onClick={advance}>
            {last ? t('done') : t('nextStep')} {Icon.arrow}
          </button>
        </div>
      )}
    </>
  );
}

/* ---------- Guided problem ---------- */

function Problem() {
  const { t, update, progress, acadReward } = useStore();
  const { markDone } = useSections();
  return (
    <>
      {progress.acad.problem.solved && <p className="solved-chip">{Icon.check} {t('solved')}</p>}
      <AcadTutor
        problem={g7Problem}
        points={[
          { x: -1, y: 4, label: 'C' },
          { x: 2, y: -2, label: 'D' },
        ]}
        solvedLine={{ k: -2, b: 2 }}
        onLadder={(s) =>
          update((p) => {
            p.acad.problem.wrong = Math.max(p.acad.problem.wrong, s.wrong);
            p.acad.problem.hints = Math.max(p.acad.problem.hints, s.hintLevel);
          })
        }
        onSolved={(s) => {
          acadReward('problem', 20);
          update((p) => {
            p.acad.problem = { solved: true, wrong: Math.max(p.acad.problem.wrong, s.wrong), hints: Math.max(p.acad.problem.hints, s.hintLevel) };
          });
          markDone('problem');
        }}
        solvedFooter={<NextSectionButton from="problem" />}
      />
    </>
  );
}

/* ---------- Comprehension check ---------- */

function Check() {
  const { t, update, acadReward } = useStore();
  const nav = useNav();
  const [round] = useState(() => Date.now());
  return (
    <>
      <QuizRunner
        key={round}
        questions={g7Quiz}
        variant="academic"
        onFinish={(answers, score) => {
          g7Quiz.forEach((q) => answers[q.id] === q.correct && acadReward(`quiz:${q.id}`, 5));
          update((p) => {
            p.acad.quiz = { best: Math.max(p.acad.quiz.best ?? 0, score), last: answers, attempts: p.acad.quiz.attempts + 1 };
            p.acad.sections.check = true;
          });
          nav.replace({ name: 'acad-results' });
        }}
      />
      <p className="under-plane">{t('checkIntro')}</p>
    </>
  );
}

/* ---------- wrapper ---------- */

export function AcadSection({ section }: { section: SectionId }) {
  const { t, lang, progress } = useStore();
  const { goTo } = useSections();
  const index = g7Sections.findIndex((s) => s.id === section);
  const meta = g7Sections[index];
  const body: Record<SectionId, ReactNode> = {
    overview: <Overview />,
    explore: <Explore />,
    steps: <Steps />,
    problem: <Problem />,
    check: <Check />,
  };
  return (
    <main className="screen academic acad-section">
      <TopBar title={tx(meta.title, lang)} right={<AcadStats />} settings={false} />
      <nav className="seg-bar" aria-label={`${t('inThisTopic')} · ${index + 1}/${g7Sections.length}`}>
        {g7Sections.map((s) => (
          <button
            key={s.id}
            className={`${s.id === section ? 'on' : ''} ${progress.acad.sections[s.id] ? 'done' : ''}`}
            onClick={() => goTo(s.id)}
            aria-current={s.id === section ? 'step' : undefined}
            aria-label={tx(s.title, lang)}
          >
            <span className="tab-name">{tx(TAB_NAMES[s.id], lang)}</span>
          </button>
        ))}
      </nav>
      <div className="scroll" key={section}>
        {body[section]}
      </div>
    </main>
  );
}
