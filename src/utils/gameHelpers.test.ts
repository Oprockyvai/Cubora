import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDropAttempt, shouldTickGameplayClock } from './gameHelpers.ts';

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
