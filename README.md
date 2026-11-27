# Block Clash — Offline Tactile Block Puzzle

Block Clash is an offline-first 8x8 block puzzle game built with React, TypeScript, Vite, D3, and synthesized Web Audio.

## Preserved Game Modes
- **Levels**: Infinite procedural level journey across four themed realms (`Crystal Valley`, `Cloud City`, `Volcano`, `Abyss`) with realm tabs, 5 goal types, limited moves, and 1–3 star rewards.
- **Timer**: 90s / 3m / 5m countdown rush where clearing lines adds `+2s` bonus time.
- **Classic**: Endless 8x8 puzzle strategy with adaptive difficulty scaling, 5 regenerating lives, and 10-gem continues.

## Supporting Features
- Interactive 4-step visual Tutorial (auto-shown on first visit and replayable from Home & Settings)
- Full Pause Overlay (`P` / `Esc` / Pause button) that freezes Timer mode and audio cleanly
- Invalid placement detection & visual pulse feedback
- Daily login gem rewards, 10 achievements, lifetime stats, 4 unlockable material themes, and local device top-10 rankings

## Commands
- `npm run dev` — Run local dev server on port 3000
- `npm run build` — Build production web bundle (`dist/`)
- `npm run build:android` — Build offline single-file bundle into `assets/game/` for Flutter Android WebView
- `npm run lint` — Run TypeScript & ESLint verification
- `npx --yes tsx --test src/utils/*.test.ts` — Run pure game logic unit tests
