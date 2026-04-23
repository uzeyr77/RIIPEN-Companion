import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  RIIPEN_API_BASE_URL: z.string().url().default("https://api.riipen.com/api/v1"),
  RIIPEN_SECRET_KEY: z.string().optional(),
  RIIPEN_WEBHOOK_SECRET: z.string().default("replace_me"),
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_APPLICATION_ID: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),
  DISCORD_ALERTS_CHANNEL_ID: z.string().optional()
});

export const env = envSchema.parse(process.env);
