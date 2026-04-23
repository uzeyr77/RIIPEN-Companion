import { RiipenClient } from "../integrations/riipen/client";
import { logger } from "../observability/logger";
import { messageBridge } from "../services/messageBridge";

export function startOutboundWorker(intervalMs = 5000): NodeJS.Timeout {
  const client = new RiipenClient();

  return setInterval(async () => {
    try {
      const processed = await messageBridge.processOne(client);
      if (processed) {
        logger.info(
          {
            outboundMessageId: processed.id,
            status: processed.status,
            retryCount: processed.retryCount,
            lastError: processed.lastError
          },
          "processed outbound queue item"
        );
      }
    } catch (error) {
      logger.error({ error }, "outbound worker failed");
    }
  }, intervalMs);
}
