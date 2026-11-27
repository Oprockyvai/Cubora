import { COMBO_CONFIG } from '../data/constants';

export interface ComboStepEvaluation {
  streak: number;
  tierId: 'idle' | 'warm' | 'hot' | 'blazing';
  multiplierLabel: string;
  bonusXp: number;
  bonusGems: number;
  milestoneToast: string | null;
  duplicateBlocked: boolean;
}

/**
 * Original Block Clash base scoring formula — preserved untouched:
 * `pieceBlockCount + (lines > 0 ? lines * lines * 10 + (nextStreak - 1) * 10 : 0)`
 */
export function computeOriginalBaseMoveScore(
  pieceBlockCount: number,
  linesCleared: number,
  nextStreak: number
): number {
  const safeBlocks = Math.max(0, Math.floor(pieceBlockCount || 0));
  const safeLines = Math.max(0, Math.floor(linesCleared || 0));
  const safeStreak = Math.max(0, Math.floor(nextStreak || 0));
  if (safeLines <= 0) return safeBlocks;
  return safeBlocks + safeLines * safeLines * 10 + Math.max(0, safeStreak - 1) * 10;
}

/**
 * Separate, configurable Combo Manager bonus layer that leaves original
 * base scoring untouched and deduplicates bonus payouts across Undo moves.
 */
export function evaluateComboBonusLayer(params: {
  nextStreak: number;
  linesCleared: number;
  moveToken: string;
  rewardedTokens: Set<string>;
}): ComboStepEvaluation {
  const { nextStreak, linesCleared, moveToken, rewardedTokens } = params;

  if (linesCleared <= 0 || nextStreak <= 0) {
    return {
      streak: 0,
      tierId: 'idle',
      multiplierLabel: '',
      bonusXp: 0,
      bonusGems: 0,
      milestoneToast: null,
      duplicateBlocked: false,
    };
  }

  let matchedTier: (typeof COMBO_CONFIG.tiers)[number] = COMBO_CONFIG.tiers[0];
  for (const tier of COMBO_CONFIG.tiers) {
    if (nextStreak >= tier.minStreak) {
      matchedTier = tier;
    }
  }

  const alreadyRewarded = rewardedTokens.has(moveToken);
  if (!alreadyRewarded) {
    rewardedTokens.add(moveToken);
  }

  const milestoneToast =
    nextStreak >= 5
      ? `Blazing Combo x${nextStreak}`
      : nextStreak >= 3
      ? `Super Combo x${nextStreak}`
      : nextStreak >= 2
      ? `Combo x${nextStreak}`
      : null;

  return {
    streak: nextStreak,
    tierId: matchedTier.id,
    multiplierLabel: matchedTier.multiplierText,
    bonusXp: alreadyRewarded ? 0 : matchedTier.bonusXp,
    bonusGems: alreadyRewarded ? 0 : matchedTier.bonusCoins,
    milestoneToast,
    duplicateBlocked: alreadyRewarded,
  };
}
