import type { IncomingMessage, ServerResponse } from 'node:http';

/** An error that becomes an HTTP answer with this status and message. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(json);
}

export async function readJson(req: IncomingMessage, limit = 64 * 1024): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new HttpError(413, 'body too large');
    chunks.push(chunk as Buffer);
  }
  if (!chunks.length) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'invalid JSON');
  }
}

/** The caller's address. X-Forwarded-For is only believed when TRUST_PROXY=true (behind a reverse proxy). */
export function clientIp(req: IncomingMessage): string {
  if (process.env.TRUST_PROXY === 'true') {
    const fwd = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

/** A small fixed-window limiter. The returned function says true when the key is over its limit. */
export function makeLimiter(now: () => number = Date.now) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (key: string, limit: number, windowMs: number): boolean => {
    const t = now();
    const h = hits.get(key);
    if (!h || t > h.reset) {
      hits.set(key, { count: 1, reset: t + windowMs });
      if (hits.size > 5000) for (const [k, v] of hits) if (t > v.reset) hits.delete(k);
      return false;
    }
    h.count += 1;
    return h.count > limit;
  };
}

/** True for a page origin on this computer or on a private network: localhost, 127.x, 10.x, 192.168.x, 172.16-31.x, *.local. */
export function isLocalOrigin(origin: string): boolean {
  let u: URL;
  try {
    u = new URL(origin);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const h = u.hostname;
  return h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)\d+\.\d+(\.\d+)?$/.test(h) || h === '[::1]';
}
