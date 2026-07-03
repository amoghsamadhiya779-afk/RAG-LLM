import { z } from "zod";

const bool = z
  .union([z.string(), z.boolean(), z.undefined()])
  .transform((v) => v === true || v === "true" || v === "1");

const rawSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_API_URL: z.string().url().optional().or(z.literal("")),
  VITE_USE_MOCKS: bool.optional(),
});

// Accept either the classic anon key or the newer publishable key naming.
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const parsed = rawSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: supabaseKey,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_USE_MOCKS: import.meta.env.VITE_USE_MOCKS,
});

type EnvShape = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  API_URL: string | undefined;
  USE_MOCKS: boolean;
  READY: boolean;
  ERROR: string | null;
};

function buildEnv(): EnvShape {
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return {
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      API_URL: undefined,
      USE_MOCKS: true,
      READY: false,
      ERROR: msg,
    };
  }
  const d = parsed.data;
  const useMocks = d.VITE_USE_MOCKS ?? import.meta.env.DEV;
  const apiUrl = d.VITE_API_URL && d.VITE_API_URL !== "" ? d.VITE_API_URL : undefined;

  // Prod guard: shipping the build with mocks on is a data-integrity bug.
  if (import.meta.env.PROD && useMocks) {
    throw new Error(
      "[env] VITE_USE_MOCKS must not be enabled in production builds. " +
        "Unset it and provide VITE_API_URL.",
    );
  }

  if (!useMocks && !apiUrl) {
    return {
      SUPABASE_URL: d.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: d.VITE_SUPABASE_ANON_KEY,
      API_URL: undefined,
      USE_MOCKS: false,
      READY: false,
      ERROR:
        "VITE_API_URL is required when VITE_USE_MOCKS is not 'true'. Set VITE_API_URL or enable mocks.",
    };
  }

  return {
    SUPABASE_URL: d.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: d.VITE_SUPABASE_ANON_KEY,
    API_URL: apiUrl,
    USE_MOCKS: useMocks,
    READY: true,
    ERROR: null,
  };
}

export const env = buildEnv();
