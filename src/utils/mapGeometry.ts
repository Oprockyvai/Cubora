export interface Point2D {
  x: number;
  y: number;
  n: number;
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
  const factor = tension / 3;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : points[points.length - 1];

    const c1x = p1.x + (p2.x - p0.x) * factor;
    const c1y = p1.y + (p2.y - p0.y) * factor;
    const c2x = p2.x - (p3.x - p1.x) * factor;
    const c2y = p2.y - (p3.y - p1.y) * factor;

    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
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
