import { NormalizedEvent } from "../../domain/events";

export function formatDiscordEventMessage(event: NormalizedEvent): string {
  const actor = event.actorRole ? event.actorRole.toUpperCase() : "SYSTEM";
  const conversation = event.conversationId ? `\nConversation: \`${event.conversationId}\`` : "";
  const status = event.status ? `\nStatus: \`${event.status}\`` : "";
  const project = event.projectId ? `\nProject: \`${event.projectId}\`` : "";
  const body = event.message ? `\nMessage: ${event.message}` : "";
  const meetingPrompt = event.status?.startsWith("meeting_requested")
    ? `\n\nMeeting request detected.${
        event.status === "meeting_requested_conflict"
          ? " Your calendar appears BUSY for the proposed time."
          : event.status === "meeting_requested_free"
            ? " Your calendar appears FREE for the proposed time."
            : " No specific time was detected, so conflict check could not run."
      }\nNo meeting was auto-booked. Use \`!create-meeting startIso|durationMinutes|title\` only when you want to confirm.`
    : "";
  const milestonePrompt =
    event.type === "milestone.reminder"
      ? "\n\nMilestone reminder: reply with `!complete-milestone <Event ID>` after you finish this task."
      : "";

  return `**${actor}** - **${event.type}**${project}${conversation}${status}${body}${meetingPrompt}${milestonePrompt}\nEvent ID: \`${event.id}\``;
}
