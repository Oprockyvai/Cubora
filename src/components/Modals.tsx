import React, { useEffect, useRef, useState } from 'react';
import {
  DAILY_REWARDS,
  MAX_LIVES,
  TIMER_DURATIONS,
} from '../data/constants';
import { GameMode, LevelDef, LevelProgress, SaveState } from '../types/game';
import { describeLevel, makeLevel } from '../utils/levelLogic';
import { formatClock, getDailyRewardState } from '../utils/storage';
import {
  AvatarSvg,
  BigOrbitLogo,
  CheckIcon,
  GemIcon,
  HelpIcon,
  ItemSvg,
  LevelGoalIcon,
  PlayIcon,
  RefreshIcon,
  SoundIcon,
  StarIcon,
} from './Icons';

interface ModalsProps {
  // Pause modal
  showPause: boolean;
  pauseContext: {
    mode: GameMode;
    score: number;
    levelNum?: number;
    timeLeft: number;
  };
  onResumeGame: () => void;
  onRestartRun: () => void;
  onOpenTutorialFromPause: () => void;
  onToggleMusicFromPause: () => void;
  onToggleSfxFromPause: () => void;
  onQuitFromPause: () => void;

  // Timer selector
  showTimerSelect: boolean;
  cb: SaveState;
  onSelectTimer: (dur: number) => void;
  onCancelTimer: () => void;

  // Daily
  showDaily: boolean;
  onClaimDaily: () => void;
  onCloseDaily: () => void;

  // Profile
  showProfile: boolean;
  onSaveProfile: (name: string, av: number) => void;
  onCloseProfile: () => void;

  // Confirm
  confirmState: {
    open: boolean;
    title: string;
    message: string;
    okLabel: string;
    onConfirm: () => void;
  };
  onCloseConfirm: () => void;

  // Level preview
  previewLevelNum: number | null;
  prog: LevelProgress;
  onPlayLevel: (n: number) => void;
  onCloseLevelPreview: () => void;

  // Level win
  winState: {
    open: boolean;
    stars: number;
    score: number;
    movesLeft: number;
    lbRank: number;
  };
  onNextLevel: () => void;
  onWinToMap: () => void;

  // Fail
  failState: {
    open: boolean;
    score: number;
    revived: boolean;
  };
  onContinueWithGems: () => boolean;
  onGiveUp: () => void;

  // Heart break
  showHeartBreak: boolean;
  heartBreakRunId: number;

  // Game over
  overState: {
    open: boolean;
    mode: 'start' | 'over';
    title: string;
    scoreLabel: string;
    score: number;
    best: number;
    lbRank: number;
    lives: number;
    nextLifeText: string;
  };
  onOverPlay: () => void;
  onOverMenu: () => void;

  onInteract: () => void;
}

function renderHighlightedDesc(L: LevelDef): React.ReactNode {
  const text = describeLevel(L);
  const regex = /(\d+|\b(?:pink|cyan|orange|green|yellow|violet)\b)/g;
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    regex.test(part) ? (
      <em className="hlt" key={idx}>
        {part}
      </em>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

export const Modals: React.FC<ModalsProps> = ({
  showPause,
  pauseContext,
  onResumeGame,
  onRestartRun,
  onOpenTutorialFromPause,
  onToggleMusicFromPause,
  onToggleSfxFromPause,
  onQuitFromPause,
  showTimerSelect,
  cb,
  onSelectTimer,
  onCancelTimer,
  showDaily,
  onClaimDaily,
  onCloseDaily,
  showProfile,
  onSaveProfile,
  onCloseProfile,
  confirmState,
  onCloseConfirm,
  previewLevelNum,
  prog,
  onPlayLevel,
  onCloseLevelPreview,
  winState,
  onNextLevel,
  onWinToMap,
  failState,
  onContinueWithGems,
  onGiveUp,
  showHeartBreak,
  heartBreakRunId,
  overState,
  onOverPlay,
  onOverMenu,
  onInteract,
}) => {
  const [draftName, setDraftName] = useState(cb.name);
  const [draftAv, setDraftAv] = useState(cb.av);
  const watchBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (showProfile) {
      setDraftName(cb.name);
      setDraftAv(cb.av);
    }
  }, [showProfile, cb.name, cb.av]);

  const dailyState = getDailyRewardState(cb.daily);
  const dailyDone = dailyState.canClaim
    ? dailyState.idx
    : cb.daily.streak % 7 === 0
    ? 7
    : cb.daily.streak % 7;

  const previewLevel =
    previewLevelNum !== null ? makeLevel(previewLevelNum) : null;
  const previewStars =
    previewLevelNum !== null ? prog.s[previewLevelNum] || 0 : 0;

  const pauseModeLabel =
    pauseContext.mode === 'classic'
      ? 'Classic Endless'
      : pauseContext.mode === 'timer'
      ? `Timer · ${formatClock(pauseContext.timeLeft)} left`
      : `Level ${pauseContext.levelNum || prog.u}`;

  return (
    <>
      {/* Pause Overlay */}
      <div
        className={`over${showPause ? ' on' : ''}`}
        id="pauseModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pauseTitle"
      >
        <div className="card pause-card">
          <div className="pause-badge">{pauseModeLabel}</div>
          <h2 id="pauseTitle">Game Paused</h2>
          <p className="pause-score">
            Current score: <strong>{pauseContext.score.toLocaleString('en-US')}</strong>
          </p>

          <div className="pause-toggles">
            <button
              type="button"
              className={`ptog${cb.set.mus ? ' on' : ''}`}
              onClick={() => {
                onInteract();
                onToggleMusicFromPause();
              }}
            >
              <SoundIcon muted={!cb.set.mus} />
              <span>Music: {cb.set.mus ? 'On' : 'Off'}</span>
            </button>
            <button
              type="button"
              className={`ptog${cb.set.sfx ? ' on' : ''}`}
              onClick={() => {
                onInteract();
                onToggleSfxFromPause();
              }}
            >
              <SoundIcon muted={!cb.set.sfx} />
              <span>SFX: {cb.set.sfx ? 'On' : 'Off'}</span>
            </button>
          </div>

          <button
            type="button"
            className="btn"
            id="pauseResume"
            onClick={() => {
              onInteract();
              onResumeGame();
            }}
          >
            <PlayIcon />
            Resume
          </button>

          <div className="pause-row">
            <button
              type="button"
              className="btn2 show btn-outline"
              id="pauseRestart"
              onClick={() => {
                onInteract();
                onRestartRun();
              }}
            >
              <RefreshIcon />
              Restart
            </button>
            <button
              type="button"
              className="btn2 show btn-outline"
              id="pauseTut"
              onClick={() => {
                onInteract();
                onOpenTutorialFromPause();
              }}
            >
              <HelpIcon />
              How to Play
            </button>
          </div>

          <button
            type="button"
            className="btn2 show btn-outline danger"
            id="pauseQuit"
            onClick={() => {
              onInteract();
              onQuitFromPause();
            }}
          >
            {pauseContext.mode === 'level' ? 'Exit to Level Map' : 'Exit to Home'}
          </button>
        </div>
      </div>

      {/* Timer selection */}
      <div className={`over${showTimerSelect ? ' on' : ''}`} id="tsel">
        <div className="card">
          <h2>Timer Mode</h2>
          <p>Score as high as you can before time runs out. Clearing lines adds +2s.</p>
          <div className="tl" id="tlist">
            {TIMER_DURATIONS.map(([dur, title, sub]) => {
              const key = `t${dur}` as 't90' | 't180' | 't300';
              const best = cb.lb[key][0]?.s;
              return (
                <button
                  key={dur}
                  type="button"
                  className="to"
                  onClick={() => {
                    onInteract();
                    onSelectTimer(dur);
                  }}
                >
                  <span>
                    <strong>{title}</strong>
                    <small>{sub}</small>
                  </span>
                  <em>
                    {best ? `Best ${best.toLocaleString('en-US')}` : 'No score yet'}
                  </em>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="btn2 show btn-outline"
            id="tcancel"
            onClick={() => {
              onInteract();
              onCancelTimer();
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Daily reward */}
      <div className={`over${showDaily ? ' on' : ''}`} id="daily">
        <div className="card">
          <h2>Daily Reward</h2>
          <div className="dg" id="dgrid">
            {DAILY_REWARDS.map((g, i) => (
              <div
                key={i}
                className={`dt${i < dailyDone ? ' dn' : ''}${
                  dailyState.canClaim && i === dailyState.idx ? ' td' : ''
                }`}
              >
                <small>Day {i + 1}</small>
                <GemIcon />
                <b>{g}</b>
                {i < dailyDone && (
                  <em>
                    <CheckIcon />
                  </em>
                )}
              </div>
            ))}
          </div>
          <p id="dmsg">
            {dailyState.canClaim
              ? 'Claim today\u2019s offline gem reward'
              : 'Come back tomorrow for your next reward'}
          </p>
          {dailyState.canClaim && (
            <button
              type="button"
              className="btn"
              id="dclaim"
              onClick={() => {
                onInteract();
                onClaimDaily();
              }}
            >
              Claim +{DAILY_REWARDS[dailyState.idx]} Gems
            </button>
          )}
          <button
            type="button"
            className="btn2 show btn-outline"
            id="dclose"
            onClick={() => {
              onInteract();
              onCloseDaily();
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className={`over${showProfile ? ' on' : ''}`} id="prof">
        <div className="card">
          <h2>Player Profile</h2>
          <p>Stored locally on this device only.</p>
          <div className="pav" id="pav">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                className={`avb${i === draftAv ? ' sel' : ''}`}
                aria-label={`Avatar ${i + 1}`}
                onClick={() => {
                  onInteract();
                  setDraftAv(i);
                }}
              >
                <AvatarSvg index={i} />
              </button>
            ))}
          </div>
          <input
            id="pname"
            className="inp"
            maxLength={14}
            autoComplete="off"
            aria-label="Display name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <button
            type="button"
            className="btn"
            id="psave"
            onClick={() => {
              onInteract();
              onSaveProfile((draftName.trim() || 'Player').slice(0, 14), draftAv);
            }}
          >
            Save Profile
          </button>
          <button
            type="button"
            className="btn2 show btn-outline"
            id="pclose"
            onClick={() => {
              onInteract();
              onCloseProfile();
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Confirm */}
      <div className={`over${confirmState.open ? ' on' : ''}`} id="cfm">
        <div className="card">
          <h2 id="cfT">{confirmState.title}</h2>
          <p id="cfM">{confirmState.message}</p>
          <button
            type="button"
            className="btn"
            id="cfOk"
            onClick={() => {
              onInteract();
              confirmState.onConfirm();
            }}
          >
            {confirmState.okLabel}
          </button>
          <button
            type="button"
            className="btn2 show btn-outline"
            id="cfNo"
            onClick={() => {
              onInteract();
              onCloseConfirm();
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Level preview */}
      <div className={`over${previewLevel ? ' on' : ''}`} id="lvl">
        {previewLevel && (
          <div className="card">
            <h2 id="ln">Level {previewLevel.n}</h2>
            <div className="gi" id="lic">
              {previewLevel.type === 'item' ? (
                <span className="gic">
                  <ItemSvg itemIndex={previewLevel.ik} />
                </span>
              ) : (
                <LevelGoalIcon type={previewLevel.type} />
              )}
            </div>
            <p className="goal" id="lg">
              {renderHighlightedDesc(previewLevel)}
            </p>
            <p id="lm">
              {previewLevel.n % 10 === 5 ? 'Challenge stage · ' : ''}
              {previewLevel.moves} moves
              {previewLevel.pre
                ? ` · Starts with ${previewLevel.pre} blocks`
                : ''}
              <br />
              Finish with spare moves for 3 stars
            </p>
            <div className="ws" id="lst">
              {[1, 2, 3].map((i) => (
                <i key={i} className={i <= previewStars ? 'on' : undefined}>
                  <StarIcon />
                </i>
              ))}
            </div>
            <button
              type="button"
              className="btn"
              id="lplay"
              onClick={() => {
                onInteract();
                onPlayLevel(previewLevel.n);
              }}
            >
              Play Level
            </button>
            <button
              type="button"
              className="btn2 show btn-outline"
              id="lclose"
              onClick={() => {
                onInteract();
                onCloseLevelPreview();
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Level Win */}
      <div className={`over${winState.open ? ' on' : ''}`} id="win">
        <div className="card">
          <h2>Level Complete</h2>
          <div className="ws" id="ws">
            {[1, 2, 3].map((i) => (
              <i
                key={i}
                className={i <= winState.stars ? 'on' : undefined}
                style={{ ['--d' as string]: `${i * 0.25}s` }}
              >
                <StarIcon />
              </i>
            ))}
          </div>
          <p id="wt">
            <span className="sl">Final Score</span>
            <b className="gs">{winState.score.toLocaleString('en-US')}</b>
            <span className="ml">
              Moves remaining <em>{Math.max(0, winState.movesLeft)}</em>
            </span>
            {winState.lbRank > 0 && (
              <span className="ml">
                Device rank <em>#{winState.lbRank}</em>
              </span>
            )}
          </p>
          <button
            type="button"
            className="btn"
            id="wnext"
            onClick={() => {
              onInteract();
              onNextLevel();
            }}
          >
            Next Level
          </button>
          <button
            type="button"
            className="btn2 show btn-outline"
            id="wmap"
            onClick={() => {
              onInteract();
              onWinToMap();
            }}
          >
            Level Map
          </button>
        </div>
      </div>

      {/* Fail */}
      <div className={`over${failState.open ? ' on' : ''}`} id="fail">
        <div className="card">
          <h2>No Moves Left</h2>
          <b id="fs">{failState.score.toLocaleString('en-US')}</b>
          <p id="fmsg">
            {failState.revived
              ? 'You already revived once this run. Give up to record your score and lose one life.'
              : 'Clear 3 dense rows for 10 gems and keep your combo alive.'}
          </p>
          {!failState.revived && (
            <button
              type="button"
              ref={watchBtnRef}
              className={`btn${cb.gems < 10 ? ' dim' : ''}`}
              id="watch"
              onClick={() => {
                onInteract();
                const ok = onContinueWithGems();
                if (!ok && watchBtnRef.current) {
                  watchBtnRef.current.animate(
                    [
                      { transform: 'translateX(-6px)' },
                      { transform: 'translateX(6px)' },
                      { transform: 'none' },
                    ],
                    { duration: 240 }
                  );
                }
              }}
            >
              Continue
              <span className="gc">
                <GemIcon />
                10
              </span>
            </button>
          )}
          <button
            type="button"
            className="btn2 show btn-outline"
            id="giveup"
            onClick={() => {
              onInteract();
              onGiveUp();
            }}
          >
            Give Up
          </button>
        </div>
      </div>

      {/* Heart Break */}
      <div className={`over${showHeartBreak ? ' on' : ''}`} id="brk">
        <div className="card">
          <div className={`bh${showHeartBreak ? ' go' : ''}`} key={heartBreakRunId}>
            <svg className="hs hl" viewBox="0 0 100 90">
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ff8aa0" />
                  <stop offset=".5" stopColor="#ff3d5e" />
                  <stop offset="1" stopColor="#b3112f" />
                </linearGradient>
              </defs>
              <path
                d="M50 86C20 62 4 46 4 28 4 14 15 4 28 4 38 4 46 10 50 18 54 10 62 4 72 4 85 4 96 14 96 28 96 46 80 62 50 86Z"
                fill="url(#hg)"
              />
              <path
                d="M16 24C18 15 26 10 33 11"
                stroke="#fff"
                strokeOpacity=".55"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <svg className="hs hr" viewBox="0 0 100 90">
              <path
                d="M50 86C20 62 4 46 4 28 4 14 15 4 28 4 38 4 46 10 50 18 54 10 62 4 72 4 85 4 96 14 96 28 96 46 80 62 50 86Z"
                fill="url(#hg)"
              />
            </svg>
            <svg className="crack" viewBox="0 0 100 90">
              <path
                d="M50 0L44 21.6 56 37.8 45 55.8 54 72 50 90"
                pathLength={1}
              />
            </svg>
          </div>
          <p className="lost">{'\u2212'}1 life</p>
        </div>
      </div>

      {/* Game Over */}
      <div className={`over${overState.open ? ' on' : ''}`} id="over">
        <div className="card">
          <BigOrbitLogo visible={overState.mode === 'start'} />
          <div
            className="st"
            id="st"
            style={{ display: overState.mode === 'start' ? 'block' : 'none' }}
          >
            <span>Block Clash</span>
          </div>
          <h2 id="ot">{overState.title}</h2>
          <p
            className="fl"
            id="fl"
            style={{ display: overState.mode === 'start' ? 'none' : 'block' }}
          >
            {overState.scoreLabel}
          </p>
          <b
            id="fscore"
            style={{ display: overState.mode === 'start' ? 'none' : 'block' }}
          >
            {overState.score.toLocaleString('en-US')}
          </b>
          <p id="fbest">
            {overState.mode === 'start'
              ? 'Give up after a fail and you lose one life.'
              : `Best: ${Math.round(overState.best).toLocaleString('en-US')}`}
          </p>
          <p id="lbr" className="lbr">
            {overState.mode !== 'start' && overState.lbRank > 0
              ? `Device rank #${overState.lbRank}`
              : ''}
          </p>
          <p id="lmsg">
            {overState.lives < 1
              ? `No lives left · Next life in ${overState.nextLifeText}`
              : `${overState.lives} of ${MAX_LIVES} lives available`}
          </p>
          <button
            type="button"
            className="btn"
            id="again"
            disabled={overState.lives < 1}
            onClick={() => {
              onInteract();
              onOverPlay();
            }}
          >
            {overState.mode === 'start' ? 'Play' : 'Play Again'}
          </button>
          <button
            type="button"
            className="btn2 show btn-outline"
            id="menu"
            onClick={() => {
              onInteract();
              onOverMenu();
            }}
          >
            Home Menu
          </button>
        </div>
      </div>
    </>
  );
};
