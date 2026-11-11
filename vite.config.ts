import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  // Read PORT from .env too, so the dev proxy follows the API server's port.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const apiPort = Number(env.PORT || 8787);
  return {
    plugins: [react()],
    // Relative links, so the same build works at "/" and at "/app/" (where it lives next to the website).
    base: './',
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': `http://localhost:${apiPort}`,
      },
    },
    preview: { host: true, port: 4173 },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'es2020',
      // two pages: the Telegram Mini App and the student area of the website (/app/student/)
      rollupOptions: { input: { main: fileURLToPath(new URL('index.html', import.meta.url)), student: fileURLToPath(new URL('student/index.html', import.meta.url)) } },
    },
  };
});
