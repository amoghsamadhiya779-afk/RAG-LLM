import { useEffect, useRef, useState } from "react";

/**
 * Invisible / managed Cloudflare Turnstile widget.
 *
 * - Renders nothing when VITE_TURNSTILE_SITE_KEY is unset (local dev / no key).
 * - Renders nothing when the user is not a guest (signed-in traffic is
 *   already server-authenticated).
 * - Emits a token via onToken; consumers attach it to sensitive requests as
 *   the `x-turnstile-token` header (see apiFetch).
 *
 * Turnstile JS is loaded lazily from Cloudflare's CDN; if the CDN is blocked
 * we fall back to no-op (backend rate limits + quotas still apply).
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          size?: "normal" | "compact" | "invisible";
          theme?: "auto" | "light" | "dark";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

interface Props {
  enabled: boolean; // typically `isGuest`
  onToken: (token: string | null) => void;
  compact?: boolean;
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export function TurnstileGate({ enabled, onToken, compact = true }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState<boolean>(!!window.turnstile);

  useEffect(() => {
    if (!SITE_KEY || !enabled) return;
    if (window.turnstile) {
      setReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => setReady(true), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = "1";
    s.addEventListener("load", () => setReady(true), { once: true });
    s.addEventListener("error", () => onToken(null), { once: true });
    document.head.appendChild(s);
  }, [enabled, onToken]);

  useEffect(() => {
    if (!SITE_KEY || !enabled || !ready || !containerRef.current) return;
    const ts = window.turnstile;
    if (!ts) return;
    const id = ts.render(containerRef.current, {
      sitekey: SITE_KEY,
      size: compact ? "compact" : "normal",
      theme: "dark",
      callback: (t) => onToken(t),
      "error-callback": () => onToken(null),
      "expired-callback": () => onToken(null),
    });
    widgetIdRef.current = id;
    return () => {
      try {
        ts.remove(id);
      } catch {
        /* noop */
      }
      widgetIdRef.current = null;
    };
  }, [enabled, ready, compact, onToken]);

  if (!SITE_KEY || !enabled) return null;
  return <div ref={containerRef} className="min-h-[65px]" aria-hidden />;
}

export const TURNSTILE_ENABLED = !!SITE_KEY;
