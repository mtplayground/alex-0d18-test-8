# alex-0d18-test-8

## Current State

This project is a lightweight Vite + TypeScript browser game foundation built
around a full-window HTML canvas. It now renders a small tile-grid scene with a
fixed-timestep game loop, FPS counter, and layered tile rendering.

## What It Does

- Boots from `index.html` into `src/main.ts` and validates the `#app-canvas`
  element plus 2D canvas support.
- Resizes the canvas for the viewport and device pixel ratio.
- Runs a fixed-timestep `requestAnimationFrame` game loop with update/render
  hooks.
- Tracks keyboard input with pressed/down state, edge-triggered `wasPressed`,
  and blur cleanup.
- Supports scene lifecycle management with `enter`, `exit`, `update`, and
  `render`.
- Provides base entity and entity-manager primitives.
- Provides pure AABB collision helpers.
- Loads image assets asynchronously and can draw spritesheet tiles with colored
  rectangle fallback rendering.
- Defines tile types, a tile grid data structure, brick quadrant damage, and
  canvas rendering for tile grids. Grass is marked as an overlay layer so it can
  render above entities later.

## Architecture

- Vite is the build and development server.
- TypeScript is configured in strict browser/bundler mode.
- Runtime code lives under `src/`, organized by responsibility:
  - `core/`: game loop, input, and scene management.
  - `entities/`: base entity and entity manager.
  - `physics/`: pure collision helpers.
  - `assets/`: image asset loading.
  - `rendering/`: sprite rendering helpers.
  - `tiles/`: tile types, grids, brick damage, and tile-grid rendering.
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
  tile state, and rendering calculations.
- Keep generated build output and local environment files out of git.
