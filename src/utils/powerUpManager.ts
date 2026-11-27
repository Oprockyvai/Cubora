import {
  GRID_SIZE,
  POWER_UP_DEFS,
  POWER_UP_ORDER,
} from '../data/constants';
import {
  GameMode,
  HintPlacement,
  LevelDef,
  Piece,
  PowerUpId,
  PowerUpInventory,
  UndoSnapshot,
} from '../types/game';
import {
  canPlacePiece,
  createRandomPiece,
  fitsOnBoard,
} from './levelLogic';

export function createStarterInventory(): PowerUpInventory {
  return {
    hammer: POWER_UP_DEFS.hammer.starterQty,
    boom: POWER_UP_DEFS.boom.starterQty,
    refresh: POWER_UP_DEFS.refresh.starterQty,
    undo: POWER_UP_DEFS.undo.starterQty,
    hint: POWER_UP_DEFS.hint.starterQty,
    colorBlast: POWER_UP_DEFS.colorBlast.starterQty,
  };
}

export function createEmptyUsageStats(): PowerUpInventory {
  return {
    hammer: 0,
    boom: 0,
    refresh: 0,
    undo: 0,
    hint: 0,
    colorBlast: 0,
  };
}

export function sanitizePowerUpInventory(
  raw?: Partial<PowerUpInventory> | null,
  fallbackToStarter = true
): PowerUpInventory {
  const base = fallbackToStarter ? createStarterInventory() : createEmptyUsageStats();
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base };
  POWER_UP_ORDER.forEach((id) => {
    const def = POWER_UP_DEFS[id];
    const v = raw[id];
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[id] = fallbackToStarter
        ? Math.max(0, Math.min(def.maxQty, Math.floor(v)))
        : Math.max(0, Math.floor(v));
    }
  });
  return out;
}

export function isPowerUpUnlocked(
  id: PowerUpId,
  playerLevel: number
): boolean {
  return Math.max(1, Math.floor(playerLevel || 1)) >= POWER_UP_DEFS[id].unlockLevel;
}

export function canConsumePowerUp(
  inventory: PowerUpInventory,
  id: PowerUpId,
  playerLevel: number
): { ok: boolean; reason?: 'locked' | 'empty' } {
  if (!isPowerUpUnlocked(id, playerLevel)) {
    return { ok: false, reason: 'locked' };
  }
  if ((inventory[id] || 0) <= 0) {
    return { ok: false, reason: 'empty' };
  }
  return { ok: true };
}

export function consumePowerUpStock(
  inventory: PowerUpInventory,
  id: PowerUpId
): { ok: boolean; inventory: PowerUpInventory } {
  const cur = Math.max(0, Math.floor(inventory[id] || 0));
  if (cur <= 0) {
    return { ok: false, inventory: { ...inventory, [id]: 0 } };
  }
  return {
    ok: true,
    inventory: {
      ...inventory,
      [id]: cur - 1,
    },
  };
}

export function grantPowerUpStock(
  inventory: PowerUpInventory,
  id: PowerUpId,
  amount: number
): PowerUpInventory {
  const def = POWER_UP_DEFS[id];
  const safeAdd = Math.max(0, Math.floor(amount));
  const cur = Math.max(0, Math.floor(inventory[id] || 0));
  return {
    ...inventory,
    [id]: Math.min(def.maxQty, cur + safeAdd),
  };
}

export function refillPowerUpWithGems(
  inventory: PowerUpInventory,
  gems: number,
  id: PowerUpId,
  playerLevel: number
): {
  ok: boolean;
  reason?: 'locked' | 'full' | 'insufficient_gems';
  inventory: PowerUpInventory;
  gems: number;
} {
  if (!isPowerUpUnlocked(id, playerLevel)) {
    return { ok: false, reason: 'locked', inventory, gems };
  }
  const def = POWER_UP_DEFS[id];
  const cur = Math.max(0, Math.floor(inventory[id] || 0));
  if (cur >= def.maxQty) {
    return { ok: false, reason: 'full', inventory, gems };
  }
  if (gems < def.refillCost) {
    return { ok: false, reason: 'insufficient_gems', inventory, gems };
  }
  return {
    ok: true,
    inventory: {
      ...inventory,
      [id]: Math.min(def.maxQty, cur + 1),
    },
    gems: gems - def.refillCost,
  };
}

export interface CellClearActionResult {
  ok: boolean;
  reason?: 'out_of_bounds' | 'empty_cell' | 'no_targets';
  board: number[];
  boardItems: number[];
  clearedCells: number[];
  targetColor?: number;
}

export function applyHammerAt(
  board: number[],
  boardItems: number[],
  idx: number
): CellClearActionResult {
  if (!Number.isInteger(idx) || idx < 0 || idx >= GRID_SIZE * GRID_SIZE) {
    return {
      ok: false,
      reason: 'out_of_bounds',
      board,
      boardItems,
      clearedCells: [],
    };
  }
  if (board[idx] < 0) {
    return {
      ok: false,
      reason: 'empty_cell',
      board,
      boardItems,
      clearedCells: [],
    };
  }
  const nextBoard = [...board];
  const nextItems = [...boardItems];
  nextBoard[idx] = -1;
  nextItems[idx] = 0;
  return {
    ok: true,
    board: nextBoard,
    boardItems: nextItems,
    clearedCells: [idx],
  };
}

export function getBoomAreaIndices(centerIdx: number): number[] {
  if (!Number.isInteger(centerIdx) || centerIdx < 0 || centerIdx >= GRID_SIZE * GRID_SIZE) {
    return [];
  }
  const r0 = Math.floor(centerIdx / GRID_SIZE);
  const c0 = centerIdx % GRID_SIZE;
  const cells: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = r0 + dr;
      const c = c0 + dc;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        cells.push(r * GRID_SIZE + c);
      }
    }
  }
  return cells;
}

export function applyBoomAt(
  board: number[],
  boardItems: number[],
  centerIdx: number
): CellClearActionResult {
  if (!Number.isInteger(centerIdx) || centerIdx < 0 || centerIdx >= GRID_SIZE * GRID_SIZE) {
    return {
      ok: false,
      reason: 'out_of_bounds',
      board,
      boardItems,
      clearedCells: [],
    };
  }
  const area = getBoomAreaIndices(centerIdx);
  const occupiedInArea = area.filter((i) => board[i] >= 0);
  if (occupiedInArea.length === 0) {
    return {
      ok: false,
      reason: 'no_targets',
      board,
      boardItems,
      clearedCells: [],
    };
  }
  const nextBoard = [...board];
  const nextItems = [...boardItems];
  occupiedInArea.forEach((i) => {
    nextBoard[i] = -1;
    nextItems[i] = 0;
  });
  return {
    ok: true,
    board: nextBoard,
    boardItems: nextItems,
    clearedCells: occupiedInArea,
  };
}

export function getColorBlastIndices(board: number[], targetColor: number): number[] {
  if (!Number.isInteger(targetColor) || targetColor < 0) return [];
  const out: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === targetColor) out.push(i);
  }
  return out;
}

export function applyColorBlastAt(
  board: number[],
  boardItems: number[],
  idx: number
): CellClearActionResult {
  if (!Number.isInteger(idx) || idx < 0 || idx >= GRID_SIZE * GRID_SIZE) {
    return {
      ok: false,
      reason: 'out_of_bounds',
      board,
      boardItems,
      clearedCells: [],
    };
  }
  const targetColor = board[idx];
  if (targetColor < 0) {
    return {
      ok: false,
      reason: 'empty_cell',
      board,
      boardItems,
      clearedCells: [],
    };
  }
  const matched = getColorBlastIndices(board, targetColor);
  const nextBoard = [...board];
  const nextItems = [...boardItems];
  matched.forEach((cellIdx) => {
    nextBoard[cellIdx] = -1;
    nextItems[cellIdx] = 0;
  });
  return {
    ok: true,
    board: nextBoard,
    boardItems: nextItems,
    clearedCells: matched,
    targetColor,
  };
}

export function refreshTrayPieces(params: {
  board: number[];
  mode: GameMode;
  lv: LevelDef | null;
  score: number;
  rng?: () => number;
}): (Piece | null)[] {
  const { board, mode, lv, score, rng = Math.random } = params;
  const activeLv = mode === 'level' ? lv : null;
  let attempts = 0;
  let candidate: Piece[] = [];

  do {
    candidate = [
      createRandomPiece(mode, activeLv, score, rng),
      createRandomPiece(mode, activeLv, score, rng),
      createRandomPiece(mode, activeLv, score, rng),
    ];
    attempts++;
  } while (!candidate.some((p) => canPlacePiece(board, p)) && attempts < 24);

  return candidate;
}

export function createUndoSnapshot(params: {
  board: number[];
  boardItems: number[];
  pieces: (Piece | null)[];
  score: number;
  streak: number;
  moves: number;
  lv: LevelDef | null;
  timeLeft: number;
  linesClearedInRun: number;
  runMaxCombo: number;
  moveToken: string;
}): UndoSnapshot {
  return {
    board: [...params.board],
    boardItems: [...params.boardItems],
    pieces: params.pieces.map((p) => (p ? { ...p, c: p.c.map(([r, c]) => [r, c] as [number, number]) } : null)),
    score: params.score,
    streak: params.streak,
    moves: params.moves,
    lv: params.lv ? { ...params.lv } : null,
    timeLeft: params.timeLeft,
    linesClearedInRun: params.linesClearedInRun,
    runMaxCombo: params.runMaxCombo,
    moveToken: params.moveToken,
  };
}

function countLinesCompletedByPlacement(
  board: number[],
  cells: number[]
): number {
  const ghost = new Set(cells);
  const isOccupied = (idx: number) => board[idx] >= 0 || ghost.has(idx);
  let lines = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    let full = true;
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!isOccupied(r * GRID_SIZE + c)) {
        full = false;
        break;
      }
    }
    if (full) lines++;
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (!isOccupied(r * GRID_SIZE + c)) {
        full = false;
        break;
      }
    }
    if (full) lines++;
  }

  return lines;
}

/**
 * Analyses available pieces using the real `fitsOnBoard` validator and suggests
 * the highest-value legal placement (preferring line clears, then tighter fits).
 */
export function findBestHintPlacement(
  board: number[],
  pieces: (Piece | null)[]
): HintPlacement | null {
  let best: (HintPlacement & { rankScore: number }) | null = null;

  for (let slotIdx = 0; slotIdx < pieces.length; slotIdx++) {
    const piece = pieces[slotIdx];
    if (!piece) continue;

    for (let r0 = 0; r0 < GRID_SIZE; r0++) {
      for (let c0 = 0; c0 < GRID_SIZE; c0++) {
        if (!fitsOnBoard(board, piece.c, r0, c0)) continue;

        const cells = piece.c.map(([dr, dc]) => (r0 + dr) * GRID_SIZE + c0 + dc);
        const linesCleared = countLinesCompletedByPlacement(board, cells);
        const scoreGain = piece.c.length + (linesCleared > 0 ? linesCleared * linesCleared * 10 : 0);

        // Count adjacent filled neighbors / edges to favor clean compact placements when no clear
        let touchScore = 0;
        for (const [dr, dc] of piece.c) {
          const r = r0 + dr;
          const c = c0 + dc;
          if (r === 0 || r === GRID_SIZE - 1) touchScore += 1;
          if (c === 0 || c === GRID_SIZE - 1) touchScore += 1;
          if (r > 0 && board[(r - 1) * GRID_SIZE + c] >= 0) touchScore += 2;
          if (r < GRID_SIZE - 1 && board[(r + 1) * GRID_SIZE + c] >= 0) touchScore += 2;
          if (c > 0 && board[r * GRID_SIZE + c - 1] >= 0) touchScore += 2;
          if (c < GRID_SIZE - 1 && board[r * GRID_SIZE + c + 1] >= 0) touchScore += 2;
        }

        const rankScore = linesCleared * 1000 + piece.c.length * 10 + touchScore;
        if (!best || rankScore > best.rankScore) {
          best = {
            slotIdx,
            piece,
            r0,
            c0,
            cells,
            linesCleared,
            scoreGain,
            rankScore,
          };
        }
      }
    }
  }

  if (!best) return null;
  return {
    slotIdx: best.slotIdx,
    piece: best.piece,
    r0: best.r0,
    c0: best.c0,
    cells: best.cells,
    linesCleared: best.linesCleared,
    scoreGain: best.scoreGain,
  };
}

export function hasAnyOccupiedCell(board: number[]): boolean {
  return board.some((v) => v >= 0);
}
