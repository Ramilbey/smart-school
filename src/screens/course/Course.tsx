import { useMemo, useState, type ReactNode } from 'react';
import { ROUND, explainWhy, hashString, nextTopic, questionFor, subjects, subjectsForGrade, topicById, topicsOf, visualSvg, type Visual } from '../../../shared/curriculum/index.ts';
import { freshStudy, xpFor } from '../../../shared/progress.ts';
import { Confetti, Icon, TopBar } from '../../components/Chrome.tsx';
import { useNav } from '../../lib/nav.tsx';
import { recordAnswer, useStore } from '../../lib/store.tsx';
import { telegram } from '../../lib/telegram.ts';
import { AcadStats } from '../academic/AcadSection.tsx';
import { Explorer, isExplorable } from '../../components/Explorers.tsx';

/** The Grade 6–7 textbook course: the same lessons and practice as the Telegram chat, sharing one progress record. */

/** Lesson text uses only <b> and <i>; everything else stays plain text, so nothing can inject markup. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(<\/?(?:b|i)>)/);
  const out: ReactNode[] = [];
  let bold = false, italic = false;
  parts.forEach((part, i) => {
    if (part === '<b>') bold = true;
    else if (part === '</b>') bold = false;
    else if (part === '<i>') italic = true;
    else if (part === '</i>') italic = false;
    else if (part) out.push(bold ? <b key={i}>{part}</b> : italic ? <i key={i}>{part}</i> : <span key={i}>{part}</span>);
  });
  return <>{out}</>;
}

function Picture({ visual }: { visual: Visual }) {
  const { lang } = useStore();
  // The SVG comes from our own generator, which escapes every label.
  return <div className="course-pic" aria-hidden="true" dangerouslySetInnerHTML={{ __html: visualSvg(visual, lang) }} />;
}

/** Three small stars: filled for each one earned on a topic. */
function Stars({ n }: { n: number }) {
  return (
    <span className="toc-stars" aria-label={`${n}/3`}>
      {[0, 1, 2].map((i) => (
        <svg key={i} viewBox="-62 -62 124 124" aria-hidden="true">
          <polygon points="0,-60 15.28,-21.04 57.06,-18.54 24.73,8.03 35.27,48.54 0,26 -35.27,48.54 -24.73,8.03 -57.06,-18.54 -15.28,-21.04" fill={i < n ? '#ffb547' : '#e7ecf8'} stroke={i < n ? '#b9791a' : '#cfd8ee'} strokeWidth="6" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

/** Share of a subject's topics that already have at least one star, drawn as a ring. */
function Ring({ value }: { value: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <svg className="spine-ring" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="6" />
      <circle cx="22" cy="22" r={r} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 22 22)" />
    </svg>
  );
}
const SPINE: Record<string, string> = { math6: 'spine-lapis', algebra7: 'spine-red', geometry7: 'spine-teal', physics7: 'spine-amber' };

export function Course() {
  const { t, lang, progress, update } = useStore();
  const nav = useNav();
  const grade = progress.bot?.grade ?? 7;
  const [picked, setPicked] = useState<string>(() => subjectsForGrade(grade)[0]?.id ?? subjects[0].id);
  const subject = subjects.find((s) => s.id === picked) ?? subjects[0];
  const list = topicsOf(subject.id);
  const nextUp = list.find((tp) => !(progress.bot?.topics?.[tp.id]?.stars ?? 0));

  const pick = (id: string, g: 6 | 7) => {
    telegram.haptic('select');
    setPicked(id);
    update((p) => {
      p.bot = { ...freshStudy(), ...p.bot, grade: g };
    });
  };

  return (
    <main className="screen academic course">
      <TopBar title={t('courseTitle')} right={<AcadStats />} settings={false} />
      <div className="scroll">
        <div className="shelf-books" role="group" aria-label={t('courseTitle')}>
          {subjects.map((s) => (
            <button key={s.id} className={`spine ${SPINE[s.id] ?? ''} ${s.id === subject.id ? 'on' : ''}`} aria-pressed={s.id === subject.id} onClick={() => pick(s.id, s.grade)}>
              <span className="spine-title">{s.title[lang]} {s.grade}</span>
              <Ring value={(() => { const ts = topicsOf(s.id); return ts.length ? ts.filter((tp) => (progress.bot?.topics?.[tp.id]?.stars ?? 0) > 0).length / ts.length : 0; })()} />
            </button>
          ))}
        </div>

        <section className="toc" aria-labelledby="toc-title">
          <div className="toc-head">
            <h2 id="toc-title">{subject.title[lang]} {subject.grade}</h2>
            <span className="toc-sub">{t('contents')}</span>
          </div>
          <div className="toc-list">
            {list.map((topic, idx) => {
              const earned = progress.bot?.topics?.[topic.id]?.stars ?? 0;
              const isNext = topic === nextUp;
              return (
                <button key={topic.id} className={`toc-row ${isNext ? 'is-next' : ''} ${earned > 0 ? 'done' : ''}`} onClick={() => nav.push({ name: 'course-topic', topic: topic.id })}>
                  <span className="toc-node" aria-hidden="true">{earned > 0 ? Icon.check : idx + 1}</span>
                  <span className="toc-name">{topic.title[lang]}</span>
                  {earned > 0 ? <Stars n={earned} /> : isNext ? <span className="toc-next">{t('nextUp')} {Icon.arrow}</span> : null}
                </button>
              );
            })}
          </div>
          <p className="toc-book">{t('courseBook', { book: subject.book })}</p>
        </section>
        <p className="under-plane">{t('courseDraft')}</p>
      </div>
    </main>
  );
}

export function CourseTopic({ topicId }: { topicId: string }) {
  const { t, lang, update } = useStore();
  const nav = useNav();
  const topic = topicById(topicId);
  const [phase, setPhase] = useState<'cards' | 'quiz' | 'done'>('cards');
  const [card, setCard] = useState(0);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const [settled, setSettled] = useState<'right' | 'shown' | null>(null);
  const [right, setRight] = useState(0);
  const [xp, setXp] = useState(0);
  const q = useMemo(() => (topic ? questionFor(topic, seed, i) : null), [topic, seed, i]);

  if (!topic || !q) {
    return (
      <main className="screen academic">
        <TopBar title={t('courseTitle')} settings={false} />
      </main>
    );
  }

  const startRound = () => {
    setSeed(Math.floor(Math.random() * 1_000_000));
    setI(0);
    setRight(0);
    setXp(0);
    setWrong([]);
    setHints(0);
    setSettled(null);
    setPhase('quiz');
  };

  const pick = (choice: number) => {
    if (settled || wrong.includes(choice)) return;
    const correct = choice === q.correct;
    telegram.haptic(correct ? 'success' : 'warning');
    if (!correct && wrong.length < 2) {
      setWrong([...wrong, choice]);
      setHints(Math.max(hints, Math.min(2, wrong.length + 1)));
      return;
    }
    const tries = correct ? wrong.length : 3;
    const earned = xpFor(tries);
    const key = hashKey(topic.id, seed, i);
    update((p) => {
      p.bot = { ...freshStudy(), ...p.bot };
      recordAnswer(p, topic.id, key, tries);
    });
    if (correct && tries === 0) setRight((r) => r + 1);
    setXp((v) => v + earned);
    if (!correct) setWrong([...wrong, choice]);
    setSettled(correct ? 'right' : 'shown');
  };

  const nextQuestion = () => {
    if (i + 1 >= ROUND) {
      const stars = right >= ROUND ? 3 : right >= ROUND - 2 ? 2 : 1;
      update((p) => {
        p.bot = { ...freshStudy(), ...p.bot };
        const prev = p.bot.topics[topic.id] ?? { answered: 0, right: 0, stars: 0, rounds: 0, lastAt: 0 };
        p.bot.topics[topic.id] = { ...prev, stars: Math.max(prev.stars, stars), rounds: prev.rounds + 1, lastAt: Date.now() };
      });
      setPhase('done');
      return;
    }
    setI(i + 1);
    setWrong([]);
    setHints(0);
    setSettled(null);
  };

  const next = nextTopic(topic.id);
  const earnedStars = right >= ROUND ? 3 : right >= ROUND - 2 ? 2 : 1;

  return (
    <main className="screen academic course">
      <TopBar title={topic.title[lang]} right={<AcadStats />} settings={false} />
      <div className="scroll" key={`${phase}-${i}-${card}`}>
        {phase === 'cards' && (
          <>
            <section className="panel course-card">
              <div className="course-card-top">
                <span className="under-plane course-book">{topic.book[lang]}</span>
                <span className="dots-row">
                  {topic.cards.map((_, n) => <i key={n} className={n < card ? 'done' : n === card ? 'on' : ''} />)}
                </span>
              </div>
              {topic.cards[card].visual && (isExplorable(topic.cards[card].visual!, topic.id) ? <Explorer visual={topic.cards[card].visual!} topicId={topic.id} /> : <Picture visual={topic.cards[card].visual!} />)}
              <p className="course-text"><Rich text={topic.cards[card].text[lang]} /></p>
            </section>
            <div className="dock">
              {card + 1 < topic.cards.length ? (
                <button className="btn btn-acad btn-block" onClick={() => setCard(card + 1)}>{t('nextStep')} {Icon.arrow}</button>
              ) : (
                <button className="btn btn-acad btn-block" onClick={startRound}>{t('coursePractice')} {Icon.arrow}</button>
              )}
              {card + 1 < topic.cards.length && <button className="course-skip" onClick={startRound}>{t('courseSkip')}</button>}
            </div>
          </>
        )}

        {phase === 'quiz' && (
          <>
            <section className="qcard" aria-live="polite">
              <p className="qcard-label">
                {topic.emoji} {i + 1} / {ROUND}
                <span className="dots-row qcard-count" aria-label={`${i + 1}/${ROUND}`}>
                  {Array.from({ length: ROUND }, (_, n) => <i key={n} className={n < i ? 'done' : n === i ? 'on' : ''} />)}
                </span>
              </p>
              <h2 className="qcard-q"><Rich text={q.prompt[lang]} /></h2>
            </section>
            {q.visual && <section className="panel course-card"><Picture visual={q.visual} /></section>}
            <section className="panel step-card" aria-live="polite">
              <div className={`choices choices-compact ${q.choices.every((c) => c[lang].length <= 14) ? '' : 'course-long'}`} role="group">
                {q.choices.map((c, n) => {
                  const state = settled ? (n === q.correct ? 'is-correct' : wrong.includes(n) ? 'is-wrong' : 'is-dim') : wrong.includes(n) ? 'is-wrong' : '';
                  return (
                    <button key={n} className={`choice ${state}`} disabled={Boolean(settled) || wrong.includes(n)} onClick={() => pick(n)}>
                      <span className="choice-label">{c[lang]}</span>
                    </button>
                  );
                })}
              </div>
              {!settled && hints > 0 && (
                <div className="course-hints">
                  {q.hints.slice(0, hints).map((h, n) => <p key={n}>💡 <Rich text={h[lang]} /></p>)}
                </div>
              )}
              {!settled && hints < 2 && (
                <button className="btn btn-outline" onClick={() => setHints(hints + 1)}>{Icon.bulb} {t('hintBtn')}</button>
              )}
              {settled && (
                <div className="reveal">
                  <p className={`verdict ${settled === 'right' ? 'good' : 'warn'}`}>
                    {settled === 'right' ? `${t('great')}${wrong.length < 3 ? ` +${xpFor(wrong.length)} XP` : ''}` : t('courseShown')}
                  </p>
                  <p className="reveal-text course-text"><Rich text={explainWhy(q, lang)} /></p>
                </div>
              )}
            </section>
            {settled && (
              <div className="dock">
                <button className="btn btn-acad btn-block" onClick={nextQuestion}>{i + 1 >= ROUND ? t('courseResult') : t('nextStep')} {Icon.arrow}</button>
              </div>
            )}
          </>
        )}

        {phase === 'done' && (
          <>
            {earnedStars === 3 && <Confetti />}
            <section className="panel course-done">
              <div className="course-done-stars" aria-label={`${earnedStars}/3`}>{'⭐'.repeat(earnedStars)}</div>
              <h2 className="qcard-q">{right} / {ROUND}</h2>
              <p className="under-plane">{t('courseFirstTry')} · +{xp} XP</p>
            </section>
            <div className="dock course-done-actions">
              {next && <button className="btn btn-acad btn-block" onClick={() => nav.replace({ name: 'course-topic', topic: next.id })}>{next.title[lang]} {Icon.arrow}</button>}
              <button className="btn btn-outline btn-block" onClick={startRound}>{t('courseAgain')}</button>
              <button className="course-skip" onClick={() => nav.back()}>{t('courseTitle')}</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const hashKey = (id: string, seed: number, i: number) => hashString(`${id}:${seed}:${i}`);
