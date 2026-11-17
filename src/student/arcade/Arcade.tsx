import { GAME_GRADES, GAME_IDS, MAX_LEVEL, gaps, mastery, skillKey, type GameId } from '../../../shared/arcade.ts';
import { useStore } from '../../lib/store.tsx';
import { Ico } from '../icons.tsx';
import { href } from '../route.ts';
import { GameArt } from './Boards.tsx';
import { Round } from './Round.tsx';
import { useArcade } from './store.ts';
import { GAME_TEXT, at, type ArKey } from './text.ts';

const ACC: Record<GameId, string> = { numline: 'acc-blue', maketen: 'acc-amber', place: 'acc-teal', arrays: 'acc-coral', fractions: 'acc-violet', stories: 'acc-blue' };
const isGame = (g: string | null): g is GameId => !!g && (GAME_IDS as string[]).includes(g);

/** The Grades 1–4 games: a hub with six games and a skills map, or one round of a game when a game is chosen (#/arcade?g=…). */
export function Arcade({ game }: { game: string | null }) {
  const { lang } = useStore();
  const { state, update } = useArcade();
  const t = (k: ArKey, v?: Record<string, string | number>) => at(lang, k, v);
  if (isGame(game)) return <Round key={game} game={game} state={state} update={update} />;

  const need = gaps(state);
  const L = <T,>(x: Record<string, T>) => x[lang] ?? x.en!;
  return (
    <div className="st-page ar-hub">
      <section className="st-card ar-hero">
        <div className="ar-hero-t">
          <span className="ar-badge"><Ico name="spark" size={18} />{t('badge')}</span>
          <h2>{t('heroTitle')}</h2>
          <p className="st-lead">{t('heroLead')}</p>
        </div>
        <ul className="ar-pillars">
          <li><span className="st-tile acc-blue"><Ico name="graph" size={22} /></span><div><b>{t('p1t')}</b><p>{t('p1')}</p></div></li>
          <li><span className="st-tile acc-amber"><Ico name="bubble" size={22} /></span><div><b>{t('p2t')}</b><p>{t('p2')}</p></div></li>
          <li><span className="st-tile acc-teal"><Ico name="bars" size={22} /></span><div><b>{t('p3t')}</b><p>{t('p3')}</p></div></li>
        </ul>
      </section>

      <div className="ar-grid">
        {GAME_IDS.map((g) => {
          const [a, b] = GAME_GRADES[g], lv = state.level[g] ?? 1, stars = state.stars[g] ?? 0, tx = GAME_TEXT[g];
          return (
            <a key={g} className={`st-card ar-card ${ACC[g]}`} href={href('arcade', { g })}>
              <div className="ar-card-art"><GameArt game={g} /><span className="ar-chip grade">{t('grades', { a, b })}</span></div>
              <h3>{L(tx.name)}</h3>
              <p className="ar-skill">{L(tx.skill)}</p>
              <p className="ar-problem"><b>{t('solves')}</b>{L(tx.problem)}</p>
              <div className="ar-card-foot">
                <span className="ar-lv" title={t('levelOf', { n: lv, max: MAX_LEVEL })}>{Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}<em>{t('level', { n: lv })}</em></span>
                <span className="ar-ministars" aria-hidden="true">{[1, 2, 3].map((i) => <svg key={i} viewBox="0 0 24 24" className={i <= stars ? 'on' : ''}><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg>)}</span>
                <span className="ar-go"><Ico name="play" size={16} />{t('play')}</span>
              </div>
            </a>
          );
        })}
      </div>

      <div className="ar-two">
        <section className="st-card ar-map">
          <h3>{t('mapTitle')}</h3>
          <p className="st-mute">{t('mapLead')}</p>
          <div className="ar-maprows">
            {GAME_IDS.map((g) => (
              <div key={g} className="ar-maprow">
                <span>{L(GAME_TEXT[g].name)}</span>
                <div>{Array.from({ length: MAX_LEVEL }, (_, i) => {
                  const st = state.skills[skillKey(g, i + 1)], m = mastery(st);
                  return <i key={i} className={m} title={`${L(GAME_TEXT[g].levels)[i]}${st ? ` · ${st.right}/${st.seen}` : ''}`}><b>{i + 1}</b></i>;
                })}</div>
              </div>
            ))}
          </div>
          <div className="ar-legend">
            <span><i className="new" />{t('mNew')}</span><span><i className="practising" />{t('mPractising')}</span><span><i className="strong" />{t('mStrong')}</span><span><i className="help" />{t('mHelp')}</span>
          </div>
        </section>
        <section className="st-card ar-gaps">
          <h3>{t('gapsTitle')}</h3>
          {need.length === 0 ? <p className="st-mute">{t('gapsNone')}</p> : (
            <ul>
              {need.slice(0, 4).map((x) => (
                <li key={`${x.game}${x.level}`}>
                  <span className="ar-dot help" />
                  <div><b>{L(GAME_TEXT[x.game].name)}: {L(GAME_TEXT[x.game].levels)[x.level - 1]}</b><p>{t('gapsRow', { right: x.stat.right, seen: x.stat.seen })}</p></div>
                  <a className="ar-go" href={href('arcade', { g: x.game })}>{t('play')}</a>
                </li>
              ))}
            </ul>
          )}
          <p className="ar-note">{t('rounds', { n: state.rounds })} · {t('mapNote')}</p>
        </section>
      </div>

      <section className="ar-more">
        <h3>{t('moreTitle')}</h3>
        <div>
          <a className="st-card ar-morecard acc-coral" href={href('game')}><span className="st-tile"><Ico name="game" size={24} /></span><div><b>{t('liveTitle')}</b><p>{t('liveSub')}</p></div><Ico name="arrow" size={20} /></a>
        </div>
      </section>
    </div>
  );
}
