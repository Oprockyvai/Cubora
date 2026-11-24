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
        <stop offset="0" stopColor="#fff0a0" />
        <stop offset=".5" stopColor="#e0a000" />
        <stop offset="1" stopColor="#7a4f00" />
      </linearGradient>
      <linearGradient id="mkS" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f4f6fa" />
        <stop offset=".5" stopColor="#9aa0aa" />
        <stop offset="1" stopColor="#4a4f58" />
      </linearGradient>
      <linearGradient id="mkS2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#b9bdc7" />
        <stop offset=".5" stopColor="#6b707b" />
        <stop offset="1" stopColor="#2e3138" />
      </linearGradient>
      <radialGradient id="mkB" cx=".35" cy=".28" r=".9">
        <stop offset="0" stopColor="#a8d8ff" />
        <stop offset=".5" stopColor="#2d7bff" />
        <stop offset="1" stopColor="#0a2a86" />
      </radialGradient>
      <radialGradient id="mkP" cx=".35" cy=".28" r=".9">
        <stop offset="0" stopColor="#e8bfff" />
        <stop offset=".5" stopColor="#9b4dff" />
        <stop offset="1" stopColor="#3d0f8a" />
      </radialGradient>
      <radialGradient id="mkD" cx=".35" cy=".28" r=".9">
        <stop offset="0" stopColor="#70707a" />
        <stop offset=".55" stopColor="#2a2a30" />
        <stop offset="1" stopColor="#0b0b0f" />
      </radialGradient>
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
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
);

export const CheckIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
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
        fill={i % 2 ? 'rgba(255,255,255,.2)' : 'rgba(0,10,60,.22)'}
      />
    );
  }

  return (
    <svg className="gm2" viewBox="0 0 100 100" aria-hidden="true">
      {ms ? (
        <>
          <rect
            x="19"
            y="19"
            width="62"
            height="62"
            rx="9"
            transform="rotate(45 50 50)"
            fill={`url(#${rc})`}
          />
          <rect
            x="27"
            y="27"
            width="46"
            height="46"
            rx="6"
            transform="rotate(45 50 50)"
            fill={`url(#${gc})`}
            stroke="rgba(0,0,0,.35)"
            strokeWidth="1.2"
          />
        </>
      ) : (
        <>
          <circle cx="50" cy="50" r="48" fill={`url(#${rc})`} />
          <circle
            cx="50"
            cy="50"
            r="40.5"
            fill={`url(#${gc})`}
            stroke="rgba(0,0,0,.35)"
            strokeWidth="1.2"
          />
        </>
      )}
      {facets}
      <ellipse
        cx={ms ? 44 : 36}
        cy={ms ? 36 : 29}
        rx={ms ? 9 : 12}
        ry={ms ? 5 : 6.5}
        fill="#fff"
        fillOpacity=".55"
        transform={`rotate(-30 ${ms ? 44 : 36} ${ms ? 36 : 29})`}
      />
    </svg>
  );
};
