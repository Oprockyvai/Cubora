import assert from 'node:assert/strict';
import test from 'node:test';
import {
  migrateSaveStatePayload,
  validateResumeSnapshot,
} from './storage';

test('migrateSaveStatePayload preserves all v1 scores, gems, themes, achievements, and initializes starter power-ups', () => {
  const legacyV1 = {
    v: 1,
    name: 'Arjun',
    av: 3,
    gems: 85,
    theme: 'sunset',
    unl: ['aurora', 'sunset'],
    set: { mus: 0, sfx: 1, mv: 0.4, sv: 0.9, hap: 1, rm: 0 },
    st: { games: 14, sum: 9400, best: 1850, lines: 82, time: 920, streak: 4, items: 12, claims: 2, perfect: 3 },
    ach: { first: 1700000000000 },
    winStreak: 3,
    bestWinStreak: 5,
    lb: { classic: [{ n: 'Arjun', s: 1850, d: 1700000000000 }], t90: [], t180: [], t300: [], level: [] },
  };

  const migrated = migrateSaveStatePayload(legacyV1, '2026-11-27');
  assert.equal(migrated.v, 2);
  assert.equal(migrated.name, 'Arjun');
  assert.equal(migrated.gems, 85);
  assert.equal(migrated.theme, 'sunset');
  assert.equal(migrated.st.best, 1850);
  assert.equal(migrated.lb.classic[0]?.s, 1850);
  assert.equal(migrated.claimedAch.first, true);
  assert.ok(migrated.powerUps.hammer > 0);
  assert.equal(migrated.missions.items.length, 3);
});

test('migrateSaveStatePayload recovers safely from corrupted fields', () => {
  const corrupted = {
    v: 'bad',
    gems: -500,
    playerLevel: -9,
    theme: 'nonexistent',
    powerUps: { hammer: -10, boom: 999 },
    st: { games: Number.NaN, best: -40 },
  };

  const recovered = migrateSaveStatePayload(corrupted, '2026-11-27');
  assert.equal(recovered.v, 2);
  assert.equal(recovered.gems, 0);
  assert.equal(recovered.playerLevel, 1);
  assert.equal(recovered.theme, 'aurora');
  assert.equal(recovered.powerUps.hammer, 0);
  assert.equal(recovered.powerUps.boom, 3); // capped at maxQty
  assert.equal(recovered.st.games, 0);
  assert.equal(recovered.st.best, 0);
});

test('validateResumeSnapshot accepts valid matches and rejects invalid/expired states', () => {
  const valid = {
    v: 1,
    savedAt: Date.now(),
    mode: 'classic',
    timerDur: 90,
    timeLeft: 90,
    lv: null,
    moves: 0,
    board: Array(64).fill(-1),
    boardItems: Array(64).fill(0),
    pieces: [null, null, null],
    score: 240,
    streak: 1,
    revived: false,
    undoUsedInRun: false,
    powerUpsUsedInRun: 0,
    linesClearedInRun: 2,
    runMaxCombo: 1,
    durationSec: 45,
  };
  assert.ok(validateResumeSnapshot(valid) !== null);
  assert.equal(validateResumeSnapshot({ ...valid, board: [1, 2] }), null);
  assert.equal(validateResumeSnapshot({ ...valid, mode: 'timer', timeLeft: 0 }), null);
});
