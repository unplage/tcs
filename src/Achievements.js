import { ACHIEVEMENTS } from './config.js';

export class Achievements {
  constructor(storage) {
    this.storage = storage;
    this.unlocked = new Set(storage.getAchievements());
    this.newlyUnlocked = [];
  }

  check(stats) {
    this.newlyUnlocked = [];
    const total = this.unlocked.size;

    for (const ach of ACHIEVEMENTS) {
      if (this.unlocked.has(ach.id)) continue;
      if (ach.check(stats, total)) {
        this.unlocked.add(ach.id);
        this.newlyUnlocked.push(ach);
      }
    }

    if (this.newlyUnlocked.length > 0) {
      this.storage.setAchievements([...this.unlocked]);
    }

    return this.newlyUnlocked;
  }

  isUnlocked(id) {
    return this.unlocked.has(id);
  }

  getAll() {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: this.unlocked.has(a.id),
    }));
  }

  getProgress() {
    return `${this.unlocked.size} / ${ACHIEVEMENTS.length}`;
  }
}
