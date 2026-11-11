// Builds the original "hand-figure" app (vendor/hand-figure, exactly as published by olimoverkinjon, commit efc0162)
// into public/hand-figure/, where the "Shapes you can hold" chapter shows it in a frame. None of its files are changed:
//   1. its own scripts/fetch-assets.mjs puts the MediaPipe runtime and the hand model in its public/ folder,
//   2. vite builds it with relative links, so it works from any folder.
// Runs before every build (npm run build). It does nothing when the output is newer than the sources; FORCE=1 builds anyway.
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, statSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hf = path.join(site, 'vendor', 'hand-figure');
const out = path.join(site, 'public', 'hand-figure');
const vite = path.join(site, 'node_modules', 'vite', 'bin', 'vite.js');

if (!existsSync(path.join(hf, 'src', 'main.js'))) {
  console.error('vendor/hand-figure is missing.');
  process.exit(1);
}

const newest = (dir) => {
  let t = 0;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'public' || name === 'dist') continue;
    const p = path.join(dir, name);
    const s = statSync(p);
    t = Math.max(t, s.isDirectory() ? newest(p) : s.mtimeMs);
  }
  return t;
};
const built = path.join(out, 'index.html');
const ready = existsSync(built) && existsSync(path.join(out, 'models', 'hand_landmarker.task')) && existsSync(path.join(out, 'wasm'));
if (ready && !process.env.FORCE && statSync(built).mtimeMs > newest(hf)) {
  console.log('hand-figure is already built in public/hand-figure/.');
  process.exit(0);
}

// Its asset script looks for node_modules next to itself. The website has the same two packages (three and
// @mediapipe/tasks-vision), so point it at ours instead of installing them twice.
const nm = path.join(hf, 'node_modules');
if (!existsSync(nm) && !(() => { try { return lstatSync(nm).isSymbolicLink(); } catch { return false; } })()) {
  symlinkSync(path.join('..', '..', 'node_modules'), nm, 'dir');
}

const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`${cmd} ${args.join(' ')} failed`);
    process.exit(r.status ?? 1);
  }
};
console.log('hand-figure: fetching its runtime and hand model (its own script)…');
run(process.execPath, ['scripts/fetch-assets.mjs'], hf);
console.log('hand-figure: building…');
run(process.execPath, [vite, 'build', hf, '--base', './', '--outDir', out, '--emptyOutDir'], site);
console.log(`hand-figure is built in ${out}`);
