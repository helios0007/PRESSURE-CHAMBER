# Pressure Chamber — React frontend

This is the React (Vite) port of the original vanilla-JS frontend in
`../frontend`. It renders the **exact same DOM structure, class names, CSS and
animations** — `src/style.css` is the original stylesheet copied verbatim, and
the Three.js particle globe / cinematic transitions are ported line-for-line
into `src/lib/globeBackground.js`.

## How it maps to the old code

| Original (`../frontend`)        | React port                                         |
| ------------------------------- | -------------------------------------------------- |
| `index.html` (11 `.screen`s)    | `src/components/screens/*` + `src/App.jsx`         |
| `app.js` global state + nav     | `src/state/AppContext.jsx`                         |
| `app.js` `showScreen` cinematic | `showScreen()` in `AppContext` (same body classes + `cinematic-screen-change` event) |
| `app.js` bias landscape         | `src/lib/biasGames.js` + `BiasGamesScreen.jsx`     |
| `app.js` `initBackgroundBlobs`  | `src/components/Background.jsx`                     |
| `globe-background.js`           | `src/lib/globeBackground.js` (THREE via npm)       |
| `style.css`, `noise.png`        | `src/style.css`, `src/noise.png` (copied verbatim) |
| screensaver / parallax          | `AppContext` + `BiasGamesScreen`                   |

`data/`, `images/`, `media/` and the `/start` `/generate` `/leaderboard` API are
still served by the Flask backend (`../backend/app.py`) — unchanged.

> Note: the original `init3DScene()` in `app.js` was dead code (its
> `DOMContentLoaded` hook was commented out) and is intentionally not ported.

## Develop

```bash
# Terminal 1 — backend (serves data/images/media + API on :5000)
cd ../backend && python app.py

# Terminal 2 — Vite dev server on :5173 (proxies /data /images /media /api to :5000)
npm install
npm run dev
```

Open http://localhost:5173.

## Production build

```bash
npm run build      # outputs to react-app/dist
cd ../backend && python app.py
```

`backend/app.py` automatically serves `react-app/dist` when it exists (falling
back to the legacy `../frontend` otherwise), so the app runs at
http://localhost:5000 with no extra wiring.
