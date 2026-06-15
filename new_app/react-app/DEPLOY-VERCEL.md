# Deploying to Vercel

This app deploys as **static frontend (Vercel CDN) + Python serverless functions**:

- **Frontend** — Vite builds `react-app` to `dist`. The `build` script first runs
  `scripts/copy-static-assets.mjs`, which copies the sibling `data/`, `images/`,
  `frontend/media/` and `backend/captions.md` into `public/` so they ship in
  `dist` and are served at `/data`, `/images`, `/media`, `/backend/captions.md`.
- **Backend** — `api/start.py`, `api/generate.py`, `api/leaderboard.py` are
  stdlib-only Python serverless functions. `vercel.json` rewrites `/start`,
  `/generate`, `/leaderboard` onto them and bundles `api/_data/*.json`.

## 1. Import the repo into Vercel

1. Go to https://vercel.com/new and import **helios0007/PRESSURE-CHAMBER**.
2. **Root Directory** → set to `new_app/react-app`. ⚠️ This is required — that's
   where `vercel.json`, `package.json` and `api/` live.
3. Framework Preset: **Vite** (auto-detected). Build command `npm run build` and
   output `dist` are correct as-is.
4. Click **Deploy**. The first deploy works immediately; the leaderboard runs in
   ephemeral mode until you add KV (step 2).

## 2. Add Vercel KV for a persistent leaderboard

1. In the project → **Storage** tab → **Create Database** → **KV** (Upstash Redis).
2. **Connect** it to this project. Vercel injects `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` env vars automatically (the functions also accept
   `UPSTASH_REDIS_REST_*` names).
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the functions pick up the env vars.

The leaderboard functions detect those vars and switch from ephemeral `/tmp` to
KV — scores then persist across cold starts. No code change needed.

## Notes

- `/generate` returns the same JSON shape as the Flask backend but does **not**
  recompute image similarity (score is a fixed fallback). The bias-playground UI
  hides the score, so the deployed experience is identical. The heavy PIL/numpy
  scoring stays out of the serverless bundle.
- The original Flask backend (`../backend/app.py`) is untouched and still runs
  locally / on a traditional server.

## Local production preview

```bash
npm run build      # copies assets + builds dist
npx vercel dev     # optional: emulate the Vercel routing + functions locally
```
