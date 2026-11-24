export type GameMode = 'classic' | 'timer' | 'level';

export type LevelGoalType = 'score' | 'lines' | 'item' | 'color' | 'combo';

export type ThemeId = 'aurora' | 'sunset' | 'forest' | 'ocean';

export type LeaderboardKey = 'classic' | 't90' | 't180' | 't300' | 'level';

export type PageId = 'pgSet' | 'pgStat' | 'pgAch' | 'pgThm' | 'pgLb';

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
  sum: number;
  best: number;
  lines: number;
  time: number;
  streak: number;
  items: number;
  claims: number;
  perfect: number;
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

export interface SaveState {
  v: number;
  name: string;
  av: number;
  gems: number;
  theme: ThemeId;
  unl: ThemeId[];
  set: SettingsState;
  st: StatsState;
  ach: Record<string, number>;
  daily: DailyState;
  lb: Record<LeaderboardKey, LeaderboardEntry[]>;
  lastLb?: { k: LeaderboardKey; d: number };
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
  roadColor: string;
  roadHighlight: string;
  inlayColor: string;
  glowColor: string;
  pedestalFill: string;
  pedestalStroke: string;
}

export interface WorldDef {
  id: ThemedMapId;
  name: string;
  subtitle: string;
  acc: string;
  img: string;
  roadStyle: MapRoadStyle;
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

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
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
