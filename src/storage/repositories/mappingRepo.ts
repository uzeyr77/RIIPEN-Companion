interface ConversationMapping {
  conversationId: string;
  userId?: string;
  discordChannelId: string;
  discordThreadId: string;
  updatedAt: string;
}

import { sqlite } from "../sqlite";

type MappingRow = {
  conversation_id: string;
  user_id: string | null;
  discord_channel_id: string;
  discord_thread_id: string;
  updated_at: string;
};

const upsertMappingStmt = sqlite.prepare(`
  INSERT OR REPLACE INTO conversation_mappings (
    conversation_id, user_id, discord_channel_id, discord_thread_id, updated_at
  ) VALUES (?, ?, ?, ?, ?)
`);
const getMappingStmt = sqlite.prepare("SELECT * FROM conversation_mappings WHERE conversation_id = ? LIMIT 1");
const listMappingsStmt = sqlite.prepare("SELECT * FROM conversation_mappings ORDER BY updated_at DESC");

export const mappingRepo = {
  set(mapping: ConversationMapping): void {
    upsertMappingStmt.run(
      mapping.conversationId,
      mapping.userId ?? null,
      mapping.discordChannelId,
      mapping.discordThreadId,
      mapping.updatedAt
    );
  },
  get(conversationId: string): ConversationMapping | undefined {
    const row = getMappingStmt.get(conversationId) as MappingRow | undefined;
    if (!row) {
      return undefined;
    }
    return {
      conversationId: row.conversation_id,
      userId: row.user_id ?? undefined,
      discordChannelId: row.discord_channel_id,
      discordThreadId: row.discord_thread_id,
      updatedAt: row.updated_at
    };
  },
  all(): ConversationMapping[] {
    const rows = listMappingsStmt.all() as MappingRow[];
    return rows.map((row) => ({
      conversationId: row.conversation_id,
      userId: row.user_id ?? undefined,
      discordChannelId: row.discord_channel_id,
      discordThreadId: row.discord_thread_id,
      updatedAt: row.updated_at
    }));
  }
};
