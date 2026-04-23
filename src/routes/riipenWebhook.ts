import express from "express";
import { env } from "../config/env";
import { normalizeRiipenEvent } from "../domain/events";
import { DiscordBridgeBot } from "../integrations/discord/bot";
import { verifyRiipenSignature } from "../integrations/riipen/signature";
import { logger } from "../observability/logger";
import { messageRepo } from "../storage/repositories/messageRepo";

const bot = new DiscordBridgeBot();

export const riipenWebhookRouter = express.Router();

riipenWebhookRouter.post("/", async (req, res) => {
  const rawBody = (req as any).rawBody as string | undefined;
  const bodyString = rawBody ?? JSON.stringify(req.body ?? {});

  const signature = req.header("X-Riipen-Signature");
  const isValid = verifyRiipenSignature(bodyString, signature, env.RIIPEN_WEBHOOK_SECRET);

  if (!isValid) {
    return res.status(401).json({ error: "invalid signature" });
  }

  const event = normalizeRiipenEvent(req.body);

  if (messageRepo.isDuplicate(event.id)) {
    return res.status(200).json({ ok: true, duplicate: true });
  }

  messageRepo.markProcessed(event.id);
  messageRepo.save(event);

  try {
    await bot.publishRiipenEvent(event);
  } catch (error) {
    logger.error({ error, eventId: event.id }, "failed to publish event to discord");
  }

  return res.status(202).json({ ok: true, eventId: event.id });
});
