# Riipen Setup Guide

## 1) Self-hosted model (default)
- This deployment is designed for one owner per instance.
- Each user runs their own copy and stores credentials in their own `.env`.
- No centralized account system is required.

## 2) Learner mode (Gmail-first)
If you do not have access to Riipen API keys, use Gmail as your event source.
Follow `docs/GMAIL_CALENDAR_SETUP.md` and configure:
- Gmail polling (`GMAIL_QUERY`)
- Google OAuth credentials + refresh token
- Discord target channel
- Google Calendar event creation via `!create-meeting`

## 3) Optional API mode (company/portal admins)
1. Sign in at `app.riipen.com`.
2. Open **Settings** for your company or portal.
3. Go to **Advanced -> Keys**.
4. Create a key pair and copy the secret key (`sk_...`).
5. Put the secret in `.env` as `RIIPEN_SECRET_KEY`.

If you also want webhook ingestion:
1. Deploy this app to a public HTTPS URL.
2. Add webhook URL: `https://<your-host>/webhooks/riipen`.
3. Generate/store a webhook secret and set `RIIPEN_WEBHOOK_SECRET`.
4. Enable events needed for messaging, project updates, and application status.

## 4) Security requirements
- Keep `sk_` keys server-side only.
- Never commit secrets.
- Verify `X-Riipen-Signature` for every incoming webhook.
- Rotate keys if exposed.

## 5) Local run
1. Copy `.env.example` to `.env`.
2. Set Riipen or Gmail/Google values.
3. Run:
   - `npm install`
   - `npm run dev`

## 6) Validation checklist
- `GET /health` returns `{ ok: true }`.
- API mode: webhook with valid signature is accepted.
- Learner mode: Riipen email appears in Discord as an update.
- `!create-meeting` creates an event link in Discord reply.
