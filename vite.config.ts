/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Keeps only the woff2 fonts (every current browser), so the single-file demo stays small. */
function woff2Only(): Plugin {
  return {
    name: 'woff2-only',
    enforce: 'pre',
    transform(code, id) {
      if (!/katex\.min\.css|@fontsource/.test(id)) return null;
      return code.replace(/,\s*url\([^)]*\.(?:woff|ttf)\)\s*format\(['"](?:woff|truetype)['"]\)/g, '');
    },
  };
}

export default defineConfig(({ mode }) => {
  // `vite build --mode standalone`: the whole app in one HTML file, demo coach in the browser.
  const standalone = mode === 'standalone';
  return {
    plugins: [react(), ...(standalone ? [woff2Only(), viteSingleFile()] : [])],
    define: standalone ? { 'import.meta.env.VITE_STANDALONE': JSON.stringify('true') } : {},
    resolve: standalone
      ? { alias: [{ find: /^\.\/workerFactory$/, replacement: path.resolve('src/lib/workerFactory.standalone.ts') }] }
      : {},
    // A classic (non-module) worker: module workers from blob URLs fail on pages opened from disk.
    worker: { format: standalone ? 'iife' : 'es' },
    build: standalone
      ? { outDir: 'demo-dist', sourcemap: false, assetsInlineLimit: Number.MAX_SAFE_INTEGER, chunkSizeWarningLimit: 6000 }
      : { outDir: 'dist', sourcemap: true, chunkSizeWarningLimit: 900 },
    test: {
      include: ['tests/unit/**/*.test.ts'],
      environment: 'node',
    },
  };
});
