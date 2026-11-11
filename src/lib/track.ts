/**
 * Tiny event channel between the learning screens and the student area's activity log.
 * The screens only say what happened; the student area (if it is on the page) decides what to remember.
 * In the Telegram Mini App nothing listens, so these calls do nothing there.
 */
export type TrackEvent =
  | { kind: 'lesson'; topic: string; id?: string }
  | { kind: 'question' }
  | { kind: 'progress'; topic: string; id?: string; pct: number }
  | { kind: 'solved' }
  | { kind: 'game' };

export const TRACK = 'ss:track';

export function track(detail: TrackEvent): void {
  try {
    window.dispatchEvent(new CustomEvent(TRACK, { detail }));
  } catch {
    /* no window: nothing to tell */
  }
}
