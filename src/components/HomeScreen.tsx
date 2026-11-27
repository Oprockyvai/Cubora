import React, { useRef } from 'react';
import { MAX_LIVES, WORLDS } from '../data/constants';
import {
  LevelProgress,
  PageId,
  ResumeSnapshot,
  SaveState,
} from '../types/game';
import { locateLevel } from '../utils/levelLogic';
import { formatModeLabel, xpForNextLevel } from '../utils/progressionManager';
import { getDailyRewardState } from '../utils/storage';
import { HomeDustOverlay } from './HomeDustOverlay';
import {
  AvatarSvg,
  BoltIcon,
  BrandMarkSvg,
  ChartIcon,
  GearIcon,
  GemIcon,
  GiftIcon,
  HeartIcon,
  HelpIcon,
  MissionIcon,
  PlayIcon,
  RankIcon,
  StarIcon,
  ThemeIcon,
  TrophyIcon,
} from './Icons';

interface HomeScreenProps {
  visible: boolean;
  cb: SaveState;
  prog: LevelProgress;
  lives: number;
  nextLifeText?: string;
  classicBest: number;
  resumeSnapshot: ResumeSnapshot | null;
  onResumeSavedGame: () => void;
  onDiscardSavedGame: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  onOpenPowerUpWorkshop: () => void;
  onPlayCurrent: () => void;
  onOpenMap: () => void;
  onOpenTimerSelect: () => void;
  onStartClassic: () => void;
  onOpenDaily: () => void;
  onOpenPage: (page: PageId) => void;
  onInteract: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  visible,
  cb,
  prog,
  lives,
  nextLifeText = '',
  classicBest,
  resumeSnapshot,
  onResumeSavedGame,
  onDiscardSavedGame,
  onOpenProfile,
  onOpenSettings,
  onOpenTutorial,
  onOpenPowerUpWorkshop,
  onPlayCurrent,
  onOpenMap,
  onOpenTimerSelect,
  onStartClassic,
  onOpenDaily,
  onOpenPage,
  onInteract,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loc = locateLevel(prog.u);
  const world = WORLDS[loc.g % 4];
  const totalStars = Object.values(prog.s).reduce((sum, s) => sum + s, 0);
  const bestDisplay = Math.max(classicBest, cb.st.best);
  const timerBest = Math.max(
    cb.lb.t90[0]?.s || 0,
    cb.lb.t180[0]?.s || 0,
    cb.lb.t300[0]?.s || 0
  );
  const classicModeBest = Math.max(cb.lb.classic[0]?.s || 0, classicBest);
  const dailyCanClaim = getDailyRewardState(cb.daily).canClaim;
  const claimableMissions = (cb.missions?.items || []).filter(
    (m) => m.progress >= m.target && !m.claimed
  ).length;
  const xpNeeded = xpForNextLevel(cb.playerLevel || 1);
  const xpPct = Math.min(100, Math.round(((cb.xp || 0) / xpNeeded) * 100));

  const handleAction = (fn: () => void) => {
    onInteract();
    fn();
  };

  return (
    <div
      ref={containerRef}
      className={`hscr${visible ? ' on' : ''}`}
      id="modes"
    >
      <div className="hbg" />
      <HomeDustOverlay
        visible={visible}
        reducedMotion={!!cb.set.rm}
        containerRef={containerRef}
      />

      <div className="hin">
        {/* Top Bar: Profile, Gems, Daily, Tutorial, Settings */}
        <header className="htop">
          <button
            type="button"
            className="prof"
            id="hprof"
            aria-label="Edit profile"
            onClick={() => handleAction(onOpenProfile)}
          >
            <span className="av" id="hav">
              <AvatarSvg index={cb.av} />
            </span>
            <span className="pn">
              <b id="hname">{cb.name}</b>
              <small id="hlvl">
                Lv.{cb.playerLevel || 1} · Stage {prog.u}
              </small>
              <span className="xp-mini-track" aria-hidden="true">
                <i style={{ width: `${xpPct}%` }} />
              </span>
            </span>
          </button>

          <div className="hrg">
            <div className="gem" id="hgems" title="Gem balance">
              <GemIcon />
              <b>{cb.gems.toLocaleString('en-US')}</b>
            </div>
            <button
              type="button"
              className="ib"
              id="navDaily"
              aria-label="Daily reward"
              title="Daily login reward"
              onClick={() => handleAction(onOpenDaily)}
            >
              <GiftIcon />
              {dailyCanClaim && <i className="dot" id="hdot" />}
            </button>
            <button
              type="button"
              className="ib"
              id="htut"
              aria-label="How to play"
              title="How to play"
              onClick={() => handleAction(onOpenTutorial)}
            >
              <HelpIcon />
            </button>
            <button
              type="button"
              className="ib"
              id="hset"
              aria-label="Settings"
              title="Settings"
              onClick={() => handleAction(onOpenSettings)}
            >
              <GearIcon />
            </button>
          </div>
        </header>

        {/* Main Responsive Content Grid */}
        <div className="hgrid">
          {/* Left Column (Desktop) / Top Focal Stack (Mobile) */}
          <div className="hcol-primary">
            <div className="logo2">
              <BrandMarkSvg />
              <div className="wm">
                BLOCK CLASH<small>TACTILE BLOCK PUZZLE</small>
              </div>
            </div>

            <div className="hero">
              <div
                className="hi"
                id="hhi"
                style={{
                  backgroundImage: `url('./img/block_clash_hero.jpg'), url(${world.img})`,
                }}
              />
              <div className="hero-world-chip">
                <span className="hw-dot" style={{ background: world.acc }} />
                World {loc.g + 1} {'\u00b7'} {world.name}
              </div>
              <div className="ho">
                <small id="hw">Current Adventure</small>
                <b id="hl">Level {prog.u}</b>
                <div className="hst">
                  <StarIcon />
                  <span id="hstars">
                    {totalStars.toLocaleString('en-US')} stars collected
                  </span>
                </div>
                <button
                  type="button"
                  className="play"
                  id="hplay"
                  onClick={() => handleAction(onPlayCurrent)}
                >
                  <PlayIcon />
                  PLAY LEVEL {prog.u}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (Desktop) / Lower Action Zone (Mobile) */}
          <div className="hcol-secondary">
            {resumeSnapshot && (
              <div className="resume-bar" id="resumeBar">
                <div className="rb-info">
                  <strong>
                    Resume {formatModeLabel(resumeSnapshot.mode, resumeSnapshot.lv?.n, resumeSnapshot.timerDur)}
                  </strong>
                  <small>
                    {resumeSnapshot.score.toLocaleString('en-US')} pts ·{' '}
                    {resumeSnapshot.linesClearedInRun} lines
                  </small>
                </div>
                <div className="rb-actions">
                  <button
                    type="button"
                    className="rb-btn"
                    id="resumeSavedBtn"
                    onClick={() => handleAction(onResumeSavedGame)}
                  >
                    <PlayIcon />
                    Resume
                  </button>
                  <button
                    type="button"
                    className="rb-discard"
                    aria-label="Discard saved game"
                    title="Discard saved match"
                    onClick={() => handleAction(onDiscardSavedGame)}
                  >
                    {'\u00d7'}
                  </button>
                </div>
              </div>
            )}

            <div className="hsec-label">Game Modes</div>
            <div className="hmodes">
              <button
                type="button"
                className="mode"
                id="modeLevels"
                style={{ ['--mc' as string]: 'var(--gold)' }}
                onClick={() => handleAction(onOpenMap)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 21V4M6 5h11l-2.5 4 2.5 4H6" />
                </svg>
                <div>
                  <strong>Levels</strong>
                  <span id="mlvl">World {loc.g + 1} · Lv {prog.u}</span>
                </div>
              </button>

              <button
                type="button"
                className="mode"
                id="modeTimer"
                style={{ ['--mc' as string]: 'var(--c1)' }}
                onClick={() => handleAction(onOpenTimerSelect)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l3 2M9 2h6" />
                </svg>
                <div>
                  <strong>Timer</strong>
                  <span>
                    {timerBest > 0
                      ? `Best ${timerBest.toLocaleString('en-US')}`
                      : '90s · 3m · 5m'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="mode"
                id="modeClassic"
                style={{ ['--mc' as string]: 'var(--c5)' }}
                onClick={() => handleAction(onStartClassic)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12c-2-3-4-5-6-5a5 5 0 000 10c2 0 4-2 6-5zm0 0c2 3 4 5 6 5a5 5 0 000-10c-2 0-4 2-6 5z" />
                </svg>
                <div>
                  <strong>Classic</strong>
                  <span>
                    {classicModeBest > 0
                      ? `Best ${classicModeBest.toLocaleString('en-US')}`
                      : 'Endless 8x8'}
                  </span>
                </div>
              </button>
            </div>

            <div className="hbest">
              <div className="hbest-item">
                <span>All-Time Best</span>
                <b id="hbest">{bestDisplay.toLocaleString('en-US')}</b>
              </div>
              <div className="hbest-divider" />
              <div className="hbest-item" id="hlives">
                <HeartIcon on={lives > 0} />
                <span>
                  <b>{lives}</b>/{MAX_LIVES} lives
                  {lives < MAX_LIVES && nextLifeText ? ` · +1 in ${nextLifeText}` : ''}
                </span>
              </div>
            </div>

            <nav className="hnav" aria-label="Game features">
              <button
                type="button"
                className="nv"
                id="navMissions"
                onClick={() => handleAction(() => onOpenPage('pgMis'))}
              >
                <MissionIcon />
                <span>Missions</span>
                {claimableMissions > 0 && <i className="dot" />}
              </button>
              <button
                type="button"
                className="nv"
                id="navPowerUps"
                onClick={() => handleAction(onOpenPowerUpWorkshop)}
              >
                <BoltIcon />
                <span>Tools</span>
              </button>
              <button
                type="button"
                className="nv"
                id="navAwards"
                onClick={() => handleAction(() => onOpenPage('pgAch'))}
              >
                <TrophyIcon />
                <span>Awards</span>
              </button>
              <button
                type="button"
                className="nv"
                id="navThemes"
                onClick={() => handleAction(() => onOpenPage('pgThm'))}
              >
                <ThemeIcon />
                <span>Collection</span>
              </button>
              <button
                type="button"
                className="nv"
                id="navStats"
                onClick={() => handleAction(() => onOpenPage('pgStat'))}
              >
                <ChartIcon />
                <span>Stats</span>
              </button>
              <button
                type="button"
                className="nv"
                id="navRanks"
                onClick={() => handleAction(() => onOpenPage('pgLb'))}
              >
                <RankIcon />
                <span>Ranks</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

