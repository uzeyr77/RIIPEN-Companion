import { DiscordBridgeBot } from "../integrations/discord/bot";
import { createGoogleOAuthClient } from "../integrations/google/auth";
import { GoogleCalendarService } from "../integrations/google/calendar";
import { GmailRiipenClient } from "../integrations/google/gmail";
import { env } from "../config/env";
import { logger } from "../observability/logger";
import { parseRiipenEmailToEvent } from "../services/emailToEventParser";
import { messageRepo } from "../storage/repositories/messageRepo";

function extractCompletedMilestoneTitle(email: { subject: string; snippet: string; body: string }): string | undefined {
  const text = `${email.subject}\n${email.snippet}\n${email.body}`;
  const fullMatch = text.match(/completed the milestone\s+(.+?)\s+for the project/i);
  if (fullMatch?.[1]) {
    return fullMatch[1].trim();
  }
  const fallback = text.match(/milestone[:\s]+(.+?)(?:\n|$)/i);
  return fallback?.[1]?.trim();
}

export function startGmailPollWorker(bot: DiscordBridgeBot, intervalMs: number): NodeJS.Timeout {
  const gmail = new GmailRiipenClient();
  const calendarService = new GoogleCalendarService();

  return setInterval(async () => {
    const auth = createGoogleOAuthClient(env.GOOGLE_REFRESH_TOKEN);
    if (!auth) {
      return;
    }

    const lastProcessedAt = messageRepo.getLastGmailProcessedAt();
    if (lastProcessedAt == null) {
      messageRepo.setLastGmailProcessedAt(Date.now());
      return;
    }

    const emails = await gmail.pollRiipenEmails(auth, env.GMAIL_QUERY, 10);
    const sortedEmails = [...emails].sort((a, b) => Number(a.internalDate) - Number(b.internalDate));
    let highestSeenInternalDate = lastProcessedAt;

    for (const email of sortedEmails) {
      const emailInternalDate = Number(email.internalDate);
      if (Number.isFinite(emailInternalDate) && emailInternalDate <= lastProcessedAt) {
        continue;
      }

      const eventId = `gmail-${email.id}`;
      if (messageRepo.isDuplicate(eventId)) {
        continue;
      }

      const event = parseRiipenEmailToEvent(email);
      event.id = eventId;

      if (event.status === "milestone_completed") {
        const title = extractCompletedMilestoneTitle(email);
        if (title) {
          const completed = messageRepo.markMilestonesCompletedByTitle(title);
          logger.info({ eventId: event.id, milestoneTitle: title, completed }, "auto-completed milestone reminders from email");
        }
      }

      if (event.status === "meeting_requested" && event.meetingStartIso && event.meetingEndIso) {
        const availability = await calendarService.isSlotFree(event.meetingStartIso, event.meetingEndIso, env.GOOGLE_REFRESH_TOKEN);
        if (availability.ok) {
          event.calendarConflict = availability.isFree === false;
          event.status = availability.isFree ? "meeting_requested_free" : "meeting_requested_conflict";
        } else {
          logger.warn({ eventId: event.id }, "meeting detected but availability check failed");
        }
      } else if (event.status === "meeting_requested") {
        event.status = "meeting_requested_no_time";
      }

      messageRepo.markProcessed(event.id);
      messageRepo.save(event);

      try {
        await bot.publishRiipenEvent(event, env.DISCORD_ALERTS_CHANNEL_ID);
        if (Number.isFinite(emailInternalDate)) {
          highestSeenInternalDate = Math.max(highestSeenInternalDate, emailInternalDate);
        }
      } catch (error) {
        logger.error({ error, eventId: event.id }, "failed to publish Gmail-derived event");
      }
    }

    if (highestSeenInternalDate > lastProcessedAt) {
      messageRepo.setLastGmailProcessedAt(highestSeenInternalDate);
    }
  }, intervalMs);
}
