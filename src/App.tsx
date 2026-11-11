import { Component, Suspense, lazy, useEffect, type ReactNode } from 'react';
import { Logo } from './components/Brand.tsx';
import { Celebrations } from './components/Chrome.tsx';
import { NavProvider, themeOf, useNav, type Route, type Theme } from './lib/nav.tsx';
import { StoreProvider, useStore } from './lib/store.tsx';
import { telegram } from './lib/telegram.ts';
import { AcadHome } from './screens/academic/AcadHome.tsx';
import { AcadPractice, AcadResults } from './screens/academic/AcadResults.tsx';
import { AcadSection } from './screens/academic/AcadSection.tsx';
import { KidsComplete } from './screens/kids/KidsComplete.tsx';
import { KidsHome } from './screens/kids/KidsHome.tsx';
import { KidsStation } from './screens/kids/KidsStation.tsx';
import { Course, CourseTopic } from './screens/course/Course.tsx';
import { Grades } from './screens/shell/Grades.tsx';
import { Welcome } from './screens/shell/Welcome.tsx';
import { TeacherDashboard } from './screens/teacher/TeacherDashboard.tsx';
import { SmartLoader } from './components/SmartLoader.tsx';

// the whiteboard screens bring a maths typesetter with them, so they load only when opened
const TutorScreen = lazy(() => import('./screens/tutor/BoardScreen.tsx').then((m) => ({ default: m.TutorScreen })));
const ExplainerScreen = lazy(() => import('./screens/tutor/BoardScreen.tsx').then((m) => ({ default: m.ExplainerScreen })));

/** Header / background colours sent to Telegram so the native chrome matches each mode. */
const THEME_COLORS: Record<Theme, { header: string; bg: string }> = {
  shell: { header: '#050914', bg: '#050914' },
  kids: { header: '#FFF6E6', bg: '#FFF6E6' },
  academic: { header: '#0C1F57', bg: '#0C1F57' },
  teacher: { header: '#FFFFFF', bg: '#F4F5F9' },
};

/** Deep links: /start g4 in the bot, ?go=g7 in the URL, or startapp=teacher in a t.me link. */
function initialStack(): Route[] {
  const go = new URLSearchParams(location.search).get('go') ?? telegram.startParam ?? '';
  const base: Route[] = [{ name: 'welcome' }];
  if (go === 'g4') return [...base, { name: 'grades' }, { name: 'kids-home' }];
  if (go === 'g7') return [...base, { name: 'grades' }, { name: 'acad-home' }];
  if (go === 'teacher') return [...base, { name: 'grades' }, { name: 'teacher' }];
  if (go === 'course') return [...base, { name: 'grades' }, { name: 'course' }];
  if (go === 'tutor') return [...base, { name: 'grades' }, { name: 'tutor' }];
  if (go === 'explainer') return [...base, { name: 'grades' }, { name: 'explainer' }];
  return base;
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'welcome':
      return <Welcome />;
    case 'grades':
      return <Grades />;
    case 'kids-home':
      return <KidsHome />;
    case 'kids-station':
      return <KidsStation station={route.station} />;
    case 'kids-complete':
      return <KidsComplete />;
    case 'acad-home':
      return <AcadHome />;
    case 'acad-section':
      return <AcadSection section={route.section} />;
    case 'acad-results':
      return <AcadResults />;
    case 'acad-practice':
      return <AcadPractice skill={route.skill} seed={route.seed} />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'tutor':
      return <Suspense fallback={<main className="screen shell"><SmartLoader width={300} height={180} /></main>}><TutorScreen /></Suspense>;
    case 'explainer':
      return <Suspense fallback={<main className="screen shell"><SmartLoader width={300} height={180} /></main>}><ExplainerScreen /></Suspense>;
    case 'course':
      return <Course />;
    case 'course-topic':
      return <CourseTopic key={route.topic} topicId={route.topic} />;
  }
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { t } = useStore();
  const nav = useNav();
  return (
    <main className="error-screen">
      <div className="error-card">
        <Logo size={48} />
        <h1>{t('errorTitle')}</h1>
        <p>{t('errorBody')}</p>
        <button
          className="btn btn-acad"
          onClick={() => {
            onReset();
            nav.home();
          }}
        >
          {t('mainMenu')}
        </button>
      </div>
    </main>
  );
}

class Boundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[ui] screen crashed:', error);
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <ErrorFallback onReset={() => this.setState({ failed: false })} /> : this.props.children;
  }
}

function Shell() {
  const { route, depth, back } = useNav();
  const theme = themeOf(route);
  const routeKey = JSON.stringify(route);
  const { lang } = useStore();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    telegram.setColors(THEME_COLORS[theme].header, THEME_COLORS[theme].bg);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => telegram.backButton(depth > 1, back), [depth, back]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [routeKey]);

  return (
    <Boundary resetKey={routeKey}>
      <Screen key={routeKey} route={route} />
      <Celebrations />
    </Boundary>
  );
}

export function App() {
  return (
    <StoreProvider>
      <NavProvider initial={initialStack()}>
        <Shell />
      </NavProvider>
    </StoreProvider>
  );
}
