// Builds the website (./website in this repository, or ../website next to it) and copies it into ./dist-site, where the server finds it.
// With dist-site present the server serves the website at "/" and the Mini App at "/app/".
//   npm run build:site        the website only
//   npm run build:all         the Mini App, the server and the website
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const inside = path.resolve(app, 'website');
const beside = path.resolve(app, '..', 'website');
const website = process.env.WEBSITE_DIR ? path.resolve(process.env.WEBSITE_DIR) : existsSync(path.join(inside, 'package.json')) ? inside : beside;
const out = path.resolve(app, process.env.SITE_DIR || 'dist-site');

if (!existsSync(path.join(website, 'package.json'))) {
  console.error(`Cannot find the website at ${website}. Set WEBSITE_DIR to its folder.`);
  process.exit(1);
}
if (!existsSync(path.join(website, 'node_modules'))) {
  console.log('Installing the website packages…');
  const install = spawnSync('npm', [existsSync(path.join(website, 'package-lock.json')) ? 'ci' : 'install', '--no-audit', '--no-fund'], { cwd: website, stdio: 'inherit' });
  if (install.status !== 0) process.exit(install.status ?? 1);
}
console.log(`Building the website in ${website}…`);
const build = spawnSync('npm', ['run', 'build'], { cwd: website, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

const built = path.join(website, 'dist');
if (!existsSync(path.join(built, 'index.html'))) {
  console.error('The website build has no index.html.');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(built, out, { recursive: true });
console.log(`The website is in ${out}. The server will now serve it at "/" and the Mini App at "/app/".`);
