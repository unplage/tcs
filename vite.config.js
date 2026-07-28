import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tcs/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    open: true,
  },
});
