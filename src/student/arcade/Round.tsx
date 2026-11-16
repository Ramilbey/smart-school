import { useRef, useState } from 'react';
import { GAME_GRADES, MAX_LEVEL, ROUND, check, makeQuestion, mastery, record, rng, skillKey, starsFor, step, type Answer, type ArcadeState, type GameId, type Miss, type Pace, type Question } from '../../../shared/arcade.ts';
import { track } from '../../lib/track.ts';
import { useStore } from '../../lib/store.tsx';
import { Ico } from '../icons.tsx';
import { href } from '../route.ts';
import { ArraysBoard, FractionsBoard, MakeTenBoard, NumLineBoard, PlaceBoard, StoriesBoard, type Mode } from './Boards.tsx';
import { GAME_TEXT, at, hintText, missLabel, whyText, type ArKey } from './text.ts';

type Status = 'ask' | 'hint' | 'right' | 'shown';
type Mark = 'first' | 'second' | 'shown';

/** One round of a game: eight questions, a hint and a second try after a mistake, and a level that follows the child. */
export function Round({ game, state, update }: { game: GameId; state: ArcadeState; update: (fn: (s: ArcadeState) => ArcadeState) => void }) {
  const { lang } = useStore();
  const t = (k: ArKey, v?: Record<string, string | number>) => at(lang, k, v);
  const text = GAME_TEXT[game];
  const rand = useRef(rng((Date.now() ^ (Math.random() * 1e9)) >>> 0)).current;
  const startLevel = useRef(state.level[game] ?? 1).current;

  const [pace, setPace] = useState<Pace>({ level: startLevel, up: 0, down: 0 });
  const [q, setQ] = useState<Question>(() => makeQuestion(game, startLevel, rand));
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<Status>('ask');
  const [phase, setPhase] = useState(0);
  const [tries, setTries] = useState(0);
  const [miss, setMiss] = useState<Miss | null>(null);
  const [given, setGiven] = useState<unknown>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [moved, setMoved] = useState<-1 | 0 | 1>(0);
  const [seen, setSeen] = useState<Miss[]>([]);
  const [touched, setTouched] = useState<number[]>([]);
  const finished = idx >= ROUND;

  /** The question is over (right, or shown after two misses): remember it and move the level. */
  const close = (firstTry: boolean, mark: Mark, lastMiss: Miss | null) => {
    const next = step(pace, firstTry);
    setMoved(next.moved);
    setPace({ level: next.level, up: next.up, down: next.down });
    setMarks((m) => [...m, mark]);
    setTouched((l) => (l.includes(q.level) ? l : [...l, q.level]));
    update((s) => ({ ...record(s, game, q.level, firstTry, firstTry ? undefined : lastMiss ?? undefined), level: { ...s.level, [game]: next.level } }));
  };

  const onAnswer = (ans: Answer) => {
    if (status === 'right' || status === 'shown') return;
    const v = check(q, ans);
    if (v.partial && v.ok) { setPhase(1); setStatus('ask'); setMiss(null); return; }
    if (v.ok) { setStatus('right'); close(tries === 0, tries === 0 ? 'first' : 'second', miss); return; }
    const m = v.miss ?? null;
    if (m && tries === 0) setSeen((x) => [...x, m]); // one mistake per question in the summary: the first one
    setMiss(m); setGiven(ans);
    if (tries >= 1) { setStatus('shown'); if (v.partial) setPhase(1); close(false, 'shown', m); }
    else { setTries(1); setStatus('hint'); }
  };

  const next = () => {
    const n = idx + 1;
    setIdx(n);
    if (n >= ROUND) {
      const first = marks.filter((m) => m === 'first').length;
      update((s) => ({ ...s, rounds: s.rounds + 1, stars: { ...s.stars, [game]: Math.max(s.stars[game] ?? 0, starsFor(first, ROUND)) } }));
      track({ kind: 'game' });
      return;
    }
    setQ(makeQuestion(game, pace.level, rand));
    setStatus('ask'); setPhase(0); setTries(0); setMiss(null); setGiven(null); setMoved(0);
  };

  const restart = () => {
    setIdx(0); setMarks([]); setSeen([]); setTouched([]); setMoved(0);
    setQ(makeQuestion(game, pace.level, rand));
    setStatus('ask'); setPhase(0); setTries(0); setMiss(null); setGiven(null);
  };

  const mode: Mode = status === 'ask' ? 'ask' : status === 'hint' ? 'hint' : 'done';
  const board = (() => {
    const p = { lang, mode, phase, onAnswer };
    switch (q.game) {
      case 'numline': return <NumLineBoard key={idx} q={q} {...p} />;
      case 'maketen': return <MakeTenBoard key={idx} q={q} {...p} />;
      case 'place': return <PlaceBoard key={idx} q={q} {...p} />;
      case 'arrays': return <ArraysBoard key={idx} q={q} {...p} />;
      case 'fractions': return <FractionsBoard key={idx} q={q} {...p} />;
      case 'stories': return <StoriesBoard key={idx} q={q} {...p} />;
    }
  })();

  const [g0, g1] = GAME_GRADES[game];
  const side = (
    <aside className="ar-side">
      <section className="st-card ar-meter">
        <h3>{t('follows')}</h3>
        <div className="ar-levels" aria-label={t('levelOf', { n: pace.level, max: MAX_LEVEL })}>
          {Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i + 1 === pace.level ? 'on' : i + 1 < pace.level ? 'past' : ''}><b>{i + 1}</b></i>)}
        </div>
        <p className="ar-lvname">{t('levelOf', { n: pace.level, max: MAX_LEVEL })}: {(text.levels[lang] ?? text.levels.en)[pace.level - 1]}</p>
        {moved !== 0 && <p className={`ar-moved ${moved > 0 ? 'up' : 'down'}`}>{t(moved > 0 ? 'levelUp' : 'levelDown')}</p>}
      </section>
      <section className="st-card ar-why">
        <h3>{t('why')}</h3>
        <p>{text.problem[lang] ?? text.problem.en}</p>
        <div className="ar-chiprow"><span className="ar-chip grade">{t('grades', { a: g0, b: g1 })}</span><span className="ar-chip">{text.skill[lang] ?? text.skill.en}</span></div>
      </section>
    </aside>
  );

  if (finished) {
    const first = marks.filter((m) => m === 'first').length, stars = starsFor(first, ROUND);
    const uniq = [...new Set(seen)];
    return (
      <div className="st-page ar-round">
        <section className="st-card ar-stage ar-done">
          <div className="ar-stars" aria-label={`${stars} / 3`}>{[1, 2, 3].map((i) => <svg key={i} viewBox="0 0 24 24" className={i <= stars ? 'on' : ''} style={{ animationDelay: `${i * 140}ms` }}><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg>)}</div>
          <h2>{t('doneTitle')}</h2>
          <p className="ar-big">{t('doneFirst', { n: first, total: ROUND })}</p>
          <p className="st-lead">{t('doneLevel', { n: pace.level })}: {(text.levels[lang] ?? text.levels.en)[pace.level - 1]}</p>
          <div className="ar-learned">
            <h3>{t('doneLearned')}</h3>
            <ul>
              {[...touched].sort().map((lv) => {
                const st = state.skills[skillKey(game, lv)], m = mastery(st);
                return <li key={lv}><span className={`ar-dot ${m}`} />{(text.levels[lang] ?? text.levels.en)[lv - 1]}<em>{t(m === 'strong' ? 'mStrong' : m === 'help' ? 'mHelp' : 'mPractising')}</em></li>;
              })}
              {uniq.map((m) => <li key={m} className="miss"><span className="ar-dot help" />{missLabel(lang, m)}<em>×{seen.filter((x) => x === m).length}</em></li>)}
            </ul>
          </div>
          <div className="ar-actions center">
            <a className="st-btn ar-ghost" href={href('arcade')}>{t('quit')}</a>
            <button type="button" className="st-main-btn" onClick={restart}>{t('again')}</button>
          </div>
        </section>
        {side}
      </div>
    );
  }

  const over = status === 'right' || status === 'shown';
  return (
    <div className="st-page ar-round">
      <section className={`st-card ar-stage s-${status}`}>
        <header className="ar-top">
          <a className="ar-back" href={href('arcade')} aria-label={t('quit')}><Ico name="arrow" size={20} /></a>
          <div className="ar-name"><b>{text.name[lang] ?? text.name.en}</b><span>{t('question', { n: idx + 1, total: ROUND })}</span></div>
          <div className="ar-prog" aria-hidden="true">{Array.from({ length: ROUND }, (_, i) => <i key={i} className={i < marks.length ? marks[i] : i === idx ? 'now' : ''} />)}</div>
        </header>
        {board}
        <footer className={`ar-fb ${status}`} role="status" aria-live="polite">
          {status === 'hint' && miss && <><span className="ar-fb-ic"><Ico name="spark" size={22} /></span><div><b>{t('tryAgain')}</b><p>{hintText(lang, q, miss, given)}</p></div></>}
          {status === 'right' && <><span className="ar-fb-ic"><Ico name="check" size={22} sw={2.6} /></span><div><b>{t(tries ? 'rightSecond' : 'right')}</b><p>{whyText(lang, q)}</p></div></>}
          {status === 'shown' && <><span className="ar-fb-ic"><Ico name="eye" size={22} /></span><div><b>{t('shown')}</b><p>{miss ? hintText(lang, q, miss === 'st_calc' ? 'st_op' : miss, given) : whyText(lang, q)}</p></div></>}
          {over && <button type="button" className="st-main-btn" onClick={next} autoFocus>{t(idx + 1 >= ROUND ? 'finish' : 'next')}</button>}
        </footer>
      </section>
      {side}
    </div>
  );
}
