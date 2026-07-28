export const GRID_COUNT = 20;

export const SPEEDS = {
  easy: 180,
  medium: 130,
  hard: 85,
  insane: 55,
};

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'insane'];
export const MODES = ['classic', 'timed', 'survival'];

export const SPECIAL_FOOD_TYPES = {
  GOLD: 0,
  SPEED: 1,
  SLOW: 2,
  POISON: 3,
  GROW: 4,
};

export const SPECIAL_FOOD_COLORS = {
  0: '#FFD700',
  1: '#00BFFF',
  2: '#BA55D3',
  3: '#FF1493',
  4: '#32CD32',
};

export const SPECIAL_FOOD_LABELS = {
  0: '黄金',
  1: '加速',
  2: '减速',
  3: '毒果',
  4: '分身',
};

export const COMBO_WINDOW = 2000;
export const SPECIAL_FOOD_DURATION = 7;
export const LEADERBOARD_SIZE = 12;

export const MODE_LABELS = {
  classic: '经典',
  timed: '限时狂潮',
  survival: '生存极速',
};

export const DIFFICULTY_LABELS = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  insane: '疯狂',
};

export const ACHIEVEMENTS = [
  { id: 'first_meal', name: '初尝', desc: '第一次吃到食物', icon: '🍎', check: s => s.totalEaten >= 1 },
  { id: 'century', name: '百分', desc: '单局达到 100 分', icon: '💯', check: s => s.maxScore >= 100 },
  { id: 'combo_master', name: '连击大师', desc: '达到 10 连击', icon: '🔥', check: s => s.maxCombo >= 10 },
  { id: 'flash', name: '闪电侠', desc: '生存模式超过 60 秒', icon: '⚡', check: s => s.survivalTime >= 60 },
  { id: 'hall_of_fame', name: '殿堂级', desc: '进入排行榜前三', icon: '👑', check: s => s.topThree >= 1 },
  { id: 'survivor', name: '幸存者', desc: '疯狂难度吃 50 个食物', icon: '💀', check: s => s.insaneEaten >= 50 },
  { id: 'long_snake', name: '贪吃蛇', desc: '蛇长度达到 30', icon: '🐍', check: s => s.maxLength >= 30 },
  { id: 'collector', name: '收集者', desc: '吃掉所有 5 种特殊食物', icon: '🌟', check: s => s.specialTypesEaten >= 5 },
  { id: 'time_master', name: '时间管理', desc: '限时模式剩余 >20 秒通关', icon: '⏱', check: s => s.timedRemaining >= 20 },
  { id: 'dedicated', name: '钻石手', desc: '累计玩 10 局', icon: '💎', check: s => s.totalGames >= 10 },
  { id: 'perfectionist', name: '完美主义', desc: '一局内吃掉所有特殊食物类型', icon: '🎯', check: s => s.perfectGame >= 1 },
  { id: 'legend', name: '传奇', desc: '获得所有其他成就', icon: '🏆', check: (s, total) => total >= 11 },
];
