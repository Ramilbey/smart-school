import { useEffect, useRef, useState } from 'react';
import { tx, type QuizQuestion } from '../../shared/types.ts';
import { useStore } from '../lib/store.tsx';
import { telegram } from '../lib/telegram.ts';
import { MathLabel, Owl } from './Brand.tsx';
import { Icon, ProgressBar } from './Chrome.tsx';
import { VisualView } from './FractionVisuals.tsx';

interface Props {
  questions: QuizQuestion[];
  variant: 'kids' | 'academic';
  onFinish: (answers: Record<string, string>, score: number) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** Short quiz with immediate, deterministic feedback after every answer. */
export function QuizRunner({ questions, variant, onFinish }: Props) {
  const { lang, t } = useStore();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const q = questions[index];
  const picked = answers[q.id];
  const answered = picked !== undefined;
  const isCorrect = picked === q.correct;
  const last = index === questions.length - 1;
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Bring the explanation into view above the sticky button after answering.
  useEffect(() => {
    if (!answered) return;
    const el = feedbackRef.current;
    if (!el) return;
    const overflow = el.getBoundingClientRect().bottom - (window.innerHeight - 96);
    if (overflow > 0) window.scrollBy({ top: overflow, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [answered, index]);

  const choose = (id: string) => {
    if (answered) return;
    setAnswers((a) => ({ ...a, [q.id]: id }));
    telegram.haptic(id === q.correct ? 'success' : 'warning');
  };

  const next = () => {
    if (!last) return setIndex((i) => i + 1);
    const score = questions.filter((qq) => answers[qq.id] === qq.correct).length;
    onFinish(answers, score);
  };

  return (
    <div className={`quiz quiz-${variant}`}>
      <div className="quiz-head">
        <span className="quiz-count">{t('questionOf', { n: index + 1, total: questions.length })}</span>
        <ProgressBar value={(index + (answered ? 1 : 0)) / questions.length} label={t('questionOf', { n: index + 1, total: questions.length })} />
      </div>

      <div className="quiz-card" key={q.id}>
        <h2 className="quiz-prompt">{tx(q.prompt, lang)}</h2>
        {q.visual && (
          <div className="quiz-visual">
            <VisualView visual={q.visual} lang={lang} size={variant === 'kids' ? 180 : undefined} />
          </div>
        )}
        <div className={`choices ${q.pictureChoices ? 'choices-pictures' : ''}`} role="radiogroup" aria-label={tx(q.prompt, lang)}>
          {q.choices.map((c, i) => {
            const state = !answered ? '' : c.id === q.correct ? 'is-correct' : c.id === picked ? 'is-wrong' : 'is-dim';
            const label = c.label ? tx(c.label, lang) : '';
            return (
              <button
                key={c.id}
                role="radio"
                aria-checked={picked === c.id}
                aria-label={label || `${LETTERS[i]}`}
                className={`choice ${state}`}
                onClick={() => choose(c.id)}
                disabled={answered && c.id !== picked && c.id !== q.correct}
              >
                {variant === 'academic' && <span className="choice-letter">{LETTERS[i]}</span>}
                {c.visual && <VisualView visual={c.visual} lang={lang} size={variant === 'kids' ? 104 : 112} />}
                {label && !c.visual && (
                  <span className="choice-label">
                    <MathLabel text={label} />
                  </span>
                )}
                {answered && c.id === q.correct && <span className="choice-mark">{Icon.check}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {answered && (
        <div ref={feedbackRef} className={`quiz-feedback ${isCorrect ? 'good' : 'warn'}`} role="status" aria-live="polite">
          {variant === 'kids' && <Owl size={52} mood={isCorrect ? 'happy' : 'think'} />}
          <div>
            <strong>{isCorrect ? t('correct') : variant === 'kids' ? t('notThisTime') : t('wrongAcad')}</strong>
            <p>{tx(q.explanation, lang)}</p>
          </div>
        </div>
      )}

      <div className="dock">
        <button className={`btn ${variant === 'kids' ? 'btn-kids' : 'btn-acad'} btn-block`} disabled={!answered} onClick={next}>
          {last ? t('seeResults') : t('next')} {Icon.arrow}
        </button>
      </div>
    </div>
  );
}
