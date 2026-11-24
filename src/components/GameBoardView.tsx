import React, { useEffect, useRef, useState } from 'react';
import { GRID_SIZE, MAX_LIVES } from '../data/constants';
import { GameMode, LevelDef, Piece } from '../types/game';
import { evaluateDropAttempt } from '../utils/gameHelpers';
import {
  fitsOnBoard,
  getClassicDifficultyProfile,
  pieceDimensions,
} from '../utils/levelLogic';
import { formatClock } from '../utils/storage';
import {
  BrandMarkSvg,
  CheckIcon,
  HeartIcon,
  HelpIcon,
  ItemSvg,
  LevelGoalIcon,
  MapGemSvg,
  PauseIcon,
  SoundIcon,
  StarIcon,
} from './Icons';

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
  lives: number;
  nextLifeText: string;
  mode: GameMode;
  lv: LevelDef | null;
  moves: number;
  timeLeft: number;
  busy: boolean;
  paused: boolean;
  muted: boolean;
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
}

export const GameBoardView: React.FC<GameBoardViewProps> = ({
  board,
  boardItems,
  pieces,
  score,
  best,
  streak,
  lives,
  nextLifeText,
  mode,
  lv,
  moves,
  timeLeft,
  busy,
  paused,
  muted,
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
  const [ghostState, setGhostState] = useState<{
    ghostCells: Set<number>;
    previewCells: Set<number>;
    colorIdx: number;
  }>({
    ghostCells: new Set(),
    previewCells: new Set(),
    colorIdx: 0,
  });
  const [invalidCells, setInvalidCells] = useState<Set<number>>(new Set());
  const invalidTimerRef = useRef<number | null>(null);

  // Cancel any active drag cleanly if paused or busy changes
  useEffect(() => {
    if (paused || busy) {
      dragSessionRef.current = null;
      setActiveDrag(null);
      setGhostState({
        ghostCells: new Set(),
        previewCells: new Set(),
        colorIdx: 0,
      });
    }
  }, [paused, busy]);

  useEffect(() => {
    return () => {
      if (invalidTimerRef.current !== null) {
        window.clearTimeout(invalidTimerRef.current);
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
        dragFloatRef.current.style.transform = `translate(${left}px, ${top}px) scale(1.06) rotate(-2deg)`;
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
        const ghostCells = new Set(
          ds.piece.c.map(([a, q]) => (r0 + a) * GRID_SIZE + c0 + q)
        );
        const isFull = (i: number) => curBoard[i] >= 0 || ghostCells.has(i);
        const previewCells = new Set<number>();

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
              previewCells.add(r * GRID_SIZE + c);
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
              previewCells.add(r * GRID_SIZE + c);
            }
          }
        }

        setGhostState({
          ghostCells,
          previewCells,
          colorIdx: ds.piece.k,
        });
      } else {
        setGhostState({
          ghostCells: new Set(),
          previewCells: new Set(),
          colorIdx: 0,
        });
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
      setActiveDrag(null);
      setGhostState({
        ghostCells: new Set(),
        previewCells: new Set(),
        colorIdx: 0,
      });

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
  }, []);

  const initialPointerRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const ds = dragSessionRef.current;
    const pt = initialPointerRef.current;
    if (activeDrag && ds && pt && dragFloatRef.current) {
      const left = pt.x - (ds.w * ds.cs) / 2;
      const top = pt.y - ds.h * ds.cs - 56;
      dragFloatRef.current.style.transform = `translate(${left}px, ${top}px) scale(1.06) rotate(-2deg)`;
    }
  }, [activeDrag]);

  const handleSlotPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    slotIdx: number
  ) => {
    onAudioInit();
    const piece = pieces[slotIdx];
    if (busy || paused || !piece || dragSessionRef.current) return;
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
    setActiveDrag({ slotIdx, piece, cs });

    if (fitsOnBoard(board, piece.c, r0, c0)) {
      session.pos = [r0, c0];
      const ghostCells = new Set(
        piece.c.map(([a, q]) => (r0 + a) * GRID_SIZE + c0 + q)
      );
      setGhostState({
        ghostCells,
        previewCells: new Set(),
        colorIdx: piece.k,
      });
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

        {/* 8x8 Board */}
        <div className="bw">
          <div
            id="board"
            ref={boardRef}
            key={`board-${boardShakeKey}`}
            className={boardShakeKey > 0 ? 'shake' : undefined}
          >
            {board.map((v, i) => {
              const t = v >= 0 ? boardItems[i] : 0;
              const isGhost = ghostState.ghostCells.has(i);
              const isPv = ghostState.previewCells.has(i);
              const isPop = popCells.has(i);
              const crashDelay = crashCells.get(i);
              const isCrash = crashDelay !== undefined;
              const isDead = deadCells.has(i);
              const isInvalid = invalidCells.has(i);

              let cls = 'k';
              if (v >= 0) cls += ' f';
              if (t) cls += ' ti';
              if (isGhost) cls += ' g';
              if (isPv) cls += ' pv';
              if (isPop) cls += ' pl';
              if (isCrash) cls += ' crash';
              if (isDead) cls += ' dead';
              if (isInvalid) cls += ' inv';

              const style: React.CSSProperties = {};
              if (v >= 0) {
                (style as Record<string, string>)['--col'] = `var(--c${v})`;
              } else if (isGhost) {
                (style as Record<string, string>)[
                  '--col'
                ] = `var(--c${ghostState.colorIdx})`;
              }
              if (isPv) {
                (style as Record<string, string>)[
                  '--pc'
                ] = `var(--c${ghostState.colorIdx})`;
              }
              if (isCrash) {
                (style as Record<string, string>)[
                  '--dl'
                ] = `${crashDelay}ms`;
              }

              return (
                <i key={i} className={cls} style={style}>
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
        </div>

        {/* Combo meter */}
        <div className="meter">
          <i
            id="mf"
            style={{ width: `${(Math.min(streak || 0, 6) / 6) * 100}%` }}
          />
          <span id="mt">{streak > 1 ? `Combo x${streak}` : 'Combo'}</span>
        </div>

        {/* Piece Tray */}
        <div className="tray" id="tray">
          {[0, 1, 2].map((slotIdx) => {
            const p = pieces[slotIdx];
            const isDraggingThis = activeDrag?.slotIdx === slotIdx;
            return (
              <div
                key={slotIdx}
                className={`slot${!p ? ' empty' : ''}`}
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

        <p className="hint cap">Drag pieces onto the board</p>
      </div>

      {/* Floating dragged piece */}
      {activeDrag && (
        <div ref={dragFloatRef} className="drag">
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
