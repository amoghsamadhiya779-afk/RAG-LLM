/**
 * Sentry init stub.
 *
 * No-op unless VITE_SENTRY_DSN is set at build time. When set, dynamically
 * imports @sentry/browser and initializes with a PII-scrubbing beforeSend.
 * We keep the import lazy so bundles stay small when Sentry isn't wired.
 *
 * NEVER capture: email, resume content, JWT/access tokens, cover letters.
 */

const PII_KEYS = new Set([
  "email",
  "authorization",
  "token",
  "access_token",
  "refresh_token",
  "resume",
  "resume_content",
  "cover_letter",
  "password",
]);

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = PII_KEYS.has(k.toLowerCase()) ? "[scrubbed]" : scrub(v, depth + 1);
    }
    return out;
  }
  return value;
}

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || typeof window === "undefined") return;
  try {
    // Lazy — Sentry is optional. If it isn't installed, silently skip.
    // Vite: ignore missing-module resolution at build time.
    const modPath = "@sentry/browser";
    const mod = (await import(/* @vite-ignore */ modPath).catch(
      () => null,
    )) as null | { init: (o: Record<string, unknown>) => void };
    if (!mod) return;
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.05,
      beforeSend(event: Record<string, unknown>) {
        return scrub(event) as Record<string, unknown>;
      },
    });
  } catch {
    /* noop */
  }
}
