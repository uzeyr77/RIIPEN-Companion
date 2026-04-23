import crypto from "node:crypto";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { computeSignature } from "../src/integrations/riipen/signature";
import { riipenWebhookRouter } from "../src/routes/riipenWebhook";

describe("bridge webhook integration", () => {
  it("accepts valid webhook and rejects invalid webhook", async () => {
    process.env.RIIPEN_WEBHOOK_SECRET = "replace_me";

    const app = express();
    app.use(
      express.json({
        verify: (req, _res, buf) => {
          (req as any).rawBody = buf.toString("utf8");
        }
      })
    );
    app.use("/webhooks/riipen", riipenWebhookRouter);

    const body = {
      id: crypto.randomUUID(),
      type: "message.created",
      conversation_id: "conv-1",
      message: "Hello from Riipen"
    };

    const raw = JSON.stringify(body);
    const signature = computeSignature(raw, "replace_me");

    const accepted = await request(app).post("/webhooks/riipen").set("X-Riipen-Signature", signature).send(body);
    expect(accepted.status).toBe(202);

    const rejected = await request(app)
      .post("/webhooks/riipen")
      .set("X-Riipen-Signature", "bad-signature")
      .send({ ...body, id: crypto.randomUUID() });
    expect(rejected.status).toBe(401);
  });
});
