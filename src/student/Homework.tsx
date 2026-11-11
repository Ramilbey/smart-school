import { Fragment, useEffect, useMemo, useState } from 'react';
import { solveProblem, type Solution } from '../../shared/solver.ts';
import { tx } from '../../shared/types.ts';
import { track } from '../lib/track.ts';
import { useStore } from '../lib/store.tsx';
import { Ico } from './icons.tsx';
import { go } from './route.ts';
import { ts, type StKey } from './strings.ts';

/** The solver marks key parts with <b>…</b>. Only that is honoured: the text is split into pieces and drawn, never inserted as HTML. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(<b>.*?<\/b>)/gs).map((part, i) => {
        const bold = /^<b>(.*)<\/b>$/s.exec(part);
        const clean = (bold ? bold[1]! : part).replace(/<[^>]*>/g, '');
        return bold ? <b key={i}>{clean}</b> : <Fragment key={i}>{clean}</Fragment>;
      })}
    </>
  );
}

const EXAMPLES = ['2x + 3 = 11', '3x − 5 = 2x + 4', '3/4 + 1/6', '15% of 80', '(x + 3)^2', '2 + 3 · (4 + 5)'];

export function Homework() {
  const { lang, session } = useStore();
  const t = (k: StKey, v?: Record<string, string | number>) => ts(lang, k, v);
  const [text, setText] = useState('');
  const [asked, setAsked] = useState('');
  const [shown, setShown] = useState(0);

  const solution: Solution | null = useMemo(() => (asked ? solveProblem(asked) : null), [asked]);
  const total = solution?.steps.length ?? 0;
  const done = !!solution && shown > total; // one past the last step = the answer is shown
  useEffect(() => { if (done) track({ kind: 'solved' }); }, [done, asked]); // the answer was reached: one solved problem

  const run = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setText(v);
    setAsked(v);
    setShown(0);
  };
  const clear = () => { setText(''); setAsked(''); setShown(0); };
  const aiOn = !!session?.board;
  const topic = `Explain step by step how to solve: ${asked}`;

  return (
    <div className="st-page st-hw">
      <section className="st-card st-hw-in">
        <p className="st-lead">{t('hwLead')}</p>
        <form onSubmit={(e) => { e.preventDefault(); run(text); }}>
          <label htmlFor="hw-in">{t('hwLabel')}</label>
          <div className="st-field">
            <input id="hw-in" className="st-in" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('hwPlaceholder')} maxLength={80} autoComplete="off" spellCheck={false} />
            {text && <button type="button" className="st-x" onClick={clear} aria-label={t('hwClear')}><Ico name="close" size={18} /></button>}
          </div>
          <button type="submit" className="st-main-btn amber" disabled={!text.trim()}>{t('hwShow')}</button>
        </form>
        <div className="st-sub">{t('hwExamples')}</div>
        <div className="st-chips">
          {EXAMPLES.map((x) => <button key={x} type="button" className="st-chip" onClick={() => run(x)}>{x}</button>)}
        </div>
      </section>

      <section className="st-card st-hw-out" aria-live="polite">
        {!asked && (
          <div className="st-empty">
            <h3>{t('hwCanTitle')}</h3>
            <ul>
              <li><Ico name="check" size={18} />{t('hwCan1')}</li>
              <li><Ico name="check" size={18} />{t('hwCan2')}</li>
              <li><Ico name="check" size={18} />{t('hwCan3')}</li>
              <li><Ico name="check" size={18} />{t('hwCan4')}</li>
            </ul>
            <p className="st-note">{t('hwNote')}</p>
          </div>
        )}

        {asked && !solution && (
          <div className="st-empty">
            <p className="st-bad">{t('hwCant')}</p>
            {aiOn && <button type="button" className="st-main-btn" onClick={() => go('tutor', { q: asked })}>{t('hwAskTutor')}</button>}
          </div>
        )}

        {solution && (
          <>
            <div className="st-problem">
              <span className="st-kind">{t(`kind_${solution.kind}` as StKey)}</span>
              <div className="st-formula"><Rich text={solution.problem} /></div>
            </div>

            {shown === 0 && <p className="st-hint">{t('hwTryFirst')}</p>}

            <ol className="st-steps">
              {solution.steps.slice(0, Math.min(shown, total)).map((s, i) => (
                <li key={i} className={i === shown - 1 && !done ? 'new' : ''}>
                  <span className="n">{i + 1}</span>
                  <div><small>{t('hwStepN', { n: i + 1, total })}</small><Rich text={tx(s, lang)} /></div>
                </li>
              ))}
            </ol>

            {done && (
              <div className="st-answer">
                <small>{t('hwAnswer')}</small>
                <b><Rich text={tx(solution.answer, lang)} /></b>
              </div>
            )}

            <div className="st-actions">
              {!done && (
                <>
                  <button type="button" className="st-main-btn amber" onClick={() => setShown((n) => n + 1)}>
                    {shown === 0 ? t('hwFirst') : shown < total ? t('hwNext') : t('hwSeeAnswer')}
                  </button>
                  {shown < total && <button type="button" className="st-ghost" onClick={() => setShown(total + 1)}>{t('hwAll')}</button>}
                </>
              )}
              {done && <button type="button" className="st-main-btn" onClick={clear}>{t('hwAnother')}</button>}
              {aiOn && <button type="button" className="st-ghost" onClick={() => go('explain', { q: topic })}>{t('hwExplainBoard')}</button>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
