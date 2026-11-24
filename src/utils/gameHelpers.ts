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
