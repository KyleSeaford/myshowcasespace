import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24 * 7),
  PLATFORM_DOMAIN: z.string().default("myshowcase.space"),
  PLATFORM_PROTOCOL: z.enum(["http", "https"]).default("https"),
  PLATFORM_PUBLIC_PORT: z.coerce.number().int().positive().optional(),
  APP_BASE_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).default("Rivo <onboarding@resend.dev>"),
  UPLOADTHING_TOKEN: z.string().min(1).optional(),
  COOKIE_NAME: z.string().default("ms_session")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment variables: ${message}`);
}

export const env = parsed.data;
