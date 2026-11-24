import test from 'node:test';
import assert from 'node:assert/strict';
import {
  capacityOfSections,
  classifyShapeComplexity,
  createRandomPiece,
  getClassicDifficultyProfile,
  getInitialMapSections,
  locateLevel,
  sectionsForLevel,
} from './levelLogic';
import { SHAPES, WORLDS } from '../data/constants';

test('getInitialMapSections loads at least all 4 worlds on level 1', () => {
  const initial = getInitialMapSections(1);
  assert.equal(initial, WORLDS.length);
  assert.equal(initial, 4);
});

test('getInitialMapSections expands beyond 4 worlds when unlocking higher levels', () => {
  const totalFourWorlds = capacityOfSections(4);
  assert.equal(totalFourWorlds, 83);
  assert.ok(getInitialMapSections(totalFourWorlds) > 4);
  assert.equal(sectionsForLevel(1), 1);
  assert.deepEqual(locateLevel(1), { g: 0, k: 0 });
  assert.deepEqual(locateLevel(18), { g: 1, k: 0 });
});

test('classifyShapeComplexity partitions all shapes into non-empty complexity tiers', () => {
  const counts = { simple: 0, medium: 0, complex: 0 };
  for (const s of SHAPES) {
    counts[classifyShapeComplexity(s)]++;
  }
  assert.ok(counts.simple > 0);
  assert.ok(counts.medium > 0);
  assert.ok(counts.complex > 0);
  assert.equal(counts.simple + counts.medium + counts.complex, SHAPES.length);
});

test('getClassicDifficultyProfile increases complex weight and decreases simple weight with score', () => {
  const p0 = getClassicDifficultyProfile(0);
  const p500 = getClassicDifficultyProfile(500);
  const p1500 = getClassicDifficultyProfile(1500);
  const p3000 = getClassicDifficultyProfile(3000);

  for (const prof of [p0, p500, p1500, p3000]) {
    const sum = prof.weights.simple + prof.weights.medium + prof.weights.complex;
    assert.ok(Math.abs(sum - 1) < 1e-6);
  }

  assert.ok(p500.weights.complex > p0.weights.complex);
  assert.ok(p1500.weights.complex > p500.weights.complex);
  assert.ok(p3000.weights.complex > p1500.weights.complex);

  assert.ok(p500.weights.simple < p0.weights.simple);
  assert.ok(p3000.weights.simple < p1500.weights.simple);
  assert.equal(p0.tierLabel, 'Warmup');
  assert.equal(p3000.tierLabel, 'Master');
});

test('createRandomPiece in Classic mode yields substantially more complex pieces at higher scores', () => {
  const makeRng = (seedInit: number) => {
    let s = seedInit >>> 0;
    return () => {
      s = (1664525 * s + 1013904223) >>> 0;
      return s / 0x100000000;
    };
  };

  const countComplexAt = (score: number) => {
    const rng = makeRng(42);
    let complexCount = 0;
    const total = 1000;
    for (let i = 0; i < total; i++) {
      const piece = createRandomPiece('classic', null, score, rng);
      if (classifyShapeComplexity(piece.c) === 'complex') complexCount++;
    }
    return complexCount;
  };

  const lowScoreComplex = countComplexAt(0);
  const midScoreComplex = countComplexAt(1250);
  const highScoreComplex = countComplexAt(3000);

  assert.ok(midScoreComplex > lowScoreComplex + 100);
  assert.ok(highScoreComplex > midScoreComplex + 100);
});
