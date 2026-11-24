import {
  COLOR_NAMES,
  GRID_SIZE,
  ITEMS,
  SHAPES,
  WORLDS,
} from '../data/constants';
import {
  CellCoord,
  GameMode,
  LevelDef,
  LevelGoalType,
  Piece,
} from '../types/game';

export function makeLevel(n: number): LevelDef {
  const types: LevelGoalType[] = ['score', 'lines', 'item', 'color', 'item', 'combo'];
  const type = types[(n - 1) % 6];
  let moves = 18 + Math.floor(n / 2);
  if (n % 10 === 5) {
    moves = Math.max(10, moves - 4);
  }
  const pre = n < 2 ? 0 : Math.min(14, Math.floor(n / 2));
  const ik = Math.floor((n - 1) / 4) % ITEMS.length;
  const col = (n * 7) % 6;

  const t =
    type === 'score'
      ? Math.round(moves * (4 + Math.min(n, 40) * 0.2))
      : type === 'lines'
      ? 2 + Math.floor(n / 3)
      : type === 'color'
      ? 5 + n * 2
      : type === 'item'
      ? Math.min(12, 3 + Math.floor(n / 4))
      : Math.min(5, 2 + Math.floor(n / 10));

  return {
    n,
    type,
    ik,
    col,
    cl: 0,
    cc: 0,
    bs: 0,
    moves,
    maxMoves: moves,
    pre,
    t,
    s1: moves * 5,
    s2: moves * 8,
    s3: moves * 12,
  };
}

export function describeLevel(L: LevelDef): string {
  switch (L.type) {
    case 'item':
      return `Collect ${L.t} ${ITEMS[L.ik].name}s`;
    case 'score':
      return `Reach ${L.t} points`;
    case 'lines':
      return `Clear ${L.t} lines`;
    case 'color':
      return `Place ${L.t} ${COLOR_NAMES[L.col]} blocks`;
    case 'combo':
      return `Chain a x${L.t} combo`;
  }
}

export function isGoalMet(L: LevelDef, score: number): boolean {
  switch (L.type) {
    case 'item':
      return L.cc >= L.t;
    case 'score':
      return score >= L.t;
    case 'lines':
      return L.cl >= L.t;
    case 'color':
      return L.cc >= L.t;
    case 'combo':
      return L.bs >= L.t;
  }
}

export function worldCount(g: number): number {
  return WORLDS[g % 4].pts.length;
}

export function capacityOfSections(sections: number): number {
  let c = 0;
  for (let g = 0; g < sections; g++) c += worldCount(g);
  return c;
}

export function sectionsForLevel(level: number): number {
  let s = 0;
  let c = 0;
  while (c < level) {
    c += worldCount(s);
    s++;
  }
  return s;
}

export function getInitialMapSections(unlockedLevel: number): number {
  return Math.max(WORLDS.length, sectionsForLevel(unlockedLevel + 14) + 1);
}

export function locateLevel(n: number): { g: number; k: number } {
  let g = 0;
  let c = 0;
  while (c + worldCount(g) < n) {
    c += worldCount(g);
    g++;
  }
  return { g, k: n - c - 1 };
}

export function pieceDimensions(coords: CellCoord[]): [number, number] {
  const h = Math.max(...coords.map((x) => x[0])) + 1;
  const w = Math.max(...coords.map((x) => x[1])) + 1;
  return [h, w];
}

export function fitsOnBoard(
  board: number[],
  coords: CellCoord[],
  r0: number,
  c0: number
): boolean {
  return coords.every(([a, b]) => {
    const r = r0 + a;
    const c = c0 + b;
    return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && board[r * GRID_SIZE + c] < 0;
  });
}

export function canPlacePiece(board: number[], piece: Piece): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (fitsOnBoard(board, piece.c, r, c)) return true;
    }
  }
  return false;
}

export type ShapeComplexity = 'simple' | 'medium' | 'complex';

export interface ClassicDifficultyProfile {
  score: number;
  progress: number;
  tierLabel: string;
  weights: Record<ShapeComplexity, number>;
}

export function classifyShapeComplexity(coords: CellCoord[]): ShapeComplexity {
  if (coords.length <= 3) return 'simple';
  if (coords.length >= 5) return 'complex';
  return 'medium';
}

const SHAPE_BUCKETS: Record<ShapeComplexity, CellCoord[][]> = {
  simple: SHAPES.filter((s) => classifyShapeComplexity(s) === 'simple'),
  medium: SHAPES.filter((s) => classifyShapeComplexity(s) === 'medium'),
  complex: SHAPES.filter((s) => classifyShapeComplexity(s) === 'complex'),
};

export function getClassicDifficultyProfile(
  score: number
): ClassicDifficultyProfile {
  const safeScore = Math.max(0, Number.isFinite(score) ? score : 0);
  const progress = Math.min(1, safeScore / 2500);
  const simple = Number((0.46 - 0.3 * progress).toFixed(4));
  const complex = Number((0.1 + 0.34 * progress).toFixed(4));
  const medium = Number((1 - simple - complex).toFixed(4));

  const tierLabel =
    safeScore < 400
      ? 'Warmup'
      : safeScore < 1000
      ? 'Rising'
      : safeScore < 1800
      ? 'Intense'
      : 'Master';

  return {
    score: safeScore,
    progress,
    tierLabel,
    weights: { simple, medium, complex },
  };
}

export function pickShapeForClassicScore(
  score: number,
  rng: () => number = Math.random
): CellCoord[] {
  const { weights } = getClassicDifficultyProfile(score);
  const roll = rng();
  let tier: ShapeComplexity = 'medium';
  if (roll < weights.simple) {
    tier = 'simple';
  } else if (roll < weights.simple + weights.complex) {
    tier = 'complex';
  }
  const pool = SHAPE_BUCKETS[tier];
  const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[idx];
}

export function createRandomPiece(
  mode: GameMode,
  lv: LevelDef | null,
  score = 0,
  rng: () => number = Math.random
): Piece {
  const c =
    mode === 'classic'
      ? pickShapeForClassicScore(score, rng)
      : SHAPES[Math.min(SHAPES.length - 1, Math.floor(rng() * SHAPES.length))];
  const k = Math.min(5, Math.floor(rng() * 6));
  const p: Piece = { c, k };
  if (mode === 'level' && lv && lv.type === 'item' && rng() < 0.4) {
    p.it = lv.ik + 1;
    p.ii = Math.min(c.length - 1, Math.floor(rng() * c.length));
  }
  return p;
}
