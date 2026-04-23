import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { env } from "../../config/env";

export async function registerCommands(): Promise<void> {
  if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID || !env.DISCORD_APPLICATION_ID) {
    return;
  }

  const commands = [
    new SlashCommandBuilder().setName("link-riipen").setDescription("Link this Discord server to Riipen tracker"),
    new SlashCommandBuilder().setName("thread-status").setDescription("Show mapped Riipen thread status"),
    new SlashCommandBuilder().setName("mute-project").setDescription("Mute updates for a project")
  ].map((c) => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN);
  await rest.put(Routes.applicationGuildCommands(env.DISCORD_APPLICATION_ID, env.DISCORD_GUILD_ID), { body: commands });
}
