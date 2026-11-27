import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceWinStreak,
  getWinStreakBonusGems,
  getWinStreakHudProgress,
  getWinStreakInfo,
  getWinStreakMilestoneEvent,
  isWinStreakMilestone,
  shouldResetStreakOnExit,
} from './streakLogic';

test('getWinStreakBonusGems awards escalating bonus gems starting at 2 wins', () => {
  assert.equal(getWinStreakBonusGems(0), 0);
  assert.equal(getWinStreakBonusGems(1), 0);
  assert.equal(getWinStreakBonusGems(2), 1);
  assert.equal(getWinStreakBonusGems(3), 2);
  assert.equal(getWinStreakBonusGems(4), 3);
  assert.equal(getWinStreakBonusGems(5), 5);
  assert.equal(getWinStreakBonusGems(12), 5);
});

test('advanceWinStreak increments streak, updates best, and calculates bonus', () => {
  const s1 = advanceWinStreak(0, 0);
  assert.deepEqual(s1, { nextStreak: 1, nextBest: 1, bonusGems: 0 });

  const s2 = advanceWinStreak(s1.nextStreak, s1.nextBest);
  assert.deepEqual(s2, { nextStreak: 2, nextBest: 2, bonusGems: 1 });

  const s5 = advanceWinStreak(4, 7);
  assert.deepEqual(s5, { nextStreak: 5, nextBest: 7, bonusGems: 5 });
});

test('getWinStreakInfo returns accurate tier labels and next targets', () => {
  const info0 = getWinStreakInfo(0);
  assert.equal(info0.tier, 'none');
  assert.equal(info0.nextTargetStreak, 2);
  assert.equal(info0.nextBonusGems, 1);

  const info3 = getWinStreakInfo(3);
  assert.equal(info3.tier, 'hot');
  assert.equal(info3.label, 'On Fire');
  assert.equal(info3.bonusGems, 2);
  assert.equal(info3.nextTargetStreak, 4);
  assert.equal(info3.nextBonusGems, 3);

  const info6 = getWinStreakInfo(6);
  assert.equal(info6.tier, 'legendary');
  assert.equal(info6.nextTargetStreak, null);
  assert.equal(info6.bonusGems, 5);
});

test('shouldResetStreakOnExit only resets active level runs after moves are spent', () => {
  assert.equal(
    shouldResetStreakOnExit({ mode: 'level', inGame: true, movesSpent: 1 }),
    true
  );
  assert.equal(
    shouldResetStreakOnExit({ mode: 'level', inGame: true, movesSpent: 0 }),
    false
  );
  assert.equal(
    shouldResetStreakOnExit({ mode: 'classic', inGame: true, movesSpent: 5 }),
    false
  );
});

test('isWinStreakMilestone flags 2, 3, 4, 5 and multiples of 5 above 5', () => {
  assert.equal(isWinStreakMilestone(0), false);
  assert.equal(isWinStreakMilestone(1), false);
  assert.equal(isWinStreakMilestone(2), true);
  assert.equal(isWinStreakMilestone(3), true);
  assert.equal(isWinStreakMilestone(4), true);
  assert.equal(isWinStreakMilestone(5), true);
  assert.equal(isWinStreakMilestone(6), false);
  assert.equal(isWinStreakMilestone(10), true);
  assert.equal(isWinStreakMilestone(15), true);
});

test('getWinStreakHudProgress computes monotonic fillPct, exact railPct, and node count', () => {
  const p0 = getWinStreakHudProgress(0);
  const p1 = getWinStreakHudProgress(1);
  const p2 = getWinStreakHudProgress(2);
  const p3 = getWinStreakHudProgress(3);
  const p4 = getWinStreakHudProgress(4);
  const p5 = getWinStreakHudProgress(5);

  assert.equal(p0.fillPct, 0);
  assert.equal(p0.railPct, 0);
  assert.equal(p0.activeNodeCount, 0);
  assert.ok(p1.fillPct > p0.fillPct && p1.fillPct < p2.fillPct);
  assert.equal(p2.railPct, 0);
  assert.equal(p2.activeNodeCount, 1);
  assert.equal(p3.railPct, 33.33);
  assert.equal(p3.activeNodeCount, 2);
  assert.equal(p4.railPct, 66.67);
  assert.equal(p4.activeNodeCount, 3);
  assert.equal(p5.fillPct, 100);
  assert.equal(p5.railPct, 100);
  assert.equal(p5.activeNodeCount, 4);
});

test('getWinStreakMilestoneEvent distinguishes first win, milestone hit, and extended win', () => {
  const first = getWinStreakMilestoneEvent(0, 1);
  assert.equal(first.reached, false);
  assert.equal(first.isFirstWin, true);
  assert.equal(first.eyebrow, 'STREAK IGNITED');

  const m2 = getWinStreakMilestoneEvent(1, 2);
  assert.equal(m2.reached, true);
  assert.equal(m2.title, 'Heating Up');
  assert.equal(m2.bonusGems, 1);
  assert.equal(m2.eyebrow, 'STREAK MILESTONE');

  const m5 = getWinStreakMilestoneEvent(4, 5);
  assert.equal(m5.reached, true);
  assert.equal(m5.tier, 'legendary');
  assert.equal(m5.eyebrow, 'ROYAL MILESTONE');
  assert.equal(m5.bonusGems, 5);

  const ext6 = getWinStreakMilestoneEvent(5, 6);
  assert.equal(ext6.reached, false);
  assert.equal(ext6.eyebrow, 'STREAK EXTENDED');
  assert.equal(ext6.bonusGems, 5);
});

