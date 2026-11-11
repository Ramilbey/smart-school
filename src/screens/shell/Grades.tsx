import { g4Stations } from '../../../shared/lessons/g4Fractions.ts';
import { g7Sections } from '../../../shared/lessons/g7Linear.ts';
import { tx } from '../../../shared/types.ts';
import { TileBand } from '../../components/Brand.tsx';
import { Icon, TopBar } from '../../components/Chrome.tsx';
import { useNav } from '../../lib/nav.tsx';
import { useStore } from '../../lib/store.tsx';
import { telegram } from '../../lib/telegram.ts';
import { STALL_NAMES } from '../kids/KidsHome.tsx';

/** The bazaar, as a postcard: the gate of the Registan, a stall and Zukko. */
function BazaarArt() {
  return (
    <svg viewBox="0 0 342 230" className="hub-art" aria-hidden="true">
      <defs>
        <linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4fc3e6" /><stop offset="1" stopColor="#fdebb9" /></linearGradient>
        <pattern id="ht" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#1d6fb8" /><path d="M6 1.5 L10.5 6 L6 10.5 L1.5 6 Z" fill="#fff4d9" /></pattern>
      </defs>
      <rect width="342" height="230" fill="url(#hs)" />
      <rect y="150" width="342" height="80" fill="#ebc891" />
      <circle cx="300" cy="34" r="16" fill="#fff3b0" />
      <rect x="14" y="52" width="18" height="100" fill="#d8a25c" stroke="#b07a3c" strokeWidth="2" /><path d="M12 52 Q23 28 34 52 Z" fill="#19b6b0" /><rect x="14" y="78" width="18" height="8" fill="#1d6fb8" /><rect x="14" y="108" width="18" height="8" fill="#1d6fb8" />
      <rect x="40" y="108" width="262" height="44" fill="#d8a25c" stroke="#b07a3c" strokeWidth="2" />
      <rect x="64" y="86" width="36" height="22" fill="#1d6fb8" /><path d="M60 86 A22 26 0 0 1 104 86 Z" fill="#19b6b0" stroke="#0e8a8a" strokeWidth="2" />
      <rect x="122" y="30" width="98" height="122" fill="#d8a25c" stroke="#b07a3c" strokeWidth="3" />
      <rect x="128" y="52" width="86" height="100" fill="url(#ht)" />
      <rect x="122" y="30" width="98" height="22" fill="#12a3a0" />
      <path d="M144 152 V102 Q144 76 171 62 Q198 76 198 102 V152 Z" fill="#0c1f57" stroke="#fff4d9" strokeWidth="3" />
      <path d="M156 152 V122 Q156 108 171 108 Q186 108 186 122 V152 Z" fill="#ffb547" stroke="#7a5a14" strokeWidth="2" />
      <path d="M310 52 h18 v100 h-18 z" fill="#d8a25c" stroke="#b07a3c" strokeWidth="2" /><path d="M308 52 Q319 28 330 52 Z" fill="#19b6b0" />
      <path d="M171 232 C171 200 232 196 214 170 C204 156 176 160 171 152" fill="none" stroke="#f6e1b2" strokeWidth="30" strokeLinecap="round" />
      <g transform="translate(262 196)">
        <rect x="-36" y="-34" width="4" height="34" fill="#8a5a2b" /><rect x="32" y="-34" width="4" height="34" fill="#8a5a2b" />
        <rect x="-40" y="0" width="80" height="9" rx="2" fill="#b27a42" stroke="#6b4220" strokeWidth="2" /><rect x="-39" y="9" width="78" height="20" fill="#1d44a3" />
        <circle cx="-18" cy="-10" r="10" fill="#d63a3a" stroke="#8c1f1f" strokeWidth="2" /><circle cx="4" cy="-11" r="10" fill="#d63a3a" stroke="#8c1f1f" strokeWidth="2" /><circle cx="26" cy="-9" r="9" fill="#d63a3a" stroke="#8c1f1f" strokeWidth="2" />
        <path d="M-44 -34 L-34 -48 H34 L44 -34 Z" fill="#b8452f" />
        <rect x="-42" y="-34" width="14" height="18" fill="#ff6b5b" /><rect x="-28" y="-34" width="14" height="18" fill="#fff4d9" /><rect x="-14" y="-34" width="14" height="18" fill="#1d6fb8" /><rect x="0" y="-34" width="14" height="18" fill="#fff4d9" /><rect x="14" y="-34" width="14" height="18" fill="#ffb547" /><rect x="28" y="-34" width="14" height="18" fill="#fff4d9" />
      </g>
      <g transform="translate(116 150) scale(.5)">
        <ellipse cx="60" cy="112" rx="30" ry="5" fill="rgba(60,40,10,.3)" />
        <path d="M26 62 C10 70 12 92 30 98 C30 84 32 72 26 62Z" fill="#3B4296" /><path d="M94 62 C110 70 108 92 90 98 C90 84 88 72 94 62Z" fill="#3B4296" />
        <path d="M60 18 C88 18 98 40 98 66 C98 92 82 106 60 106 C38 106 22 92 22 66 C22 40 32 18 60 18Z" fill="#4A54B8" />
        <path d="M60 52 C78 52 84 66 84 80 C84 96 74 102 60 102 C46 102 36 96 36 80 C36 66 42 52 60 52Z" fill="#FFE7B8" />
        <path d="M36 26 L30 10 L48 22Z M84 26 L90 10 L72 22Z" fill="#4A54B8" />
        <circle cx="44" cy="46" r="15" fill="#fff" /><circle cx="76" cy="46" r="15" fill="#fff" />
        <circle cx="47" cy="47" r="6.5" fill="#1E2140" /><circle cx="79" cy="47" r="6.5" fill="#1E2140" />
        <path d="M55 56 L65 56 L60 66Z" fill="#FFB547" />
      </g>
    </svg>
  );
}

/** A squared notebook page with a pen line and a teacher's tick. */
function NotebookArt() {
  return (
    <svg viewBox="0 0 342 184" className="hub-art" aria-hidden="true">
      <defs><pattern id="hg" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="translate(6 4)"><path d="M22 0 V22 M0 22 H22" fill="none" stroke="#cfe0f0" strokeWidth="1.2" /></pattern></defs>
      <rect width="342" height="184" fill="#fbf8ee" /><rect width="342" height="184" fill="url(#hg)" />
      <rect width="20" height="184" fill="#ece6d2" />
      <g fill="none" stroke="#6b7480" strokeWidth="2.6"><ellipse cx="12" cy="22" rx="12" ry="4.5" /><ellipse cx="12" cy="62" rx="12" ry="4.5" /><ellipse cx="12" cy="102" rx="12" ry="4.5" /><ellipse cx="12" cy="142" rx="12" ry="4.5" /></g>
      <path d="M40 0 V184" stroke="#e8695d" strokeWidth="1.8" opacity=".8" />
      <path d="M200 150 H322 M262 176 V96" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M208 172 L322 88" stroke="#1d44a3" strokeWidth="4" strokeLinecap="round" />
      <circle cx="244" cy="145" r="6" fill="#1d44a3" stroke="#fbf8ee" strokeWidth="2" /><circle cx="296" cy="107" r="6" fill="#1d44a3" stroke="#fbf8ee" strokeWidth="2" />
      <path d="M54 130 l7 9 l15 -20" fill="none" stroke="#d8412f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="330" y="20" width="20" height="36" rx="7" fill="#9ad1c4" stroke="#1f2937" strokeWidth="1.8" /><rect x="326" y="62" width="24" height="36" rx="7" fill="#ffb547" stroke="#1f2937" strokeWidth="1.8" /><rect x="330" y="104" width="20" height="36" rx="7" fill="#f4a9a0" stroke="#1f2937" strokeWidth="1.8" />
    </svg>
  );
}

/** Four textbooks on a shelf. */
function ShelfArt() {
  return (
    <svg viewBox="0 0 342 92" className="hub-art hub-art-wide" aria-hidden="true">
      <rect width="342" height="92" fill="#efe3c8" />
      <rect y="74" width="342" height="18" fill="#a9703a" /><rect y="74" width="342" height="5" fill="#c58a4e" />
      <rect x="204" y="14" width="30" height="60" rx="3" fill="#1d44a3" stroke="#0c1f57" strokeWidth="2.5" />
      <rect x="238" y="6" width="32" height="68" rx="3" fill="#d8412f" stroke="#7a1f14" strokeWidth="2.5" />
      <rect x="274" y="12" width="30" height="62" rx="3" fill="#139a8c" stroke="#0c4f48" strokeWidth="2.5" />
      <rect x="308" y="20" width="26" height="54" rx="3" fill="#e0a020" stroke="#7a5a14" strokeWidth="2.5" />
      <g fill="#fff4d9" opacity=".9"><rect x="204" y="14" width="30" height="8" /><rect x="238" y="6" width="32" height="8" /><rect x="274" y="12" width="30" height="8" /><rect x="308" y="20" width="26" height="8" fill="#0c1f57" /></g>
    </svg>
  );
}

const Beads = ({ done, total }: { done: number; total: number }) => (
  <span className="beads" aria-hidden="true">
    {Array.from({ length: total }, (_, i) => <i key={i} className={i < done ? 'd' : ''} />)}
  </span>
);

import { tt } from '../tutor/strings.ts';

export function Grades() {
  const { t, lang, progress, session } = useStore();
  const nav = useNav();
  const kidsDone = g4Stations.filter((s) => progress.kids.stations[s.id]).length;
  const acadDone = g7Sections.filter((s) => progress.acad.sections[s.id]).length;
  const name = session?.firstName || telegram.unsafeUser?.first_name || '';
  // "Continue" picks up where the student is: the next stall for the young ones, otherwise the notebook.
  const nextStall = g4Stations.find((s) => !progress.kids.stations[s.id]);
  const goOn = nextStall ? { route: { name: 'kids-home' } as const, label: tx(STALL_NAMES[nextStall.id], lang) } : { route: { name: 'acad-home' } as const, label: t('band2Title') };

  const go = (route: Parameters<typeof nav.push>[0]) => {
    telegram.haptic('light');
    nav.push(route);
  };

  return (
    <main className="screen shell grades hub">
      <TopBar showHome={false} title="Smart Schools" />
      <TileBand />
      <div className="scroll">
        <div className="hub-hello">
          <h1 className="screen-title">{name ? t('hello', { name }) : t('chooseGrade')}</h1>
          <span className="pill" aria-label={`${progress.kids.xp + (progress.acad.xp ?? 0)} ${t('xp')}`}>{Icon.star}<b>{progress.kids.xp + (progress.acad.xp ?? 0)}</b></span>
        </div>

        <button className="hub-go" onClick={() => go(goOn.route)}>
          <span className="hub-go-text">
            <span className="hub-go-k">{t('hubContinue')}</span>
            <span className="hub-go-n">{goOn.label}</span>
          </span>
          <svg width="40" height="40" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" fill="#0c1f57" /><path d="M22 17 L40 28 L22 39 Z" fill="#fff4d9" /></svg>
        </button>

        <button className="hub-card hub-kids" onClick={() => go({ name: 'kids-home' })} aria-label={`${t('band1Title')}. ${t('band1Sub')}`}>
          <BazaarArt />
          <span className="hub-sign">{t('band1Title')}</span>
          <Beads done={kidsDone} total={g4Stations.length} />
        </button>

        <button className="hub-card hub-acad" onClick={() => go({ name: 'acad-home' })} aria-label={`${t('band2Title')}. ${t('band2Sub')}`}>
          <NotebookArt />
          <span className="hub-pen">{t('band2Title')}</span>
          <Beads done={acadDone} total={g7Sections.length} />
        </button>

        <button className="hub-card hub-books" onClick={() => go({ name: 'course' })} aria-label={`${t('band3Title')}. ${t('band3Sub')}`}>
          <ShelfArt />
          <span className="hub-books-text">
            <b>{t('band3Title')}</b>
            <small>{t('band3Sub')}</small>
          </span>
        </button>

        <div className="hub-ai">
          <button className="hub-ai-card" onClick={() => go({ name: 'tutor' })}>
            <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#16204f" stroke="#2de2c4" strokeWidth="2.5" /><rect x="22" y="14" width="20" height="28" rx="10" fill="#2de2c4" /><path d="M14 30a18 18 0 0 0 36 0M32 48v8" fill="none" stroke="#2de2c4" strokeWidth="4" strokeLinecap="round" /></svg>
            <b>{tt(lang, 'tutorTitle')}</b>
            <small>{tt(lang, 'cardTutorSub')}</small>
          </button>
          <button className="hub-ai-card" onClick={() => go({ name: 'explainer' })}>
            <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#16204f" stroke="#b79cff" strokeWidth="2.5" /><path d="M16 44 L16 22 L38 44 Z" fill="rgba(255,181,71,.25)" stroke="#ffb547" strokeWidth="3" strokeLinejoin="round" /><path d="M24 20 L46 20 M46 20 L46 42" stroke="#2de2c4" strokeWidth="3" strokeLinecap="round" fill="none" /></svg>
            <b>{tt(lang, 'explainerTitle')}</b>
            <small>{tt(lang, 'cardExplainerSub')}</small>
          </button>
        </div>

        <button className="hub-teacher" onClick={() => go({ name: 'teacher' })}>
          <span>{t('teacherCard')}</span>
          <span className="chip-demo">{t('demoData')}</span>
        </button>
      </div>
    </main>
  );
}
