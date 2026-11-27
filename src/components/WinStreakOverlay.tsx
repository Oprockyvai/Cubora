import React from 'react';
import {
  getWinStreakHudProgress,
  getWinStreakInfo,
  WIN_STREAK_MILESTONES,
  WinStreakMilestoneEvent,
} from '../utils/streakLogic';
import { FlameIcon, GemIcon } from './Icons';

export interface ActiveStreakFlare {
  key: number;
  event: WinStreakMilestoneEvent;
  exiting: boolean;
}

interface HudWinStreakCrestProps {
  winStreak: number;
  isFlaring?: boolean;
}

export const HudWinStreakCrest: React.FC<HudWinStreakCrestProps> = ({
  winStreak,
  isFlaring = false,
}) => {
  const safeStreak = Math.max(0, Math.floor(winStreak || 0));
  const info = getWinStreakInfo(safeStreak);
  const progress = getWinStreakHudProgress(safeStreak);

  return (
    <div
      className={`hud-wstreak tier-${info.tier}${safeStreak > 0 ? ' active' : ''}${
        isFlaring ? ' flaring' : ''
      }`}
      data-testid="hud-win-streak"
      data-streak={safeStreak}
      data-tier={info.tier}
      title={
        safeStreak > 0
          ? `Win Streak ×${safeStreak} (${info.label})`
          : 'Win consecutive levels to build your streak bonus'
      }
    >
      <span className="hws-emblem" aria-hidden="true">
        <FlameIcon className="hws-flame" />
      </span>
      <span className="hws-meta">
        <strong className="hws-count">×{safeStreak}</strong>
        <span className="hws-track" aria-hidden="true">
          <i style={{ width: `${progress.fillPct}%` }} />
        </span>
      </span>
    </div>
  );
};

interface WinStreakOverlayProps {
  flare: ActiveStreakFlare | null;
}

const SPARK_VECTORS = [
  { tx: '-58px', ty: '-36px', delay: '0.06s', scale: 1.05 },
  { tx: '58px', ty: '-34px', delay: '0.09s', scale: 0.95 },
  { tx: '-74px', ty: '8px', delay: '0.12s', scale: 0.8 },
  { tx: '74px', ty: '10px', delay: '0.11s', scale: 0.85 },
  { tx: '-36px', ty: '42px', delay: '0.15s', scale: 0.75 },
  { tx: '40px', ty: '40px', delay: '0.14s', scale: 0.8 },
];

export const WinStreakOverlay: React.FC<WinStreakOverlayProps> = ({ flare }) => {
  if (!flare) return null;

  const { event, exiting, key } = flare;
  const prevProgress = getWinStreakHudProgress(event.prevStreak);
  const nextProgress = getWinStreakHudProgress(event.streak);
  const isMilestone = event.reached;

  return (
    <div
      key={key}
      className={`wso-wrap tier-${event.tier}${isMilestone ? ' milestone' : ' advance'}${
        exiting ? ' exiting' : ''
      }`}
      data-testid="win-streak-flare"
      data-streak={event.streak}
      data-prev-streak={event.prevStreak}
      data-milestone={isMilestone ? 'true' : 'false'}
      data-tier={event.tier}
      role="status"
      aria-live="polite"
    >
      {/* Dramatic starburst aura & shockwave ring on milestone hits */}
      <div className="wso-aura" aria-hidden="true">
        {isMilestone && (
          <>
            <span className="wso-ring" />
            <svg className="wso-rays" viewBox="0 0 200 200">
              <defs>
                <radialGradient id="wsoRayFade" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff6c2" stopOpacity="0.95" />
                  <stop offset="48%" stopColor="#ffba38" stopOpacity="0.52" />
                  <stop offset="100%" stopColor="#ff7b24" stopOpacity="0" />
                </radialGradient>
              </defs>
              {Array.from({ length: 12 }).map((_, i) => (
                <polygon
                  key={i}
                  points="100,100 91,6 109,6"
                  fill="url(#wsoRayFade)"
                  transform={`rotate(${i * 30} 100 100)`}
                />
              ))}
            </svg>
            <div className="wso-sparks">
              {SPARK_VECTORS.map((s, idx) => (
                <span
                  key={idx}
                  className="wso-spark"
                  style={{
                    ['--tx' as string]: s.tx,
                    ['--ty' as string]: s.ty,
                    ['--sd' as string]: s.delay,
                    ['--ss' as string]: String(s.scale),
                  }}
                >
                  <svg viewBox="0 0 16 16">
                    <path d="M8 0L10.2 5.8L16 8L10.2 10.2L8 16L5.8 10.2L0 8L5.8 5.8Z" />
                  </svg>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main Sculpted Obsidian + Metallic Gold Banner */}
      <div className="wso-card">
        <span className="wso-sheen" aria-hidden="true" />

        <div className="wso-top">
          {/* Sculpted Hex Shield Crest with Multiplier */}
          <div className="wso-crest">
            <svg className="wso-crest-bg" viewBox="0 0 64 68" aria-hidden="true">
              <defs>
                <linearGradient id="wsoCrestFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3c2214" />
                  <stop offset="55%" stopColor="#1c1124" />
                  <stop offset="100%" stopColor="#120b1d" />
                </linearGradient>
                <linearGradient id="wsoCrestRim" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff4b8" />
                  <stop offset="50%" stopColor="#ffb636" />
                  <stop offset="100%" stopColor="#ff6a2e" />
                </linearGradient>
              </defs>
              <path
                d="M32 3L59 15V35C59 50 47 60 32 65C17 60 5 50 5 35V15Z"
                fill="url(#wsoCrestFill)"
                stroke="url(#wsoCrestRim)"
                strokeWidth="2.6"
              />
              <path
                d="M32 8L54 18V34.5C54 46.5 44 54.8 32 59C20 54.8 10 46.5 10 34.5V18Z"
                fill="none"
                stroke="rgba(255, 240, 180, 0.28)"
                strokeWidth="1"
              />
            </svg>
            <div className="wso-crest-inner">
              <FlameIcon className="wso-flame" />
              <b className="wso-mult">×{event.streak}</b>
            </div>
          </div>

          {/* Center Title & Subtitle */}
          <div className="wso-copy">
            <span className="wso-eyebrow">{event.eyebrow}</span>
            <strong className="wso-title">{event.title}</strong>
            <small className="wso-sub">{event.subtitle}</small>
          </div>

          {/* Integrated Reward End-Cap */}
          {event.bonusGems > 0 ? (
            <div className="wso-reward" aria-label={`+${event.bonusGems} gems per win`}>
              <GemIcon className="wso-gem" />
              <div>
                <strong>+{event.bonusGems}</strong>
                <small>GEMS</small>
              </div>
            </div>
          ) : (
            <div className="wso-nextcap" aria-label={`Next bonus at ×${event.nextTargetStreak}`}>
              <small>NEXT</small>
              <strong>×{event.nextTargetStreak}</strong>
            </div>
          )}
        </div>

        {/* Continuous Milestone Progression Rail */}
        <div className="wso-rail" aria-hidden="true">
          <div className="wso-rail-track">
            <span
              className="wso-rail-fill"
              style={{
                ['--from-w' as string]: `${prevProgress.railPct}%`,
                ['--to-w' as string]: `${nextProgress.railPct}%`,
              }}
            />
          </div>
          <div className="wso-rail-nodes">
            {WIN_STREAK_MILESTONES.map((m) => {
              const reached = event.streak >= m.streak;
              const justHit =
                isMilestone &&
                ((m.streak < 5 && event.streak === m.streak) ||
                  (m.streak === 5 && event.streak === 5));
              return (
                <div
                  key={m.streak}
                  className={`wso-node${reached ? ' on' : ''}${justHit ? ' hit' : ''}`}
                >
                  <i />
                  <span>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
