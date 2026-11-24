import React, { useState } from 'react';
import {
  ACHIEVEMENTS,
  LEADERBOARD_TABS,
  THEMES,
} from '../data/constants';
import {
  LeaderboardKey,
  LevelProgress,
  PageId,
  SaveState,
  SettingsState,
  ThemeId,
} from '../types/game';
import { formatDuration } from '../utils/storage';
import { BackIcon, CheckIcon, GemIcon, RankIcon } from './Icons';

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
  onInteract,
}) => {
  const [, setTick] = useState(0);

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
    ['Highest score', st.best],
    ['Average score', st.games ? Math.round(st.sum / st.games) : 0],
    ['Lines cleared', st.lines],
    ['Time played', formatDuration(st.time)],
    ['Longest combo', `x${st.streak}`],
    ['Levels completed', prog.u - 1],
    ['Items collected', st.items],
  ];

  const unlockedAchCount = ACHIEVEMENTS.filter((a) => !!cb.ach[a.id]).length;
  const lbList = cb.lb[lbTab] || [];

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
            {renderToggleRow('sfx', 'Sound effects', 'Taps, placements & clears')}
            {renderRangeRow('sv', 'Effects volume')}
          </div>

          <div className="sec">Feel & Accessibility</div>
          <div className="pc">
            {renderToggleRow('hap', 'Haptic feedback', 'Vibration on supported devices')}
            {renderToggleRow(
              'rm',
              'Reduced motion',
              'Minimize ambient particles and bursts'
            )}
          </div>

          <div className="sec">Guide & Data</div>
          <div className="pc">
            <div className="rw">
              <div>
                <b>How to play</b>
                <small>Replay the interactive 4-step guide</small>
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
                <small>Clears progress, stats, rewards, themes & settings</small>
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
            Block Clash v1.1 · 100% Offline. All sounds are synthesized locally;
            all scores and progress stay strictly on your device.
          </p>
        </div>
      </div>

      {/* Statistics */}
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
          <h3>Statistics</h3>
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
          <div className="sec">
            {unlockedAchCount} of {ACHIEVEMENTS.length} unlocked · +5 gems each
          </div>
          {ACHIEVEMENTS.map((a) => {
            const on = !!cb.ach[a.id];
            const cur = Math.min(a.getProgress(cb, prog), a.target);
            return (
              <div className={`pc ac${on ? ' un' : ''}`} key={a.id}>
                <span className={`ai${on ? ' on' : ''}`}>
                  <svg viewBox="0 0 24 24">
                    <path d={a.iconPath} />
                  </svg>
                </span>
                <div>
                  <b>{a.title}</b>
                  <small>{a.desc}</small>
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Themes */}
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
          <h3>Themes</h3>
          <div className="gem" id="tgems">
            <GemIcon />
            <b>{cb.gems}</b>
          </div>
        </div>
        <div className="pgc" id="thmC">
          <div className="sec">Board & Block Material Packs</div>
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
