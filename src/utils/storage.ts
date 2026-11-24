import { LevelProgress, LivesState, SaveState, ThemeId } from '../types/game';
import { MAX_LIVES } from '../data/constants';

export function createDefaultSaveState(): SaveState {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    v: 1,
    name: 'Player',
    av: 0,
    gems: 0,
    theme: 'aurora',
    unl: ['aurora'],
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
      sum: 0,
      best: 0,
      lines: 0,
      time: 0,
      streak: 0,
      items: 0,
      claims: 0,
      perfect: 0,
    },
    ach: {},
    daily: { last: '', streak: 0 },
    lb: { classic: [], t90: [], t180: [], t300: [], level: [] },
  };
}

export function loadSaveState(): SaveState {
  const d = createDefaultSaveState();
  let o: Partial<SaveState> | null = null;
  try {
    const raw = localStorage.getItem('cb2');
    if (raw) o = JSON.parse(raw) as Partial<SaveState>;
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

  const r: SaveState = {
    ...d,
    ...o,
    set: { ...d.set, ...(o.set || {}) },
    st: { ...d.st, ...(o.st || {}) },
    daily: { ...d.daily, ...(o.daily || {}) },
    ach: o.ach || {},
    lb: { ...d.lb, ...(o.lb || {}) },
    unl: Array.isArray(o.unl) && o.unl.length ? ([...o.unl] as ThemeId[]) : ['aurora'],
    v: 1,
  };

  (Object.keys(r.lb) as (keyof SaveState['lb'])[]).forEach((k) => {
    if (!Array.isArray(r.lb[k])) r.lb[k] = [];
  });
  if (!r.unl.includes('aurora')) r.unl.push('aurora');
  return r;
}

export function saveGameState(cb: SaveState): void {
  try {
    localStorage.setItem('cb2', JSON.stringify(cb));
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
  ['cb2', 'qbc', 'qbl', 'qbp', 'qbm', 'bc_tut_seen'].forEach((k) => {
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
