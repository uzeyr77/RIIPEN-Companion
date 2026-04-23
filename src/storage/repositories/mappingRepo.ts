interface ConversationMapping {
  conversationId: string;
  discordChannelId: string;
  discordThreadId: string;
  updatedAt: string;
}

const mappings = new Map<string, ConversationMapping>();

export const mappingRepo = {
  set(mapping: ConversationMapping): void {
    mappings.set(mapping.conversationId, mapping);
  },
  get(conversationId: string): ConversationMapping | undefined {
    return mappings.get(conversationId);
  },
  all(): ConversationMapping[] {
    return [...mappings.values()];
  }
};
