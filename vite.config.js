import { defineConfig } from 'vite';
export default defineConfig({ base: './', build: { target: 'esnext', chunkSizeWarningLimit: 900 }, server: { port: 5190 } });
