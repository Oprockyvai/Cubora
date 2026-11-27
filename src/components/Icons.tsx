import React from 'react';
import { AVATAR_COLORS, ITEMS } from '../data/constants';
import { LevelGoalType } from '../types/game';

export const SharedSvgDefs: React.FC = () => (
  <svg
    width="0"
    height="0"
    style={{ position: 'absolute', pointerEvents: 'none' }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="hg2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff8aa0" />
        <stop offset=".5" stopColor="#ff3d5e" />
        <stop offset="1" stopColor="#b3112f" />
      </linearGradient>
      <linearGradient id="lgT" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e8f9ff" />
        <stop offset="1" stopColor="#34d3ff" />
      </linearGradient>
      <linearGradient id="lgL" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff86a4" />
        <stop offset="1" stopColor="#cf2653" />
      </linearGradient>
      <linearGradient id="lgR" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#69f2b4" />
        <stop offset="1" stopColor="#129963" />
      </linearGradient>
      <linearGradient id="bcCyan" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8beeff" />
        <stop offset=".5" stopColor="#34d3ff" />
        <stop offset="1" stopColor="#0f7ab8" />
      </linearGradient>
      <linearGradient id="bcGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff0a6" />
        <stop offset=".5" stopColor="#ffc845" />
        <stop offset="1" stopColor="#c47400" />
      </linearGradient>
      <linearGradient id="bcCoral" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ff9db3" />
        <stop offset=".5" stopColor="#ff5478" />
        <stop offset="1" stopColor="#a6193e" />
      </linearGradient>
      <linearGradient id="bcJade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9cffd4" />
        <stop offset=".5" stopColor="#3de69c" />
        <stop offset="1" stopColor="#0d8a55" />
      </linearGradient>
      <linearGradient id="gmF" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffc3ee" />
        <stop offset=".5" stopColor="#c04dff" />
        <stop offset="1" stopColor="#5b1fb0" />
      </linearGradient>
      {ITEMS.map((item, k) => (
        <React.Fragment key={item.name}>
          <radialGradient id={`igF${k}`} cx=".35" cy=".28" r=".9">
            <stop offset="0" stopColor={item.c1} />
            <stop offset=".5" stopColor={item.c2} />
            <stop offset="1" stopColor={item.c3} />
          </radialGradient>
          <linearGradient id={`igR${k}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={item.c1} />
            <stop offset=".5" stopColor={item.c2} />
            <stop offset="1" stopColor={item.c3} />
          </linearGradient>
        </React.Fragment>
      ))}
      <linearGradient id="mkG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fffbd1" />
        <stop offset=".35" stopColor="#ffd352" />
        <stop offset=".75" stopColor="#e6910a" />
        <stop offset="1" stopColor="#8c4e00" />
      </linearGradient>
      <linearGradient id="mkS" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset=".42" stopColor="#dce6f8" />
        <stop offset=".8" stopColor="#8c9cb8" />
        <stop offset="1" stopColor="#4c5978" />
      </linearGradient>
      <linearGradient id="mkS2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#eef3ff" />
        <stop offset=".45" stopColor="#a7b6d9" />
        <stop offset="1" stopColor="#47557a" />
      </linearGradient>
      <radialGradient id="mkB" cx=".32" cy=".25" r=".86">
        <stop offset="0" stopColor="#b5f6ff" />
        <stop offset=".42" stopColor="#26b4ff" />
        <stop offset=".82" stopColor="#0f64d6" />
        <stop offset="1" stopColor="#083287" />
      </radialGradient>
      <radialGradient id="mkP" cx=".32" cy=".25" r=".86">
        <stop offset="0" stopColor="#ffd1f0" />
        <stop offset=".42" stopColor="#ff4a96" />
        <stop offset=".82" stopColor="#c91868" />
        <stop offset="1" stopColor="#7a063c" />
      </radialGradient>
      <radialGradient id="mkD" cx=".32" cy=".25" r=".88">
        <stop offset="0" stopColor="#a9bae6" />
        <stop offset=".48" stopColor="#5e71a1" />
        <stop offset="1" stopColor="#2d395c" />
      </radialGradient>
      {/* Rich glossy gradients for Power-Up Tool Artwork */}
      <linearGradient id="puHammerMetal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff6d6" />
        <stop offset=".35" stopColor="#ffc94d" />
        <stop offset=".75" stopColor="#e87917" />
        <stop offset="1" stopColor="#8c3200" />
      </linearGradient>
      <linearGradient id="puHammerCap" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#eef5ff" />
        <stop offset=".5" stopColor="#9ab2dc" />
        <stop offset="1" stopColor="#45557a" />
      </linearGradient>
      <linearGradient id="puHammerWood" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f3b26a" />
        <stop offset=".55" stopColor="#b85e24" />
        <stop offset="1" stopColor="#592408" />
      </linearGradient>
      <radialGradient id="puBoomOrb" cx=".34" cy=".28" r=".78">
        <stop offset="0" stopColor="#8f9ec9" />
        <stop offset=".35" stopColor="#323d66" />
        <stop offset=".78" stopColor="#161b36" />
        <stop offset="1" stopColor="#090c1c" />
      </radialGradient>
      <linearGradient id="puBoomCore" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffe77a" />
        <stop offset=".5" stopColor="#ff6640" />
        <stop offset="1" stopColor="#cc123f" />
      </linearGradient>
      <linearGradient id="puRefreshEmerald" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#b8ffe5" />
        <stop offset=".45" stopColor="#3de69c" />
        <stop offset="1" stopColor="#0a8554" />
      </linearGradient>
      <linearGradient id="puUndoSky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d6f7ff" />
        <stop offset=".45" stopColor="#34d3ff" />
        <stop offset="1" stopColor="#0d6ec2" />
      </linearGradient>
      <radialGradient id="puHintBulb" cx=".42" cy=".32" r=".72">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset=".4" stopColor="#fff085" />
        <stop offset=".85" stopColor="#ffae24" />
        <stop offset="1" stopColor="#cc6200" />
      </radialGradient>
      <linearGradient id="puPrismOuter" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ff7aa8" />
        <stop offset=".5" stopColor="#c77dff" />
        <stop offset="1" stopColor="#34d3ff" />
      </linearGradient>
      <linearGradient id="puPrismInner" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff6c4" />
        <stop offset=".55" stopColor="#ff9de2" />
        <stop offset="1" stopColor="#75e7ff" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Original Block Clash 4-prism interlocking emblem.
 */
export const BrandMarkSvg: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
    <rect
      x="3"
      y="3"
      width="58"
      height="58"
      rx="16"
      fill="#0d1329"
      stroke="rgba(255,255,255,0.16)"
      strokeWidth="1.8"
    />
    {/* Top-Left Cyan Faceted Block */}
    <rect x="10" y="10" width="20" height="20" rx="5" fill="url(#bcCyan)" />
    <path d="M13 13h14l-4 4H17l-4 4z" fill="rgba(255,255,255,0.42)" />
    {/* Top-Right Amber Gold Faceted Block */}
    <rect x="34" y="10" width="20" height="20" rx="5" fill="url(#bcGold)" />
    <path d="M37 13h14l-4 4H41l-4 4z" fill="rgba(255,255,255,0.45)" />
    {/* Bottom-Left Coral Faceted Block */}
    <rect x="10" y="34" width="20" height="20" rx="5" fill="url(#bcCoral)" />
    <path d="M13 37h14l-4 4H17l-4 4z" fill="rgba(255,255,255,0.36)" />
    {/* Bottom-Right Jade Faceted Block */}
    <rect x="34" y="34" width="20" height="20" rx="5" fill="url(#bcJade)" />
    <path d="M37 37h14l-4 4H41l-4 4z" fill="rgba(255,255,255,0.38)" />
    {/* Central Clash Spark */}
    <circle cx="32" cy="32" r="7" fill="rgba(13,19,41,0.85)" />
    <path
      d="M32 21l2.5 8.5L43 32l-8.5 2.5L32 43l-2.5-8.5L21 32l8.5-2.5z"
      fill="#fff5b8"
      stroke="#ffc845"
      strokeWidth="0.9"
      strokeLinejoin="round"
    />
  </svg>
);

export const CubeMarkSvg: React.FC<{ className?: string }> = ({ className }) => (
  <BrandMarkSvg className={className} />
);

export const BigOrbitLogo: React.FC<{ visible: boolean }> = ({ visible }) => (
  <svg
    className="logo big"
    style={{ display: visible ? 'block' : 'none' }}
    viewBox="0 0 120 120"
    aria-hidden="true"
  >
    <g className="orb2">
      <circle
        cx="60"
        cy="60"
        r="48"
        fill="none"
        stroke="rgba(255,200,69,0.55)"
        strokeWidth="2"
        strokeDasharray="6 8"
      />
      <circle cx="60" cy="12" r="6" fill="#34d3ff" />
      <circle cx="18.4" cy="84" r="6" fill="#ff5478" />
      <circle cx="101.6" cy="84" r="6" fill="#3de69c" />
    </g>
    <g transform="translate(26 26) scale(1.06)">
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="16"
        fill="#101733"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="2"
      />
      <rect x="10" y="10" width="20" height="20" rx="5" fill="url(#bcCyan)" />
      <rect x="34" y="10" width="20" height="20" rx="5" fill="url(#bcGold)" />
      <rect x="10" y="34" width="20" height="20" rx="5" fill="url(#bcCoral)" />
      <rect x="34" y="34" width="20" height="20" rx="5" fill="url(#bcJade)" />
      <circle cx="32" cy="32" r="7" fill="#101733" />
      <path
        d="M32 21l2.5 8.5L43 32l-8.5 2.5L32 43l-2.5-8.5L21 32l8.5-2.5z"
        fill="#fff5b8"
      />
    </g>
  </svg>
);

export const GemIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2.5l8 7.2L12 21.5 4 9.7z"
      fill="url(#gmF)"
      stroke="rgba(255,255,255,.75)"
      strokeWidth="1"
    />
    <path
      d="M4 9.7h16M12 2.5L8.6 9.7 12 21.5l3.4-11.8z"
      fill="none"
      stroke="rgba(255,255,255,.6)"
      strokeWidth=".9"
    />
  </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l3 6.6 7.2.8-5.4 4.8 1.6 7.1L12 17.6 5.6 21.3l1.6-7.1L1.8 9.4 9 8.6z" />
  </svg>
);

export const FlameIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <linearGradient id="flmG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff3a8" />
        <stop offset="0.45" stopColor="#ffae2b" />
        <stop offset="1" stopColor="#ff4624" />
      </linearGradient>
    </defs>
    <path
      d="M12.6 2.2c.3 3.4-1.5 5.2-3.2 7-1.6 1.7-2.9 3.2-2.9 5.8a5.5 5.5 0 0011 0c0-2.5-1.3-4.6-2.8-6.4-.3 1.4-1.1 2.2-1.9 2.5.7-2.2 1-5.6-.2-8.9z"
      fill="url(#flmG)"
      stroke="#fff2c2"
      strokeWidth="0.9"
      strokeLinejoin="round"
    />
    <path
      d="M12 11.8c1.5 1.4 2.2 2.6 2.2 4a2.2 2.2 0 11-4.4 0c0-1.3.7-2.5 2.2-4z"
      fill="#fffbe0"
      fillOpacity="0.88"
    />
  </svg>
);

export const HeartIcon: React.FC<{ on: boolean; className?: string }> = ({
  on,
  className = '',
}) => {
  const path =
    'M50 86C20 62 4 46 4 28 4 14 15 4 28 4 38 4 46 10 50 18 54 10 62 4 72 4 85 4 96 14 96 28 96 46 80 62 50 86Z';
  return on ? (
    <svg className={`hh ${className}`} viewBox="0 0 100 90" aria-hidden="true">
      <path d={path} fill="url(#hg2)" />
      <path
        d="M16 24C18 15 26 10 33 11"
        stroke="#fff"
        strokeOpacity=".65"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ) : (
    <svg className={`hh off ${className}`} viewBox="0 0 100 90" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const LockIcon: React.FC<{ className?: string }> = ({ className = 'lk' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M8.2 10.6V7.8a3.8 3.8 0 017.6 0v2.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <rect x="5" y="10.2" width="14" height="10.4" rx="2.8" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14.6" r="1.45" fill="var(--lk-hole, #12172c)" stroke="none" />
    <rect x="11.25" y="15.2" width="1.5" height="2.6" rx="0.7" fill="var(--lk-hole, #12172c)" stroke="none" />
  </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const BackIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const PauseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

export const PlayIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />
  </svg>
);

export const HelpIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.4a2.6 2.6 0 015 .8c0 1.7-2.6 2.2-2.6 3.7" />
    <circle cx="12" cy="17.2" r="0.7" fill="currentColor" />
  </svg>
);

export const RefreshIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12a8 8 0 0114-5.3L20 9" />
    <path d="M20 4v5h-5" />
    <path d="M20 12a8 8 0 01-14 5.3L4 15" />
  </svg>
);

export const SoundIcon: React.FC<{ muted: boolean }> = ({ muted }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {!muted ? (
      <path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />
    ) : (
      <path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6" />
    )}
  </svg>
);

export const GearIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13a7.5 7.5 0 000-2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 00-1.7-1L15 3.5h-4l-.4 2.6a7.5 7.5 0 00-1.7 1l-2.3-1-2 3.4 2 1.5a7.5 7.5 0 000 2l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 001.7 1l.4 2.6h4l.4-2.6a7.5 7.5 0 001.7-1l2.3 1 2-3.4z" />
  </svg>
);

export const GiftIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="9" width="18" height="12" rx="2" />
    <path d="M12 9v12M3 14h18M12 9C9 9 7 7.5 7.6 6 8.6 4 12 6 12 9zm0 0c3 0 5-1.5 4.4-3C15.4 4 12 6 12 9z" />
  </svg>
);

export const TrophyIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM7 6H4v1a4 4 0 004 4M17 6h3v1a4 4 0 01-4 4" />
  </svg>
);

export const RankIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 21v-8h5v8M8 21V5h8v16M16 21v-11h5v11M2 21h20" />
  </svg>
);

export const ThemeIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5h2a4 4 0 004-4c0-5-4-9.5-9-9.5z" />
    <circle cx="7.5" cy="11" r="1" />
    <circle cx="10" cy="7" r="1" />
    <circle cx="15" cy="7.5" r="1" />
  </svg>
);

export const ChartIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </svg>
);

export const AvatarSvg: React.FC<{ index: number }> = ({ index }) => {
  const c = AVATAR_COLORS[index % 6];
  const shapeIdx = index % 6;
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={c} />
      <circle cx="20" cy="20" r="20" fill="url(#lgT)" fillOpacity=".28" />
      <g fill="#fff" fillOpacity=".92">
        {shapeIdx === 0 && <path d="M20 8l10 12-10 12L10 20z" />}
        {shapeIdx === 1 && <path d="M20 7l11 6v14l-11 6-11-6V13z" />}
        {shapeIdx === 2 && <rect x="10" y="10" width="20" height="20" rx="5" />}
        {shapeIdx === 3 && <path d="M20 8l12 22H8z" />}
        {shapeIdx === 4 && <circle cx="20" cy="20" r="11" />}
        {shapeIdx === 5 && (
          <path d="M20 7l3.8 8.4 9 1-6.7 6 1.9 9L20 26.8 12 31.4l1.9-9-6.7-6 9-1z" />
        )}
      </g>
    </svg>
  );
};

export const ItemSvg: React.FC<{ itemIndex: number }> = ({ itemIndex }) => {
  const item = ITEMS[itemIndex] || ITEMS[0];
  const F = `url(#igF${itemIndex})`;
  const R = `url(#igR${itemIndex})`;
  const dk = item.c3;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {(item.shape === 'coin' || item.shape === 'hex') && (
        <>
          <circle cx="12" cy="12" r="11" fill={R} />
          <circle cx="12" cy="12" r="9.3" fill={F} />
          <circle
            cx="12"
            cy="12"
            r="9.3"
            fill="none"
            stroke={dk}
            strokeOpacity=".55"
            strokeWidth=".9"
          />
          <circle
            cx="12"
            cy="12"
            r="7.3"
            fill="none"
            stroke="#fff"
            strokeOpacity=".45"
            strokeWidth=".9"
          />
          {item.shape === 'hex' ? (
            <>
              <path
                d="M12 6.6l4.2 2.4v6L12 17.4 7.8 15V9z"
                fill={dk}
                fillOpacity=".85"
              />
              <path
                d="M12 6.6l4.2 2.4L12 11.4 7.8 9z"
                fill="#fff"
                fillOpacity=".35"
              />
            </>
          ) : (
            <path
              d="M12 7.2l1.5 3.1 3.4.4-2.5 2.3.7 3.4-3.1-1.7-3.1 1.7.7-3.4-2.5-2.3 3.4-.4z"
              fill={dk}
              fillOpacity=".75"
            />
          )}
          <path
            d="M5.8 8.6A7.4 7.4 0 019.6 5"
            stroke="#fff"
            strokeOpacity=".8"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {item.shape === 'gem' && (
        <>
          <path
            d="M12 1.5l8.5 8.2L12 22.5 3.5 9.7z"
            fill={F}
            stroke={dk}
            strokeWidth=".9"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 9.7h17M12 1.5L8.6 9.7 12 22.5l3.4-12.8z"
            fill="none"
            stroke="#fff"
            strokeOpacity=".7"
            strokeWidth=".9"
            strokeLinejoin="round"
          />
          <path d="M8.6 9.7L12 1.5l3.4 8.2z" fill="#fff" fillOpacity=".35" />
        </>
      )}
      {item.shape === 'key' && (
        <>
          <circle cx="8" cy="8.5" r="5.3" fill="none" stroke={R} strokeWidth="3.2" />
          <circle
            cx="8"
            cy="8.5"
            r="5.3"
            fill="none"
            stroke={dk}
            strokeOpacity=".4"
            strokeWidth=".8"
          />
          <path
            d="M11.8 12.3L21.5 22M16.8 17.3l3.2-3.2M19.6 20.1l2.1-2.1"
            fill="none"
            stroke={R}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M5 6a4 4 0 012.4-1.7"
            stroke="#fff"
            strokeOpacity=".8"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {item.shape === 'orb' && (
        <>
          <circle cx="12" cy="12" r="7.4" fill={F} stroke={dk} strokeWidth=".9" />
          <ellipse
            cx="12"
            cy="12"
            rx="11"
            ry="4.2"
            fill="none"
            stroke="#fff"
            strokeOpacity=".85"
            strokeWidth="1.5"
            transform="rotate(-28 12 12)"
          />
          <ellipse cx="9.6" cy="9.3" rx="2.4" ry="1.6" fill="#fff" fillOpacity=".7" />
        </>
      )}
      {item.shape === 'crown' && (
        <>
          <path
            d="M2.5 19.5V7.5l5.2 5 4.3-9 4.3 9 5.2-5v12z"
            fill={R}
            stroke={dk}
            strokeWidth=".9"
            strokeLinejoin="round"
          />
          <rect
            x="2.5"
            y="17.2"
            width="19"
            height="2.6"
            rx="1"
            fill={dk}
            fillOpacity=".45"
          />
          <circle
            cx="12"
            cy="13.8"
            r="1.7"
            fill="#ff5d7a"
            stroke="#fff"
            strokeOpacity=".7"
            strokeWidth=".6"
          />
          <circle cx="6.6" cy="14.4" r="1.1" fill="#34e0ff" />
          <circle cx="17.4" cy="14.4" r="1.1" fill="#4ff0a0" />
        </>
      )}
    </svg>
  );
};

export const LevelGoalIcon: React.FC<{ type: Exclude<LevelGoalType, 'item'> }> = ({
  type,
}) => {
  if (type === 'score') {
    return (
      <svg viewBox="0 0 24 24" style={{ ['--ic' as string]: 'var(--c0)' }} aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    );
  }
  if (type === 'lines') {
    return (
      <svg viewBox="0 0 24 24" style={{ ['--ic' as string]: 'var(--c1)' }} aria-hidden="true">
        <path d="M4 6h16M4 12h16M4 18h16M8 4v16M16 4v16" />
      </svg>
    );
  }
  if (type === 'color') {
    return (
      <svg viewBox="0 0 24 24" style={{ ['--ic' as string]: 'var(--c3)' }} aria-hidden="true">
        <rect x="4" y="12" width="7" height="7" rx="1.5" />
        <rect x="13" y="12" width="7" height="7" rx="1.5" />
        <rect x="8.5" y="4" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" style={{ ['--ic' as string]: 'var(--c5)' }} aria-hidden="true">
      <path d="M10 14a4 4 0 010-6l2-2a4 4 0 016 6l-1 1M14 10a4 4 0 010 6l-2 2a4 4 0 01-6-6l1-1" />
    </svg>
  );
};

export const MapGemSvg: React.FC<{ kind: 'b' | 'p' | 'd'; ms: boolean }> = ({
  kind,
  ms,
}) => {
  const rc = kind === 'p' ? 'mkS' : kind === 'd' ? 'mkS2' : 'mkG';
  const gc = kind === 'p' ? 'mkP' : kind === 'd' ? 'mkD' : 'mkB';
  const R = ms ? 22 : 35;

  const facets: React.ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const a = ((i * 45 - 22.5) * Math.PI) / 180;
    const b = a + Math.PI / 4;
    const d = `M50 50L${(50 + R * Math.cos(a)).toFixed(1)} ${(
      50 +
      R * Math.sin(a)
    ).toFixed(1)}L${(50 + R * Math.cos(b)).toFixed(1)} ${(
      50 +
      R * Math.sin(b)
    ).toFixed(1)}Z`;
    facets.push(
      <path
        key={i}
        d={d}
        fill={i % 2 ? 'rgba(255,255,255,.22)' : 'rgba(6,12,48,.24)'}
      />
    );
  }

  return (
    <svg className="gm2" viewBox="0 0 100 100" aria-hidden="true">
      {ms ? (
        <>
          <rect
            x="16"
            y="16"
            width="68"
            height="68"
            rx="12"
            transform="rotate(45 50 50)"
            fill={`url(#${rc})`}
            stroke="rgba(255,255,255,0.58)"
            strokeWidth="1.5"
          />
          <rect
            x="22.5"
            y="22.5"
            width="55"
            height="55"
            rx="8.5"
            transform="rotate(45 50 50)"
            fill="none"
            stroke="rgba(16,18,38,0.38)"
            strokeWidth="1.6"
          />
          <rect
            x="26.5"
            y="26.5"
            width="47"
            height="47"
            rx="6.5"
            transform="rotate(45 50 50)"
            fill={`url(#${gc})`}
            stroke="rgba(0,0,0,.44)"
            strokeWidth="1.2"
          />
          <rect
            x="32"
            y="32"
            width="36"
            height="36"
            rx="4"
            transform="rotate(45 50 50)"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1"
          />
        </>
      ) : (
        <>
          <circle
            cx="50"
            cy="50"
            r="48.2"
            fill={`url(#${rc})`}
            stroke="rgba(255,255,255,0.56)"
            strokeWidth="1.6"
          />
          <circle
            cx="50"
            cy="50"
            r="43.5"
            fill="none"
            stroke="rgba(14,18,40,0.42)"
            strokeWidth="1.7"
          />
          <circle
            cx="50"
            cy="50"
            r="40.5"
            fill={`url(#${gc})`}
            stroke="rgba(0,0,0,.44)"
            strokeWidth="1.2"
          />
          <circle
            cx="50"
            cy="50"
            r="32.5"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1"
          />
          <path
            d="M 19 36 A 35 35 0 0 1 73 20"
            fill="none"
            stroke="rgba(255,255,255,0.68)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M 28 77 A 33 33 0 0 0 74 72"
            fill="none"
            stroke={kind === 'd' ? 'rgba(176,204,255,0.34)' : 'rgba(255,244,196,0.42)'}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      )}
      {facets}
      {kind === 'd' && !ms && (
        <path
          d="M 24 68 L 68 24"
          stroke="rgba(220,234,255,0.2)"
          strokeWidth="9"
          strokeLinecap="round"
        />
      )}
      <ellipse
        cx={ms ? 44 : 36}
        cy={ms ? 36 : 29}
        rx={ms ? 9.5 : 13.5}
        ry={ms ? 5 : 6.6}
        fill="#fff"
        fillOpacity={kind === 'd' ? '.36' : '.62'}
        transform={`rotate(-30 ${ms ? 44 : 36} ${ms ? 36 : 29})`}
      />
      <circle
        cx={ms ? 61 : 67}
        cy={ms ? 61 : 68}
        r={2.5}
        fill="#fff"
        fillOpacity={kind === 'd' ? '0.24' : '0.38'}
      />
    </svg>
  );
};

export const HammerIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`pu-art pu-art-hammer ${className}`.trim()}
    viewBox="0 0 36 36"
    aria-hidden="true"
  >
    <g className="pu-anim-hammer">
      {/* Wooden Handle */}
      <path
        d="M17.2 15.8l3 3-11.2 11.2a2.1 2.1 0 01-3 0l-.2-.2a2.1 2.1 0 010-3z"
        fill="url(#puHammerWood)"
        stroke="#2a1103"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 27.6l9.8-9.8"
        stroke="rgba(255,226,184,0.45)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Brass Collar */}
      <rect
        x="16.4"
        y="12.6"
        width="5.2"
        height="4.4"
        rx="1.2"
        transform="rotate(45 19 14.8)"
        fill="url(#puHammerCap)"
        stroke="#1b2442"
        strokeWidth="1"
      />
      {/* Heavy Forged Mallet Head */}
      <path
        d="M14.2 5.4c.8-.8 2.1-.8 2.9 0l11.5 11.5c.8.8.8 2.1 0 2.9l-2.8 2.8c-.8.8-2.1.8-2.9 0L11.4 11.1c-.8-.8-.8-2.1 0-2.9z"
        fill="url(#puHammerMetal)"
        stroke="#2c1200"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {/* Steel Strike Face */}
      <path
        d="M24.2 13.8l4.4 4.4-2.2 2.2-4.4-4.4z"
        fill="url(#puHammerCap)"
        stroke="#1b2442"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {/* Specular Gloss */}
      <path
        d="M14.5 7.4l7.6 7.6"
        stroke="rgba(255,255,255,0.68)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </g>
    {/* Subtle Spark Star */}
    <path
      className="pu-anim-glint"
      d="M28.5 5.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"
      fill="#fff4ad"
    />
  </svg>
);

export const BoomIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`pu-art pu-art-boom ${className}`.trim()}
    viewBox="0 0 36 36"
    aria-hidden="true"
  >
    {/* Braided Fuse */}
    <path
      d="M21.5 10.8c1.6-2.5 3.6-3.7 6.2-3.4"
      fill="none"
      stroke="#d9a15b"
      strokeWidth="2.3"
      strokeLinecap="round"
    />
    {/* Brass Fuse Cap */}
    <rect
      x="17.8"
      y="8.6"
      width="6"
      height="4"
      rx="1.2"
      transform="rotate(28 20.8 10.6)"
      fill="url(#puHammerMetal)"
      stroke="#231204"
      strokeWidth="1"
    />
    {/* Bomb Iron Sphere */}
    <circle
      cx="15.4"
      cy="21.4"
      r="10.4"
      fill="url(#puBoomOrb)"
      stroke="#090d1f"
      strokeWidth="1.4"
    />
    {/* Danger Core Ring & Flame Emblem */}
    <circle
      cx="15.4"
      cy="21.4"
      r="5.2"
      fill="url(#puBoomCore)"
      opacity="0.92"
    />
    <path
      d="M15.4 17.6l1.3 2.5 2.7.4-2 1.9.5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-1.9 2.7-.4z"
      fill="#fff7c2"
    />
    {/* Gloss Highlight */}
    <ellipse
      cx="11.4"
      cy="16.2"
      rx="3.1"
      ry="1.7"
      transform="rotate(-34 11.4 16.2)"
      fill="rgba(255,255,255,0.52)"
    />
    {/* Animated Fuse Spark */}
    <g className="pu-anim-spark">
      <circle cx="28.4" cy="7.4" r="3.4" fill="rgba(255,140,40,0.45)" />
      <path
        d="M28.4 2.8l1.1 3.4 3.4 1.2-3.4 1.1-1.1 3.4-1.2-3.4-3.4-1.1 3.4-1.2z"
        fill="#fff39e"
      />
    </g>
  </svg>
);

export const ToolRefreshIcon: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    className={`pu-art pu-art-refresh ${className}`.trim()}
    viewBox="0 0 36 36"
    aria-hidden="true"
  >
    <g className="pu-anim-orbit">
      <path
        d="M9.2 13.5A10.2 10.2 0 0125.6 9.6l1.9-1.9.8 7-7-.8 2-2a7.2 7.2 0 00-11.2 2.9z"
        fill="url(#puRefreshEmerald)"
        stroke="#053824"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M26.8 22.5a10.2 10.2 0 01-16.4 3.9l-1.9 1.9-.8-7 7 .8-2 2a7.2 7.2 0 0011.2-2.9z"
        fill="url(#puUndoSky)"
        stroke="#072c4d"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </g>
    {/* Glowing Cube Core */}
    <rect
      x="14.2"
      y="14.2"
      width="7.6"
      height="7.6"
      rx="2"
      transform="rotate(45 18 18)"
      fill="url(#puRefreshEmerald)"
      stroke="#d4fff0"
      strokeWidth="1.1"
    />
  </svg>
);

export const UndoIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`pu-art pu-art-undo ${className}`.trim()}
    viewBox="0 0 36 36"
    aria-hidden="true"
  >
    {/* Ambient Time Halo */}
    <circle
      cx="18"
      cy="18"
      r="13.5"
      fill="rgba(52,211,255,0.1)"
      stroke="rgba(128,232,255,0.28)"
      strokeWidth="1.2"
    />
    <g className="pu-anim-undo">
      <path
        d="M14.4 7.4L5.6 15l8.8 7.6v-4.5h5.8a5.4 5.4 0 010 10.8H15v4.2h5.2a9.6 9.6 0 000-19.2h-5.8z"
        fill="url(#puUndoSky)"
        stroke="#06284d"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M12.6 11.3L8.3 15l4.3 3.7"
        fill="none"
        stroke="rgba(255,255,255,0.58)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

export const HintIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`pu-art pu-art-hint ${className}`.trim()}
    viewBox="0 0 36 36"
    aria-hidden="true"
  >
    {/* Radiant Halo Rays */}
    <g className="pu-anim-rays" stroke="#ffe57f" strokeWidth="2" strokeLinecap="round">
      <path d="M18 3.2v2.4M7.2 8.2l1.8 1.8M28.8 8.2l-1.8 1.8M4.6 16.8H7M29 16.8h2.4" />
    </g>
    {/* Bulb Glass */}
    <path
      d="M18 7.5a9 9 0 00-6 15.7c1.1 1 1.8 2.2 2 3.8h8c.2-1.6.9-2.8 2-3.8a9 9 0 00-6-15.7z"
      fill="url(#puHintBulb)"
      stroke="#5c2800"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    {/* Filament */}
    <path
      d="M14.6 17.6l1.7-2.4 1.7 2.4 1.7-2.4 1.7 2.4M18 26.8v-7.2"
      fill="none"
      stroke="#fffdf0"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Metal Socket Base */}
    <rect
      x="13.5"
      y="27"
      width="9"
      height="3.2"
      rx="1.4"
      fill="url(#puHammerCap)"
      stroke="#1e2747"
      strokeWidth="1"
    />
    <rect
      x="14.8"
      y="30.2"
      width="6.4"
      height="2.6"
      rx="1.3"
      fill="url(#puHammerMetal)"
      stroke="#2c1200"
      strokeWidth="0.9"
    />
  </svg>
);

export const ColorBlastIcon: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    className={`pu-art pu-art-prism ${className}`.trim()}
    viewBox="0 0 36 36"
    aria-hidden="true"
  >
    <g className="pu-anim-prism">
      {/* Outer 8-point Starburst */}
      <path
        d="M18 2.8l3.5 9.6 10 1.4-7.4 6.8 1.9 9.9L18 25.6 10 30.5l1.9-9.9-7.4-6.8 10-1.4z"
        fill="url(#puPrismOuter)"
        stroke="#200d3d"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Inner Facet */}
      <path
        d="M18 7.8l2.1 5.8 6.1.9-4.5 4.1 1.2 6-4.9-2.8-4.9 2.8 1.2-6-4.5-4.1 6.1-.9z"
        fill="url(#puPrismInner)"
        opacity="0.9"
      />
    </g>
    {/* Core Gem */}
    <circle
      cx="18"
      cy="17.8"
      r="3.2"
      fill="#ffffff"
      stroke="#8d3dff"
      strokeWidth="1.2"
    />
  </svg>
);

export const PowerUpIcon: React.FC<{
  id: 'hammer' | 'boom' | 'refresh' | 'undo' | 'hint' | 'colorBlast';
  className?: string;
}> = ({ id, className }) => {
  switch (id) {
    case 'hammer':
      return <HammerIcon className={className} />;
    case 'boom':
      return <BoomIcon className={className} />;
    case 'refresh':
      return <ToolRefreshIcon className={className} />;
    case 'undo':
      return <UndoIcon className={className} />;
    case 'hint':
      return <HintIcon className={className} />;
    case 'colorBlast':
      return <ColorBlastIcon className={className} />;
  }
};

export const MissionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
    <path d="M8.5 12.2l2.4 2.4 4.8-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M13.2 2.5L5.5 13h5.7l-.4 8.5 7.7-10.5h-5.7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
  </svg>
);

export const SoundPackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 17.5V6.5l10-2v11" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6.5" cy="17.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
    <circle cx="16.5" cy="15.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
  </svg>
);

export const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 12a9 9 0 103.1-6.8L3 8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 3.5V8h4.5M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ShieldChallengeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3l7.5 3.2v5.4c0 4.6-3.2 8.4-7.5 9.9-4.3-1.5-7.5-5.3-7.5-9.9V6.2z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M9.5 12l2 2 3.5-3.8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

