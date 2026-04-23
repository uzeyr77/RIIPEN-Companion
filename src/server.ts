import crypto from "node:crypto";
import express from "express";
import { env } from "./config/env";
import { DiscordBridgeBot } from "./integrations/discord/bot";
import { requestContext } from "./middleware/requestContext";
import { logger } from "./observability/logger";
import { riipenWebhookRouter } from "./routes/riipenWebhook";
import { statusRouter } from "./routes/status";
import { messageBridge } from "./services/messageBridge";
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
void bot.start(async (message, conversationId) => {
  messageBridge.enqueue({
    id: crypto.randomUUID(),
    conversationId,
    sourceDiscordMessageId: message.id,
    body: message.content
  });

  await message.react("??");
});

startOutboundWorker();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "riipen companion server started");
});

export { app };
