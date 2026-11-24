import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { THEMED_MAPS } from '../data/maps';
import { LevelProgress, MapRoadStyle, ThemedMapId } from '../types/game';
import {
  capacityOfSections,
  getInitialMapSections,
  locateLevel,
} from '../utils/levelLogic';
import {
  buildCatmullRomPath,
  Point2D,
  projectMapPoints,
} from '../utils/mapGeometry';
import { BackIcon, HeartIcon, LockIcon, MapGemSvg, StarIcon } from './Icons';

interface LevelMapProps {
  visible: boolean;
  prog: LevelProgress;
  lives: number;
  onBack: () => void;
  onSelectLevel: (n: number) => void;
  onInteract: () => void;
}

type MapSelection = 'all' | ThemedMapId;

interface RenderedSection {
  key: string;
  worldIdx: number;
  id: ThemedMapId;
  name: string;
  subtitle: string;
  acc: string;
  img: string;
  roadStyle: MapRoadStyle;
  sectionTop: number;
  startLv: number;
  endLv: number;
  pts: Point2D[];
  fullPath: string;
  unlockedPath: string;
}

export const LevelMap: React.FC<LevelMapProps> = ({
  visible,
  prog,
  lives,
  onBack,
  onSelectLevel,
  onInteract,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const mapInRef = useRef<HTMLDivElement | null>(null);
  const [selectedMap, setSelectedMap] = useState<MapSelection>('all');
  const [sections, setSections] = useState<number>(() =>
    getInitialMapSections(prog.u)
  );
  const [containerWidth, setContainerWidth] = useState<number>(390);
  const prevScrollAdjustRef = useRef<{ oldH: number; oldTop: number } | null>(
    null
  );

  useEffect(() => {
    if (visible) {
      const needed = getInitialMapSections(prog.u);
      setSections((prev) => Math.max(prev, needed));
    }
  }, [visible, prog.u]);

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

  useEffect(() => {
    if (!visible) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const cur = el.querySelector('.mk.cur') as HTMLElement | null;
      if (cur) {
        el.scrollTop = Math.max(0, cur.offsetTop - el.clientHeight / 2);
      } else {
        el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
      }
    });
  }, [visible, selectedMap]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const adj = prevScrollAdjustRef.current;
    if (el && adj && selectedMap === 'all') {
      el.scrollTop = adj.oldTop + (el.scrollHeight - adj.oldH);
      prevScrollAdjustRef.current = null;
    }
  }, [sections, selectedMap]);

  const handleScroll = () => {
    if (selectedMap !== 'all') return;
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
  const ov = -72;
  const bottomPad = 86;
  const topPad = 48;
  const isSingleMap = selectedMap !== 'all';
  const activeCount = isSingleMap ? 1 : sections;
  const Ht = activeCount * Hs - (activeCount - 1) * ov + bottomPad + topPad;
  const ns = Math.round(W2 * 0.104);
  const totalStars = Object.values(prog.s).reduce((sum, s) => sum + s, 0);

  const activeSingleDef = useMemo(() => {
    if (selectedMap === 'all') return null;
    return THEMED_MAPS.find((m) => m.id === selectedMap) ?? THEMED_MAPS[0];
  }, [selectedMap]);

  const renderedSections: RenderedSection[] = useMemo(() => {
    const list: RenderedSection[] = [];
    if (activeSingleDef) {
      const sectionTop = Ht - bottomPad - Hs;
      const pts = projectMapPoints(
        activeSingleDef.pts,
        W2,
        IW,
        Hs,
        sectionTop,
        activeSingleDef.startLevel
      );
      const unlockedPts = pts.filter((pt) => pt.n <= prog.u);
      const worldIdx = THEMED_MAPS.findIndex((m) => m.id === activeSingleDef.id);
      list.push({
        key: activeSingleDef.id,
        worldIdx: Math.max(0, worldIdx),
        id: activeSingleDef.id,
        name: activeSingleDef.name,
        subtitle: activeSingleDef.subtitle,
        acc: activeSingleDef.acc,
        img: activeSingleDef.img,
        roadStyle: activeSingleDef.roadStyle,
        sectionTop,
        startLv: activeSingleDef.startLevel,
        endLv: activeSingleDef.endLevel,
        pts,
        fullPath: buildCatmullRomPath(pts),
        unlockedPath:
          unlockedPts.length > 1 ? buildCatmullRomPath(unlockedPts) : '',
      });
      return list;
    }

    let lvCursor = 1;
    for (let g = 0; g < sections; g++) {
      const m = THEMED_MAPS[g % THEMED_MAPS.length];
      const count = m.pts.length;
      const sectionTop = Ht - bottomPad - (g + 1) * Hs + g * ov;
      const pts = projectMapPoints(m.pts, W2, IW, Hs, sectionTop, lvCursor);
      const unlockedPts = pts.filter((pt) => pt.n <= prog.u);
      list.push({
        key: `${m.id}-${g}`,
        worldIdx: g,
        id: m.id,
        name: m.name,
        subtitle: m.subtitle,
        acc: m.acc,
        img: m.img,
        roadStyle: m.roadStyle,
        sectionTop,
        startLv: lvCursor,
        endLv: lvCursor + count - 1,
        pts,
        fullPath: buildCatmullRomPath(pts),
        unlockedPath:
          unlockedPts.length > 1 ? buildCatmullRomPath(unlockedPts) : '',
      });
      lvCursor += count;
    }
    return list;
  }, [activeSingleDef, sections, W2, IW, Hs, Ht, ov, bottomPad, prog.u]);

  const singleMapStars = useMemo(() => {
    if (!activeSingleDef) return null;
    let earned = 0;
    for (
      let n = activeSingleDef.startLevel;
      n <= activeSingleDef.endLevel;
      n++
    ) {
      earned += prog.s[n] || 0;
    }
    const max = (activeSingleDef.endLevel - activeSingleDef.startLevel + 1) * 3;
    return { earned, max };
  }, [activeSingleDef, prog.s]);

  const totalLevels = capacityOfSections(sections);
  const currentRealmId = THEMED_MAPS[locateLevel(prog.u).g % THEMED_MAPS.length].id;

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
      return;
    }
    onSelectLevel(n);
  };

  return (
    <div
      className={`map${visible ? ' on' : ''}`}
      id="map"
      data-selected-map={selectedMap}
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

      {/* Themed Map Selector */}
      <div
        className="map-tabs-wrap"
        role="tablist"
        aria-label="Select themed realm map"
      >
        <div className="map-tabs">
          <button
            type="button"
            role="tab"
            id="mapTab-all"
            aria-selected={selectedMap === 'all'}
            className={`map-tab${selectedMap === 'all' ? ' on' : ''}`}
            onClick={() => {
              onInteract();
              setSelectedMap('all');
            }}
          >
            All Realms
          </button>
          {THEMED_MAPS.map((m) => {
            const isSelected = selectedMap === m.id;
            const isActiveRealm = currentRealmId === m.id;
            const isLockedRealm = prog.u < m.startLevel;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`mapTab-${m.id}`}
                aria-selected={isSelected}
                className={`map-tab${isSelected ? ' on' : ''}${
                  isLockedRealm ? ' dim' : ''
                }${isActiveRealm ? ' current' : ''}`}
                style={{ ['--tab-acc' as string]: m.acc }}
                onClick={() => {
                  onInteract();
                  setSelectedMap(m.id);
                }}
              >
                <span className="tab-swatch" aria-hidden="true" />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="msc" id="msc" ref={scrollRef} onScroll={handleScroll}>
        <div
          ref={mapInRef}
          className="mapin"
          id="mapin"
          style={{ height: `${Ht}px`, ['--ns' as string]: `${ns}px` }}
        >
          {renderedSections.map((sec, idx) => (
            <React.Fragment key={sec.key}>
              <div
                className={`ws2 wi${sec.worldIdx % 4}${idx === 0 ? ' f' : ''}`}
                style={{
                  left: `${(W2 - IW) / 2}px`,
                  top: `${sec.sectionTop}px`,
                  width: `${IW}px`,
                  height: `${Hs}px`,
                  backgroundImage: `url(${sec.img})`,
                }}
              />
              <div
                className="wbn"
                style={{
                  top: `${
                    isSingleMap || sec.worldIdx === 0
                      ? Ht - bottomPad / 2
                      : sec.sectionTop + Hs - ov / 2
                  }px`,
                  ['--acc' as string]: sec.acc,
                }}
              >
                <small>
                  {sec.subtitle.toUpperCase()} · LV {sec.startLv}–{sec.endLv}
                  {isSingleMap && singleMapStars
                    ? prog.u < sec.startLv
                      ? ` · UNLOCKS LV ${sec.startLv}`
                      : ` · ${singleMapStars.earned}/${singleMapStars.max} ★`
                    : ''}
                </small>
                <strong>{sec.name}</strong>
              </div>
            </React.Fragment>
          ))}

          {/* Multi-layered sculpted road and node pedestals */}
          <svg
            className="mpath"
            width={W2}
            height={Ht}
            viewBox={`0 0 ${W2} ${Ht}`}
            aria-hidden="true"
          >
            {renderedSections.map((sec) => {
              const rs = sec.roadStyle;
              return (
                <g key={sec.key}>
                  {/* 1. Ambient terrain drop shadow */}
                  <path
                    d={sec.fullPath}
                    transform="translate(0, 4)"
                    fill="none"
                    stroke={rs.shadowColor}
                    strokeWidth={28}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 2. Carved outer curb / stone rim */}
                  <path
                    d={sec.fullPath}
                    fill="none"
                    stroke={rs.curbColor}
                    strokeWidth={22}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 3. Main paved roadbed */}
                  <path
                    d={sec.fullPath}
                    fill="none"
                    stroke={rs.roadColor}
                    strokeWidth={15}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 4. Subtle road crown specular highlight */}
                  <path
                    d={sec.fullPath}
                    transform="translate(0, -1)"
                    fill="none"
                    stroke={rs.roadHighlight}
                    strokeWidth={7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 5. Stepping stone / paver cadence */}
                  <path
                    d={sec.fullPath}
                    fill="none"
                    stroke={rs.inlayColor}
                    strokeWidth={6.5}
                    strokeDasharray="2 16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* 6. Active luminous progression ribbon */}
                  {sec.unlockedPath && (
                    <>
                      <path
                        d={sec.unlockedPath}
                        fill="none"
                        stroke={rs.glowColor}
                        strokeOpacity={0.32}
                        strokeWidth={15}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={sec.unlockedPath}
                        fill="none"
                        stroke={rs.glowColor}
                        strokeOpacity={0.96}
                        strokeWidth={5.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        className="mpath-flow"
                        d={sec.unlockedPath}
                        fill="none"
                        stroke="#ffffff"
                        strokeOpacity={0.68}
                        strokeWidth={2}
                        strokeDasharray="8 16"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}

                  {/* 7. Anchored stone waypoint pedestals under each node */}
                  {sec.pts.map((pt) => {
                    const isCurrent = pt.n === prog.u;
                    const isUnlocked = pt.n <= prog.u;
                    const isMilestone = pt.n % 10 === 0;
                    const baseR = isCurrent ? 21 : isMilestone ? 18 : 15;
                    return (
                      <g key={pt.n}>
                        <circle
                          cx={pt.x}
                          cy={pt.y + 2}
                          r={baseR + 2}
                          fill={rs.shadowColor}
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={baseR}
                          fill={rs.pedestalFill}
                          stroke={
                            isCurrent
                              ? '#ffc845'
                              : isUnlocked
                              ? rs.pedestalStroke
                              : rs.curbColor
                          }
                          strokeWidth={isCurrent ? 2.8 : 2}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Interactive level gem nodes */}
          {renderedSections.flatMap((sec) =>
            sec.pts.map((pt) => {
              const n = pt.n;
              const cls =
                n < prog.u ? 'done' : n === prog.u ? 'cur' : 'locked';
              const st = prog.s[n] || 0;
              const ms = n % 10 === 0;
              const ch = n % 10 === 5;
              const kind = cls === 'locked' ? 'd' : ch ? 'p' : 'b';

              return (
                <button
                  key={n}
                  type="button"
                  className={`mk ${cls}${ms ? ' ms' : ''}${ch ? ' ch' : ''}`}
                  style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
                  aria-label={`Level ${n}${
                    cls === 'locked' ? ' (Locked)' : ''
                  }`}
                  onClick={(e) => handleNodeClick(e, n)}
                >
                  {ch && <s className="sp" />}
                  <MapGemSvg kind={kind} ms={ms} />
                  {cls === 'locked' ? <LockIcon /> : <span>{n}</span>}
                  {cls === 'done' && (
                    <em>
                      {[1, 2, 3].map((i) => (
                        <u key={i} className={i <= st ? 'on' : undefined}>
                          <StarIcon />
                        </u>
                      ))}
                    </em>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Subtle screen-reader / fallback metadata */}
      <span className="sr-only">
        Showing {isSingleMap ? activeSingleDef?.name : `${totalLevels} levels`}
      </span>
    </div>
  );
};
