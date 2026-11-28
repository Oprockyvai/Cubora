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

test('Endless achievements: finishing a tier reveals the next one, forever', async () => {
  const { getActiveEndlessAchievements, resolveEndlessAchievement } = await import('./endlessAchievements');
  const { checkNewlyUnlockedAchievements } = await import('./progressionManager');
  const prog = { u: 1 } as Parameters<typeof checkNewlyUnlockedAchievements>[1];

  const fresh = createDefaultSaveState();
  assert.equal(getActiveEndlessAchievements(fresh, prog).length, 0, 'nothing before the fixed ones are done');

  // 10,000 lifetime points completes the fixed "10,000 Points" achievement -> tier 2 (25,000) appears.
  const a = checkNewlyUnlockedAchievements({ ...fresh, st: { ...fresh.st, sum: 10000 } }, prog);
  const tier2 = getActiveEndlessAchievements(a.nextCb, prog).find((x) => x.id === 'e_pts_2');
  assert.ok(tier2, 'tier 2 is now visible');
  assert.equal(tier2.target, 25000);
  assert.equal(a.nextCb.ach.e_pts_2, undefined, 'tier 2 is not unlocked yet');

  // 60,000 points clears tiers 2 (25k) and 3 (50k) in one go and reveals tier 4 (100k).
  const b = checkNewlyUnlockedAchievements({ ...a.nextCb, st: { ...a.nextCb.st, sum: 60000 } }, prog);
  assert.ok(b.nextCb.ach.e_pts_2 && b.nextCb.ach.e_pts_3);
  const next = getActiveEndlessAchievements(b.nextCb, prog).find((x) => x.id.startsWith('e_pts_'));
  assert.equal(next?.id, 'e_pts_4');
  assert.equal(next?.target, 100000);

  // Gems are paid exactly once, and re-checking is a no-op.
  const again = checkNewlyUnlockedAchievements(b.nextCb, prog);
  assert.equal(again.newlyUnlocked.length, 0);

  // Rewards grow, ids resolve, garbage does not.
  assert.ok((resolveEndlessAchievement('e_pts_9')?.rewardGems ?? 0) > (resolveEndlessAchievement('e_pts_2')?.rewardGems ?? 0));
  assert.equal(resolveEndlessAchievement('e_pts_1'), null);
  assert.equal(resolveEndlessAchievement('e_nope_3'), null);
  assert.equal(resolveEndlessAchievement('k10'), null);
});
