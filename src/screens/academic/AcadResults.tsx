import { useState } from 'react';
import { parseNumber, approxEqual } from '../../../shared/format.ts';
import { g7Misconceptions, g7Quiz, g7Sections, g7Skills, type SectionId } from '../../../shared/lessons/g7Linear.ts';
import { makePractice } from '../../../shared/practice.ts';
import { tx } from '../../../shared/types.ts';
import { Icon, Keypad, ProgressBar, TopBar } from '../../components/Chrome.tsx';
import { VisualView } from '../../components/FractionVisuals.tsx';
import { useNav } from '../../lib/nav.tsx';
import { useStore } from '../../lib/store.tsx';
import { telegram } from '../../lib/telegram.ts';
import { misconceptionsFrom } from './mastery.ts';

export function AcadResults() {
  const { t, lang, progress } = useStore();
  const nav = useNav();
  const answers = progress.acad.quiz.last;

  if (!answers) {
    return (
      <main className="screen academic acad-results">
        <TopBar title={t('resultsTitle')} />
        <div className="scroll">
          <p className="body-text">{t('notTaken')}</p>
          <button className="btn btn-acad btn-block" onClick={() => nav.replace({ name: 'acad-section', section: 'check' })}>
            {t('startTopic')}
          </button>
        </div>
      </main>
    );
  }

  const score = g7Quiz.filter((q) => answers[q.id] === q.correct).length;
  const pct = score / g7Quiz.length;
  const weak = g7Skills.filter((s) => g7Quiz.some((q) => q.skill === s.id && answers[q.id] !== q.correct));
  const strong = g7Skills.filter((s) => !weak.includes(s));
  const mis = misconceptionsFrom(answers);
  const sectionTitle = (id: string) => tx(g7Sections.find((s) => s.id === id)!.title, lang);
  const ring = 2 * Math.PI * 52;

  return (
    <main className="screen academic acad-results">
      <TopBar title={t('resultsTitle')} />
      <div className="scroll">
        <section className="panel score-panel">
          <svg viewBox="0 0 120 120" width="120" height="120" className="score-ring" aria-hidden="true">
            <circle cx="60" cy="60" r="52" className="ring-bg" />
            <circle cx="60" cy="60" r="52" className="ring-fg" strokeDasharray={`${ring * pct} ${ring}`} transform="rotate(-90 60 60)" />
          </svg>
          <div className="score-text">
            <b>{score}/{g7Quiz.length}</b>
            <span>{Math.round(pct * 100)}%</span>
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-title">{t('bySkill')}</h2>
          <ul className="skill-results">
            {g7Quiz.map((q) => {
              const ok = answers[q.id] === q.correct;
              const skill = g7Skills.find((s) => s.id === q.skill)!;
              return (
                <li key={q.id} className={ok ? 'ok' : 'miss'}>
                  <span className="sr-mark" aria-hidden="true">{ok ? '✓' : '✕'}</span>
                  <span>{tx(skill.name, lang)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel">
          <h2 className="panel-title">{t('misconceptionsSpotted')}</h2>
          {mis.length ? (
            <ul className="mis-list">
              {mis.map((id) => (
                <li key={id}>{tx(g7Misconceptions.find((m) => m.id === id)?.name ?? { uz: id, ru: id, en: id }, lang)}</li>
              ))}
            </ul>
          ) : (
            <p className="body-text muted">{t('noMisconceptions')}</p>
          )}
        </section>

        <section className="panel">
          <h2 className="panel-title">{t('recommended')}</h2>
          {weak.length === 0 && <p className="body-text">{t('allCorrect')}</p>}
          <div className="rec-list">
            {(weak.length ? weak : [g7Skills.find((s) => s.id === 'slope')!]).map((s) => (
              <div key={s.id} className="rec">
                <b>{tx(s.name, lang)}</b>
                <div className="rec-btns">
                  <button className="btn btn-acad" onClick={() => nav.push({ name: 'acad-practice', skill: s.id, seed: Date.now() % 100000 })}>
                    {t('practiceTitle')} {Icon.arrow}
                  </button>
                  {weak.length > 0 && (
                    <button className="btn btn-outline" onClick={() => nav.push({ name: 'acad-section', section: s.review as SectionId })}>
                      {t('reviewSection', { section: sectionTitle(s.review) })}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {strong.length > 0 && weak.length > 0 && (
            <p className="panel-sub">✓ {strong.map((s) => tx(s.name, lang)).join(' · ')}</p>
          )}
        </section>

        <div className="stack-btns">
          <button className="btn btn-outline btn-block" onClick={() => nav.replace({ name: 'acad-section', section: 'check' })}>{t('retake')}</button>
          <button className="btn btn-acad btn-block" onClick={() => nav.reset([{ name: 'welcome' }, { name: 'grades' }, { name: 'acad-home' }])}>{t('backToTopic')}</button>
        </div>
      </div>
    </main>
  );
}

export function AcadPractice({ skill, seed }: { skill: string; seed: number }) {
  const { t, lang, update } = useStore();
  const nav = useNav();
  const [currentSeed, setSeed] = useState(seed);
  const [items, setItems] = useState(() => makePractice(skill, seed));
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [state, setState] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [wrongCount, setWrongCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const item = items[index];
  const skillMeta = g7Skills.find((s) => s.id === skill);
  const decimal = lang === 'en' ? '.' : ',';

  const check = () => {
    const n = parseNumber(value);
    if (n === null) return telegram.haptic('error');
    if (approxEqual(n, item.answer)) {
      telegram.haptic('success');
      setState('right');
      if (wrongCount === 0 && !showSolution) setCorrect((c) => c + 1);
    } else {
      telegram.haptic('warning');
      setState('wrong');
      setWrongCount((w) => w + 1);
      setValue('');
    }
  };

  const next = () => {
    if (index === items.length - 1) {
      const firstTry = correct;
      update((p) => {
        const rec = p.acad.practice[skill] ?? { correct: 0, attempted: 0 };
        p.acad.practice[skill] = { correct: rec.correct + firstTry, attempted: rec.attempted + items.length };
      });
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setValue('');
    setState('idle');
    setWrongCount(0);
    setShowHint(false);
    setShowSolution(false);
  };

  const restart = () => {
    const s = (currentSeed * 7 + 13) % 100000;
    setSeed(s);
    setItems(makePractice(skill, s));
    setIndex(0);
    setValue('');
    setState('idle');
    setWrongCount(0);
    setShowHint(false);
    setShowSolution(false);
    setCorrect(0);
    setFinished(false);
  };

  return (
    <main className="screen academic acad-practice">
      <TopBar title={t('practiceTitle')} subtitle={skillMeta ? tx(skillMeta.name, lang) : undefined} />
      <div className="scroll">
        {finished ? (
          <section className="panel score-panel">
            <div className="score-text">
              <b>{correct}/{items.length}</b>
              <span>{t('practiceDone', { n: correct, total: items.length })}</span>
            </div>
            <div className="stack-btns">
              <button className="btn btn-outline btn-block" onClick={restart}>{t('newSet')}</button>
              <button className="btn btn-acad btn-block" onClick={() => nav.reset([{ name: 'welcome' }, { name: 'grades' }, { name: 'acad-home' }])}>{t('backToTopic')}</button>
            </div>
          </section>
        ) : (
          <>
            <p className="body-text muted">{t('practiceIntro')}</p>
            <div className="quiz-head">
              <span className="quiz-count">{t('questionOf', { n: index + 1, total: items.length })}</span>
              <ProgressBar value={(index + (state === 'right' ? 1 : 0)) / items.length} />
            </div>
            <section className="panel">
              <p className="problem-text">{tx(item.prompt, lang)}</p>
              {item.visual && (
                <div className="plane-wrap plane-wrap-sm">
                  <VisualView visual={item.visual} lang={lang} size={220} />
                </div>
              )}
              {state === 'wrong' && <p className="verdict warn">{t('wrongAcad')}</p>}
              {state === 'right' && <p className="verdict good">{t('correct')}</p>}
              {(showHint || state === 'right') && <p className="hint-box">{Icon.bulb} {tx(item.hint, lang)}</p>}
              {(showSolution || state === 'right') && <p className="solution-box">{tx(item.solution, lang)}</p>}
            </section>
            {state !== 'right' ? (
              <div className="answer-dock">
                <div className="field-row">
                  <div className="field active">
                    <span className="field-label">{item.answerLabel} =</span>
                    <span className="field-value">{value || ' '}</span>
                  </div>
                  <button className="btn btn-acad" disabled={!value} onClick={check}>{t('check')}</button>
                </div>
                <Keypad
                  label={t('answerLabel')}
                  keys={['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '−', decimal, '/', '⌫']}
                  onKey={(key) =>
                    setValue((v) => (key === '⌫' ? v.slice(0, -1) : key === '−' ? (v.startsWith('−') ? v.slice(1) : '−' + v) : v.length >= 6 ? v : v + key))
                  }
                />
                <div className="dock-actions">
                  {!showHint && (
                    <button className="btn btn-outline" onClick={() => setShowHint(true)}>{Icon.bulb} {t('hintBtn')}</button>
                  )}
                  {wrongCount >= 2 && !showSolution && (
                    <button className="btn btn-outline" onClick={() => setShowSolution(true)}>{t('showSolution')}</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="dock">
                <button className="btn btn-acad btn-block" onClick={next}>
                  {index === items.length - 1 ? t('seeResults') : t('next')} {Icon.arrow}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
