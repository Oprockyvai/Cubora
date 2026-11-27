import {
  BlockSkinId,
  BoardEffectId,
  LevelProgress,
  LivesState,
  MatchHistoryEntry,
  ResumeSnapshot,
  SaveState,
  SoundPackId,
  ThemeId,
} from '../types/game';
import {
  ACHIEVEMENTS,
  BLOCK_SKINS,
  BOARD_EFFECTS,
  GRID_SIZE,
  MAX_LIVES,
  SOUND_PACKS,
  THEMES,
} from '../data/constants';
import {
  createEmptyUsageStats,
  createStarterInventory,
  sanitizePowerUpInventory,
} from './powerUpManager';
import { ensureFreshDailyMissions } from './progressionManager';

export const RESUME_STORAGE_KEY = 'cb_resume_v1';

export function createDefaultSaveState(): SaveState {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const today = getTodayKey();

  return {
    v: 2,
    name: 'Player',
    av: 0,
    gems: 0,
    xp: 0,
    playerLevel: 1,
    theme: 'aurora',
    unl: ['aurora'],
    unlockedSkins: ['classic'],
    equippedSkin: 'classic',
    unlockedEffects: ['sparks'],
    equippedEffect: 'sparks',
    unlockedSoundPacks: ['default'],
    equippedSoundPack: 'default',
    set: {
      mus: 1,
      sfx: 1,
      mv: 0.6,
      sv: 0.85,
      hap: 1,
      rm: prefersReduced ? 1 : 0,
    },
    st: {
      games: 0,
      gamesCompleted: 0,
      sum: 0,
      best: 0,
      lines: 0,
      time: 0,
      streak: 0,
      longestCombo: 0,
      items: 0,
      claims: 0,
      perfect: 0,
      powerUpsUsed: 0,
      coinsEarned: 0,
    },
    powerUps: createStarterInventory(),
    powerUpUsage: createEmptyUsageStats(),
    missions: ensureFreshDailyMissions(undefined, today),
    missionsCompleted: 0,
    ach: {},
    claimedAch: {},
    claimedScoreMilestones: [],
    daily: { last: '', streak: 0 },
    winStreak: 0,
    bestWinStreak: 0,
    history: [],
    lb: { classic: [], t90: [], t180: [], t300: [], level: [] },
  };
}

export function migrateSaveStatePayload(rawObj: unknown, todayKey = getTodayKey()): SaveState {
  const d = createDefaultSaveState();
  d.missions = ensureFreshDailyMissions(undefined, todayKey);

  if (!rawObj || typeof rawObj !== 'object' || Array.isArray(rawObj)) {
    return d;
  }

  const o = rawObj as Partial<SaveState>;
  const validThemeIds = new Set(THEMES.map((t) => t.id));
  const validSkinIds = new Set(BLOCK_SKINS.map((s) => s.id));
  const validEffectIds = new Set(BOARD_EFFECTS.map((e) => e.id));
  const validPackIds = new Set(SOUND_PACKS.map((s) => s.id));

  const unlThemes = (Array.isArray(o.unl) ? o.unl : []).filter((t): t is ThemeId =>
    validThemeIds.has(t as ThemeId)
  );
  if (!unlThemes.includes('aurora')) unlThemes.unshift('aurora');
  const equippedTheme = validThemeIds.has(o.theme as ThemeId) && unlThemes.includes(o.theme as ThemeId)
    ? (o.theme as ThemeId)
    : 'aurora';

  const unlSkins = (Array.isArray(o.unlockedSkins) ? o.unlockedSkins : []).filter(
    (s): s is BlockSkinId => validSkinIds.has(s as BlockSkinId)
  );
  if (!unlSkins.includes('classic')) unlSkins.unshift('classic');
  const equippedSkin =
    validSkinIds.has(o.equippedSkin as BlockSkinId) && unlSkins.includes(o.equippedSkin as BlockSkinId)
      ? (o.equippedSkin as BlockSkinId)
      : 'classic';

  const unlEffects = (Array.isArray(o.unlockedEffects) ? o.unlockedEffects : []).filter(
    (e): e is BoardEffectId => validEffectIds.has(e as BoardEffectId)
  );
  if (!unlEffects.includes('sparks')) unlEffects.unshift('sparks');
  const equippedEffect =
    validEffectIds.has(o.equippedEffect as BoardEffectId) &&
    unlEffects.includes(o.equippedEffect as BoardEffectId)
      ? (o.equippedEffect as BoardEffectId)
      : 'sparks';

  const unlPacks = (Array.isArray(o.unlockedSoundPacks) ? o.unlockedSoundPacks : []).filter(
    (p): p is SoundPackId => validPackIds.has(p as SoundPackId)
  );
  if (!unlPacks.includes('default')) unlPacks.unshift('default');
  const equippedSoundPack =
    validPackIds.has(o.equippedSoundPack as SoundPackId) &&
    unlPacks.includes(o.equippedSoundPack as SoundPackId)
      ? (o.equippedSoundPack as SoundPackId)
      : 'default';

  const rawAch = o.ach && typeof o.ach === 'object' ? o.ach : {};
  const rawClaimedAch = o.claimedAch && typeof o.claimedAch === 'object' ? { ...o.claimedAch } : {};
  // Existing v1 unlocked achievements were already paid when unlocked
  for (const a of ACHIEVEMENTS) {
    if (rawAch[a.id] && rawClaimedAch[a.id] === undefined) {
      rawClaimedAch[a.id] = true;
    }
  }

  const rawSt = o.st && typeof o.st === 'object' ? o.st : ({} as Partial<SaveState['st']>);
  const safeNum = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : fallback;

  const safeStreak = Math.max(safeNum(rawSt.streak), safeNum(rawSt.longestCombo));

  const migratedHistory: MatchHistoryEntry[] = Array.isArray(o.history)
    ? o.history
        .filter((h): h is MatchHistoryEntry => !!h && typeof h === 'object' && typeof h.score === 'number')
        .slice(0, 30)
    : [];

  const r: SaveState = {
    ...d,
    ...o,
    v: 2,
    name: typeof o.name === 'string' && o.name.trim() ? o.name.slice(0, 14) : 'Player',
    av: Math.max(0, Math.min(5, Math.floor(safeNum(o.av, 0)))),
    gems: Math.floor(safeNum(o.gems, 0)),
    xp: Math.floor(safeNum(o.xp, 0)),
    playerLevel: Math.max(1, Math.floor(safeNum(o.playerLevel, 1))),
    theme: equippedTheme,
    unl: [...new Set(unlThemes)],
    unlockedSkins: [...new Set(unlSkins)],
    equippedSkin,
    unlockedEffects: [...new Set(unlEffects)],
    equippedEffect,
    unlockedSoundPacks: [...new Set(unlPacks)],
    equippedSoundPack,
    set: {
      mus: o.set?.mus ? 1 : 0,
      sfx: o.set?.sfx ? 1 : 0,
      mv: typeof o.set?.mv === 'number' && Number.isFinite(o.set.mv) ? Math.max(0, Math.min(1, o.set.mv)) : d.set.mv,
      sv: typeof o.set?.sv === 'number' && Number.isFinite(o.set.sv) ? Math.max(0, Math.min(1, o.set.sv)) : d.set.sv,
      hap: o.set?.hap !== undefined ? (o.set.hap ? 1 : 0) : d.set.hap,
      rm: o.set?.rm !== undefined ? (o.set.rm ? 1 : 0) : d.set.rm,
    },
    st: {
      games: Math.floor(safeNum(rawSt.games)),
      gamesCompleted: Math.floor(safeNum(rawSt.gamesCompleted, safeNum(rawSt.games))),
      sum: Math.floor(safeNum(rawSt.sum)),
      best: Math.floor(safeNum(rawSt.best)),
      lines: Math.floor(safeNum(rawSt.lines)),
      time: Math.floor(safeNum(rawSt.time)),
      streak: safeStreak,
      longestCombo: safeStreak,
      items: Math.floor(safeNum(rawSt.items)),
      claims: Math.floor(safeNum(rawSt.claims)),
      perfect: Math.floor(safeNum(rawSt.perfect)),
      powerUpsUsed: Math.floor(safeNum(rawSt.powerUpsUsed)),
      coinsEarned: Math.floor(safeNum(rawSt.coinsEarned)),
    },
    powerUps: sanitizePowerUpInventory(o.powerUps, true),
    powerUpUsage: sanitizePowerUpInventory(o.powerUpUsage, false),
    missions: ensureFreshDailyMissions(o.missions, todayKey),
    missionsCompleted: Math.floor(safeNum(o.missionsCompleted)),
    ach: { ...rawAch },
    claimedAch: rawClaimedAch,
    claimedScoreMilestones: Array.isArray(o.claimedScoreMilestones)
      ? o.claimedScoreMilestones.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
      : [],
    daily: {
      last: typeof o.daily?.last === 'string' ? o.daily.last : '',
      streak: Math.floor(safeNum(o.daily?.streak)),
    },
    winStreak: Math.floor(safeNum(o.winStreak)),
    bestWinStreak: Math.floor(safeNum(o.bestWinStreak)),
    history: migratedHistory,
    lb: { ...d.lb, ...(o.lb && typeof o.lb === 'object' ? o.lb : {}) },
  };

  (Object.keys(r.lb) as (keyof SaveState['lb'])[]).forEach((k) => {
    if (!Array.isArray(r.lb[k])) r.lb[k] = [];
  });

  return r;
}

export function loadSaveState(): SaveState {
  let o: unknown = null;
  try {
    const raw = localStorage.getItem('cb2');
    if (raw) o = JSON.parse(raw);
  } catch {
    o = null;
  }

  if (!o || typeof o !== 'object') {
    const fresh = createDefaultSaveState();
    try {
      fresh.st.best = Number(localStorage.getItem('qbc')) || 0;
      if (localStorage.getItem('qbm') === '1') {
        fresh.set.sfx = 0;
        fresh.set.mus = 0;
      }
    } catch {
      // ignore
    }
    return fresh;
  }

  return migrateSaveStatePayload(o);
}

export function saveGameState(cb: SaveState): void {
  try {
    localStorage.setItem('cb2', JSON.stringify(cb));
  } catch {
    // ignore
  }
}

export function saveResumeSnapshot(snapshot: ResumeSnapshot): void {
  try {
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export function validateResumeSnapshot(raw: unknown): ResumeSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const s = raw as Partial<ResumeSnapshot>;
  if (s.mode !== 'classic' && s.mode !== 'timer' && s.mode !== 'level') return null;
  if (!Array.isArray(s.board) || s.board.length !== GRID_SIZE * GRID_SIZE) return null;
  if (!Array.isArray(s.boardItems) || s.boardItems.length !== GRID_SIZE * GRID_SIZE) return null;
  if (!Array.isArray(s.pieces) || s.pieces.length !== 3) return null;
  if (typeof s.score !== 'number' || !Number.isFinite(s.score) || s.score < 0) return null;
  if (s.mode === 'timer' && (typeof s.timeLeft !== 'number' || s.timeLeft <= 0)) return null;
  if (s.mode === 'level' && (!s.lv || typeof s.moves !== 'number' || s.moves <= 0)) return null;
  return s as ResumeSnapshot;
}

export function loadResumeSnapshot(): ResumeSnapshot | null {
  try {
    const raw = localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validateResumeSnapshot(parsed);
  } catch {
    return null;
  }
}

export function clearResumeSnapshot(): void {
  try {
    localStorage.removeItem(RESUME_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function loadProgress(): LevelProgress {
  try {
    const raw = localStorage.getItem('qbp');
    if (raw) {
      const q = JSON.parse(raw) as LevelProgress;
      if (q && typeof q.u === 'number') return { u: q.u, s: q.s || {} };
    }
  } catch {
    // ignore
  }
  return { u: 1, s: {} };
}

export function saveProgress(prog: LevelProgress): void {
  try {
    localStorage.setItem('qbp', JSON.stringify(prog));
  } catch {
    // ignore
  }
}

export function loadLastRevealedLevel(fallbackLevel: number): number {
  try {
    const raw = localStorage.getItem('qbrv');
    if (raw !== null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 1) return parsed;
    }
    localStorage.setItem('qbrv', String(fallbackLevel));
  } catch {
    // ignore
  }
  return fallbackLevel;
}

export function saveLastRevealedLevel(level: number): void {
  try {
    localStorage.setItem('qbrv', String(Math.max(1, level)));
  } catch {
    // ignore
  }
}

export function loadLives(): LivesState {
  try {
    const raw = localStorage.getItem('qbl');
    if (raw) {
      const s = JSON.parse(raw) as LivesState;
      if (s && typeof s.n === 'number') {
        return { n: Math.max(0, Math.min(MAX_LIVES, s.n)), t: s.t || 0 };
      }
    }
  } catch {
    // ignore
  }
  return { n: MAX_LIVES, t: 0 };
}

export function saveLives(lives: LivesState): void {
  try {
    localStorage.setItem('qbl', JSON.stringify(lives));
  } catch {
    // ignore
  }
}

export function loadClassicBest(): number {
  try {
    return Number(localStorage.getItem('qbc')) || 0;
  } catch {
    return 0;
  }
}

export function saveClassicBest(val: number): void {
  try {
    localStorage.setItem('qbc', String(val));
  } catch {
    // ignore
  }
}

export function clearAllSavedData(): void {
  ['cb2', 'qbc', 'qbl', 'qbp', 'qbrv', 'qbm', 'bc_tut_seen', RESUME_STORAGE_KEY].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  });
}

export function hasSeenTutorial(): boolean {
  try {
    if (localStorage.getItem('bc_tut_seen') === '1') return true;
    // Existing returning players who already have save progress don't get interrupted
    const rawCb = localStorage.getItem('cb2');
    if (rawCb) {
      const parsed = JSON.parse(rawCb) as Partial<SaveState>;
      if (parsed?.st?.games && parsed.st.games > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem('bc_tut_seen', '1');
  } catch {
    // ignore
  }
}

export function getTodayKey(): string {
  const x = new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(
    x.getDate()
  ).padStart(2, '0')}`;
}

export function dayNumber(k: string): number {
  const a = k.split('-');
  return Date.UTC(+a[0], +a[1] - 1, +a[2]) / 864e5;
}

export function getDailyRewardState(daily: SaveState['daily']): {
  canClaim: boolean;
  idx: number;
} {
  if (!daily.last) return { canClaim: true, idx: 0 };
  const d = dayNumber(getTodayKey()) - dayNumber(daily.last);
  if (d <= 0) return { canClaim: false, idx: daily.streak % 7 };
  return { canClaim: true, idx: d === 1 ? daily.streak % 7 : 0 };
}

export function formatDuration(t: number): string {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${t % 60}s`;
  return `${t}s`;
}

export function formatClock(t: number): string {
  const s = Math.max(0, Math.ceil(t));
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
}

export function formatMs(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
