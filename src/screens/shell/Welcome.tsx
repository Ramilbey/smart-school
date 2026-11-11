import type { Lang } from '../../../shared/types.ts';
import { SmartLoader } from '../../components/SmartLoader.tsx';
import { Icon } from '../../components/Chrome.tsx';
import { TileBand } from '../../components/Brand.tsx';
import { useNav } from '../../lib/nav.tsx';
import { inTelegram, useStore } from '../../lib/store.tsx';
import { telegram } from '../../lib/telegram.ts';

const LANGS: { id: Lang; name: string; hint: string; tone: string }[] = [
  { id: 'uz', name: 'O‘zbekcha', hint: 'Lotin yozuvi', tone: '#139a8c' },
  { id: 'ru', name: 'Русский', hint: 'Русский язык', tone: '#1d44a3' },
];

/** The eight-point star on a coloured tile: the mark of each language plate. */
function StarTile({ tone }: { tone: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill={tone} />
      <rect x="13" y="13" width="22" height="22" fill="#fff4d9" />
      <rect x="13" y="13" width="22" height="22" fill="#fff4d9" transform="rotate(45 24 24)" />
      <circle cx="24" cy="24" r="5" fill={tone === '#139a8c' ? '#ff6b5b' : '#ffb547'} />
    </svg>
  );
}

export function Welcome() {
  const { t, progress, setLang, session } = useStore();
  const nav = useNav();
  const name = session?.firstName || telegram.unsafeUser?.first_name || '';

  const choose = (l: Lang) => {
    setLang(l);
    telegram.haptic('light');
    nav.push({ name: 'grades' });
  };

  return (
    <main className="screen shell welcome">
      <TileBand />
      <div className="welcome-body">
        <SmartLoader className="welcome-loader" width={340} height={200} />
        {name && <p className="welcome-hello">{t('hello', { name })}</p>}
        <h1 className="sr-only">Smart Schools</h1>
        <p className="tagline">{t('tagline')}</p>
      </div>

      <section className="lang-pick" aria-labelledby="lang-title">
        <h2 id="lang-title" className="lang-title">Tilni tanlang · Выберите язык</h2>
        <div className="lang-buttons">
          {LANGS.map((l) => (
            <button key={l.id} className={`lang-btn ${progress.lang === l.id ? 'is-current' : ''}`} onClick={() => choose(l.id)} lang={l.id}>
              <StarTile tone={l.tone} />
              <span className="lang-text">
                <span className="lang-name">{l.name}</span>
                <span className="lang-hint">{l.hint}</span>
              </span>
              <span className="lang-go">{progress.lang === l.id ? Icon.check : Icon.arrow}</span>
            </button>
          ))}
        </div>
        <button className="link-btn" onClick={() => choose('en')} lang="en">
          English {progress.lang === 'en' ? '✓' : ''}
        </button>
      </section>

      <footer className="welcome-foot">
        <span>{t('prototypeNote')}</span>
        {!inTelegram && <span className="chip-dev">{t('browserMode')}</span>}
      </footer>
      <TileBand className="band-bottom" />
    </main>
  );
}
