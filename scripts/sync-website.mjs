// Copies the website's files (the landing page, the teacher portal and the student play page) from ../website into ./website,
// so this repository builds and runs on its own: `npm run build:all` finds ./website first.
//   npm run sync:website
// Only the files the website's own git repository tracks are copied (no node_modules, no build output).
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const src = process.env.WEBSITE_SRC ? path.resolve(process.env.WEBSITE_SRC) : path.resolve(app, '..', 'website');
const dest = path.resolve(app, 'website');

if (!existsSync(path.join(src, '.git'))) {
  console.error(`${src} is not a git checkout of the website. Set WEBSITE_SRC to it.`);
  process.exit(1);
}
const files = execFileSync('git', ['-C', src, 'ls-files', '-z']).toString().split('\0').filter((f) => f);
const dirty = execFileSync('git', ['-C', src, 'status', '--porcelain']).toString().trim();
if (dirty) console.warn('Note: the website has uncommitted changes. The files are copied as they are on disk now.');

rmSync(dest, { recursive: true, force: true });
for (const f of files) {
  if (!existsSync(path.join(src, f))) continue; // tracked but deleted on disk
  mkdirSync(path.dirname(path.join(dest, f)), { recursive: true });
  copyFileSync(path.join(src, f), path.join(dest, f));
}
console.log(`Copied ${files.length} website files into ${dest}`);
