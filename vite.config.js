import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('./src/', import.meta.url)),
  // Expose the existing repository JSON files as static build assets.
  publicDir: fileURLToPath(new URL('./json/', import.meta.url)),
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: [projectRoot],
    },
  },
});
