import {
  Client,
  Events,
  GatewayIntentBits,
  Message,
  TextChannel
} from "discord.js";
import { env } from "../../config/env";
import { NormalizedEvent } from "../../domain/events";
import { logger } from "../../observability/logger";
import { mappingRepo } from "../../storage/repositories/mappingRepo";
import { formatDiscordEventMessage } from "./formatter";

export interface ThreadReplyContext {
  conversationId?: string;
  userId?: string;
  discordChannelId: string;
  discordThreadId?: string;
}

export class DiscordBridgeBot {
  private client: Client;

  constructor() {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
  }

  async start(onReply: (message: Message, context: ThreadReplyContext) => Promise<void>): Promise<void> {
    this.client.on(Events.ClientReady, () => {
      logger.info("discord bot ready");
    });

    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot || !message.content.startsWith("!")) {
        return;
      }

      const baseChannelId = env.DISCORD_ALERTS_CHANNEL_ID;
      if (!baseChannelId || message.channel.id !== baseChannelId) {
        return;
      }

      await onReply(message, {
        conversationId: undefined,
        userId: undefined,
        discordChannelId: message.channel.id
      });
    });

    if (!env.DISCORD_BOT_TOKEN || env.DISCORD_BOT_TOKEN === "replace_me") {
      logger.warn("DISCORD_BOT_TOKEN not set. Discord bot is disabled.");
      return;
    }

    await this.client.login(env.DISCORD_BOT_TOKEN);
  }

  async publishRiipenEvent(event: NormalizedEvent, targetChannelId?: string): Promise<void> {
    const baseChannelId = targetChannelId ?? env.DISCORD_ALERTS_CHANNEL_ID;
    if (!baseChannelId) {
      return;
    }

    const baseChannel = (await this.client.channels.fetch(baseChannelId)) as TextChannel | null;
    if (!baseChannel) {
      return;
    }

    if (event.conversationId) {
      mappingRepo.set({
        conversationId: event.conversationId,
        userId: event.userId,
        discordChannelId: baseChannel.id,
        discordThreadId: baseChannel.id,
        updatedAt: new Date().toISOString()
      });
    }

    await baseChannel.send(formatDiscordEventMessage(event));
  }
}
