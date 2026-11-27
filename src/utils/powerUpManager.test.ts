import assert from 'node:assert/strict';
import test from 'node:test';
import { GRID_SIZE } from '../data/constants';
import { Piece } from '../types/game';
import {
  applyBoomAt,
  applyColorBlastAt,
  applyHammerAt,
  canConsumePowerUp,
  consumePowerUpStock,
  createStarterInventory,
  createUndoSnapshot,
  findBestHintPlacement,
  getBoomAreaIndices,
  refillPowerUpWithGems,
  refreshTrayPieces,
} from './powerUpManager';

test('Hammer destroys only selected occupied cell and rejects empty/OOB cells', () => {
  const board = Array(64).fill(-1);
  const items = Array(64).fill(0);
  board[10] = 2;
  items[10] = 3;
  board[11] = 4;

  const emptyRes = applyHammerAt(board, items, 0);
  assert.equal(emptyRes.ok, false);
  assert.equal(emptyRes.reason, 'empty_cell');

  const oobRes = applyHammerAt(board, items, 99);
  assert.equal(oobRes.ok, false);
  assert.equal(oobRes.reason, 'out_of_bounds');

  const hitRes = applyHammerAt(board, items, 10);
  assert.equal(hitRes.ok, true);
  assert.deepEqual(hitRes.clearedCells, [10]);
  assert.equal(hitRes.board[10], -1);
  assert.equal(hitRes.boardItems[10], 0);
  assert.equal(hitRes.board[11], 4);
});

test('Boom clears 3x3 area centered safely at center, edge, and corner without OOB errors', () => {
  assert.equal(getBoomAreaIndices(0).length, 4);
  assert.equal(getBoomAreaIndices(4).length, 6);
  assert.equal(getBoomAreaIndices(27).length, 9);

  const board = Array(64).fill(1);
  const items = Array(64).fill(0);
  board[20] = -1; // empty inside 3x3

  const cornerRes = applyBoomAt(board, items, 0);
  assert.equal(cornerRes.ok, true);
  assert.equal(cornerRes.clearedCells.length, 4);
  assert.equal(cornerRes.board[0], -1);
  assert.equal(cornerRes.board[9], -1);
  assert.equal(cornerRes.board[18], 1);

  const emptyBoard = Array(64).fill(-1);
  const noTargetsRes = applyBoomAt(emptyBoard, items, 27);
  assert.equal(noTargetsRes.ok, false);
  assert.equal(noTargetsRes.reason, 'no_targets');
});

test('Color Blast clears all matching color cells safely without disturbing others', () => {
  const board = Array(64).fill(-1);
  const items = Array(64).fill(0);
  board[0] = 3;
  board[17] = 3;
  board[42] = 3;
  board[5] = 1;

  const res = applyColorBlastAt(board, items, 17);
  assert.equal(res.ok, true);
  assert.equal(res.targetColor, 3);
  assert.deepEqual(res.clearedCells, [0, 17, 42]);
  assert.equal(res.board[0], -1);
  assert.equal(res.board[17], -1);
  assert.equal(res.board[42], -1);
  assert.equal(res.board[5], 1);
});

test('Move Refresh deals 3 pieces matching current mode rules cleanly', () => {
  const board = Array(64).fill(-1);
  const refreshed = refreshTrayPieces({
    board,
    mode: 'classic',
    lv: null,
    score: 500,
  });
  assert.equal(refreshed.length, 3);
  assert.ok(refreshed.every((p) => p !== null && p.c.length >= 1));
});

test('Undo snapshot isolates arrays and reverses board, pieces, score, and streak accurately', () => {
  const board = Array(64).fill(-1);
  board[0] = 2;
  const items = Array(64).fill(0);
  const pieces: (Piece | null)[] = [{ c: [[0, 0]], k: 1 }, null, null];
  const snap = createUndoSnapshot({
    board,
    boardItems: items,
    pieces,
    score: 140,
    streak: 2,
    moves: 15,
    lv: null,
    timeLeft: 90,
    linesClearedInRun: 3,
    runMaxCombo: 2,
    moveToken: 'm1',
  });

  // Mutate originals after snapshot
  board[0] = -1;
  pieces[0] = null;

  assert.equal(snap.board[0], 2);
  assert.equal(snap.score, 140);
  assert.equal(snap.streak, 2);
  assert.equal(snap.pieces[0]?.k, 1);
});

test('Hint finds legal placement using fitsOnBoard and returns null when board cannot fit any tray piece', () => {
  const board = Array(64).fill(-1);
  // Fill row 0 except cell (0, 7)
  for (let c = 0; c < GRID_SIZE - 1; c++) board[c] = 1;

  const pieces: (Piece | null)[] = [
    { c: [[0, 0], [0, 1]], k: 0 },
    { c: [[0, 0]], k: 4 },
    null,
  ];

  const hint = findBestHintPlacement(board, pieces);
  assert.ok(hint !== null);
  assert.equal(hint.slotIdx, 1);
  assert.equal(hint.r0, 0);
  assert.equal(hint.c0, 7);
  assert.equal(hint.linesCleared, 1);

  const fullBoard = Array(64).fill(2);
  assert.equal(findBestHintPlacement(fullBoard, pieces), null);
});

test('Inventory guards reject negative stock, locked power-ups, and insufficient gems', () => {
  const inv = createStarterInventory();
  assert.equal(canConsumePowerUp(inv, 'colorBlast', 1).reason, 'locked');
  assert.equal(canConsumePowerUp(inv, 'colorBlast', 2).ok, true);

  const first = consumePowerUpStock(inv, 'boom');
  assert.equal(first.ok, true);
  assert.equal(first.inventory.boom, 0);

  const emptyAttempt = consumePowerUpStock(first.inventory, 'boom');
  assert.equal(emptyAttempt.ok, false);
  assert.equal(emptyAttempt.inventory.boom, 0);

  const poorRefill = refillPowerUpWithGems(first.inventory, 5, 'boom', 1);
  assert.equal(poorRefill.ok, false);
  assert.equal(poorRefill.reason, 'insufficient_gems');

  const richRefill = refillPowerUpWithGems(first.inventory, 50, 'boom', 1);
  assert.equal(richRefill.ok, true);
  assert.equal(richRefill.inventory.boom, 1);
  assert.equal(richRefill.gems, 28);
});
