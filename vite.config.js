import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = (file) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  // Relative base so the built site can be dropped into any folder on any
  // static host (Netlify, GitHub Pages, S3, a plain nginx box) without config.
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    // Two entry pages. Without listing them both, only index.html is built
    // and experiences.html is silently dropped from dist/.
    rollupOptions: {
      input: {
        main: page('./index.html'),
        experiences: page('./experiences.html'),
      },
    },
  },
});
