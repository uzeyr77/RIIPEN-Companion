import { describe, expect, it } from "vitest";
import { parseRiipenEmailToEvent } from "../src/services/emailToEventParser";

describe("emailToEventParser", () => {
  it("maps accepted emails to application status events", () => {
    const event = parseRiipenEmailToEvent({
      id: "abc123",
      subject: "Your application was accepted",
      from: "notifications@riipen.com",
      snippet: "Good news, accepted",
      body: "application accepted",
      internalDate: String(Date.now())
    });

    expect(event.type).toBe("application.status_changed");
    expect(event.status).toBe("accepted");
  });

  it("maps message emails to message.created", () => {
    const event = parseRiipenEmailToEvent({
      id: "abc124",
      subject: "You have a new message",
      from: "notifications@riipen.com",
      snippet: "new message from employer",
      body: "conversation 123456 updated",
      internalDate: String(Date.now())
    });

    expect(event.type).toBe("message.created");
    expect(event.conversationId).toBe("123456");
  });

  it("maps learner conversation messages from screenshot pattern", () => {
    const event = parseRiipenEmailToEvent({
      id: "abc125",
      subject: "New message from Alexa Lupo",
      from: "team@riipen.com",
      snippet: "You have 1 unread message in the conversation All learners.",
      body: "Alexa Lupo Learner Everything looks good to me. Sent on April 3, 2026 17:21",
      internalDate: String(Date.now())
    });

    expect(event.type).toBe("message.created");
    expect(event.actorRole).toBe("student");
    expect(event.conversationId).toBe("conv-all-learners");
  });

  it("maps announcement emails to project.updated with announcement status", () => {
    const event = parseRiipenEmailToEvent({
      id: "abc126",
      subject: "Announcement from Advance Ontario: April 2026 Cohort: action required today",
      from: "team@riipen.com",
      snippet: "Advance Ontario has posted a new announcement",
      body: "Published at April 24, 2026 09:00",
      internalDate: String(Date.now())
    });

    expect(event.type).toBe("project.updated");
    expect(event.status).toBe("announcement");
  });

  it("detects meeting requested context from employer message", () => {
    const event = parseRiipenEmailToEvent({
      id: "abc127",
      subject: "New message from Ola Elkhatib",
      from: "team@riipen.com",
      snippet: "Please book a time slot through this link",
      body: "CTO calendly link kind regards",
      internalDate: String(Date.now())
    });

    expect(event.type).toBe("message.created");
    expect(event.actorRole).toBe("employer");
    expect(event.status).toBe("meeting_requested");
  });

  it("detects milestone reminder emails", () => {
    const event = parseRiipenEmailToEvent({
      id: "abc128",
      subject: "Milestone due soon: Final submission",
      from: "team@riipen.com",
      snippet: "Action required today",
      body: "You have a milestone deadline approaching.",
      internalDate: String(Date.now())
    });

    expect(event.type).toBe("milestone.reminder");
    expect(event.status).toBe("milestone_due");
  });

  it("extracts meeting window when explicit time is provided", () => {
    const event = parseRiipenEmailToEvent({
      id: "abc129",
      subject: "New message from employer",
      from: "team@riipen.com",
      snippet: "Can we meet April 27, 2026 at 3:30 PM?",
      body: "Please confirm.",
      internalDate: String(Date.now())
    });

    expect(event.meetingStartIso).toBeDefined();
    expect(event.meetingEndIso).toBeDefined();
  });
});
