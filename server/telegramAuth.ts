import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export type InitDataResult =
  | { ok: true; user: TelegramUser | null; authDate: number; startParam?: string }
  | { ok: false; reason: 'missing' | 'malformed' | 'bad-hash' | 'expired' | 'no-token' };

const hmac = (key: Buffer | string, data: string) => createHmac('sha256', key).update(data).digest();

function checkString(params: URLSearchParams, exclude: Set<string>): string {
  return [...params.entries()]
    .filter(([key]) => !exclude.has(key))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

/**
 * Validates Telegram.WebApp.initData as described in the official Mini Apps docs:
 * secret_key = HMAC_SHA256(bot_token, key="WebAppData"); hash = hex(HMAC_SHA256(data_check_string, secret_key)).
 * Never trust initDataUnsafe or a user id sent by the client without this check.
 */
export function validateInitData(
  initData: string | undefined | null,
  botToken: string,
  maxAgeSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): InitDataResult {
  if (!botToken) return { ok: false, reason: 'no-token' };
  if (!initData) return { ok: false, reason: 'missing' };
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const hash = params.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return { ok: false, reason: 'malformed' };

  const secret = hmac('WebAppData', botToken);
  const expected = Buffer.from(hash, 'hex');
  const matches = (exclude: string[]) => {
    const computed = hmac(secret, checkString(params, new Set(exclude)));
    return computed.length === expected.length && timingSafeEqual(computed, expected);
  };
  // All fields except `hash` are signed. Some clients add a `signature` field (for third-party
  // Ed25519 validation); accept the HMAC whether or not it was included in the signed string.
  const valid = matches(['hash']) || (params.has('signature') && matches(['hash', 'signature']));
  if (!valid) return { ok: false, reason: 'bad-hash' };

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || authDate <= 0) return { ok: false, reason: 'malformed' };
  if (maxAgeSeconds > 0 && nowSeconds - authDate > maxAgeSeconds) return { ok: false, reason: 'expired' };

  let user: TelegramUser | null = null;
  const rawUser = params.get('user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      if (typeof parsed?.id === 'number') user = parsed;
    } catch {
      return { ok: false, reason: 'malformed' };
    }
  }
  return { ok: true, user, authDate, startParam: params.get('start_param') ?? undefined };
}

/** Builds a correctly signed initData string. Used by tests and local tooling only. */
export function signInitData(fields: Record<string, string>, botToken: string): string {
  const params = new URLSearchParams(fields);
  const secret = hmac('WebAppData', botToken);
  params.set('hash', hmac(secret, checkString(params, new Set(['hash']))).toString('hex'));
  return params.toString();
}
