import { google } from "googleapis";
import { env } from "../../config/env";
import { logger } from "../../observability/logger";
import { getGoogleOAuthClient } from "./auth";

export interface CalendarCreateInput {
  title: string;
  description?: string;
  startIso: string;
  endIso: string;
}

export interface SlotCheckResult {
  ok: boolean;
  isFree?: boolean;
  error?: string;
}

export class GoogleCalendarService {
  async isSlotFree(startIso: string, endIso: string): Promise<SlotCheckResult> {
    const auth = getGoogleOAuthClient();
    if (!auth) {
      return { ok: false, error: "Missing Google OAuth credentials" };
    }

    try {
      const calendar = google.calendar({ version: "v3", auth });
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startIso,
          timeMax: endIso,
          items: [{ id: env.GOOGLE_CALENDAR_ID }]
        }
      });

      const busy = response.data.calendars?.[env.GOOGLE_CALENDAR_ID]?.busy ?? [];
      return { ok: true, isFree: busy.length === 0 };
    } catch (error) {
      logger.error({ error }, "failed to check calendar availability");
      return { ok: false, error: "Google Calendar availability check failed" };
    }
  }

  async createEvent(input: CalendarCreateInput): Promise<{ ok: boolean; htmlLink?: string; error?: string }> {
    const auth = getGoogleOAuthClient();
    if (!auth) {
      return { ok: false, error: "Missing Google OAuth credentials" };
    }

    try {
      const calendar = google.calendar({ version: "v3", auth });
      const response = await calendar.events.insert({
        calendarId: env.GOOGLE_CALENDAR_ID,
        requestBody: {
          summary: input.title,
          description: input.description,
          start: { dateTime: input.startIso },
          end: { dateTime: input.endIso }
        }
      });

      return { ok: true, htmlLink: response.data.htmlLink ?? undefined };
    } catch (error) {
      logger.error({ error }, "failed to create google calendar event");
      return { ok: false, error: "Google Calendar API request failed" };
    }
  }
}
