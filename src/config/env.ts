import "dotenv/config";
import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24 * 7),
  PLATFORM_DOMAIN: z.string().default("myshowcase.space"),
  PLATFORM_PROTOCOL: z.enum(["http", "https"]).default("https"),
  PLATFORM_PUBLIC_PORT: z.coerce.number().int().positive().optional(),
  APP_BASE_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: optionalNonEmptyString,
  STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
  STRIPE_PERSONAL_PRICE_ID: z.string().min(1).default("price_1TKcL32NVwwlVKa89CwfG2pm"),
  STRIPE_STUDIO_PRICE_ID: z.string().min(1).default("price_1TKcLk2NVwwlVKa8ihqv4zV8"),
  RESEND_API_KEY: optionalNonEmptyString,
  EMAIL_FROM: z.string().min(1).default("Rivo <hello@tryrivo.org>"),
  UPLOADTHING_TOKEN: optionalNonEmptyString,
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
