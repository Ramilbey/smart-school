import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { G4AchievementId, StationId } from '../../shared/lessons/g4Fractions.ts';
import type { SectionId } from '../../shared/lessons/g7Linear.ts';
import type { Lang } from '../../shared/types.ts';
import { fetchSession, loadRemoteProgress, saveRemoteProgress, type Session } from './api.ts';
import { translate, type Key } from './i18n.ts';
import { inTelegram, telegram } from './telegram.ts';
import { freshProgressData, scoreAnswer, type StudyProgress } from '../../shared/progress.ts';

export interface ProblemRecord {
  solved: boolean;
  wrong: number;
  hints: number;
}

export interface QuizRecord {
  best: number | null;
  last: Record<string, string> | null;
  attempts: number;
}

export interface Progress {
  v: 1;
  lang: Lang | null;
  kids: {
    xp: number;
    stations: Partial<Record<StationId, true>>;
    homework: Record<string, ProblemRecord>;
    quiz: QuizRecord;
    badges: G4AchievementId[];
    completedAt: number | null;
  };
  acad: {
    sections: Partial<Record<SectionId, true>>;
    challenges: Record<string, true>;
    steps: number;
    problem: ProblemRecord;
    quiz: QuizRecord;
    practice: Record<string, { correct: number; attempted: number }>;
    /** Grade 5–11 motivation (optional so older saved progress still loads). */
    xp?: number;
    streak?: { count: number; day: string };
    awarded?: Record<string, true>;
  };
  teacher: {
    absent: string[] | null;
    confirmedAt: number | null;
    reviews: Record<string, 'approved' | 'flagged'>;
  };
  /** Grade 6–7 course results, shared with the Telegram bot. */
  bot?: StudyProgress;
  updatedAt: number;
}

export const freshProgress = (lang: Lang | null = null): Progress => freshProgressData(lang) as Progress;

const storageKey = `smart-schools:v1:${telegram.unsafeUser?.id ?? 'browser'}`;

function readLocal(): Progress {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Progress;
      if (parsed?.v === 1) return { ...freshProgress(), ...parsed, kids: { ...freshProgress().kids, ...parsed.kids }, acad: { ...freshProgress().acad, ...parsed.acad }, teacher: { ...freshProgress().teacher, ...parsed.teacher } };
    }
  } catch {
    /* storage blocked or corrupt: start fresh */
  }
  return freshProgress();
}

function writeLocal(p: Progress) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export interface Celebration {
  id: number;
  xp?: number;
  badge?: G4AchievementId;
}

interface StoreValue {
  progress: Progress;
  lang: Lang;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  update: (fn: (draft: Progress) => void) => void;
  setLang: (lang: Lang) => void;
  reset: () => void;
  session: Session | null;
  /** Kids mode rewards: adds XP / badge once and queues a celebration. */
  reward: (opts: { xp?: number; badge?: G4AchievementId }) => void;
  /** Grades 5–11: adds XP once per achievement key and keeps the daily streak. Returns false if already earned. */
  acadReward: (key: string, xp: number) => boolean;
  celebrations: Celebration[];
  dismissCelebration: (id: number) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yesterdayOf = (key: string) => {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return dayKey(d);
};
/** Practising today keeps the chain alive; yesterday's chain grows; anything older starts over. */
function bumpStreak(a: Progress['acad']) {
  const today = dayKey(new Date());
  const s = a.streak;
  if (!s || (s.day !== today && s.day !== yesterdayOf(today))) a.streak = { count: 1, day: today };
  else if (s.day === yesterdayOf(today)) a.streak = { count: s.count + 1, day: today };
}

/** Scores one Grade 6–7 course answer on a draft of the progress. */
export function recordAnswer(p: Progress, topicId: string, key: number, wrongTries: number) {
  if (!p.bot) return;
  scoreAnswer(p.bot, topicId, key, wrongTries, Date.now());
  if (wrongTries < 3) bumpStreak(p.acad);
}

/** Days in a row with at least one earned reward; 0 if the chain is broken. */
export function liveStreak(s: { count: number; day: string } | undefined): number {
  if (!s) return 0;
  const today = dayKey(new Date());
  return s.day === today || s.day === yesterdayOf(today) ? s.count : 0;
}

function detectLang(): Lang {
  const code = (telegram.unsafeUser?.language_code ?? navigator.language ?? '').toLowerCase();
  if (code.startsWith('ru')) return 'ru';
  if (code.startsWith('en')) return 'en';
  return 'uz';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(readLocal);
  const [session, setSession] = useState<Session | null>(null);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const nextId = useRef(1);
  const syncTimer = useRef<number | null>(null);
  const remoteReady = useRef(false);

  // Validate the Telegram session on the server and pull remote progress if it is newer.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchSession();
      if (cancelled) return;
      setSession(s);
      if (s.authenticated) {
        const remote = await loadRemoteProgress();
        if (cancelled) return;
        const rp = remote?.progress as Progress | null;
        if (rp && rp.v === 1 && remote!.updatedAt > progress.updatedAt) {
          setProgress((local) => ({ ...rp, lang: local.lang ?? rp.lang }));
        }
        remoteReady.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((p: Progress) => {
    writeLocal(p);
    if (!remoteReady.current) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => void saveRemoteProgress(p, p.updatedAt), 1200);
  }, []);

  const update = useCallback(
    (fn: (draft: Progress) => void) => {
      setProgress((prev) => {
        const draft = structuredClone(prev);
        fn(draft);
        draft.updatedAt = Date.now();
        persist(draft);
        return draft;
      });
    },
    [persist],
  );

  const lang: Lang = progress.lang ?? detectLang();

  const value = useMemo<StoreValue>(
    () => ({
      progress,
      lang,
      t: (key, vars) => translate(lang, key, vars),
      update,
      setLang: (l) => update((p) => void (p.lang = l)),
      reset: () =>
        update((p) => {
          const keepLang = p.lang;
          Object.assign(p, freshProgress(keepLang));
        }),
      session,
      reward: ({ xp, badge }) => {
        const newBadge = badge && !progress.kids.badges.includes(badge) ? badge : undefined;
        if (!xp && !newBadge) return;
        update((p) => {
          if (xp) p.kids.xp += xp;
          if (newBadge && !p.kids.badges.includes(newBadge)) p.kids.badges.push(newBadge);
        });
        setCelebrations((c) => [...c, { id: nextId.current++, xp, badge: newBadge }]);
      },
      acadReward: (key, xp) => {
        if (progress.acad.awarded?.[key]) return false;
        update((p) => {
          const a = p.acad;
          a.awarded = a.awarded ?? {};
          if (a.awarded[key]) return;
          a.awarded[key] = true;
          a.xp = (a.xp ?? 0) + xp;
          bumpStreak(a);
        });
        return true;
      },
      celebrations,
      dismissCelebration: (id) => setCelebrations((c) => c.filter((x) => x.id !== id)),
    }),
    [progress, lang, update, session, celebrations],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

export { inTelegram };
