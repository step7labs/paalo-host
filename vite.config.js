import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the built site can be dropped into any folder on any
  // static host (Netlify, GitHub Pages, S3, a plain nginx box) without config.
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
