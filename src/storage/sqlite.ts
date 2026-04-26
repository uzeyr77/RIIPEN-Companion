import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "../config/env";

const dbPath = path.resolve(process.cwd(), env.SQLITE_PATH);
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  actor_role TEXT,
  project_id TEXT,
  conversation_id TEXT,
  application_id TEXT,
  status TEXT,
  message TEXT,
  meeting_start_iso TEXT,
  meeting_end_iso TEXT,
  calendar_conflict INTEGER,
  raw_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS processed_events (
  id TEXT PRIMARY KEY,
  processed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_mappings (
  conversation_id TEXT PRIMARY KEY,
  user_id TEXT,
  discord_channel_id TEXT NOT NULL,
  discord_thread_id TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS milestone_completion (
  event_id TEXT PRIMARY KEY,
  completed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS milestone_reminders (
  event_id TEXT PRIMARY KEY,
  reminded_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

function ensureColumn(table: string, column: string, definition: string): void {
  const rows = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!rows.some((r) => r.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn("events", "user_id", "TEXT");
ensureColumn("conversation_mappings", "user_id", "TEXT");
