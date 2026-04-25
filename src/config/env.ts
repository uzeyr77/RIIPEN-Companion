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
  DISCORD_ALERTS_CHANNEL_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GMAIL_QUERY: z.string().default("from:riipen newer_than:7d"),
  GMAIL_POLL_INTERVAL_MS: z.coerce.number().default(60000),
  GOOGLE_CALENDAR_ID: z.string().default("primary"),
  MILESTONE_REMINDER_INTERVAL_MS: z.coerce.number().default(6 * 60 * 60 * 1000),
  MILESTONE_REMINDER_CHECK_MS: z.coerce.number().default(5 * 60 * 1000)
});

export const env = envSchema.parse(process.env);
