export interface Point2D {
  x: number;
  y: number;
  n: number;
}

export interface BridgeSegment {
  path: string;
  midX: number;
  midY: number;
  from: Point2D;
  to: Point2D;
}

export interface SectionPathInput {
  pts: Point2D[];
}

export interface BridgePathInput {
  startLv: number;
  bridge: BridgeSegment;
}

/**
 * Computes cubic Bezier control points for segment [i -> i + 1] in a Catmull-Rom spline.
 */
export function getCatmullRomControlPoints(
  points: Pick<Point2D, 'x' | 'y'>[],
  index: number,
  tension = 0.45
): { c1x: number; c1y: number; c2x: number; c2y: number } {
  const factor = tension / 3;
  const p0 = index === 0 ? points[0] : points[index - 1];
  const p1 = points[index];
  const p2 = points[index + 1];
  const p3 =
    index + 2 < points.length ? points[index + 2] : points[points.length - 1];

  return {
    c1x: p1.x + (p2.x - p0.x) * factor,
    c1y: p1.y + (p2.y - p0.y) * factor,
    c2x: p2.x - (p3.x - p1.x) * factor,
    c2y: p2.y - (p3.y - p1.y) * factor,
  };
}

/**
 * Generates a smooth C1-continuous Catmull-Rom cubic Bezier SVG path
 * passing directly through every coordinate point in `points`.
 */
export function buildCatmullRomPath(
  points: Pick<Point2D, 'x' | 'y'>[],
  tension = 0.45
): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p2 = points[i + 1];
    const { c1x, c1y, c2x, c2y } = getCatmullRomControlPoints(points, i, tension);
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

/**
 * Extracts the exact single cubic Bezier SVG path connecting `points[index]` to `points[index + 1]`
 * with matching tangent continuity to `buildCatmullRomPath(points)`.
 */
export function buildCatmullRomEdge(
  points: Pick<Point2D, 'x' | 'y'>[],
  index: number,
  tension = 0.45
): string {
  if (index < 0 || index >= points.length - 1) return '';
  const p1 = points[index];
  const p2 = points[index + 1];
  if (points.length === 2) {
    return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  const { c1x, c1y, c2x, c2y } = getCatmullRomControlPoints(points, index, tension);
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

/**
 * Builds the exact SVG path connecting `fromLevel` to `toLevel` across either a
 * single realm spline or an inter-realm bridge transition.
 */
export function buildUnlockEdgePath(
  sections: SectionPathInput[],
  bridges: BridgePathInput[],
  fromLevel: number,
  toLevel: number
): { path: string; fromPt: Point2D; toPt: Point2D; isBridge: boolean } | null {
  if (toLevel !== fromLevel + 1) return null;

  for (const sec of sections) {
    const idx = sec.pts.findIndex((p) => p.n === fromLevel);
    if (idx !== -1 && idx + 1 < sec.pts.length && sec.pts[idx + 1].n === toLevel) {
      return {
        path: buildCatmullRomEdge(sec.pts, idx),
        fromPt: sec.pts[idx],
        toPt: sec.pts[idx + 1],
        isBridge: false,
      };
    }
  }

  for (const b of bridges) {
    if (b.startLv === toLevel && b.bridge.from.n === fromLevel && b.bridge.to.n === toLevel) {
      return {
        path: b.bridge.path,
        fromPt: b.bridge.from,
        toPt: b.bridge.to,
        isBridge: true,
      };
    }
  }

  return null;
}

/**
 * Builds a vertical S-curve bridge path seamlessly connecting the exit node
 * of one realm (`from`) into the entry node of the next realm (`to`) above it.
 */
export function buildBridgeSegment(from: Point2D, to: Point2D): BridgeSegment {
  const dy = to.y - from.y; // negative because map climbs upward
  const c1x = from.x;
  const c1y = from.y + dy * 0.46;
  const c2x = to.x;
  const c2y = to.y - dy * 0.46;

  // Evaluate cubic Bezier at t = 0.5 for portal/gate placement
  const midX = 0.125 * from.x + 0.375 * c1x + 0.375 * c2x + 0.125 * to.x;
  const midY = 0.125 * from.y + 0.375 * c1y + 0.375 * c2y + 0.125 * to.y;

  const path = `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;

  return {
    path,
    midX,
    midY,
    from,
    to,
  };
}

/**
 * Maps normalized map coordinates [0..1, 0..1] onto container pixel space.
 */
export function projectMapPoints(
  normalizedPts: [number, number][],
  containerWidth: number,
  imageWidth: number,
  sectionHeight: number,
  sectionTop: number,
  startLevel: number
): Point2D[] {
  return normalizedPts.map(([nx, ny], idx) => ({
    x: containerWidth / 2 + (nx - 0.5) * imageWidth,
    y: sectionTop + ny * sectionHeight,
    n: startLevel + idx,
  }));
}

/**
 * Computes minimum pairwise Euclidean distance among projected points.
 */
export function minNodeDistancePx(points: Pick<Point2D, 'x' | 'y'>[]): number {
  let min = Infinity;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist < min) min = dist;
    }
  }
  return min;
}

export interface RoadStation {
  x: number;
  y: number;
  angleDeg: number;
  nx: number;
  ny: number;
  idx: number;
}

function evalCubicPointAndTangent(
  p0x: number,
  p0y: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  p3x: number,
  p3y: number,
  t: number
): { x: number; y: number; tx: number; ty: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  const x =
    mt2 * mt * p0x +
    3 * mt2 * t * c1x +
    3 * mt * t2 * c2x +
    t2 * t * p3x;
  const y =
    mt2 * mt * p0y +
    3 * mt2 * t * c1y +
    3 * mt * t2 * c2y +
    t2 * t * p3y;

  const tx =
    3 * mt2 * (c1x - p0x) +
    6 * mt * t * (c2x - c1x) +
    3 * t2 * (p3x - c2x);
  const ty =
    3 * mt2 * (c1y - p0y) +
    6 * mt * t * (c2y - c1y) +
    3 * t2 * (p3y - c2y);

  return { x, y, tx, ty };
}

function sampleCubicSpan(
  p0x: number,
  p0y: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  p3x: number,
  p3y: number,
  stepPx: number,
  startIdx: number,
  skipEndpoints: boolean
): RoadStation[] {
  // Approximate chord-poly arc length over 10 sub-steps
  let approxLen = 0;
  let prevX = p0x;
  let prevY = p0y;
  for (let s = 1; s <= 10; s++) {
    const pt = evalCubicPointAndTangent(
      p0x,
      p0y,
      c1x,
      c1y,
      c2x,
      c2y,
      p3x,
      p3y,
      s / 10
    );
    approxLen += Math.hypot(pt.x - prevX, pt.y - prevY);
    prevX = pt.x;
    prevY = pt.y;
  }

  const count = Math.max(2, Math.round(approxLen / Math.max(6, stepPx)));
  const stations: RoadStation[] = [];
  const startStep = skipEndpoints ? 1 : 0;
  const endStep = skipEndpoints ? count - 1 : count;

  for (let s = startStep; s <= endStep; s++) {
    const t = s / count;
    const { x, y, tx, ty } = evalCubicPointAndTangent(
      p0x,
      p0y,
      c1x,
      c1y,
      c2x,
      c2y,
      p3x,
      p3y,
      t
    );
    const len = Math.hypot(tx, ty) || 1;
    const ux = tx / len;
    const uy = ty / len;
    stations.push({
      x,
      y,
      angleDeg: (Math.atan2(uy, ux) * 180) / Math.PI,
      nx: -uy,
      ny: ux,
      idx: startIdx + stations.length,
    });
  }

  return stations;
}

/**
 * Samples evenly spaced road stations (with tangent angle & unit normal) along a Catmull-Rom spline
 * for rendering individual perspective-oriented cobblestones and roadside lanterns.
 */
export function sampleSplineStations(
  points: Pick<Point2D, 'x' | 'y'>[],
  stepPx = 14,
  tension = 0.45
): RoadStation[] {
  if (points.length < 2) return [];
  const out: RoadStation[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const { c1x, c1y, c2x, c2y } =
      points.length === 2
        ? {
            c1x: p1.x + (p2.x - p1.x) / 3,
            c1y: p1.y + (p2.y - p1.y) / 3,
            c2x: p1.x + ((p2.x - p1.x) * 2) / 3,
            c2y: p1.y + ((p2.y - p1.y) * 2) / 3,
          }
        : getCatmullRomControlPoints(points, i, tension);

    const span = sampleCubicSpan(
      p1.x,
      p1.y,
      c1x,
      c1y,
      c2x,
      c2y,
      p2.x,
      p2.y,
      stepPx,
      out.length,
      false
    );
    // Avoid duplicating shared waypoints between consecutive segments
    if (i > 0 && span.length > 0) {
      span.shift();
      span.forEach((st, k) => {
        st.idx = out.length + k;
      });
    }
    out.push(...span);
  }

  return out;
}

/**
 * Samples perpendicular plank stations along an inter-realm S-curve bridge.
 */
export function sampleCubicBridgeStations(
  bridge: BridgeSegment,
  stepPx = 12
): RoadStation[] {
  const { from, to } = bridge;
  const dy = to.y - from.y;
  const c1x = from.x;
  const c1y = from.y + dy * 0.46;
  const c2x = to.x;
  const c2y = to.y - dy * 0.46;
  return sampleCubicSpan(
    from.x,
    from.y,
    c1x,
    c1y,
    c2x,
    c2y,
    to.x,
    to.y,
    stepPx,
    0,
    true
  );
}

export interface RealmStarStats {
  earnedStars: number;
  maxStars: number;
  clearedLevels: number;
  totalLevels: number;
}

/**
 * Computes per-realm star and level completion progress for realm gateway banners.
 */
export function computeRealmStarStats(
  starsMap: Record<number, number>,
  startLv: number,
  endLv: number
): RealmStarStats {
  const totalLevels = Math.max(0, endLv - startLv + 1);
  let earnedStars = 0;
  let clearedLevels = 0;
  for (let lv = startLv; lv <= endLv; lv++) {
    const s = Math.max(0, Math.min(3, starsMap[lv] || 0));
    if (s > 0) {
      earnedStars += s;
      clearedLevels++;
    }
  }
  return {
    earnedStars,
    maxStars: totalLevels * 3,
    clearedLevels,
    totalLevels,
  };
}

export interface CubicCurve2D {
  p0x: number;
  p0y: number;
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  p3x: number;
  p3y: number;
}

/**
 * Finds road station clusters where a biome road crosses an internal river or lava stream,
 * returning representative bridge anchor stations aligned to the road tangent.
 */
export function findStreamCrossings(
  stations: RoadStation[],
  curves: CubicCurve2D[],
  maxDistPx = 18
): RoadStation[] {
  if (stations.length === 0 || curves.length === 0) return [];
  const crossings: RoadStation[] = [];

  for (const cv of curves) {
    const samples: { x: number; y: number }[] = [];
    for (let s = 0; s <= 28; s++) {
      const pt = evalCubicPointAndTangent(
        cv.p0x,
        cv.p0y,
        cv.c1x,
        cv.c1y,
        cv.c2x,
        cv.c2y,
        cv.p3x,
        cv.p3y,
        s / 28
      );
      samples.push({ x: pt.x, y: pt.y });
    }

    let bestStation: RoadStation | null = null;
    let bestDist = maxDistPx;

    for (const st of stations) {
      for (const sm of samples) {
        const d = Math.hypot(st.x - sm.x, st.y - sm.y);
        if (d < bestDist) {
          bestDist = d;
          bestStation = st;
        }
      }
    }

    if (bestStation) {
      crossings.push(bestStation);
    }
  }

  return crossings;
}

