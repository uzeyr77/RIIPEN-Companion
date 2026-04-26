# Autonomous Runtime

To keep the companion running continuously, run it under a process manager.

## Option A: PM2 (Windows/Linux/macOS)

1. Build:
   - `npm run build`
2. Start in background:
   - `pm2 start npm --name riipen-companion -- start`
3. Save process list:
   - `pm2 save`
4. Enable startup script:
   - `pm2 startup`

## Option B: Cloud deployment (recommended)

Deploy to Render/Railway/Fly and keep one always-on instance.

Required:
- persistent disk for SQLite (`SQLITE_PATH`)
- env vars configured in platform settings
- restart policy enabled

For Railway, this repo includes `railway.json`.
Use `docs/RAILWAY_DEPLOY.md` for the exact setup.

For Render, this repo includes `render.yaml`.

## Self-hosted usage model

- This repository is intended as one deployment per individual/team.
- Each deployment owner configures their own `.env` with Gmail/Calendar/Discord credentials.
- Data remains in that deployment's local SQLite file.

## Notes
- If the process is down, Gmail polling and Discord delivery stop.
- SQLite preserves dedupe/checkpoint state across restarts.
