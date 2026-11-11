import { g4Stations, type G4AchievementId, type StationId } from '../../../shared/lessons/g4Fractions.ts';
import { useNav } from '../../lib/nav.tsx';
import { useStore } from '../../lib/store.tsx';

export const XP = { station: 10, homework: 15, quizPerCorrect: 10, mission: 20 };

/** Grade 4 progress rules. XP is given once per activity, so replaying never farms points. */
export function useKids() {
  const { progress, update, reward } = useStore();
  const nav = useNav();
  const stations = progress.kids.stations;

  /** The next unfinished station after `after` (wrapping around), or null when everything else is done. */
  const nextStation = (after: StationId): StationId | null => {
    const i = g4Stations.findIndex((s) => s.id === after);
    const order = [...g4Stations.slice(i + 1), ...g4Stations.slice(0, i)];
    return order.find((s) => !stations[s.id])?.id ?? null;
  };

  /** Marks a station complete; returns true when this completed the whole mission for the first time. */
  const completeStation = (id: StationId, opts: { xp?: number; badge?: G4AchievementId } = {}): boolean => {
    const firstTime = !stations[id];
    update((p) => void (p.kids.stations[id] = true));
    reward({ xp: firstTime ? opts.xp : undefined, badge: opts.badge });
    const allDone = g4Stations.every((s) => s.id === id || stations[s.id]);
    if (allDone && !progress.kids.completedAt) {
      update((p) => void (p.kids.completedAt = Date.now()));
      reward({ xp: XP.mission, badge: 'mission' });
      return true;
    }
    return false;
  };

  const goNext = (from: StationId) => {
    const next = nextStation(from);
    if (next && next !== from) nav.replace({ name: 'kids-station', station: next });
    else nav.replace({ name: 'kids-complete' });
  };

  return { progress, stations, completeStation, nextStation, goNext, update, reward, nav };
}
