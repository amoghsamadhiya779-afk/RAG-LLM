import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  VITE_USE_MOCKS: z.string().optional().default("false"),
  VITE_API_URL: z.string().url().optional(),
  VITE_TURNSTILE_SITE_KEY: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  // Add server-side env vars if needed via process.env fallback
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

// For Vite client-side, we use import.meta.env
// For Nitro/Vercel server-side, we might need process.env
const rawEnv = {
  VITE_SUPABASE_URL: typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY : process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_USE_MOCKS: typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_USE_MOCKS : process.env.VITE_USE_MOCKS,
  VITE_API_URL: typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_API_URL : process.env.VITE_API_URL,
  VITE_TURNSTILE_SITE_KEY: typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_TURNSTILE_SITE_KEY : process.env.VITE_TURNSTILE_SITE_KEY,
  VITE_SENTRY_DSN: typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_SENTRY_DSN : process.env.VITE_SENTRY_DSN,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
