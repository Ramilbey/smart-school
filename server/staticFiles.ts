import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Hands out the files of the whole product from one address.
 *
 *  - `siteDir` holds the website (index.html, teacher.html, play.html and their files). It is served at "/".
 *  - `appDir` holds the Telegram Mini App. When the website is there too, the Mini App moves to "/app/".
 *    When there is no website build, the Mini App stays at "/" exactly as before.
 *
 * Both builds use relative links, so the same files work at "/" and at "/app/".
 */

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.vtt': 'text/vtt; charset=utf-8',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.vtt', '.webmanifest', '.wasm']);
const GZIP_LIMIT = 16 * 1024 * 1024;

export interface StaticOptions {
  /** The Mini App build (vite build). */
  appDir: string;
  /** The website build. Optional: without it the Mini App is served at "/". */
  siteDir: string;
  enabled?: boolean;
  /** Where the Mini App lives when the website is served at "/". */
  appPrefix?: string;
}

interface Target {
  root: string;
  /** An unknown path without a file extension gets the page itself (the Mini App is one page). */
  spa: boolean;
  /** "/teacher" finds teacher.html. */
  prettyUrls: boolean;
}

export function createStatic(opts: StaticOptions) {
  const prefix = (opts.appPrefix ?? '/app').replace(/\/+$/, '');
  const gzipCache = new Map<string, { mtime: number; body: Buffer }>();

  const hasSite = () => existsSync(path.join(opts.siteDir, 'index.html'));
  const hasApp = () => existsSync(path.join(opts.appDir, 'index.html'));

  /** Which layout is live right now (the folders may be built while the server runs). */
  const layout = (): 'site+app' | 'site' | 'app' | 'none' => (hasSite() ? (hasApp() ? 'site+app' : 'site') : hasApp() ? 'app' : 'none');

  function plain(res: ServerResponse, status: number, text: string, head = false) {
    res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    res.end(head ? undefined : text);
  }

  function resolveFile(t: Target, rel: string): string | null {
    // rel has no leading slash. Anything that leaves the folder is refused.
    const file = path.resolve(t.root, rel);
    if (file !== t.root && !file.startsWith(t.root + path.sep)) return null;
    return file;
  }

  function serveFrom(req: IncomingMessage, res: ServerResponse, t: Target, rel: string) {
    const head = req.method === 'HEAD';
    if (rel.includes('\0')) return plain(res, 400, 'bad request', head);
    let file = resolveFile(t, rel);
    if (!file) return plain(res, 400, 'bad request', head);

    const isFile = (f: string) => existsSync(f) && statSync(f).isFile();
    if (!isFile(file)) {
      const dirIndex = path.join(file, 'index.html');
      if (existsSync(file) && statSync(file).isDirectory() && isFile(dirIndex)) file = dirIndex;
      else if (t.prettyUrls && !/\.[a-z0-9]+$/i.test(rel) && rel !== '' && isFile(`${file}.html`)) file = `${file}.html`;
      else if (t.spa && !/\.[a-z0-9]+$/i.test(rel)) file = path.join(t.root, 'index.html'); // the one page of the Mini App
      else return plain(res, 404, 'not found', head);
    }

    const ext = path.extname(file).toLowerCase();
    const stat = statSync(file);
    const relFromRoot = path.relative(t.root, file).split(path.sep).join('/');
    const immutable = relFromRoot.startsWith('assets/') || relFromRoot.startsWith('fonts/');
    const headers: Record<string, string | number> = {
      'content-type': MIME[ext] ?? 'application/octet-stream',
      'cache-control': immutable ? 'public, max-age=31536000, immutable' : ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'accept-ranges': 'bytes',
      vary: 'Accept-Encoding',
    };

    // A byte range: video players (Safari above all) ask for pieces of the film.
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (!m || (m[1] === '' && m[2] === '')) {
        res.writeHead(416, { 'content-range': `bytes */${stat.size}` });
        return res.end();
      }
      let start = m[1] === '' ? Math.max(0, stat.size - Number(m[2])) : Number(m[1]);
      let end = m[1] === '' || m[2] === '' ? stat.size - 1 : Math.min(Number(m[2]), stat.size - 1);
      if (start > end || start >= stat.size) {
        res.writeHead(416, { 'content-range': `bytes */${stat.size}` });
        return res.end();
      }
      end = Math.min(end, stat.size - 1);
      start = Math.max(0, start);
      res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${stat.size}`, 'content-length': end - start + 1 });
      if (head) return res.end();
      return void createReadStream(file, { start, end }).pipe(res);
    }

    // Text files are sent compressed when the browser accepts it (the main script is about 1 MB).
    if (COMPRESSIBLE.has(ext) && stat.size <= GZIP_LIMIT && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) {
      let hit = gzipCache.get(file);
      if (!hit || hit.mtime !== stat.mtimeMs) {
        hit = { mtime: stat.mtimeMs, body: gzipSync(readFileSync(file), { level: 6 }) };
        gzipCache.set(file, hit);
      }
      res.writeHead(200, { ...headers, 'content-encoding': 'gzip', 'content-length': hit.body.length });
      return void res.end(head ? undefined : hit.body);
    }

    res.writeHead(200, { ...headers, 'content-length': stat.size });
    if (head) return res.end();
    createReadStream(file).pipe(res);
  }

  /** Serves GET and HEAD requests that are not API calls. */
  function handle(req: IncomingMessage, res: ServerResponse, url: URL) {
    const head = req.method === 'HEAD';
    if (opts.enabled === false) return plain(res, 404, 'not found', head);
    let rel: string;
    try {
      rel = decodeURIComponent(url.pathname);
    } catch {
      return plain(res, 400, 'bad request', head);
    }
    const mode = layout();
    if (mode === 'none') return plain(res, 503, 'Smart Schools is not built yet. Run: npm run build:all', head);

    if (mode === 'app') return serveFrom(req, res, { root: opts.appDir, spa: true, prettyUrls: false }, rel.replace(/^\/+/, ''));

    if (mode === 'site+app') {
      if (rel === prefix) {
        res.writeHead(301, { location: `${prefix}/${url.search}`, 'cache-control': 'no-cache' });
        return res.end();
      }
      // the student area is a page of the Mini App build, but its address is simply /student
      if (rel === '/student' || rel === '/student/') {
        res.writeHead(302, { location: `${prefix}/student/${url.search}`, 'cache-control': 'no-cache' });
        return res.end();
      }
      if (rel.startsWith(`${prefix}/`)) {
        return serveFrom(req, res, { root: opts.appDir, spa: true, prettyUrls: false }, rel.slice(prefix.length + 1));
      }
    }
    return serveFrom(req, res, { root: opts.siteDir, spa: false, prettyUrls: true }, rel.replace(/^\/+/, ''));
  }

  return { handle, layout, prefix };
}

export type StaticFiles = ReturnType<typeof createStatic>;
