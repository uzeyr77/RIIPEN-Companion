# Railway Deployment Guide

Deploy this app as an always-on Railway service so users do not run it from a local terminal.

## 1) Create service
- In Railway, create a new project from this GitHub repo.
- Railway will detect `railway.json` and use `npm start`.

## 2) Add environment variables
Set these in Railway Variables:

- `NODE_ENV=production`
- `PORT=3000` (Railway may inject this automatically)
- `SQLITE_PATH=/data/riipen-companion.sqlite`
- `DISCORD_BOT_TOKEN`
- `DISCORD_ALERTS_CHANNEL_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID=primary`
- `GMAIL_QUERY=from:riipen newer_than:7d`
- `GMAIL_POLL_INTERVAL_MS=60000`
- `MILESTONE_REMINDER_INTERVAL_MS=21600000`
- `MILESTONE_REMINDER_CHECK_MS=300000`

## 3) Persistence note
This app currently uses SQLite.

For reliable restart behavior, ensure the database file path points to persistent storage. If your Railway plan/runtime does not provide persistent disk, migrate to Postgres for production durability.

## 4) Health check
- Railway uses `/health` to determine service readiness.

## 5) Verify after deploy
1. Open service logs and confirm startup message.
2. Open `/health` and check `{ "ok": true }`.
3. Send a test Gmail message matching `GMAIL_QUERY`.
4. Confirm Discord notification appears in your alerts channel.
