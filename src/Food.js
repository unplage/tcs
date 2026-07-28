import { GRID_COUNT, SPECIAL_FOOD_TYPES } from './config.js';

export class Food {
  constructor() {
    this.normal = { x: 15, y: 10 };
    this.special = null;
    this.specialActive = false;
    this.specialTimer = 0;
  }

  generate(snake, obstacles = []) {
    let pos;
    let attempts = 0;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_COUNT),
        y: Math.floor(Math.random() * GRID_COUNT),
      };
      attempts++;
    } while (
      attempts < 1000 &&
      (snake.occupies(pos.x, pos.y) ||
       obstacles.some(o => o.x === pos.x && o.y === pos.y) ||
       (this.specialActive && this.special && pos.x === this.special.x && pos.y === this.special.y))
    );
    this.normal = pos;
  }

  spawnSpecial(snake, obstacles = []) {
    if (this.specialActive) return null;

    const r = Math.random();
    let type;
    if (r < 0.25) type = SPECIAL_FOOD_TYPES.GOLD;
    else if (r < 0.45) type = SPECIAL_FOOD_TYPES.SPEED;
    else if (r < 0.60) type = SPECIAL_FOOD_TYPES.SLOW;
    else if (r < 0.80) type = SPECIAL_FOOD_TYPES.POISON;
    else type = SPECIAL_FOOD_TYPES.GROW;

    let pos;
    let attempts = 0;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_COUNT),
        y: Math.floor(Math.random() * GRID_COUNT),
      };
      attempts++;
    } while (
      attempts < 500 &&
      (snake.occupies(pos.x, pos.y) ||
       obstacles.some(o => o.x === pos.x && o.y === pos.y) ||
       (pos.x === this.normal.x && pos.y === this.normal.y))
    );

    if (attempts < 500) {
      this.special = { x: pos.x, y: pos.y, type };
      this.specialActive = true;
      this.specialTimer = 7;
      return { x: pos.x, y: pos.y, type };
    }
    return null;
  }

  getSpecialChance(combo) {
    return Math.min(0.35, 0.15 + combo * 0.02);
  }

  update(dt) {
    if (this.specialActive) {
      this.specialTimer -= dt;
      if (this.specialTimer <= 0) {
        this.specialActive = false;
        this.special = null;
        return 'expired';
      }
    }
    return null;
  }

  getSpecialFlash() {
    if (!this.specialActive) return false;
    return this.specialTimer <= 3 && Math.floor(this.specialTimer * 4) % 2 === 0;
  }

  reset() {
    this.normal = { x: 15, y: 10 };
    this.special = null;
    this.specialActive = false;
    this.specialTimer = 0;
  }
}
