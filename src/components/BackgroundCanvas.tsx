import React, { useEffect, useRef } from 'react';
import { DEFAULT_COLORS } from '../data/constants';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  dur: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  square: boolean;
}

class FxPool {
  public reducedMotion = false;
  public palette: string[] = [...DEFAULT_COLORS];
  public particles: Particle[] = [];
  public width = 0;
  public height = 0;

  public spawnBurst(x: number, y: number, colorIdx: number): void {
    if (this.reducedMotion || this.particles.length > 360) return;
    const col =
      this.palette[colorIdx >= 0 ? colorIdx % this.palette.length : 0] ||
      DEFAULT_COLORS[0];
    for (let k = 0; k < 8; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = 130 + Math.random() * 310;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 110,
        life: 1,
        dur: 0.58 + Math.random() * 0.45,
        size: 3 + Math.random() * 6.5,
        rot: Math.random() * 6,
        vrot: (Math.random() - 0.5) * 14,
        color: Math.random() < 0.25 ? '#ffffff' : col,
        square: Math.random() < 0.55,
      });
    }
  }

  public spawnHammerImpact(x: number, y: number, colorIdx: number): void {
    if (this.reducedMotion || this.particles.length > 380) return;
    const col =
      this.palette[colorIdx >= 0 ? colorIdx % this.palette.length : 0] ||
      DEFAULT_COLORS[0];
    const sparks = ['#fff6c4', '#ffc845', '#ff8c38', col];
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const v = 170 + Math.random() * 340;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 90,
        life: 1,
        dur: 0.45 + Math.random() * 0.35,
        size: 3.5 + Math.random() * 6,
        rot: Math.random() * 6,
        vrot: (Math.random() - 0.5) * 18,
        color: sparks[k % sparks.length],
        square: k % 3 !== 0,
      });
    }
  }

  public spawnBoomExplosion(x: number, y: number): void {
    if (this.reducedMotion || this.particles.length > 400) return;
    const fire = ['#fff5bd', '#ffc845', '#ff7b29', '#ff3d5e', '#ffffff'];
    for (let k = 0; k < 34; k++) {
      const a = (k / 34) * Math.PI * 2 + (Math.random() - 0.5) * 0.22;
      const v = 160 + Math.random() * 420;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 105,
        life: 1,
        dur: 0.52 + Math.random() * 0.48,
        size: 4 + Math.random() * 8.5,
        rot: Math.random() * 6,
        vrot: (Math.random() - 0.5) * 20,
        color: fire[k % fire.length],
        square: k % 2 === 0,
      });
    }
  }

  public spawnColorNova(x: number, y: number): void {
    if (this.reducedMotion || this.particles.length > 380) return;
    const cols = this.palette.length >= 6 ? this.palette : DEFAULT_COLORS;
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2;
      const v = 150 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 80,
        life: 1,
        dur: 0.5 + Math.random() * 0.4,
        size: 3.5 + Math.random() * 6.5,
        rot: Math.random() * 6,
        vrot: (Math.random() - 0.5) * 16,
        color: k % 4 === 0 ? '#ffffff' : cols[k % cols.length],
        square: k % 2 === 1,
      });
    }
  }

  public spawnConfetti(): void {
    if (this.reducedMotion) return;
    const cols = this.palette.length >= 6 ? this.palette : DEFAULT_COLORS;
    const cx = (this.width || window.innerWidth) / 2;
    const cy = (this.height || window.innerHeight) * 0.35;
    for (let k = 0; k < 76; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = 150 + Math.random() * 430;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 280,
        life: 1,
        dur: 1.05 + Math.random() * 0.85,
        size: 5 + Math.random() * 7.5,
        rot: Math.random() * 6,
        vrot: (Math.random() - 0.5) * 16,
        color: cols[k % cols.length],
        square: true,
      });
    }
  }

  public spawnHeartShatter(x: number, y: number): void {
    if (this.reducedMotion) return;
    const cols = ['#ff3d5e', '#ff8aa0', '#b3112f', '#ffffff'];
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = 140 + Math.random() * 400;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 160,
        life: 1,
        dur: 0.85 + Math.random() * 0.6,
        size: 4 + Math.random() * 8.5,
        rot: Math.random() * 6,
        vrot: (Math.random() - 0.5) * 16,
        color: cols[k % cols.length],
        square: Math.random() < 0.7,
      });
    }
  }
}

export const fxPool = new FxPool();

export const BackgroundCanvas: React.FC = () => {
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const fxRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const bgc = bgRef.current;
    const fxc = fxRef.current;
    if (!bgc || !fxc) return;

    const bx = bgc.getContext('2d', { alpha: true });
    const fx = fxc.getContext('2d', { alpha: true });
    if (!bx || !fx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    let DPR = Math.min(1.5, window.devicePixelRatio || 1);

    const fit = () => {
      DPR = Math.min(1.5, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      fxPool.width = W;
      fxPool.height = H;
      // Ambient dots are soft & translucent, so a 1x backing store is visually identical
      // and costs ~2x less fill-rate than the sharp FX canvas.
      bgc.width = Math.round(W);
      bgc.height = Math.round(H);
      fxc.width = Math.round(W * DPR);
      fxc.height = Math.round(H * DPR);
    };

    fit();
    window.addEventListener('resize', fit);

    // Pre-grouped by color index for fast batched rendering on mobile WebView
    const dots = Array.from({ length: 24 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.1 + Math.random() * 2.2,
      s: 0.02 + Math.random() * 0.04,
      colorIdx: i % DEFAULT_COLORS.length,
      a: 0.16 + (i % 4) * 0.06,
    }));

    let rafId = 0;
    let last = performance.now();
    let lastBg = last;
    let frameNum = 0;
    let gameplayVisible = false;
    let fxDirty = false;
    let bgDirty = false;

    const loop = (now: number) => {
      rafId = window.requestAnimationFrame(loop);
      if (document.hidden) {
        last = now;
        lastBg = now;
        return;
      }

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frameNum++;

      // App toggles this attribute. (A DOM query here walked the whole document, which
      // includes the huge map SVG, and caused a hitch every ~20 frames.)
      gameplayVisible = document.body.hasAttribute('data-ambient');

      // Render ambient dots at ~30fps only while actively playing, and never while a
      // block is being dragged (keeps the main thread free for pointer tracking).
      const dragging = document.body.hasAttribute('data-drag');
      if (dragging) {
        lastBg = now; // freeze the ambient layer in place; no clear, no flicker
      } else if (gameplayVisible && !fxPool.reducedMotion) {
        if (frameNum % 2 === 0) {
          const d2 = Math.min(0.1, (now - lastBg) / 1000);
          lastBg = now;
          bgDirty = true;
          bx.setTransform(1, 0, 0, 1, 0, 0);
          bx.clearRect(0, 0, W, H);
          const pal = fxPool.palette.length ? fxPool.palette : DEFAULT_COLORS;
          for (let ci = 0; ci < pal.length; ci++) {
            bx.fillStyle = pal[ci];
            bx.globalAlpha = 0.22;
            bx.beginPath();
            for (let i = ci; i < dots.length; i += pal.length) {
              const d = dots[i];
              d.y -= d.s * d2;
              if (d.y < -0.02) {
                d.y = 1.02;
                d.x = Math.random();
              }
              const px = d.x * W;
              const py = d.y * H;
              bx.moveTo(px + d.r, py);
              bx.arc(px, py, d.r, 0, Math.PI * 2);
            }
            bx.fill();
          }
          bx.globalAlpha = 1;
        }
      } else if (bgDirty) {
        bx.setTransform(1, 0, 0, 1, 0, 0);
        bx.clearRect(0, 0, bgc.width, bgc.height);
        bgDirty = false;
      }

      const parts = fxPool.particles;
      if (parts.length > 0) {
        fxDirty = true;
        fx.setTransform(DPR, 0, 0, DPR, 0, 0);
        fx.clearRect(0, 0, W, H);
        fx.globalCompositeOperation = 'lighter';

        let writeIdx = 0;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          p.life -= dt / p.dur;
          if (p.life <= 0) continue;
          p.vy += 740 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vrot * dt;

          fx.globalAlpha = Math.max(0, p.life);
          fx.fillStyle = p.color;
          if (p.square) {
            const cos = Math.cos(p.rot);
            const sin = Math.sin(p.rot);
            fx.setTransform(DPR * cos, DPR * sin, -DPR * sin, DPR * cos, p.x * DPR, p.y * DPR);
            fx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            fx.setTransform(DPR, 0, 0, DPR, 0, 0);
          } else {
            fx.beginPath();
            fx.arc(p.x, p.y, Math.max(1, (p.size / 2) * p.life + 1), 0, Math.PI * 2);
            fx.fill();
          }
          parts[writeIdx++] = p;
        }
        parts.length = writeIdx;
        fx.globalCompositeOperation = 'source-over';
        fx.globalAlpha = 1;
      } else if (fxDirty) {
        fx.setTransform(1, 0, 0, 1, 0, 0);
        fx.clearRect(0, 0, fxc.width, fxc.height);
        fxDirty = false;
      }
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', fit);
    };
  }, []);

  return (
    <>
      <canvas id="bg" ref={bgRef} aria-hidden="true" />
      <canvas id="fx" ref={fxRef} aria-hidden="true" />
    </>
  );
};
