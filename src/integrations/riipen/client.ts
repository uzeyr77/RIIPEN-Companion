import { env } from "../../config/env";

export interface RiipenOutboundMessage {
  conversationId: string;
  body: string;
}

export class RiipenClient {
  async sendMessage(message: RiipenOutboundMessage): Promise<{ ok: boolean; error?: string }> {
    if (!env.RIIPEN_SECRET_KEY || env.RIIPEN_SECRET_KEY.startsWith("sk_your")) {
      return { ok: false, error: "Missing RIIPEN_SECRET_KEY" };
    }

    const response = await fetch(`${env.RIIPEN_API_BASE_URL}/conversations/${message.conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RIIPEN_SECRET_KEY}`
      },
      body: JSON.stringify({ body: message.body })
    });

    if (!response.ok) {
      return { ok: false, error: `Riipen API error ${response.status}` };
    }

    return { ok: true };
  }
}
