export type WinStreakTierId =
  | 'none'
  | 'warm'
  | 'hot'
  | 'blazing'
  | 'legendary';

export interface WinStreakMilestone {
  streak: number;
  label: string;
  bonusGems: number;
}

export const WIN_STREAK_MILESTONES: readonly WinStreakMilestone[] = [
  { streak: 2, label: '×2', bonusGems: 1 },
  { streak: 3, label: '×3', bonusGems: 2 },
  { streak: 4, label: '×4', bonusGems: 3 },
  { streak: 5, label: '×5+', bonusGems: 5 },
];

export interface WinStreakInfo {
  streak: number;
  tier: WinStreakTierId;
  label: string;
  bonusGems: number;
  nextTargetStreak: number | null;
  nextBonusGems: number;
  gemsNeeded: number;
}

export function getWinStreakBonusGems(streak: number): number {
  const n = Math.max(0, Math.floor(streak));
  if (n < 2) return 0;
  if (n === 2) return 1;
  if (n === 3) return 2;
  if (n === 4) return 3;
  return 5;
}

export function getWinStreakInfo(streak: number): WinStreakInfo {
  const n = Math.max(0, Math.floor(streak));
  const bonusGems = getWinStreakBonusGems(n);

  if (n === 0) {
    return {
      streak: 0,
      tier: 'none',
      label: 'Win Streak',
      bonusGems: 0,
      nextTargetStreak: 2,
      nextBonusGems: 1,
      gemsNeeded: 2,
    };
  }
  if (n === 1) {
    return {
      streak: 1,
      tier: 'warm',
      label: 'Streak Started',
      bonusGems: 0,
      nextTargetStreak: 2,
      nextBonusGems: 1,
      gemsNeeded: 1,
    };
  }
  if (n === 2) {
    return {
      streak: 2,
      tier: 'warm',
      label: 'Heating Up',
      bonusGems,
      nextTargetStreak: 3,
      nextBonusGems: 2,
      gemsNeeded: 1,
    };
  }
  if (n === 3) {
    return {
      streak: 3,
      tier: 'hot',
      label: 'On Fire',
      bonusGems,
      nextTargetStreak: 4,
      nextBonusGems: 3,
      gemsNeeded: 1,
    };
  }
  if (n === 4) {
    return {
      streak: 4,
      tier: 'blazing',
      label: 'Unstoppable',
      bonusGems,
      nextTargetStreak: 5,
      nextBonusGems: 5,
      gemsNeeded: 1,
    };
  }
  return {
    streak: n,
    tier: 'legendary',
    label: 'Clash Champion',
    bonusGems,
    nextTargetStreak: null,
    nextBonusGems: 5,
    gemsNeeded: 0,
  };
}

export function advanceWinStreak(
  currentStreak: number,
  bestStreak: number
): {
  nextStreak: number;
  nextBest: number;
  bonusGems: number;
} {
  const safeCur = Math.max(0, Math.floor(currentStreak || 0));
  const safeBest = Math.max(0, Math.floor(bestStreak || 0));
  const nextStreak = safeCur + 1;
  const nextBest = Math.max(safeBest, nextStreak);
  const bonusGems = getWinStreakBonusGems(nextStreak);
  return { nextStreak, nextBest, bonusGems };
}

export function shouldResetStreakOnExit(params: {
  mode: 'classic' | 'timer' | 'level';
  inGame: boolean;
  movesSpent: number;
}): boolean {
  return params.mode === 'level' && params.inGame && params.movesSpent > 0;
}

export function isWinStreakMilestone(streak: number): boolean {
  const n = Math.max(0, Math.floor(streak || 0));
  if (n === 2 || n === 3 || n === 4 || n === 5) return true;
  return n > 5 && n % 5 === 0;
}

export interface WinStreakHudProgress {
  streak: number;
  tier: WinStreakTierId;
  fillPct: number;
  railPct: number;
  activeNodeCount: number;
  nextTarget: number | null;
}

export function getWinStreakHudProgress(streak: number): WinStreakHudProgress {
  const n = Math.max(0, Math.floor(streak || 0));
  const info = getWinStreakInfo(n);

  // Overall progress bar (for compact HUD crest mini-meter)
  let fillPct = 0;
  if (n === 1) fillPct = 20;
  else if (n === 2) fillPct = 42;
  else if (n === 3) fillPct = 64;
  else if (n === 4) fillPct = 84;
  else if (n >= 5) fillPct = 100;

  // Node-to-node connector track across the 4 diamond milestones (x2=0%, x3=33.33%, x4=66.67%, x5+=100%)
  let railPct = 0;
  if (n === 3) railPct = 33.33;
  else if (n === 4) railPct = 66.67;
  else if (n >= 5) railPct = 100;

  let activeNodeCount = 0;
  for (const m of WIN_STREAK_MILESTONES) {
    if (n >= m.streak) activeNodeCount++;
  }

  return {
    streak: n,
    tier: info.tier,
    fillPct,
    railPct,
    activeNodeCount,
    nextTarget: info.nextTargetStreak,
  };
}

export interface WinStreakMilestoneEvent {
  reached: boolean;
  isFirstWin: boolean;
  prevStreak: number;
  streak: number;
  tier: WinStreakTierId;
  eyebrow: string;
  title: string;
  subtitle: string;
  bonusGems: number;
  nextTargetStreak: number | null;
  nextBonusGems: number;
}

export function getWinStreakMilestoneEvent(
  prevStreak: number,
  nextStreak: number
): WinStreakMilestoneEvent {
  const safePrev = Math.max(0, Math.floor(prevStreak || 0));
  const safeNext = Math.max(0, Math.floor(nextStreak || 0));
  const info = getWinStreakInfo(safeNext);
  const reached = safeNext > safePrev && isWinStreakMilestone(safeNext);
  const isFirstWin = safePrev === 0 && safeNext === 1;

  let eyebrow = 'WIN STREAK';
  let subtitle = '';

  if (reached) {
    eyebrow = safeNext >= 5 && safeNext % 5 === 0 ? 'ROYAL MILESTONE' : 'STREAK MILESTONE';
    subtitle = `+${info.bonusGems} Gem${info.bonusGems > 1 ? 's' : ''} / Win Unlocked`;
  } else if (isFirstWin) {
    eyebrow = 'STREAK IGNITED';
    subtitle = 'Win 1 more to unlock +1 Gem / Win';
  } else if (info.bonusGems > 0) {
    eyebrow = 'STREAK EXTENDED';
    subtitle = `+${info.bonusGems} Gems Bonus Active`;
  } else {
    subtitle = info.nextTargetStreak
      ? `${info.gemsNeeded} win to +${info.nextBonusGems} Gem`
      : '';
  }

  return {
    reached,
    isFirstWin,
    prevStreak: safePrev,
    streak: safeNext,
    tier: info.tier,
    eyebrow,
    title: info.label,
    subtitle,
    bonusGems: info.bonusGems,
    nextTargetStreak: info.nextTargetStreak,
    nextBonusGems: info.nextBonusGems,
  };
}

