# Block Clash — Project Audit & Release Readiness

## 1. Architecture Summary
- **Active Web/Mobile Runtime**: React 19 + TypeScript + Vite (`src/`) with D3 ambient dust overlay (`HomeDustOverlay.tsx`), procedural Web Audio synthesizer (`src/utils/audio.ts`), and responsive mobile-first + desktop CSS design system (`src/styles/cubora.css`).
- **Offline Storage**: LocalStorage keys preserved with backward compatibility (`cb2`, `qbp`, `qbl`, `qbc`, `qbm`, plus `bc_tut_seen`).
- **Preserved Game Modes**:
  1. `level` (Levels): 4 cycling worlds (`Crystal Valley`, `Neon City`, `Lava Core`, `Quantum Realm`), procedural goals (`score`, `lines`, `item`, `color`, `combo`), move limit, 1–3 star ratings, +2 gems on first 3-star completion.
  2. `timer` (Timer Rush): 90s / 3m / 5m countdowns with +2s bonus per cleared line and -5s + 3-row emergency clear when out of moves.
  3. `classic` (Classic Endless): 8x8 endless placement, 5-life regeneration (15 min per life), 10-gem revive once per run, local top-10 leaderboard.

## 2. Offline & Privacy Posture
- Zero accounts, zero ads, zero analytics/tracking SDKs, zero network calls required for gameplay.
- All scores, settings, themes, achievements, and profile preferences stay strictly on-device.

## 3. Release Verification Checklist
1. Build production bundle: `npm run build` (`dist/`).
2. Run pure logic unit tests: `npx --yes tsx --test src/utils/*.test.ts`.
3. Run TypeScript & ESLint verification: `npm run lint`.
4. Android Packaging (external Android SDK / Flutter / Capacitor environment):
   - Use updated `store/play_icon_512.png` (512x512) and `store/feature_graphic_1024x500.png` (1024x500).
   - Ensure release keystore + `key.properties` remain outside version control.
   - Verify target API level matches current Google Play Console policy (`>= API 35/36`) and test physical portrait ergonomics (`360px–430px`), audio pause on backgrounding, and back-button Pause/Exit flow before building signed `.aab`.
