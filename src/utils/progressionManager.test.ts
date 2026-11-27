import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultSaveState } from './storage';
import {
  applyMissionProgressEvent,
  claimAchievementReward,
  claimDailyMissionReward,
  evaluateScoreMilestones,
  generateDailyMissions,
  grantPlayerXp,
  selectOrUnlockSkin,
  xpForNextLevel,
} from './progressionManager';

test('XP system scales level thresholds cleanly and awards level-up rewards', () => {
  const cb = createDefaultSaveState();
  const needed = xpForNextLevel(1);
  const res = grantPlayerXp(cb, needed + 15);
  assert.equal(res.leveledUpTo, 2);
  assert.equal(res.nextCb.playerLevel, 2);
  assert.equal(res.nextCb.xp, 15);
  assert.ok(res.nextCb.gems > cb.gems);
  assert.equal(res.nextCb.powerUps.colorBlast, cb.powerUps.colorBlast + 1);
});

test('Daily missions generate 3 deterministic missions and enforce single-claim rules', () => {
  const a = generateDailyMissions('2026-11-27');
  const b = generateDailyMissions('2026-11-27');
  assert.equal(a.items.length, 3);
  assert.deepEqual(a.items.map((x) => x.id), b.items.map((x) => x.id));

  let cb = createDefaultSaveState();
  cb = { ...cb, missions: a };
  const targetMission = cb.missions.items[0];

  const premature = claimDailyMissionReward(cb, targetMission.id);
  assert.equal(premature.ok, false);
  assert.equal(premature.reason, 'incomplete');

  const updatedMissions = applyMissionProgressEvent(cb.missions, {
    linesCleared: 50,
    gameCompleted: 5,
    singleGameScore: 5000,
    powerUpUsed: 5,
    comboAchieved: 6,
    completedWithoutUndo: 2,
  });
  cb = { ...cb, missions: updatedMissions.missions };

  const claimed = claimDailyMissionReward(cb, targetMission.id);
  assert.equal(claimed.ok, true);
  assert.equal(claimed.rewardGems, targetMission.rewardGems);

  const duplicate = claimDailyMissionReward(claimed.nextCb, targetMission.id);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.reason, 'already_claimed');
});

test('Score milestones and achievement claims pay once only', () => {
  const cb = createDefaultSaveState();
  const m1 = evaluateScoreMilestones(cb, 1200);
  assert.equal(m1.newlyReached.length, 2); // 500 and 1000
  const m2 = evaluateScoreMilestones(m1.nextCb, 1400);
  assert.equal(m2.newlyReached.length, 0);

  const readyCb = { ...m2.nextCb, st: { ...m2.nextCb.st, games: 1 } };
  const c1 = claimAchievementReward(readyCb, { u: 1, s: {} }, 'first');
  assert.equal(c1.ok, true);
  const c2 = claimAchievementReward(c1.nextCb, { u: 1, s: {} }, 'first');
  assert.equal(c2.ok, false);
  assert.equal(c2.reason, 'already_claimed');
});

test('Cosmetic skin unlock enforces playerLevel, gem balance, and equip persistence', () => {
  const cb = createDefaultSaveState();
  // wooden requires playerLevel 3
  const locked = selectOrUnlockSkin({ ...cb, gems: 500 }, 'wooden');
  assert.equal(locked.ok, false);
  assert.equal(locked.reason, 'locked');

  const poor = selectOrUnlockSkin(cb, 'gemstone');
  assert.equal(poor.ok, false);
  assert.equal(poor.reason, 'insufficient_gems');

  const bought = selectOrUnlockSkin({ ...cb, gems: 100 }, 'gemstone');
  assert.equal(bought.ok, true);
  assert.equal(bought.nextCb.equippedSkin, 'gemstone');
  assert.ok(bought.nextCb.unlockedSkins.includes('gemstone'));
});
