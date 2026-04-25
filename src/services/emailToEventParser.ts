import crypto from "node:crypto";
import { NormalizedEvent } from "../domain/events";
import { GmailRiipenEmail } from "../integrations/google/gmail";

function detectType(subject: string, body: string): NormalizedEvent["type"] {
  const text = `${subject} ${body}`.toLowerCase();
  if (text.includes("announcement from") || text.includes("posted a new announcement")) {
    return "project.updated";
  }

  if (text.includes("milestone") || text.includes("deadline") || text.includes("action required")) {
    return "milestone.reminder";
  }

  if (text.includes("new message from") || text.includes("unread message in the conversation") || text.includes("message")) {
    return "message.created";
  }

  if (text.includes("accepted") || text.includes("declined") || text.includes("application")) {
    return "application.status_changed";
  }

  return "project.updated";
}

function extractStatus(subject: string, body: string): string | undefined {
  const text = `${subject} ${body}`.toLowerCase();
  if (text.includes("accepted")) {
    return "accepted";
  }
  if (text.includes("declined")) {
    return "declined";
  }
  if (text.includes("announcement from") || text.includes("posted a new announcement")) {
    return "announcement";
  }
  if (text.includes("milestone") || text.includes("deadline") || text.includes("action required")) {
    return "milestone_due";
  }
  if (text.includes("calendly") || text.includes("book a time slot")) {
    return "meeting_requested";
  }
  if (text.includes("pending")) {
    return "pending";
  }
  return undefined;
}

function normalizeConversationName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function extractConversationId(text: string): string | undefined {
  const idLike = text.match(/conversation[\s#:-]*([a-z0-9_-]{6,})/i);
  if (idLike?.[1]) {
    return idLike[1];
  }

  const nameLike = text.match(/conversation\s+(.+?)(?:\.|\n|please note|sent on|reply)/i);
  if (!nameLike?.[1]) {
    return undefined;
  }

  const normalized = normalizeConversationName(nameLike[1]);
  return normalized ? `conv-${normalized}` : undefined;
}

function detectActorRole(subject: string, body: string): NormalizedEvent["actorRole"] {
  const text = `${subject} ${body}`.toLowerCase();
  if (text.includes("learner")) {
    return "student";
  }
  if (text.includes("cto") || text.includes("employer") || text.includes("kind regards")) {
    return "employer";
  }
  return "system";
}

function extractMeetingWindow(text: string): { meetingStartIso?: string; meetingEndIso?: string } {
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2}t\d{2}:\d{2}(?::\d{2})?(?:z|[+-]\d{2}:\d{2})?)/i);
  if (isoMatch?.[1]) {
    const startDate = new Date(isoMatch[1]);
    if (!Number.isNaN(startDate.valueOf())) {
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
      return { meetingStartIso: startDate.toISOString(), meetingEndIso: endDate.toISOString() };
    }
  }

  const monthDayTimeMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,\s*(\d{4}))?.{0,20}?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
  );
  if (!monthDayTimeMatch) {
    return {};
  }

  const [, monthNameRaw, dayRaw, yearRaw, hourRaw, minuteRaw, amPmRaw] = monthDayTimeMatch;
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ];
  const month = monthNames.indexOf(monthNameRaw.toLowerCase());
  if (month < 0) {
    return {};
  }

  const now = new Date();
  const year = yearRaw ? Number(yearRaw) : now.getFullYear();
  let hour = Number(hourRaw);
  const minute = minuteRaw ? Number(minuteRaw) : 0;
  const amPm = amPmRaw.toLowerCase();
  if (amPm === "pm" && hour < 12) {
    hour += 12;
  }
  if (amPm === "am" && hour === 12) {
    hour = 0;
  }

  const startDate = new Date(Date.UTC(year, month, Number(dayRaw), hour, minute));
  if (Number.isNaN(startDate.valueOf())) {
    return {};
  }

  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  return { meetingStartIso: startDate.toISOString(), meetingEndIso: endDate.toISOString() };
}

export function parseRiipenEmailToEvent(email: GmailRiipenEmail): NormalizedEvent {
  const mergedText = `${email.subject}\n${email.snippet}\n${email.body}`;
  const meetingWindow = extractMeetingWindow(mergedText);
  return {
    id: `gmail-${email.id}`,
    type: detectType(email.subject, mergedText),
    timestamp: new Date(Number(email.internalDate)).toISOString(),
    actorRole: detectActorRole(email.subject, mergedText),
    projectId: undefined,
    conversationId: extractConversationId(mergedText) ?? `email-${crypto.randomUUID().slice(0, 8)}`,
    status: extractStatus(email.subject, mergedText),
    message: (email.snippet || email.subject).trim(),
    meetingStartIso: meetingWindow.meetingStartIso,
    meetingEndIso: meetingWindow.meetingEndIso,
    raw: email
  };
}
