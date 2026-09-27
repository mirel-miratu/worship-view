import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'src/main/index.ts'),
      output: {
        entryFileNames: 'main.js',
      },
      // Keep adm-zip bundled: Forge's Vite plugin packages .vite, not node_modules.
      // External modules must be provided by the runtime or packaged separately.
      external: [
        'electron',
        'googleapis',
        'fs',
        'path',
        'crypto',
        'stream',
        'util',
        'url',
        'http',
        'https',
        'zlib',
        'events',
        'buffer',
        'os',
        'net',
        'tls',
        'child_process',
      ],
    },
    outDir: '.vite/build',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@assets': resolve(__dirname, '../../assets'),
    },
  },
});
