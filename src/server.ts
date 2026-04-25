import crypto from "node:crypto";
import express from "express";
import { env } from "./config/env";
import { DiscordBridgeBot } from "./integrations/discord/bot";
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

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/webhooks/riipen", riipenWebhookRouter);
app.use("/status", statusRouter);

const bot = new DiscordBridgeBot();
const calendarService = new GoogleCalendarService();

void bot.start(async (message, conversationId) => {
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

    const endDate = new Date(startDate.getTime() + minutes * 60 * 1000);
    const availability = await calendarService.isSlotFree(startDate.toISOString(), endDate.toISOString());

    if (!availability.ok) {
      await message.reply(`Could not check calendar availability: ${availability.error}`);
      return;
    }

    if (!availability.isFree) {
      await message.reply("That time is already busy in your calendar. No meeting was booked.");
      return;
    }

    const result = await calendarService.createEvent({
      title,
      description: `Created from Discord thread ${message.channelId}`,
      startIso: startDate.toISOString(),
      endIso: endDate.toISOString()
    });

    if (!result.ok) {
      await message.reply(`Calendar creation failed: ${result.error}`);
      return;
    }

    await message.reply(`Calendar event created: ${result.htmlLink ?? "(no link returned)"}`);
    return;
  }

  messageBridge.enqueue({
    id: crypto.randomUUID(),
    conversationId,
    sourceDiscordMessageId: message.id,
    body: message.content
  });

  await message.reply("Queued for Riipen delivery.");
});

startOutboundWorker();
startGmailPollWorker(bot, env.GMAIL_POLL_INTERVAL_MS);
startMilestoneReminderWorker(bot, env.MILESTONE_REMINDER_CHECK_MS, env.MILESTONE_REMINDER_INTERVAL_MS);

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "riipen companion server started");
});

export { app };

