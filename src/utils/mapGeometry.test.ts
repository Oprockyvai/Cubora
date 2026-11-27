import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMED_MAPS, getThemedMapById } from '../data/maps';
import {
  buildBridgeSegment,
  buildCatmullRomEdge,
  buildCatmullRomPath,
  buildUnlockEdgePath,
  computeRealmStarStats,
  findStreamCrossings,
  minNodeDistancePx,
  projectMapPoints,
  sampleCubicBridgeStations,
  sampleSplineStations,
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
    assert.ok(map.biome.skyTop.length > 0);
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

test('buildBridgeSegment seamlessly connects adjacent realms vertically with safe clearance', () => {
  const W2 = 390;
  const IW = W2 * 1.12;
  const Hs = Math.round(IW * 1.48);
  const totalHeight = THEMED_MAPS.length * Hs + 140;

  let lv = 1;
  const sectionsPts = THEMED_MAPS.map((m, idx) => {
    const sectionTop = totalHeight - 86 - (idx + 1) * Hs;
    const pts = projectMapPoints(m.pts, W2, IW, Hs, sectionTop, lv);
    lv += m.pts.length;
    return pts;
  });

  for (let i = 0; i < sectionsPts.length - 1; i++) {
    const exitPt = sectionsPts[i][sectionsPts[i].length - 1];
    const entryPt = sectionsPts[i + 1][0];
    const bridge = buildBridgeSegment(exitPt, entryPt);

    assert.ok(bridge.path.startsWith(`M ${exitPt.x.toFixed(1)} ${exitPt.y.toFixed(1)} C `));
    assert.ok(bridge.path.endsWith(`${entryPt.x.toFixed(1)} ${entryPt.y.toFixed(1)}`));
    assert.ok(bridge.midY < exitPt.y && bridge.midY > entryPt.y, 'bridge midpoint sits cleanly between realms');
    assert.ok(Math.abs(exitPt.y - entryPt.y) >= 85, 'adjacent realm boundary leaves clean portal clearance');
  }
});

test('buildCatmullRomEdge and buildUnlockEdgePath match intra-realm and cross-realm bridge paths cleanly', () => {
  const W2 = 390;
  const IW = W2 * 1.12;
  const Hs = Math.round(IW * 1.48);
  const totalHeight = THEMED_MAPS.length * Hs + 172;

  let lv = 1;
  const sections = THEMED_MAPS.map((m, idx) => {
    const sectionTop = totalHeight - 124 - (idx + 1) * Hs;
    const pts = projectMapPoints(m.pts, W2, IW, Hs, sectionTop, lv);
    lv += m.pts.length;
    return { pts };
  });

  const bridges = [];
  for (let i = 0; i < sections.length - 1; i++) {
    const from = sections[i].pts[sections[i].pts.length - 1];
    const to = sections[i + 1].pts[0];
    bridges.push({ startLv: to.n, bridge: buildBridgeSegment(from, to) });
  }

  // Intra-realm edge (Level 1 -> Level 2)
  const edge12 = buildUnlockEdgePath(sections, bridges, 1, 2);
  assert.ok(edge12);
  assert.equal(edge12.isBridge, false);
  assert.equal(edge12.fromPt.n, 1);
  assert.equal(edge12.toPt.n, 2);
  assert.equal(edge12.path, buildCatmullRomEdge(sections[0].pts, 0));

  // Cross-realm bridge unlock edge (Level 17 -> Level 18)
  const edge1718 = buildUnlockEdgePath(sections, bridges, 17, 18);
  assert.ok(edge1718);
  assert.equal(edge1718.isBridge, true);
  assert.equal(edge1718.fromPt.n, 17);
  assert.equal(edge1718.toPt.n, 18);
  assert.equal(edge1718.path, bridges[0].bridge.path);

  // Non-adjacent skip returns null
  assert.equal(buildUnlockEdgePath(sections, bridges, 1, 4), null);
});

test('sampleSplineStations and sampleCubicBridgeStations produce unit normals and smooth coverage', () => {
  const map = getThemedMapById('crystal-valley');
  const projected = projectMapPoints(map.pts, 390, 436.8, 646, 0, map.startLevel);
  const stations = sampleSplineStations(projected, 16);

  assert.ok(stations.length >= 40, `expected >= 40 road stations, got ${stations.length}`);
  assert.ok(Math.hypot(stations[0].x - projected[0].x, stations[0].y - projected[0].y) < 1);
  const lastStation = stations[stations.length - 1];
  const lastPt = projected[projected.length - 1];
  assert.ok(Math.hypot(lastStation.x - lastPt.x, lastStation.y - lastPt.y) < 1);

  for (const st of stations) {
    assert.ok(Math.abs(Math.hypot(st.nx, st.ny) - 1) < 1e-6);
    assert.ok(Number.isFinite(st.angleDeg));
  }

  const nextMap = getThemedMapById('cloud-city');
  const nextProjected = projectMapPoints(nextMap.pts, 390, 436.8, 646, -646, nextMap.startLevel);
  const bridge = buildBridgeSegment(lastPt, nextProjected[0]);
  const planks = sampleCubicBridgeStations(bridge, 14);
  assert.ok(planks.length >= 4);
  for (const p of planks) {
    assert.ok(Math.abs(Math.hypot(p.nx, p.ny) - 1) < 1e-6);
  }
});

test('computeRealmStarStats accurately tallies realm stars and cleared level counts', () => {
  const stats = computeRealmStarStats(
    { 1: 3, 2: 2, 3: 1, 17: 3, 18: 3 },
    1,
    17
  );
  assert.equal(stats.totalLevels, 17);
  assert.equal(stats.maxStars, 51);
  assert.equal(stats.clearedLevels, 4);
  assert.equal(stats.earnedStars, 9);
});

test('findStreamCrossings locates road-over-river intersections inside Crystal Valley', () => {
  const map = getThemedMapById('crystal-valley');
  const W = 390;
  const IW = W * 1.12;
  const H = Math.round(IW * 1.48);
  const projected = projectMapPoints(map.pts, W, IW, H, 0, map.startLevel);
  const stations = sampleSplineStations(projected, 14);
  const crossings = findStreamCrossings(stations, [
    {
      p0x: -20,
      p0y: H * 0.31,
      c1x: W * 0.32,
      c1y: H * 0.27,
      c2x: W * 0.68,
      c2y: H * 0.42,
      p3x: W + 20,
      p3y: H * 0.37,
    },
    {
      p0x: W + 20,
      p0y: H * 0.77,
      c1x: W * 0.64,
      c1y: H * 0.71,
      c2x: W * 0.34,
      c2y: H * 0.86,
      p3x: -20,
      p3y: H * 0.81,
    },
  ]);

  assert.equal(crossings.length, 2);
  for (const cr of crossings) {
    assert.ok(Number.isFinite(cr.x) && Number.isFinite(cr.y));
  }
});
