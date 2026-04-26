import crypto from "node:crypto";

export type EventType =
  | "message.created"
  | "project.updated"
  | "application.status_changed"
  | "match.requested"
  | "team.started"
  | "milestone.reminder";

export interface NormalizedEvent {
  id: string;
  userId?: string;
  type: EventType;
  timestamp: string;
  actorRole?: "student" | "employer" | "system";
  projectId?: string;
  conversationId?: string;
  applicationId?: string;
  status?: string;
  message?: string;
  meetingStartIso?: string;
  meetingEndIso?: string;
  calendarConflict?: boolean;
  raw: unknown;
}

export function normalizeRiipenEvent(payload: any): NormalizedEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? crypto.randomUUID()),
    type: (payload.type ?? "project.updated") as EventType,
    timestamp: new Date(payload.created_at ?? Date.now()).toISOString(),
    actorRole: payload.actor_role,
    projectId: payload.project_id,
    conversationId: payload.conversation_id,
    applicationId: payload.application_id,
    status: payload.status,
    message: payload.message ?? payload.body,
    raw: payload
  };
}
