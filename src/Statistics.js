export class Statistics {
  constructor(storage) {
    this.storage = storage;
    this.data = this._load();
  }

  _load() {
    const raw = this.storage.getStats();
    if (!raw) {
      return {
        totalGames: 0, totalScore: 0, totalEaten: 0,
        totalSpecialEaten: 0, maxScore: 0, maxLength: 0,
        maxCombo: 0, survivalTime: 0, topThree: 0,
        insaneEaten: 0, specialTypesEaten: new Set(),
        timedRemaining: 0, perfectGame: 0,
      };
    }
    if (raw.specialTypesEaten && Array.isArray(raw.specialTypesEaten)) {
      raw.specialTypesEaten = new Set(raw.specialTypesEaten);
    } else if (!raw.specialTypesEaten) {
      raw.specialTypesEaten = new Set();
    }
    return raw;
  }

  _save() {
    const toSave = { ...this.data };
    toSave.specialTypesEaten = [...this.data.specialTypesEaten];
    this.storage.setStats(toSave);
  }

  recordGame(score, length, combo, mode, difficulty, eatenCount, specialEaten, specialTypes, timedLeft) {
    this.data.totalGames++;
    this.data.totalScore += score;
    this.data.totalEaten += eatenCount;
    this.data.totalSpecialEaten += specialEaten;
    this.data.maxScore = Math.max(this.data.maxScore, score);
    this.data.maxLength = Math.max(this.data.maxLength, length);
    this.data.maxCombo = Math.max(this.data.maxCombo, combo);

    if (specialTypes) {
      specialTypes.forEach(t => this.data.specialTypesEaten.add(t));
    }

    if (mode === 'survival') {
      this.data.survivalTime = Math.max(this.data.survivalTime, eatenCount);
    }

    if (difficulty === 'insane') {
      this.data.insaneEaten += eatenCount;
    }

    if (mode === 'timed' && timedLeft !== undefined) {
      this.data.timedRemaining = Math.max(this.data.timedRemaining, timedLeft);
    }

    this._save();
  }

  recordTopThree() {
    this.data.topThree++;
    this._save();
  }

  recordPerfectGame(typesCount) {
    if (typesCount >= 5) {
      this.data.perfectGame++;
      this._save();
    }
  }

  getData() {
    return { ...this.data, specialTypesEaten: this.data.specialTypesEaten };
  }

  reset() {
    this.data = {
      totalGames: 0, totalScore: 0, totalEaten: 0,
      totalSpecialEaten: 0, maxScore: 0, maxLength: 0,
      maxCombo: 0, survivalTime: 0, topThree: 0,
      insaneEaten: 0, specialTypesEaten: new Set(),
      timedRemaining: 0, perfectGame: 0,
    };
    this._save();
  }
}
