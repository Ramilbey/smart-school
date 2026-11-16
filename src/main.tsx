import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { telegram } from './lib/telegram.ts';

/**
 * The Telegram Mini App and the website's student area are one product now: the Mini App's address opens the student area.
 * Deep links from the bot (/start g4, a t.me link with startapp=g7, ?go=tutor in a URL) land on the matching page there.
 * Telegram's script keeps its launch data for the whole session, so the student stays signed in after the redirect.
 */
const PAGES: Record<string, string> = {
  g4: 'arcade',
  games: 'arcade',
  arcade: 'arcade',
  fractions: 'fractions',
  g7: 'lessons?t=a7-func',
  course: 'lessons',
  lessons: 'lessons',
  tutor: 'tutor',
  explainer: 'explain',
  explain: 'explain',
  homework: 'homework',
};

declare global {
  interface Window {
    __ssMounted?: boolean;
  }
}

const go = new URLSearchParams(location.search).get('go') ?? telegram.startParam ?? '';
telegram.init();
if (go === 'teacher') {
  // the teacher's class view with the Smart Attendance demo stays a page of the Mini App
  document.documentElement.dataset.theme = 'teacher';
  void import('./TeacherApp.tsx').then(({ TeacherApp }) => {
    createRoot(document.getElementById('root')!).render(<StrictMode><TeacherApp /></StrictMode>);
    window.__ssMounted = true;
  });
} else {
  window.__ssMounted = true; // the boot screen's "could not load" message must not appear while we move on
  location.replace(new URL(`student/#/${PAGES[go] ?? ''}`, location.href).href);
}
