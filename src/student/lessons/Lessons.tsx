import { useMemo, useState, type ReactNode } from 'react';
import { ROUND, explainWhy, hashString, nextTopic, questionFor, subjects, topicById, topicsOf, visualSvgDark, type Topic, type Visual } from '../../../shared/curriculum/index.ts';
import { freshStudy, xpFor } from '../../../shared/progress.ts';
import { recordAnswer, useStore } from '../../lib/store.tsx';
import { Ico } from '../icons.tsx';
import { go, href } from '../route.ts';
import { HOOKS, lt, type LtKey } from './text.ts';

/** Lesson text uses only <b> and <i>; everything else stays plain text, so nothing can inject markup. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(<\/?(?:b|i)>|\n)/);
  const out: ReactNode[] = [];
  let bold = false, italic = false;
  parts.forEach((part, i) => {
    if (part === '<b>') bold = true;
    else if (part === '</b>') bold = false;
    else if (part === '<i>') italic = true;
    else if (part === '</i>') italic = false;
    else if (part === '\n') out.push(<br key={i} />);
    else if (part) out.push(bold ? <b key={i}>{part}</b> : italic ? <i key={i}>{part}</i> : <span key={i}>{part}</span>);
  });
  return <>{out}</>;
}

/** A teaching picture, drawn light-on-dark on a faint grid, like a figure in a modern lab notebook. */
function Figure({ visual }: { visual: Visual }) {
  const { lang } = useStore();
  // The SVG comes from our own generator, which escapes every label.
  return <figure className="ls-fig" dangerouslySetInnerHTML={{ __html: visualSvgDark(visual, lang) }} />;
}

const ACCENT: Record<string, string> = { math6: '#6fa3ff', algebra7: '#ff7d6e', geometry7: '#2fd39c', physics7: '#ffb84d' };
const starsOf = (p: ReturnType<typeof useStore>['progress'], id: string) => p.bot?.topics?.[id]?.stars ?? 0;

function Stars({ n }: { n: number }) {
  return (
    <span className="ls-stars" aria-label={`${n}/3`}>
      {[1, 2, 3].map((i) => <svg key={i} viewBox="0 0 24 24" className={i <= n ? 'on' : ''}><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg>)}
    </span>
  );
}

/** The textbook lessons: a topic grid, and one lesson at a time (a real-life question, short steps with pictures, then practice). */
export function Lessons({ topicId }: { topicId: string | null }) {
  const topic = topicId ? topicById(topicId) : undefined;
  return topic ? <Lesson key={topic.id} topic={topic} /> : <Browse />;
}

function Browse() {
  const { lang, progress, update } = useStore();
  const t = (k: LtKey, v?: Record<string, string | number>) => lt(lang, k, v);
  const grade = progress.bot?.grade ?? 7;
  const [picked, setPicked] = useState<string>(() => (grade === 7 ? 'physics7' : subjects.find((s) => s.grade === grade)?.id) ?? subjects[0].id);
  const subject = subjects.find((s) => s.id === picked) ?? subjects[0];
  const list = topicsOf(subject.id);
  const accent = ACCENT[subject.id] ?? '#6fa3ff';
  const nextUp = list.find((tp) => !starsOf(progress, tp.id)) ?? list[0];
  const hook = nextUp ? HOOKS[nextUp.id] : undefined;
  const doneOf = (id: string) => { const ts = topicsOf(id as never); return ts.filter((tp) => starsOf(progress, tp.id) > 0).length; };

  return (
    <div className="st-page ls-browse">
      <section className="st-card ls-hero" style={{ ['--c' as string]: accent }}>
        <div>
          <span className="ls-chip">{subject.title[lang]} {subject.grade}</span>
          <h2>{t('continue')}</h2>
          <p className="st-lead">{nextUp ? nextUp.title[lang] : ''}</p>
          {hook && <p className="ls-hero-q">“{hook.q[lang]}”</p>}
          {nextUp && <a className="st-main-btn" href={href('lessons', { t: nextUp.id })}>{t('start')}<Ico name="arrow" size={18} /></a>}
        </div>
        <p className="ls-lead-side">{t('pageLead')}</p>
      </section>

      <div className="ls-tabs" role="group" aria-label={lang === 'ru' ? 'Предметы' : lang === 'uz' ? 'Fanlar' : 'Subjects'}>
        {subjects.map((s) => {
          const total = topicsOf(s.id).length, done = doneOf(s.id);
          return (
            <button key={s.id} type="button" aria-pressed={s.id === subject.id} style={{ ['--c' as string]: ACCENT[s.id] }} onClick={() => { setPicked(s.id); update((p) => { p.bot = { ...freshStudy(), ...p.bot, grade: s.grade }; }); }}>
              <b>{s.title[lang]} {s.grade}</b>
              <span><i style={{ width: `${(done / Math.max(total, 1)) * 100}%` }} /></span>
              <em>{done} / {total} {t('done')}</em>
            </button>
          );
        })}
      </div>

      <div className="ls-grid">
        {list.map((tp, i) => {
          const h = HOOKS[tp.id], n = starsOf(progress, tp.id);
          return (
            <a key={tp.id} className={`st-card ls-topic ${tp === nextUp ? 'next' : ''}`} href={href('lessons', { t: tp.id })} style={{ ['--c' as string]: accent }}>
              <span className="ls-num">{n > 0 ? <Ico name="check" size={18} sw={2.6} /> : String(i + 1).padStart(2, '0')}</span>
              <h3>{tp.title[lang]}</h3>
              {h ? <p className="ls-place">{h.place[lang]}</p> : <p className="ls-place">{tp.book[lang]}</p>}
              <div className="ls-topic-foot"><Stars n={n} /><span className="ls-go"><Ico name="play" size={14} />{t(n > 0 ? 'practise' : 'start')}</span></div>
            </a>
          );
        })}
      </div>
      <p className="ls-note">{t('draft')} {t('saved')}</p>
    </div>
  );
}

type Step = { kind: 'hook' } | { kind: 'card'; n: number } | { kind: 'practice' };

function Lesson({ topic }: { topic: Topic }) {
  const { lang } = useStore();
  const t = (k: LtKey, v?: Record<string, string | number>) => lt(lang, k, v);
  const hook = HOOKS[topic.id];
  const steps = useMemo<Step[]>(() => [...(hook ? [{ kind: 'hook' } as Step] : []), ...topic.cards.map((_, n) => ({ kind: 'card', n }) as Step), { kind: 'practice' }], [topic, hook]);
  const [at, setAt] = useState(0);
  const step = steps[at];
  const accent = ACCENT[topic.subject] ?? '#6fa3ff';
  const subject = subjects.find((s) => s.id === topic.subject);
  const label = (s: Step, i: number) => (s.kind === 'hook' ? t('hook') : s.kind === 'practice' ? t('practice') : `${t('learn')} ${hook ? i : i + 1}`);

  return (
    <div className="st-page ls-lesson" style={{ ['--c' as string]: accent }}>
      <section className="st-card ls-stage">
        <header className="ls-head">
          <a className="ls-back" href={href('lessons')} aria-label={t('back')}><Ico name="arrow" size={20} /></a>
          <div className="ls-title"><b>{topic.title[lang]}</b><span>{subject?.title[lang]} {topic.grade} · {topic.book[lang]}</span></div>
        </header>

        {step.kind === 'practice' ? (
          <Practice key="practice" topic={topic} onExit={() => go('lessons')} />
        ) : (
          <div className="ls-body" key={at}>
            {step.kind === 'hook' && hook ? (
              <div className="ls-hook">
                <span className="ls-chip">{t('realLife')}</span>
                <h2>{hook.q[lang]}</h2>
                <div className="ls-answer"><small>{t('byTheEnd')}</small><p>{hook.a[lang]}</p></div>
              </div>
            ) : step.kind === 'card' ? (
              <div className={`ls-card ${topic.cards[step.n].visual ? 'with-fig' : ''}`}>
                {topic.cards[step.n].visual && <Figure visual={topic.cards[step.n].visual!} />}
                <p className="ls-text"><Rich text={topic.cards[step.n].text[lang]} /></p>
              </div>
            ) : null}
          </div>
        )}

        {step.kind !== 'practice' && (
          <footer className="ls-foot">
            <button type="button" className="ls-ghost" disabled={at === 0} onClick={() => setAt(at - 1)}>{t('prev')}</button>
            <button type="button" className="st-main-btn" onClick={() => setAt(at + 1)} autoFocus>
              {step.kind === 'hook' ? t('letsSee') : at + 2 === steps.length ? t('practice') : t('next')}<Ico name="arrow" size={18} />
            </button>
          </footer>
        )}
      </section>

      <aside className="ls-side">
        <section className="st-card">
          <h3>{t('path')}</h3>
          <ol className="ls-path">
            {steps.map((s, i) => (
              <li key={i} className={i === at ? 'now' : i < at ? 'past' : ''}>
                <button type="button" onClick={() => setAt(i)}><span className="dot">{i < at ? <Ico name="check" size={14} sw={3} /> : i + 1}</span>{label(s, i)}</button>
              </li>
            ))}
          </ol>
        </section>
        {hook && (
          <section className="st-card ls-place-card">
            <h3>{t('whyMatters')}</h3>
            <p>{hook.place[lang]}</p>
          </section>
        )}
        <p className="ls-note">{t('draft')}</p>
        <p className="ls-note">{t('saved')}</p>
      </aside>
    </div>
  );
}

function Practice({ topic, onExit }: { topic: Topic; onExit: () => void }) {
  const { lang, update } = useStore();
  const t = (k: LtKey, v?: Record<string, string | number>) => lt(lang, k, v);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const [settled, setSettled] = useState<'right' | 'shown' | null>(null);
  const [right, setRight] = useState(0);
  const [xp, setXp] = useState(0);
  const [marks, setMarks] = useState<('first' | 'second' | 'shown')[]>([]);
  const [done, setDone] = useState(false);
  const q = useMemo(() => questionFor(topic, seed, i), [topic, seed, i]);
  const next = nextTopic(topic.id);

  const pick = (choice: number) => {
    if (settled || wrong.includes(choice)) return;
    const correct = choice === q.correct;
    if (!correct && wrong.length < 2) { setWrong([...wrong, choice]); setHints(Math.max(hints, Math.min(2, wrong.length + 1))); return; }
    const tries = correct ? wrong.length : 3;
    const key = hashString(`${topic.id}:${seed}:${i}`);
    update((p) => { p.bot = { ...freshStudy(), ...p.bot }; recordAnswer(p, topic.id, key, tries); });
    if (correct && tries === 0) setRight((r) => r + 1);
    setXp((v) => v + xpFor(tries));
    setMarks((m) => [...m, correct ? (tries === 0 ? 'first' : 'second') : 'shown']);
    if (!correct) setWrong([...wrong, choice]);
    setSettled(correct ? 'right' : 'shown');
  };

  const advance = () => {
    if (i + 1 >= ROUND) {
      const stars = right >= ROUND ? 3 : right >= ROUND - 2 ? 2 : 1;
      update((p) => {
        p.bot = { ...freshStudy(), ...p.bot };
        const prev = p.bot.topics[topic.id] ?? { answered: 0, right: 0, stars: 0, rounds: 0, lastAt: 0 };
        p.bot.topics[topic.id] = { ...prev, stars: Math.max(prev.stars, stars), rounds: prev.rounds + 1, lastAt: Date.now() };
      });
      setDone(true);
      return;
    }
    setI(i + 1); setWrong([]); setHints(0); setSettled(null);
  };
  const again = () => { setSeed(Math.floor(Math.random() * 1_000_000)); setI(0); setRight(0); setXp(0); setWrong([]); setHints(0); setSettled(null); setMarks([]); setDone(false); };

  if (done) {
    const stars = right >= ROUND ? 3 : right >= ROUND - 2 ? 2 : 1;
    return (
      <div className="ls-body ls-result">
        <div className="ls-bigstars"><Stars n={stars} /></div>
        <h2>{t('result')}</h2>
        <p className="ls-score"><b>{right}</b> / {ROUND} <small>{t('firstTry')}</small></p>
        <p className="ls-xp">+{xp} XP</p>
        <div className="ls-foot center">
          <button type="button" className="ls-ghost" onClick={again}>{t('again')}</button>
          {next ? <a className="st-main-btn" href={href('lessons', { t: next.id })}>{t('nextTopic')}: {next.title[lang]}<Ico name="arrow" size={18} /></a> : <button type="button" className="st-main-btn" onClick={onExit}>{t('back')}</button>}
        </div>
      </div>
    );
  }

  const long = !q.choices.every((c) => c[lang].length <= 16);
  return (
    <div className="ls-body ls-quiz">
      <div className="ls-qtop">
        <span>{t('question', { n: i + 1, total: ROUND })}</span>
        <div className="ls-prog" aria-hidden="true">{Array.from({ length: ROUND }, (_, n) => <i key={n} className={n < marks.length ? marks[n] : n === i ? 'now' : ''} />)}</div>
      </div>
      <h2 className="ls-q"><Rich text={q.prompt[lang]} /></h2>
      {q.visual && <Figure visual={q.visual} />}
      <div className={`ls-choices ${long ? 'long' : ''}`} role="group">
        {q.choices.map((c, n) => {
          const state = settled ? (n === q.correct ? 'right' : wrong.includes(n) ? 'wrong' : 'dim') : wrong.includes(n) ? 'wrong' : '';
          return <button key={n} type="button" className={`ls-choice ${state}`} disabled={Boolean(settled) || wrong.includes(n)} onClick={() => pick(n)}>{c[lang]}</button>;
        })}
      </div>
      <div className={`ls-fb ${settled ?? (wrong.length ? 'hint' : '')}`} role="status" aria-live="polite">
        {!settled && wrong.length > 0 && <p><b>{t('notYet')}</b></p>}
        {!settled && hints > 0 && q.hints.slice(0, hints).map((h, n) => <p key={n}><Ico name="spark" size={16} /> <Rich text={h[lang]} /></p>)}
        {!settled && hints < 2 && <button type="button" className="ls-ghost sm" onClick={() => setHints(hints + 1)}>{t('hint')}</button>}
        {settled && <><p><b>{t(settled === 'right' ? 'right' : 'shown')}</b></p><p className="ls-why"><Rich text={explainWhy(q, lang)} /></p><button type="button" className="st-main-btn" onClick={advance} autoFocus>{t(i + 1 >= ROUND ? 'seeResult' : 'next')}<Ico name="arrow" size={18} /></button></>}
      </div>
    </div>
  );
}
