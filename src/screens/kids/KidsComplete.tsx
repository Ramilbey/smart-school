import { g4Achievements, g4Meta, g4Quiz, g4Stations, g4Summary } from '../../../shared/lessons/g4Fractions.ts';
import { tx } from '../../../shared/types.ts';
import { Owl, RishtanPlate } from '../../components/Brand.tsx';
import { BadgeIcon, Confetti, Icon, TopBar } from '../../components/Chrome.tsx';
import { useNav } from '../../lib/nav.tsx';
import { useStore } from '../../lib/store.tsx';
import { XpPill } from './KidsHome.tsx';

export function KidsComplete() {
  const { t, lang, progress } = useStore();
  const nav = useNav();
  const done = g4Stations.filter((s) => progress.kids.stations[s.id]).length;
  const complete = done === g4Stations.length;
  const best = progress.kids.quiz.best;
  const stars = best === null ? 0 : best >= 5 ? 3 : best >= 4 ? 2 : best >= 3 ? 1 : 0;
  const earned = g4Achievements.filter((a) => progress.kids.badges.includes(a.id));
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <main className="screen kids kids-complete">
      <TopBar title={tx(g4Meta.mission, lang)} right={<XpPill />} />
      {complete && !reduce && <Confetti count={36} />}
      <div className="scroll">
        <section className="complete-hero plate-hero">
          <div className="plate-stage">
            <RishtanPlate parts={g4Stations.length} painted={done} size={250} fresh={done > 0 ? done - 1 : undefined} label={t('missionProgress', { done, total: g4Stations.length })} />
            <span className="plate-sign">{done}/{g4Stations.length}</span>
            <span className="plate-owl"><Owl size={96} mood={complete ? 'cheer' : 'happy'} /></span>
          </div>
          <h1>{complete ? t('missionComplete') : t('plateTitle')}</h1>
          <p className="complete-sub">{tx(g4Meta.title, lang)}</p>
          <div className="complete-stats">
            <div>
              <b>{progress.kids.xp}</b>
              <span>{t('xp')}</span>
            </div>
            <div>
              <b>{best ?? '–'}<small>/{g4Quiz.length}</small></b>
              <span>{t('quizLabel')}</span>
            </div>
            <div>
              <b className="stars-inline" aria-label={`${stars} ${t('stars')}`}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < stars ? 'on' : ''}>{Icon.star}</span>
                ))}
              </b>
              <span>{t('stars')}</span>
            </div>
          </div>
        </section>

        <section className="card-kids">
          <h2>{t('whatWeLearned')}</h2>
          <ul className="learned">
            {g4Summary.map((s, i) => (
              <li key={i}>
                <span className="learned-dot" aria-hidden="true">{Icon.check}</span>
                {tx(s, lang)}
              </li>
            ))}
          </ul>
        </section>

        {earned.length > 0 && (
          <section className="card-kids">
            <h2>{t('badges')}</h2>
            <div className="shelf-row">
              {earned.map((a) => (
                <div key={a.id} className="shelf-item">
                  <BadgeIcon id={a.id} color={a.color} size={60} />
                  <span>{tx(a.title, lang)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="card-kids card-locked">
          {Icon.lock} <span>{t('nextMission')}</span>
        </section>

        {complete && <p className="break-note">{t('breakTime')}</p>}

        <div className="stack-btns">
          {!complete && (
            <button className="btn btn-kids btn-block" onClick={() => nav.reset([{ name: 'welcome' }, { name: 'grades' }, { name: 'kids-home' }])}>
              {t('backToMap')} {Icon.arrow}
            </button>
          )}
          <button className="btn btn-quiet-kids btn-block" onClick={() => nav.reset([{ name: 'welcome' }, { name: 'grades' }, { name: 'kids-home' }, { name: 'kids-station', station: 'quiz' }])}>
            {t('retakeQuiz')}
          </button>
          {complete && (
            <button className="btn btn-quiet-kids btn-block" onClick={() => nav.reset([{ name: 'welcome' }, { name: 'grades' }, { name: 'kids-home' }])}>
              {t('backToMap')}
            </button>
          )}
          <button className="btn btn-kids btn-block" onClick={nav.home}>
            {t('mainMenu')}
          </button>
        </div>
      </div>
    </main>
  );
}
