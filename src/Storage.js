import { LEADERBOARD_SIZE } from './config.js';

const KEYS = {
  HIGH_SCORE: 'snakeHS',
  LEADERBOARD: 'snakeElite',
  STATS: 'snakeStats',
  ACHIEVEMENTS: 'snakeAchievements',
  SETTINGS: 'snakeSettings',
};

export class Storage {
  getHighScore() {
    return parseInt(localStorage.getItem(KEYS.HIGH_SCORE) || '0', 10);
  }

  setHighScore(score) {
    const current = this.getHighScore();
    if (score > current) {
      localStorage.setItem(KEYS.HIGH_SCORE, score.toString());
      return true;
    }
    return false;
  }

  getLeaderboard() {
    return JSON.parse(localStorage.getItem(KEYS.LEADERBOARD) || '[]');
  }

  addToLeaderboard(entry) {
    const scores = this.getLeaderboard();
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    const trimmed = scores.slice(0, LEADERBOARD_SIZE);
    localStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(trimmed));
    return trimmed;
  }

  getStats() {
    return JSON.parse(localStorage.getItem(KEYS.STATS) || 'null');
  }

  setStats(stats) {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  }

  getAchievements() {
    return JSON.parse(localStorage.getItem(KEYS.ACHIEVEMENTS) || '[]');
  }

  setAchievements(ids) {
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(ids));
  }

  getSettings() {
    return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{"sound":true,"vibrate":true}');
  }

  setSettings(settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }

  clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }
}
