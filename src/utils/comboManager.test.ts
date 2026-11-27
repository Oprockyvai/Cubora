import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeOriginalBaseMoveScore,
  evaluateComboBonusLayer,
} from './comboManager';

test('computeOriginalBaseMoveScore preserves exact original Block Clash scoring formula', () => {
  // No lines cleared -> block count only
  assert.equal(computeOriginalBaseMoveScore(4, 0, 0), 4);
  // 1 line, streak 1 -> blocks + 10 + 0
  assert.equal(computeOriginalBaseMoveScore(3, 1, 1), 13);
  // 2 lines, streak 3 -> blocks + 40 + 20
  assert.equal(computeOriginalBaseMoveScore(5, 2, 3), 65);
});

test('evaluateComboBonusLayer computes tiers and blocks duplicate rewards across same moveToken', () => {
  const rewarded = new Set<string>();

  const idle = evaluateComboBonusLayer({
    nextStreak: 0,
    linesCleared: 0,
    moveToken: 'm0',
    rewardedTokens: rewarded,
  });
  assert.equal(idle.tierId, 'idle');
  assert.equal(idle.bonusXp, 0);

  const first = evaluateComboBonusLayer({
    nextStreak: 3,
    linesCleared: 1,
    moveToken: 'm1',
    rewardedTokens: rewarded,
  });
  assert.equal(first.tierId, 'hot');
  assert.equal(first.multiplierLabel, 'x3');
  assert.ok(first.bonusXp > 0);
  assert.equal(first.duplicateBlocked, false);

  const duplicate = evaluateComboBonusLayer({
    nextStreak: 3,
    linesCleared: 1,
    moveToken: 'm1',
    rewardedTokens: rewarded,
  });
  assert.equal(duplicate.duplicateBlocked, true);
  assert.equal(duplicate.bonusXp, 0);
  assert.equal(duplicate.bonusGems, 0);
});
