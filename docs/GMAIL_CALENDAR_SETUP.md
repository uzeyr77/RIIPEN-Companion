# Gmail + Google Calendar Setup (Learner Mode)

This path lets learners run the companion without Riipen API keys by using Riipen notification emails from Gmail.

## 1) Google Cloud configuration
1. Open Google Cloud Console and create/select a project.
2. Enable APIs:
   - Gmail API
   - Google Calendar API
3. Configure OAuth consent screen.
4. Create OAuth Client ID credentials.
5. Capture these values:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

## 2) Get a refresh token
Use OAuth flow once (Google OAuth Playground or local script) with scopes:
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.events`

Set `GOOGLE_REFRESH_TOKEN` in `.env`.

## 3) Gmail filter
Create a Gmail filter for Riipen emails and keep query narrow with `GMAIL_QUERY`.
Example:
- `from:(riipen)`
- `from:(no-reply@riipen.com OR notifications@riipen.com) newer_than:7d`

## 4) Discord calendar command
In your configured alerts channel, run:
`!create-meeting startIso|durationMinutes|title`

Example:
`!create-meeting 2026-05-01T14:00:00-04:00|30|Riipen Interview Prep`

The bot checks your Google Calendar availability first:
- If free: it creates the event and returns the link.
- If busy: it does not book and warns you about conflict.

The bot never auto-books meetings from incoming employer/co-worker messages.

## 5) Milestone reminders with guardrails
- Milestone/deadline emails are posted as `milestone.reminder`.
- If you do not confirm completion, reminders continue on an interval.
- Mark done in the alerts channel:
  - `!complete-milestone <Event ID>`
  - Event ID is included in each Discord notification.

## 6) Run
1. `npm install`
2. `npm run dev`
3. Confirm logs show server start and Discord readiness.
4. Send a test Riipen-like email and check Discord thread output.

## 7) Replay behavior
- On first startup, the app sets a Gmail checkpoint to "now".
- It will not replay historical inbox messages by default.
- After that, only newly received emails are processed.

