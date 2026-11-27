import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { THEMED_MAPS } from '../data/maps';
import {
  BiomePalette,
  LevelProgress,
  MapRoadStyle,
  ThemedMapId,
} from '../types/game';
import {
  capacityOfSections,
  getInitialMapSections,
} from '../utils/levelLogic';
import {
  BridgeSegment,
  buildBridgeSegment,
  buildCatmullRomPath,
  buildUnlockEdgePath,
  computeRealmStarStats,
  CubicCurve2D,
  findStreamCrossings,
  Point2D,
  projectMapPoints,
  RealmStarStats,
  RoadStation,
  sampleCubicBridgeStations,
  sampleSplineStations,
} from '../utils/mapGeometry';
import {
  loadLastRevealedLevel,
  saveLastRevealedLevel,
} from '../utils/storage';
import {
  getWinStreakHudProgress,
  getWinStreakInfo,
  WIN_STREAK_MILESTONES,
} from '../utils/streakLogic';
import {
  BackIcon,
  CheckIcon,
  FlameIcon,
  GemIcon,
  HeartIcon,
  LockIcon,
  MapGemSvg,
  StarIcon,
} from './Icons';
import {
  ProceduralBridgeSpec,
  ProceduralWorldCanvas,
} from './ProceduralWorldCanvas';

interface LevelMapProps {
  visible: boolean;
  prog: LevelProgress;
  lives: number;
  winStreak: number;
  bestWinStreak: number;
  onBack: () => void;
  onSelectLevel: (n: number) => void;
  onInteract: () => void;
}

interface RenderedSection {
  key: string;
  worldIdx: number;
  id: ThemedMapId;
  name: string;
  subtitle: string;
  acc: string;
  roadStyle: MapRoadStyle;
  biome: BiomePalette;
  sectionTop: number;
  startLv: number;
  endLv: number;
  pts: Point2D[];
  stations: RoadStation[];
  crossings: RoadStation[];
  stats: RealmStarStats;
  fullPath: string;
  settledPath: string;
}

interface RenderedBridge extends ProceduralBridgeSpec {
  fromStyle: MapRoadStyle;
  toStyle: MapRoadStyle;
  settled: boolean;
  startLv: number;
  toStars: { earned: number; max: number };
  planks: RoadStation[];
}

export const LevelMap: React.FC<LevelMapProps> = ({
  visible,
  prog,
  lives,
  winStreak,
  bestWinStreak,
  onBack,
  onSelectLevel,
  onInteract,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const mapInRef = useRef<HTMLDivElement | null>(null);
  const revealGlowRef = useRef<SVGPathElement | null>(null);
  const revealCoreRef = useRef<SVGPathElement | null>(null);
  const revealSparkRef = useRef<SVGGElement | null>(null);

  const [lockedNotice, setLockedNotice] = useState<{
    key: number;
    text: string;
  } | null>(null);
  const [showJumpBtn, setShowJumpBtn] = useState<boolean>(false);

  const lastRevealedRef = useRef<number>(loadLastRevealedLevel(prog.u));
  const [revealRange, setRevealRange] = useState<{ from: number; to: number } | null>(null);
  const [revealState, setRevealState] = useState<'idle' | 'animating' | 'done'>('idle');
  const [unlockPopLevel, setUnlockPopLevel] = useState<number | null>(null);

  const [sections, setSections] = useState<number>(() =>
    getInitialMapSections(prog.u)
  );
  const [containerWidth, setContainerWidth] = useState<number>(390);
  const prevScrollAdjustRef = useRef<{ oldH: number; oldTop: number } | null>(
    null
  );
  const lockedTimerRef = useRef<number | null>(null);
  const popTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (prog.u < lastRevealedRef.current) {
      lastRevealedRef.current = prog.u;
      saveLastRevealedLevel(prog.u);
      setRevealRange(null);
      setRevealState('idle');
    }
  }, [prog.u]);

  useEffect(() => {
    if (visible) {
      const needed = getInitialMapSections(prog.u);
      setSections((prev) => Math.max(prev, needed));
    } else {
      setLockedNotice(null);
    }
  }, [visible, prog.u]);

  useEffect(() => {
    return () => {
      if (lockedTimerRef.current !== null) window.clearTimeout(lockedTimerRef.current);
      if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const el = mapInRef.current || scrollRef.current;
    if (!el || !visible) return;
    const measure = () => {
      const target = mapInRef.current || scrollRef.current;
      if (target) {
        setContainerWidth(Math.min(target.clientWidth || 390, 560));
      }
    };
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [visible]);

  const scrollToCurrentOrBottom = (behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current;
    if (!el) return;
    const cur = el.querySelector('.mk.cur') as HTMLElement | null;
    if (cur) {
      const top = Math.max(0, cur.offsetTop - el.clientHeight / 2);
      el.scrollTo({ top, behavior });
    } else {
      const top = Math.max(0, el.scrollHeight - el.clientHeight);
      el.scrollTo({ top, behavior });
    }
  };

  useEffect(() => {
    if (!visible) return;
    if (prog.u > lastRevealedRef.current) return;
    requestAnimationFrame(() => {
      scrollToCurrentOrBottom('auto');
      updateJumpVisibility();
    });
  }, [visible, prog.u]);

  useEffect(() => {
    if (!visible || revealRange) return;
    const rafId = requestAnimationFrame(() => updateJumpVisibility());
    return () => cancelAnimationFrame(rafId);
  }, [visible, revealRange, prog.u]);

  // Trigger Path Reveal when returning to visible LevelMap with newly unlocked progress
  useEffect(() => {
    if (!visible) return;
    if (prog.u > lastRevealedRef.current && !revealRange) {
      const targetLevel = prog.u;
      const fromLevel = Math.max(1, targetLevel - 1);
      const reducedMotion = document.documentElement.classList.contains('rm');

      if (reducedMotion) {
        lastRevealedRef.current = targetLevel;
        saveLastRevealedLevel(targetLevel);
        setRevealRange(null);
        setRevealState('done');
        requestAnimationFrame(() => updateJumpVisibility());
        return;
      }

      setRevealRange({ from: fromLevel, to: targetLevel });
      setRevealState('animating');
    }
  }, [visible, prog.u, revealRange]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const adj = prevScrollAdjustRef.current;
    if (el && adj) {
      el.scrollTop = adj.oldTop + (el.scrollHeight - adj.oldH);
      prevScrollAdjustRef.current = null;
    }
  }, [sections]);

  const updateJumpVisibility = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cur = el.querySelector('.mk.cur') as HTMLElement | null;
    if (!cur) {
      setShowJumpBtn(true);
      return;
    }
    const viewTop = el.scrollTop;
    const viewBot = viewTop + el.clientHeight;
    const curY = cur.offsetTop;
    setShowJumpBtn(curY < viewTop + 60 || curY > viewBot - 60);
  };

  const handleScroll = () => {
    updateJumpVisibility();
    if (revealRange) return;
    const el = scrollRef.current;
    if (!el || prevScrollAdjustRef.current) return;
    if (el.scrollTop < 350) {
      prevScrollAdjustRef.current = {
        oldH: el.scrollHeight,
        oldTop: el.scrollTop,
      };
      setSections((s) => s + 1);
    }
  };

  const W2 = containerWidth;
  const IW = W2 * 1.12;
  const Hs = Math.round(IW * 1.48);
  const bottomPad = 124;
  const topPad = 48;
  const Ht = sections * Hs + bottomPad + topPad;
  const ns = Math.round(W2 * 0.104);
  const totalStars = Object.values(prog.s).reduce((sum, s) => sum + s, 0);

  // During an active Path Reveal animation, settled progress stops at `revealRange.from`
  // so the edge `(from -> to)` is revealed dynamically instead of drawn statically.
  const settledLimit = revealRange ? revealRange.from : prog.u;

  const renderedSections: RenderedSection[] = useMemo(() => {
    const list: RenderedSection[] = [];
    let lvCursor = 1;
    for (let g = 0; g < sections; g++) {
      const m = THEMED_MAPS[g % THEMED_MAPS.length];
      const count = m.pts.length;
      const startLv = lvCursor;
      const endLv = lvCursor + count - 1;
      const sectionTop = Ht - bottomPad - (g + 1) * Hs;
      const pts = projectMapPoints(m.pts, W2, IW, Hs, sectionTop, lvCursor);
      const settledPts = pts.filter((pt) => pt.n <= settledLimit);
      const stations = sampleSplineStations(pts, 14);

      let streamCurves: CubicCurve2D[] = [];
      if (m.id === 'crystal-valley') {
        streamCurves = [
          {
            p0x: -20,
            p0y: sectionTop + Hs * 0.31,
            c1x: W2 * 0.32,
            c1y: sectionTop + Hs * 0.27,
            c2x: W2 * 0.68,
            c2y: sectionTop + Hs * 0.42,
            p3x: W2 + 20,
            p3y: sectionTop + Hs * 0.37,
          },
          {
            p0x: W2 + 20,
            p0y: sectionTop + Hs * 0.77,
            c1x: W2 * 0.64,
            c1y: sectionTop + Hs * 0.71,
            c2x: W2 * 0.34,
            c2y: sectionTop + Hs * 0.86,
            p3x: -20,
            p3y: sectionTop + Hs * 0.81,
          },
        ];
      } else if (m.id === 'volcano') {
        streamCurves = [
          {
            p0x: -20,
            p0y: sectionTop + Hs * 0.28,
            c1x: W2 * 0.32,
            c1y: sectionTop + Hs * 0.22,
            c2x: W2 * 0.64,
            c2y: sectionTop + Hs * 0.36,
            p3x: W2 + 20,
            p3y: sectionTop + Hs * 0.31,
          },
          {
            p0x: W2 + 20,
            p0y: sectionTop + Hs * 0.785,
            c1x: W2 * 0.65,
            c1y: sectionTop + Hs * 0.755,
            c2x: W2 * 0.35,
            c2y: sectionTop + Hs * 0.840,
            p3x: -20,
            p3y: sectionTop + Hs * 0.805,
          },
        ];
      }

      list.push({
        key: `${m.id}-${g}`,
        worldIdx: g,
        id: m.id,
        name: m.name,
        subtitle: m.subtitle,
        acc: m.acc,
        roadStyle: m.roadStyle,
        biome: m.biome,
        sectionTop,
        startLv,
        endLv,
        pts,
        stations,
        crossings: findStreamCrossings(stations, streamCurves, 20),
        stats: computeRealmStarStats(prog.s, startLv, endLv),
        fullPath: buildCatmullRomPath(pts),
        settledPath:
          settledPts.length > 1 ? buildCatmullRomPath(settledPts) : '',
      });
      lvCursor += count;
    }
    return list;
  }, [sections, W2, IW, Hs, Ht, bottomPad, settledLimit, prog.s]);

  const bridges: RenderedBridge[] = useMemo(() => {
    if (renderedSections.length < 2) return [];
    const out: RenderedBridge[] = [];
    for (let i = 0; i < renderedSections.length - 1; i++) {
      const lower = renderedSections[i];
      const upper = renderedSections[i + 1];
      const exitPt = lower.pts[lower.pts.length - 1];
      const entryPt = upper.pts[0];
      if (!exitPt || !entryPt) continue;
      const bridge: BridgeSegment = buildBridgeSegment(exitPt, entryPt);
      out.push({
        key: `${lower.key}->${upper.key}`,
        fromAcc: lower.acc,
        toAcc: upper.acc,
        fromName: lower.name,
        toName: upper.name,
        fromStyle: lower.roadStyle,
        toStyle: upper.roadStyle,
        settled: settledLimit >= upper.startLv,
        startLv: upper.startLv,
        toStars: {
          earned: upper.stats.earnedStars,
          max: upper.stats.maxStars,
        },
        planks: sampleCubicBridgeStations(bridge, 11),
        bridge,
      });
    }
    return out;
  }, [renderedSections, settledLimit]);

  const revealEdge = useMemo(() => {
    if (!revealRange) return null;
    return buildUnlockEdgePath(
      renderedSections,
      bridges,
      revealRange.from,
      revealRange.to
    );
  }, [revealRange, renderedSections, bridges]);

  const revealEdgeRef = useRef(revealEdge);
  revealEdgeRef.current = revealEdge;
  const revealFrom = revealRange?.from ?? 0;
  const revealTo = revealRange?.to ?? 0;
  const revealPathStr = revealEdge?.path ?? '';

  // Animate the newly unlocked path segment smoothly with RAF + leading energy orb
  useEffect(() => {
    const edge = revealEdgeRef.current;
    if (!visible || !revealFrom || !revealTo || !revealPathStr || !edge) return;

    const glowEl = revealGlowRef.current;
    const coreEl = revealCoreRef.current;
    const sparkEl = revealSparkRef.current;
    if (!glowEl || !coreEl) return;

    const totalLen = Math.max(1, coreEl.getTotalLength());
    glowEl.style.strokeDasharray = `${totalLen}`;
    glowEl.style.strokeDashoffset = `${totalLen}`;
    coreEl.style.strokeDasharray = `${totalLen}`;
    coreEl.style.strokeDashoffset = `${totalLen}`;

    const el = scrollRef.current;
    if (el) {
      const midY = (edge.fromPt.y + edge.toPt.y) / 2;
      const targetTop = Math.max(0, midY - el.clientHeight * 0.5);
      el.scrollTo({
        top: targetTop,
        behavior: 'auto',
      });
      updateJumpVisibility();
    }

    let rafId = 0;
    const startDelayMs = 140;
    const durationMs = 880;
    const startTime = performance.now() + startDelayMs;

    const step = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < 0) {
        if (sparkEl) {
          sparkEl.setAttribute(
            'transform',
            `translate(${edge.fromPt.x.toFixed(1)}, ${edge.fromPt.y.toFixed(1)}) scale(0.8)`
          );
          sparkEl.setAttribute('opacity', '0.85');
        }
        rafId = requestAnimationFrame(step);
        return;
      }

      const raw = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - raw, 3);
      const offset = totalLen * (1 - eased);

      glowEl.style.strokeDashoffset = `${offset}`;
      coreEl.style.strokeDashoffset = `${offset}`;

      if (sparkEl) {
        const pt = coreEl.getPointAtLength(eased * totalLen);
        const pulse = 1 + Math.sin(raw * Math.PI) * 0.35;
        sparkEl.setAttribute(
          'transform',
          `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) scale(${pulse.toFixed(2)})`
        );
        sparkEl.setAttribute('opacity', '1');
      }

      if (raw < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        lastRevealedRef.current = revealTo;
        saveLastRevealedLevel(revealTo);
        setUnlockPopLevel(revealTo);
        setRevealRange(null);
        setRevealState('done');
        requestAnimationFrame(() => updateJumpVisibility());
        if (popTimerRef.current !== null) {
          window.clearTimeout(popTimerRef.current);
        }
        popTimerRef.current = window.setTimeout(() => {
          setUnlockPopLevel(null);
        }, 900);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [visible, revealFrom, revealTo, revealPathStr]);

  const totalLevels = capacityOfSections(sections);

  const handleNodeClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    n: number
  ) => {
    onInteract();
    if (n > prog.u) {
      e.currentTarget.animate(
        [
          { transform: 'translate(-50%,-50%) rotate(-8deg)' },
          { transform: 'translate(-50%,-50%) rotate(8deg)' },
          { transform: 'translate(-50%,-50%)' },
        ],
        { duration: 260 }
      );
      if (lockedTimerRef.current !== null) {
        window.clearTimeout(lockedTimerRef.current);
      }
      setLockedNotice({
        key: Date.now(),
        text: `Clear Level ${n - 1} to unlock`,
      });
      lockedTimerRef.current = window.setTimeout(() => {
        setLockedNotice(null);
      }, 2400);
      return;
    }
    onSelectLevel(n);
  };

  const handleJumpToCurrent = () => {
    onInteract();
    scrollToCurrentOrBottom('smooth');
  };

  const streakInfo = getWinStreakInfo(winStreak);
  const streakProgress = getWinStreakHudProgress(winStreak);

  return (
    <div
      className={`map${visible ? ' on' : ''}`}
      id="map"
      data-reveal-state={revealState}
      data-reveal-edge={revealRange ? `${revealRange.from}-${revealRange.to}` : ''}
    >
      <div className="mh">
        <button
          type="button"
          className="ib"
          id="mback"
          aria-label="Back to Home"
          onClick={() => {
            onInteract();
            onBack();
          }}
        >
          <BackIcon />
        </button>
        <h3>Level Map</h3>
        <div className="mh-stats">
          <div
            className={`mstreak${winStreak >= 2 ? ' hot' : ''}`}
            id="mstreak"
            title={`Win streak (${streakInfo.label}) · Best ×${bestWinStreak}`}
          >
            <FlameIcon />
            <span>×{winStreak}</span>
          </div>
          <div className="mstars" title="Total stars earned">
            <StarIcon />
            <span>{totalStars}</span>
          </div>
          <div className="mlv" id="mlv" title="Lives">
            <HeartIcon on={true} />
            <span>{lives}</span>
          </div>
        </div>
      </div>

      {/* Continuous Milestone Track Win-Streak Banner */}
      <div
        className={`map-streak-bar tier-${streakInfo.tier}`}
        data-testid="map-streak-bar"
      >
        <div className="msb-left">
          <span className="msb-crest" aria-hidden="true">
            <FlameIcon className="msb-flame" />
          </span>
          <div className="msb-copy">
            <strong>
              {winStreak > 0 ? `×${winStreak} ${streakInfo.label}` : 'Win Streak'}
            </strong>
            <small>
              {streakInfo.nextTargetStreak
                ? `${streakInfo.gemsNeeded} win${streakInfo.gemsNeeded > 1 ? 's' : ''} to +${streakInfo.nextBonusGems}`
                : `+${streakInfo.bonusGems} bonus`}
              <GemIcon className="msb-sg" />
            </small>
          </div>
        </div>

        <div className="msb-rail" aria-label="Streak bonus milestones">
          <div className="msb-track">
            <i style={{ width: `${streakProgress.railPct}%` }} />
          </div>
          <div className="msb-nodes">
            {WIN_STREAK_MILESTONES.map((m) => {
              const reached = winStreak >= m.streak;
              const current =
                (m.streak < 5 && winStreak === m.streak) ||
                (m.streak === 5 && winStreak >= 5);
              return (
                <div
                  key={m.streak}
                  className={`msb-node${reached ? ' on' : ''}${current ? ' cur' : ''}`}
                >
                  <span className="msb-dot" />
                  <small>{m.label}</small>
                  <b>
                    +{m.bonusGems}
                    <GemIcon />
                  </b>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="msc" id="msc" ref={scrollRef} onScroll={handleScroll}>
        <div
          ref={mapInRef}
          className="mapin map-stage"
          id="mapin"
          style={{ height: `${Ht}px`, ['--ns' as string]: `${ns}px` }}
        >
          {/* Candy-Crush-inspired full-bleed procedural storybook world */}
          <ProceduralWorldCanvas
            width={W2}
            height={Ht}
            sections={renderedSections.map((sec) => ({
              key: sec.key,
              id: sec.id,
              worldIdx: sec.worldIdx,
              sectionTop: sec.sectionTop,
              height: Hs,
              acc: sec.acc,
              biome: sec.biome,
            }))}
            bridges={bridges}
          />

          {/* Starting realm title crest at base */}
          {renderedSections.length > 0 && (
            <div
              className="wbn"
              style={{
                top: `${Ht - 86}px`,
                ['--acc' as string]: renderedSections[0].acc,
              }}
            >
              <small>
                {renderedSections[0].subtitle.toUpperCase()} · LV{' '}
                {renderedSections[0].startLv}–{renderedSections[0].endLv}
              </small>
              <strong>{renderedSections[0].name}</strong>
              <span className="wbn-stars">
                <StarIcon />
                <span>
                  {renderedSections[0].stats.earnedStars}/
                  {renderedSections[0].stats.maxStars}
                </span>
              </span>
            </div>
          )}

          {/* Sculpted storybook cobblestone road, golden lit trail & animated Path Reveal */}
          <svg
            className="mpath"
            width={W2}
            height={Ht}
            viewBox={`0 0 ${W2} ${Ht}`}
            aria-hidden="true"
          >
            <defs>
              {renderedSections.map((sec) => (
                <linearGradient
                  key={`grad-${sec.key}`}
                  id={`deck-${sec.key}`}
                  x1="0%"
                  y1="100%"
                  x2="0%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={sec.roadStyle.deckBottom} />
                  <stop offset="50%" stopColor={sec.roadStyle.roadColor} />
                  <stop offset="100%" stopColor={sec.roadStyle.deckTop} />
                </linearGradient>
              ))}
              {bridges.map((b) => (
                <React.Fragment key={`bgrad-${b.key}`}>
                  <linearGradient
                    id={`bcurb-${b.key}`}
                    gradientUnits="userSpaceOnUse"
                    x1={b.bridge.from.x}
                    y1={b.bridge.from.y}
                    x2={b.bridge.to.x}
                    y2={b.bridge.to.y}
                  >
                    <stop offset="0%" stopColor={b.fromStyle.curbColor} />
                    <stop offset="100%" stopColor={b.toStyle.curbColor} />
                  </linearGradient>
                  <linearGradient
                    id={`bdeck-${b.key}`}
                    gradientUnits="userSpaceOnUse"
                    x1={b.bridge.from.x}
                    y1={b.bridge.from.y}
                    x2={b.bridge.to.x}
                    y2={b.bridge.to.y}
                  >
                    <stop offset="0%" stopColor={b.fromStyle.deckTop} />
                    <stop offset="100%" stopColor={b.toStyle.deckBottom} />
                  </linearGradient>
                </React.Fragment>
              ))}
              <linearGradient id="goldenTrail" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff9a1a" />
                <stop offset="50%" stopColor="#ffd43b" />
                <stop offset="100%" stopColor="#fff39e" />
              </linearGradient>
            </defs>

            {/* Inter-realm arched stone & timber bridges with keystone abutments, planks & rail posts */}
            {bridges.map((b) => (
              <g key={`bridge-${b.key}`}>
                <path
                  d={b.bridge.path}
                  transform="translate(0, 8)"
                  fill="none"
                  stroke="rgba(4, 10, 24, 0.56)"
                  strokeWidth={42}
                  strokeLinecap="round"
                />
                <path
                  d={b.bridge.path}
                  fill="none"
                  stroke={`url(#bcurb-${b.key})`}
                  strokeWidth={35}
                  strokeLinecap="round"
                />
                <path
                  d={b.bridge.path}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.48)"
                  strokeWidth={29}
                  strokeLinecap="round"
                />
                <path
                  d={b.bridge.path}
                  fill="none"
                  stroke={`url(#bdeck-${b.key})`}
                  strokeWidth={24}
                  strokeLinecap="round"
                />
                {/* Carved stone keystone abutments anchoring both ends of bridge */}
                {[b.bridge.from, b.bridge.to].map((endPt, idx) => (
                  <g
                    key={`abt-${b.key}-${idx}`}
                    transform={`translate(${endPt.x.toFixed(1)}, ${endPt.y.toFixed(1)})`}
                  >
                    <circle cx={-17} cy={0} r={5.8} fill="#6b4e31" stroke="#ffe7a6" strokeWidth={1.2} />
                    <circle cx={-17} cy={-1} r={2.2} fill="#ffe9ad" fillOpacity={0.55} />
                    <circle cx={17} cy={0} r={5.8} fill="#6b4e31" stroke="#ffe7a6" strokeWidth={1.2} />
                    <circle cx={17} cy={-1} r={2.2} fill="#ffe9ad" fillOpacity={0.55} />
                  </g>
                ))}
                {/* Individual curved bridge planks & golden handrail posts */}
                {b.planks.map((p) => (
                  <g
                    key={`pl-${b.key}-${p.idx}`}
                    transform={`translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)}) rotate(${p.angleDeg.toFixed(1)})`}
                  >
                    <rect
                      x={-4}
                      y={-11}
                      width={8}
                      height={22}
                      rx={2.2}
                      fill={p.idx % 2 === 0 ? 'rgba(255,255,255,0.26)' : 'rgba(62,38,14,0.22)'}
                      stroke="rgba(78, 48, 18, 0.4)"
                      strokeWidth={0.85}
                    />
                    {p.idx % 3 === 0 && (
                      <>
                        <circle cx={0} cy={-15.5} r={2.8} fill="#ffd96b" stroke="#6c4514" strokeWidth={0.9} />
                        <circle cx={0} cy={15.5} r={2.8} fill="#ffd96b" stroke="#6c4514" strokeWidth={0.9} />
                      </>
                    )}
                  </g>
                ))}
                {b.settled && (
                  <>
                    <path
                      d={b.bridge.path}
                      fill="none"
                      stroke="#ffad26"
                      strokeOpacity={0.38}
                      strokeWidth={18}
                      strokeLinecap="round"
                    />
                    <path
                      d={b.bridge.path}
                      fill="none"
                      stroke="url(#goldenTrail)"
                      strokeWidth={7.5}
                      strokeLinecap="round"
                    />
                    <path
                      className="mpath-flow"
                      d={b.bridge.path}
                      fill="none"
                      stroke="#ffffff"
                      strokeOpacity={0.82}
                      strokeWidth={2.5}
                      strokeDasharray="6 18"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </g>
            ))}

            {/* Per-realm realistic paved cobblestone roads & roadside trail lanterns */}
            {renderedSections.map((sec) => {
              const rs = sec.roadStyle;
              const isVolcano = sec.id === 'volcano';
              const isCloud = sec.id === 'cloud-city';
              const isAbyss = sec.id === 'abyss';
              return (
                <g key={sec.key}>
                  {/* 0. Soft recessed earth shoulder embedding road into terrain */}
                  <path
                    d={sec.fullPath}
                    fill="none"
                    stroke={rs.shadowColor}
                    strokeOpacity={0.58}
                    strokeWidth={47}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 1. Soft terrain ground shadow */}
                  <path
                    d={sec.fullPath}
                    transform="translate(0, 7.5)"
                    fill="none"
                    stroke={rs.shadowColor}
                    strokeWidth={42}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 1b. Extruded 3D masonry causeway depth lip */}
                  <path
                    d={sec.fullPath}
                    transform="translate(0, 4.5)"
                    fill="none"
                    stroke="rgba(8, 10, 18, 0.74)"
                    strokeWidth={36}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 2. Carved retaining outer stone curb */}
                  <path
                    d={sec.fullPath}
                    fill="none"
                    stroke={rs.curbColor}
                    strokeWidth={35}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 2b. Subtle masonry curb block seams */}
                  <path
                    d={sec.fullPath}
                    fill="none"
                    stroke="rgba(16, 12, 20, 0.25)"
                    strokeWidth={34}
                    strokeDasharray="2 16"
                    strokeLinecap="butt"
                  />
                  {/* 3. Sunlit beveled curb rim */}
                  <path
                    d={sec.fullPath}
                    fill="none"
                    stroke={rs.curbHighlight}
                    strokeWidth={28.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 4. Wide mortar & stone road bed */}
                  <path
                    d={sec.fullPath}
                    fill="none"
                    stroke={`url(#deck-${sec.key})`}
                    strokeWidth={23.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 5. Volcano glowing magma mortar seams beneath flagstones */}
                  {isVolcano && (
                    <path
                      className="world-pulse-soft"
                      d={sec.fullPath}
                      fill="none"
                      stroke="#ff7a26"
                      strokeOpacity={0.4}
                      strokeWidth={16.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {/* 6. Staggered dual-course interlocking flagstone cobbles + biome details */}
                  {sec.stations.map((st) => {
                    const even = st.idx % 2 === 0;
                    const pebbleSide = st.idx % 5 === 0 ? 1 : st.idx % 7 === 0 ? -1 : 0;
                    const stoneA = even
                      ? { y: -8.6, w: 9.6, h: 7.4 }
                      : { y: -9.2, w: 8.2, h: 8.4 };
                    const stoneB = even
                      ? { y: 0.4, w: 8.6, h: 8.4 }
                      : { y: 0.8, w: 9.8, h: 7.4 };

                    return (
                      <g
                        key={`st-${sec.key}-${st.idx}`}
                        transform={`translate(${st.x.toFixed(1)}, ${st.y.toFixed(1)}) rotate(${st.angleDeg.toFixed(1)})`}
                      >
                        {pebbleSide !== 0 && (
                          <ellipse
                            cx={0}
                            cy={pebbleSide * 20.5}
                            rx={3.5}
                            ry={2.1}
                            fill={rs.curbColor}
                            opacity={0.78}
                          />
                        )}
                        {/* Upper course ashlar flagstone */}
                        <rect
                          x={-stoneA.w / 2}
                          y={stoneA.y}
                          width={stoneA.w}
                          height={stoneA.h}
                          rx={2.6}
                          fill={even ? rs.deckTop : rs.roadColor}
                          fillOpacity={isVolcano ? 0.88 : 0.78}
                          stroke={rs.inlayColor}
                          strokeWidth={0.9}
                        />
                        {/* Lower course staggered flagstone */}
                        <rect
                          x={-stoneB.w / 2 + (even ? 1.2 : -1.2)}
                          y={stoneB.y}
                          width={stoneB.w}
                          height={stoneB.h}
                          rx={2.6}
                          fill={even ? rs.roadColor : rs.deckTop}
                          fillOpacity={isVolcano ? 0.84 : 0.74}
                          stroke={rs.inlayColor}
                          strokeWidth={0.9}
                        />
                        {/* Sunlit top edge bevel */}
                        <line
                          x1={-stoneA.w / 2 + 1.4}
                          y1={stoneA.y + 1.2}
                          x2={stoneA.w / 2 - 1.4}
                          y2={stoneA.y + 1.2}
                          stroke={rs.roadHighlight}
                          strokeOpacity={0.62}
                          strokeWidth={1}
                          strokeLinecap="round"
                        />
                        {/* Biome subtle inlay accents */}
                        {isCloud && st.idx % 3 === 0 && (
                          <circle cx={0} cy={0} r={1.25} fill="#ffd970" fillOpacity={0.7} />
                        )}
                        {isAbyss && st.idx % 4 === 0 && (
                          <circle cx={0} cy={0} r={1.25} fill="#7af8ff" fillOpacity={0.62} />
                        )}
                        {!isVolcano && !isCloud && !isAbyss && st.idx % 6 === 0 && (
                          <circle cx={2.2} cy={-7.8} r={1.2} fill="#39c98a" fillOpacity={0.55} />
                        )}
                      </g>
                    );
                  })}

                  {/* 6b. Arched timber/basalt ford bridges wherever road crosses an internal river or lava stream */}
                  {sec.crossings.map((cr) => {
                    const plankFill = isVolcano ? '#441f22' : '#9c6838';
                    const plankAlt = isVolcano ? '#311417' : '#85562c';
                    const railFill = isVolcano ? '#6b3234' : '#c9935b';
                    const postFill = isVolcano ? '#ff9638' : '#ffe082';
                    return (
                      <g
                        key={`ford-${sec.key}-${cr.idx}`}
                        transform={`translate(${cr.x.toFixed(1)}, ${cr.y.toFixed(1)}) rotate(${cr.angleDeg.toFixed(1)})`}
                      >
                        <rect
                          x={-26}
                          y={-18}
                          width={52}
                          height={40}
                          rx={6}
                          fill="rgba(4, 10, 18, 0.42)"
                        />
                        <rect
                          x={-25}
                          y={-18}
                          width={50}
                          height={36}
                          rx={5}
                          fill={plankAlt}
                          stroke={isVolcano ? '#7a3430' : '#4a2b12'}
                          strokeWidth={1.4}
                        />
                        {[-18, -10.5, -3, 4.5, 12, 19.5].map((px, pi) => (
                          <rect
                            key={`fp-${pi}`}
                            x={px}
                            y={-14}
                            width={5.6}
                            height={28}
                            rx={1.4}
                            fill={pi % 2 === 0 ? plankFill : plankAlt}
                            stroke="rgba(255,255,255,0.16)"
                            strokeWidth={0.7}
                          />
                        ))}
                        <rect x={-26} y={-20} width={52} height={4.6} rx={2} fill={railFill} />
                        <rect x={-26} y={15.4} width={52} height={4.6} rx={2} fill={railFill} />
                        <circle cx={-23} cy={-17.5} r={3.2} fill={postFill} stroke="#361c0b" strokeWidth={0.9} />
                        <circle cx={23} cy={-17.5} r={3.2} fill={postFill} stroke="#361c0b" strokeWidth={0.9} />
                        <circle cx={-23} cy={17.5} r={3.2} fill={postFill} stroke="#361c0b" strokeWidth={0.9} />
                        <circle cx={23} cy={17.5} r={3.2} fill={postFill} stroke="#361c0b" strokeWidth={0.9} />
                      </g>
                    );
                  })}

                  {/* 7. Biome-tailored roadside landmarks beside every 5th node */}
                  {sec.pts.map((pt, idx) => {
                    if (pt.n % 5 !== 0) return null;
                    const prev = sec.pts[Math.max(0, idx - 1)];
                    const next = sec.pts[Math.min(sec.pts.length - 1, idx + 1)];
                    const tx = next.x - prev.x;
                    const ty = next.y - prev.y;
                    const len = Math.hypot(tx, ty) || 1;
                    const nx = -ty / len;
                    const ny = tx / len;
                    const side = pt.x > W2 * 0.5 ? 1 : -1;
                    const lx = pt.x + nx * 38 * side;
                    const ly = pt.y + ny * 38 * side;
                    const lit = pt.n <= prog.u;

                    if (sec.id === 'cloud-city') {
                      return (
                        <g key={`lan-${pt.n}`} transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`}>
                          <ellipse cx={0} cy={10} rx={7} ry={2.6} fill={rs.shadowColor} />
                          <rect x={-3} y={-4} width={6} height={14} rx={1.5} fill="#e9e2ff" stroke="#9e87e0" strokeWidth={0.9} />
                          <rect x={-5} y={-6} width={10} height={3} rx={1} fill="#ffd96b" />
                          <polygon points="0,-16 -4,-7 4,-7" fill={lit ? '#fff2a6' : '#a99fd4'} />
                          {lit && (
                            <circle className="world-lantern-glow" cx={0} cy={-10} r={10} fill="#ffe07d" fillOpacity={0.34} />
                          )}
                        </g>
                      );
                    }

                    if (sec.id === 'volcano') {
                      return (
                        <g key={`lan-${pt.n}`} transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`}>
                          <ellipse cx={0} cy={10} rx={7.5} ry={2.8} fill={rs.shadowColor} />
                          <polygon points="-5,9 -3,-3 3,-3 5,9" fill="#3a1618" stroke="#6c2a2c" strokeWidth={0.9} />
                          <ellipse cx={0} cy={-3.5} rx={6} ry={2.4} fill="#5e2426" />
                          <circle cx={0} cy={-6} r={3.6} fill={lit ? '#ff9130' : '#733b3b'} />
                          {lit && (
                            <>
                              <circle cx={0} cy={-6.5} r={1.8} fill="#fff3b0" />
                              <circle className="world-lantern-glow" cx={0} cy={-6} r={11} fill="#ff7824" fillOpacity={0.36} />
                            </>
                          )}
                        </g>
                      );
                    }

                    if (sec.id === 'abyss') {
                      return (
                        <g key={`lan-${pt.n}`} transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`}>
                          <ellipse cx={0} cy={10} rx={7} ry={2.6} fill={rs.shadowColor} />
                          <path d="M -2.5 9 Q -4 1 -1 -5 L 1 -5 Q 4 1 2.5 9 Z" fill="#2c708a" stroke="#62b9d6" strokeWidth={0.8} />
                          <circle cx={0} cy={-7.5} r={4.8} fill={lit ? '#85fff5' : '#4d7f94'} stroke="#e0ffff" strokeWidth={1} />
                          {lit && (
                            <circle className="world-lantern-glow" cx={0} cy={-7.5} r={11} fill="#4ef2e0" fillOpacity={0.34} />
                          )}
                        </g>
                      );
                    }

                    return (
                      <g key={`lan-${pt.n}`} transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`}>
                        <ellipse cx={0} cy={9} rx={7} ry={2.8} fill={rs.shadowColor} />
                        <rect x={-1.8} y={-4} width={3.6} height={13} rx={1} fill="#4f3522" />
                        <rect x={-4.5} y={-10} width={9} height={7} rx={2} fill={lit ? '#ffea8a' : '#7b8aa8'} stroke="#332216" strokeWidth={1.2} />
                        <polygon points="-6,-10 0,-15 6,-10" fill={rs.curbColor} />
                        {lit && (
                          <circle
                            className="world-lantern-glow"
                            cx={0}
                            cy={-6.5}
                            r={10}
                            fill={sec.acc}
                            fillOpacity={0.32}
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* 8. Settled luminous golden journey ribbon up to completed level */}
                  {sec.settledPath && (
                    <>
                      <path
                        d={sec.settledPath}
                        fill="none"
                        stroke="#ffad26"
                        strokeOpacity={0.38}
                        strokeWidth={18}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={sec.settledPath}
                        fill="none"
                        stroke="url(#goldenTrail)"
                        strokeWidth={7.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        className="mpath-flow"
                        d={sec.settledPath}
                        fill="none"
                        stroke="#ffffff"
                        strokeOpacity={0.84}
                        strokeWidth={2.5}
                        strokeDasharray="6 18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}

                  {/* 9. Sculpted stone & golden milestone plazas beneath every level medallion */}
                  {sec.pts.map((pt) => {
                    const isCurrent = pt.n === prog.u && !revealRange;
                    const isUnlocked = pt.n <= settledLimit;
                    const isMilestone = pt.n % 10 === 0;
                    const baseR = isCurrent ? 24 : isMilestone ? 21 : 17.4;
                    return (
                      <g key={pt.n}>
                        {/* Ground ambient drop shadow */}
                        <circle
                          cx={pt.x}
                          cy={pt.y + 5}
                          r={baseR + 4.5}
                          fill={rs.shadowColor}
                        />
                        {/* Extruded stone pedestal depth base */}
                        <circle
                          cx={pt.x}
                          cy={pt.y + 2.4}
                          r={baseR + 1.8}
                          fill="rgba(10, 12, 24, 0.56)"
                        />
                        {isMilestone && (
                          <>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={baseR + 5.2}
                              fill="none"
                              stroke="#ffd86b"
                              strokeOpacity={isUnlocked ? 0.78 : 0.4}
                              strokeWidth={2}
                              strokeDasharray="4 4"
                            />
                            {[0, 90, 180, 270].map((deg) => {
                              const rad = (deg * Math.PI) / 180;
                              const cx = pt.x + Math.cos(rad) * (baseR + 5.4);
                              const cy = pt.y + Math.sin(rad) * (baseR + 5.4);
                              return (
                                <circle
                                  key={`mc-${pt.n}-${deg}`}
                                  cx={cx}
                                  cy={cy}
                                  r={2.3}
                                  fill={isUnlocked ? '#ffe580' : '#8b95b5'}
                                />
                              );
                            })}
                          </>
                        )}
                        {isCurrent && (
                          <circle
                            className="cur-halo"
                            cx={pt.x}
                            cy={pt.y}
                            r={baseR + 10.5}
                            fill="none"
                            stroke="#ffd23f"
                            strokeWidth={2.8}
                          />
                        )}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={baseR}
                          fill={isUnlocked ? rs.pedestalFill : rs.deckBottom}
                          stroke={
                            isCurrent
                              ? '#ffd23f'
                              : isUnlocked
                              ? rs.pedestalStroke
                              : rs.curbColor
                          }
                          strokeWidth={isCurrent ? 3.5 : 2.4}
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={baseR - 3.4}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.24)"
                          strokeWidth={1}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* 9. Animated Path Reveal edge connecting newly completed node -> next available node */}
            {revealEdge && (
              <g data-testid="path-reveal-edge">
                <path
                  ref={revealGlowRef}
                  d={revealEdge.path}
                  fill="none"
                  stroke="#ffae24"
                  strokeOpacity={0.55}
                  strokeWidth={20}
                  strokeLinecap="round"
                />
                <path
                  ref={revealCoreRef}
                  d={revealEdge.path}
                  fill="none"
                  stroke="url(#goldenTrail)"
                  strokeWidth={8.5}
                  strokeLinecap="round"
                />
                <g ref={revealSparkRef} opacity="0">
                  <circle cx={0} cy={0} r={12} fill="#ffe066" fillOpacity={0.38} />
                  <circle cx={0} cy={0} r={6} fill="#fff9d6" />
                  <path
                    d="M0 -10 L2.3 -2.3 L10 0 L2.3 2.3 L0 10 L-2.3 2.3 L-10 0 L-2.3 -2.3 Z"
                    fill="#ffffff"
                  />
                </g>
              </g>
            )}
          </svg>

          {/* Arched inter-realm crossing plaques on bridge midpoints */}
          {bridges.map((b) => (
            <div
              key={`gate-${b.key}`}
              className={`realm-gate${b.settled ? ' unlocked' : ''}`}
              style={{
                left: `${b.bridge.midX}px`,
                top: `${b.bridge.midY}px`,
                ['--acc' as string]: b.toAcc,
              }}
            >
              <span className="rg-title">
                To {b.toName} · LV {b.startLv}
              </span>
              <span className="rg-stars">
                <StarIcon />
                <span>
                  {b.toStars.earned}/{b.toStars.max}
                </span>
              </span>
            </div>
          ))}

          {/* Glossy floating Jewel-Medallion level nodes */}
          {renderedSections.flatMap((sec) =>
            sec.pts.map((pt) => {
              const n = pt.n;
              const isRevealingTarget = revealRange?.to === n;
              const cls =
                n < prog.u
                  ? 'done'
                  : n === prog.u && !isRevealingTarget
                  ? 'cur'
                  : 'locked';
              const st = prog.s[n] || 0;
              const ms = n % 10 === 0;
              const ch = n % 10 === 5;
              const kind =
                cls === 'locked'
                  ? 'd'
                  : cls === 'cur' || ch
                  ? 'p'
                  : 'b';
              const justUnlocked = unlockPopLevel === n;
              const floatDelay = `${((n % 7) * -0.46).toFixed(2)}s`;

              return (
                <button
                  key={n}
                  type="button"
                  className={`mk ${cls}${ms ? ' ms' : ''}${ch ? ' ch' : ''}${
                    justUnlocked ? ' just-unlocked' : ''
                  }`}
                  style={{
                    left: `${pt.x}px`,
                    top: `${pt.y}px`,
                    ['--float-delay' as string]: floatDelay,
                  }}
                  aria-label={`Level ${n}${
                    cls === 'locked' ? ' (Locked)' : cls === 'done' ? ' (Unlocked)' : ''
                  }`}
                  onClick={(e) => handleNodeClick(e, n)}
                >
                  <span className="mk-bob">
                    {ch && <s className="sp" />}
                    {justUnlocked && <span className="unlock-burst" aria-hidden="true" />}
                    <MapGemSvg kind={kind} ms={ms} />
                    <span className="mk-num">{n}</span>
                    {cls === 'locked' && (
                      <span className="mk-state-seal is-locked" aria-hidden="true">
                        <LockIcon className="mk-seal-svg" />
                      </span>
                    )}
                    {cls === 'done' && (
                      <span className="mk-state-seal is-unlocked" aria-hidden="true">
                        <CheckIcon className="mk-seal-svg" />
                      </span>
                    )}
                    {cls === 'done' && (
                      <em>
                        {[1, 2, 3].map((i) => (
                          <u key={i} className={i <= st ? 'on' : undefined}>
                            <StarIcon />
                          </u>
                        ))}
                      </em>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Brief non-blocking notice when tapping a locked level */}
      {lockedNotice && (
        <div key={lockedNotice.key} className="map-lock-toast" role="status">
          {lockedNotice.text}
        </div>
      )}

      {/* Quick jump to active level when scrolled away */}
      {showJumpBtn && (
        <button
          type="button"
          className="map-jump-btn"
          onClick={handleJumpToCurrent}
          aria-label={`Jump to current level ${prog.u}`}
        >
          <span>Lv {prog.u}</span>
          <span aria-hidden="true">↗</span>
        </button>
      )}

      <span className="sr-only">
        Showing {totalLevels} levels
      </span>
    </div>
  );
};
