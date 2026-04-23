CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  actor_role TEXT,
  project_id TEXT,
  conversation_id TEXT,
  application_id TEXT,
  status TEXT,
  message TEXT,
  raw_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_idempotency (
  id TEXT PRIMARY KEY,
  processed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_discord_map (
  conversation_id TEXT PRIMARY KEY,
  discord_channel_id TEXT NOT NULL,
  discord_thread_id TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbound_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  source_discord_message_id TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at TEXT NOT NULL
);
