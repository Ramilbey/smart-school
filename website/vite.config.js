import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = (name) => fileURLToPath(new URL(name, import.meta.url));

// Three pages: the promo site, the teacher portal and the student play page. The last two talk to the Smart Schools server.
export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: { main: page('index.html'), teacher: page('teacher.html'), play: page('play.html') },
      output: {
        // Three big libraries become three files. A browser downloads several files at once, which is much faster than one
        // big file on a slow or lossy connection, and the libraries are cached on their own when the page itself changes.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/qrcode') || id.includes('node_modules/dijkstrajs') || id.includes('node_modules/pngjs')) return 'qrcode';
        },
      },
    },
  },
  server: { port: 5190, host: true },
});
