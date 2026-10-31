import { config } from "dotenv";
import { z } from "zod";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), "../web/.env.local") });

const EnvSchema = z.object({
  SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEYS: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-flash-lite-latest"),
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

const rawUrl = parsed.SUPABASE_URL || parsed.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawServiceKey = parsed.SUPABASE_SERVICE_ROLE_KEY || parsed.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export const env = {
  ...parsed,
  supabaseUrl: rawUrl?.trim() || "",
  SUPABASE_SERVICE_ROLE_KEY: rawServiceKey?.trim() || "",
  hasGeminiKey: Boolean(parsed.GEMINI_API_KEY?.trim() || parsed.GEMINI_API_KEYS?.trim() || process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEYS?.trim()),
};

if (!env.supabaseUrl) {
  console.warn("[Env Warning] Neither SUPABASE_URL nor NEXT_PUBLIC_SUPABASE_URL is set");
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("[Env Warning] Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_SECRET_KEY is set");
}
