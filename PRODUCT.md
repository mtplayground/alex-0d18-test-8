# alex-0d18-test-8

## Current State

`alex-0d18-test-8` is a Vite + TypeScript browser tank game built around a
full-window HTML canvas. The current `main` branch has a playable title-to-game
flow with pause, game-over, and victory screens; three starter levels; player
movement and firing; enemy waves; destructible terrain; power-ups; sound
effects with persistent mute; high score storage; a canvas HUD; production build
docs; unit tests; a Playwright smoke test; and Sprite-compatible preview
deployment settings.

## What It Does

- Boots from `index.html` into `src/main.ts`, validates the canvas, handles
  viewport/device-pixel-ratio resizing, and runs a fixed-timestep game loop.
- Starts on a title scene showing the product name, start prompt, and high score
  loaded from `localStorage`. `Enter` or `Space` starts a new game.
- Tracks keyboard input with held-key and edge-triggered state. Arrow keys or
  WASD move the player tank, `Space` fires, `P` toggles pause, and `M` toggles
  persistent mute.
- Renders compact tile-grid levels with empty, brick, steel, water, grass, ice,
  and base tiles. Grass renders as an overlay layer above entities.
- Loads three starter level definitions from ASCII maps plus enemy wave config.
  Level progression advances through the starter levels and shows victory after
  the final wave is cleared.
- Provides player and enemy tank entities, bullets, explosions, spawn flashes,
  and power-up entities.
- Supports player firing with cooldown and active-bullet caps. A weapon upgrade
  temporarily raises the active-bullet cap and bullet speed.
- Resolves bullet-vs-terrain behavior: bricks lose quadrants, steel blocks,
  water/grass are pass-through, and base hits trigger game over unless shielded.
- Resolves bullet-vs-tank behavior with friendly fire disabled. Enemy kills
  award score and may drop configured power-ups.
- Applies power-ups for extra life, base shield, weapon upgrade, and enemy
  freeze timers.
- Spawns enemies from level wave config at three top spawn points, capped to
  four active enemies, with a brief spawn flash.
- Renders an in-canvas HUD with lives, score, current level, and enemies
  remaining, and mirrors the same state to canvas attributes for accessibility
  and E2E assertions.
- Uses a Web Audio wrapper to decode bundled placeholder WAV samples, play sound
  effects by name, and persist mute preference in `localStorage`.

## Architecture

- Vite is the browser build and development server; TypeScript is configured in
  strict browser/bundler mode. Vite preview listens on `0.0.0.0:8080` and
  allows the current Sprite deployment host.
- Runtime code lives under `src/`, organized by responsibility:
  - `core/`: game loop, input, and scene management.
  - `scenes/`: title, pause, and result scenes.
  - `entities/`: base entity, entity manager, tanks, bullets, effects, and
    power-ups.
  - `game/`: gameplay rules such as firing, collisions, AI decisions, spawning,
    power-up effects, and level state transitions.
  - `levels/`: level format types, loader, and starter level definitions.
  - `audio/`: Web Audio manager, bundled sample definitions, and gameplay sound
    effect mapping.
  - `rendering/`: sprite fallback rendering and HUD rendering.
  - `tiles/`: tile types, grid storage, brick damage, and tile-grid rendering.
  - `physics/`: pure AABB collision helpers.
- Styling lives in `src/style.css` and keeps the canvas full-window with a dark
  page background, canvas backdrop, and pixel-rendering behavior.
- Tests use Vitest for unit coverage and Playwright for a production-build
  browser smoke test under `e2e/`.

## Commands

- `npm run dev` starts Vite on `0.0.0.0:8080`.
- `npm run build` runs TypeScript checking and creates the static production
  build in `dist/`.
- `npm run preview` serves the production build on `0.0.0.0:8080`.
- `npm test` runs Vitest unit tests under `src/`.
- `npm run test:e2e` builds the app, serves the production bundle, and runs the
  Playwright smoke test.
- `npm run lint` runs ESLint.
- `npm run format` formats files with Prettier.
- `npm run format:check` checks Prettier formatting.

## Conventions

- Keep the baseline lightweight; do not add frameworks unless a future issue
  requires them.
- Keep gameplay/domain modules decoupled from DOM bootstrap code.
- Prefer pure, unit-tested helpers for deterministic logic such as collision,
  AI decisions, spawning, level loading, power-up effects, HUD formatting, audio
  routing, and scene-state evaluation.
- Keep generated build output, Playwright artifacts, and local environment files
  out of git.
- If the Sprite deploy URL changes, update `preview.allowedHosts` in
  `vite.config.ts` before redeploying with `npm run preview`.
