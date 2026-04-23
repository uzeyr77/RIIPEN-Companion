# Riipen Setup Guide

## 1) Create API keys
1. Sign in at `app.riipen.com`.
2. Open **Settings** for your company or portal.
3. Go to **Advanced -> Keys**.
4. Create a key pair and copy the secret key (`sk_...`).
5. Put the secret in `.env` as `RIIPEN_SECRET_KEY`.

## 2) Configure webhook endpoint
1. Deploy this app to a public HTTPS URL.
2. Add webhook URL: `https://<your-host>/webhooks/riipen`.
3. Generate/store a webhook secret and set `RIIPEN_WEBHOOK_SECRET`.
4. Enable events needed for messaging, project updates, and application status.

## 3) Security requirements
- Keep `sk_` keys server-side only.
- Never commit secrets.
- Verify `X-Riipen-Signature` for every incoming webhook.
- Rotate keys if exposed.

## 4) Local run
1. Copy `.env.example` to `.env`.
2. Set Riipen and Discord values.
3. Run:
   - `npm install`
   - `npm run dev`

## 5) Validation checklist
- `GET /health` returns `{ ok: true }`.
- Webhook with valid signature is accepted.
- Webhook with invalid signature returns `401`.
- Riipen events show up in configured Discord channel thread.
