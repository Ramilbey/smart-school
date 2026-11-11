// Runs the Vite dev server (Mini App, http://localhost:5173) and the API/bot server together.
// Browser development mode: API calls without Telegram initData are allowed.
import { spawn } from 'node:child_process';

const env = { ...process.env, ALLOW_DEV_AUTH: process.env.ALLOW_DEV_AUTH ?? 'true', SERVE_STATIC: 'false' };
const procs = [
  ['web', 'npx', ['vite']],
  ['api', 'npx', ['tsx', 'watch', 'server/index.ts']],
].map(([name, cmd, args]) => {
  const p = spawn(cmd, args, { env, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
  const prefix = (chunk) =>
    chunk
      .toString()
      .split('\n')
      .filter(Boolean)
      .map((l) => `[${name}] ${l}`)
      .join('\n') + '\n';
  p.stdout.on('data', (c) => process.stdout.write(prefix(c)));
  p.stderr.on('data', (c) => process.stderr.write(prefix(c)));
  p.on('exit', (code) => {
    console.log(`[${name}] exited with code ${code}`);
    procs.forEach((q) => q !== p && q.kill());
    process.exit(code ?? 0);
  });
  return p;
});

process.on('SIGINT', () => procs.forEach((p) => p.kill('SIGINT')));
process.on('SIGTERM', () => procs.forEach((p) => p.kill('SIGTERM')));
