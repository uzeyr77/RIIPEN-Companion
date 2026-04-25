import { DiscordBridgeBot } from "../integrations/discord/bot";
import { logger } from "../observability/logger";
import { messageRepo } from "../storage/repositories/messageRepo";

export function startMilestoneReminderWorker(
  bot: DiscordBridgeBot,
  checkIntervalMs: number,
  remindEveryMs: number
): NodeJS.Timeout {
  return setInterval(async () => {
    const pending = messageRepo.getPendingMilestones(remindEveryMs);
    for (const event of pending) {
      const reminderEvent = {
        ...event,
        id: `${event.id}-reminder-${Date.now()}`,
        message: `Reminder: ${event.message ?? "Milestone is still pending."}`
      };

      try {
        await bot.publishRiipenEvent(reminderEvent);
        messageRepo.markMilestoneReminded(event.id);
      } catch (error) {
        logger.error({ error, eventId: event.id }, "failed to publish milestone reminder");
      }
    }
  }, checkIntervalMs);
}
