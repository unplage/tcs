import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/tcs/' : '/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    open: true,
  },
  plugins: [
    {
      name: 'copy-pwa-files',
      closeBundle() {
        const dist = 'dist';
        if (!existsSync(dist)) mkdirSync(dist, { recursive: true });
        ['sw.js', 'manifest.json'].forEach(f => {
          if (existsSync(f)) copyFileSync(f, `${dist}/${f}`);
        });
      },
    },
  ],
}));
