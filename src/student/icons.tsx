import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  home: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />,
  tutor: <><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /><path d="M12 7.6l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="currentColor" stroke="none" /></>,
  explain: <><rect x="3" y="4" width="18" height="12.5" rx="2.2" /><path d="M7 12.5l3-3.2 2.6 2.2 4.4-4.5" /><path d="M9 20.5l3-4 3 4" /></>,
  homework: <><rect x="4.5" y="3" width="15" height="18" rx="2.6" /><path d="M8.5 8h7M8.5 11.5h3.5" /><path d="M12.6 16.4l2 2 3.4-4" /></>,
  game: <><rect x="2.8" y="7" width="18.4" height="11" rx="4.6" /><path d="M8 10.2v4.6M5.7 12.5h4.6" /><circle cx="15.4" cy="11.6" r="1.1" fill="currentColor" stroke="none" /><circle cx="18" cy="14" r="1.1" fill="currentColor" stroke="none" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  pie: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5V12l6 6" /></>,
  graph: <><path d="M4 20V4M4 20h16" /><path d="M7 16l4-5 3 3 5-7" /></>,
  book: <><path d="M5 4.5h10.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h10.5" /></>,
  teacher: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6" /></>,
  site: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  spark: <><path d="M12 2.5l2.2 6 6 2.2-6 2.2L12 19l-2.2-6.1-6-2.2 6-2.2z" /><path d="M19 3v4M17 5h4" /></>,
  bars: <path d="M6 20V10M12 20V4M18 20v-7" />,
  bubble: <path d="M4 5h16v11H11l-4 4v-4H4z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  chevron: <path d="M6 9l6 6 6-6" />,
  star: <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8z" />,
  play: <path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l11-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2z" fill="currentColor" stroke="none" />,
};

export function Ico({ name, size = 22, sw = 1.8 }: { name: keyof typeof P; size?: number; sw?: number }) {
  return (
    <svg className="st-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
