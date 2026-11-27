import { GRID_SIZE } from '../data/constants';
import { CellCoord, GameMode } from '../types/game';
import { fitsOnBoard } from './levelLogic';

export interface InvalidDropResult {
  isOverBoardAttempt: boolean;
  invalidCells: number[];
}

/**
 * Determines whether a released piece drag happened over the 8x8 board area
 * and computes which in-bounds cells overlapped when placement failed.
 */
export function evaluateDropAttempt(
  board: number[],
  coords: CellCoord[],
  r0: number,
  c0: number,
  left: number,
  top: number,
  pieceW: number,
  pieceH: number,
  boardRect: { left: number; top: number; right: number; bottom: number },
  cellSize: number
): InvalidDropResult {
  if (fitsOnBoard(board, coords, r0, c0)) {
    return { isOverBoardAttempt: true, invalidCells: [] };
  }

  const pieceRight = left + pieceW * cellSize;
  const pieceBottom = top + pieceH * cellSize;

  const overlapsBoard =
    pieceRight > boardRect.left + cellSize * 0.25 &&
    left < boardRect.right - cellSize * 0.25 &&
    pieceBottom > boardRect.top + cellSize * 0.25 &&
    top < boardRect.bottom - cellSize * 0.25;

  if (!overlapsBoard) {
    return { isOverBoardAttempt: false, invalidCells: [] };
  }

  const invalidCells: number[] = [];
  for (const [dr, dc] of coords) {
    const r = r0 + dr;
    const c = c0 + dc;
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      invalidCells.push(r * GRID_SIZE + c);
    }
  }

  return {
    isOverBoardAttempt: true,
    invalidCells,
  };
}

/**
 * Pure check for whether active gameplay clocks (timer countdown & play-time)
 * should tick cleanly. Prevents ticking during pause, tutorial, or end-state modals.
 */
export function shouldTickGameplayClock(params: {
  screen: 'home' | 'map' | 'game';
  mode: GameMode;
  inGame: boolean;
  paused: boolean;
  tutorialOpen: boolean;
  overOpen: boolean;
  failOpen: boolean;
  winOpen: boolean;
  documentHidden: boolean;
  timerPlaying?: boolean;
  forTimerCountdown?: boolean;
}): boolean {
  if (params.screen !== 'game') return false;
  if (params.paused || params.tutorialOpen) return false;
  if (params.overOpen || params.failOpen || params.winOpen) return false;
  if (params.documentHidden) return false;
  if (params.forTimerCountdown) {
    return params.mode === 'timer' && !!params.timerPlaying;
  }
  return params.inGame;
}

export type ComboTier = 'idle' | 'warm' | 'hot' | 'blazing';

export interface ComboHudState {
  streak: number;
  isActive: boolean;
  tier: ComboTier;
  fillPct: number;
  label: string;
  badgeText: string;
}

/**
 * Pure helper computing Combo HUD visual tier, progress fill percentage, and label.
 */
export function getComboHudState(streak: number): ComboHudState {
  const safeStreak = Math.max(0, Math.floor(streak || 0));
  const fillPct = (Math.min(safeStreak, 6) / 6) * 100;
  const tier: ComboTier =
    safeStreak >= 4
      ? 'blazing'
      : safeStreak >= 2
      ? 'hot'
      : safeStreak >= 1
      ? 'warm'
      : 'idle';

  return {
    streak: safeStreak,
    isActive: safeStreak > 0,
    tier,
    fillPct,
    label: safeStreak > 0 ? `Combo x${safeStreak}` : 'Combo',
    badgeText: safeStreak > 0 ? `x${safeStreak}` : '',
  };
}

/**
 * Returns true whenever the gameplay streak count strictly increases from a previous turn.
 */
export function didStreakIncrease(
  prevStreak: number,
  nextStreak: number
): boolean {
  const prev = Math.max(0, Math.floor(prevStreak || 0));
  const next = Math.max(0, Math.floor(nextStreak || 0));
  return next > prev && next > 0;
}

export interface CellCenterPercent {
  row: number;
  col: number;
  xPct: number;
  yPct: number;
}

/**
 * Computes exact percentage coordinates for an overlay centered on a board cell.
 */
export function getBoardCellCenterPercent(
  cellIdx: number,
  gridSize: number = GRID_SIZE
): CellCenterPercent {
  const total = gridSize * gridSize;
  const safeIdx = Math.max(0, Math.min(total - 1, Math.floor(cellIdx)));
  const row = Math.floor(safeIdx / gridSize);
  const col = safeIdx % gridSize;
  return {
    row,
    col,
    xPct: ((col + 0.5) / gridSize) * 100,
    yPct: ((row + 0.5) / gridSize) * 100,
  };
}


