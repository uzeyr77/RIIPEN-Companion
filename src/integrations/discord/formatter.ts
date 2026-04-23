import { NormalizedEvent } from "../../domain/events";

export function formatDiscordEventMessage(event: NormalizedEvent): string {
  const actor = event.actorRole ? `**${event.actorRole.toUpperCase()}**` : "**SYSTEM**";
  const status = event.status ? `\nStatus: ${event.status}` : "";
  const project = event.projectId ? `\nProject: ${event.projectId}` : "";
  const body = event.message ? `\nMessage: ${event.message}` : "";

  return `${actor} • ${event.type}${project}${status}${body}\nEvent ID: ${event.id}`;
}
