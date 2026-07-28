import { Game } from './Game.js';

const game = new Game();

window.game = game;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    console.log('SW registered, scope:', reg.scope);
  }).catch(err => {
    console.error('SW registration failed:', err);
  });
}
