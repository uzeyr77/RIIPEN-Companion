# Deployment Guide

## Platform options
- Render
- Railway
- Fly.io
- Azure App Service

## Required environment variables
- `PORT`
- `RIIPEN_API_BASE_URL`
- `RIIPEN_SECRET_KEY`
- `RIIPEN_WEBHOOK_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_APPLICATION_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_ALERTS_CHANNEL_ID`

## Deployment requirements
- Use HTTPS (mandatory for webhook delivery).
- Keep at least one instance always running for Discord gateway + worker.
- Configure health checks on `/health`.

## Reliability notes
- Webhook retries are expected; idempotency is handled by event ID.
- Outbound send retries are handled by worker (up to 3 attempts).
- Log aggregation should index `eventId`, `conversationId`, and outbound message status.

## Recommended production hardening
- Add persistent database (Postgres).
- Add Redis queue for high throughput.
- Add dead-letter queue and alerting for repeated failures.
- Add per-tenant auth and role checks for command execution.
