import { NormalizedEvent } from "../../domain/events";

const events: NormalizedEvent[] = [];
const idempotencyKeys = new Set<string>();
const completedMilestoneIds = new Set<string>();
const reminderTimestamps = new Map<string, number>();

export const messageRepo = {
  save(event: NormalizedEvent): void {
    events.push(event);
  },
  list(): NormalizedEvent[] {
    return [...events];
  },
  isDuplicate(id: string): boolean {
    return idempotencyKeys.has(id);
  },
  markProcessed(id: string): void {
    idempotencyKeys.add(id);
  },
  markMilestoneCompleted(id: string): void {
    completedMilestoneIds.add(id);
  },
  isMilestoneCompleted(id: string): boolean {
    return completedMilestoneIds.has(id);
  },
  getPendingMilestones(remindEveryMs: number): NormalizedEvent[] {
    const now = Date.now();
    return events.filter((event) => {
      if (event.type !== "milestone.reminder") {
        return false;
      }
      if (completedMilestoneIds.has(event.id)) {
        return false;
      }
      const lastReminder = reminderTimestamps.get(event.id) ?? 0;
      return now - lastReminder >= remindEveryMs;
    });
  },
  markMilestoneReminded(id: string): void {
    reminderTimestamps.set(id, Date.now());
  }
};
