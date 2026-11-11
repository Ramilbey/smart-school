import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, get as httpGet } from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { gunzipSync } from 'node:zlib';
import { createStatic } from '../server/staticFiles.ts';

const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'ss-static-'));
  dirs.push(d);
  return d;
};
after(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

const put = (root: string, file: string, body: string | Buffer) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), body);
};

/** A website build, a Mini App build, and a secret file next to them that must never be reachable. */
function setup(withSite = true) {
  const base = tmp();
  const site = path.join(base, 'dist-site');
  const app = path.join(base, 'dist');
  put(base, 'secret.txt', 'TOP SECRET');
  put(app, 'index.html', '<html>mini app</html>');
  put(app, 'assets/app-abc.js', 'console.log("app")');
  if (withSite) {
    put(site, 'index.html', '<html>website</html>');
    put(site, 'teacher.html', '<html>teacher</html>');
    put(site, 'play.html', '<html>play</html>');
    put(site, 'assets/site-abc.js', 'console.log("site");'.repeat(200));
    put(site, 'media/film.mp4', Buffer.from('0123456789abcdefghij'));
  }
  return { base, site, app };
}

async function serve(opts: { site: string; app: string }, run: (get: (p: string, init?: RequestInit) => Promise<Response>, origin: string) => Promise<void>) {
  const files = createStatic({ appDir: opts.app, siteDir: opts.site });
  const server = createServer((req, res) => files.handle(req, res, new URL(req.url ?? '/', 'http://x')));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await run((p, init) => fetch(origin + p, { redirect: 'manual', ...init }), origin);
  } finally {
    server.close();
  }
}

describe('one address for the website and the Mini App', () => {
  it('/student opens the student area, a page of the Mini App build', async () => {
    const { site, app } = setup();
    put(app, 'student/index.html', '<html>student area</html>');
    await serve({ site, app }, async (get) => {
      const r = await get('/student?lang=ru');
      assert.equal(r.status, 302);
      assert.equal(r.headers.get('location'), '/app/student/?lang=ru');
      assert.equal((await get('/student/')).headers.get('location'), '/app/student/');
      assert.match(await (await get('/app/student/')).text(), /student area/);
    });
  });

  it('serves the website at / and the Mini App at /app/', async () => {
    const { site, app } = setup();
    await serve({ site, app }, async (get) => {
      assert.match(await (await get('/')).text(), /website/);
      assert.match(await (await get('/teacher.html')).text(), /teacher/);
      assert.match(await (await get('/teacher')).text(), /teacher/, 'short address without .html');
      assert.match(await (await get('/play?code=123456')).text(), /play/);
      assert.match(await (await get('/app/')).text(), /mini app/);
      assert.match(await (await get('/app/some/screen')).text(), /mini app/, 'the Mini App is one page: unknown paths get it');
      assert.equal(await (await get('/app/assets/app-abc.js')).text(), 'console.log("app")');
      const moved = await get('/app?go=g7');
      assert.equal(moved.status, 301);
      assert.equal(moved.headers.get('location'), '/app/?go=g7');
    });
  });

  it('says 404 for missing files instead of showing the wrong page', async () => {
    const { site, app } = setup();
    await serve({ site, app }, async (get) => {
      assert.equal((await get('/nope')).status, 404);
      assert.equal((await get('/nope.js')).status, 404);
      assert.equal((await get('/app/missing.js')).status, 404);
    });
  });

  it('never leaves the build folders', async () => {
    const { site, app } = setup();
    await serve({ site, app }, async (get) => {
      for (const bad of ['/../secret.txt', '/%2e%2e/secret.txt', '/app/%2e%2e/%2e%2e/secret.txt', '/..%2fsecret.txt', '/%00', '/%', '/assets/..%2f..%2fsecret.txt']) {
        const res = await get(bad);
        const body = await res.text();
        assert.ok(!body.includes('TOP SECRET'), `${bad} leaked the secret`);
        assert.ok(res.status === 400 || res.status === 404, `${bad} gave ${res.status}`);
      }
    });
  });

  it('keeps the old layout when there is no website build: the Mini App at /', async () => {
    const { site, app } = setup(false);
    await serve({ site, app }, async (get) => {
      assert.match(await (await get('/')).text(), /mini app/);
      assert.match(await (await get('/any/route')).text(), /mini app/);
      assert.equal((await get('/gone.js')).status, 404);
    });
  });

  it('says plainly when nothing is built', async () => {
    const base = tmp();
    await serve({ site: path.join(base, 'a'), app: path.join(base, 'b') }, async (get) => {
      const res = await get('/');
      assert.equal(res.status, 503);
      assert.match(await res.text(), /build/);
    });
  });

  it('answers byte ranges, so the film can be played and skipped through', async () => {
    const { site, app } = setup();
    await serve({ site, app }, async (get) => {
      const whole = await get('/media/film.mp4');
      assert.equal(whole.headers.get('accept-ranges'), 'bytes');
      assert.equal(whole.headers.get('content-type'), 'video/mp4');
      const part = await get('/media/film.mp4', { headers: { range: 'bytes=2-5' } });
      assert.equal(part.status, 206);
      assert.equal(part.headers.get('content-range'), 'bytes 2-5/20');
      assert.equal(await part.text(), '2345');
      const tail = await get('/media/film.mp4', { headers: { range: 'bytes=-4' } });
      assert.equal(await tail.text(), 'ghij');
      const open = await get('/media/film.mp4', { headers: { range: 'bytes=15-' } });
      assert.equal(await open.text(), 'fghij');
      assert.equal((await get('/media/film.mp4', { headers: { range: 'bytes=99-120' } })).status, 416);
      assert.equal((await get('/media/film.mp4', { headers: { range: 'bytes=abc' } })).status, 416);
    });
  });

  it('compresses text files for browsers that accept it, and only those', async () => {
    const { site, app } = setup();
    // fetch unzips by itself, so read the bytes as they travel
    const raw = (origin: string, p: string, encoding: string) =>
      new Promise<{ headers: Record<string, string | string[] | undefined>; body: Buffer }>((resolve, reject) => {
        httpGet(origin + p, { headers: { 'accept-encoding': encoding } }, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve({ headers: res.headers, body: Buffer.concat(chunks) }));
        }).on('error', reject);
      });
    await serve({ site, app }, async (get, origin) => {
      const plain = await raw(origin, '/assets/site-abc.js', 'identity');
      assert.equal(plain.headers['content-encoding'], undefined);
      const zipped = await raw(origin, '/assets/site-abc.js', 'gzip');
      assert.equal(zipped.headers['content-encoding'], 'gzip');
      assert.ok(zipped.body.length < plain.body.length / 5, 'much smaller on the wire');
      assert.equal(gunzipSync(zipped.body).toString(), plain.body.toString());
      assert.equal(zipped.headers['cache-control'], 'public, max-age=31536000, immutable');
      assert.equal((await get('/', { headers: { 'accept-encoding': 'gzip' } })).headers.get('cache-control'), 'no-cache');
    });
  });

  it('knows the types of the hand-tracking and voice files', async () => {
    const { site, app } = setup();
    put(site, 'mediapipe/wasm/engine.wasm', Buffer.from([0, 0x61, 0x73, 0x6d]));
    put(site, 'media/shapes/n5.mp3', Buffer.from('ID3'));
    put(site, 'mediapipe/hand_landmarker.task', Buffer.from('model'));
    await serve({ site, app }, async (get) => {
      assert.equal((await get('/mediapipe/wasm/engine.wasm')).headers.get('content-type'), 'application/wasm');
      assert.equal((await get('/media/shapes/n5.mp3')).headers.get('content-type'), 'audio/mpeg');
      assert.equal((await get('/mediapipe/hand_landmarker.task')).headers.get('content-type'), 'application/octet-stream');
    });
  });

  it('answers HEAD without a body', async () => {
    const { site, app } = setup();
    await serve({ site, app }, async (get) => {
      const res = await get('/', { method: 'HEAD' });
      assert.equal(res.status, 200);
      assert.equal(await res.text(), '');
    });
  });
});
