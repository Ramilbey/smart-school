import { g7Meta, g7Sections, g7Skills, g7Topics, g7Quiz } from '../../../shared/lessons/g7Linear.ts';
import { tx } from '../../../shared/types.ts';
import { Icon, ProgressBar, TopBar } from '../../components/Chrome.tsx';
import { useNav } from '../../lib/nav.tsx';
import { useStore } from '../../lib/store.tsx';
import { nextSection, skillScores, topicMastery } from './mastery.ts';
import { AcadStats } from './AcadSection.tsx';

export function Formula({ k, b }: { k?: string; b?: string }) {
  return (
    <span className="formula" aria-label={`y = ${k ?? 'k'}x + ${b ?? 'b'}`}>
      <i>y</i> = <b className="k">{k ?? 'k'}</b>
      <i>x</i> + <b className="b">{b ?? 'b'}</b>
    </span>
  );
}

export function AcadHome() {
  const { t, lang, progress } = useStore();
  const nav = useNav();
  const done = g7Sections.filter((s) => progress.acad.sections[s.id]).length;
  const mastery = topicMastery(progress);
  const scores = skillScores(progress);
  const started = done > 0;
  const best = progress.acad.quiz.best;

  return (
    <main className="screen academic acad-home">
      <TopBar title={`${t('gradeN', { n: 7 })} · ${tx(g7Meta.subject, lang)}`} right={<AcadStats />} />
      <div className="scroll">
        <section className="acad-hero">
          <p className="eyebrow-acad">{tx(g7Meta.subject, lang)} · {t('topics')}</p>
          <h1>{tx(g7Meta.title, lang)}</h1>
          <Formula />
          <div className="hero-meta">
            <span>{t('minutes', { n: g7Meta.minutes })}</span>
            <span>{t('sectionsDone', { done, total: g7Sections.length })}</span>
            <span className="draft-tag-acad">{t('contentDraft')}</span>
          </div>
          <ProgressBar value={done / g7Sections.length} label={t('topicProgress')} className="progress-acad" />
          <button className="btn btn-acad btn-block" onClick={() => nav.push({ name: 'acad-section', section: started ? nextSection(progress) : 'overview' })}>
            {started ? t('continueTopic') : t('startTopic')} {Icon.arrow}
          </button>
        </section>

        <section className="panel">
          <h2 className="panel-title">{t('inThisTopic')}</h2>
          <ol className="section-list">
            {g7Sections.map((s, i) => {
              const isDone = Boolean(progress.acad.sections[s.id]);
              return (
                <li key={s.id}>
                  <button className={`section-item ${isDone ? 'done' : ''}`} onClick={() => nav.push({ name: 'acad-section', section: s.id })}>
                    <span className="section-num">{isDone ? Icon.check : i + 1}</span>
                    <span className="section-text">
                      <b>{tx(s.title, lang)}</b>
                      <small>{tx(s.blurb, lang)}</small>
                    </span>
                    <span className="section-go">{Icon.arrow}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="panel">
          <div className="panel-row">
            <h2 className="panel-title">{t('mastery')}</h2>
            <span className="panel-value">{mastery === null ? '–' : `${Math.round(mastery * 100)}%`}</span>
          </div>
          <p className="panel-sub">{best === null ? t('notTaken') : t('quizBest', { score: best, total: g7Quiz.length })}</p>
          <ul className="skill-bars">
            {g7Skills.map((s) => {
              const v = scores[s.id];
              return (
                <li key={s.id}>
                  <span>{tx(s.name, lang)}</span>
                  <ProgressBar value={v ?? 0} label={tx(s.name, lang)} className={v === null ? 'progress-empty' : v >= 1 ? 'progress-good' : v > 0 ? 'progress-mid' : 'progress-low'} />
                  <em>{v === null ? '–' : `${Math.round(v * 100)}%`}</em>
                </li>
              );
            })}
          </ul>
          {best !== null && (
            <button className="btn btn-outline btn-block" onClick={() => nav.push({ name: 'acad-results' })}>
              {t('resultsTitle')} {Icon.arrow}
            </button>
          )}
        </section>

        <section className="panel">
          <h2 className="panel-title">{t('topics')}</h2>
          <ul className="topic-list">
            {g7Topics.map((tp) => (
              <li key={tp.id} className={tp.available ? 'on' : 'off'}>
                <span>{tx(tp.title, lang)}</span>
                {tp.available ? <em>{t('sectionsDone', { done, total: g7Sections.length })}</em> : <em>{Icon.lock} {t('notInPrototype')}</em>}
              </li>
            ))}
          </ul>
          <p className="panel-sub">{t('otherSubjects')}</p>
        </section>
      </div>
    </main>
  );
}
