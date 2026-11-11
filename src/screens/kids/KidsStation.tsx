import { useState, type ReactNode } from 'react';
import {
  g4Build,
  g4Compare,
  g4Equal,
  g4Homework,
  g4Quiz,
  g4Stations,
  type StationId,
} from '../../../shared/lessons/g4Fractions.ts';
import { tx } from '../../../shared/types.ts';
import { Frac, MathLabel, Owl, type OwlMood } from '../../components/Brand.tsx';
import { Icon, TopBar } from '../../components/Chrome.tsx';
import { Bowl, CompareBars, Pomegranate, SplitShape } from '../../components/FractionVisuals.tsx';
import { QuizRunner } from '../../components/QuizRunner.tsx';
import { KidsTutor } from '../../components/TutorPanel.tsx';
import { fill } from '../../lib/i18n.ts';
import { useStore } from '../../lib/store.tsx';
import { telegram } from '../../lib/telegram.ts';
import { XpPill } from './KidsHome.tsx';
import { XP, useKids } from './useKids.ts';

function Zukko({ mood = 'idle', children }: { mood?: OwlMood; children: ReactNode }) {
  return (
    <div className="zukko-says">
      <Owl size={64} mood={mood} />
      <div className="bubble bubble-left" aria-live="polite">{children}</div>
    </div>
  );
}

function DoneFooter({ station }: { station: StationId }) {
  const { t } = useStore();
  const { goNext, nav, nextStation } = useKids();
  const next = nextStation(station);
  return (
    <div className="dock dock-split">
      <button className="btn btn-quiet-kids" onClick={nav.back}>{t('backToMap')}</button>
      <button className="btn btn-kids" onClick={() => goNext(station)}>
        {next ? t('nextStation') : t('missionDoneCta')} {Icon.arrow}
      </button>
    </div>
  );
}

/* ---------- Station 1: equal parts ---------- */

function StationEqual() {
  const { lang, t } = useStore();
  const { completeStation } = useKids();
  const [picked, setPicked] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; mood: OwlMood } | null>(null);
  const [done, setDone] = useState(false);

  const toggle = (id: string) => {
    if (done) return;
    telegram.haptic('select');
    setFeedback(null);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const check = () => {
    const wrongPick = picked.some((id) => !g4Equal.shapes.find((s) => s.id === id)!.equal);
    const missed = g4Equal.shapes.some((s) => s.equal && !picked.includes(s.id));
    if (wrongPick) {
      telegram.haptic('warning');
      setFeedback({ text: tx(g4Equal.pickedUnequal, lang), mood: 'think' });
    } else if (missed) {
      telegram.haptic('warning');
      setFeedback({ text: tx(g4Equal.missedEqual, lang), mood: 'think' });
    } else {
      telegram.haptic('success');
      setFeedback({ text: `${tx(g4Equal.success, lang)} ${tx(g4Equal.takeaway, lang)}`, mood: 'happy' });
      setDone(true);
      completeStation('equal', { xp: XP.station, badge: 'fair-share' });
    }
  };

  return (
    <>
      <Zukko mood={feedback?.mood}>{feedback?.text ?? tx(g4Equal.intro, lang)}</Zukko>
      <p className="task">{tx(g4Equal.task, lang)}</p>
      <div className="shape-grid">
        {g4Equal.shapes.map((s, i) => {
          const on = picked.includes(s.id);
          const reveal = done ? (s.equal ? 'is-correct' : 'is-dim') : '';
          return (
            <button key={s.id} className={`shape-card ${on ? 'on' : ''} ${reveal}`} aria-pressed={on} aria-label={`${i + 1}`} onClick={() => toggle(s.id)}>
              {s.visual.type === 'split' && <SplitShape shape={s.visual.shape} cuts={s.visual.cuts} filled={s.visual.filled} size={96} />}
              <span className="shape-tick" aria-hidden="true">{on ? Icon.check : ''}</span>
            </button>
          );
        })}
      </div>
      {done ? (
        <DoneFooter station="equal" />
      ) : (
        <div className="dock">
          <button className="btn btn-kids btn-block" disabled={!picked.length} onClick={check}>{t('check')}</button>
        </div>
      )}
    </>
  );
}

/* ---------- Station 2: build a fraction ---------- */

function StationBuild() {
  const { lang, t } = useStore();
  const { completeStation } = useKids();
  const [challenge, setChallenge] = useState(0);
  const [parts, setParts] = useState(2);
  const [filled, setFilled] = useState<boolean[]>(Array(2).fill(false));
  const [feedback, setFeedback] = useState<{ text: string; mood: OwlMood } | null>(null);
  const [solved, setSolved] = useState(false);
  const allDone = challenge >= g4Build.challenges.length;
  const ch = g4Build.challenges[Math.min(challenge, g4Build.challenges.length - 1)];
  const count = filled.filter(Boolean).length;

  const setPartsTo = (n: number) => {
    const next = Math.max(1, Math.min(8, n));
    telegram.haptic('select');
    setParts(next);
    setFilled(Array(next).fill(false));
    setFeedback(null);
    setSolved(false);
  };

  const toggle = (i: number) => {
    if (solved) return;
    telegram.haptic('select');
    setFeedback(null);
    setFilled((f) => f.map((v, j) => (j === i ? !v : v)));
  };

  const check = () => {
    if (parts !== ch.parts) {
      telegram.haptic('warning');
      return setFeedback({ text: fill(tx(g4Build.needParts, lang), { n: ch.parts }), mood: 'think' });
    }
    if (count !== ch.filled) {
      telegram.haptic('warning');
      return setFeedback({ text: fill(tx(g4Build.needFilled, lang), { n: ch.filled }), mood: 'think' });
    }
    telegram.haptic('success');
    setSolved(true);
    setFeedback({ text: fill(tx(g4Build.success, lang), { f: `${ch.filled}/${ch.parts}`, n: ch.filled, d: ch.parts }), mood: 'happy' });
    if (challenge === g4Build.challenges.length - 1) completeStation('build', { xp: XP.station, badge: 'builder' });
  };

  const nextChallenge = () => {
    setChallenge((c) => c + 1);
    if (challenge + 1 < g4Build.challenges.length) setPartsTo(2);
  };

  return (
    <>
      <Zukko mood={feedback?.mood}>{feedback?.text ?? tx(g4Build.intro, lang)}</Zukko>
      {!allDone && (
        <p className="task">
          <span className="task-num">{t('challengeN', { n: challenge + 1 })}</span> {tx(ch.prompt, lang)}
        </p>
      )}
      <div className="builder">
        <div className="orchard">
          <Pomegranate parts={parts} filled={filled} onToggle={toggle} size={210} label={tx(g4Build.tapHint, lang)} />
          <Bowl count={count} parts={parts} />
        </div>
        <div className="builder-side">
          <div className="live-frac" aria-live="polite">
            <Frac n={count} d={parts} className="frac-xl" />
            <div className="live-legend">
              <span><i className="lg-top" />{tx(g4Build.numerator, lang)}: {count} {t('colored')}</span>
              <span><i className="lg-bottom" />{tx(g4Build.denominator, lang)}: {parts} {t('allParts')}</span>
            </div>
          </div>
          <div className="stepper" role="group" aria-label={tx(g4Build.partsLabel, lang)}>
            <button className="step-btn" onClick={() => setPartsTo(parts - 1)} disabled={parts <= 1 || solved} aria-label={t('fewer')}>−</button>
            <span className="step-val">{t('partsCount', { n: parts })}</span>
            <button className="step-btn" onClick={() => setPartsTo(parts + 1)} disabled={parts >= 8 || solved} aria-label={t('more')}>+</button>
          </div>
        </div>
      </div>
      <p className="fine-print center">{tx(g4Build.tapHint, lang)}</p>
      {allDone || (solved && challenge === g4Build.challenges.length - 1) ? (
        <DoneFooter station="build" />
      ) : solved ? (
        <div className="dock">
          <button className="btn btn-kids btn-block" onClick={nextChallenge}>{t('next')} {Icon.arrow}</button>
        </div>
      ) : (
        <div className="dock">
          <button className="btn btn-kids btn-block" onClick={check}>{t('check')}</button>
        </div>
      )}
    </>
  );
}

/* ---------- Station 3: compare ---------- */

const WALL = [1, 2, 3, 4, 6, 8];

function FractionWall() {
  const { t } = useStore();
  const [sel, setSel] = useState<number[]>([]);
  const pick = (d: number) => {
    telegram.haptic('select');
    setSel((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s.slice(-1), d]));
  };
  const label = (d: number) => (d === 1 ? t('oneWhole') : `1/${d}`);
  let verdict = t('pickTwo');
  if (sel.length === 2) {
    const [a, b] = sel;
    verdict = a === b ? t('areEqual', { a: label(a), b: label(b) }) : a < b ? t('isBigger', { a: label(a), b: label(b) }) : t('isBigger', { a: label(b), b: label(a) });
  }
  return (
    <div className="wall">
      {WALL.map((d) => (
        <button key={d} className={`wall-row ${sel.includes(d) ? 'on' : ''}`} onClick={() => pick(d)} aria-pressed={sel.includes(d)} aria-label={label(d)}>
          {Array.from({ length: d }, (_, i) => (
            <span key={i} className="wall-cell" style={{ background: i === 0 ? '#ffc857' : '#fff3d1' }}>
              {i === 0 ? (d === 1 ? '1' : <Frac n={1} d={d} />) : ''}
            </span>
          ))}
        </button>
      ))}
      <p className="wall-verdict" aria-live="polite">{verdict}</p>
    </div>
  );
}

function StationCompare() {
  const { lang, t } = useStore();
  const { completeStation } = useKids();
  const [qi, setQi] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [right, setRight] = useState(false);
  const q = g4Compare.questions[qi];
  const last = qi === g4Compare.questions.length - 1;

  const answer = (c: string) => {
    if (right) return;
    if (c === q.correct) {
      telegram.haptic('success');
      setRight(true);
      if (last) completeStation('compare', { xp: XP.station, badge: 'sharp-eye' });
    } else {
      telegram.haptic('warning');
      setWrong((w) => [...w, c]);
    }
  };

  const bubble = right ? tx(q.right, lang) : wrong.length ? tx(q.wrong, lang) : tx(g4Compare.intro, lang);

  return (
    <>
      <Zukko mood={right ? 'happy' : wrong.length ? 'think' : 'idle'}>{bubble}</Zukko>
      {qi === 0 && !right && (
        <>
          <p className="task">{tx(g4Compare.wallHint, lang)}</p>
          <FractionWall />
        </>
      )}
      <p className="task">
        <span className="task-num">{t('challengeN', { n: qi + 1 })}</span> {tx(q.prompt, lang)}
      </p>
      {(right || wrong.length > 0) && q.visual.type === 'compare-bars' && <CompareBars fractions={q.visual.fractions} />}
      <div className="choice-row">
        {q.choices.map((c) => (
          <button
            key={c}
            className={`choice-btn big ${wrong.includes(c) ? 'is-wrong' : ''} ${right && c === q.correct ? 'is-correct' : ''}`}
            disabled={wrong.includes(c) || right}
            onClick={() => answer(c)}
          >
            <MathLabel text={c} />
          </button>
        ))}
      </div>
      {right && !last && (
        <div className="dock">
          <button
            className="btn btn-kids btn-block"
            onClick={() => {
              setQi((i) => i + 1);
              setWrong([]);
              setRight(false);
            }}
          >
            {t('next')} {Icon.arrow}
          </button>
        </div>
      )}
      {right && last && <DoneFooter station="compare" />}
    </>
  );
}

/* ---------- Station 4: homework with the hint ladder ---------- */

function StationHomework() {
  const { t } = useStore();
  const { progress, update, reward, completeStation } = useKids();
  const firstUnsolved = g4Homework.findIndex((p) => !progress.kids.homework[p.id]?.solved);
  const [index, setIndex] = useState(firstUnsolved === -1 ? 0 : firstUnsolved);
  const problem = g4Homework[index];
  const last = index === g4Homework.length - 1;

  return (
    <>
      <div className="tabs" role="tablist">
        {g4Homework.map((p, i) => (
          <button key={p.id} role="tab" aria-selected={i === index} className={`tab ${i === index ? 'on' : ''}`} onClick={() => setIndex(i)}>
            {progress.kids.homework[p.id]?.solved ? Icon.check : null} {t('problemN', { n: i + 1 })}
          </button>
        ))}
      </div>
      <KidsTutor
        key={problem.id}
        problem={problem}
        illustration={problem.id === 'g4-hw-chocolate' ? { type: 'bar', parts: 8, filled: 0, marked: 'eaten' } : undefined}
        onLadder={(s) =>
          update((p) => {
            const rec = p.kids.homework[problem.id] ?? { solved: false, wrong: 0, hints: 0 };
            p.kids.homework[problem.id] = { ...rec, wrong: Math.max(rec.wrong, s.wrong), hints: Math.max(rec.hints, s.hintLevel) };
          })
        }
        onSolved={(s) => {
          const already = progress.kids.homework[problem.id]?.solved;
          update((p) => {
            const rec = p.kids.homework[problem.id] ?? { solved: false, wrong: 0, hints: 0 };
            p.kids.homework[problem.id] = { solved: true, wrong: Math.max(rec.wrong, s.wrong), hints: Math.max(rec.hints, s.hintLevel) };
          });
          reward({ xp: already ? undefined : XP.homework, badge: s.wrong > 0 ? 'persistent' : undefined });
          const othersSolved = g4Homework.every((p) => p.id === problem.id || progress.kids.homework[p.id]?.solved);
          if (othersSolved) completeStation('homework');
        }}
        solvedFooter={
          last || g4Homework.every((p) => p.id === problem.id || progress.kids.homework[p.id]?.solved) ? (
            <DoneFooter station="homework" />
          ) : (
            <div className="dock">
              <button className="btn btn-kids btn-block" onClick={() => setIndex((i) => i + 1)}>
                {t('nextProblem')} {Icon.arrow}
              </button>
            </div>
          )
        }
      />
    </>
  );
}

/* ---------- Station 5: quiz ---------- */

function StationQuiz() {
  const { t } = useStore();
  const { progress, update, reward, completeStation, nav, nextStation } = useKids();
  const [result, setResult] = useState<number | null>(null);
  const [round, setRound] = useState(0);

  if (result !== null) {
    const stars = result >= 5 ? 3 : result >= 4 ? 2 : result >= 3 ? 1 : 0;
    const remaining = nextStation('quiz');
    return (
      <div className="quiz-result">
        <Owl size={110} mood={result >= 4 ? 'cheer' : 'happy'} />
        <h2>{t('quizScore', { score: result, total: g4Quiz.length })}</h2>
        <div className="stars" aria-label={`${stars} ${t('stars')}`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < stars ? 'on' : ''}>{Icon.star}</span>
          ))}
        </div>
        <div className="dock dock-split">
          <button
            className="btn btn-quiet-kids"
            onClick={() => {
              setResult(null);
              setRound((r) => r + 1);
            }}
          >
            {t('retakeQuiz')}
          </button>
          <button className="btn btn-kids" onClick={() => (remaining ? nav.back() : nav.replace({ name: 'kids-complete' }))}>
            {remaining ? t('backToMap') : t('missionDoneCta')} {Icon.arrow}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="task center">{t('quizIntroKids')}</p>
      <QuizRunner
        key={round}
        questions={g4Quiz}
        variant="kids"
        onFinish={(answers, score) => {
          const prevBest = progress.kids.quiz.best ?? 0;
          update((p) => {
            p.kids.quiz = { best: Math.max(prevBest, score), last: answers, attempts: p.kids.quiz.attempts + 1 };
          });
          const gained = Math.max(0, score - prevBest) * XP.quizPerCorrect;
          reward({ xp: gained || undefined, badge: score >= 4 ? 'quiz-star' : undefined });
          completeStation('quiz');
          setResult(score);
        }}
      />
    </>
  );
}

/* ---------- wrapper ---------- */

export function KidsStation({ station }: { station: StationId }) {
  const { lang, t } = useStore();
  const meta = g4Stations.find((s) => s.id === station)!;
  const index = g4Stations.findIndex((s) => s.id === station);
  const body: Record<StationId, ReactNode> = {
    equal: <StationEqual />,
    build: <StationBuild />,
    compare: <StationCompare />,
    homework: <StationHomework />,
    quiz: <StationQuiz />,
  };
  return (
    <main className="screen kids kids-station">
      <TopBar title={tx(meta.title, lang)} subtitle={`${index + 1} / ${g4Stations.length} · ${t('gradeN', { n: 4 })}`} right={<XpPill />} settings={false} />
      <div className="scroll" key={station}>
        {body[station]}
      </div>
    </main>
  );
}
