# alex-0d18-test-8

`alex-0d18-test-8` is a Vite + TypeScript browser tank game that runs in a
full-window canvas. It includes a title screen, pause and result scenes, three
starter levels, player movement and firing, enemy waves, destructible terrain,
power-ups, sound effects, high score storage, and smoke-test coverage.

## Controls

- `Enter` or `Space`: start from the title screen; return to title from result
  screens.
- Arrow keys or `W` `A` `S` `D`: move the player tank.
- `Space`: fire while playing.
- `P`: pause or resume.
- `M`: toggle mute. The mute preference persists in `localStorage`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite development server on `0.0.0.0:8080`:

```bash
npm run dev
```

Open `http://localhost:8080` in a browser.

## Production Build

Create the static production build:

```bash
npm run build
```

The build output is written to `dist/`. A clean build contains `index.html` and
hashed assets under `dist/assets/`.

## Serve The Build

Use Vite's preview server:

```bash
npm run preview
```

Or serve `dist/` with any static file server, for example:

```bash
npx serve dist
```

```bash
python3 -m http.server 8080 --directory dist
```

## Validation

```bash
npm test
npm run lint
npm run test:e2e
```

`npm run test:e2e` builds the app, serves the production bundle, and runs the
Playwright smoke test against Chromium.
