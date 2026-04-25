import { DiscordBridgeBot } from "../integrations/discord/bot";
import { GoogleCalendarService } from "../integrations/google/calendar";
import { GmailRiipenClient } from "../integrations/google/gmail";
import { logger } from "../observability/logger";
import { parseRiipenEmailToEvent } from "../services/emailToEventParser";
import { messageRepo } from "../storage/repositories/messageRepo";

export function startGmailPollWorker(bot: DiscordBridgeBot, intervalMs: number): NodeJS.Timeout {
  const gmail = new GmailRiipenClient();
  const calendarService = new GoogleCalendarService();

  return setInterval(async () => {
    const emails = await gmail.pollRiipenEmails();

    for (const email of emails) {
      const eventId = `gmail-${email.id}`;
      if (messageRepo.isDuplicate(eventId)) {
        continue;
      }

      const event = parseRiipenEmailToEvent(email);
      if (event.status === "meeting_requested" && event.meetingStartIso && event.meetingEndIso) {
        const availability = await calendarService.isSlotFree(event.meetingStartIso, event.meetingEndIso);
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
        await bot.publishRiipenEvent(event);
      } catch (error) {
        logger.error({ error, eventId: event.id }, "failed to publish Gmail-derived event");
      }
    }
  }, intervalMs);
}
