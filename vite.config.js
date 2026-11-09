import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = (name) => fileURLToPath(new URL(name, import.meta.url));

// Three pages: the promo site, the teacher portal and the student play page. The last two talk to the Smart Schools server.
export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 900,
    rollupOptions: { input: { main: page('index.html'), teacher: page('teacher.html'), play: page('play.html') } },
  },
  server: { port: 5190, host: true },
});
