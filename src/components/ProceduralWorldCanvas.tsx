import React, { useId } from 'react';
import { BiomePalette, ThemedMapId } from '../types/game';
import { BridgeSegment } from '../utils/mapGeometry';

export interface ProceduralSectionSpec {
  key: string;
  id: ThemedMapId;
  worldIdx: number;
  sectionTop: number;
  height: number;
  acc: string;
  biome: BiomePalette;
}

export interface ProceduralBridgeSpec {
  key: string;
  fromAcc: string;
  toAcc: string;
  fromName: string;
  toName: string;
  bridge: BridgeSegment;
}

interface ProceduralWorldCanvasProps {
  width: number;
  height: number;
  sections: ProceduralSectionSpec[];
  bridges: ProceduralBridgeSpec[];
}

function renderRealisticTree(
  x: number,
  y: number,
  scale: number,
  uid: string,
  swayClass: string,
  key: string | number
): React.ReactNode {
  return (
    <g key={key} transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Soft ambient ground shadow */}
      <ellipse cx={3} cy={15.5} rx={19} ry={5.8} fill="rgba(4, 20, 18, 0.38)" />
      {/* Root flare & bark trunk */}
      <path
        d="M -5.5 14.5 Q -3.2 7 -3 -4 L 3 -4 Q 3.2 7 5.5 14.5 Q 0 16.5 -5.5 14.5 Z"
        fill="#53321d"
      />
      <path d="M -2 14 L -1 -2 L 1.4 -2 L 2 14 Z" fill="#7c4f31" opacity={0.68} />
      {/* Gently swaying multi-lobe foliage crown */}
      <g className={swayClass}>
        <circle cx={-10.5} cy={-5.5} r={11.8} fill={`url(#treeShade-${uid})`} />
        <circle cx={10.5} cy={-4.5} r={10.8} fill={`url(#treeShade-${uid})`} />
        <circle cx={0} cy={-3.5} r={11.5} fill={`url(#treeShade-${uid})`} />
        <circle cx={-5.5} cy={-14} r={12.8} fill={`url(#treeLit-${uid})`} />
        <circle cx={7.2} cy={-12.5} r={11.2} fill={`url(#treeLit-${uid})`} />
        <circle cx={0} cy={-20.5} r={13.2} fill={`url(#treeTop-${uid})`} />
        <ellipse
          cx={-3.8}
          cy={-24.5}
          rx={7}
          ry={3.4}
          fill="#ffffff"
          fillOpacity={0.25}
        />
        <circle cx={-8.5} cy={-10.5} r={1.5} fill="#fff4a8" opacity={0.88} />
        <circle cx={6.2} cy={-17.5} r={1.4} fill="#ffd6e8" opacity={0.88} />
        <circle cx={1.5} cy={-8.5} r={1.2} fill="#fff4a8" opacity={0.76} />
      </g>
    </g>
  );
}

function renderPineCluster(
  x: number,
  y: number,
  scale: number,
  key: string | number
): React.ReactNode {
  return (
    <g key={key} transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx={2.5} cy={16} rx={15} ry={4.8} fill="rgba(3, 18, 18, 0.36)" />
      <rect x={-2.6} y={4} width={5.2} height={12} rx={1.5} fill="#4d301d" />
      <polygon points="0,-28 -16,-6 16,-6" fill="#17614e" />
      <polygon points="0,-28 0,-6 16,-6" fill="#0d4033" opacity={0.48} />
      <polygon points="0,-36 -12.5,-16 12.5,-16" fill="#218065" />
      <polygon points="0,-36 0,-16 12.5,-16" fill="#12523f" opacity={0.44} />
      <polygon points="0,-44 -8.5,-26 8.5,-26" fill="#32a47f" />
      <polygon points="0,-44 -2,-26 -8.5,-26" fill="#67e3b6" opacity={0.35} />
    </g>
  );
}

function renderRockOutcrop(
  x: number,
  y: number,
  scale: number,
  litColor: string,
  midColor: string,
  darkColor: string,
  key: string | number
): React.ReactNode {
  return (
    <g key={key} transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx={2} cy={10.5} rx={21} ry={5.5} fill="rgba(0, 0, 0, 0.36)" />
      <polygon points="-19,9 -13,-6.5 -2,-12 10.5,-4.5 19,9" fill={midColor} />
      <polygon points="-19,9 -13,-6.5 -2,-12 -1,9" fill={litColor} opacity={0.78} />
      <polygon points="-2,-12 10.5,-4.5 19,9 -1,9" fill={darkColor} opacity={0.8} />
      <polyline points="-13,-6.5 -2,-12 10.5,-4.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.1} />
      <polygon points="6,9 11.5,-0.5 20,2 23,9" fill={darkColor} />
    </g>
  );
}

function renderGrassTuft(
  x: number,
  y: number,
  scale: number,
  color: string,
  key: string | number
): React.ReactNode {
  return (
    <g key={key} transform={`translate(${x}, ${y}) scale(${scale})`} opacity={0.78}>
      <path
        d="M -5 4 Q -7 -3 -10 -5 M 0 4 Q 0 -4 1 -7 M 5 4 Q 7 -2 10 -4"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  );
}

function renderVolumetricCloud(
  x: number,
  y: number,
  w: number,
  uid: string,
  driftClass: string,
  key: string | number
): React.ReactNode {
  return (
    <g key={key} transform={`translate(${x}, ${y})`}>
      <g className={driftClass}>
        <ellipse
          cx={0}
          cy={w * 0.14}
          rx={w * 0.58}
          ry={w * 0.19}
          fill="rgba(42, 22, 82, 0.25)"
        />
        <circle cx={-w * 0.29} cy={2} r={w * 0.24} fill={`url(#cloudBase-${uid})`} />
        <circle cx={w * 0.28} cy={3} r={w * 0.22} fill={`url(#cloudBase-${uid})`} />
        <circle cx={-w * 0.08} cy={-6} r={w * 0.29} fill={`url(#cloudTop-${uid})`} />
        <circle cx={w * 0.12} cy={-3} r={w * 0.23} fill={`url(#cloudTop-${uid})`} />
        <rect
          x={-w * 0.35}
          y={2}
          width={w * 0.7}
          height={w * 0.22}
          rx={w * 0.11}
          fill={`url(#cloudBase-${uid})`}
        />
        <ellipse
          cx={-w * 0.08}
          cy={-w * 0.19}
          rx={w * 0.17}
          ry={w * 0.06}
          fill="#ffffff"
          fillOpacity={0.78}
        />
      </g>
    </g>
  );
}

function renderCrystalSpire(
  x: number,
  y: number,
  scale: number,
  colA: string,
  colB: string,
  key: string | number
): React.ReactNode {
  return (
    <g key={key} transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={14} rx={26} ry={7.5} fill={colA} fillOpacity={0.22} />
      <ellipse cx={0} cy={14} rx={17} ry={5.2} fill="rgba(2, 18, 26, 0.44)" />
      <polygon
        points="0,-35 12.5,-5 8.5,14 -8.5,14 -13.5,-4"
        fill={colA}
        fillOpacity={0.92}
        stroke="#ffffff"
        strokeOpacity={0.72}
        strokeWidth={1.1}
      />
      <polygon points="0,-35 12.5,-5 1,14 -2,-4" fill="#ffffff" fillOpacity={0.42} />
      <polygon points="0,-35 -13.5,-4 -8.5,14 -2,-4" fill="#07283b" fillOpacity={0.25} />
      <polygon points="-1,-22 5,-8 0,4 -4,-7" fill="#ffffff" fillOpacity={0.32} />
      <polygon
        points="-15.5,-14 -5,-2 -7,14 -18.5,11"
        fill={colB}
        fillOpacity={0.86}
        stroke="#ffffff"
        strokeOpacity={0.55}
        strokeWidth={0.9}
      />
      <polygon
        points="14,-11 20.5,2 14,14 6,13 8,-1"
        fill={colB}
        fillOpacity={0.8}
        stroke="#ffffff"
        strokeOpacity={0.48}
        strokeWidth={0.9}
      />
    </g>
  );
}

function renderBasaltHexColumns(
  x: number,
  y: number,
  scale: number,
  key: string | number
): React.ReactNode {
  const cols = [
    { dx: -14, h: 24, lit: '#5c2627', side: '#341214', cap: '#7d3936' },
    { dx: -4, h: 34, lit: '#6b2c2d', side: '#3d1618', cap: '#91433e' },
    { dx: 6, h: 28, lit: '#562223', side: '#2f1011', cap: '#753330' },
    { dx: 15, h: 19, lit: '#4b1d1e', side: '#260c0d', cap: '#682c2a' },
  ];
  return (
    <g key={key} transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx={2} cy={10} rx={24} ry={5.5} fill="rgba(0, 0, 0, 0.42)" />
      {cols.map((c, idx) => (
        <g key={idx} transform={`translate(${c.dx}, ${10 - c.h})`}>
          <rect x={-5} y={0} width={5} height={c.h} fill={c.lit} />
          <rect x={0} y={0} width={5} height={c.h} fill={c.side} />
          <polygon points="-5,0 0,-3 5,0 0,3" fill={c.cap} />
        </g>
      ))}
    </g>
  );
}

function renderBiomeLandscape(
  sec: ProceduralSectionSpec,
  W: number,
  uid: string
): React.ReactNode {
  const { sectionTop: y0, height: H, biome: b, id } = sec;

  if (id === 'crystal-valley') {
    return (
      <g key={`land-${sec.key}`}>
        {/* Aurora haze, sunlit alpine sun glow & diagonal valley god-rays */}
        <ellipse cx={W * 0.36} cy={y0 + H * 0.08} rx={W * 0.52} ry={H * 0.07} fill="#66ffe0" fillOpacity={0.09} />
        <circle cx={W * 0.82} cy={y0 + H * 0.13} r={W * 0.42} fill="#9efaff" fillOpacity={0.14} />
        <circle cx={W * 0.82} cy={y0 + H * 0.13} r={W * 0.15} fill="#e8ffff" fillOpacity={0.18} />
        <polygon
          points={`${W * 0.60},${y0} ${W * 0.96},${y0} ${W * 0.56},${y0 + H * 0.68} ${W * 0.25},${y0 + H * 0.68}`}
          fill={`url(#sunRay-${uid})`}
          opacity={0.48}
        />
        <polygon
          points={`${W * 0.24},${y0} ${W * 0.44},${y0} ${W * 0.14},${y0 + H * 0.52} ${-W * 0.05},${y0 + H * 0.52}`}
          fill={`url(#sunRay-${uid})`}
          opacity={0.26}
        />

        {/* Distant snow-capped alpine range */}
        <polygon
          points={`0,${y0 + H * 0.19} ${W * 0.16},${y0 + H * 0.04} ${W * 0.36},${y0 + H * 0.16} ${W * 0.62},${y0 + H * 0.04} ${W * 0.86},${y0 + H * 0.15} ${W},${y0 + H * 0.08} ${W},${y0 + H * 0.32} 0,${y0 + H * 0.32}`}
          fill="#185a78"
          opacity={0.72}
        />
        <polygon
          points={`${W * 0.16},${y0 + H * 0.04} ${W * 0.25},${y0 + H * 0.10} ${W * 0.10},${y0 + H * 0.11}`}
          fill="#d6fdff"
          opacity={0.42}
        />
        <polygon
          points={`${W * 0.62},${y0 + H * 0.04} ${W * 0.71},${y0 + H * 0.11} ${W * 0.54},${y0 + H * 0.11}`}
          fill="#d6fdff"
          opacity={0.36}
        />

        {/* Overlapping gradient-shaded emerald terraces with sunlit moss lips & cliff strata */}
        <path
          d={`M 0 ${y0 + H * 0.20} Q ${W * 0.34} ${y0 + H * 0.08}, ${W * 0.72} ${y0 + H * 0.20} T ${W} ${y0 + H * 0.15} L ${W} ${y0 + H * 0.45} L 0 ${y0 + H * 0.48} Z`}
          fill={`url(#hillBack-${uid})`}
          opacity={0.92}
        />
        <path
          d={`M 0 ${y0 + H * 0.20} Q ${W * 0.34} ${y0 + H * 0.08}, ${W * 0.72} ${y0 + H * 0.20} T ${W} ${y0 + H * 0.15}`}
          fill="none"
          stroke="#7effd2"
          strokeOpacity={0.36}
          strokeWidth={3.2}
        />
        <path
          d={`M 0 ${y0 + H * 0.43} Q ${W * 0.28} ${y0 + H * 0.56}, ${W * 0.65} ${y0 + H * 0.41} T ${W} ${y0 + H * 0.49} L ${W} ${y0 + H * 0.76} L 0 ${y0 + H * 0.73} Z`}
          fill={`url(#hillMid-${uid})`}
          opacity={0.95}
        />
        <path
          d={`M 0 ${y0 + H * 0.43} Q ${W * 0.28} ${y0 + H * 0.56}, ${W * 0.65} ${y0 + H * 0.41} T ${W} ${y0 + H * 0.49}`}
          fill="none"
          stroke="#6cf5c3"
          strokeOpacity={0.28}
          strokeWidth={2.8}
        />
        <path
          d={`M 0 ${y0 + H * 0.72} Q ${W * 0.4} ${y0 + H * 0.62}, ${W * 0.78} ${y0 + H * 0.76} T ${W} ${y0 + H * 0.71} L ${W} ${y0 + H} L 0 ${y0 + H} Z`}
          fill={`url(#hillFront-${uid})`}
          opacity={0.98}
        />
        <path
          d={`M 0 ${y0 + H * 0.72} Q ${W * 0.4} ${y0 + H * 0.62}, ${W * 0.78} ${y0 + H * 0.76} T ${W} ${y0 + H * 0.71}`}
          fill="none"
          stroke="#61ebba"
          strokeOpacity={0.26}
          strokeWidth={2.6}
        />

        {/* Soft drifting valley mist band */}
        <ellipse cx={W * 0.5} cy={y0 + H * 0.25} rx={W * 0.62} ry={16} fill="#b8fff4" fillOpacity={0.07} />

        {/* Meadow grass tufts & wildflower clusters */}
        {renderGrassTuft(W * 0.18, y0 + H * 0.34, 0.9, '#3ad99c', 'gt1')}
        {renderGrassTuft(W * 0.79, y0 + H * 0.49, 0.95, '#3ad99c', 'gt2')}
        {renderGrassTuft(W * 0.22, y0 + H * 0.69, 0.9, '#3ad99c', 'gt3')}
        {renderGrassTuft(W * 0.78, y0 + H * 0.88, 0.92, '#3ad99c', 'gt4')}
        {[
          { x: W * 0.22, y: y0 + H * 0.52, c: '#ffe885' },
          { x: W * 0.78, y: y0 + H * 0.24, c: '#ffb3d9' },
          { x: W * 0.19, y: y0 + H * 0.89, c: '#ffe885' },
          { x: W * 0.80, y: y0 + H * 0.89, c: '#b8faff' },
        ].map((fl, i) => (
          <g key={`fl-${i}`} transform={`translate(${fl.x}, ${fl.y})`} opacity={0.9}>
            <circle cx={-6} cy={2} r={2.3} fill={fl.c} />
            <circle cx={2} cy={-3} r={2.6} fill="#ffffff" />
            <circle cx={8} cy={3} r={2.1} fill={fl.c} />
          </g>
        ))}

        {/* Winding realistic river with pebble banks, turquoise current & sparkling ripples */}
        <path
          d={`M ${-20} ${y0 + H * 0.31} C ${W * 0.32} ${y0 + H * 0.27}, ${W * 0.68} ${y0 + H * 0.42}, ${W + 20} ${y0 + H * 0.37}`}
          fill="none"
          stroke="#093f48"
          strokeWidth={46}
          strokeOpacity={0.62}
          strokeLinecap="round"
        />
        <path
          d={`M ${-20} ${y0 + H * 0.31} C ${W * 0.32} ${y0 + H * 0.27}, ${W * 0.68} ${y0 + H * 0.42}, ${W + 20} ${y0 + H * 0.37}`}
          fill="none"
          stroke="#9ef8ff"
          strokeWidth={36}
          strokeOpacity={0.22}
          strokeLinecap="round"
        />
        <path
          d={`M ${-20} ${y0 + H * 0.31} C ${W * 0.32} ${y0 + H * 0.27}, ${W * 0.68} ${y0 + H * 0.42}, ${W + 20} ${y0 + H * 0.37}`}
          fill="none"
          stroke={`url(#riverWater-${uid})`}
          strokeWidth={33}
          strokeOpacity={0.9}
          strokeLinecap="round"
        />
        <path
          className="world-flow"
          d={`M ${-20} ${y0 + H * 0.31} C ${W * 0.32} ${y0 + H * 0.27}, ${W * 0.68} ${y0 + H * 0.42}, ${W + 20} ${y0 + H * 0.37}`}
          fill="none"
          stroke="#e2ffff"
          strokeWidth={5.2}
          strokeOpacity={0.62}
          strokeDasharray="16 28"
          strokeLinecap="round"
        />
        {/* Floating emerald lilypads near upper riverbank */}
        <g transform={`translate(${W * 0.24}, ${y0 + H * 0.30})`} opacity={0.88}>
          <circle cx={0} cy={0} r={4.8} fill="#2dc77a" />
          <circle cx={8} cy={4} r={3.6} fill="#3de69c" />
          <circle cx={0} cy={-1} r={1.8} fill="#ffd9ec" />
        </g>

        {/* Cliff-framed waterfall plunging into upper river */}
        <g transform={`translate(${W * 0.89}, ${y0 + H * 0.31})`}>
          <polygon points="-17,-38 17,-38 21,2 -21,2" fill="#255452" opacity={0.78} />
          <rect x={-11.5} y={-36} width={23} height={38} rx={6} fill="#76f7ff" fillOpacity={0.74} />
          <line x1={-4.5} y1={-34} x2={-4.5} y2={0} stroke="#ffffff" strokeWidth={2.5} strokeOpacity={0.72} strokeDasharray="8 6" className="world-flow" />
          <line x1={4.5} y1={-32} x2={4.5} y2={2} stroke="#ffffff" strokeWidth={2.2} strokeOpacity={0.66} strokeDasharray="6 8" className="world-flow" />
          <ellipse cx={0} cy={4.5} rx={19} ry={7} fill="#e6ffff" fillOpacity={0.58} className="world-pulse-soft" />
        </g>

        {/* Lower creek */}
        <path
          d={`M ${W + 20} ${y0 + H * 0.77} C ${W * 0.64} ${y0 + H * 0.71}, ${W * 0.34} ${y0 + H * 0.86}, ${-20} ${y0 + H * 0.81}`}
          fill="none"
          stroke="#093f48"
          strokeWidth={40}
          strokeOpacity={0.56}
          strokeLinecap="round"
        />
        <path
          d={`M ${W + 20} ${y0 + H * 0.77} C ${W * 0.64} ${y0 + H * 0.71}, ${W * 0.34} ${y0 + H * 0.86}, ${-20} ${y0 + H * 0.81}`}
          fill="none"
          stroke={`url(#riverWater-${uid})`}
          strokeWidth={29}
          strokeOpacity={0.86}
          strokeLinecap="round"
        />
        <path
          className="world-flow"
          d={`M ${W + 20} ${y0 + H * 0.77} C ${W * 0.64} ${y0 + H * 0.71}, ${W * 0.34} ${y0 + H * 0.86}, ${-20} ${y0 + H * 0.81}`}
          fill="none"
          stroke="#e2ffff"
          strokeWidth={4.8}
          strokeOpacity={0.58}
          strokeDasharray="12 24"
          strokeLinecap="round"
        />

        {/* Hero Landmark 1: Crystal Sanctuary Gazebo on upper-left ridge */}
        <g transform={`translate(${W * 0.13}, ${y0 + H * 0.25}) scale(0.9)`}>
          <ellipse cx={0} cy={14} rx={20} ry={5.5} fill="rgba(4, 20, 16, 0.38)" />
          <rect x={-14} y={9} width={28} height={4.5} rx={1.5} fill="#b7d2cf" />
          <rect x={-11} y={-8} width={3.6} height={17} fill="#e9f6f5" />
          <rect x={7.4} y={-8} width={3.6} height={17} fill="#cde4e2" />
          <path d="M -16 -8 Q 0 -24 16 -8 Z" fill="#2cc2b3" stroke="#9efaff" strokeWidth={1.1} />
          <circle cx={0} cy={-22} r={3} fill="#fff394" className="world-pulse-soft" />
        </g>

        {/* Hero Landmark 2: Storybook Valley Stone Cottage + Waterwheel + Lantern Windows */}
        <g transform={`translate(${W * 0.85}, ${y0 + H * 0.56})`}>
          <ellipse cx={0} cy={16} rx={26} ry={7.5} fill="rgba(4, 20, 16, 0.44)" />
          <rect x={-14} y={-7} width={28} height={20} rx={3} fill="#f4e6cf" stroke="#b99c75" strokeWidth={0.9} />
          <rect x={-14} y={5} width={28} height={8} rx={1.5} fill="#b9a790" opacity={0.55} />
          <rect x={-3.2} y={2} width={6.4} height={11} rx={2} fill="#6c4124" />
          <circle cx={-8.2} cy={-0.5} r={3} fill="#ffe484" stroke="#855228" strokeWidth={0.9} />
          <circle cx={8.2} cy={-0.5} r={2.8} fill="#ffe484" stroke="#855228" strokeWidth={0.9} />
          <polygon points="-18,-6 0,-23 18,-6" fill="#d9534f" stroke="#7d221f" strokeWidth={1} />
          <polygon points="0,-23 18,-6 3,-6" fill="#a83330" opacity={0.68} />
          <rect x={6.5} y={-20} width={4.8} height={8.5} fill="#7d645c" />
          <g className="world-smoke-rise" opacity={0.6}>
            <circle cx={8.5} cy={-25} r={2.6} fill="#ffffff" />
            <circle cx={11} cy={-31} r={3.6} fill="#ffffff" />
          </g>
          {/* Wooden mill wheel */}
          <circle cx={-16} cy={6} r={7.5} fill="none" stroke="#8b5a2b" strokeWidth={2.4} />
          <circle cx={-16} cy={6} r={2.2} fill="#5a3822" />
          <line x1={-23.5} y1={6} x2={-8.5} y2={6} stroke="#8b5a2b" strokeWidth={1.5} />
          <line x1={-16} y1={-1.5} x2={-16} y2={13.5} stroke="#8b5a2b" strokeWidth={1.5} />
        </g>

        {/* Rocks, pines & swaying storybook oaks */}
        {renderRockOutcrop(W * 0.16, y0 + H * 0.30, 0.92, '#69998d', '#406b64', '#234442', 'rk1')}
        {renderRockOutcrop(W * 0.84, y0 + H * 0.72, 1.0, '#69998d', '#406b64', '#234442', 'rk2')}
        {renderPineCluster(W * 0.08, y0 + H * 0.19, 0.92, 'p1')}
        {renderPineCluster(W * 0.92, y0 + H * 0.43, 0.96, 'p2')}
        {renderPineCluster(W * 0.08, y0 + H * 0.67, 0.88, 'p3')}
        {renderRealisticTree(W * 0.12, y0 + H * 0.12, 0.94, uid, 'world-sway', 't1')}
        {renderRealisticTree(W * 0.87, y0 + H * 0.22, 1.02, uid, 'world-sway-alt', 't2')}
        {renderRealisticTree(W * 0.12, y0 + H * 0.48, 0.90, uid, 'world-sway-alt', 't3')}
        {renderRealisticTree(W * 0.87, y0 + H * 0.65, 0.96, uid, 'world-sway', 't4')}
        {renderRealisticTree(W * 0.12, y0 + H * 0.86, 0.94, uid, 'world-sway', 't5')}

        {renderCrystalSpire(W * 0.86, y0 + H * 0.10, 0.96, b.featureA, b.featureB, 'c1')}
        {renderCrystalSpire(W * 0.09, y0 + H * 0.37, 1.06, b.featureB, b.featureA, 'c2')}
        {renderCrystalSpire(W * 0.90, y0 + H * 0.86, 1.04, b.featureB, b.featureA, 'c3')}

        {/* Gliding birds */}
        <g className="world-glide" transform={`translate(${W * 0.25}, ${y0 + H * 0.15})`}>
          <path d="M -8 2 Q -4 -4 0 1 Q 4 -4 8 2" fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" opacity={0.85} />
          <path d="M 12 -6 Q 15 -10 18 -7 Q 21 -10 24 -6" fill="none" stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" opacity={0.72} />
        </g>

        {/* Animated fireflies & pollen motes */}
        <g className="world-float">
          {[0.14, 0.28, 0.42, 0.56, 0.70, 0.85].map((ry, i) => (
            <circle
              key={`mote-${i}`}
              cx={i % 2 === 0 ? W * (0.12 + (i % 3) * 0.07) : W * (0.86 - (i % 3) * 0.07)}
              cy={y0 + H * ry}
              r={2.9 + (i % 2)}
              fill="#fff7b2"
              fillOpacity={0.86}
            />
          ))}
        </g>
      </g>
    );
  }

  if (id === 'cloud-city') {
    return (
      <g key={`land-${sec.key}`}>
        {/* Radiant solar halo + soft sky rainbow arcs + distant sky spire silhouettes */}
        <circle cx={W * 0.78} cy={y0 + H * 0.19} r={W * 0.36} fill="#ffe49e" fillOpacity={0.2} />
        <circle cx={W * 0.78} cy={y0 + H * 0.19} r={W * 0.15} fill="#fff5cc" fillOpacity={0.3} />
        <ellipse cx={W * 0.48} cy={y0 + H * 0.56} rx={W * 0.56} ry={H * 0.28} fill="#ffc2df" fillOpacity={0.14} />
        <path
          d={`M ${W * 0.08} ${y0 + H * 0.48} A ${W * 0.48} ${W * 0.38} 0 0 1 ${W * 0.92} ${y0 + H * 0.42}`}
          fill="none"
          stroke="#ffd29d"
          strokeOpacity={0.22}
          strokeWidth={11}
          strokeLinecap="round"
        />
        <path
          d={`M ${W * 0.12} ${y0 + H * 0.48} A ${W * 0.44} ${W * 0.35} 0 0 1 ${W * 0.88} ${y0 + H * 0.42}`}
          fill="none"
          stroke="#9ef7ff"
          strokeOpacity={0.18}
          strokeWidth={6}
          strokeLinecap="round"
        />

        {/* Celestial Brass Astrolabe Observatory */}
        <g transform={`translate(${W * 0.14}, ${y0 + H * 0.88})`} opacity={0.95}>
          <ellipse cx={0} cy={17} rx={17} ry={4.8} fill="rgba(42, 22, 82, 0.34)" />
          <circle cx={0} cy={0} r={16.5} fill="none" stroke="#ffd86b" strokeWidth={2.2} />
          <circle cx={0} cy={0} r={12.5} fill="none" stroke="#fff3c4" strokeWidth={1} strokeDasharray="3 3" />
          <ellipse cx={0} cy={0} rx={22} ry={7.2} fill="none" stroke="#fff3c4" strokeWidth={1.4} transform="rotate(-24)" />
          <circle cx={0} cy={0} r={5} fill="#ffe794" />
        </g>

        {/* Twinkling celestial constellations */}
        <g className="world-twinkle">
          {[
            { x: W * 0.18, y: y0 + H * 0.08 },
            { x: W * 0.62, y: y0 + H * 0.14 },
            { x: W * 0.28, y: y0 + H * 0.34 },
            { x: W * 0.82, y: y0 + H * 0.48 },
            { x: W * 0.22, y: y0 + H * 0.72 },
            { x: W * 0.74, y: y0 + H * 0.86 },
          ].map((st, i) => (
            <path
              key={`star-${i}`}
              d={`M ${st.x} ${st.y - 5.5} L ${st.x + 1.5} ${st.y - 1.5} L ${st.x + 5.5} ${st.y} L ${st.x + 1.5} ${st.y + 1.5} L ${st.x} ${st.y + 5.5} L ${st.x - 1.5} ${st.y + 1.5} L ${st.x - 5.5} ${st.y} L ${st.x - 1.5} ${st.y - 1.5} Z`}
              fill="#fff9d6"
              opacity={0.86}
            />
          ))}
        </g>

        {/* Stratified Floating Marble Citadel Islands with hanging vines, waterfalls & golden domes */}
        {[
          { x: W * 0.14, y: y0 + H * 0.21, w: 78, hasFall: true },
          { x: W * 0.86, y: y0 + H * 0.34, w: 84, hasFall: false },
          { x: W * 0.14, y: y0 + H * 0.58, w: 80, hasFall: false },
          { x: W * 0.86, y: y0 + H * 0.76, w: 78, hasFall: true },
        ].map((isl, i) => (
          <g key={`isl-${i}`} transform={`translate(${isl.x}, ${isl.y})`}>
            {/* Faceted crystal-veined rock underside */}
            <polygon
              points={`${-isl.w * 0.45},0 ${isl.w * 0.45},0 ${isl.w * 0.16},${isl.w * 0.52} ${-isl.w * 0.14},${isl.w * 0.49}`}
              fill="#5d429c"
            />
            <polygon
              points={`0,0 ${isl.w * 0.45},0 ${isl.w * 0.16},${isl.w * 0.52} 0,${isl.w * 0.50}`}
              fill="#422c78"
              opacity={0.65}
            />
            {/* Hanging sky-vines */}
            <path
              d={`M ${-isl.w * 0.32} 5 Q ${-isl.w * 0.35} 18 ${-isl.w * 0.28} 26 M ${isl.w * 0.30} 6 Q ${isl.w * 0.34} 17 ${isl.w * 0.26} 24`}
              fill="none"
              stroke="#52e8c0"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.76}
            />
            {isl.hasFall && (
              <g>
                <rect
                  x={-3.5}
                  y={6}
                  width={7}
                  height={38}
                  rx={3.5}
                  fill="#9bf5ff"
                  fillOpacity={0.72}
                />
                <ellipse cx={0} cy={45} rx={11} ry={4.2} fill="#ffffff" fillOpacity={0.5} className="world-pulse-soft" />
              </g>
            )}
            <ellipse cx={0} cy={0} rx={isl.w * 0.48} ry={12} fill="#3ad4af" />
            <ellipse cx={-isl.w * 0.08} cy={-2} rx={isl.w * 0.34} ry={5.8} fill="#89ffdf" fillOpacity={0.52} />
            {/* Marble stepped plinth + fluted columns + golden cupola dome */}
            <rect x={-17} y={-7} width={34} height={4.2} rx={1.5} fill="#ebe2ff" />
            <rect x={-13} y={-26} width={26} height={19} rx={2.5} fill="#fff7ff" />
            <rect x={-10.5} y={-25} width={3.4} height={17} fill="#dcd0f8" />
            <rect x={7.1} y={-25} width={3.4} height={17} fill="#dcd0f8" />
            <rect x={-3.4} y={-20} width={6.8} height={13} rx={3.4} fill="#7252b0" opacity={0.58} />
            <path d="M -15 -26 Q 0 -44 15 -26 Z" fill="#ffbe33" />
            <path d="M -8 -26 Q -2 -37 3 -26 Z" fill="#ffe68a" opacity={0.6} />
            <line x1={0} y1={-39} x2={0} y2={-50} stroke="#fff3c4" strokeWidth={1.6} />
            <polygon points="0,-50 12,-46.5 0,-43" fill="#ff6198" />
          </g>
        ))}

        {/* Layered volumetric cumulus clouds with slow parallax drift */}
        {renderVolumetricCloud(W * 0.14, y0 + H * 0.10, 92, uid, 'world-drift-slow', 'cl1')}
        {renderVolumetricCloud(W * 0.86, y0 + H * 0.21, 98, uid, 'world-drift-alt', 'cl2')}
        {renderVolumetricCloud(W * 0.12, y0 + H * 0.40, 102, uid, 'world-drift-slow', 'cl3')}
        {renderVolumetricCloud(W * 0.88, y0 + H * 0.55, 96, uid, 'world-drift-alt', 'cl4')}
        {renderVolumetricCloud(W * 0.15, y0 + H * 0.75, 96, uid, 'world-drift-slow', 'cl5')}
        {renderVolumetricCloud(W * 0.84, y0 + H * 0.89, 92, uid, 'world-drift-alt', 'cl6')}

        {/* Animated striped hot-air balloons */}
        {[
          { x: W * 0.87, y: y0 + H * 0.12, c1: '#ff6e9c', c2: '#ffd966', cls: 'world-bob' },
          { x: W * 0.11, y: y0 + H * 0.67, c1: '#42dcff', c2: '#ffffff', cls: 'world-bob-alt' },
        ].map((bl, i) => (
          <g key={`bal-${i}`} transform={`translate(${bl.x}, ${bl.y})`}>
            <g className={bl.cls}>
              <circle cx={0} cy={0} r={16} fill={bl.c1} />
              <ellipse cx={0} cy={0} rx={7} ry={16} fill={bl.c2} opacity={0.9} />
              <ellipse cx={-5} cy={-5} rx={4.5} ry={8.2} fill="#ffffff" fillOpacity={0.4} />
              <line x1={-5} y1={14.5} x2={-3} y2={22.5} stroke="#ffe099" strokeWidth={1.3} />
              <line x1={5} y1={14.5} x2={3} y2={22.5} stroke="#ffe099" strokeWidth={1.3} />
              <rect x={-4.8} y={22.5} width={9.6} height={6.2} rx={1.6} fill="#b87633" />
            </g>
          </g>
        ))}

        {/* Winged Celestial Sky-Ship cruising above middle clouds */}
        <g className="world-glide" transform={`translate(${W * 0.86}, ${y0 + H * 0.45}) scale(0.86)`}>
          <path d="M -18 4 Q 0 14 18 4 L 13 -2 L -13 -2 Z" fill="#8e582e" stroke="#ffd87d" strokeWidth={1} />
          <path d="M -3 -2 L -3 -20 L 11 -8 Z" fill="#fff6e0" opacity={0.9} />
          <ellipse cx={0} cy={-16} rx={16} ry={6.5} fill="#ff73a5" opacity={0.85} />
        </g>
      </g>
    );
  }

  if (id === 'volcano') {
    return (
      <g key={`land-${sec.key}`}>
        {/* Glowing volcanic caldera atmosphere & rim light */}
        <ellipse cx={W * 0.5} cy={y0 + H * 0.48} rx={W * 0.58} ry={H * 0.36} fill="#ff7426" fillOpacity={0.18} />

        {/* Stepped basalt volcanic ridges with lit magma canyon edges */}
        <path
          d={`M 0 ${y0 + H * 0.15} L ${W * 0.25} ${y0 + H * 0.08} L ${W * 0.54} ${y0 + H * 0.18} L ${W * 0.82} ${y0 + H * 0.10} L ${W} ${y0 + H * 0.17} L ${W} ${y0 + H * 0.48} L 0 ${y0 + H * 0.45} Z`}
          fill={`url(#volcBack-${uid})`}
          opacity={0.92}
        />
        <path
          d={`M 0 ${y0 + H * 0.15} L ${W * 0.25} ${y0 + H * 0.08} L ${W * 0.54} ${y0 + H * 0.18} L ${W * 0.82} ${y0 + H * 0.10} L ${W} ${y0 + H * 0.17}`}
          fill="none"
          stroke="#ff8a48"
          strokeOpacity={0.32}
          strokeWidth={2.6}
        />
        <path
          d={`M 0 ${y0 + H * 0.44} L ${W * 0.28} ${y0 + H * 0.52} L ${W * 0.62} ${y0 + H * 0.41} L ${W} ${y0 + H * 0.50} L ${W} ${y0 + H * 0.80} L 0 ${y0 + H * 0.77} Z`}
          fill="#47191a"
          opacity={0.94}
        />
        <path
          d={`M 0 ${y0 + H * 0.75} L ${W * 0.35} ${y0 + H * 0.67} L ${W * 0.74} ${y0 + H * 0.79} L ${W} ${y0 + H * 0.72} L ${W} ${y0 + H} L 0 ${y0 + H} Z`}
          fill={`url(#volcFront-${uid})`}
          opacity={0.98}
        />

        {/* Glowing surface magma fissures cracking across dark basalt shelves */}
        {[
          `M ${W * 0.12} ${y0 + H * 0.50} L ${W * 0.19} ${y0 + H * 0.53} L ${W * 0.16} ${y0 + H * 0.56}`,
          `M ${W * 0.84} ${y0 + H * 0.23} L ${W * 0.90} ${y0 + H * 0.26} L ${W * 0.86} ${y0 + H * 0.29}`,
          `M ${W * 0.18} ${y0 + H * 0.87} L ${W * 0.24} ${y0 + H * 0.90} L ${W * 0.20} ${y0 + H * 0.94}`,
        ].map((d, i) => (
          <path
            key={`fis-${i}`}
            d={d}
            fill="none"
            stroke="#ff7828"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.7}
            className="world-pulse-soft"
          />
        ))}

        {/* Grounded basalt magma vents & glowing lava pools */}
        {[
          { x: W * 0.16, y: y0 + H * 0.59, rx: 16 },
          { x: W * 0.84, y: y0 + H * 0.58, rx: 18 },
        ].map((pool, i) => (
          <g key={`vpool-${i}`} transform={`translate(${pool.x}, ${pool.y})`}>
            <ellipse cx={0} cy={0} rx={pool.rx + 5} ry={7.5} fill="#24080a" />
            <ellipse cx={0} cy={0} rx={pool.rx} ry={4.8} fill="#ff6e24" className="world-pulse-soft" />
            <ellipse cx={-2} cy={-0.6} rx={pool.rx * 0.54} ry={2.4} fill="#ffe070" />
          </g>
        ))}

        {/* Forged Obsidian Citadel Bastion with glowing furnace gate */}
        <g transform={`translate(${W * 0.86}, ${y0 + H * 0.32})`}>
          <ellipse cx={0} cy={15} rx={22} ry={5.5} fill="rgba(0, 0, 0, 0.45)" />
          <polygon points="-17,14 -13,-17 -5,-17 -3,14" fill="#2c1012" stroke="#6c2a2c" strokeWidth={0.9} />
          <polygon points="3,14 5,-17 13,-17 17,14" fill="#210b0c" stroke="#5c2325" strokeWidth={0.9} />
          <rect x={-14} y={-16} width={28} height={6} rx={1.5} fill="#5a2324" />
          <rect x={-15} y={-21} width={5.5} height={5} fill="#3a1416" />
          <rect x={9.5} y={-21} width={5.5} height={5} fill="#3a1416" />
          <circle cx={0} cy={-4} r={4.4} fill="#ff9436" className="world-pulse-soft" />
          <circle cx={0} cy={-4} r={2} fill="#fff3b0" />
        </g>

        {/* Molten lava rivers with cooled basalt banks & floating crust plates */}
        <path
          d={`M ${-20} ${y0 + H * 0.28} C ${W * 0.32} ${y0 + H * 0.22}, ${W * 0.64} ${y0 + H * 0.36}, ${W + 20} ${y0 + H * 0.31}`}
          fill="none"
          stroke="#2b0c0d"
          strokeWidth={36}
          strokeOpacity={0.76}
          strokeLinecap="round"
        />
        <path
          d={`M ${-20} ${y0 + H * 0.28} C ${W * 0.32} ${y0 + H * 0.22}, ${W * 0.64} ${y0 + H * 0.36}, ${W + 20} ${y0 + H * 0.31}`}
          fill="none"
          stroke={`url(#lavaStream-${uid})`}
          strokeWidth={24}
          strokeOpacity={0.94}
          strokeLinecap="round"
        />
        <path
          className="world-flow"
          d={`M ${-20} ${y0 + H * 0.28} C ${W * 0.32} ${y0 + H * 0.22}, ${W * 0.64} ${y0 + H * 0.36}, ${W + 20} ${y0 + H * 0.31}`}
          fill="none"
          stroke="#fff0a6"
          strokeWidth={6}
          strokeOpacity={0.9}
          strokeDasharray="16 24"
          strokeLinecap="round"
        />
        <ellipse cx={W * 0.24} cy={y0 + H * 0.26} rx={7.5} ry={3.2} fill="#341112" opacity={0.88} />
        <ellipse cx={W * 0.78} cy={y0 + H * 0.32} rx={6.5} ry={2.8} fill="#341112" opacity={0.88} />

        <path
          d={`M ${W + 20} ${y0 + H * 0.785} C ${W * 0.65} ${y0 + H * 0.755}, ${W * 0.35} ${y0 + H * 0.840}, ${-20} ${y0 + H * 0.805}`}
          fill="none"
          stroke="#2b0c0d"
          strokeWidth={32}
          strokeOpacity={0.72}
          strokeLinecap="round"
        />
        <path
          d={`M ${W + 20} ${y0 + H * 0.785} C ${W * 0.65} ${y0 + H * 0.755}, ${W * 0.35} ${y0 + H * 0.840}, ${-20} ${y0 + H * 0.805}`}
          fill="none"
          stroke={`url(#lavaStream-${uid})`}
          strokeWidth={21}
          strokeOpacity={0.92}
          strokeLinecap="round"
        />
        <path
          className="world-flow"
          d={`M ${W + 20} ${y0 + H * 0.785} C ${W * 0.65} ${y0 + H * 0.755}, ${W * 0.35} ${y0 + H * 0.840}, ${-20} ${y0 + H * 0.805}`}
          fill="none"
          stroke="#fff0a6"
          strokeWidth={5.5}
          strokeOpacity={0.86}
          strokeDasharray="14 22"
          strokeLinecap="round"
        />

        {/* Faceted volcano cones with molten lava rivulets & rising smoke plumes */}
        {[
          { x: W * 0.12, y: y0 + H * 0.20, s: 1.06 },
          { x: W * 0.88, y: y0 + H * 0.44, s: 1.14 },
          { x: W * 0.13, y: y0 + H * 0.66, s: 1.0 },
        ].map((vc, i) => (
          <g key={`vol-${i}`} transform={`translate(${vc.x}, ${vc.y}) scale(${vc.s})`}>
            <ellipse cx={2} cy={18} rx={28} ry={6.8} fill="rgba(0, 0, 0, 0.44)" />
            <polygon points="-26,18 -9.5,-12.5 9.5,-12.5 26,18" fill="#3a1416" />
            <polygon points="0,-12.5 9.5,-12.5 26,18 0,18" fill="#21090a" opacity={0.72} />
            <path d="M -3 -12 Q -1 -2 4 7" stroke="#ff7a29" strokeWidth={2.6} fill="none" strokeLinecap="round" />
            <ellipse cx={0} cy={-12} rx={9.5} ry={3.8} fill="#ff8426" />
            <ellipse cx={0} cy={-12} rx={5.8} ry={2.2} fill="#ffe47a" className="world-pulse-soft" />
            <g className="world-smoke-rise">
              <circle cx={-3} cy={-24} r={6.2} fill="#ffb899" fillOpacity={0.3} />
              <circle cx={4} cy={-35} r={8.8} fill="#ffd0b5" fillOpacity={0.22} />
            </g>
          </g>
        ))}

        {/* Hexagonal basalt columns, boulders & glowing amber fire crystals */}
        {renderBasaltHexColumns(W * 0.12, y0 + H * 0.89, 0.92, 'bh1')}
        {renderRockOutcrop(W * 0.11, y0 + H * 0.42, 0.98, '#7a3b34', '#4d201e', '#260d0e', 'vr1')}
        {renderRockOutcrop(W * 0.87, y0 + H * 0.66, 0.94, '#7a3b34', '#4d201e', '#260d0e', 'vr2')}
        {renderCrystalSpire(W * 0.86, y0 + H * 0.16, 0.96, '#ff8f32', '#ffd85e', 'vc1')}
        {renderCrystalSpire(W * 0.88, y0 + H * 0.84, 0.98, '#ff6e24', '#ffd85e', 'vc2')}

        {/* Animated rising glowing volcanic embers */}
        <g className="world-ember-rise">
          {[0.14, 0.29, 0.45, 0.60, 0.77, 0.89].map((ry, i) => (
            <circle
              key={`emb-${i}`}
              cx={i % 2 === 0 ? W * (0.11 + (i % 3) * 0.08) : W * (0.87 - (i % 3) * 0.08)}
              cy={y0 + H * ry}
              r={2.9 + (i % 2)}
              fill="#ffd26e"
              fillOpacity={0.88}
            />
          ))}
        </g>
      </g>
    );
  }

  // Abyss biome: Luminous Sunken Reef & Atlantis Temple Trench
  return (
    <g key={`land-${sec.key}`}>
      {/* Shimmering underwater caustic light shafts */}
      <g className="world-caustic">
        <polygon
          points={`${W * 0.08},${y0} ${W * 0.28},${y0} ${W * 0.56},${y0 + H} ${W * 0.34},${y0 + H}`}
          fill="#8af7ff"
          fillOpacity={0.09}
        />
        <polygon
          points={`${W * 0.55},${y0} ${W * 0.75},${y0} ${W * 0.98},${y0 + H} ${W * 0.74},${y0 + H}`}
          fill="#8af7ff"
          fillOpacity={0.072}
        />
      </g>

      {/* Rolling seafloor turquoise sandbanks with sunlit crest highlights */}
      <path
        d={`M 0 ${y0 + H * 0.20} Q ${W * 0.35} ${y0 + H * 0.10}, ${W * 0.75} ${y0 + H * 0.22} T ${W} ${y0 + H * 0.16} L ${W} ${y0 + H * 0.48} L 0 ${y0 + H * 0.45} Z`}
        fill={`url(#abyssBack-${uid})`}
        opacity={0.88}
      />
      <path
        d={`M 0 ${y0 + H * 0.20} Q ${W * 0.35} ${y0 + H * 0.10}, ${W * 0.75} ${y0 + H * 0.22} T ${W} ${y0 + H * 0.16}`}
        fill="none"
        stroke="#7ef9ff"
        strokeOpacity={0.22}
        strokeWidth={2.5}
      />
      <path
        d={`M 0 ${y0 + H * 0.48} Q ${W * 0.30} ${y0 + H * 0.60}, ${W * 0.68} ${y0 + H * 0.44} T ${W} ${y0 + H * 0.54} L ${W} ${y0 + H * 0.82} L 0 ${y0 + H * 0.79} Z`}
        fill="#0d597e"
        opacity={0.9}
      />
      <path
        d={`M 0 ${y0 + H * 0.78} Q ${W * 0.38} ${y0 + H * 0.68}, ${W * 0.78} ${y0 + H * 0.80} T ${W} ${y0 + H * 0.75} L ${W} ${y0 + H} L 0 ${y0 + H} Z`}
        fill={`url(#abyssFront-${uid})`}
        opacity={0.96}
      />

      {/* Sunken Atlantis Temple Colonnade & Glowing Rune Pearl */}
      <g transform={`translate(${W * 0.12}, ${y0 + H * 0.34})`} opacity={0.94}>
        <ellipse cx={0} cy={14} rx={22} ry={5.8} fill="rgba(2, 14, 28, 0.45)" />
        <rect x={-17} y={10} width={34} height={4.5} rx={1} fill="#4d7f96" />
        <rect x={-13.5} y={-10} width={6} height={20} rx={1} fill="#72acc2" />
        <rect x={7.5} y={-8} width={6} height={18} rx={1} fill="#5e94ab" />
        <rect x={-17} y={-15} width={34} height={6} rx={1.5} fill="#8dc9de" />
        <polygon points="-16,-15 0,-24 16,-15" fill="#70abc2" opacity={0.88} />
        <circle cx={0} cy={-1} r={4.5} fill="#72fff2" className="world-pulse-soft" />
      </g>

      {/* Giant Iridescent Pearl Clam Shell & Sunken Treasure Chest */}
      <g transform={`translate(${W * 0.87}, ${y0 + H * 0.52})`}>
        <ellipse cx={0} cy={10} rx={19} ry={5.2} fill="rgba(2, 14, 28, 0.42)" />
        <path d="M -15 6 Q 0 -16 15 6 Z" fill="#ffa8d0" />
        <path d="M -10 6 Q 0 -9 10 6 Z" fill="#ffd2e8" opacity={0.55} />
        <circle cx={0} cy={1} r={5} fill="#ffffff" />
        <circle cx={-1.2} cy={0} r={2} fill="#aefcff" />
      </g>
      <g transform={`translate(${W * 0.14}, ${y0 + H * 0.87})`}>
        <ellipse cx={0} cy={9.5} rx={17} ry={4.8} fill="rgba(2, 14, 28, 0.45)" />
        <rect x={-11.5} y={-2} width={23} height={11.5} rx={2} fill="#8a5226" stroke="#ffcf5c" strokeWidth={1.3} />
        <path d="M -11.5 -2 Q 0 -12.5 11.5 -2 Z" fill="#a86732" stroke="#ffcf5c" strokeWidth={1.2} />
        <circle cx={-4} cy={-2} r={2.2} fill="#ffe980" />
        <circle cx={4} cy={-2} r={2.2} fill="#8afff0" />
        <circle cx={0} cy={1} r={2.4} fill="#ffe878" />
      </g>

      {/* Bioluminescent drifting jellyfish */}
      <g className="world-bob" transform={`translate(${W * 0.86}, ${y0 + H * 0.24})`}>
        <path d="M -10 0 Q 0 -13.5 10 0 Z" fill="#8ef7ff" fillOpacity={0.72} />
        <path d="M -5 0 Q -6 7 -4 11 M 0 0 Q 1 8 -1 13 M 5 0 Q 6 7 4 11" fill="none" stroke="#8ef7ff" strokeOpacity={0.66} strokeWidth={1.5} strokeLinecap="round" />
      </g>
      <g className="world-bob-alt" transform={`translate(${W * 0.13}, ${y0 + H * 0.72}) scale(0.8)`}>
        <path d="M -9.5 0 Q 0 -12.5 9.5 0 Z" fill="#ffa3de" fillOpacity={0.62} />
        <path d="M -4 0 Q -5 6 -3 10 M 1 0 Q 2 7 0 11 M 5 0 Q 6 6 4 10" fill="none" stroke="#ffa3de" strokeOpacity={0.58} strokeWidth={1.4} strokeLinecap="round" />
      </g>

      {/* Gliding deep-sea manta & shimmering fish school */}
      <g className="world-swim" transform={`translate(${W * 0.22}, ${y0 + H * 0.52})`}>
        <path
          d="M -14 0 Q -2 -10 14 0 Q -2 6 -14 0 M -14 0 L -21 -4 L -20 4 Z"
          fill="#7ef9ff"
          fillOpacity={0.42}
        />
        <ellipse cx={22} cy={10} rx={5.2} ry={2.3} fill="#8ffbff" fillOpacity={0.46} />
        <ellipse cx={30} cy={6} rx={4.2} ry={1.9} fill="#8ffbff" fillOpacity={0.38} />
        <ellipse cx={27} cy={15} rx={3.6} ry={1.7} fill="#8ffbff" fillOpacity={0.35} />
      </g>

      {/* Branching reefs & corals */}
      {[
        { x: W * 0.11, y: y0 + H * 0.21, c: '#ff7fb8' },
        { x: W * 0.89, y: y0 + H * 0.38, c: '#4af7df' },
        { x: W * 0.12, y: y0 + H * 0.65, c: '#ffc86b' },
        { x: W * 0.88, y: y0 + H * 0.82, c: '#ff7fb8' },
      ].map((cr, i) => (
        <g key={`cor-${i}`} transform={`translate(${cr.x}, ${cr.y})`}>
          <ellipse cx={0} cy={17} rx={12} ry={4.8} fill="#255a7d" opacity={0.58} />
          <path
            d="M 0 18 L 0 -14 M 0 2 Q -12 -6 -10 -18 M 0 -2 Q 12 -10 10 -22"
            fill="none"
            stroke={cr.c}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.94}
          />
          <circle cx={-10} cy={-18} r={3.8} fill={cr.c} />
          <circle cx={0} cy={-16} r={3.8} fill={cr.c} />
          <circle cx={10} cy={-22} r={3.8} fill={cr.c} />
        </g>
      ))}

      {/* Gently swaying kelp fronds */}
      {[
        { x: W * 0.87, y: y0 + H * 0.17, flip: -1, cls: 'world-sway' },
        { x: W * 0.10, y: y0 + H * 0.47, flip: 1, cls: 'world-sway-alt' },
        { x: W * 0.90, y: y0 + H * 0.67, flip: -1, cls: 'world-sway' },
      ].map((fr, i) => (
        <g key={`klp-${i}`} transform={`translate(${fr.x}, ${fr.y}) scale(${fr.flip}, 1)`}>
          <g className={fr.cls}>
            <path
              d="M 0 28 Q 10 8 -4 -14 Q -10 -26 2 -36"
              fill="none"
              stroke={b.featureA}
              strokeOpacity={0.84}
              strokeWidth={3.6}
              strokeLinecap="round"
            />
            <circle cx={2} cy={-36} r={4.8} fill={b.featureA} fillOpacity={0.96} />
          </g>
        </g>
      ))}

      {/* Bioluminescent rising pearl bubbles */}
      <g className="world-bubble-rise">
        {[0.14, 0.29, 0.43, 0.59, 0.73, 0.88].map((ry, i) => (
          <circle
            key={`bub-${i}`}
            cx={i % 2 === 0 ? W * (0.14 + (i % 3) * 0.04) : W * (0.85 - (i % 3) * 0.04)}
            cy={y0 + H * ry}
            r={3.9 + (i % 3) * 1.3}
            fill="#ffffff"
            fillOpacity={0.22}
            stroke={b.particleColor}
            strokeOpacity={0.82}
            strokeWidth={1.4}
          />
        ))}
      </g>
    </g>
  );
}

const ProceduralWorldCanvasBase: React.FC<ProceduralWorldCanvasProps> = ({
  width,
  height,
  sections,
  bridges,
}) => {
  const uid = useId().replace(/:/g, '');
  const skyGradId = `worldSky-${uid}`;

  return (
    <svg
      className="world-canvas"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={skyGradId} x1="0" y1="0" x2="0" y2="1">
          {sections
            .slice()
            .sort((a, b) => a.sectionTop - b.sectionTop)
            .flatMap((sec, idx, sorted) => {
              const pad = idx === 0 ? 0 : sec.height * 0.16;
              const endPad = idx === sorted.length - 1 ? 0 : sec.height * 0.16;
              const t0 = Math.max(0, Math.min(1, (sec.sectionTop + pad) / height));
              const tm = Math.max(
                0,
                Math.min(1, (sec.sectionTop + sec.height * 0.5) / height)
              );
              const t1 = Math.max(
                0,
                Math.min(1, (sec.sectionTop + sec.height - endPad) / height)
              );
              return [
                <stop
                  key={`${sec.key}-top`}
                  offset={t0.toFixed(4)}
                  stopColor={sec.biome.skyTop}
                />,
                <stop
                  key={`${sec.key}-mid`}
                  offset={tm.toFixed(4)}
                  stopColor={sec.biome.skyMid}
                />,
                <stop
                  key={`${sec.key}-bot`}
                  offset={t1.toFixed(4)}
                  stopColor={sec.biome.skyBottom}
                />,
              ];
            })}
        </linearGradient>

        {/* Sunbeam atmospheric gradient */}
        <linearGradient id={`sunRay-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbd6" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#9efaff" stopOpacity="0" />
        </linearGradient>

        {/* Subtle side depth vignette framing center journey corridor */}
        <linearGradient id={`sideVignette-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#040814" stopOpacity="0.28" />
          <stop offset="14%" stopColor="#040814" stopOpacity="0" />
          <stop offset="86%" stopColor="#040814" stopOpacity="0" />
          <stop offset="100%" stopColor="#040814" stopOpacity="0.28" />
        </linearGradient>

        {/* Volumetric terrain & foliage gradients */}
        <linearGradient id={`hillBack-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#269e7d" />
          <stop offset="100%" stopColor="#166b56" />
        </linearGradient>
        <linearGradient id={`hillMid-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#238a6d" />
          <stop offset="100%" stopColor="#155c4a" />
        </linearGradient>
        <linearGradient id={`hillFront-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d745c" />
          <stop offset="100%" stopColor="#0f473a" />
        </linearGradient>
        <linearGradient id={`riverWater-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1bc4dc" />
          <stop offset="50%" stopColor="#179ec4" />
          <stop offset="100%" stopColor="#22d4e3" />
        </linearGradient>

        <linearGradient id={`treeTop-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#58eba8" />
          <stop offset="100%" stopColor="#22a16b" />
        </linearGradient>
        <linearGradient id={`treeLit-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#42d694" />
          <stop offset="100%" stopColor="#1a8559" />
        </linearGradient>
        <linearGradient id={`treeShade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#239666" />
          <stop offset="100%" stopColor="#125e42" />
        </linearGradient>

        <linearGradient id={`cloudTop-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#efe7ff" />
        </linearGradient>
        <linearGradient id={`cloudBase-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8dcff" />
          <stop offset="100%" stopColor="#c9b4f2" />
        </linearGradient>

        <linearGradient id={`volcBack-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#692624" />
          <stop offset="100%" stopColor="#3d1416" />
        </linearGradient>
        <linearGradient id={`volcFront-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4c191a" />
          <stop offset="100%" stopColor="#290b0d" />
        </linearGradient>
        <linearGradient id={`lavaStream-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff4a1c" />
          <stop offset="50%" stopColor="#ff8826" />
          <stop offset="100%" stopColor="#ff531a" />
        </linearGradient>

        <linearGradient id={`abyssBack-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#187ba1" />
          <stop offset="100%" stopColor="#0f5375" />
        </linearGradient>
        <linearGradient id={`abyssFront-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f5d80" />
          <stop offset="100%" stopColor="#083654" />
        </linearGradient>

        <radialGradient id={`portal-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8d6" stopOpacity="0.68" />
          <stop offset="45%" stopColor="#94f3ff" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`mistBand-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#eef7ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. Unified seamless sky & atmosphere gradient */}
      <rect x={0} y={0} width={width} height={height} fill={`url(#${skyGradId})`} />

      {/* 2. Lush full-bleed realistic storybook dioramas per biome */}
      {sections.map((sec) => renderBiomeLandscape(sec, width, uid))}

      {/* 3. Subtle lateral edge depth framing */}
      <rect x={0} y={0} width={width} height={height} fill={`url(#sideVignette-${uid})`} />

      {/* 4. Inter-realm misty cloud & golden portal veil centered on each bridge */}
      {bridges.map((b) => (
        <g key={`seam-${b.key}`}>
          <rect
            x={0}
            y={b.bridge.midY - 38}
            width={width}
            height={76}
            fill={`url(#mistBand-${uid})`}
          />
          <ellipse
            cx={b.bridge.midX}
            cy={b.bridge.midY}
            rx={width * 0.48}
            ry={46}
            fill={`url(#portal-${uid})`}
          />
          {renderVolumetricCloud(width * 0.14, b.bridge.midY + 8, 60, uid, 'world-drift-slow', `bcl-${b.key}`)}
          {renderVolumetricCloud(width * 0.86, b.bridge.midY - 8, 60, uid, 'world-drift-alt', `bcr-${b.key}`)}
        </g>
      ))}
    </svg>
  );
};

// The scenery only depends on layout geometry. LevelMap re-renders for unrelated reasons
// (progress, jump button, toasts) and `sections` / `bridges` arrive as fresh arrays, so
// compare by geometry signature to avoid rebuilding thousands of SVG nodes.
const sceneSignature = (p: ProceduralWorldCanvasProps): string =>
  `${p.width}x${p.height}|` +
  p.sections
    .map((x) => `${x.key}:${Math.round(x.sectionTop)}:${Math.round(x.height)}`)
    .join(',') +
  '|' +
  p.bridges
    .map((b) => `${b.key}:${Math.round(b.bridge.midX)}:${Math.round(b.bridge.midY)}`)
    .join(',');

export const ProceduralWorldCanvas = React.memo(
  ProceduralWorldCanvasBase,
  (prev, next) => sceneSignature(prev) === sceneSignature(next)
);
