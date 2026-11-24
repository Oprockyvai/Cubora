export interface DustParticle {
  id: number;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  ix: number;
  iy: number;
  phase: number;
  color: string;
  opacity: number;
}

export interface DustInteractionState {
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  tiltX: number;
  tiltY: number;
}

const DEFAULT_DUST_COLORS = [
  '#56dff7',
  '#b39bf7',
  '#ffc94a',
  '#f7768e',
  '#69e9a9',
] as const;

export function createDustParticles(
  count: number,
  width: number,
  height: number,
  palette: readonly string[] = DEFAULT_DUST_COLORS,
  rng: () => number = Math.random
): DustParticle[] {
  const safeW = Math.max(width, 1);
  const safeH = Math.max(height, 1);
  const colors = palette.length > 0 ? palette : DEFAULT_DUST_COLORS;
  const particles: DustParticle[] = [];

  for (let i = 0; i < count; i++) {
    const speedFactor = 0.45 + rng() * 0.75;
    particles.push({
      id: i,
      x: rng() * safeW,
      y: rng() * safeH,
      r: 1.2 + rng() * 2.6,
      vx: (rng() - 0.5) * 0.24 * speedFactor,
      vy: (-0.08 - rng() * 0.16) * speedFactor,
      ix: 0,
      iy: 0,
      phase: rng() * Math.PI * 2,
      color: colors[i % colors.length],
      opacity: 0.24 + rng() * 0.5,
    });
  }

  return particles;
}

export function normalizeOrientationTilt(
  gamma: number | null | undefined,
  beta: number | null | undefined
): { tiltX: number; tiltY: number } {
  const g = typeof gamma === 'number' && Number.isFinite(gamma) ? gamma : 0;
  const b = typeof beta === 'number' && Number.isFinite(beta) ? beta : 0;
  const clampedG = Math.max(-45, Math.min(45, g));
  // Natural handheld resting pitch is around ~35 deg; center slightly around it.
  const centeredB = Math.max(-45, Math.min(45, b - 25));
  return {
    tiltX: (clampedG / 45) * 0.42,
    tiltY: (centeredB / 45) * 0.42,
  };
}

export function stepDustParticles(
  particles: DustParticle[],
  width: number,
  height: number,
  interaction: DustInteractionState,
  elapsedMs: number,
  dtScale = 1
): void {
  const safeW = Math.max(width, 1);
  const safeH = Math.max(height, 1);
  const margin = 12;
  const influenceRadius = 125;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const sway = Math.sin(elapsedMs * 0.0007 + p.phase) * 0.06;

    if (interaction.pointerActive) {
      const dx = p.x - interaction.pointerX;
      const dy = p.y - interaction.pointerY;
      const distSq = dx * dx + dy * dy;
      if (distSq > 0.0001 && distSq < influenceRadius * influenceRadius) {
        const dist = Math.sqrt(distSq);
        const force = ((influenceRadius - dist) / influenceRadius) * 0.52;
        p.ix += (dx / dist) * force * dtScale;
        p.iy += (dy / dist) * force * dtScale;
      }
    }

    p.ix *= 0.94;
    p.iy *= 0.94;

    p.x += (p.vx + sway + interaction.tiltX + p.ix) * dtScale;
    p.y += (p.vy + interaction.tiltY + p.iy) * dtScale;

    if (p.x < -margin) p.x = safeW + margin;
    else if (p.x > safeW + margin) p.x = -margin;

    if (p.y < -margin) p.y = safeH + margin;
    else if (p.y > safeH + margin) p.y = -margin;
  }
}
