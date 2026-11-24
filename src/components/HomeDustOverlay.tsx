import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  createDustParticles,
  DustInteractionState,
  normalizeOrientationTilt,
  stepDustParticles,
} from '../utils/dustParticles';

interface HomeDustOverlayProps {
  visible: boolean;
  reducedMotion: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const HomeDustOverlay: React.FC<HomeDustOverlayProps> = ({
  visible,
  reducedMotion,
  containerRef,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl || !visible) return;

    const svg = d3.select(svgEl);
    let width = containerEl.clientWidth || window.innerWidth || 390;
    let height = containerEl.clientHeight || window.innerHeight || 844;

    const particles = createDustParticles(38, width, height);

    const layer = svg
      .selectAll<SVGGElement, null>('g.dust-layer')
      .data([null])
      .join('g')
      .attr('class', 'dust-layer');

    const circles = layer
      .selectAll<SVGCircleElement, (typeof particles)[number]>('circle')
      .data(particles, (d) => String(d.id))
      .join('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', (d) => d.opacity)
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y);

    if (reducedMotion) {
      return () => {
        layer.selectAll('circle').remove();
      };
    }

    const interaction: DustInteractionState = {
      pointerX: -1000,
      pointerY: -1000,
      pointerActive: false,
      tiltX: 0,
      tiltY: 0,
    };
    let targetTiltX = 0;
    let targetTiltY = 0;

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = containerEl.getBoundingClientRect();
      interaction.pointerX = clientX - rect.left;
      interaction.pointerY = clientY - rect.top;
      interaction.pointerActive = true;
    };

    const clearPointer = () => {
      interaction.pointerActive = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      const next = normalizeOrientationTilt(e.gamma, e.beta);
      targetTiltX = next.tiltX;
      targetTiltY = next.tiltY;
    };

    const onResize = () => {
      width = containerEl.clientWidth || window.innerWidth || 390;
      height = containerEl.clientHeight || window.innerHeight || 844;
    };

    containerEl.addEventListener('pointermove', onPointerMove, { passive: true });
    containerEl.addEventListener('pointerdown', onPointerDown, { passive: true });
    containerEl.addEventListener('pointerleave', clearPointer, { passive: true });
    containerEl.addEventListener('touchstart', onTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', onTouchMove, { passive: true });
    containerEl.addEventListener('touchend', clearPointer, { passive: true });
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    window.addEventListener('resize', onResize);

    let lastElapsed = 0;
    const timer = d3.timer((elapsed) => {
      if (document.hidden) {
        lastElapsed = elapsed;
        return;
      }
      const rawDelta = elapsed - lastElapsed;
      if (lastElapsed && rawDelta < 32) {
        return;
      }
      const deltaMs = lastElapsed ? Math.min(64, rawDelta) : 33.33;
      lastElapsed = elapsed;
      const dtScale = deltaMs / 16.67;

      interaction.tiltX += (targetTiltX - interaction.tiltX) * 0.12;
      interaction.tiltY += (targetTiltY - interaction.tiltY) * 0.12;

      stepDustParticles(particles, width, height, interaction, elapsed, dtScale);

      circles.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
    });

    return () => {
      timer.stop();
      containerEl.removeEventListener('pointermove', onPointerMove);
      containerEl.removeEventListener('pointerdown', onPointerDown);
      containerEl.removeEventListener('pointerleave', clearPointer);
      containerEl.removeEventListener('touchstart', onTouchStart);
      containerEl.removeEventListener('touchmove', onTouchMove);
      containerEl.removeEventListener('touchend', clearPointer);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('resize', onResize);
    };
  }, [visible, reducedMotion, containerRef]);

  return (
    <svg
      ref={svgRef}
      id="d3-dust"
      className="hdust"
      aria-hidden="true"
    />
  );
};
