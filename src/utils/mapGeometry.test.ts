import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMED_MAPS, getThemedMapById } from '../data/maps';
import {
  buildCatmullRomPath,
  minNodeDistancePx,
  projectMapPoints,
} from './mapGeometry';

test('THEMED_MAPS defines Crystal Valley, Cloud City, Volcano, and Abyss with contiguous level ranges', () => {
  const ids = THEMED_MAPS.map((m) => m.id);
  assert.deepEqual(ids, ['crystal-valley', 'cloud-city', 'volcano', 'abyss']);

  let expectedStart = 1;
  for (const map of THEMED_MAPS) {
    assert.equal(map.startLevel, expectedStart);
    assert.equal(map.endLevel, expectedStart + map.pts.length - 1);
    assert.ok(map.roadStyle.roadColor.length > 0);
    assert.ok(map.roadStyle.curbColor.length > 0);
    expectedStart = map.endLevel + 1;
  }

  assert.equal(expectedStart - 1, 83);
  assert.equal(getThemedMapById('volcano').name, 'Volcano');
});

test('all themed maps maintain distinct coordinate layouts with clean node spacing on mobile (390px)', () => {
  const W2 = 390;
  const IW = W2 * 1.12;
  const Hs = Math.round(IW * 1.48);

  const layoutFingerprints = new Set<string>();

  for (const map of THEMED_MAPS) {
    const projected = projectMapPoints(map.pts, W2, IW, Hs, 0, map.startLevel);
    assert.equal(projected.length, map.pts.length);

    // Every node stays inside visible central play corridor away from edges
    for (const pt of projected) {
      assert.ok(pt.x >= 50 && pt.x <= W2 - 50, `${map.id} x=${pt.x} out of safe bounds`);
      assert.ok(pt.y >= 40 && pt.y <= Hs - 40, `${map.id} y=${pt.y} out of safe bounds`);
    }

    // No two nodes collide or crowd each other
    const minDist = minNodeDistancePx(projected);
    assert.ok(minDist >= 46, `${map.id} min node distance ${minDist.toFixed(1)}px < 46px`);

    // Each map has a distinct coordinate signature
    const fp = map.pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('|');
    assert.equal(layoutFingerprints.has(fp), false, `${map.id} duplicated layout`);
    layoutFingerprints.add(fp);
  }
});

test('buildCatmullRomPath produces smooth cubic Bezier curves passing through every waypoint', () => {
  const map = getThemedMapById('cloud-city');
  const projected = projectMapPoints(map.pts, 390, 436.8, 646, 0, map.startLevel);
  const path = buildCatmullRomPath(projected);

  assert.ok(path.startsWith('M '));
  const cubicSegments = path.match(/ C /g)?.length ?? 0;
  assert.equal(cubicSegments, projected.length - 1);

  const last = projected[projected.length - 1];
  assert.ok(path.endsWith(`${last.x.toFixed(1)} ${last.y.toFixed(1)}`));
});
