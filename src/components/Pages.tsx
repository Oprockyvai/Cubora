import React, { useState } from 'react';
import {
  ACHIEVEMENTS,
  BLOCK_SKINS,
  BOARD_EFFECTS,
  LEADERBOARD_TABS,
  SCORE_MILESTONES,
  SOUND_PACKS,
  THEMES,
} from '../data/constants';
import {
  AchievementDef,
  BlockSkinId,
  BoardEffectId,
  LeaderboardKey,
  LevelProgress,
  MatchHistoryEntry,
  PageId,
  SaveState,
  SettingsState,
  SoundPackId,
  ThemeId,
} from '../types/game';
import {
  formatModeLabel,
  getPersonalChallenges,
  xpForNextLevel,
} from '../utils/progressionManager';
import { formatDuration, getDailyRewardState } from '../utils/storage';
import {
  BackIcon,
  CheckIcon,
  GemIcon,
  GiftIcon,
  HistoryIcon,
  LockIcon,
  MissionIcon,
  PlayIcon,
  RankIcon,
  ShieldChallengeIcon,
  SoundPackIcon,
  TrophyIcon,
} from './Icons';

interface PagesProps {
  activePage: PageId | null;
  cb: SaveState;
  prog: LevelProgress;
  lbTab: LeaderboardKey;
  onChangeLbTab: (tab: LeaderboardKey) => void;
  onClose: () => void;
  onUpdateSetting: (key: keyof SettingsState, val: number) => void;
  onReplayTutorial: () => void;
  onRequestReset: () => void;
  onSelectTheme: (themeId: ThemeId) => void;
  onSelectSkin: (skinId: BlockSkinId) => void;
  onSelectEffect: (effectId: BoardEffectId) => void;
  onSelectSoundPack: (packId: SoundPackId) => void;
  onPreviewSoundPack: (packId: SoundPackId) => void;
  onClaimMission: (missionId: string) => void;
  onOpenDailyModal: () => void;
  onOpenAchievementDetail: (ach: AchievementDef) => void;
  onOpenHistoryDetail: (entry: MatchHistoryEntry) => void;
  onInteract: () => void;
}

export const Pages: React.FC<PagesProps> = ({
  activePage,
  cb,
  prog,
  lbTab,
  onChangeLbTab,
  onClose,
  onUpdateSetting,
  onReplayTutorial,
  onRequestReset,
  onSelectTheme,
  onSelectSkin,
  onSelectEffect,
  onSelectSoundPack,
  onPreviewSoundPack,
  onClaimMission,
  onOpenDailyModal,
  onOpenAchievementDetail,
  onOpenHistoryDetail,
  onInteract,
}) => {
  const [, setTick] = useState(0);
  const [collectionTab, setCollectionTab] = useState<
    'themes' | 'skins' | 'fx' | 'trophies'
  >('themes');
  const [achFilter, setAchFilter] = useState<
    'all' | 'mastery' | 'combo' | 'powerups' | 'collection'
  >('all');

  const handleClose = () => {
    onInteract();
    onClose();
  };

  const renderToggleRow = (
    k: keyof SettingsState,
    label: string,
    sub: string
  ) => (
    <div className="rw" key={k}>
      <div>
        <b>{label}</b>
        <small>{sub}</small>
      </div>
      <label className="sw">
        <input
          type="checkbox"
          checked={!!cb.set[k]}
          aria-label={label}
          onChange={(e) => {
            onUpdateSetting(k, e.target.checked ? 1 : 0);
            setTick((v) => v + 1);
          }}
        />
        <i />
      </label>
    </div>
  );

  const renderRangeRow = (k: keyof SettingsState, label: string) => (
    <div className="rw" style={{ display: 'block' }} key={k}>
      <b
        style={{
          fontSize: '13px',
          color: 'var(--mut)',
          fontWeight: 600,
        }}
      >
        {label}
      </b>
      <input
        className="rg"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={cb.set[k]}
        aria-label={label}
        onChange={(e) => {
          onUpdateSetting(k, Number(e.target.value));
          setTick((v) => v + 1);
        }}
      />
    </div>
  );

  const st = cb.st;
  const statCards: [string, string | number][] = [
    ['Total games', st.games],
    ['Games completed', st.gamesCompleted ?? st.games],
    ['Highest score', st.best],
    ['Average score', st.games ? Math.round(st.sum / st.games) : 0],
    ['Lines cleared', st.lines],
    ['Longest combo', `x${Math.max(st.streak, st.longestCombo || 0)}`],
    ['Power-ups used', st.powerUpsUsed || 0],
    ['Gems earned', st.coinsEarned || 0],
    ['Time played', formatDuration(st.time)],
    ['Best win streak', `x${cb.bestWinStreak || 0}`],
    ['Levels completed', prog.u - 1],
    ['Items collected', st.items],
  ];

  const unlockedAchCount = ACHIEVEMENTS.filter((a) => !!cb.ach[a.id]).length;
  const filteredAch =
    achFilter === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === achFilter);
  const lbList = cb.lb[lbTab] || [];
  const dailyRewardState = getDailyRewardState(cb.daily);
  const personalChallenges = getPersonalChallenges(cb, prog);
  const xpNeeded = xpForNextLevel(cb.playerLevel || 1);
  const xpPct = Math.min(100, Math.round(((cb.xp || 0) / xpNeeded) * 100));

  return (
    <>
      {/* Settings */}
      <div className={`pg${activePage === 'pgSet' ? ' on' : ''}`} id="pgSet">
        <div className="pgh">
          <button
            type="button"
            className="ib"
            aria-label="Back"
            onClick={handleClose}
          >
            <BackIcon />
          </button>
          <h3>Settings</h3>
          <i style={{ width: '44px' }} />
        </div>
        <div className="pgc" id="setC">
          <div className="sec">Audio</div>
          <div className="pc">
            {renderToggleRow('mus', 'Music', 'Ambient procedural soundtrack')}
            {renderRangeRow('mv', 'Music volume')}
            {renderToggleRow('sfx', 'Sound effects', 'Taps, placements, power-ups & clears')}
            {renderRangeRow('sv', 'Effects volume')}
          </div>

          <div className="sec">Sound Pack</div>
          <div className="pc">
            {SOUND_PACKS.map((pack) => {
              const owned = cb.unlockedSoundPacks.includes(pack.id);
              const active = cb.equippedSoundPack === pack.id;
              const locked = cb.playerLevel < pack.unlockLevel && !owned;
              return (
                <div className="rw" key={pack.id}>
                  <div>
                    <b>{pack.name}</b>
                    <small>{pack.desc}</small>
                  </div>
                  <div className="rw-actions">
                    <button
                      type="button"
                      className="btn-preview"
                      aria-label={`Preview ${pack.name}`}
                      onClick={() => onPreviewSoundPack(pack.id)}
                    >
                      <PlayIcon />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm${active ? ' dim' : ''}`}
                      disabled={active || locked}
                      onClick={() => {
                        onInteract();
                        onSelectSoundPack(pack.id);
                      }}
                    >
                      {active
                        ? 'Active'
                        : locked
                        ? `Lv.${pack.unlockLevel}`
                        : owned
                        ? 'Use'
                        : `${pack.costGems}G`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sec">Feel &amp; Accessibility</div>
          <div className="pc">
            {renderToggleRow('hap', 'Haptic feedback', 'Vibration on supported devices')}
            {renderToggleRow(
              'rm',
              'Reduced motion',
              'Minimize ambient particles and bursts'
            )}
          </div>

          <div className="sec">Guide &amp; Data</div>
          <div className="pc">
            <div className="rw">
              <div>
                <b>How to play</b>
                <small>Replay the interactive 5-step guide</small>
              </div>
              <button
                type="button"
                className="btn2 show btn-inline"
                id="replayTut"
                onClick={() => {
                  onInteract();
                  onReplayTutorial();
                }}
              >
                Open Guide
              </button>
            </div>
            <div className="rw">
              <div>
                <b>Reset all data</b>
                <small>Clears progress, stats, rewards, themes &amp; settings</small>
              </div>
              <button
                type="button"
                className="btn2 show btn-inline danger"
                id="rst"
                onClick={() => {
                  onInteract();
                  onRequestReset();
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <p className="fine">
            Block Clash v2.0 · Plays offline. All sounds are synthesized locally;
            all scores and progress stay strictly on your device.
          </p>
        </div>
      </div>

      {/* Daily Missions & Personal Challenges */}
      <div className={`pg${activePage === 'pgMis' ? ' on' : ''}`} id="pgMis">
        <div className="pgh">
          <button
            type="button"
            className="ib"
            aria-label="Back"
            onClick={handleClose}
          >
            <BackIcon />
          </button>
          <h3>Missions</h3>
          <div className="gem">
            <GemIcon />
            <b>{cb.gems}</b>
          </div>
        </div>
        <div className="pgc" id="misC">
          <div className="pc mis-daily-card">
            <div className="mdc-left">
              <span className="mdc-ic">
                <GiftIcon />
              </span>
              <div>
                <b>Daily Login Bonus</b>
                <small>
                  {dailyRewardState.canClaim
                    ? 'Today\u2019s offline gem gift is ready'
                    : `Day ${cb.daily.streak || 1} streak active`}
                </small>
              </div>
            </div>
            <button
              type="button"
              className={`btn btn-sm${!dailyRewardState.canClaim ? ' dim' : ''}`}
              onClick={() => {
                onInteract();
                onOpenDailyModal();
              }}
            >
              {dailyRewardState.canClaim ? 'Claim' : 'View'}
            </button>
          </div>

          <div className="sec">Daily Missions · Resets Daily</div>
          {(cb.missions?.items || []).map((m) => {
            const done = m.progress >= m.target;
            const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
            return (
              <div
                key={m.id}
                className={`pc mis-card${done ? ' done' : ''}${
                  m.claimed ? ' claimed' : ''
                }`}
              >
                <span className={`ai${done ? ' on' : ''}`}>
                  <MissionIcon />
                </span>
                <div className="mis-body">
                  <div className="mis-title-row">
                    <b>{m.title}</b>
                    <span className="mis-prog-txt">
                      {m.progress.toLocaleString('en-US')} /{' '}
                      {m.target.toLocaleString('en-US')}
                    </span>
                  </div>
                  <small>{m.desc}</small>
                  <div className="pb">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="mis-act">
                  {m.claimed ? (
                    <span className="ap">
                      <CheckIcon />
                    </span>
                  ) : done ? (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        onInteract();
                        onClaimMission(m.id);
                      }}
                    >
                      +{m.rewardGems}G
                    </button>
                  ) : (
                    <span className="mis-rew">
                      +{m.rewardGems}G
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="sec">Personal Challenges</div>
          {personalChallenges.map((pc) => {
            const pct = Math.min(100, Math.round((pc.current / pc.target) * 100));
            return (
              <div className="pc ac" key={pc.id}>
                <span className={`ai${pc.completed ? ' on' : ''}`}>
                  <ShieldChallengeIcon />
                </span>
                <div>
                  <b>{pc.title}</b>
                  <small>{pc.desc}</small>
                  <div className="pb">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="ap">
                  {pc.current.toLocaleString('en-US')} /{' '}
                  {pc.target.toLocaleString('en-US')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics & Game History */}
      <div className={`pg${activePage === 'pgStat' ? ' on' : ''}`} id="pgStat">
        <div className="pgh">
          <button
            type="button"
            className="ib"
            aria-label="Back"
            onClick={handleClose}
          >
            <BackIcon />
          </button>
          <h3>Stats &amp; History</h3>
          <i style={{ width: '44px' }} />
        </div>
        <div className="pgc" id="statC">
          <div className="sec">Lifetime Device Stats</div>
          <div className="sg">
            {statCards.map(([label, val]) => (
              <div className="sc" key={label}>
                <b>
                  {typeof val === 'number' ? val.toLocaleString('en-US') : val}
                </b>
                <small>{label}</small>
              </div>
            ))}
          </div>

          <div className="sec">Score Milestones</div>
          <div className="pc ms-strip">
            {SCORE_MILESTONES.map((ms) => {
              const reached = (cb.claimedScoreMilestones || []).includes(ms.score);
              return (
                <div className={`ms-chip${reached ? ' on' : ''}`} key={ms.score}>
                  <strong>{ms.score.toLocaleString('en-US')}</strong>
                  <small>{ms.title}</small>
                  <span>+{ms.rewardGems}G</span>
                </div>
              );
            })}
          </div>

          <div className="sec">Recent Match History</div>
          {!(cb.history && cb.history.length > 0) ? (
            <div className="pc emp-sm">
              <HistoryIcon />
              <span>Play and finish a match to view run breakdowns here.</span>
            </div>
          ) : (
            <div className="pc lbl">
              {cb.history.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className="lr hist-row"
                  onClick={() => {
                    onInteract();
                    onOpenHistoryDetail(entry);
                  }}
                >
                  <span className={`rk${entry.won ? ' r1' : ''}`}>
                    {entry.won ? 'W' : 'R'}
                  </span>
                  <div>
                    <strong>
                      {formatModeLabel(entry.mode, entry.levelNum, entry.timerDur)}
                    </strong>
                    <small>
                      {entry.linesCleared} lines · x{entry.maxCombo} combo ·{' '}
                      {new Date(entry.date).toLocaleDateString()}
                    </small>
                  </div>
                  <span className="ls">
                    {entry.score.toLocaleString('en-US')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className={`pg${activePage === 'pgAch' ? ' on' : ''}`} id="pgAch">
        <div className="pgh">
          <button
            type="button"
            className="ib"
            aria-label="Back"
            onClick={handleClose}
          >
            <BackIcon />
          </button>
          <h3>Achievements</h3>
          <div className="gem">
            <GemIcon />
            <b>{cb.gems}</b>
          </div>
        </div>
        <div className="pgc" id="achC">
          <div className="lts">
            {(
              [
                ['all', 'All'],
                ['mastery', 'Mastery'],
                ['combo', 'Combos'],
                ['powerups', 'Power-Ups'],
                ['collection', 'Collection'],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                className={`lt${achFilter === k ? ' on' : ''}`}
                onClick={() => {
                  onInteract();
                  setAchFilter(k);
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="sec">
            {unlockedAchCount} of {ACHIEVEMENTS.length} unlocked · Tap card for details
          </div>

          {filteredAch.map((a) => {
            const on = !!cb.ach[a.id];
            const cur = Math.min(a.getProgress(cb, prog), a.target);
            return (
              <button
                type="button"
                className={`pc ac ac-btn${on ? ' un' : ''}`}
                key={a.id}
                onClick={() => {
                  onInteract();
                  onOpenAchievementDetail(a);
                }}
              >
                <span className={`ai${on ? ' on' : ''}`}>
                  <svg viewBox="0 0 24 24">
                    <path d={a.iconPath} />
                  </svg>
                </span>
                <div>
                  <b>{a.title}</b>
                  <small>{a.desc} · +{a.rewardGems}G</small>
                  <div className="pb">
                    <i style={{ width: `${(cur / a.target) * 100}%` }} />
                  </div>
                </div>
                <span className="ap">
                  {on ? (
                    <CheckIcon />
                  ) : (
                    `${cur.toLocaleString('en-US')} / ${a.target.toLocaleString('en-US')}`
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collection & Customization Room */}
      <div className={`pg${activePage === 'pgThm' ? ' on' : ''}`} id="pgThm">
        <div className="pgh">
          <button
            type="button"
            className="ib"
            aria-label="Back"
            onClick={handleClose}
          >
            <BackIcon />
          </button>
          <h3>Collection Room</h3>
          <div className="gem" id="tgems">
            <GemIcon />
            <b>{cb.gems}</b>
          </div>
        </div>
        <div className="pgc" id="thmC">
          <div className="lts">
            {(
              [
                ['themes', 'Themes'],
                ['skins', 'Skins'],
                ['fx', 'Effects'],
                ['trophies', 'Trophies'],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                className={`lt${collectionTab === k ? ' on' : ''}`}
                onClick={() => {
                  onInteract();
                  setCollectionTab(k);
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          {collectionTab === 'themes' && (
            <>
              <div className="sec">Board &amp; Block Palettes</div>
              {THEMES.map((t) => {
                const owned = cb.unl.includes(t.id);
                const equipped = cb.theme === t.id;
                return (
                  <div className={`pc tc${equipped ? ' eq' : ''}`} key={t.id}>
                    <div
                      className="tp"
                      style={{
                        background: `linear-gradient(160deg, ${t.bg2}, #050818)`,
                      }}
                    >
                      {t.colors.map((c, idx) => (
                        <s
                          key={idx}
                          style={{
                            background: `linear-gradient(155deg, color-mix(in srgb, ${c} 75%, #fff), ${c} 55%, color-mix(in srgb, ${c} 70%, #000))`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="tn">
                      <b>{t.name}</b>
                      <small>
                        {equipped
                          ? 'Equipped'
                          : owned
                          ? 'Unlocked'
                          : `Unlock for ${t.cost} gems`}
                      </small>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm${equipped ? ' dim' : ''}`}
                      disabled={equipped}
                      onClick={() => {
                        onInteract();
                        onSelectTheme(t.id);
                      }}
                    >
                      {equipped ? 'Active' : owned ? 'Equip' : `${t.cost} Gems`}
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {collectionTab === 'skins' && (
            <>
              <div className="sec">Block Material Finishes</div>
              {BLOCK_SKINS.map((sk) => {
                const owned = cb.unlockedSkins.includes(sk.id);
                const equipped = cb.equippedSkin === sk.id;
                const locked = !owned && cb.playerLevel < sk.unlockLevel;
                return (
                  <div className={`pc tc${equipped ? ' eq' : ''}`} key={sk.id}>
                    <div className="skin-pv" data-skin={sk.id}>
                      {[0, 1, 2, 3].map((ci) => (
                        <i
                          key={ci}
                          className="k f"
                          style={{ ['--col' as string]: `var(--c${ci})` }}
                        />
                      ))}
                    </div>
                    <div className="tn">
                      <b>{sk.name}</b>
                      <small>{sk.desc}</small>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm${equipped || locked ? ' dim' : ''}`}
                      disabled={equipped || locked}
                      onClick={() => {
                        onInteract();
                        onSelectSkin(sk.id);
                      }}
                    >
                      {equipped
                        ? 'Active'
                        : locked
                        ? `Lv.${sk.unlockLevel}`
                        : owned
                        ? 'Equip'
                        : `${sk.costGems} Gems`}
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {collectionTab === 'fx' && (
            <>
              <div className="sec">Board Clear Effects</div>
              {BOARD_EFFECTS.map((ef) => {
                const owned = cb.unlockedEffects.includes(ef.id);
                const equipped = cb.equippedEffect === ef.id;
                const locked = !owned && cb.playerLevel < ef.unlockLevel;
                return (
                  <div className={`pc tc${equipped ? ' eq' : ''}`} key={ef.id}>
                    <span
                      className="ef-swatch"
                      style={{ ['--ef-c' as string]: ef.accent }}
                    />
                    <div className="tn">
                      <b>{ef.name}</b>
                      <small>{ef.desc}</small>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm${equipped || locked ? ' dim' : ''}`}
                      disabled={equipped || locked}
                      onClick={() => {
                        onInteract();
                        onSelectEffect(ef.id);
                      }}
                    >
                      {equipped
                        ? 'Active'
                        : locked
                        ? `Lv.${ef.unlockLevel}`
                        : owned
                        ? 'Equip'
                        : `${ef.costGems} Gems`}
                    </button>
                  </div>
                );
              })}

              <div className="sec">Sound Effect Packs</div>
              {SOUND_PACKS.map((pk) => {
                const owned = cb.unlockedSoundPacks.includes(pk.id);
                const equipped = cb.equippedSoundPack === pk.id;
                const locked = !owned && cb.playerLevel < pk.unlockLevel;
                return (
                  <div className={`pc tc${equipped ? ' eq' : ''}`} key={pk.id}>
                    <span className="ai">
                      <SoundPackIcon />
                    </span>
                    <div className="tn">
                      <b>{pk.name}</b>
                      <small>{pk.desc}</small>
                    </div>
                    <div className="rw-actions">
                      <button
                        type="button"
                        className="btn-preview"
                        aria-label={`Preview ${pk.name}`}
                        onClick={() => onPreviewSoundPack(pk.id)}
                      >
                        <PlayIcon />
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm${equipped || locked ? ' dim' : ''}`}
                        disabled={equipped || locked}
                        onClick={() => {
                          onInteract();
                          onSelectSoundPack(pk.id);
                        }}
                      >
                        {equipped
                          ? 'Active'
                          : locked
                          ? `Lv.${pk.unlockLevel}`
                          : owned
                          ? 'Equip'
                          : `${pk.costGems}G`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {collectionTab === 'trophies' && (
            <>
              <div className="pc trophy-hero">
                <span className="ai on lg">
                  <TrophyIcon />
                </span>
                <div>
                  <strong>Player Rank Level {cb.playerLevel || 1}</strong>
                  <small>
                    {cb.xp || 0} / {xpNeeded} XP to next rank
                  </small>
                  <div className="pb">
                    <i style={{ width: `${xpPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="sec">Collected Milestones &amp; Badges</div>
              <div className="trophy-grid">
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = !!cb.ach[a.id];
                  return (
                    <button
                      type="button"
                      key={a.id}
                      className={`pc trophy-tile${unlocked ? ' on' : ''}`}
                      onClick={() => {
                        onInteract();
                        onOpenAchievementDetail(a);
                      }}
                    >
                      <span className={`ai${unlocked ? ' on' : ''}`}>
                        {unlocked ? (
                          <svg viewBox="0 0 24 24">
                            <path d={a.iconPath} />
                          </svg>
                        ) : (
                          <LockIcon />
                        )}
                      </span>
                      <small>{a.title}</small>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Local Ranks */}
      <div className={`pg${activePage === 'pgLb' ? ' on' : ''}`} id="pgLb">
        <div className="pgh">
          <button
            type="button"
            className="ib"
            aria-label="Back"
            onClick={handleClose}
          >
            <BackIcon />
          </button>
          <h3>Local Ranks</h3>
          <i style={{ width: '44px' }} />
        </div>
        <div className="pgc" id="lbC">
          <div className="lts">
            {LEADERBOARD_TABS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`lt${k === lbTab ? ' on' : ''}`}
                onClick={() => {
                  onInteract();
                  onChangeLbTab(k);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="sec">Top 10 · Stored on this device only</div>

          {!lbList.length ? (
            <div className="emp">
              <RankIcon />
              <strong>No scores yet</strong>
              <small>
                Finish a run in this mode to record your first personal best.
              </small>
            </div>
          ) : (
            <div className="pc lbl">
              {lbList.map((e, i) => {
                const isLatest =
                  cb.lastLb && cb.lastLb.k === lbTab && cb.lastLb.d === e.d;
                const dateStr = new Date(e.d).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                });
                const sub =
                  dateStr +
                  (e.lv
                    ? ` \u00b7 Level ${e.lv} \u00b7 ${e.st}${
                        e.st === 1 ? ' star' : ' stars'
                      }`
                    : '');
                return (
                  <div
                    className={`lr${isLatest ? ' me' : ''}`}
                    key={`${e.d}-${i}`}
                  >
                    <span className={`rk r${i < 3 ? i + 1 : 0}`}>{i + 1}</span>
                    <div>
                      <strong>
                        {e.n}
                        {isLatest && <em className="you">LATEST</em>}
                      </strong>
                      <small>{sub}</small>
                    </div>
                    <span className="ls">{e.s.toLocaleString('en-US')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

