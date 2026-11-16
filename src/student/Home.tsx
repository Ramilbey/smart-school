import { useMemo, useState } from 'react';
import { useStore } from '../lib/store.tsx';
import { lastDays, lastTopic, topicRows, type Activity } from './activity.ts';
import { ActivityChart, TimeBars, TopicMap } from './Charts.tsx';
import { Ico } from './icons.tsx';
import { go, href, sitePage } from './route.ts';
import { ts, type StKey } from './strings.ts';
import { at } from './arcade/text.ts';

const STATS = [
  { k: 'lessons', icon: 'bars', c: '#e5484d', label: 'statLessons' },
  { k: 'questions', icon: 'bubble', c: '#f2894e', label: 'statQuestions' },
  { k: 'solved', icon: 'check', c: '#2fb86b', label: 'statSolved' },
  { k: 'games', icon: 'game', c: '#8b6cf6', label: 'statGames' },
] as const;
const CHIP = ['#2f9bff', '#2fb86b', '#8b6cf6', '#f2a24e'];
const WAYS = [
  { to: 'tutor', icon: 'tutor', c: '#6fa3ff', title: 'navTutorLong', desc: 'tutorDesc' },
  { to: 'explain', icon: 'explain', c: '#2fd39c', title: 'navExplainLong', desc: 'explainDesc' },
  { to: 'homework', icon: 'homework', c: '#ffb84d', title: 'navHomeworkLong', desc: 'homeworkDesc' },
] as const;

export function Home({ activity, aiOn }: { activity: Activity; aiOn: boolean }) {
  const { lang } = useStore();
  const t = (k: StKey, v?: Record<string, string | number>) => ts(lang, k, v);
  const [code, setCode] = useState('');
  const week = useMemo(() => lastDays(activity, 7), [activity]);
  const today = week[6]!.day, yesterday = week[5]!.day;
  const rows = useMemo(() => topicRows(activity, lang, aiOn, 4), [activity, lang, aiOn]);
  const last = lastTopic(activity);
  const delta = (a: number, b: number) => (a > b ? t('deltaUp', { n: a - b }) : a === b ? t('deltaSame') : t('deltaDown', { n: b - a }));
  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) go('game', { code });
  };

  return (
    <div className="st-page st-dash">
      <section className="st-card st-s7" style={{ ['--i' as string]: 0 }}>
        <div className="st-top">
          <div><h2>{t('todayTitle')}</h2><p className="st-sub">{t('todaySub')}</p></div>
          <a className="st-btn p" href={last ? href('tutor', { q: last.title, ...(last.id ? { s: last.id } : {}) }) : href('tutor')}>
            <Ico name="play" size={14} />{last ? t('continueLesson') : t('startLesson')}
          </a>
        </div>
        <div className="st-kp">
          {STATS.map((s) => (
            <div key={s.k} className="st-k">
              <span className="st-ic" style={{ background: s.c }}><Ico name={s.icon} size={15} sw={2.2} /></span>
              <div className="v st-cnt" style={{ ['--to' as string]: today[s.k] }} aria-label={String(today[s.k])} />
              <div className="l">{t(s.label)}</div>
              <div className="d">{delta(today[s.k], yesterday[s.k])}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="st-card st-s5" style={{ ['--i' as string]: 1 }}>
        <h2>{t('activityTitle')}</h2>
        <ActivityChart week={week} lang={lang} t={t} />
      </section>

      <section className="st-card st-s5" style={{ ['--i' as string]: 2 }}>
        <h2>{t('topicsTitle')}</h2>
        <table className="st-table">
          <thead><tr><th>#</th><th>{t('colTopic')}</th><th>{t('colProgress')}</th><th /></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key}>
                <td className="n">{String(i + 1).padStart(2, '0')}</td>
                <td><a href={href('tutor', { q: r.title, ...(r.id ? { s: r.id } : {}) })}>{r.title}</a></td>
                <td><span className="st-trk"><b style={{ ['--w' as string]: `${r.pct}%`, ['--c' as string]: CHIP[i % 4] }} /></span></td>
                <td><span className="st-pc" style={{ ['--c' as string]: r.suggested ? '#8a8fa3' : CHIP[i % 4] }}>{r.suggested ? t('topicNew') : `${r.pct}%`}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="st-card st-s4" style={{ ['--i' as string]: 3 }}>
        <h2>{t('mapTitle')}</h2>
        <TopicMap activity={activity} lang={lang} aiOn={aiOn} t={t} />
        <p className="st-hintline">{t('mapHint')}</p>
      </section>

      <section className="st-card st-s3" style={{ ['--i' as string]: 4 }}>
        <h2>{t('timeTitle')}</h2>
        <TimeBars week={week} lang={lang} t={t} />
      </section>

      <a className="st-card st-s12 ar-promo" href={href('arcade')} style={{ ['--i' as string]: 5 }}>
        <span className="ar-badge"><Ico name="star" size={18} />{at(lang, 'badge')}</span>
        <div><b>{at(lang, 'heroTitle')}</b><p>{at(lang, 'subArcade')}</p></div>
        <span className="ar-go"><Ico name="play" size={16} />{at(lang, 'play')}</span>
      </a>

      <section className="st-card st-s8 st-ways" style={{ ['--i' as string]: 5 }}>
        {WAYS.map((w) => (
          <a key={w.to} className="st-way" href={href(w.to)} style={{ ['--c' as string]: w.c }}>
            <span className="st-tile"><Ico name={w.icon} size={22} sw={1.7} /></span>
            <div><b>{t(w.title)}</b><p>{t(w.desc)}</p></div>
          </a>
        ))}
      </section>

      <section className="st-card st-s4 st-joinbox" style={{ ['--i' as string]: 6 }}>
        <h2>{t('gameBoxTitle')}</h2>
        <p className="st-sub">{t('gameBoxLead')}</p>
        <form onSubmit={join}>
          <input className="st-in st-codein" inputMode="numeric" autoComplete="off" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" aria-label={t('codeLabel')} />
          <button type="submit" className="st-main-btn orange" disabled={code.length !== 6}>{t('join')}</button>
        </form>
      </section>

      <footer className="st-foot st-s12">
        <p>{t('aiNote')}</p>
        <div>
          <a href={sitePage('teacher')}><Ico name="teacher" size={18} />{t('forTeachers')}</a>
          <a href={sitePage('')}><Ico name="site" size={18} />{t('aboutSite')}</a>
        </div>
      </footer>
    </div>
  );
}
