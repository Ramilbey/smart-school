import { validateInitData } from './telegramAuth.ts';

/**
 * Who may read the teacher homework report: only teachers listed in TEACHER_IDS, with valid Telegram initData.
 * The report itself is built by the pure code in shared/report.ts.
 */

export { buildTeacherReport, hideOtherNames, shortName, type StoredEntry } from '../shared/report.ts';

/* ---------- authorisation ---------- */

/** TEACHER_IDS="123, 456" → {123, 456}. Anything that is not a positive integer is ignored. */
export function parseTeacherIds(raw: string | undefined): Set<number> {
  const ids = new Set<number>();
  for (const part of (raw ?? '').split(/[\s,;]+/)) {
    if (!/^\d{1,16}$/.test(part)) continue;
    const id = Number(part);
    if (Number.isSafeInteger(id) && id > 0) ids.add(id);
  }
  return ids;
}

export type TeacherAccess = { ok: true; userId: number } | { ok: false; status: 401 | 403 };

/**
 * "Authorization: tma <initData>" → may this caller read the report?
 * 401: no or invalid Telegram login. 403: a real Telegram user who is not on the teacher list.
 * Development auth (ALLOW_DEV_AUTH) never unlocks this endpoint.
 * With open: true (TEACHER_OPEN) every real Telegram user passes; the caller then hides the other students' names.
 */
export function teacherAccess(
  authorization: string | undefined,
  opts: { botToken: string; maxAgeSeconds: number; teacherIds: Set<number>; open?: boolean; nowSeconds?: number },
): TeacherAccess {
  const header = authorization ?? '';
  const initData = header.startsWith('tma ') ? header.slice(4) : '';
  const result = validateInitData(initData, opts.botToken, opts.maxAgeSeconds, opts.nowSeconds);
  if (!result.ok || !result.user) return { ok: false, status: 401 };
  if (!opts.open && !opts.teacherIds.has(result.user.id)) return { ok: false, status: 403 };
  return { ok: true, userId: result.user.id };
}
