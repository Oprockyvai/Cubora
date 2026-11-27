import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  didStreakIncrease,
  evaluateDropAttempt,
  getBoardCellCenterPercent,
  getComboHudState,
  shouldTickGameplayClock,
} from './gameHelpers.ts';

describe('evaluateDropAttempt', () => {
  const emptyBoard = () => Array(64).fill(-1);
  const boardRect = { left: 100, top: 100, right: 420, bottom: 420 };
  const cs = 40;

  it('flags invalid drop with overlapping cells when dropped on an occupied square', () => {
    const board = emptyBoard();
    board[0] = 2; // (0,0) occupied
    const coords: [number, number][] = [
      [0, 0],
      [0, 1],
    ];
    const res = evaluateDropAttempt(
      board,
      coords,
      0,
      0,
      100,
      100,
      2,
      1,
      boardRect,
      cs
    );
    assert.equal(res.isOverBoardAttempt, true);
    assert.deepEqual(res.invalidCells, [0, 1]);
  });

  it('ignores release completely outside the board tray area', () => {
    const board = emptyBoard();
    const coords: [number, number][] = [[0, 0]];
    const res = evaluateDropAttempt(
      board,
      coords,
      12,
      2,
      180,
      580,
      1,
      1,
      boardRect,
      cs
    );
    assert.equal(res.isOverBoardAttempt, false);
    assert.deepEqual(res.invalidCells, []);
  });
});

describe('shouldTickGameplayClock', () => {
  const base = {
    screen: 'game' as const,
    mode: 'timer' as const,
    inGame: true,
    paused: false,
    tutorialOpen: false,
    overOpen: false,
    failOpen: false,
    winOpen: false,
    documentHidden: false,
    timerPlaying: true,
    forTimerCountdown: true,
  };

  it('ticks when actively playing in timer mode', () => {
    assert.equal(shouldTickGameplayClock(base), true);
  });

  it('stops ticking when paused or tutorial is open', () => {
    assert.equal(shouldTickGameplayClock({ ...base, paused: true }), false);
    assert.equal(shouldTickGameplayClock({ ...base, tutorialOpen: true }), false);
  });

  it('stops ticking when fail/win/over modal is open or tab is hidden', () => {
    assert.equal(shouldTickGameplayClock({ ...base, failOpen: true }), false);
    assert.equal(shouldTickGameplayClock({ ...base, winOpen: true }), false);
    assert.equal(shouldTickGameplayClock({ ...base, overOpen: true }), false);
    assert.equal(shouldTickGameplayClock({ ...base, documentHidden: true }), false);
  });
});

describe('combo HUD helpers', () => {
  it('computes tiers, fill percentage, and labels for streak levels', () => {
    const idle = getComboHudState(0);
    assert.equal(idle.isActive, false);
    assert.equal(idle.tier, 'idle');
    assert.equal(idle.fillPct, 0);
    assert.equal(idle.label, 'Combo');
    assert.equal(idle.badgeText, '');

    const warm = getComboHudState(1);
    assert.equal(warm.isActive, true);
    assert.equal(warm.tier, 'warm');
    assert.equal(warm.label, 'Combo x1');
    assert.equal(warm.badgeText, 'x1');

    const hot = getComboHudState(3);
    assert.equal(hot.tier, 'hot');
    assert.equal(hot.fillPct, 50);
    assert.equal(hot.label, 'Combo x3');

    const blazing = getComboHudState(8);
    assert.equal(blazing.tier, 'blazing');
    assert.equal(blazing.fillPct, 100);
    assert.equal(blazing.badgeText, 'x8');
  });

  it('detects strict streak increases only when nextStreak rises above prevStreak', () => {
    assert.equal(didStreakIncrease(0, 1), true);
    assert.equal(didStreakIncrease(1, 2), true);
    assert.equal(didStreakIncrease(2, 2), false);
    assert.equal(didStreakIncrease(3, 0), false);
    assert.equal(didStreakIncrease(0, 0), false);
  });
});

describe('getBoardCellCenterPercent', () => {
  it('maps board cell indices to exact center percentage coordinates', () => {
    const topLeft = getBoardCellCenterPercent(0, 8);
    assert.deepEqual(topLeft, { row: 0, col: 0, xPct: 6.25, yPct: 6.25 });

    const bottomRight = getBoardCellCenterPercent(63, 8);
    assert.deepEqual(bottomRight, { row: 7, col: 7, xPct: 93.75, yPct: 93.75 });

    const mid = getBoardCellCenterPercent(27, 8); // row 3, col 3
    assert.deepEqual(mid, { row: 3, col: 3, xPct: 43.75, yPct: 43.75 });
  });

  it('clamps out-of-range cell indices safely', () => {
    assert.equal(getBoardCellCenterPercent(-5, 8).row, 0);
    assert.equal(getBoardCellCenterPercent(999, 8).col, 7);
  });
});
