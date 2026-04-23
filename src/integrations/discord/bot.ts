import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Message,
  TextChannel,
  ThreadChannel
} from "discord.js";
import { env } from "../../config/env";
import { NormalizedEvent } from "../../domain/events";
import { logger } from "../../observability/logger";
import { mappingRepo } from "../../storage/repositories/mappingRepo";
import { formatDiscordEventMessage } from "./formatter";

export class DiscordBridgeBot {
  private client: Client;

  constructor() {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
  }

  async start(onReply: (message: Message, conversationId: string) => Promise<void>): Promise<void> {
    this.client.on(Events.ClientReady, () => {
      logger.info("discord bot ready");
    });

    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot || !message.channel.isThread()) {
        return;
      }

      const mapping = mappingRepo.all().find((m) => m.discordThreadId === message.channel.id);
      if (!mapping) {
        return;
      }

      await onReply(message, mapping.conversationId);
    });

    if (!env.DISCORD_BOT_TOKEN || env.DISCORD_BOT_TOKEN === "replace_me") {
      logger.warn("DISCORD_BOT_TOKEN not set. Discord bot is disabled.");
      return;
    }

    await this.client.login(env.DISCORD_BOT_TOKEN);
  }

  async publishRiipenEvent(event: NormalizedEvent): Promise<void> {
    if (!env.DISCORD_ALERTS_CHANNEL_ID) {
      return;
    }

    const baseChannel = (await this.client.channels.fetch(env.DISCORD_ALERTS_CHANNEL_ID)) as TextChannel | null;
    if (!baseChannel) {
      return;
    }

    let thread: ThreadChannel;
    const mapping = event.conversationId ? mappingRepo.get(event.conversationId) : undefined;

    if (mapping) {
      const channel = await this.client.channels.fetch(mapping.discordThreadId);
      if (!channel || channel.type !== ChannelType.PublicThread) {
        thread = await baseChannel.threads.create({
          name: `riipen-${event.conversationId}`,
          reason: "Riipen conversation sync"
        });
      } else {
        thread = channel as ThreadChannel;
      }
    } else {
      thread = await baseChannel.threads.create({
        name: `riipen-${event.conversationId ?? event.id}`,
        reason: "Riipen conversation sync"
      });

      if (event.conversationId) {
        mappingRepo.set({
          conversationId: event.conversationId,
          discordChannelId: baseChannel.id,
          discordThreadId: thread.id,
          updatedAt: new Date().toISOString()
        });
      }
    }

    await thread.send(formatDiscordEventMessage(event));
  }
}
