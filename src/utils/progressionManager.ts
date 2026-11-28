import {
  ACHIEVEMENTS,
  BLOCK_SKINS,
  BOARD_EFFECTS,
  POWER_UP_DEFS,
  SCORE_MILESTONES,
  SOUND_PACKS,
  XP_CONFIG,
} from '../data/constants';
import {
  AchievementDef,
  BlockSkinId,
  BoardEffectId,
  DailyMissionsState,
  GameMode,
  LevelProgress,
  MatchHistoryEntry,
  MissionMetric,
  MissionState,
  PersonalChallengeDef,
  PowerUpId,
  SaveState,
  SoundPackId,
} from '../types/game';
import {
  getActiveEndlessAchievements,
  resolveEndlessAchievement,
} from './endlessAchievements';
import { grantPowerUpStock } from './powerUpManager';

export function xpForNextLevel(level: number): number {
  const safeLv = Math.max(1, Math.floor(level || 1));
  return XP_CONFIG.baseLevelXp + (safeLv - 1) * XP_CONFIG.stepLevelXp;
}

export interface LevelUpReward {
  level: number;
  gems: number;
  powerUp?: { id: PowerUpId; qty: number };
  unlockNote?: string;
}

export function getLevelUpReward(newLevel: number): LevelUpReward {
  if (newLevel === 2) {
    return {
      level: newLevel,
      gems: 10,
      powerUp: { id: 'colorBlast', qty: 1 },
      unlockNote: 'Unlocked Color Blast power-up & Neon skin store',
    };
  }
  if (newLevel === 3) {
    return {
      level: newLevel,
      gems: 15,
      powerUp: { id: 'boom', qty: 1 },
      unlockNote: 'Unlocked Crafted Timber skin & Bamboo Zen audio',
    };
  }
  if (newLevel % 2 === 0) {
    return {
      level: newLevel,
      gems: 12,
      powerUp: { id: 'hammer', qty: 1 },
    };
  }
  return {
    level: newLevel,
    gems: 10,
    powerUp: { id: 'refresh', qty: 1 },
  };
}

export interface GrantXpResult {
  nextCb: SaveState;
  xpAdded: number;
  leveledUpTo: number | null;
  rewards: LevelUpReward[];
}

export function grantPlayerXp(cb: SaveState, rawXp: number): GrantXpResult {
  const xpAdded = Math.max(0, Math.floor(rawXp || 0));
  if (xpAdded <= 0) {
    return { nextCb: cb, xpAdded: 0, leveledUpTo: null, rewards: [] };
  }

  let curLevel = Math.max(1, Math.floor(cb.playerLevel || 1));
  let curXp = Math.max(0, Math.floor(cb.xp || 0)) + xpAdded;
  let gems = cb.gems;
  let powerUps = { ...cb.powerUps };
  const rewards: LevelUpReward[] = [];

  while (curXp >= xpForNextLevel(curLevel)) {
    curXp -= xpForNextLevel(curLevel);
    curLevel += 1;
    const reward = getLevelUpReward(curLevel);
    gems += reward.gems;
    if (reward.powerUp) {
      powerUps = grantPowerUpStock(powerUps, reward.powerUp.id, reward.powerUp.qty);
    }
    rewards.push(reward);
  }

  const nextCb: SaveState = {
    ...cb,
    xp: curXp,
    playerLevel: curLevel,
    gems,
    st: {
      ...cb.st,
      coinsEarned:
        (cb.st.coinsEarned || 0) +
        rewards.reduce((acc, r) => acc + r.gems, 0),
    },
    powerUps,
  };

  return {
    nextCb,
    xpAdded,
    leveledUpTo: rewards.length > 0 ? curLevel : null,
    rewards,
  };
}

interface MissionTemplate {
  metric: MissionMetric;
  title: string;
  desc: string;
  target: number;
  rewardGems: number;
  rewardXp: number;
}

const MISSION_POOL: MissionTemplate[] = [
  {
    metric: 'linesCleared',
    title: 'Line Sweeper',
    desc: 'Clear 10 full lines in any mode',
    target: 10,
    rewardGems: 8,
    rewardXp: 40,
  },
  {
    metric: 'gamesCompleted',
    title: 'Daily Endurance',
    desc: 'Complete 3 full matches',
    target: 3,
    rewardGems: 10,
    rewardXp: 45,
  },
  {
    metric: 'maxSingleScore',
    title: 'Precision Scorer',
    desc: 'Reach 1,200 points in a single run',
    target: 1200,
    rewardGems: 12,
    rewardXp: 55,
  },
  {
    metric: 'powerUpsUsed',
    title: 'Tactical Support',
    desc: 'Activate 2 power-ups in gameplay',
    target: 2,
    rewardGems: 8,
    rewardXp: 35,
  },
  {
    metric: 'maxCombo',
    title: 'Combo Striker',
    desc: 'Achieve a x3 consecutive line combo',
    target: 3,
    rewardGems: 10,
    rewardXp: 50,
  },
  {
    metric: 'winWithoutUndo',
    title: 'Pure Strategist',
    desc: 'Complete a game or level without using Undo',
    target: 1,
    rewardGems: 12,
    rewardXp: 50,
  },
];

function hashDateKey(dateKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateDailyMissions(dateKey: string): DailyMissionsState {
  const seed = hashDateKey(dateKey || '2026-01-01');
  const pool = [...MISSION_POOL];
  const chosen: MissionTemplate[] = [];
  let s = seed;
  while (chosen.length < 3 && pool.length > 0) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const idx = s % pool.length;
    chosen.push(pool.splice(idx, 1)[0]);
  }

  return {
    dateKey,
    items: chosen.map((tpl, idx) => ({
      id: `${dateKey}_${tpl.metric}_${idx}`,
      metric: tpl.metric,
      title: tpl.title,
      desc: tpl.desc,
      target: tpl.target,
      progress: 0,
      rewardGems: tpl.rewardGems,
      rewardXp: tpl.rewardXp,
      claimed: false,
    })),
  };
}

export function ensureFreshDailyMissions(
  missions: DailyMissionsState | undefined,
  todayKey: string
): DailyMissionsState {
  if (!missions || missions.dateKey !== todayKey || !Array.isArray(missions.items) || missions.items.length !== 3) {
    return generateDailyMissions(todayKey);
  }
  return missions;
}

export interface GameplayMissionEvent {
  linesCleared?: number;
  gameCompleted?: number;
  singleGameScore?: number;
  powerUpUsed?: number;
  comboAchieved?: number;
  completedWithoutUndo?: number;
}

export function applyMissionProgressEvent(
  missions: DailyMissionsState,
  event: GameplayMissionEvent
): { missions: DailyMissionsState; newlyCompleted: MissionState[] } {
  const newlyCompleted: MissionState[] = [];
  const items = missions.items.map((m) => {
    const prevDone = m.progress >= m.target;
    let nextProg = m.progress;

    if (m.metric === 'linesCleared' && event.linesCleared) {
      nextProg = Math.min(m.target, m.progress + Math.max(0, event.linesCleared));
    } else if (m.metric === 'gamesCompleted' && event.gameCompleted) {
      nextProg = Math.min(m.target, m.progress + Math.max(0, event.gameCompleted));
    } else if (m.metric === 'maxSingleScore' && event.singleGameScore) {
      nextProg = Math.min(m.target, Math.max(m.progress, Math.floor(event.singleGameScore)));
    } else if (m.metric === 'powerUpsUsed' && event.powerUpUsed) {
      nextProg = Math.min(m.target, m.progress + Math.max(0, event.powerUpUsed));
    } else if (m.metric === 'maxCombo' && event.comboAchieved) {
      nextProg = Math.min(m.target, Math.max(m.progress, Math.floor(event.comboAchieved)));
    } else if (m.metric === 'winWithoutUndo' && event.completedWithoutUndo) {
      nextProg = Math.min(m.target, m.progress + Math.max(0, event.completedWithoutUndo));
    }

    const updated = nextProg === m.progress ? m : { ...m, progress: nextProg };
    if (!prevDone && updated.progress >= updated.target) {
      newlyCompleted.push(updated);
    }
    return updated;
  });

  return {
    missions: { ...missions, items },
    newlyCompleted,
  };
}

export function claimDailyMissionReward(
  cb: SaveState,
  missionId: string
): {
  ok: boolean;
  reason?: 'not_found' | 'incomplete' | 'already_claimed';
  nextCb: SaveState;
  rewardGems: number;
  rewardXp: number;
  leveledUpTo: number | null;
} {
  const targetMission = cb.missions.items.find((m) => m.id === missionId);
  if (!targetMission) {
    return { ok: false, reason: 'not_found', nextCb: cb, rewardGems: 0, rewardXp: 0, leveledUpTo: null };
  }
  if (targetMission.claimed) {
    return { ok: false, reason: 'already_claimed', nextCb: cb, rewardGems: 0, rewardXp: 0, leveledUpTo: null };
  }
  if (targetMission.progress < targetMission.target) {
    return { ok: false, reason: 'incomplete', nextCb: cb, rewardGems: 0, rewardXp: 0, leveledUpTo: null };
  }

  const nextMissions: DailyMissionsState = {
    ...cb.missions,
    items: cb.missions.items.map((m) =>
      m.id === missionId ? { ...m, claimed: true } : m
    ),
  };

  const withGems: SaveState = {
    ...cb,
    gems: cb.gems + targetMission.rewardGems,
    st: {
      ...cb.st,
      coinsEarned: (cb.st.coinsEarned || 0) + targetMission.rewardGems,
    },
    missions: nextMissions,
    missionsCompleted: (cb.missionsCompleted || 0) + 1,
  };

  const xpRes = grantPlayerXp(withGems, targetMission.rewardXp);
  return {
    ok: true,
    nextCb: xpRes.nextCb,
    rewardGems: targetMission.rewardGems,
    rewardXp: targetMission.rewardXp,
    leveledUpTo: xpRes.leveledUpTo,
  };
}

export function claimAchievementReward(
  cb: SaveState,
  prog: LevelProgress,
  achId: string
): {
  ok: boolean;
  reason?: 'not_found' | 'locked' | 'already_claimed';
  nextCb: SaveState;
  gemsAwarded: number;
} {
  const def = ACHIEVEMENTS.find((a) => a.id === achId) ?? resolveEndlessAchievement(achId);
  if (!def) {
    return { ok: false, reason: 'not_found', nextCb: cb, gemsAwarded: 0 };
  }
  const unlocked = !!cb.ach[achId] || def.getProgress(cb, prog) >= def.target;
  if (!unlocked) {
    return { ok: false, reason: 'locked', nextCb: cb, gemsAwarded: 0 };
  }
  if (cb.claimedAch?.[achId]) {
    return { ok: false, reason: 'already_claimed', nextCb: cb, gemsAwarded: 0 };
  }

  return {
    ok: true,
    gemsAwarded: def.rewardGems,
    nextCb: {
      ...cb,
      gems: cb.gems + def.rewardGems,
      ach: cb.ach[achId] ? cb.ach : { ...cb.ach, [achId]: Date.now() },
      claimedAch: { ...(cb.claimedAch || {}), [achId]: true },
      st: {
        ...cb.st,
        coinsEarned: (cb.st.coinsEarned || 0) + def.rewardGems,
      },
    },
  };
}

export function checkNewlyUnlockedAchievements(
  cb: SaveState,
  prog: LevelProgress
): { nextCb: SaveState; newlyUnlocked: AchievementDef[]; autoGems: number } {
  const newlyUnlocked: AchievementDef[] = [];
  const nextAch = { ...cb.ach };
  const nextClaimed = { ...(cb.claimedAch || {}) };
  let autoGems = 0;

  for (const a of ACHIEVEMENTS) {
    if (!nextAch[a.id] && a.getProgress(cb, prog) >= a.target) {
      nextAch[a.id] = Date.now();
      nextClaimed[a.id] = true;
      autoGems += a.rewardGems;
      newlyUnlocked.push(a);
    }
  }

  // Endless tiers: finishing one immediately reveals the next, so keep going until
  // no visible tier is already satisfied (bounded, in case of a huge jump).
  for (let guard = 0; guard < 500; guard++) {
    const hits = getActiveEndlessAchievements({ ...cb, ach: nextAch }, prog).filter(
      (a) => a.getProgress(cb, prog) >= a.target
    );
    if (hits.length === 0) break;
    for (const a of hits) {
      nextAch[a.id] = Date.now();
      nextClaimed[a.id] = true;
      autoGems += a.rewardGems;
      newlyUnlocked.push(a);
    }
  }

  if (newlyUnlocked.length === 0) {
    return { nextCb: cb, newlyUnlocked: [], autoGems: 0 };
  }

  return {
    nextCb: {
      ...cb,
      gems: cb.gems + autoGems,
      ach: nextAch,
      claimedAch: nextClaimed,
      st: {
        ...cb.st,
        coinsEarned: (cb.st.coinsEarned || 0) + autoGems,
      },
    },
    newlyUnlocked,
    autoGems,
  };
}

export function evaluateScoreMilestones(
  cb: SaveState,
  score: number
): { nextCb: SaveState; newlyReached: typeof SCORE_MILESTONES } {
  const claimed = new Set(cb.claimedScoreMilestones || []);
  const newlyReached = SCORE_MILESTONES.filter(
    (m) => score >= m.score && !claimed.has(m.score)
  );
  if (newlyReached.length === 0) {
    return { nextCb: cb, newlyReached: [] };
  }

  let gems = cb.gems;
  let xp = 0;
  newlyReached.forEach((m) => {
    claimed.add(m.score);
    gems += m.rewardGems;
    xp += m.rewardXp;
  });

  const updated: SaveState = {
    ...cb,
    gems,
    claimedScoreMilestones: [...claimed].sort((a, b) => a - b),
    st: {
      ...cb.st,
      coinsEarned:
        (cb.st.coinsEarned || 0) +
        newlyReached.reduce((s, m) => s + m.rewardGems, 0),
    },
  };
  const xpRes = grantPlayerXp(updated, xp);
  return { nextCb: xpRes.nextCb, newlyReached };
}

export function getPersonalChallenges(
  cb: SaveState,
  prog: LevelProgress
): PersonalChallengeDef[] {
  const classicBest = Math.max(cb.lb.classic[0]?.s || 0, cb.st.best);
  const classicTarget = classicBest < 1000 ? 1000 : Math.ceil((classicBest + 250) / 500) * 500;
  const linesTarget = cb.st.lines < 50 ? 50 : Math.ceil((cb.st.lines + 10) / 50) * 50;
  const streakTarget = Math.max(4, (cb.st.streak || 0) + 1);
  const totalStars = Object.values(prog.s).reduce((a, b) => a + b, 0);
  const starTarget = Math.max(15, Math.ceil((totalStars + 3) / 10) * 10);

  return [
    {
      id: 'pc_classic',
      title: 'Push Personal Score Record',
      desc: `Reach ${classicTarget.toLocaleString('en-US')} points in a single run`,
      current: classicBest,
      target: classicTarget,
      rewardHint: 'Milestone XP + Gems',
      completed: classicBest >= classicTarget,
    },
    {
      id: 'pc_lines',
      title: 'Structural Line Target',
      desc: `Clear ${linesTarget.toLocaleString('en-US')} lifetime rows or columns`,
      current: cb.st.lines,
      target: linesTarget,
      rewardHint: '+Level XP progress',
      completed: cb.st.lines >= linesTarget,
    },
    {
      id: 'pc_combo',
      title: 'Chain Reaction Mastery',
      desc: `Hit a x${streakTarget} consecutive clear streak`,
      current: cb.st.streak,
      target: streakTarget,
      rewardHint: 'Combo Multiplier + XP',
      completed: cb.st.streak >= streakTarget,
    },
    {
      id: 'pc_stars',
      title: 'World Star Campaign',
      desc: `Collect ${starTarget} stars across Level Map stages`,
      current: totalStars,
      target: starTarget,
      rewardHint: 'Adventure Star Chest',
      completed: totalStars >= starTarget,
    },
  ];
}

export function recordMatchHistory(
  history: MatchHistoryEntry[],
  entry: MatchHistoryEntry
): MatchHistoryEntry[] {
  return [entry, ...history].slice(0, 30);
}

export function selectOrUnlockSkin(
  cb: SaveState,
  skinId: BlockSkinId
): { ok: boolean; reason?: 'locked' | 'insufficient_gems'; nextCb: SaveState } {
  const def = BLOCK_SKINS.find((s) => s.id === skinId);
  if (!def) return { ok: false, nextCb: cb };
  if (cb.unlockedSkins.includes(skinId)) {
    return { ok: true, nextCb: { ...cb, equippedSkin: skinId } };
  }
  if (cb.playerLevel < def.unlockLevel) {
    return { ok: false, reason: 'locked', nextCb: cb };
  }
  if (cb.gems < def.costGems) {
    return { ok: false, reason: 'insufficient_gems', nextCb: cb };
  }
  return {
    ok: true,
    nextCb: {
      ...cb,
      gems: cb.gems - def.costGems,
      unlockedSkins: [...cb.unlockedSkins, skinId],
      equippedSkin: skinId,
    },
  };
}

export function selectOrUnlockEffect(
  cb: SaveState,
  effectId: BoardEffectId
): { ok: boolean; reason?: 'locked' | 'insufficient_gems'; nextCb: SaveState } {
  const def = BOARD_EFFECTS.find((e) => e.id === effectId);
  if (!def) return { ok: false, nextCb: cb };
  if (cb.unlockedEffects.includes(effectId)) {
    return { ok: true, nextCb: { ...cb, equippedEffect: effectId } };
  }
  if (cb.playerLevel < def.unlockLevel) {
    return { ok: false, reason: 'locked', nextCb: cb };
  }
  if (cb.gems < def.costGems) {
    return { ok: false, reason: 'insufficient_gems', nextCb: cb };
  }
  return {
    ok: true,
    nextCb: {
      ...cb,
      gems: cb.gems - def.costGems,
      unlockedEffects: [...cb.unlockedEffects, effectId],
      equippedEffect: effectId,
    },
  };
}

export function selectOrUnlockSoundPack(
  cb: SaveState,
  packId: SoundPackId
): { ok: boolean; reason?: 'locked' | 'insufficient_gems'; nextCb: SaveState } {
  const def = SOUND_PACKS.find((s) => s.id === packId);
  if (!def) return { ok: false, nextCb: cb };
  if (cb.unlockedSoundPacks.includes(packId)) {
    return { ok: true, nextCb: { ...cb, equippedSoundPack: packId } };
  }
  if (cb.playerLevel < def.unlockLevel) {
    return { ok: false, reason: 'locked', nextCb: cb };
  }
  if (cb.gems < def.costGems) {
    return { ok: false, reason: 'insufficient_gems', nextCb: cb };
  }
  return {
    ok: true,
    nextCb: {
      ...cb,
      gems: cb.gems - def.costGems,
      unlockedSoundPacks: [...cb.unlockedSoundPacks, packId],
      equippedSoundPack: packId,
    },
  };
}

export function formatModeLabel(
  mode: GameMode,
  levelNum?: number,
  timerDur?: number
): string {
  if (mode === 'level') return levelNum ? `Level ${levelNum}` : 'Levels';
  if (mode === 'timer') return `Timer ${timerDur || 90}s`;
  return 'Classic';
}

export { POWER_UP_DEFS };
