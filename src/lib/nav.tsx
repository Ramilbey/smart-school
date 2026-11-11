import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { StationId } from '../../shared/lessons/g4Fractions.ts';
import type { SectionId } from '../../shared/lessons/g7Linear.ts';

export type Route =
  | { name: 'welcome' }
  | { name: 'grades' }
  | { name: 'kids-home' }
  | { name: 'kids-station'; station: StationId }
  | { name: 'kids-complete' }
  | { name: 'acad-home' }
  | { name: 'acad-section'; section: SectionId }
  | { name: 'acad-results' }
  | { name: 'acad-practice'; skill: string; seed: number }
  | { name: 'teacher' }
  | { name: 'tutor' }
  | { name: 'explainer' }
  | { name: 'course' }
  | { name: 'course-topic'; topic: string };

export type Theme = 'shell' | 'kids' | 'academic' | 'teacher';

export const themeOf = (r: Route): Theme =>
  r.name.startsWith('kids') ? 'kids' : r.name.startsWith('acad') || r.name.startsWith('course') ? 'academic' : r.name === 'teacher' ? 'teacher' : 'shell';

interface NavValue {
  route: Route;
  depth: number;
  push: (r: Route) => void;
  replace: (r: Route) => void;
  back: () => void;
  /** The main menu: grade selection. */
  home: () => void;
  reset: (stack: Route[]) => void;
}

const NavContext = createContext<NavValue | null>(null);

export function NavProvider({ initial, children }: { initial: Route[]; children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>(initial);
  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const replace = useCallback((r: Route) => setStack((s) => [...s.slice(0, -1), r]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const home = useCallback(() => setStack([{ name: 'welcome' }, { name: 'grades' }]), []);
  const reset = useCallback((next: Route[]) => setStack(next), []);
  const value = useMemo(
    () => ({ route: stack[stack.length - 1], depth: stack.length, push, replace, back, home, reset }),
    [stack, push, replace, back, home, reset],
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavValue {
  const v = useContext(NavContext);
  if (!v) throw new Error('useNav outside NavProvider');
  return v;
}
