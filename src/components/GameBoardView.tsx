import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GRID_SIZE, MAX_LIVES, POWER_UP_DEFS } from '../data/constants';
import {
  BlockSkinId,
  BoardEffectId,
  GameMode,
  HintPlacement,
  LevelDef,
  Piece,
  PowerUpId,
  PowerUpInventory,
  ToolEffectEvent,
} from '../types/game';
import {
  didStreakIncrease,
  evaluateDropAttempt,
  getBoardCellCenterPercent,
  getComboHudState,
} from '../utils/gameHelpers';
import {
  fitsOnBoard,
  getClassicDifficultyProfile,
  pieceDimensions,
} from '../utils/levelLogic';
import {
  getBoomAreaIndices,
  getColorBlastIndices,
  hasAnyOccupiedCell,
} from '../utils/powerUpManager';
import { formatClock } from '../utils/storage';
import {
  BrandMarkSvg,
  CheckIcon,
  FlameIcon,
  HeartIcon,
  HelpIcon,
  ItemSvg,
  LevelGoalIcon,
  MapGemSvg,
  PauseIcon,
  PowerUpIcon,
  SoundIcon,
  StarIcon,
  HammerIcon,
  BoomIcon,
  ColorBlastIcon,
} from './Icons';
import { PowerUpBar } from './PowerUpBar';
import {
  ActiveStreakFlare,
  HudWinStreakCrest,
  WinStreakOverlay,
} from './WinStreakOverlay';

interface DragSession {
  slotIdx: number;
  piece: Piece;
  cs: number;
  w: number;
  h: number;
  boardRect: DOMRect;
  pos: [number, number] | null;
  lastLeft: number;
  lastTop: number;
  lastR0: number;
  lastC0: number;
  lastKey: string;
}

interface PieceGridProps {
  piece: Piece;
  cellSize: number;
  className?: string;
  opacity?: number;
}

const PieceGrid: React.FC<PieceGridProps> = ({
  piece,
  cellSize,
  className = 'piece',
  opacity = 1,
}) => {
  const [h, w] = pieceDimensions(piece.c);
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const has = piece.c.some((x) => x[0] === r && x[1] === c);
      const hasItem =
        has &&
        !!piece.it &&
        piece.ii !== undefined &&
        piece.c[piece.ii][0] === r &&
        piece.c[piece.ii][1] === c;
      cells.push(
        <i
          key={`${r}-${c}`}
          className={`${has ? 'k f' : 'k e'}${hasItem ? ' ti' : ''}`}
          style={
            has
              ? { ['--col' as string]: `var(--c${piece.k})` }
              : undefined
          }
        >
          {hasItem && piece.it && (
            <s className="itm">
              <ItemSvg itemIndex={piece.it - 1} />
            </s>
          )}
        </i>
      );
    }
  }

  return (
    <div
      className={className}
      style={{
        ['--s' as string]: `${cellSize}px`,
        gridTemplateColumns: `repeat(${w}, ${cellSize}px)`,
        opacity,
      }}
    >
      {cells}
    </div>
  );
};

interface GameBoardViewProps {
  board: number[];
  boardItems: number[];
  pieces: (Piece | null)[];
  score: number;
  best: number;
  streak: number;
  winStreak?: number;
  streakFlare?: ActiveStreakFlare | null;
  lives: number;
  nextLifeText: string;
  mode: GameMode;
  lv: LevelDef | null;
  moves: number;
  timeLeft: number;
  busy: boolean;
  paused: boolean;
  muted: boolean;
  equippedSkin: BlockSkinId;
  equippedEffect: BoardEffectId;
  powerUps: PowerUpInventory;
  playerLevel: number;
  activeTargetTool: PowerUpId | null;
  activeToolFx: ToolEffectEvent | null;
  canUndo: boolean;
  activeHint: HintPlacement | null;
  toastInfo: { text: string; key: number };
  popCells: Set<number>;
  crashCells: Map<number, number>; // cellIdx -> delayMs
  deadCells: Set<number>;
  boardShakeKey: number;
  rings: { id: number; x: number; y: number; k: number }[];
  flyingItems: {
    id: number;
    itemIdx: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
  }[];
  boardRef: React.RefObject<HTMLDivElement | null>;
  goalRef: React.RefObject<HTMLDivElement | null>;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenTutorial: () => void;
  onPlacePiece: (slotIdx: number, pos: [number, number]) => void;
  onInvalidDrop: () => void;
  onAudioInit: () => void;
  onActivatePowerUp: (id: PowerUpId) => void;
  onCancelTargetMode: () => void;
  onBoardTargetCell: (cellIdx: number) => void;
  onOpenPowerUpWorkshop: () => void;
}

export const GameBoardView: React.FC<GameBoardViewProps> = ({
  board,
  boardItems,
  pieces,
  score,
  best,
  streak,
  winStreak = 0,
  streakFlare = null,
  lives,
  nextLifeText,
  mode,
  lv,
  moves,
  timeLeft,
  busy,
  paused,
  muted,
  equippedSkin,
  equippedEffect,
  powerUps,
  playerLevel,
  activeTargetTool,
  activeToolFx,
  canUndo,
  activeHint,
  toastInfo,
  popCells,
  crashCells,
  deadCells,
  boardShakeKey,
  rings,
  flyingItems,
  boardRef,
  goalRef,
  onToggleMute,
  onPause,
  onOpenTutorial,
  onPlacePiece,
  onInvalidDrop,
  onAudioInit,
  onActivatePowerUp,
  onCancelTargetMode,
  onBoardTargetCell,
  onOpenPowerUpWorkshop,
}) => {
  const [shownScore, setShownScore] = useState(score);
  const shownRef = useRef(score);

  useEffect(() => {
    if (score < shownRef.current) {
      shownRef.current = score;
      setShownScore(score);
      return;
    }
    if (score === shownRef.current) return;

    let rafId = 0;
    const step = () => {
      if (shownRef.current < score) {
        shownRef.current = Math.min(
          score,
          shownRef.current + Math.max(1, Math.ceil((score - shownRef.current) / 5))
        );
        setShownScore(shownRef.current);
        if (shownRef.current < score) {
          rafId = requestAnimationFrame(step);
        }
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [score]);

  const dragSessionRef = useRef<DragSession | null>(null);
  const dragFloatRef = useRef<HTMLDivElement | null>(null);
  const [activeDrag, setActiveDrag] = useState<{
    slotIdx: number;
    piece: Piece;
    cs: number;
  } | null>(null);
  // Ghost + line-preview highlights are applied straight to the board DOM nodes.
  // Routing them through React state re-rendered the entire HUD + 64 cells on every
  // cell the finger crossed, which is what made block dragging feel laggy.
  const appliedGhostRef = useRef<{ ghost: number[]; preview: number[] }>({
    ghost: [],
    preview: [],
  });

  const clearGhost = useCallback(() => {
    const boardEl = boardRef.current;
    const applied = appliedGhostRef.current;
    if (boardEl) {
      const cells = boardEl.children;
      for (const i of applied.ghost) {
        const el = cells[i] as HTMLElement | undefined;
        if (!el) continue;
        el.classList.remove('g');
        el.style.removeProperty('--col');
      }
      for (const i of applied.preview) {
        const el = cells[i] as HTMLElement | undefined;
        if (!el) continue;
        el.classList.remove('pv');
        el.style.removeProperty('--pc');
      }
    }
    appliedGhostRef.current = { ghost: [], preview: [] };
  }, [boardRef]);

  const applyGhost = useCallback(
    (ghost: number[], preview: number[], colorIdx: number) => {
      clearGhost();
      const boardEl = boardRef.current;
      if (!boardEl) return;
      const cells = boardEl.children;
      const colVar = `var(--c${colorIdx})`;
      for (const i of ghost) {
        const el = cells[i] as HTMLElement | undefined;
        if (!el) continue;
        el.classList.add('g');
        el.style.setProperty('--col', colVar);
      }
      for (const i of preview) {
        const el = cells[i] as HTMLElement | undefined;
        if (!el) continue;
        el.classList.add('pv');
        el.style.setProperty('--pc', colVar);
      }
      appliedGhostRef.current = { ghost, preview };
    },
    [boardRef, clearGhost]
  );
  const [invalidCells, setInvalidCells] = useState<Set<number>>(new Set());
  const invalidTimerRef = useRef<number | null>(null);

  // Combo counter scale + pulse animation state whenever streak increases
  const prevStreakRef = useRef<number>(streak);
  const [comboPulseKey, setComboPulseKey] = useState<number>(0);
  const [isComboPulsing, setIsComboPulsing] = useState<boolean>(false);
  const comboPulseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;
    if (didStreakIncrease(prev, streak)) {
      setComboPulseKey((k) => k + 1);
      setIsComboPulsing(true);
      if (comboPulseTimerRef.current !== null) {
        window.clearTimeout(comboPulseTimerRef.current);
      }
      comboPulseTimerRef.current = window.setTimeout(() => {
        setIsComboPulsing(false);
        comboPulseTimerRef.current = null;
      }, 580);
    } else if (streak === 0) {
      setIsComboPulsing(false);
    }
  }, [streak]);

  // Target-selection hover preview for Hammer / Boom / Color Blast
  const [hoverTargetCell, setHoverTargetCell] = useState<number | null>(null);
  useEffect(() => {
    if (!activeTargetTool) setHoverTargetCell(null);
  }, [activeTargetTool]);

  const targetPreviewCells = useMemo(() => {
    if (!activeTargetTool || hoverTargetCell === null) return new Set<number>();
    if (activeTargetTool === 'hammer') {
      return board[hoverTargetCell] >= 0 ? new Set([hoverTargetCell]) : new Set<number>();
    }
    if (activeTargetTool === 'boom') {
      return new Set(getBoomAreaIndices(hoverTargetCell));
    }
    if (activeTargetTool === 'colorBlast') {
      const col = board[hoverTargetCell];
      return col >= 0 ? new Set(getColorBlastIndices(board, col)) : new Set<number>();
    }
    return new Set<number>();
  }, [activeTargetTool, hoverTargetCell, board]);

  const hintCellSet = useMemo(
    () => new Set(activeHint ? activeHint.cells : []),
    [activeHint]
  );
  const hasOccupied = useMemo(() => hasAnyOccupiedCell(board), [board]);

  // Cancel any active drag cleanly if paused, busy, or targeting changes
  useEffect(() => {
    if (paused || busy || activeTargetTool) {
      dragSessionRef.current = null;
      document.body.removeAttribute('data-drag');
      setActiveDrag(null);
      clearGhost();
    }
  }, [paused, busy, activeTargetTool, clearGhost]);

  useEffect(() => {
    return () => {
      if (invalidTimerRef.current !== null) {
        window.clearTimeout(invalidTimerRef.current);
      }
      if (comboPulseTimerRef.current !== null) {
        window.clearTimeout(comboPulseTimerRef.current);
      }
    };
  }, []);

  const latestRef = useRef({ board, busy, paused, onPlacePiece, onInvalidDrop });
  latestRef.current = { board, busy, paused, onPlacePiece, onInvalidDrop };

  useEffect(() => {
    const updateDragPosition = (clientX: number, clientY: number) => {
      const ds = dragSessionRef.current;
      if (!ds) return;
      const left = clientX - (ds.w * ds.cs) / 2;
      const top = clientY - ds.h * ds.cs - 56;
      ds.lastLeft = left;
      ds.lastTop = top;
      if (dragFloatRef.current) {
        dragFloatRef.current.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1.06) rotate(-2deg)`;
      }
      const b = ds.boardRect;
      const c0 = Math.round((left - b.left) / ds.cs);
      const r0 = Math.round((top - b.top) / ds.cs);
      ds.lastR0 = r0;
      ds.lastC0 = c0;
      const key = `${r0},${c0}`;
      if (ds.lastKey === key) return;
      ds.lastKey = key;
      ds.pos = null;

      const curBoard = latestRef.current.board;
      if (fitsOnBoard(curBoard, ds.piece.c, r0, c0)) {
        ds.pos = [r0, c0];
        const ghost = ds.piece.c.map(([a, q]) => (r0 + a) * GRID_SIZE + c0 + q);
        const ghostSet = new Set(ghost);
        const isFull = (i: number) => curBoard[i] >= 0 || ghostSet.has(i);
        const preview: number[] = [];

        for (let r = 0; r < GRID_SIZE; r++) {
          let rowFull = true;
          for (let c = 0; c < GRID_SIZE; c++) {
            if (!isFull(r * GRID_SIZE + c)) {
              rowFull = false;
              break;
            }
          }
          if (rowFull) {
            for (let c = 0; c < GRID_SIZE; c++) {
              preview.push(r * GRID_SIZE + c);
            }
          }
        }
        for (let c = 0; c < GRID_SIZE; c++) {
          let colFull = true;
          for (let r = 0; r < GRID_SIZE; r++) {
            if (!isFull(r * GRID_SIZE + c)) {
              colFull = false;
              break;
            }
          }
          if (colFull) {
            for (let r = 0; r < GRID_SIZE; r++) {
              const idx = r * GRID_SIZE + c;
              // A cell shared by a full row and a full column is only listed once.
              if (!preview.includes(idx)) preview.push(idx);
            }
          }
        }

        applyGhost(ghost, preview, ds.piece.k);
      } else {
        clearGhost();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragSessionRef.current) return;
      updateDragPosition(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      const ds = dragSessionRef.current;
      if (!ds) return;
      dragSessionRef.current = null;
      document.body.removeAttribute('data-drag');
      setActiveDrag(null);
      clearGhost();

      if (latestRef.current.paused || latestRef.current.busy) return;

      if (ds.pos) {
        latestRef.current.onPlacePiece(ds.slotIdx, ds.pos);
      } else {
        const dropCheck = evaluateDropAttempt(
          latestRef.current.board,
          ds.piece.c,
          ds.lastR0,
          ds.lastC0,
          ds.lastLeft,
          ds.lastTop,
          ds.w,
          ds.h,
          ds.boardRect,
          ds.cs
        );
        if (dropCheck.isOverBoardAttempt) {
          setInvalidCells(new Set(dropCheck.invalidCells));
          if (invalidTimerRef.current !== null) {
            window.clearTimeout(invalidTimerRef.current);
          }
          invalidTimerRef.current = window.setTimeout(() => {
            setInvalidCells(new Set());
          }, 420);
          latestRef.current.onInvalidDrop();
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [applyGhost, clearGhost]);

  const initialPointerRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const ds = dragSessionRef.current;
    const pt = initialPointerRef.current;
    if (activeDrag && ds && pt && dragFloatRef.current) {
      const left = pt.x - (ds.w * ds.cs) / 2;
      const top = pt.y - ds.h * ds.cs - 56;
      dragFloatRef.current.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1.06) rotate(-2deg)`;
    }
  }, [activeDrag]);

  const handleSlotPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    slotIdx: number
  ) => {
    onAudioInit();
    const piece = pieces[slotIdx];
    if (busy || paused || activeTargetTool || !piece || dragSessionRef.current) return;
    const bEl = boardRef.current;
    if (!bEl) return;
    e.preventDefault();

    const cs = bEl.clientWidth / GRID_SIZE;
    const [h, w] = pieceDimensions(piece.c);
    const boardRect = bEl.getBoundingClientRect();

    const left = e.clientX - (w * cs) / 2;
    const top = e.clientY - h * cs - 56;
    const c0 = Math.round((left - boardRect.left) / cs);
    const r0 = Math.round((top - boardRect.top) / cs);

    initialPointerRef.current = { x: e.clientX, y: e.clientY };
    const session: DragSession = {
      slotIdx,
      piece,
      cs,
      w,
      h,
      boardRect,
      pos: null,
      lastLeft: left,
      lastTop: top,
      lastR0: r0,
      lastC0: c0,
      lastKey: `${r0},${c0}`,
    };
    dragSessionRef.current = session;
    document.body.setAttribute('data-drag', '1');
    setActiveDrag({ slotIdx, piece, cs });

    if (fitsOnBoard(board, piece.c, r0, c0)) {
      session.pos = [r0, c0];
      applyGhost(
        piece.c.map(([a, q]) => (r0 + a) * GRID_SIZE + c0 + q),
        [],
        piece.k
      );
    }
  };

  const renderLevelHud = () => {
    if (!lv) return null;
    const rem =
      lv.type === 'score'
        ? Math.max(0, lv.t - score)
        : lv.type === 'combo'
        ? Math.max(0, lv.t - lv.bs)
        : Math.max(0, lv.t - (lv.type === 'lines' ? lv.cl : lv.cc));
    const done = rem <= 0;
    const p = Math.max(0, Math.min(100, (1 - moves / lv.maxMoves) * 100));

    return (
      <>
        <div className="hl1">
          <div className="hsc">
            {score.toLocaleString('en-US')}
            <i className="dv" />
            <HeartIcon on={true} />
            {lives}
          </div>
          <div className={`hmv${moves <= 5 ? ' lo' : ''}`}>
            <small>MOVES</small>
            <b>{Math.max(0, moves)}</b>
          </div>
        </div>

        <div className="hl2">
          <div className={`hbar${p > 75 ? ' hot' : ''}`}>
            <i style={{ width: `${p}%` }} />
            {[50, 75, 100].map((v) => (
              <s
                key={v}
                className={p <= v ? 'on' : undefined}
                style={{ left: `${v}%` }}
              >
                <StarIcon />
              </s>
            ))}
          </div>
          <div className="htg">
            <div className="tgc">
              {lv.type === 'item' ? (
                <span className="itc gi2">
                  <ItemSvg itemIndex={lv.ik} />
                </span>
              ) : lv.type === 'color' ? (
                <span
                  className="cb"
                  style={{ ['--col' as string]: `var(--c${lv.col})` }}
                />
              ) : (
                <span className="icc">
                  <LevelGoalIcon type={lv.type} />
                </span>
              )}
              <em className={`bdg${done ? ' ok' : ''}`}>
                {done ? <CheckIcon /> : rem}
              </em>
            </div>
          </div>
        </div>

        <div className="hlv">
          <MapGemSvg kind="b" ms={false} />
          <span>
            LV<b>{lv.n}</b>
          </span>
        </div>
      </>
    );
  };

  const classicTier =
    mode === 'classic' ? getClassicDifficultyProfile(score).tierLabel : '';

  const modeBadgeLabel =
    mode === 'classic'
      ? score >= 400
        ? `Classic · ${classicTier}`
        : 'Classic Endless'
      : mode === 'timer'
      ? 'Timer Rush'
      : lv
      ? `Level ${lv.n}`
      : 'Levels';

  return (
    <>
      <div className="app">
        <div className="top">
          <div className="brand">
            <div className="brand-left">
              <BrandMarkSvg className="hicon" />
              <div className="brand-title">
                <h1>Block Clash</h1>
                <span className="mode-pill">{modeBadgeLabel}</span>
              </div>
            </div>

            {mode === 'level' && (
              <HudWinStreakCrest
                winStreak={winStreak}
                isFlaring={!!streakFlare}
              />
            )}

            <div className="hud-actions">
              <button
                type="button"
                className="ib hud-ib"
                id="gameHelp"
                aria-label="How to play"
                title="How to play"
                onClick={() => {
                  onAudioInit();
                  onOpenTutorial();
                }}
              >
                <HelpIcon />
              </button>
              <button
                type="button"
                className="ib hud-ib"
                id="mute"
                aria-label={muted ? 'Unmute sound' : 'Mute sound'}
                title={muted ? 'Unmute sound' : 'Mute sound'}
                onClick={() => {
                  onAudioInit();
                  onToggleMute();
                }}
              >
                <SoundIcon muted={muted} />
              </button>
              <button
                type="button"
                className="ib hud-ib pause-ib"
                id="home"
                aria-label="Pause game"
                title="Pause (P / Esc)"
                onClick={() => {
                  onAudioInit();
                  onPause();
                }}
              >
                <PauseIcon />
              </button>
            </div>
          </div>

          <div className="stats">
            <div>
              <b id="score">{shownScore.toLocaleString('en-US')}</b>
              <span>Score</span>
            </div>
            <div>
              <b id="best">{best.toLocaleString('en-US')}</b>
              <span>Best</span>
            </div>
          </div>

          <div className="lives" id="lives" aria-label="Lives">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <HeartIcon key={i} on={i < lives} />
            ))}
            {lives < MAX_LIVES && nextLifeText && (
              <span className="nl">+1 in {nextLifeText}</span>
            )}
          </div>
        </div>

        {/* Goalbar */}
        <div
          ref={goalRef}
          id="goal"
          className={
            mode === 'timer'
              ? `goalbar tm${timeLeft <= 10 ? ' low' : ''}`
              : mode === 'level' && lv
              ? 'goalbar hud'
              : 'goalbar'
          }
          style={{
            display:
              mode === 'classic'
                ? 'none'
                : mode === 'timer'
                ? 'flex'
                : lv
                ? 'grid'
                : 'none',
          }}
        >
          {mode === 'timer' && (
            <>
              <b>{formatClock(timeLeft)}</b>
              <span>Time rush · Clear lines for +2s</span>
            </>
          )}
          {mode === 'level' && lv && renderLevelHud()}
        </div>

        {/* Target Selection Banner when Hammer / Boom / Color Blast is active */}
        {activeTargetTool && (
          <div
            className="target-banner"
            id="targetBanner"
            role="status"
            style={{ ['--pu-acc' as string]: POWER_UP_DEFS[activeTargetTool].accent }}
          >
            <span className="tb-ic">
              <PowerUpIcon id={activeTargetTool} />
            </span>
            <span className="tb-copy">
              <strong>{POWER_UP_DEFS[activeTargetTool].name} Active</strong>
              <small>{POWER_UP_DEFS[activeTargetTool].targetHint}</small>
            </span>
            <button
              type="button"
              className="tb-cancel"
              id="cancelTargetMode"
              onClick={() => {
                onAudioInit();
                onCancelTargetMode();
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* 8x8 Board */}
        <div
          className={`bw${activeTargetTool ? ' targeting' : ''}${
            activeToolFx?.tool === 'undo' ? ' undo-flash' : ''
          }`}
          data-fx={equippedEffect}
        >
          <div
            id="board"
            ref={boardRef}
            data-skin={equippedSkin}
            data-fx={equippedEffect}
            key={`board-${boardShakeKey}`}
            className={`${boardShakeKey > 0 ? 'shake ' : ''}${
              activeTargetTool ? `target-${activeTargetTool}` : ''
            }`.trim()}
            onPointerLeave={() => {
              if (activeTargetTool) setHoverTargetCell(null);
            }}
          >
            {board.map((v, i) => {
              const t = v >= 0 ? boardItems[i] : 0;
              const isPop = popCells.has(i);
              const crashDelay = crashCells.get(i);
              const isCrash = crashDelay !== undefined;
              const isDead = deadCells.has(i);
              const isInvalid = invalidCells.has(i);
              const isHint = hintCellSet.has(i);
              const isTargetHit = targetPreviewCells.has(i);
              const isSelectableTarget =
                !!activeTargetTool &&
                (activeTargetTool === 'boom' || v >= 0);

              let cls = 'k';
              if (v >= 0) cls += ' f';
              if (t) cls += ' ti';
              if (isPop) cls += ' pl';
              if (isCrash) cls += ' crash';
              if (isDead) cls += ' dead';
              if (isInvalid) cls += ' inv';
              if (isHint) cls += ' hint-cell';
              if (isSelectableTarget) cls += ' t-elig';
              if (isTargetHit) cls += ' t-hit';

              const style: React.CSSProperties = {};
              if (v >= 0) {
                (style as Record<string, string>)['--col'] = `var(--c${v})`;
              } else if (isHint && activeHint) {
                (style as Record<string, string>)[
                  '--col'
                ] = `var(--c${activeHint.piece.k})`;
              }
              if (isCrash) {
                (style as Record<string, string>)[
                  '--dl'
                ] = `${crashDelay}ms`;
              }

              return (
                <i
                  key={i}
                  data-cell={i}
                  className={cls}
                  style={style}
                  onPointerEnter={
                    activeTargetTool ? () => setHoverTargetCell(i) : undefined
                  }
                  onClick={
                    activeTargetTool
                      ? () => {
                          onAudioInit();
                          onBoardTargetCell(i);
                        }
                      : undefined
                  }
                >
                  {t > 0 && (
                    <s className="itm">
                      <ItemSvg itemIndex={t - 1} />
                    </s>
                  )}
                </i>
              );
            })}
          </div>

          {rings.map((r) => (
            <span
              key={r.id}
              className="ring"
              style={{
                left: `${r.x}px`,
                top: `${r.y}px`,
                ['--k' as string]: r.k,
              }}
            />
          ))}

          {toastInfo.key > 0 && (
            <div id="toast" key={toastInfo.key} className="pop">
              {toastInfo.text}
            </div>
          )}

          {activeToolFx && activeToolFx.cellIdx !== undefined && (
            <div key={activeToolFx.id} className="tool-fx-layer" aria-hidden="true">
              {(() => {
                const pos = getBoardCellCenterPercent(
                  activeToolFx.cellIdx,
                  GRID_SIZE
                );
                const anchorStyle: React.CSSProperties = {
                  left: `${pos.xPct}%`,
                  top: `${pos.yPct}%`,
                };

                if (activeToolFx.tool === 'hammer') {
                  return (
                    <div className="tfx-anchor tfx-hammer" style={anchorStyle}>
                      <span className="tfx-hammer-ring" />
                      <svg className="tfx-cracks" viewBox="0 0 64 64">
                        <path d="M32 32L14 14M32 32L50 18M32 32L12 46M32 32L52 48M32 32L32 8M32 32L32 56" />
                      </svg>
                      <span className="tfx-hammer-swing">
                        <HammerIcon />
                      </span>
                    </div>
                  );
                }

                if (activeToolFx.tool === 'boom') {
                  return (
                    <div className="tfx-anchor tfx-boom" style={anchorStyle}>
                      <span className="tfx-boom-blast" />
                      <span className="tfx-boom-ring" />
                      <svg className="tfx-boom-rays" viewBox="0 0 100 100">
                        <path d="M50 6v14M50 80v14M6 50h14M80 50h14M18 18l10 10M72 72l10 10M82 18L72 28M28 72L18 82" />
                      </svg>
                      <span className="tfx-boom-core">
                        <BoomIcon />
                      </span>
                    </div>
                  );
                }

                if (activeToolFx.tool === 'colorBlast') {
                  return (
                    <div className="tfx-anchor tfx-prism" style={anchorStyle}>
                      <span className="tfx-prism-ring" />
                      <span className="tfx-prism-nova">
                        <ColorBlastIcon />
                      </span>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          )}

          {activeToolFx?.tool === 'undo' && (
            <div key={activeToolFx.id} className="tfx-undo-pulse" aria-hidden="true" />
          )}

          <WinStreakOverlay flare={streakFlare} />
        </div>

        {/* Combo meter */}
        {(() => {
          const comboHud = getComboHudState(streak);
          return (
            <div
              className={`meter tier-${comboHud.tier}${
                isComboPulsing ? ' pulsing' : ''
              }`}
              data-streak={comboHud.streak}
              data-pulsing={isComboPulsing ? 'true' : 'false'}
            >
              <i
                id="mf"
                style={{ width: `${comboHud.fillPct}%` }}
              />
              {comboPulseKey > 0 && (
                <span
                  key={`surge-${comboPulseKey}`}
                  className="meter-surge"
                  aria-hidden="true"
                />
              )}
              <div className="meter-inner">
                <span className="meter-lead">
                  <FlameIcon
                    className={`meter-flame${comboHud.isActive ? ' on' : ''}`}
                  />
                  {comboHud.isActive && (
                    <em
                      key={`badge-${comboPulseKey}`}
                      className={`meter-badge${
                        comboPulseKey > 0 ? ' combo-pop' : ''
                      }`}
                    >
                      {comboHud.badgeText}
                    </em>
                  )}
                </span>
                <span
                  id="mt"
                  key={`mt-${comboPulseKey}`}
                  className={comboPulseKey > 0 ? 'combo-pop' : undefined}
                >
                  {comboHud.label}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Piece Tray */}
        <div
          className={`tray${activeTargetTool ? ' dim-tray' : ''}${
            activeToolFx?.tool === 'refresh' ? ' refreshing' : ''
          }`}
          id="tray"
          data-skin={equippedSkin}
        >
          {[0, 1, 2].map((slotIdx) => {
            const p = pieces[slotIdx];
            const isDraggingThis = activeDrag?.slotIdx === slotIdx;
            const isHintSlot = activeHint?.slotIdx === slotIdx;
            return (
              <div
                key={slotIdx}
                className={`slot${!p ? ' empty' : ''}${
                  isHintSlot ? ' hint-slot' : ''
                }`}
                onPointerDown={(e) => handleSlotPointerDown(e, slotIdx)}
              >
                {p && (
                  <PieceGrid
                    piece={p}
                    cellSize={24}
                    opacity={isDraggingThis ? 0.22 : 1}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Modular Power-Up Bar */}
        <PowerUpBar
          inventory={powerUps}
          playerLevel={playerLevel}
          activeTargetTool={activeTargetTool}
          canUndo={canUndo}
          hasOccupiedCells={hasOccupied}
          busy={busy}
          paused={paused}
          onActivatePowerUp={(id) => {
            onAudioInit();
            onActivatePowerUp(id);
          }}
          onCancelTargetMode={() => {
            onAudioInit();
            onCancelTargetMode();
          }}
          onOpenWorkshop={() => {
            onAudioInit();
            onOpenPowerUpWorkshop();
          }}
        />
      </div>

      {/* Floating dragged piece */}
      {activeDrag && (
        <div ref={dragFloatRef} className="drag" data-skin={equippedSkin}>
          <PieceGrid piece={activeDrag.piece} cellSize={activeDrag.cs} />
        </div>
      )}

      {/* Flying collected items */}
      {flyingItems.map((f) => (
        <FlyingItemEl key={f.id} item={f} />
      ))}
    </>
  );
};

const FlyingItemEl: React.FC<{
  item: {
    id: number;
    itemIdx: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
  };
}> = ({ item }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.9)', opacity: 1, offset: 0.25 },
        {
          transform: `translate(${item.dx}px, ${item.dy}px) scale(.8)`,
          opacity: 0.9,
        },
      ],
      {
        duration: 750,
        easing: 'ease-in',
        fill: 'both',
      }
    );
  }, [item]);

  return (
    <div
      ref={ref}
      className="fly"
      style={{ left: `${item.x}px`, top: `${item.y}px` }}
    >
      <ItemSvg itemIndex={item.itemIdx} />
    </div>
  );
};
