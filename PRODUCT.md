# alex-0d18-test-8

## Current State

`alex-0d18-test-8` is a lightweight Vite + TypeScript browser tank-game
prototype built around a full-window HTML canvas. The current `main` branch has
a playable core scene with a loaded tile map, player movement, player firing,
enemy spawning, terrain and tank collision rules, score/life state, power-ups,
and scene-change detection.

## What It Does

- Boots from `index.html` into `src/main.ts`, validates the canvas, handles
  viewport/device-pixel-ratio resizing, and runs a fixed-timestep game loop.
- Tracks keyboard input with held-key and edge-triggered state. The player tank
  moves with Arrow keys or WASD and fires with Space.
- Renders a tile-grid level with empty, brick, steel, water, grass, ice, and
  base tiles. Grass renders as an overlay layer above entities.
- Loads compact level definitions from ASCII maps plus enemy wave config. Three
  starter level definitions are shipped; the boot scene starts on the first.
- Provides player and enemy tank entities, bullets, explosions, spawn flashes,
  and power-up entities.
- Supports player bullet firing with cooldown and active-bullet caps. A weapon
  upgrade temporarily raises the active-bullet cap and bullet speed.
- Resolves bullet-vs-terrain behavior: bricks lose quadrants, steel blocks,
  water/grass are pass-through, base hits mark the base destroyed unless shielded.
- Resolves bullet-vs-tank behavior with friendly fire disabled. Player hits
  lose lives; enemy kills award score and may drop configured power-ups.
- Defines enemy tank variants: basic, fast, and armored, with different speed,
  HP, and score values.
- Includes pure enemy AI decision logic for direction choice, target alignment,
  and shooting decisions, covered by unit tests.
- Spawns enemies from level wave config at three top spawn points, capped to
  four active enemies, with a brief spawn flash.
- Tracks level-complete and game-over conditions and emits scene-change events
  for next-level or game-over states.

## Architecture

- Vite is the browser build and development server.
- TypeScript is configured in strict browser/bundler mode.
- Runtime code lives under `src/`, organized by responsibility:
  - `core/`: game loop, input, and scene management.
  - `entities/`: base entity, entity manager, tanks, bullets, effects, and
    power-ups.
  - `game/`: gameplay rules such as firing, collisions, AI decisions, spawning,
    power-up effects, and level state transitions.
  - `levels/`: level format types, loader, and starter level definitions.
  - `physics/`: pure AABB collision helpers.
  - `assets/` and `rendering/`: image loading and sprite/tile rendering helpers.
  - `tiles/`: tile types, grid storage, brick damage, and tile-grid rendering.
- Styling lives in `src/style.css` and keeps the canvas full-window.
- Tests use Vitest and sit beside the source modules they cover.

## Commands

- `npm run dev` starts Vite on `0.0.0.0:8080`.
- `npm run build` runs TypeScript checking and creates the production build.
- `npm run preview` serves the production build on `0.0.0.0:8080`.
- `npm run lint` runs ESLint.
- `npm run format` formats files with Prettier.
- `npm run format:check` checks Prettier formatting.
- `npm test` runs Vitest.

## Conventions

- Keep the baseline lightweight; do not add frameworks unless a future issue
  requires them.
- Keep gameplay/domain modules decoupled from DOM bootstrap code.
- Prefer pure, unit-tested helpers for deterministic logic such as collision,
  AI decisions, spawning, level loading, power-up effects, and scene-state
  evaluation.
- Keep generated build output and local environment files out of git.
