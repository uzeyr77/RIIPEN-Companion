import express from "express";
import { env } from "../config/env";
import { normalizeRiipenEvent } from "../domain/events";
import { verifyRiipenSignature } from "../integrations/riipen/signature";
import { messageRepo } from "../storage/repositories/messageRepo";

export const riipenWebhookRouter = express.Router();

riipenWebhookRouter.post("/", (req, res) => {
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

  return res.status(202).json({ ok: true, eventId: event.id });
});
