import { NormalizedEvent } from "../../domain/events";
import { sqlite } from "../sqlite";

type EventRow = {
  id: string;
  user_id: string | null;
  type: NormalizedEvent["type"];
  timestamp: string;
  actor_role: NormalizedEvent["actorRole"] | null;
  project_id: string | null;
  conversation_id: string | null;
  application_id: string | null;
  status: string | null;
  message: string | null;
  meeting_start_iso: string | null;
  meeting_end_iso: string | null;
  calendar_conflict: number | null;
  raw_json: string;
};

function rowToEvent(row: EventRow): NormalizedEvent {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    type: row.type,
    timestamp: row.timestamp,
    actorRole: row.actor_role ?? undefined,
    projectId: row.project_id ?? undefined,
    conversationId: row.conversation_id ?? undefined,
    applicationId: row.application_id ?? undefined,
    status: row.status ?? undefined,
    message: row.message ?? undefined,
    meetingStartIso: row.meeting_start_iso ?? undefined,
    meetingEndIso: row.meeting_end_iso ?? undefined,
    calendarConflict: row.calendar_conflict == null ? undefined : row.calendar_conflict === 1,
    raw: JSON.parse(row.raw_json)
  };
}

const insertEventStmt = sqlite.prepare(`
  INSERT OR REPLACE INTO events (
    id, user_id, type, timestamp, actor_role, project_id, conversation_id, application_id, status, message,
    meeting_start_iso, meeting_end_iso, calendar_conflict, raw_json
  ) VALUES (
    @id, @user_id, @type, @timestamp, @actor_role, @project_id, @conversation_id, @application_id, @status, @message,
    @meeting_start_iso, @meeting_end_iso, @calendar_conflict, @raw_json
  )
`);
const listEventsStmt = sqlite.prepare("SELECT * FROM events ORDER BY timestamp DESC");
const hasProcessedStmt = sqlite.prepare("SELECT 1 FROM processed_events WHERE id = ? LIMIT 1");
const markProcessedStmt = sqlite.prepare("INSERT OR IGNORE INTO processed_events (id, processed_at) VALUES (?, ?)");
const markMilestoneCompleteStmt = sqlite.prepare(
  "INSERT OR REPLACE INTO milestone_completion (event_id, completed_at) VALUES (?, ?)"
);
const isMilestoneCompleteStmt = sqlite.prepare("SELECT 1 FROM milestone_completion WHERE event_id = ? LIMIT 1");
const pendingMilestonesStmt = sqlite.prepare(`
  SELECT e.*
  FROM events e
  LEFT JOIN milestone_completion mc ON mc.event_id = e.id
  LEFT JOIN milestone_reminders mr ON mr.event_id = e.id
  WHERE e.type = 'milestone.reminder'
    AND mc.event_id IS NULL
    AND (mr.reminded_at IS NULL OR ? - mr.reminded_at >= ?)
  ORDER BY e.timestamp ASC
`);
const markMilestoneRemindedStmt = sqlite.prepare(
  "INSERT OR REPLACE INTO milestone_reminders (event_id, reminded_at) VALUES (?, ?)"
);
const markMilestoneCompletedByTitleStmt = sqlite.prepare(
  `INSERT OR IGNORE INTO milestone_completion (event_id, completed_at)
   SELECT e.id, ?
   FROM events e
   WHERE e.type = 'milestone.reminder'
     AND (
       lower(coalesce(e.message, '')) LIKE ?
       OR lower(coalesce(e.raw_json, '')) LIKE ?
     )`
);
const getAppStateStmt = sqlite.prepare("SELECT value FROM app_state WHERE key = ? LIMIT 1");
const setAppStateStmt = sqlite.prepare("INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)");

export const messageRepo = {
  save(event: NormalizedEvent): void {
    insertEventStmt.run({
      id: event.id,
      user_id: event.userId ?? null,
      type: event.type,
      timestamp: event.timestamp,
      actor_role: event.actorRole ?? null,
      project_id: event.projectId ?? null,
      conversation_id: event.conversationId ?? null,
      application_id: event.applicationId ?? null,
      status: event.status ?? null,
      message: event.message ?? null,
      meeting_start_iso: event.meetingStartIso ?? null,
      meeting_end_iso: event.meetingEndIso ?? null,
      calendar_conflict: event.calendarConflict == null ? null : event.calendarConflict ? 1 : 0,
      raw_json: JSON.stringify(event.raw ?? {})
    });
  },
  list(): NormalizedEvent[] {
    const rows = listEventsStmt.all() as EventRow[];
    return rows.map(rowToEvent);
  },
  isDuplicate(id: string): boolean {
    const row = hasProcessedStmt.get(id);
    return Boolean(row);
  },
  markProcessed(id: string): void {
    markProcessedStmt.run(id, Date.now());
  },
  markMilestoneCompleted(id: string): void {
    markMilestoneCompleteStmt.run(id, Date.now());
  },
  isMilestoneCompleted(id: string): boolean {
    const row = isMilestoneCompleteStmt.get(id);
    return Boolean(row);
  },
  getPendingMilestones(remindEveryMs: number): NormalizedEvent[] {
    const now = Date.now();
    const rows = pendingMilestonesStmt.all(now, remindEveryMs) as EventRow[];
    return rows.map(rowToEvent);
  },
  markMilestoneReminded(id: string): void {
    markMilestoneRemindedStmt.run(id, Date.now());
  },
  markMilestonesCompletedByTitle(title: string): number {
    const like = `%${title.toLowerCase()}%`;
    const result = markMilestoneCompletedByTitleStmt.run(Date.now(), like, like);
    return result.changes;
  },
  getLastGmailProcessedAt(): number | null {
    const row = getAppStateStmt.get("gmail.lastProcessedAt") as { value: string } | undefined;
    if (!row) {
      return null;
    }
    const parsed = Number(row.value);
    return Number.isFinite(parsed) ? parsed : null;
  },
  setLastGmailProcessedAt(timestampMs: number): void {
    setAppStateStmt.run("gmail.lastProcessedAt", String(timestampMs));
  }
};
