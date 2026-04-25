import { gmail_v1, google } from "googleapis";
import { env } from "../../config/env";
import { logger } from "../../observability/logger";
import { getGoogleOAuthClient } from "./auth";

export interface GmailRiipenEmail {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  internalDate: string;
}

function decodeBase64Url(content: string): string {
  return Buffer.from(content.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) {
    return "";
  }

  const direct = payload.body?.data;
  if (direct) {
    return decodeBase64Url(direct);
  }

  const parts = payload.parts ?? [];
  for (const part of parts) {
    const candidate = extractBody(part);
    if (candidate.trim()) {
      return candidate;
    }
  }

  return "";
}

export class GmailRiipenClient {
  async pollRiipenEmails(): Promise<GmailRiipenEmail[]> {
    const auth = getGoogleOAuthClient();
    if (!auth) {
      return [];
    }

    const gmail = google.gmail({ version: "v1", auth });
    try {
      const list = await gmail.users.messages.list({
        userId: "me",
        q: env.GMAIL_QUERY,
        maxResults: 10
      });

      const items = list.data.messages ?? [];
      const output: GmailRiipenEmail[] = [];

      for (const item of items) {
        if (!item.id) {
          continue;
        }

        const full = await gmail.users.messages.get({ userId: "me", id: item.id, format: "full" });
        const headers = full.data.payload?.headers ?? [];
        const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "Riipen update";
        const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";

        output.push({
          id: item.id,
          subject,
          from,
          snippet: full.data.snippet ?? "",
          body: extractBody(full.data.payload),
          internalDate: full.data.internalDate ?? Date.now().toString()
        });
      }

      return output;
    } catch (error) {
      logger.error({ error }, "gmail poll failed");
      return [];
    }
  }
}
