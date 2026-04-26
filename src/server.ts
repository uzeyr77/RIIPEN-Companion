import crypto from "node:crypto";
import express from "express";
import { env } from "./config/env";
import { DiscordBridgeBot, ThreadReplyContext } from "./integrations/discord/bot";
import { GoogleCalendarService } from "./integrations/google/calendar";
import { requestContext } from "./middleware/requestContext";
import { logger } from "./observability/logger";
import { riipenWebhookRouter } from "./routes/riipenWebhook";
import { statusRouter } from "./routes/status";
import { messageBridge } from "./services/messageBridge";
import { messageRepo } from "./storage/repositories/messageRepo";
import { startGmailPollWorker } from "./workers/gmailPollWorker";
import { startMilestoneReminderWorker } from "./workers/milestoneReminderWorker";
import { startOutboundWorker } from "./workers/outboundMessageWorker";

const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString("utf8");
    }
  })
);
app.use(requestContext);

app.get("/", (_req, res) => {
  res.type("html").send(`
    <h1>Riipen Companion (Self-Hosted)</h1>
    <p>This deployment is single-user and runs autonomously for the owner of this instance.</p>
    <p>Configure values in your <code>.env</code> file and keep this process running.</p>
    <ul>
      <li><code>DISCORD_ALERTS_CHANNEL_ID</code></li>
      <li><code>GOOGLE_REFRESH_TOKEN</code></li>
      <li><code>GMAIL_QUERY</code></li>
    </ul>
    <p>Health: <a href="/health">/health</a></p>
    <p>Status: <a href="/status">/status</a></p>
  `);
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/webhooks/riipen", riipenWebhookRouter);
app.use("/status", statusRouter);

const bot = new DiscordBridgeBot();
const calendarService = new GoogleCalendarService();

void bot.start(async (message, context: ThreadReplyContext) => {
  const text = message.content.trim();

  if (text.startsWith("!complete-milestone ")) {
    const eventId = text.replace("!complete-milestone ", "").trim();
    if (!eventId) {
      await message.reply("Usage: !complete-milestone <Event ID>");
      return;
    }
    messageRepo.markMilestoneCompleted(eventId);
    await message.reply(`Milestone ${eventId} marked complete. Reminders will stop.`);
    return;
  }

  if (text.startsWith("!create-meeting ")) {
    const payload = text.replace("!create-meeting ", "").trim();
    const parts = payload.split("|").map((p) => p.trim());

    if (parts.length < 3) {
      await message.reply("Usage: !create-meeting startIso|durationMinutes|title");
      return;
    }

    const [startIso, durationMinutesRaw, title] = parts;
    const minutes = Number(durationMinutesRaw);

    if (Number.isNaN(minutes) || minutes <= 0) {
      await message.reply("durationMinutes must be a positive number.");
      return;
    }

    const startDate = new Date(startIso);
    if (Number.isNaN(startDate.valueOf())) {
      await message.reply("startIso must be a valid ISO datetime, e.g. 2026-05-01T14:00:00-04:00");
      return;
    }

    if (!env.GOOGLE_REFRESH_TOKEN) {
      await message.reply("GOOGLE_REFRESH_TOKEN is missing in environment settings.");
      return;
    }

    const endDate = new Date(startDate.getTime() + minutes * 60 * 1000);
    const availability = await calendarService.isSlotFree(startDate.toISOString(), endDate.toISOString(), env.GOOGLE_REFRESH_TOKEN);

    if (!availability.ok) {
      await message.reply(`Could not check calendar availability: ${availability.error}`);
      return;
    }

    if (!availability.isFree) {
      await message.reply("That time is already busy in your calendar. No meeting was booked.");
      return;
    }

    const result = await calendarService.createEvent(
      {
        title,
        description: `Created from Discord channel ${message.channelId}`,
        startIso: startDate.toISOString(),
        endIso: endDate.toISOString()
      },
      env.GOOGLE_REFRESH_TOKEN
    );

    if (!result.ok) {
      await message.reply(`Calendar creation failed: ${result.error}`);
      return;
    }

    await message.reply(`Calendar event created: ${result.htmlLink ?? "(no link returned)"}`);
    return;
  }

  if (!context.conversationId) {
    await message.reply("Command not recognized. Use `!create-meeting ...` or `!complete-milestone <Event ID>`.");
    return;
  }

  messageBridge.enqueue({
    id: crypto.randomUUID(),
    conversationId: context.conversationId,
    sourceDiscordMessageId: message.id,
    body: message.content
  });

  await message.reply("Queued for Riipen delivery.");
});

startOutboundWorker();
startGmailPollWorker(bot, env.GMAIL_POLL_INTERVAL_MS);
startMilestoneReminderWorker(bot, env.MILESTONE_REMINDER_CHECK_MS, env.MILESTONE_REMINDER_INTERVAL_MS);

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, mode: "self-hosted-single-user" }, "riipen companion server started");
});

export { app };
