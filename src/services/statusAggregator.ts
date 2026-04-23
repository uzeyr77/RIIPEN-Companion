import { NormalizedEvent } from "../domain/events";
import { messageRepo } from "../storage/repositories/messageRepo";

export function getStatusSummary() {
  const events = messageRepo.list();
  const byProject = new Map<string, NormalizedEvent[]>();

  for (const event of events) {
    const key = event.projectId ?? "unscoped";
    const arr = byProject.get(key) ?? [];
    arr.push(event);
    byProject.set(key, arr);
  }

  return [...byProject.entries()].map(([projectId, projectEvents]) => {
    const latest = projectEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
    const unresolvedActions = projectEvents.filter((e) => e.type === "match.requested" || e.type === "application.status_changed").length;

    return {
      projectId,
      latestStage: latest.status ?? latest.type,
      lastActivityAt: latest.timestamp,
      unresolvedActions
    };
  });
}
