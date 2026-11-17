import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Logo } from '../components/Brand.tsx';
import { useStore } from '../lib/store.tsx';
import type { Lang } from '../../shared/types.ts';
import { Arcade } from './arcade/Arcade.tsx';
import { Game } from './Game.tsx';
import { Lessons } from './lessons/Lessons.tsx';
import { Home } from './Home.tsx';
import { Homework } from './Homework.tsx';
import { Ico } from './icons.tsx';
import { go, href, sitePage, useRoute, type RouteName } from './route.ts';
import { ts, type StKey } from './strings.ts';
import { useActivity } from './useActivity.ts';

// the whiteboard screens bring a maths typesetter with them, so they load only when opened
const TutorScreen = lazy(() => import('../screens/tutor/BoardScreen.tsx').then((m) => ({ default: m.TutorScreen })));
const ExplainerScreen = lazy(() => import('../screens/tutor/BoardScreen.tsx').then((m) => ({ default: m.ExplainerScreen })));
// the older practice sections bring their own screens and styles, so they load only when opened
const Legacy = lazy(() => import('./Legacy.tsx').then((m) => ({ default: m.Legacy })));

type Item = { name: RouteName; icon: 'home' | 'tutor' | 'explain' | 'homework' | 'game' | 'star' | 'pie' | 'graph' | 'book'; label: StKey; side: StKey; title: StKey; sub: StKey };
const NAV: Item[] = [
  { name: 'home', icon: 'home', label: 'navHome', side: 'overview', title: 'overview', sub: 'subHome' },
  { name: 'tutor', icon: 'tutor', label: 'navTutor', side: 'navTutor', title: 'navTutorLong', sub: 'subTutor' },
  { name: 'explain', icon: 'explain', label: 'navExplain', side: 'navExplain', title: 'navExplainLong', sub: 'subExplain' },
  { name: 'homework', icon: 'homework', label: 'navHomework', side: 'navHomework', title: 'navHomeworkLong', sub: 'subHomework' },
  { name: 'game', icon: 'game', label: 'navGame', side: 'navGameLong', title: 'navGameLong', sub: 'subGame' },
  { name: 'arcade', icon: 'star', label: 'tabArcade', side: 'navArcade', title: 'navArcade', sub: 'subArcade' },
  { name: 'linear', icon: 'graph', label: 'moreLinear', side: 'moreLinear', title: 'moreLinear', sub: 'moreLinearSub' },
  { name: 'lessons', icon: 'book', label: 'moreLessons', side: 'moreLessons', title: 'moreLessons', sub: 'moreLessonsSub' },
];
/** The bottom bar on a phone has room for five. */
const PHONE: RouteName[] = ['home', 'tutor', 'explain', 'homework', 'arcade'];
const byName = (n: RouteName) => NAV.find((x) => x.name === n)!;
const LANGS: Lang[] = ['en', 'ru', 'uz'];
const LEARN: RouteName[] = ['home', 'tutor', 'explain', 'homework'];
const TIMED: RouteName[] = ['tutor', 'explain', 'homework'];
const DOTS = [[9, 6], [21, 13], [34, 4], [48, 9], [61, 5], [73, 12], [84, 7], [92, 15]];

/** What shows while a lesson screen is still arriving: the same glass layout, resting, with a light moving across it. */
function Skeleton({ explainer, label }: { explainer: boolean; label: string }) {
  return (
    <div className={`st-skel ${explainer ? 'ex' : ''}`} role="status" aria-label={label}>
      <div className="g">
        {explainer && <div className="p"><i style={{ width: '50%' }} /><i /><i style={{ width: '82%' }} /><i style={{ width: '64%' }} /></div>}
        <div className="p board"><Ico name="spark" size={44} sw={1.3} /></div>
        <div className="p"><i style={{ width: '46%' }} /><i /><i style={{ width: '88%' }} /><i style={{ width: '70%' }} /></div>
      </div>
      {!explainer && <div className="p bar" />}
    </div>
  );
}

/** The ask box: a question typed here starts a tutor lesson. */
function AskBar({ t }: { t: (k: StKey) => string }) {
  const [q, setQ] = useState('');
  return (
    <form className="st-ask" onSubmit={(e) => { e.preventDefault(); go('tutor', q.trim().length >= 2 ? { q: q.trim() } : {}); }}>
      <Ico name="search" size={21} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')} maxLength={160} />
      <kbd aria-hidden="true">{t('enter')}</kbd>
    </form>
  );
}

export function StudentApp() {
  const route = useRoute();
  const { lang, setLang, session } = useStore();
  const { activity, addTime } = useActivity();
  const t = (k: StKey) => ts(lang, k);
  const body = useRef<HTMLDivElement>(null);
  const cur = byName(route.name);
  const board = route.name === 'tutor' || route.name === 'explain';
  const [tab, setTab] = useState<'learn' | 'play'>(LEARN.includes(route.name) ? 'learn' : 'play');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${t(cur.title)} · Smart Schools`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, route.name]);
  useEffect(() => { body.current?.scrollTo(0, 0); }, [route.name]);
  useEffect(() => { setTab(LEARN.includes(route.name) ? 'learn' : 'play'); }, [route.name]);

  // time spent in lessons and on homework counts only while the page is open and looked at
  useEffect(() => {
    if (!TIMED.includes(route.name)) return;
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') addTime(10); }, 10000);
    return () => window.clearInterval(id);
  }, [route.name, addTime]);

  const q = route.params.get('q') ?? '';
  const sid = route.params.get('s') ?? undefined;
  const aiOn = !!session?.board;

  let page;
  if (route.name === 'home') page = <Home activity={activity} aiOn={aiOn} />;
  else if (route.name === 'homework') page = <Homework />;
  else if (route.name === 'game') page = <Game initialCode={route.params.get('code') ?? ''} />;
  else if (route.name === 'arcade') page = <Arcade game={route.params.get('g')} />;
  else if (route.name === 'lessons') page = <Lessons topicId={route.params.get('t')} />;
  else if (route.name === 'linear') page = <Suspense fallback={<Skeleton explainer={false} label={t('loading')} />}><Legacy key={route.name} section={route.name} /></Suspense>;
  else if (route.name === 'tutor') page = <Suspense fallback={<Skeleton explainer={false} label={t('loading')} />}><TutorScreen key={`t${q}${sid}`} embedded initialTopic={q} initialSample={sid} /></Suspense>;
  else page = <Suspense fallback={<Skeleton explainer label={t('loading')} />}><ExplainerScreen key={`e${q}${sid}`} embedded initialTopic={q} initialSample={sid} /></Suspense>;

  const link = (n: Item) => (
    <a key={n.name} href={href(n.name)} className="st-link" aria-current={n.name === route.name ? 'page' : undefined}>
      <Ico name={n.icon} size={22} sw={1.6} />
      <span>{t(n.side)}</span>
    </a>
  );

  return (
    <div className="st">
      <div className="st-aur" aria-hidden="true"><i className="b" /><i className="o" /><i className="p" /><i className="fade" /></div>
      <div className="st-stars" aria-hidden="true">{DOTS.map(([x, y], i) => <i key={i} style={{ left: `${x}%`, top: `${y}%`, ['--i' as string]: i }} />)}</div>

      <div className="st-frame">
        <aside className="st-side">
          <a className="st-brand" href={href('home')}>
            <Logo size={34} />
            <span>Smart Schools</span>
          </a>
          <div className="st-tg" role="group" aria-label={t('area')}>
            <button type="button" aria-pressed={tab === 'learn'} onClick={() => setTab('learn')}>{t('tabLearn')}</button>
            <button type="button" aria-pressed={tab === 'play'} onClick={() => setTab('play')}>{t('tabPlay')}</button>
          </div>
          <nav className="st-nav" aria-label={t('area')}>
            {tab === 'learn' ? (
              <>{LEARN.map((n) => link(byName(n)))}</>
            ) : (
              <>
                <a href={href('arcade')} className="st-link st-link-hi" aria-current={route.name === 'arcade' ? 'page' : undefined}>
                  <Ico name="star" size={22} sw={1.6} />
                  <span>{t('navArcade')}</span>
                </a>
                {link(byName('game'))}
                {link(byName('linear'))}
                {link(byName('lessons'))}
              </>
            )}
          </nav>
          <div className="st-side-foot">
            <a className="st-mini" href={sitePage('teacher')}><Ico name="teacher" size={18} /><span>{t('forTeachers')}</span></a>
            <a className="st-mini" href={sitePage('')}><Ico name="site" size={18} /><span>{t('aboutSite')}</span></a>
          </div>
        </aside>

        <div className={`st-main ${board ? 'fill' : ''} ${route.name === 'home' ? 'is-home' : ''}`}>
          <header className="st-head">
            <a className="st-head-logo" href={href('home')} aria-label="Smart Schools"><Logo size={28} /></a>
            <div className="st-title">
              <h1><Ico name="spark" size={28} sw={1.5} />{t(cur.title)}</h1>
              <p>{t(cur.sub)}</p>
            </div>
            {route.name === 'home' && <AskBar t={t} />}
            <div className="st-langs" role="group" aria-label={t('language')}>
              {LANGS.map((l) => <button key={l} type="button" aria-pressed={l === lang} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
            </div>
            <div className="st-usr"><span className="av" aria-hidden="true">{t('guest').charAt(0)}</span><div><b>{t('guest')}</b><i>{t('student')}</i></div></div>
          </header>
          <div className={`st-body ${board ? 'fill' : ''}`} ref={body}>{page}</div>
        </div>
      </div>

      <nav className="st-tabs" aria-label={t('area')}>
        {PHONE.map(byName).map((n) => (
          <a key={n.name} href={href(n.name)} className="st-tab" aria-current={n.name === route.name ? 'page' : undefined}>
            <Ico name={n.icon} size={22} sw={1.7} />
            <span>{t(n.label)}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
