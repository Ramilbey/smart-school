import { useEffect, useRef, useState, type ReactNode } from 'react';
import { g4Achievements } from '../../shared/lessons/g4Fractions.ts';
import { tx, type Lang } from '../../shared/types.ts';
import { useNav } from '../lib/nav.tsx';
import { inTelegram, useStore } from '../lib/store.tsx';
import { telegram } from '../lib/telegram.ts';
import { Logo } from './Brand.tsx';

export const Icon = {
  back: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor" /></svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
  ),
  bulb: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
  ),
};

interface TopBarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  showHome?: boolean;
  onBack?: () => void;
  /** Gear button. Off on lesson screens to keep the bar calm; settings stay in Telegram's ⋮ menu and on home screens. */
  settings?: boolean;
}

/** Screen header. Inside Telegram the native BackButton replaces the in-app back arrow. */
export function TopBar({ title, subtitle, right, showHome = true, onBack, settings: showGear = true }: TopBarProps) {
  const nav = useNav();
  const { t } = useStore();
  const [settings, setSettings] = useState(false);
  useEffect(() => telegram.settingsButton(() => setSettings(true)) ?? undefined, []);
  return (
    <header className="topbar">
      <div className="topbar-left">
        {!inTelegram && nav.depth > 1 && (
          <button className="icon-btn" onClick={onBack ?? nav.back} aria-label={t('back')}>
            {Icon.back}
          </button>
        )}
        {showHome && (
          <button className="icon-btn" onClick={nav.home} aria-label={t('mainMenu')} title={t('mainMenu')}>
            {Icon.home}
          </button>
        )}
      </div>
      <div className="topbar-title">
        {title && <div className="topbar-h">{title}</div>}
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      <div className="topbar-right">
        {right}
        {showGear && (
          <button className="icon-btn" onClick={() => setSettings(true)} aria-label={t('settings')} title={t('settings')}>
            {Icon.gear}
          </button>
        )}
      </div>
      {settings && <SettingsSheet onClose={() => setSettings(false)} />}
    </header>
  );
}

const LANG_LABEL: Record<Lang, string> = { uz: 'O‘zbekcha', ru: 'Русский', en: 'English' };

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { t, lang, setLang, reset, session } = useStore();
  const nav = useNav();
  const [confirming, setConfirming] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t('settings')} tabIndex={-1} ref={panel} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <Logo size={28} />
          <h2>{t('settings')}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('close')}>✕</button>
        </div>

        <h3 className="sheet-label">{t('language')}</h3>
        <div className="seg" role="radiogroup" aria-label={t('language')}>
          {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
            <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>

        <h3 className="sheet-label">{t('statusTitle')}</h3>
        <dl className="status-list">
          <div>
            <dt className="ok">{t('statusWorking')}</dt>
            <dd>{t('statusWorkingList')}</dd>
          </div>
          <div>
            <dt className="sim">{t('statusSimulated')}</dt>
            <dd>{t('statusSimulatedList')}</dd>
          </div>
          <div>
            <dt className="ai">{t('statusAi')}</dt>
            <dd>{session?.ai ? t('aiLive') : t('aiOffline')}</dd>
          </div>
        </dl>
        <p className="sheet-note">
          {session?.authenticated ? t('savedTelegram') : t('savedDevice')} · {t('contentDraft')}
        </p>

        {!confirming ? (
          <button className="btn btn-ghost-danger" onClick={() => setConfirming(true)}>{t('resetDemo')}</button>
        ) : (
          <div className="confirm-row" role="alert">
            <p>{t('resetConfirm')}</p>
            <div className="row-btns">
              <button className="btn btn-quiet" onClick={() => setConfirming(false)}>{t('cancel')}</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  reset();
                  telegram.haptic('warning');
                  onClose();
                  nav.home();
                }}
              >
                {t('resetYes')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** XP toasts and badge pop-ups queued by the store. */
export function Celebrations() {
  const { celebrations, dismissCelebration, lang, t } = useStore();
  const current = celebrations[0];

  useEffect(() => {
    if (!current || current.badge) return;
    const timer = window.setTimeout(() => dismissCelebration(current.id), 1400);
    return () => window.clearTimeout(timer);
  }, [current, dismissCelebration]);

  useEffect(() => {
    if (current?.badge) telegram.haptic('success');
  }, [current]);

  if (!current) return null;
  if (!current.badge) {
    return (
      <div className="xp-toast" role="status" aria-live="polite">
        {Icon.star} {t('plusXp', { n: current.xp ?? 0 })}
      </div>
    );
  }
  const badge = g4Achievements.find((a) => a.id === current.badge)!;
  return (
    <div className="badge-backdrop" onClick={() => dismissCelebration(current.id)}>
      <Confetti />
      <div className="badge-card" role="dialog" aria-modal="true" aria-labelledby="badge-title" onClick={(e) => e.stopPropagation()}>
        <div className="badge-kicker">{t('badgeUnlocked')}</div>
        <BadgeIcon color={badge.color} size={112} id={badge.id} />
        <h2 id="badge-title">{tx(badge.title, lang)}</h2>
        <p>{tx(badge.how, lang)}</p>
        {current.xp ? <div className="badge-xp">{t('plusXp', { n: current.xp })}</div> : null}
        <button className="btn btn-kids" autoFocus onClick={() => dismissCelebration(current.id)}>
          {t('continue')}
        </button>
      </div>
    </div>
  );
}

export function BadgeIcon({ color, size = 56, id, locked }: { color: string; size?: number; id: string; locked?: boolean }) {
  const glyph: Record<string, ReactNode> = {
    'fair-share': <path d="M50 30v40M30 50h40" stroke="#1E2140" strokeWidth="7" strokeLinecap="round" />,
    builder: <path d="M50 28 A22 22 0 1 1 28 50 L50 50Z" fill="#1E2140" />,
    'sharp-eye': (
      <>
        <ellipse cx="50" cy="50" rx="22" ry="14" fill="none" stroke="#1E2140" strokeWidth="6" />
        <circle cx="50" cy="50" r="7" fill="#1E2140" />
      </>
    ),
    persistent: <path d="M32 58 L44 44 L54 54 L68 36 M58 36 h10 v10" fill="none" stroke="#1E2140" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />,
    'quiz-star': <path d="M50 26l7 14.5 16 2-11.7 11 3 15.8L50 61.6l-14.3 7.7 3-15.8L27 42.5l16-2z" fill="#1E2140" />,
    mission: <path d="M33 51l11 11 23-24" fill="none" stroke="#1E2140" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />,
  };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`badge-icon ${locked ? 'locked' : ''}`} aria-hidden="true">
      <path d="M50 4 L88 26 L88 74 L50 96 L12 74 L12 26Z" fill={locked ? '#E7E2D8' : color} stroke="#1E2140" strokeWidth="4" strokeLinejoin="round" />
      <path d="M50 14 L79 31 L79 69 L50 86 L21 69 L21 31Z" fill="rgba(255,255,255,.35)" />
      {locked ? <path d="M40 52v-6a10 10 0 0 1 20 0v6M36 52h28v16H36z" fill="none" stroke="#A39C8E" strokeWidth="5" strokeLinejoin="round" /> : glyph[id]}
    </svg>
  );
}

const CONFETTI_COLORS = ['#FFB547', '#FF6B5B', '#2DE2C4', '#5B8CFF', '#FFE07A'];

export function Confetti({ count = 28 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      dur: 1.6 + Math.random() * 1.2,
      rot: Math.random() * 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      round: i % 3 === 0,
    })),
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            transform: `rotate(${p.rot}deg)`,
            borderRadius: p.round ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

/** On-screen keypad: avoids the phone keyboard covering the lesson inside Telegram. */
export function Keypad({ keys, onKey, label }: { keys: string[]; onKey: (k: string) => void; label: string }) {
  return (
    <div className="keypad" role="group" aria-label={label}>
      {keys.map((k, i) =>
        k === '' ? (
          <span key={`gap-${i}`} aria-hidden="true" />
        ) : (
        <button
          key={k}
          type="button"
          className={`key ${k === '⌫' ? 'key-del' : ''}`}
          onClick={() => {
            telegram.haptic('light');
            onKey(k);
          }}
          aria-label={k === '⌫' ? 'Delete' : k}
        >
          {k}
        </button>
        ),
      )}
    </div>
  );
}

export function ProgressBar({ value, label, className }: { value: number; label?: string; className?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`progress ${className ?? ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}
