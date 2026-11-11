import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LadderState } from '../../shared/check.ts';
import { lineEq, parseNumber, pt } from '../../shared/format.ts';
import { QUESTION_MAX_CHARS } from '../../shared/tutor.ts';
import { tx, type GuidedProblem, type Lang, type Visual } from '../../shared/types.ts';
import { useStore } from '../lib/store.tsx';
import { telegram } from '../lib/telegram.ts';
import { useTutor, type TutorMessage } from '../lib/useTutor.ts';
import { Logo, MathLabel, Owl } from './Brand.tsx';
import { Icon, Keypad } from './Chrome.tsx';
import { VisualView } from './FractionVisuals.tsx';
import { CoordinatePlane } from './Graph.tsx';

type Variant = 'kids' | 'academic';

function LadderMeter({ level, variant }: { level: number; variant: Variant }) {
  const { t } = useStore();
  const names = [t('rung1'), t('rung2'), t('rung3'), t('rung4')];
  return (
    <ol className={`ladder ladder-${variant}`} aria-label={t('hintBtn')}>
      {names.map((n, i) => (
        <li key={n} className={i < level ? 'reached' : ''} aria-current={i + 1 === level ? 'step' : undefined}>
          <span className="ladder-dot">{i + 1}</span>
          <span className="ladder-name">{n}</span>
        </li>
      ))}
    </ol>
  );
}

/** Tutor text with the variables k, b, x, y set apart (bold, colour-coded like the graph), so "k — x 1 ga…" reads as maths. */
function MathText({ text }: { text: string }) {
  const parts = text.split(/(?<![\p{L}\p{N}‘’ʻʼ'])([kbxy])(?![\p{L}\p{N}‘’ʻʼ'])/u);
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <b key={i} className={`mv ${p === 'k' || p === 'b' ? p : ''}`}>{p}</b> : p))}
    </>
  );
}

function Thread({ messages, busy, variant, hintVisual, lang }: { messages: TutorMessage[]; busy: boolean; variant: Variant; hintVisual?: Visual; lang: Lang }) {
  const { t } = useStore();
  const end = useRef<HTMLDivElement>(null);
  // Keep the newest message visible above the sticky answer dock (scrollIntoView ignores sticky overlays).
  useEffect(() => {
    if (messages.length <= 1 && !busy) return;
    const el = end.current;
    if (!el) return;
    const dock = el.closest('.tutor')?.querySelector('.answer-dock');
    const dockH = dock ? dock.getBoundingClientRect().height : 0;
    const overflow = el.getBoundingClientRect().bottom - (window.innerHeight - dockH - 16);
    if (overflow > 0) {
      window.scrollBy({ top: overflow, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }, [messages.length, busy]);
  const lastTutor = [...messages].reverse().find((m) => m.from === 'tutor');
  return (
    <div className={`thread thread-${variant}`} aria-live="polite">
      {messages.map((m) => (
        <div key={m.id} className={`msg msg-${m.from} ${m.kind ? `msg-${m.kind}` : ''}`}>
          {m.from === 'tutor' && (
            <div className="msg-avatar" aria-hidden="true">
              {variant === 'kids' ? <Owl size={40} mood={m.kind === 'explanation' ? 'happy' : m === lastTutor && busy ? 'think' : 'idle'} /> : <Logo size={26} />}
            </div>
          )}
          <div className="msg-body">
            {m.from === 'tutor' && variant === 'academic' && <div className="msg-who">{t('tutor')}</div>}
            <p>{variant === 'academic' ? <MathText text={m.text} /> : m.text}</p>
            {m.rung === 2 && hintVisual && (
              <div className="msg-visual">
                <VisualView visual={hintVisual} lang={lang} size={variant === 'kids' ? 260 : undefined} />
              </div>
            )}
            {m.from === 'tutor' && m.kind !== 'intro' && (
              <div className={`msg-source ${m.source === 'ai' ? 'is-ai' : ''}`}>
                {m.source === 'ai' ? t('sourceAi') : t('sourceCurated')}
                {m.rung ? ` · ${[t('rung1'), t('rung2'), t('rung3'), t('rung4')][m.rung - 1]}` : ''}
              </div>
            )}
          </div>
        </div>
      ))}
      {busy && (
        <div className="msg msg-tutor msg-typing" role="status">
          <div className="msg-avatar" aria-hidden="true">{variant === 'kids' ? <Owl size={40} mood="think" /> : <Logo size={26} />}</div>
          <div className="msg-body">
            <span className="dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="sr-only">{variant === 'kids' ? t('zukkoThinking') : t('tutorThinking')}</span>
          </div>
        </div>
      )}
      <div ref={end} />
    </div>
  );
}

interface PanelProps {
  problem: GuidedProblem;
  /** Illustration shown with the problem before any hint. */
  illustration?: Visual;
  onSolved?: (state: LadderState) => void;
  onLadder?: (state: LadderState) => void;
  solvedFooter?: ReactNode;
}

/* ---------------- Grades 1–4 ---------------- */

export function KidsTutor({ problem, illustration, onSolved, onLadder, solvedFooter }: PanelProps) {
  const { lang, t, session } = useStore();
  const tutor = useTutor({ problem, lang, intro: t('tryFirstKids'), aiEnabled: Boolean(session?.ai), onSolved, onLadder });
  const [value, setValue] = useState('');
  const [wrongChoices, setWrongChoices] = useState<string[]>([]);
  const { ladder } = tutor;

  const submitNumber = async () => {
    if (!value || tutor.busy) return;
    const ev = await tutor.submit({ kind: 'numbers', values: { n: value } }, value);
    telegram.haptic(ev.status === 'correct' ? 'success' : 'warning');
    if (ev.status !== 'correct') setValue('');
  };

  const submitChoice = async (id: string, label: string) => {
    if (tutor.busy || ladder.solved) return;
    const ev = await tutor.submit({ kind: 'choice', choice: id }, label);
    telegram.haptic(ev.status === 'correct' ? 'success' : 'warning');
    if (ev.status === 'incorrect') setWrongChoices((w) => [...w, id]);
  };

  return (
    <div className="tutor tutor-kids">
      <div className="problem-card">
        <p className="problem-text">{tx(problem.prompt, lang)}</p>
        {illustration && (
          <div className="problem-visual">
            <VisualView visual={illustration} size={280} />
          </div>
        )}
      </div>

      {ladder.attempts > 0 ? <LadderMeter level={ladder.hintLevel} variant="kids" /> : <p className="fine-print center">{t('hintsFree')}</p>}
      <Thread messages={tutor.messages} busy={tutor.busy} variant="kids" hintVisual={problem.hintVisual} lang={lang} />

      {ladder.solved ? (
        <div className="solved-footer">{solvedFooter}</div>
      ) : (
        <div className="answer-dock">
          {problem.input.kind === 'numbers' ? (
            <>
              <div className="answer-row">
                <div className={`answer-display ${value ? '' : 'empty'}`} aria-live="polite" aria-label={t('yourAnswer')}>
                  {value || '?'}
                </div>
                <button className="key key-del" disabled={!value} onClick={() => setValue((v) => v.slice(0, -1))} aria-label="Delete">
                  ⌫
                </button>
                <button className="btn btn-kids" disabled={!value || tutor.busy} onClick={submitNumber}>
                  {t('check')}
                </button>
              </div>
              <Keypad
                label={t('yourAnswer')}
                keys={['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']}
                onKey={(k) => setValue((v) => (v.length >= 3 ? v : v + k))}
              />
            </>
          ) : (
            <div className="choice-row">
              {problem.input.choices.map((c) => {
                const label = c.label ? tx(c.label, lang) : c.id;
                return (
                  <button
                    key={c.id}
                    className={`choice-btn ${wrongChoices.includes(c.id) ? 'is-wrong' : ''}`}
                    disabled={tutor.busy || wrongChoices.includes(c.id)}
                    onClick={() => submitChoice(c.id, label)}
                  >
                    <MathLabel text={label} />
                  </button>
                );
              })}
            </div>
          )}
          {tutor.canHint && (
            <button className="btn btn-hint" disabled={tutor.busy} onClick={tutor.hint}>
              {Icon.bulb} {ladder.hintLevel === 3 ? t('showHow') : t('hintBtn')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Grades 5–11 ---------------- */

const MINUS = '−';

export function AcadTutor({ problem, onSolved, onLadder, solvedFooter, points, solvedLine }: PanelProps & { points: { x: number; y: number; label: string }[]; solvedLine: { k: number; b: number } }) {
  const { lang, t, session } = useStore();
  const tutor = useTutor({ problem, lang, intro: t('tryFirstAcad'), aiEnabled: Boolean(session?.ai), onSolved, onLadder });
  const fields = problem.input.kind === 'numbers' ? problem.input.fields : [];
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.id, ''])));
  const [active, setActive] = useState(fields[0]?.id ?? '');
  const [question, setQuestion] = useState('');
  const [attemptLine, setAttemptLine] = useState<{ k: number; b: number } | null>(null);
  const { ladder } = tutor;
  const decimal = lang === 'en' ? '.' : ',';

  const press = (key: string) => {
    setValues((v) => {
      const cur = v[active] ?? '';
      let next = cur;
      if (key === '⌫') next = cur.slice(0, -1);
      else if (key === MINUS) next = cur.startsWith(MINUS) ? cur.slice(1) : MINUS + cur;
      else if (cur.length < 6) next = cur + key;
      return { ...v, [active]: next };
    });
  };

  const submit = async () => {
    if (tutor.busy) return;
    const display = fields.map((f) => `${typeof f.label === 'string' ? f.label : tx(f.label, lang)} = ${values[f.id] || '?'}`).join(', ');
    const ev = await tutor.submit({ kind: 'numbers', values }, display);
    if (ev.status === 'invalid') {
      telegram.haptic('error');
      const firstBad = fields.find((f) => ev.fields?.[f.id] === 'invalid');
      if (firstBad) setActive(firstBad.id);
      return;
    }
    telegram.haptic(ev.status === 'correct' ? 'success' : 'warning');
    const k = parseNumber(values.k ?? '');
    const b = parseNumber(values.b ?? '');
    if (ev.status === 'incorrect' && k !== null && b !== null) setAttemptLine({ k, b });
  };

  const allFilled = fields.every((f) => (values[f.id] ?? '').length > 0);
  const showDelta = ladder.hintLevel >= 2 || ladder.solved;
  const [c, d] = points;

  return (
    <div className="tutor tutor-academic">
      <div className="problem-card">
        <p className="problem-text">{tx(problem.prompt, lang)}</p>
        <div className="plane-wrap">
          <CoordinatePlane
            k={ladder.solved ? solvedLine.k : 0}
            b={ladder.solved ? solvedLine.b : 0}
            lang={lang}
            showLine={ladder.solved}
            ghost={!ladder.solved ? attemptLine : null}
            points={points.map((p) => ({ ...p, label: `${p.label}${pt(p.x, p.y, lang)}`, tone: 'accent' as const }))}
            delta={showDelta ? { from: [c.x, c.y], to: [d.x, d.y] } : null}
            label={tx(problem.prompt, lang)}
          />
          {attemptLine && !ladder.solved && (
            <p className="plane-caption">
              <span className="swatch swatch-ghost" /> {lineEq(attemptLine.k, attemptLine.b, lang)}
            </p>
          )}
          {ladder.solved && (
            <p className="plane-caption">
              <span className="swatch swatch-main" /> {lineEq(solvedLine.k, solvedLine.b, lang)}
            </p>
          )}
        </div>
      </div>

      <Thread messages={tutor.messages} busy={tutor.busy} variant="academic" lang={lang} />
      {!ladder.solved && session?.ai && (
        <form
          className="ask-row"
          onSubmit={(e) => {
            e.preventDefault();
            void tutor.ask(question, t('askUnavailable'));
            setQuestion('');
          }}
        >
          <input
            type="text"
            value={question}
            maxLength={QUESTION_MAX_CHARS}
            placeholder={t('askPlaceholder')}
            onChange={(e) => setQuestion(e.target.value)}
            aria-label={t('askPlaceholder')}
          />
          <button className="icon-btn icon-btn-solid" type="submit" disabled={!question.trim() || tutor.busy} aria-label={t('ask')}>
            {Icon.send}
          </button>
        </form>
      )}

      {ladder.solved ? (
        <div className="solved-footer">{solvedFooter}</div>
      ) : (
        <div className="answer-dock">
          <div className="field-row">
            {fields.map((f) => {
              const label = typeof f.label === 'string' ? f.label : tx(f.label, lang);
              const invalid = tutor.lastEval?.status === 'invalid' && tutor.lastEval.fields?.[f.id] === 'invalid';
              return (
                <button key={f.id} className={`field ${active === f.id ? 'active' : ''} ${invalid ? 'invalid' : ''} field-${f.id}`} onClick={() => setActive(f.id)} aria-pressed={active === f.id}>
                  <span className="field-label">{label} =</span>
                  <span className="field-value">{values[f.id] || ' '}</span>
                </button>
              );
            })}
            <button className="btn btn-acad" disabled={!allFilled || tutor.busy} onClick={submit}>
              {t('check')}
            </button>
          </div>
          <Keypad label={t('answerLabel')} keys={['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', MINUS, decimal, '/', '⌫']} onKey={press} />
          <div className="dock-actions">
            {tutor.canHint && (
              <button className="btn btn-outline" disabled={tutor.busy} onClick={tutor.hint}>
                {Icon.bulb} {ladder.hintLevel === 3 ? t('rung4') : `${t('hintBtn')} ${Math.min(ladder.hintLevel + 1, 4)}/4`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
