import { useCallback, useEffect, useState } from 'react';
import { TRACK, type TrackEvent } from '../lib/track.ts';
import { addSecs, apply, load, save, type Activity } from './activity.ts';

/** The student's activity log: loads it, listens for what the learning screens report, and saves after every change. */
export function useActivity(): { activity: Activity; addTime: (secs: number) => void } {
  const [activity, setActivity] = useState<Activity>(() => load());

  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent<TrackEvent>).detail;
      if (!detail) return;
      setActivity((a) => {
        const next = apply(a, detail);
        if (next !== a) save(next);
        return next;
      });
    };
    window.addEventListener(TRACK, on);
    return () => window.removeEventListener(TRACK, on);
  }, []);

  const addTime = useCallback((secs: number) => {
    setActivity((a) => {
      const next = addSecs(a, secs);
      save(next);
      return next;
    });
  }, []);

  return { activity, addTime };
}
