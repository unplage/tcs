import { Snake } from './Snake.js';
import { Food } from './Food.js';
import { Renderer } from './Renderer.js';
import { ParticleSystem } from './ParticleSystem.js';
import { InputManager } from './InputManager.js';
import { AudioManager } from './AudioManager.js';
import { UIManager } from './UIManager.js';
import { Storage } from './Storage.js';
import { Achievements } from './Achievements.js';
import { Statistics } from './Statistics.js';
import { GRID_COUNT, SPEEDS, SPECIAL_FOOD_TYPES } from './config.js';

export class Game {
  constructor() {
    this.state = 'idle';
    this.mode = 'classic';
    this.difficulty = 'medium';
    this.score = 0;
    this.highScore = 0;
    this.combo = 0;
    this.lastEatTime = 0;
    this.timeLeft = 60;
    this.currentSpeed = SPEEDS.medium;
    this.elapsed = 0;
    this.lastTimestamp = 0;
    this.logicAccumulator = 0;
    this.interpolate = 0;
    this.gameLoopBound = this._gameLoop.bind(this);
    this.obstacles = [];

    this.eatCount = 0;
    this.specialEatCount = 0;
    this.specialTypesThisGame = new Set();
    this.isNewRecord = false;
    this.deathTimer = 0;

    this.storage = new Storage();
    this.stats = new Statistics(this.storage);
    this.achievements = new Achievements(this.storage);
    this.snake = new Snake();
    this.food = new Food();
    this.particles = new ParticleSystem();
    this.renderer = new Renderer(document.getElementById('gameCanvas'));
    this.audio = new AudioManager();
    this.input = new InputManager(this);
    this.ui = new UIManager();

    this.settings = this.storage.getSettings();

    this._setup();
  }

  async _setup() {
    this.highScore = this.storage.getHighScore();
    this.ui.setHighScore(this.highScore);

    await this.audio.init();
    this.audio.muted = !this.settings.sound;
    this.audio.setVolume(0.5);

    this.ui.on('start', () => this._onStart());
    this.ui.on('pause', () => this._onPause());
    this.ui.on('restart', () => this._onRestart());
    this.ui.on('menu', () => this._onMenu());
    this.ui.on('setMode', (mode) => this._setMode(mode));
    this.ui.on('setDifficulty', (diff) => this._setDifficulty(diff));
    this.input.setSettings(this.settings);
    this.input.on('up', () => this.snake.setDirection('up'));
    this.input.on('down', () => this.snake.setDirection('down'));
    this.input.on('left', () => this.snake.setDirection('left'));
    this.input.on('right', () => this.snake.setDirection('right'));
    this.input.on('start', () => this._onStart());
    this.input.on('pause', () => this._onPause());

    this.input.attach(
      document.getElementById('joystickBase'),
      document.getElementById('gameCanvas')
    );

    this.ui.setupSettings(this.settings.sound, this.settings.vibrate, {
      onSoundToggle: (enabled) => {
        this.settings.sound = enabled;
        this.audio.muted = !enabled;
        this.storage.setSettings(this.settings);
      },
      onVibrateToggle: (enabled) => {
        this.settings.vibrate = enabled;
        this.storage.setSettings(this.settings);
        this.input.setSettings(this.settings);
      },
      onClearData: () => {
        this.storage.clearAll();
        this.highScore = 0;
        this.ui.setHighScore(0);
        this.stats.reset();
        this.achievements = new Achievements(this.storage);
        this.ui.renderLeaderboard([]);
      },
    });

    this.ui.on('openPanel', (name) => {
      if (name === 'achievement') {
        this.ui.renderAchievements(this.achievements.getAll());
      } else if (name === 'stats') {
        this.ui.renderStats(this.stats.getData());
      }
      this.ui.openPanel(name);
    });

    this.renderer.resize();
    window.addEventListener('resize', () => this.renderer.resize());

    this._fullReset();
    this.renderer.render(this.snake, this.food, this.particles, this.obstacles, 0.016, 0);
    this.ui.renderLeaderboard(this.storage.getLeaderboard());

    this.audio.play('click');
  }

  _onStart() {
    if (this.state === 'gameover') {
      this._fullReset();
      this._startPlaying();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.lastTimestamp = performance.now();
      requestAnimationFrame(this.gameLoopBound);
      this.ui.updateButtons('playing');
    } else if (this.state === 'idle') {
      this._startPlaying();
    }
  }

  _onPause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.ui.updateButtons('paused');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.lastTimestamp = performance.now();
      requestAnimationFrame(this.gameLoopBound);
      this.ui.updateButtons('playing');
    }
  }

  _onRestart() {
    this._fullReset();
    this._startPlaying();
  }

  _onMenu() {
    this._fullReset();
    this.ui.hideGameOver();
    this.ui.updateButtons('idle');
  }

  _startPlaying() {
    this.state = 'playing';
    this.lastTimestamp = performance.now();
    this.input.vibrate(20);
    this.audio.play('start');
    requestAnimationFrame(this.gameLoopBound);
    this.ui.updateButtons('playing');
  }

  _setMode(mode) {
    if (this.state === 'playing' || this.state === 'paused') return;
    this.mode = mode;
    this.ui.updateModeUI(mode);
    this._fullReset();
    this.ui.updateButtons('idle');
    this.audio.play('click');
  }

  _setDifficulty(diff) {
    if (this.mode !== 'classic') return;
    this.difficulty = diff;
    this.ui.updateDifficultyUI(diff);
    this._fullReset();
    this.ui.updateButtons('idle');
    this.audio.play('click');
  }

  _fullReset() {
    this.state = 'idle';
    this.score = 0;
    this.combo = 0;
    this.lastEatTime = 0;
    this.eatCount = 0;
    this.specialEatCount = 0;
    this.specialTypesThisGame = new Set();
    this.elapsed = 0;
    this.logicAccumulator = 0;
    this.isNewRecord = false;
    this.timeLeft = 60;

    this._updateSpeed();

    this.snake.reset();
    this.food.reset();
    this.particles.clear();
    this.obstacles = [];

    if (this.mode === 'classic' && this.difficulty === 'insane') {
      this._genObstacles();
    }

    this.food.generate(this.snake, this.obstacles);
    this.ui.hideGameOver();
    this.ui.updateButtons('idle');
    this._updateUI();
    this.ui.updateSpecialTimer(false, 0, 0);
  }

  _updateSpeed() {
    if (this.mode === 'classic') {
      this.currentSpeed = SPEEDS[this.difficulty] || SPEEDS.medium;
    } else if (this.mode === 'timed') {
      this.currentSpeed = 125;
    } else {
      this.currentSpeed = 120;
    }
  }

  _genObstacles() {
    this.obstacles = [];
    for (let i = 0; i < 6; i++) {
      let pos;
      let attempts = 0;
      do {
        pos = {
          x: Math.floor(Math.random() * GRID_COUNT),
          y: Math.floor(Math.random() * GRID_COUNT),
        };
        attempts++;
      } while (
        attempts < 300 &&
        (this.snake.occupies(pos.x, pos.y) ||
         pos.x === this.food.normal.x && pos.y === this.food.normal.y)
      );
      if (attempts < 300) this.obstacles.push(pos);
    }
  }

  _gameLoop(timestamp) {
    if (this.state !== 'playing' && this.deathTimer <= 0) return;

    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;
    this.elapsed += dt;

    if (this.state === 'playing') {
      this.logicAccumulator += dt * 1000;

      const interval = this.currentSpeed;
      while (this.logicAccumulator >= interval) {
        this._updateLogic();
        this.logicAccumulator -= interval;
      }

      this.interpolate = this.logicAccumulator / interval;
    }

    if (this.state === 'gameover') {
      this.deathTimer -= dt;
    }

    this.food.update(dt);
    this.particles.update(dt);
    if (this.state === 'playing') this._checkSpecialFoodSpawn(dt);

    this.renderer.render(
      this.snake,
      this.food,
      this.particles,
      this.obstacles,
      dt,
      this.state === 'playing' ? this.interpolate : 0
    );

    this._updateUI();

    if (this.state === 'playing' || this.deathTimer > 0) {
      requestAnimationFrame(this.gameLoopBound);
    }
  }

  _updateLogic() {
    const head = this.snake.move(GRID_COUNT);

    if (!this.snake.alive) {
      this._gameOver();
      return;
    }

    if (this.obstacles.some(o => o.x === head.x && o.y === head.y)) {
      this.snake.alive = false;
      this._gameOver();
      return;
    }

    this._checkFoodCollision(head);
    this._checkSpecialCollision(head);

    if (this.mode === 'survival') {
      this.currentSpeed = Math.max(48, 120 - Math.floor(this.score / 35) * 4);
    }

    if (this.mode === 'timed') {
      this.timeLeft -= this.currentSpeed / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._gameOver();
        return;
      }
    }
  }

  _checkFoodCollision(head) {
    if (head.x === this.food.normal.x && head.y === this.food.normal.y) {
      const now = Date.now();
      if (this.lastEatTime && (now - this.lastEatTime) < 2000) {
        this.combo++;
      } else {
        this.combo = 1;
      }
      this.lastEatTime = now;

      const comboBonus = Math.min(3, 1 + Math.floor(this.combo / 3));
      this.score += 10 * comboBonus;
      this.eatCount++;
      this.snake.grow();

      this.audio.play('eat');
      this.input.vibrate(30);

      const unit = this.renderer.gridUnit;
      this.particles.emitBurst(head.x, head.y, {
        color: '#71f59e',
        count: 8,
        speed: 40 + Math.random() * 60,
        life: 0.35,
        gravity: 20,
      });

      this.food.generate(this.snake, this.obstacles);

      if (this.mode === 'timed') this.timeLeft = Math.min(99, this.timeLeft + 2);

      this._playComboSound();
    }
  }

  _checkSpecialCollision(head) {
    if (!this.food.specialActive || !this.food.special) return;
    if (head.x !== this.food.special.x || head.y !== this.food.special.y) return;

    const type = this.food.special.type;
    this.specialTypesThisGame.add(type);
    this.specialEatCount++;

    this.food.specialActive = false;
    this.food.special = null;

    const unit = this.renderer.gridUnit;
    const colors = ['#FFD700', '#00BFFF', '#BA55D3', '#FF1493', '#32CD32'];
    this.particles.emitBurst(head.x, head.y, {
      color: colors[type] || '#fff',
      count: 15,
      speed: 50 + Math.random() * 80,
      life: 0.5,
      gravity: 0,
    });

    this._applySpecialEffect(type);

    if (this.mode === 'timed') this.timeLeft += 3;
  }

  _applySpecialEffect(type) {
    switch (type) {
      case SPECIAL_FOOD_TYPES.GOLD: {
        const bonus = 30 * Math.min(3, 1 + Math.floor(this.combo / 3));
        this.score += bonus;
        this.audio.play('specialGold');
        this.renderer.flash('#FFD700', 0.2);
        this.input.vibrate(50);
        this.ui.showToast(`✨ 黄金 +${bonus}`, '#FFD700');
        break;
      }
      case SPECIAL_FOOD_TYPES.SPEED: {
        if (this.currentSpeed > 45) {
          this.currentSpeed = Math.max(45, this.currentSpeed - 15);
          this.score += 10;
          this.audio.play('specialSpeed');
          this.renderer.flash('#00BFFF', 0.15);
          this.ui.showToast('💨 加速!', '#77DDFF');
        }
        break;
      }
      case SPECIAL_FOOD_TYPES.SLOW: {
        this.currentSpeed = Math.min(280, this.currentSpeed + 30);
        this.score += 10;
        this.audio.play('specialSlow');
        this.renderer.flash('#BA55D3', 0.15);
        this.ui.showToast('🐢 减速缓冲', '#C58AFF');
        break;
      }
      case SPECIAL_FOOD_TYPES.POISON: {
        this.score = Math.max(0, this.score - 15);
        this.snake.shrink(1);
        this.audio.play('specialPoison');
        this.renderer.flash('#FF1493', 0.3);
        this.renderer.shake(6, 0.3);
        this.input.vibrate([50, 30, 50]);
        this.ui.showToast('💀 毒果! -15分', '#ff6b6b');
        return;
      }
      case SPECIAL_FOOD_TYPES.GROW: {
        this.snake.grow(2);
        this.score += 15;
        this.audio.play('specialGrow');
        this.renderer.flash('#32CD32', 0.15);
        this.input.vibrate(40);
        this.ui.showToast('🐍 分身 +2长度!', '#32CD32');
        break;
      }
    }
  }

  _checkSpecialFoodSpawn(dt) {
    if (this.food.specialActive) return;

    const chance = this.food.getSpecialChance(this.combo);
    if (Math.random() < chance * dt * 2) {
      this.food.spawnSpecial(this.snake, this.obstacles);
    }
  }

  _playComboSound() {
    if (this.combo >= 8) this.audio.play('combo8');
    else if (this.combo >= 5) this.audio.play('combo5');
    else if (this.combo >= 3) this.audio.play('combo3');
    else if (this.combo >= 2) this.audio.play('combo2');

    if (this.combo >= 3) {
      this.renderer.flash('rgba(255, 215, 0, 0.1)', 0.1);
      this.input.vibrate(this.combo * 10);
    }
  }

  _gameOver() {
    this.state = 'gameover';
    this.deathTimer = 0.6;
    this.audio.play('gameOver');
    this.input.vibrate([100, 50, 100]);
    this.renderer.shake(8, 0.4);

    this.renderer.flash('#ff0000', 0.3);

    const head = this.snake.head;
    if (head) {
      const unit = this.renderer.gridUnit;
      this.particles.emitBurst(head.x, head.y, {
        color: '#ff4444',
        count: 25,
        speed: 60 + Math.random() * 100,
        life: 0.6,
        gravity: 30,
        spread: Math.PI * 2,
      });
    }

    const isNewHS = this.storage.setHighScore(this.score);
    this.isNewRecord = isNewHS;

    const entry = {
      score: this.score,
      mode: this.mode,
      diff: this.difficulty,
      date: new Date().toLocaleString(),
    };
    const leaderboard = this.storage.addToLeaderboard(entry);
    this.ui.renderLeaderboard(leaderboard);

    const position = leaderboard.findIndex(e => e === entry);
    if (position < 3 && !isNewHS) {
      this.stats.recordTopThree();
    }

    this.stats.recordGame(
      this.score, this.snake.length, this.combo,
      this.mode, this.difficulty, this.eatCount,
      this.specialEatCount, this.specialTypesThisGame,
      this.mode === 'timed' ? Math.ceil(this.timeLeft) : undefined
    );

    this.stats.recordPerfectGame(this.specialTypesThisGame.size);

    const newlyUnlocked = this.achievements.check(this.stats.getData());
    for (const ach of newlyUnlocked) {
      this.audio.play('achievement');
      this.ui.showAchievementUnlock(ach);
    }

    this.ui.showGameOver(
      this.score, this.snake.length, this.combo,
      this.eatCount, this.specialEatCount, this.isNewRecord
    );
    this.ui.updateSpecialEaten(this.specialTypesThisGame);
    this.ui.updateButtons('gameover');

    this.ui.updateSpecialTimer(false, 0, 0);
    this.ui.updateStats(
      this.score, this.highScore, this.snake.length,
      this.mode, this._getExtraInfo(), this.combo
    );
  }

  _updateUI() {
    this.ui.updateStats(
      this.score,
      this.highScore,
      this.snake.length,
      this.mode,
      this._getExtraInfo(),
      this.combo
    );

    this.ui.updateSpecialTimer(
      this.food.specialActive,
      this.food.specialTimer,
      this.food.special ? this.food.special.type : 0
    );
  }

  _getExtraInfo() {
    if (this.mode === 'timed') {
      return `${Math.ceil(this.timeLeft)}s`;
    } else if (this.mode === 'survival') {
      return `${this.currentSpeed}ms`;
    }
    return '∞';
  }
}
