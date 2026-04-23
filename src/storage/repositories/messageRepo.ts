import { NormalizedEvent } from "../../domain/events";

const events: NormalizedEvent[] = [];
const idempotencyKeys = new Set<string>();

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
  }
};
