import { ACHIEVEMENTS } from '../data/constants';
import type { AchievementDef, LevelProgress, SaveState } from '../types/game';

/**
 * Endless achievement tiers.
 *
 * Each family continues one of the fixed achievements: once that achievement is
 * unlocked, "Tier 2" appears; finishing it reveals "Tier 3", and so on forever.
 * Only the NEXT tier of every family is ever visible, and tier ids are derived
 * (`e_<family>_<tier>`), so nothing extra has to be stored beyond `cb.ach`.
 */

interface Family {
  readonly key: string;
  /** Fixed achievement that must be unlocked before this family starts. */
  readonly after: string;
  readonly title: string;
  readonly desc: (target: string) => string;
  readonly progress: (cb: SaveState, prog: LevelProgress) => number;
  /** Target of tier `t` (t >= 2; tier 1 is the fixed achievement). */
  readonly target: (t: number) => number;
  readonly reward: (t: number) => number;
}

const cap = (n: number, max: number): number => Math.min(max, Math.round(n));

const FAMILIES: readonly Family[] = [
  {
    key: 'pts',
    after: 'k10',
    title: 'Point Collector',
    desc: (n) => `Accumulate ${n} lifetime points`,
    progress: (cb) => cb.st.sum,
    target: (t) => (t === 2 ? 25000 : 50000 * 2 ** (t - 3)),
    reward: (t) => cap(20 + 8 * t, 200),
  },
  {
    key: 'lines',
    after: 'liner',
    title: 'Line Legend',
    desc: (n) => `Clear ${n} lines in total`,
    progress: (cb) => cb.st.lines,
    target: (t) => 250 * 2 ** (t - 2),
    reward: (t) => cap(12 + 6 * t, 150),
  },
  {
    key: 'games',
    after: 'games100',
    title: 'Dedicated Player',
    desc: (n) => `Play ${n} games`,
    progress: (cb) => cb.st.games,
    target: (t) => 100 * t,
    reward: (t) => cap(30 + 5 * t, 200),
  },
  {
    key: 'best',
    after: 'sm',
    title: 'High Scorer',
    desc: (n) => `Score ${n} points in one game`,
    progress: (cb) => cb.st.best,
    target: (t) => 2500 * t,
    reward: (t) => cap(15 + 8 * t, 200),
  },
  {
    key: 'combo',
    after: 'streak',
    title: 'Combo Titan',
    desc: (n) => `Reach a x${n} combo streak`,
    progress: (cb) => cb.st.streak,
    target: (t) => 4 + t,
    reward: (t) => cap(12 + 5 * t, 150),
  },
  {
    key: 'perfect',
    after: 'perf',
    title: 'Flawless',
    desc: (n) => `Achieve ${n} Perfect Clears`,
    progress: (cb) => cb.st.perfect,
    target: (t) => t,
    reward: (t) => cap(10 + 6 * t, 150),
  },
  {
    key: 'tools',
    after: 'pu_exp',
    title: 'Tool Master',
    desc: (n) => `Use ${n} power-ups`,
    progress: (cb) => cb.st.powerUpsUsed || 0,
    target: (t) => 25 * (t - 1),
    reward: (t) => cap(10 + 5 * t, 150),
  },
  {
    key: 'levels',
    after: 'lv10',
    title: 'World Traveller',
    desc: (n) => `Complete ${n} levels`,
    progress: (_cb, prog) => Math.max(0, prog.u - 1),
    target: (t) => 10 * t,
    reward: (t) => cap(15 + 5 * t, 200),
  },
  {
    key: 'items',
    after: 'items',
    title: 'Relic Hunter',
    desc: (n) => `Collect ${n} items`,
    progress: (cb) => cb.st.items,
    target: (t) => 50 * t,
    reward: (t) => cap(10 + 4 * t, 150),
  },
  {
    key: 'missions',
    after: 'mis_champ',
    title: 'Mission Veteran',
    desc: (n) => `Complete ${n} daily missions`,
    progress: (cb) => cb.missionsCompleted || 0,
    target: (t) => 5 * t - 2,
    reward: (t) => cap(12 + 4 * t, 150),
  },
];

const ID_PATTERN = /^e_([a-z]+)_(\d+)$/;
const MAX_TIER = 10_000;

export function endlessTierId(familyKey: string, tier: number): string {
  return `e_${familyKey}_${tier}`;
}

function build(family: Family, tier: number): AchievementDef {
  const base = ACHIEVEMENTS.find((a) => a.id === family.after);
  const target = Math.round(family.target(tier));
  return {
    id: endlessTierId(family.key, tier),
    title: `${family.title} · Tier ${tier}`,
    desc: family.desc(target.toLocaleString('en-US')),
    category: base?.category ?? 'mastery',
    rewardGems: family.reward(tier),
    getProgress: family.progress,
    target,
    iconPath: base?.iconPath ?? '',
  };
}

/** Resolves a derived tier id (`e_pts_3`), or `null` for anything else. */
export function resolveEndlessAchievement(id: string): AchievementDef | null {
  const m = ID_PATTERN.exec(id);
  if (!m) return null;
  const tier = Number(m[2]);
  if (!Number.isInteger(tier) || tier < 2 || tier > MAX_TIER) return null;
  const family = FAMILIES.find((f) => f.key === m[1]);
  return family ? build(family, tier) : null;
}

/** The single next tier of every family whose starting achievement is unlocked. */
export function getActiveEndlessAchievements(
  cb: SaveState,
  _prog: LevelProgress
): AchievementDef[] {
  const out: AchievementDef[] = [];
  for (const family of FAMILIES) {
    if (!cb.ach[family.after]) continue;
    let tier = 2;
    while (cb.ach[endlessTierId(family.key, tier)] && tier < MAX_TIER) tier++;
    out.push(build(family, tier));
  }
  return out;
}

/** How many endless tiers the player has completed so far. */
export function countEndlessUnlocked(cb: SaveState): number {
  let n = 0;
  for (const id of Object.keys(cb.ach)) {
    if (cb.ach[id] && ID_PATTERN.test(id)) n++;
  }
  return n;
}
