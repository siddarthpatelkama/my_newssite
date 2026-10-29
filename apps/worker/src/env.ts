import { config } from "dotenv";
import { z } from "zod";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), "../web/.env.local") });

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEYS: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  NEWSLETTER_LABEL: z.string().default("INBOX"),
  MAX_EMAILS_PER_SYNC: z.coerce.number().default(50),
  MAX_AI_RETRIES: z.coerce.number().default(3),
  MAX_BACKFILL: z.coerce.number().default(100),
  LOG_LEVEL: z.string().default("info"),
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  ...parsed,
  supabaseUrl: parsed.SUPABASE_URL ?? parsed.NEXT_PUBLIC_SUPABASE_URL,
  hasGeminiKey: Boolean(parsed.GEMINI_API_KEY?.trim() || parsed.GEMINI_API_KEYS?.trim()),
};

if (!env.supabaseUrl) {
  throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
}
