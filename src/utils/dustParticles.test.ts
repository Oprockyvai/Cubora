import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDustParticles,
  normalizeOrientationTilt,
  stepDustParticles,
} from './dustParticles';

test('createDustParticles creates requested count within viewport bounds', () => {
  const particles = createDustParticles(30, 400, 800);
  assert.equal(particles.length, 30);
  for (const p of particles) {
    assert.ok(p.x >= 0 && p.x <= 400);
    assert.ok(p.y >= 0 && p.y <= 800);
    assert.ok(p.r >= 1 && p.r <= 4);
  }
});

test('stepDustParticles reacts to touch/pointer proximity and tilt', () => {
  const particles = createDustParticles(1, 400, 800, undefined, () => 0.5);
  particles[0].x = 220;
  particles[0].y = 400;
  particles[0].vx = 0;
  particles[0].vy = 0;

  stepDustParticles(
    particles,
    400,
    800,
    { pointerX: 200, pointerY: 400, pointerActive: true, tiltX: 0, tiltY: 0 },
    0,
    1
  );

  // Pointer at x=200 should gently push particle at x=220 to the right
  assert.ok(particles[0].x > 220);

  const tilt = normalizeOrientationTilt(45, 70);
  assert.ok(tilt.tiltX > 0.35);
  assert.ok(tilt.tiltY > 0.35);
});
