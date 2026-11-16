import { useEffect } from 'react';
import { Celebrations } from '../components/Chrome.tsx';
import { NavProvider, themeOf, useNav, type Route } from '../lib/nav.tsx';
import { useStore } from '../lib/store.tsx';
import { AcadHome } from '../screens/academic/AcadHome.tsx';
import { AcadPractice, AcadResults } from '../screens/academic/AcadResults.tsx';
import { AcadSection } from '../screens/academic/AcadSection.tsx';
import { Course, CourseTopic } from '../screens/course/Course.tsx';
import { KidsComplete } from '../screens/kids/KidsComplete.tsx';
import { KidsHome } from '../screens/kids/KidsHome.tsx';
import { KidsStation } from '../screens/kids/KidsStation.tsx';
import type { Lang } from '../../shared/types.ts';
import { Ico } from './icons.tsx';
import { go, href } from './route.ts';
import '../styles/shell.css';
import '../styles/kids.css';
import '../styles/academic.css';
import '../styles/clarity.css';
import '../styles/redesign.css';
import './legacy.css';

export type Section = 'fractions' | 'linear' | 'lessons';
const START: Record<Section, Route> = { fractions: { name: 'kids-home' }, linear: { name: 'acad-home' }, lessons: { name: 'course' } };

type T3 = Record<Lang, string>;
const INFO: Record<Section, { grade: T3; primary: boolean; problem: T3; how: T3[]; note?: T3 }> = {
  fractions: {
    grade: { en: 'Grade 4', ru: '4 класс', uz: '4-sinf' }, primary: true,
    problem: {
      en: 'Fractions are where many pupils first lose maths: the rules get memorised, but the pieces are never seen. Here every fraction is something you cut, build and compare.',
      ru: 'На дробях многие ученики впервые теряют математику: правила заучены, а части никто не видел. Здесь каждую дробь режут, собирают и сравнивают.',
      uz: 'Ko‘p o‘quvchi matematikani aynan kasrlarda yo‘qotadi: qoidalar yodlanadi, lekin bo‘laklar ko‘rilmaydi. Bu yerda har bir kasr kesiladi, yasaladi va taqqoslanadi.',
    },
    how: [
      { en: 'Five stations on a bazaar map, from equal parts to a quick quiz', ru: 'Пять станций на карте базара: от равных частей до быстрого теста', uz: 'Bozor xaritasidagi beshta bekat: teng bo‘laklardan tezkor testgacha' },
      { en: 'A wrong answer gets a hint, not the answer', ru: 'На ошибку даётся подсказка, а не ответ', uz: 'Xato javobga tayyor javob emas, maslahat beriladi' },
      { en: 'Stars and badges for finishing a station', ru: 'Звёзды и значки за пройденную станцию', uz: 'Bekatni tugatgani uchun yulduz va nishonlar' },
    ],
  },
  linear: {
    grade: { en: 'Grade 7', ru: '7 класс', uz: '7-sinf' }, primary: false,
    problem: {
      en: 'A formula like y = kx + b stays a string of letters until you move the line yourself. Here the graph, the table and the equation change together.',
      ru: 'Формула y = kx + b остаётся набором букв, пока сам не подвигаешь прямую. Здесь график, таблица и уравнение меняются вместе.',
      uz: 'y = kx + b formulasi chiziqni o‘zing siljitmaguningcha harflar to‘plami bo‘lib qoladi. Bu yerda grafik, jadval va tenglama birga o‘zgaradi.',
    },
    how: [
      { en: 'Drag the line and watch the equation follow', ru: 'Двигай прямую и смотри, как меняется уравнение', uz: 'Chiziqni siljit va tenglama qanday o‘zgarishini kuzat' },
      { en: 'A worked problem, one step at a time', ru: 'Разобранная задача, шаг за шагом', uz: 'Yechilgan masala, qadamma-qadam' },
      { en: 'A check at the end shows which skill needs practice', ru: 'Проверка в конце показывает, какой навык стоит потренировать', uz: 'Oxirgi tekshiruv qaysi ko‘nikmani mashq qilish kerakligini ko‘rsatadi' },
    ],
  },
  lessons: {
    grade: { en: 'Grades 6–7', ru: '6–7 классы', uz: '6–7-sinflar' }, primary: false,
    problem: {
      en: 'One missed lesson leaves a gap, and the class moves on. Short lessons that follow the textbook topics let a pupil catch up alone, with practice after each one.',
      ru: 'Один пропущенный урок оставляет пробел, а класс идёт дальше. Короткие уроки по темам учебника позволяют догнать самому, с практикой после каждого.',
      uz: 'Bitta o‘tkazib yuborilgan dars bo‘shliq qoldiradi, sinf esa oldinga ketadi. Darslik mavzulari bo‘yicha qisqa darslar o‘quvchiga o‘zi yetib olish imkonini beradi, har biridan keyin mashq bilan.',
    },
    how: [
      { en: '23 topics from Grade 6–7 maths, algebra, geometry and physics', ru: '23 темы из математики, алгебры, геометрии и физики 6–7 классов', uz: '6–7-sinf matematika, algebra, geometriya va fizikadan 23 ta mavzu' },
      { en: 'Each lesson: the idea, a worked example, then practice', ru: 'В каждом уроке: идея, разобранный пример, затем практика', uz: 'Har bir darsda: g‘oya, yechilgan misol, keyin mashq' },
      { en: 'Hints in steps when an answer is wrong', ru: 'Подсказки по шагам, если ответ неверный', uz: 'Javob noto‘g‘ri bo‘lsa, bosqichma-bosqich maslahatlar' },
    ],
    note: {
      en: 'The lessons are written in our own words from the textbook topics and still wait for a teacher’s review.',
      ru: 'Уроки написаны своими словами по темам учебника и ещё ждут проверки учителем.',
      uz: 'Darslar darslik mavzulari asosida o‘z so‘zlarimiz bilan yozilgan va hali o‘qituvchi tekshiruvini kutmoqda.',
    },
  },
};
const WORDS: Record<'why' | 'how' | 'primary' | 'back', T3> = {
  why: { en: 'The problem it solves', ru: 'Какую проблему решает', uz: 'Qaysi muammoni hal qiladi' },
  how: { en: 'How it works', ru: 'Как это работает', uz: 'Qanday ishlaydi' },
  primary: { en: 'Gamified lesson for Grades 1–4', ru: 'Урок-игра для 1–4 классов', uz: '1–4-sinflar uchun o‘yinlashtirilgan dars' },
  back: { en: 'All games for Grades 1–4', ru: 'Все игры для 1–4 классов', uz: '1–4-sinflar uchun barcha o‘yinlar' },
};

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'kids-home': return <KidsHome />;
    case 'kids-station': return <KidsStation station={route.station} />;
    case 'kids-complete': return <KidsComplete />;
    case 'acad-home': return <AcadHome />;
    case 'acad-section': return <AcadSection section={route.section} />;
    case 'acad-results': return <AcadResults />;
    case 'acad-practice': return <AcadPractice skill={route.skill} seed={route.seed} />;
    case 'course': return <Course />;
    case 'course-topic': return <CourseTopic key={route.topic} topicId={route.topic} />;
    default: return null;
  }
}

/** The screens ask for "home" or the tutor through their own navigation; here that means leaving for the student area's pages. */
function Stage({ section }: { section: Section }) {
  const { route } = useNav();
  const key = JSON.stringify(route);
  const away = route.name === 'welcome' || route.name === 'grades' || route.name === 'teacher' || route.name === 'tutor' || route.name === 'explainer';
  useEffect(() => {
    if (away) go(route.name === 'tutor' ? 'tutor' : route.name === 'explainer' ? 'explain' : section === 'fractions' ? 'arcade' : 'home');
  }, [away, route.name, section]);
  useEffect(() => { document.querySelector('.st-body')?.scrollTo(0, 0); }, [key]);
  if (away) return null;
  return (
    <div className="st-emb" data-theme={themeOf(route)} data-route={route.name}>
      <Screen key={key} route={route} />
      <Celebrations />
    </div>
  );
}

/** Fractions adventure, the linear-function lab and the textbook lessons, shown inside the student area with its own frame around them. */
export function Legacy({ section }: { section: Section }) {
  const { lang } = useStore();
  const info = INFO[section];
  const L = (x: T3) => x[lang] ?? x.en;
  return (
    <div className={`st-page lg lg-${section}`}>
      <div className="lg-stage">
        <NavProvider initial={[START[section]]}><Stage section={section} /></NavProvider>
      </div>
      <aside className="lg-side">
        <section className="st-card">
          <div className="ar-chiprow"><span className="ar-chip grade">{L(info.grade)}</span>{info.primary && <span className="ar-chip">{L(WORDS.primary)}</span>}</div>
          <h3>{L(WORDS.why)}</h3>
          <p>{L(info.problem)}</p>
        </section>
        <section className="st-card">
          <h3>{L(WORDS.how)}</h3>
          <ul>{info.how.map((h, i) => <li key={i}><Ico name="check" size={18} sw={2.4} />{L(h)}</li>)}</ul>
          {info.note && <p className="lg-note">{L(info.note)}</p>}
        </section>
        {info.primary && <a className="st-card lg-back" href={href('arcade')}><Ico name="star" size={22} /><span>{L(WORDS.back)}</span><Ico name="arrow" size={20} /></a>}
      </aside>
    </div>
  );
}
