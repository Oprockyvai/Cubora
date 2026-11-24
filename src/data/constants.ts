import {
  AchievementDef,
  CellCoord,
  ItemDef,
  LeaderboardKey,
  ThemeDef,
  WorldDef,
} from '../types/game';
import { THEMED_MAPS } from './maps';

export const GRID_SIZE = 8;
export const MAX_LIVES = 5;
export const LIFE_REGEN_MS = 15 * 60 * 1000;

export const SHAPES: CellCoord[][] = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1]],
  [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2],
  ],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 0], [1, 1], [1, 2]],
  [[0, 1], [1, 1], [2, 1], [2, 0]],
  [[0, 0], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 1], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 1], [1, 0], [1, 1], [1, 2]],
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 1], [1, 0], [1, 1], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],
  [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
];

export const COLOR_NAMES = ['pink', 'cyan', 'orange', 'green', 'yellow', 'violet'] as const;

export const DEFAULT_COLORS = [
  '#ff5d7a',
  '#34e0ff',
  '#ffa63d',
  '#4ff0a0',
  '#ffe14a',
  '#a98bff',
];

export const AVATAR_COLORS = [
  '#ff5d7a',
  '#34e0ff',
  '#ffa63d',
  '#4ff0a0',
  '#ffe14a',
  '#a98bff',
];

export const ITEMS: ItemDef[] = [
  { name: 'Bronze coin', shape: 'coin', c1: '#f6c08a', c2: '#cd7f32', c3: '#7a3f10' },
  { name: 'Silver coin', shape: 'coin', c1: '#ffffff', c2: '#c7ced9', c3: '#7d8696' },
  { name: 'Gold coin', shape: 'coin', c1: '#fff3b0', c2: '#ffc94a', c3: '#c98500' },
  { name: 'Star coin', shape: 'hex', c1: '#fff3b0', c2: '#ffc94a', c3: '#b97600' },
  { name: 'Crystal shard', shape: 'gem', c1: '#e6fbff', c2: '#34e0ff', c3: '#1263c9' },
  { name: 'Ancient key', shape: 'key', c1: '#fff3b0', c2: '#ffc94a', c3: '#b97600' },
  { name: 'Quantum core', shape: 'orb', c1: '#f1e6ff', c2: '#a98bff', c3: '#4a22b8' },
  { name: 'Royal crown', shape: 'crown', c1: '#fff3b0', c2: '#ffd34d', c3: '#b97600' },
];

export const WORLDS: WorldDef[] = THEMED_MAPS;

export const THEMES: ThemeDef[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    cost: 0,
    colors: ['#ff5d7a', '#34e0ff', '#ffa63d', '#4ff0a0', '#ffe14a', '#a98bff'],
    bg2: '#241468',
  },
  {
    id: 'sunset',
    name: 'Sunset Blaze',
    cost: 40,
    colors: ['#ff6b6b', '#ffb347', '#ff9a3c', '#ffd166', '#ff8fab', '#c77dff'],
    bg2: '#3b1236',
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    cost: 60,
    colors: ['#e76f51', '#2ec4b6', '#f4a261', '#52d681', '#e9c46a', '#9d8df1'],
    bg2: '#0e3a2c',
  },
  {
    id: 'ocean',
    name: 'Ocean Glass',
    cost: 80,
    colors: ['#ff7aa2', '#5ad1ff', '#ffb26b', '#6ee7b7', '#fde68a', '#8fa6ff'],
    bg2: '#0a2d52',
  },
];

export const DAILY_REWARDS = [5, 5, 10, 10, 15, 15, 30];

export const LEADERBOARD_TABS: [LeaderboardKey, string][] = [
  ['classic', 'Classic'],
  ['t90', 'Timer 90s'],
  ['t180', 'Timer 3 min'],
  ['t300', 'Timer 5 min'],
  ['level', 'Levels'],
];

export const TIMER_DURATIONS: [number, string, string][] = [
  [90, '90 seconds', 'Quick rush'],
  [180, '3 minutes', 'Balanced run'],
  [300, '5 minutes', 'Marathon'],
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first',
    title: 'First Game',
    desc: 'Finish your first game',
    getProgress: (cb) => cb.st.games,
    target: 1,
    iconPath: 'M6 21V4M6 5h11l-2.5 4 2.5 4H6',
  },
  {
    id: 'k1',
    title: 'First 1,000 Points',
    desc: 'Score 1,000 points in one game',
    getProgress: (cb) => cb.st.best,
    target: 1000,
    iconPath: 'M12 2l3 6.6 7.2.8-5.4 4.8 1.6 7.1L12 17.6 5.6 21.3l1.6-7.1L1.8 9.4 9 8.6z',
  },
  {
    id: 'sm',
    title: 'Score Master',
    desc: 'Score 2,500 points in one game',
    getProgress: (cb) => cb.st.best,
    target: 2500,
    iconPath: 'M3 18l1.5-9 5 4L12 6l2.5 7 5-4L21 18z',
  },
  {
    id: 'liner',
    title: 'Line Clearer',
    desc: 'Clear 100 lines in total',
    getProgress: (cb) => cb.st.lines,
    target: 100,
    iconPath: 'M4 6h16M4 12h16M4 18h16',
  },
  {
    id: 'cons',
    title: 'Consistency Champion',
    desc: 'Play 10 games',
    getProgress: (cb) => cb.st.games,
    target: 10,
    iconPath: 'M4 7h16v13H4zM4 11h16M8 4v4M16 4v4',
  },
  {
    id: 'streak',
    title: 'Long Streak',
    desc: 'Chain a combo of x5',
    getProgress: (cb) => cb.st.streak,
    target: 5,
    iconPath: 'M10 14a4 4 0 010-6l2-2a4 4 0 016 6l-1 1M14 10a4 4 0 010 6l-2 2a4 4 0 01-6-6l1-1',
  },
  {
    id: 'perf',
    title: 'Perfect Performance',
    desc: 'Earn 3 stars on a level',
    getProgress: (cb) => cb.st.perfect,
    target: 1,
    iconPath: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z',
  },
  {
    id: 'lv10',
    title: 'Map Explorer',
    desc: 'Complete 10 levels',
    getProgress: (_cb, prog) => prog.u - 1,
    target: 10,
    iconPath: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  },
  {
    id: 'items',
    title: 'Treasure Hunter',
    desc: 'Collect 50 coins and artifacts',
    getProgress: (cb) => cb.st.items,
    target: 50,
    iconPath: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v8M9.5 10.5h5',
  },
  {
    id: 'daily',
    title: 'Regular Visitor',
    desc: 'Claim 3 daily rewards',
    getProgress: (cb) => cb.st.claims,
    target: 3,
    iconPath: 'M3 9h18v12H3zM12 9v12M12 9C9 9 7 7.5 7.6 6 8.6 4 12 6 12 9zm0 0c3 0 5-1.5 4.4-3C15.4 4 12 6 12 9z',
  },
];
