# Riipen Companion

Self-hosted automation assistant for Riipen email updates.

It watches Gmail for Riipen notifications, posts readable updates to Discord, checks Google Calendar conflicts for meeting requests, and reminds you about milestones until completed.

## Overview

- Gmail -> parsed events -> Discord notifications
- Meeting requests are detected and conflict-checked
- No inbound message ever auto-books calendar events
- Milestone reminders continue until completion is detected or confirmed
- SQLite persistence prevents duplicate/replayed notifications

## Tech Stack

- Node.js + TypeScript
- Express
- Discord (`discord.js`)
- Google APIs (`gmail`, `calendar`)
- SQLite (`better-sqlite3`)
- Logging: `pino`
- Testing: `vitest`, `supertest`

## Quick Start

### 1) Prerequisites

- Node.js 20+
- Discord bot token + target channel ID
- Google OAuth credentials + refresh token with scopes:
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/calendar.events`

### 2) Configure environment

Copy `.env.example` to `.env`, then set:

```env
PORT=3000
NODE_ENV=development

DISCORD_BOT_TOKEN=...
DISCORD_ALERTS_CHANNEL_ID=...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost
GOOGLE_REFRESH_TOKEN=...
GOOGLE_CALENDAR_ID=primary

GMAIL_QUERY=from:riipen newer_than:7d
GMAIL_POLL_INTERVAL_MS=60000

MILESTONE_REMINDER_INTERVAL_MS=21600000
MILESTONE_REMINDER_CHECK_MS=300000

SQLITE_PATH=./data/riipen-companion.sqlite
```

### 3) Run

```bash
npm install
npm run build
npm run dev
```

Health endpoint:
- `http://localhost:3000/health`

### 4) Discord commands

- `!create-meeting startIso|durationMinutes|title`
- `!complete-milestone <Event ID>`

## Deploy (Always-On)

- Railway: `docs/RAILWAY_DEPLOY.md`
- PM2 local background: `docs/AUTOMATION.md`

## Additional Docs

- Setup details: `docs/RIIPEN_SETUP.md`
- Gmail/Calendar setup: `docs/GMAIL_CALENDAR_SETUP.md`
- Operations: `docs/AUTOMATION.md`
- Deeper architecture/design reference: `docs/ARCHITECTURE_INTERNAL.md`
