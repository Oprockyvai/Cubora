export type GameMode = 'classic' | 'timer' | 'level';

export type LevelGoalType = 'score' | 'lines' | 'item' | 'color' | 'combo';

export type ThemeId =
  | 'aurora'
  | 'sunset'
  | 'forest'
  | 'ocean'
  | 'obsidian'
  | 'sakura';

export type BlockSkinId = 'classic' | 'gemstone' | 'neon' | 'wooden' | 'frost';

export type BoardEffectId = 'sparks' | 'nova' | 'prism';

export type SoundPackId = 'default' | 'crystal' | 'arcade' | 'zen';

export type LeaderboardKey = 'classic' | 't90' | 't180' | 't300' | 'level';

export type PageId =
  | 'pgSet'
  | 'pgStat'
  | 'pgAch'
  | 'pgThm'
  | 'pgLb'
  | 'pgMis';

export type PowerUpId =
  | 'hammer'
  | 'boom'
  | 'refresh'
  | 'undo'
  | 'hint'
  | 'colorBlast';

export type CellCoord = [number, number];

export interface Piece {
  c: CellCoord[];
  k: number; // color index 0..5
  it?: number; // 1-based item index
  ii?: number; // cell index inside `c` holding the item
}

export interface LevelDef {
  n: number;
  type: LevelGoalType;
  ik: number; // 0-based item index
  col: number; // 0..5 color index
  cl: number; // cleared lines
  cc: number; // collected count (items or color blocks)
  bs: number; // best streak in level
  moves: number;
  maxMoves: number;
  pre: number;
  t: number; // target count
  s1: number;
  s2: number;
  s3: number;
}

export interface SettingsState {
  mus: number; // 0 or 1
  sfx: number; // 0 or 1
  mv: number; // 0..1
  sv: number; // 0..1
  hap: number; // 0 or 1
  rm: number; // 0 or 1
}

export interface StatsState {
  games: number;
  gamesCompleted: number;
  sum: number;
  best: number;
  lines: number;
  time: number;
  streak: number;
  longestCombo: number;
  items: number;
  claims: number;
  perfect: number;
  powerUpsUsed: number;
  coinsEarned: number;
}

export interface DailyState {
  last: string;
  streak: number;
}

export interface LeaderboardEntry {
  n: string;
  s: number;
  d: number;
  lv?: number;
  st?: number;
}

export type PowerUpInventory = Record<PowerUpId, number>;

export interface PowerUpDef {
  id: PowerUpId;
  name: string;
  shortName: string;
  desc: string;
  targetHint: string;
  needsTarget: boolean;
  starterQty: number;
  maxQty: number;
  unlockLevel: number;
  refillCost: number;
  accent: string;
}

export type MissionMetric =
  | 'linesCleared'
  | 'gamesCompleted'
  | 'maxSingleScore'
  | 'powerUpsUsed'
  | 'maxCombo'
  | 'winWithoutUndo';

export interface MissionState {
  id: string;
  metric: MissionMetric;
  title: string;
  desc: string;
  target: number;
  progress: number;
  rewardGems: number;
  rewardXp: number;
  claimed: boolean;
}

export interface DailyMissionsState {
  dateKey: string;
  items: MissionState[];
}

export interface MatchHistoryEntry {
  id: string;
  date: number;
  mode: GameMode;
  levelNum?: number;
  timerDur?: number;
  score: number;
  linesCleared: number;
  maxCombo: number;
  powerUpsUsed: number;
  xpEarned: number;
  gemsEarned: number;
  won: boolean;
  durationSec: number;
}

export interface SaveState {
  v: number;
  name: string;
  av: number;
  gems: number;
  xp: number;
  playerLevel: number;
  theme: ThemeId;
  unl: ThemeId[];
  unlockedSkins: BlockSkinId[];
  equippedSkin: BlockSkinId;
  unlockedEffects: BoardEffectId[];
  equippedEffect: BoardEffectId;
  unlockedSoundPacks: SoundPackId[];
  equippedSoundPack: SoundPackId;
  set: SettingsState;
  st: StatsState;
  powerUps: PowerUpInventory;
  powerUpUsage: PowerUpInventory;
  missions: DailyMissionsState;
  missionsCompleted: number;
  ach: Record<string, number>;
  claimedAch: Record<string, boolean>;
  claimedScoreMilestones: number[];
  daily: DailyState;
  winStreak: number;
  bestWinStreak: number;
  history: MatchHistoryEntry[];
  lb: Record<LeaderboardKey, LeaderboardEntry[]>;
  lastLb?: { k: LeaderboardKey; d: number };
}

export interface UndoSnapshot {
  board: number[];
  boardItems: number[];
  pieces: (Piece | null)[];
  score: number;
  streak: number;
  moves: number;
  lv: LevelDef | null;
  timeLeft: number;
  linesClearedInRun: number;
  runMaxCombo: number;
  moveToken: string;
}

export interface ResumeSnapshot {
  v: number;
  savedAt: number;
  mode: GameMode;
  timerDur: number;
  timeLeft: number;
  lv: LevelDef | null;
  moves: number;
  board: number[];
  boardItems: number[];
  pieces: (Piece | null)[];
  score: number;
  streak: number;
  revived: boolean;
  undoUsedInRun: boolean;
  powerUpsUsedInRun: number;
  linesClearedInRun: number;
  runMaxCombo: number;
  durationSec: number;
}

export interface HintPlacement {
  slotIdx: number;
  piece: Piece;
  r0: number;
  c0: number;
  cells: number[];
  linesCleared: number;
  scoreGain: number;
}

export interface LevelProgress {
  u: number; // highest unlocked level (1-based)
  s: Record<number, number>; // level -> stars (1..3)
}

export interface LivesState {
  n: number;
  t: number; // timestamp when regen started
}

export interface ItemDef {
  name: string;
  shape: 'coin' | 'hex' | 'gem' | 'key' | 'orb' | 'crown';
  c1: string;
  c2: string;
  c3: string;
}

export type ThemedMapId = 'crystal-valley' | 'cloud-city' | 'volcano' | 'abyss';

export interface MapRoadStyle {
  shadowColor: string;
  curbColor: string;
  curbHighlight: string;
  roadColor: string;
  deckTop: string;
  deckBottom: string;
  roadHighlight: string;
  inlayColor: string;
  glowColor: string;
  pedestalFill: string;
  pedestalStroke: string;
}

export interface BiomePalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  ridgeBack: string;
  ridgeFront: string;
  featureA: string;
  featureB: string;
  particleColor: string;
}

export interface WorldDef {
  id: ThemedMapId;
  name: string;
  subtitle: string;
  acc: string;
  img: string;
  roadStyle: MapRoadStyle;
  biome: BiomePalette;
  pts: [number, number][];
}

export interface ThemedMapDef extends WorldDef {
  startLevel: number;
  endLevel: number;
}

export interface ThemeDef {
  id: ThemeId;
  name: string;
  cost: number;
  colors: [string, string, string, string, string, string];
  bg2: string;
}

export interface BlockSkinDef {
  id: BlockSkinId;
  name: string;
  desc: string;
  costGems: number;
  unlockLevel: number;
}

export interface BoardEffectDef {
  id: BoardEffectId;
  name: string;
  desc: string;
  costGems: number;
  unlockLevel: number;
  accent: string;
}

export interface SoundPackDef {
  id: SoundPackId;
  name: string;
  desc: string;
  costGems: number;
  unlockLevel: number;
}

export interface ScoreMilestoneDef {
  score: number;
  title: string;
  rewardGems: number;
  rewardXp: number;
}

export interface PersonalChallengeDef {
  id: string;
  title: string;
  desc: string;
  current: number;
  target: number;
  rewardHint: string;
  completed: boolean;
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  category: 'mastery' | 'combo' | 'powerups' | 'collection';
  rewardGems: number;
  getProgress: (cb: SaveState, prog: LevelProgress) => number;
  target: number;
  iconPath: string;
}

export interface LastMoveInfo {
  l: number; // lines cleared
  k: number; // piece color
  n: number; // piece block count
  ic: Record<number, number>; // itemId -> count collected
}

export interface ToolEffectEvent {
  id: number;
  tool: PowerUpId;
  cellIdx?: number;
  targetCells?: number[];
  colorIdx?: number;
}


