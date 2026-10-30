/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  build: { outDir: 'dist', sourcemap: true, chunkSizeWarningLimit: 900 },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
