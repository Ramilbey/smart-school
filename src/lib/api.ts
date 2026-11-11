import type { TeacherReport } from '../../shared/report.ts';
import type { TutorRequest, TutorResponse } from '../../shared/tutor.ts';
import type { BoardEvent } from '../../shared/board/script.ts';
import { telegram } from './telegram.ts';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

class HttpStatusError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

async function call<T>(path: string, init: RequestInit = {}, timeoutMs = 8000): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (telegram.initData) headers.authorization = `tma ${telegram.initData}`;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new HttpStatusError(res.status);
  return (await res.json()) as T;
}

export interface Session {
  reachable: boolean;
  authenticated: boolean;
  ai: boolean;
  /** Whether the whiteboard tutor and explainer can use the live AI (it also works for visitors without a Telegram login). */
  board: boolean;
  /** Whether the server can make a voice (so the lesson is heard even where the browser has no voices). */
  tts: boolean;
  firstName?: string;
}

/** Checks whether the backend is reachable and validates Telegram initData on the server. */
export async function fetchSession(): Promise<Session> {
  try {
    const s = await call<{ authenticated: boolean; ai: boolean; board?: boolean; tts?: boolean; user: { firstName: string } | null }>(
      '/api/session',
      { method: 'POST', body: '{}' },
      5000,
    );
    return { reachable: true, authenticated: s.authenticated, ai: s.ai, board: s.board ?? s.ai, tts: s.tts ?? false, firstName: s.user?.firstName };
  } catch {
    return { reachable: false, authenticated: false, ai: false, board: false, tts: false };
  }
}

/** Live tutor reply. Returns null on any failure so the caller uses the curated fallback. */
export async function askTutor(req: TutorRequest): Promise<TutorResponse | null> {
  try {
    return await call<TutorResponse>('/api/tutor', { method: 'POST', body: JSON.stringify(req) }, 11000);
  } catch {
    return null;
  }
}

/** A live game by its code, for the "join a game" box: the title when it is open to join, or why not. */
export async function peekGame(code: string): Promise<{ ok: true; title: string } | { ok: false; why: 'none' | 'done' | 'full' | 'offline' }> {
  try {
    const res = await fetch(`${BASE}/api/play/peek?code=${encodeURIComponent(code)}`, { signal: AbortSignal.timeout(8000) });
    if (res.status === 404 || res.status === 400) return { ok: false, why: 'none' };
    if (!res.ok) return { ok: false, why: 'offline' };
    const g = (await res.json()) as { title: string; status: string; full: boolean };
    return g.status === 'done' ? { ok: false, why: 'done' } : g.full ? { ok: false, why: 'full' } : { ok: true, title: g.title };
  } catch {
    return { ok: false, why: 'offline' };
  }
}

/** One sentence as an audio file made by the server, or null when that did not work. */
export async function fetchSpeech(text: string, lang: string): Promise<Blob | null> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (telegram.initData) headers.authorization = `tma ${telegram.initData}`;
  try {
    const res = await fetch(`${BASE}/api/tts`, { method: 'POST', headers, body: JSON.stringify({ text, lang }), signal: AbortSignal.timeout(15000) });
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}

export type BoardOutcome = 'ok' | 'ai-off' | 'limit-you' | 'limit-all' | 'error';

/**
 * Asks the whiteboard AI and calls back with each event as soon as its line has arrived (the server streams one JSON object per line).
 * Resolves with how it ended; 'ai-off' means this server has no AI key, so the caller shows a prepared lesson instead.
 */
export async function streamBoard(body: unknown, onEvent: (e: BoardEvent) => void, signal?: AbortSignal): Promise<BoardOutcome> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (telegram.initData) headers.authorization = `tma ${telegram.initData}`;
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/board`, { method: 'POST', headers, body: JSON.stringify(body), signal });
  } catch {
    return 'error';
  }
  if (res.status === 503) return 'ai-off';
  if (res.status === 429) {
    const j = (await res.json().catch(() => ({}))) as { scope?: string };
    return j.scope === 'everyone' ? 'limit-all' : 'limit-you';
  }
  if (!res.ok || !res.body) return 'error';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) { try { onEvent(JSON.parse(line) as BoardEvent); } catch { /* a broken line is skipped */ } }
      }
    }
  } catch {
    return 'error';
  }
  return 'ok';
}

export async function loadRemoteProgress(): Promise<{ progress: unknown; updatedAt: number } | null> {
  try {
    return await call('/api/progress', { method: 'GET' }, 5000);
  } catch {
    return null;
  }
}

export async function saveRemoteProgress(progress: unknown, updatedAt: number): Promise<void> {
  try {
    await call('/api/progress', { method: 'PUT', body: JSON.stringify({ progress, updatedAt }) }, 5000);
  } catch {
    /* local copy is the source of truth when offline */
  }
}

export type TeacherReportResult = { status: 'ok'; report: TeacherReport } | { status: 'not-teacher' } | { status: 'unavailable' };

/** The real homework report. Only teachers listed on the server get it; everyone else sees the sample. */
export async function fetchTeacherReport(): Promise<TeacherReportResult> {
  if (!telegram.initData) return { status: 'not-teacher' };
  try {
    return { status: 'ok', report: await call<TeacherReport>('/api/teacher/report', { method: 'GET' }, 8000) };
  } catch (e) {
    if (e instanceof HttpStatusError && (e.status === 401 || e.status === 403)) return { status: 'not-teacher' };
    return { status: 'unavailable' };
  }
}
