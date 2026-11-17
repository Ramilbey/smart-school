import { useEffect, useState } from 'react';

export type RouteName = 'home' | 'tutor' | 'explain' | 'homework' | 'game' | 'arcade' | 'linear' | 'lessons';
const NAMES: RouteName[] = ['home', 'tutor', 'explain', 'homework', 'game', 'arcade', 'linear', 'lessons'];

export interface Route {
  name: RouteName;
  params: URLSearchParams;
}

/** The page is the hash of the address (#/tutor?q=...), so the back button works and every page has a link of its own. */
function read(): Route {
  const [path = '', qs = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return { name: (NAMES as string[]).includes(path) ? (path as RouteName) : 'home', params: new URLSearchParams(qs) };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function href(name: RouteName, params: Record<string, string> = {}): string {
  const qs = new URLSearchParams(params).toString();
  return `#/${name === 'home' ? '' : name}${qs ? `?${qs}` : ''}`;
}

export const go = (name: RouteName, params: Record<string, string> = {}) => { location.hash = href(name, params).slice(1); };

/** A page of the website (the teacher portal, the game page) from here at /app/student/. */
export const sitePage = (path: string): string => new URL(`../../${path}`, location.href).href;
