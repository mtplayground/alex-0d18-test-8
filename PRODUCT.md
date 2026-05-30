# alex-0d18-test-8

## Current State

This project is a minimal Vite + TypeScript browser application. The merged app
currently provides a full-window HTML canvas as the primary application surface.

## What It Does

- Loads a single `index.html` entry point.
- Boots TypeScript from `src/main.ts`.
- Validates that the canvas exists and that 2D canvas rendering is available.
- Resizes the canvas for the viewport and device pixel ratio.
- Clears and fills the canvas with a dark baseline background.

## Architecture

- Vite is the build and development server.
- TypeScript is configured in strict browser/bundler mode.
- Runtime code lives under `src/`.
- Styling lives in `src/style.css` and is limited to reset rules plus full-window
  canvas layout.
- The canvas element is declared in `index.html` as `#app-canvas`; application
  code should build on that surface rather than replacing the page shell.

## Commands

- `npm run dev` starts Vite on `0.0.0.0:8080`.
- `npm run build` runs TypeScript checking and creates the production build.
- `npm run preview` serves the production build on `0.0.0.0:8080`.

## Conventions

- Keep the baseline lightweight; do not add frameworks unless a future issue
  requires them.
- Keep generated build output and local environment files out of git.
- Avoid product naming beyond the repository name until a product contract or
  issue explicitly defines one.
