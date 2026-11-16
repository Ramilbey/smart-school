import { useCallback, useState } from 'react';
import { emptyArcade, type ArcadeState } from '../../../shared/arcade.ts';

const KEY = 'ss-arcade-v1';

/** What the child has done in the games, kept on this device only (no account, no names, nothing sent anywhere). */
export function loadArcade(): ArcadeState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyArcade();
    const s = JSON.parse(raw) as ArcadeState;
    return s && s.v === 1 && typeof s.skills === 'object' ? { ...emptyArcade(), ...s } : emptyArcade();
  } catch {
    return emptyArcade();
  }
}
export function saveArcade(s: ArcadeState): void {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode or full: the map just will not survive a reload */ }
}

export function useArcade(): { state: ArcadeState; update: (fn: (s: ArcadeState) => ArcadeState) => void } {
  const [state, setState] = useState<ArcadeState>(() => loadArcade());
  const update = useCallback((fn: (s: ArcadeState) => ArcadeState) => {
    setState((s) => { const next = fn(s); saveArcade(next); return next; });
  }, []);
  return { state, update };
}
