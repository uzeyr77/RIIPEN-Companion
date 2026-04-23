import { RiipenClient } from "../integrations/riipen/client";

interface OutboundItem {
  id: string;
  conversationId: string;
  sourceDiscordMessageId: string;
  body: string;
  status: "queued" | "sent" | "failed";
  retryCount: number;
  lastError?: string;
}

const queue: OutboundItem[] = [];

export const messageBridge = {
  enqueue(item: Omit<OutboundItem, "status" | "retryCount">): void {
    queue.push({ ...item, status: "queued", retryCount: 0 });
  },

  list(): OutboundItem[] {
    return [...queue];
  },

  async processOne(client: RiipenClient): Promise<OutboundItem | undefined> {
    const next = queue.find((q) => q.status === "queued" || (q.status === "failed" && q.retryCount < 3));
    if (!next) {
      return undefined;
    }

    const result = await client.sendMessage({
      conversationId: next.conversationId,
      body: next.body
    });

    if (result.ok) {
      next.status = "sent";
      next.lastError = undefined;
    } else {
      next.status = "failed";
      next.retryCount += 1;
      next.lastError = result.error;
    }

    return next;
  }
};
