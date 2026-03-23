import { defineConfig } from 'vite';
import { resolve } from 'path';

// Separate build for content script - must be IIFE (no ES module imports)
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear main build output
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'ContentScript',
      formats: ['iife'],
      fileName: () => 'content/index.js',
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
