import { MODE_LABELS, DIFFICULTY_LABELS, DIFFICULTIES, SPECIAL_FOOD_LABELS, ACHIEVEMENTS as ACH_DEFS } from './config.js';

export class UIManager {
  constructor() {
    this.el = {};
    this.callbacks = {};
    this._cache();
    this._bind();
  }

  _cache() {
    const ids = [
      'score', 'highScore', 'length', 'extraInfo', 'extraLabel',
      'gameOverScreen', 'finalScore', 'finalLength', 'finalCombo',
      'finalEaten', 'finalSpecial', 'startBtn', 'pauseBtn', 'restartBtn',
      'restartGameOverBtn', 'menuBackBtn', 'scoreList',
      'comboDisplay', 'specialTimerBar', 'newRecordBadge',
    ];
    for (const id of ids) {
      this.el[id] = document.getElementById(id);
    }
  }

  _bind() {
    const on = (id, cb) => {
      const el = this.el[id] || document.getElementById(id);
      if (el) el.addEventListener('click', cb);
    };

    on('startBtn', () => this.callbacks.start?.());
    on('pauseBtn', () => this.callbacks.pause?.());
    on('restartBtn', () => this.callbacks.restart?.());
    on('restartGameOverBtn', () => this.callbacks.restart?.());
    on('menuBackBtn', () => this.callbacks.menu?.());

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this.callbacks.setMode?.(btn.dataset.mode));
    });

    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => this.callbacks.setDifficulty?.(btn.dataset.diff));
    });

    document.querySelectorAll('.panel-btn').forEach(btn => {
      btn.addEventListener('click', () => this.callbacks.openPanel?.(btn.dataset.panel));
    });

    const closeBtns = document.querySelectorAll('.panel-close');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.overlay-panel').forEach(p => p.classList.remove('open'));
      });
    });
  }

  on(event, cb) {
    this.callbacks[event] = cb;
  }

  updateStats(score, highScore, length, mode, extraInfo, combo) {
    if (this.el.score) this.el.score.innerText = score;
    if (this.el.highScore) {
      const hs = parseInt(this.el.highScore.innerText);
      if (score > hs) {
        this.el.highScore.innerText = score;
      }
    }
    if (this.el.length) this.el.length.innerText = length;
    if (this.el.extraInfo) this.el.extraInfo.innerText = extraInfo;

    if (combo > 1 && this.el.comboDisplay) {
      this.el.comboDisplay.innerText = `🔥 x${combo}`;
      this.el.comboDisplay.style.display = 'block';
      this.el.comboDisplay.classList.remove('combo-pop');
      void this.el.comboDisplay.offsetWidth;
      this.el.comboDisplay.classList.add('combo-pop');
    } else if (this.el.comboDisplay) {
      this.el.comboDisplay.style.display = 'none';
    }
  }

  setHighScore(val) {
    if (this.el.highScore) this.el.highScore.innerText = val;
  }

  showGameOver(score, length, combo, eaten, specialEaten, isNewRecord) {
    const screen = this.el.gameOverScreen;
    if (!screen) return;
    screen.style.display = 'flex';

    if (this.el.finalScore) this.el.finalScore.innerText = score;
    if (this.el.finalLength) this.el.finalLength.innerText = length;
    if (this.el.finalCombo) this.el.finalCombo.innerText = `${combo}x`;
    if (this.el.finalEaten) this.el.finalEaten.innerText = eaten;
    if (this.el.finalSpecial) this.el.finalSpecial.innerText = specialEaten;

    const badge = this.el.newRecordBadge;
    if (badge) {
      badge.style.display = isNewRecord ? 'block' : 'none';
    }
  }

  hideGameOver() {
    if (this.el.gameOverScreen) {
      this.el.gameOverScreen.style.display = 'none';
    }
  }

  updateButtons(state) {
    const startBtn = this.el.startBtn;
    const pauseBtn = this.el.pauseBtn;
    if (!startBtn) return;

    switch (state) {
      case 'idle':
        startBtn.innerHTML = '<i class="fas fa-play"></i> 开始';
        startBtn.className = 'action-btn start-btn';
        if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        break;
      case 'playing':
        startBtn.innerHTML = '<i class="fas fa-check"></i> 游戏中';
        startBtn.className = 'action-btn start-btn';
        if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        break;
      case 'paused':
        startBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
        startBtn.className = 'action-btn start-btn';
        if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-play"></i> 已暂停';
        break;
      case 'gameover':
        startBtn.innerHTML = '<i class="fas fa-redo"></i> 重开';
        startBtn.className = 'action-btn start-btn';
        if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        break;
    }
  }

  updateModeUI(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const isClassic = mode === 'classic';
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.style.opacity = isClassic ? '1' : '0.5';
    });
  }

  updateDifficultyUI(diff) {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === diff);
    });
  }

  renderLeaderboard(scores) {
    const list = this.el.scoreList;
    if (!list) return;
    list.innerHTML = '';
    if (scores.length === 0) {
      list.innerHTML = '<li style="text-align:center;color:#9aa4bf;padding:12px;">暂无记录，开始你的第一局！</li>';
      return;
    }
    scores.forEach((item, idx) => {
      const li = document.createElement('li');
      const isTop3 = idx < 3;
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
      li.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);${isTop3 ? 'background:rgba(255,215,0,0.06);border-radius:8px;' : ''}`;
      li.innerHTML = `
        <span style="font-weight:${isTop3 ? '700' : '400'};color:${isTop3 ? '#FFD700' : '#c8d0e6'}">${medal} ${idx + 1}. ${item.score}分</span>
        <span style="font-size:0.6rem;color:#9aa4bf;">${MODE_LABELS[item.mode] || item.mode} ${DIFFICULTY_LABELS[item.diff] || ''}</span>
      `;
      list.appendChild(li);
    });
  }

  showToast(msg, color = '#FFD700', duration = 1200) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerText = msg;
    toast.style.color = color;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  showAchievementUnlock(ach) {
    const div = document.createElement('div');
    div.className = 'achievement-popup';
    div.innerHTML = `<span style="font-size:1.4rem;">${ach.icon}</span><div><div style="font-weight:700;font-size:0.85rem;">成就解锁!</div><div style="font-size:0.75rem;opacity:0.8;">${ach.name}: ${ach.desc}</div></div>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }

  renderAchievements(achievements) {
    const container = document.getElementById('achievementList');
    if (!container) return;
    container.innerHTML = '';

    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;

    document.getElementById('achProgress').innerText = `${unlocked} / ${total}`;

    for (const ach of achievements) {
      const div = document.createElement('div');
      div.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
      div.innerHTML = `
        <div class="ach-icon">${ach.unlocked ? ach.icon : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-name">${ach.name}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
      `;
      container.appendChild(div);
    }
  }

  renderStats(stats) {
    const data = [
      { label: '总游戏数', value: stats.totalGames },
      { label: '总分', value: stats.totalScore },
      { label: '最高分', value: stats.maxScore },
      { label: '最长长度', value: stats.maxLength },
      { label: '最大连击', value: `${stats.maxCombo}x` },
      { label: '总吃食物', value: stats.totalEaten },
      { label: '总特殊食物', value: stats.totalSpecialEaten },
    ];

    const container = document.getElementById('statsList');
    if (!container) return;
    container.innerHTML = data.map(d =>
      `<div class="stat-item"><span class="stat-item-label">${d.label}</span><span class="stat-item-value">${d.value}</span></div>`
    ).join('');
  }

  updateSpecialTimer(active, timer, type) {
    const bar = this.el.specialTimerBar;
    if (!bar) return;
    if (active && timer > 0) {
      bar.style.display = 'block';
      bar.style.width = `${(timer / 7) * 100}%`;
      const color = ['#FFD700', '#00BFFF', '#BA55D3', '#FF1493', '#32CD32'][type] || '#FFD700';
      bar.style.background = color;
      bar.style.opacity = timer <= 3 ? (Math.floor(timer * 4) % 2 === 0 ? '1' : '0.3') : '1';
    } else {
      bar.style.display = 'none';
    }
  }

  openPanel(name) {
    document.querySelectorAll('.overlay-panel').forEach(p => p.classList.remove('open'));
    const panel = document.getElementById(`${name}Panel`);
    if (panel) panel.classList.add('open');
  }

  closeAllPanels() {
    document.querySelectorAll('.overlay-panel').forEach(p => p.classList.remove('open'));
  }

  setupSettings(audio, vibrate, callbacks) {
    const soundToggle = document.getElementById('soundToggle');
    const vibrateToggle = document.getElementById('vibrateToggle');
    const clearBtn = document.getElementById('clearDataBtn');

    if (soundToggle) {
      soundToggle.checked = audio;
      soundToggle.addEventListener('change', () => callbacks.onSoundToggle?.(soundToggle.checked));
    }
    if (vibrateToggle) {
      vibrateToggle.checked = vibrate;
      vibrateToggle.addEventListener('change', () => callbacks.onVibrateToggle?.(vibrateToggle.checked));
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('确定清除所有数据？此操作不可恢复！')) {
          callbacks.onClearData?.();
          this.showToast('数据已清除', '#ff6b6b');
        }
      });
    }
  }

  updateSpecialEaten(types) {
    const el = document.getElementById('specialTypesEaten');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const span = document.createElement('span');
      span.className = `special-dot ${types.has(i) ? 'eaten' : ''}`;
      span.title = SPECIAL_FOOD_LABELS[i];
      const colors = ['#FFD700', '#00BFFF', '#BA55D3', '#FF1493', '#32CD32'];
      span.style.background = types.has(i) ? colors[i] : '#333';
      el.appendChild(span);
    }
  }
}
