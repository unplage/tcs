# tcs —— 贪吃蛇 PWA (v2)

- **Entrypoint**: `index.html` —— Vite SPA entry (no manual build needed for dev)
- **Architecture**: ES modules under `src/`, built by Vite (base `/tcs/` for GitHub Pages)
- **Commands**:
  - `npm run dev` —— Vite dev server with HMR
  - `npm run build` —— production build to `dist/`
  - `npm run gen-audio` —— regenerate Base64 audio data (`src/audioData.js`)
- **External dep**: Font Awesome 6.0.0 CDN —— internet required for icons
- **Storage**: `localStorage` only (`snakeHS`, `snakeElite`, `snakeStats`, `snakeAchievements`, `snakeSettings`)
- **No test/lint/typecheck tooling**: verify manually in browser
- **Game modes**: classic (4 difficulties), timed (60s countdown), survival (speed ramps up)
- **Controls**: touch joystick, canvas swipe, keyboard arrows; Space/Enter to start/pause/restart
- **Audio**: 15 embedded Base64 WAV sounds (programmatic synthesis), togglable in settings
- **Haptics**: `navigator.vibrate()` for eat/combo/death feedback, togglable in settings
- **PWA files**: `sw.js` and `manifest.json` at project root (NOT in `public/`); Vite copies them to `dist/` on build
- **Preview**: `npm run dev` —— open browser at `http://localhost:5173/` (dev, HMR)
  Production preview: `npm run build && npx serve dist`
