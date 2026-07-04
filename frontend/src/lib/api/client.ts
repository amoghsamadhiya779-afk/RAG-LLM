import { env } from "@/lib/env";
import { supabase } from "@/integrations/supabase/client";
import { ApiError, type ApiErrorEnvelope } from "./errors";
import { matchMock, simulateLatency } from "./mocks/registry";
import "./mocks/fixtures";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: Json | FormData;
  /** Force mock even when a real API URL is configured. */
  mock?: boolean;
  /** Fall back to mock if network fails (default: true when mocks are on). */
  networkFallback?: boolean;
  /** Skip attaching the Supabase bearer token. */
  noAuth?: boolean;
  /** Idempotency key for POST/PUT mutations (auto-generated when omitted). */
  idempotencyKey?: string;
  /** Cloudflare Turnstile token for guest-facing sensitive actions. */
  turnstileToken?: string;
}

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

let mocksEnabled = env.USE_MOCKS;
if (typeof window !== "undefined") {
  const w = window as Window & { __jobion?: { mocks: boolean; toggle: () => boolean } };
  w.__jobion = {
    get mocks() {
      return mocksEnabled;
    },
    set mocks(v: boolean) {
      mocksEnabled = v;
    },
    toggle() {
      mocksEnabled = !mocksEnabled;
      return mocksEnabled;
    },
  } as unknown as { mocks: boolean; toggle: () => boolean };
}

async function runMock(method: string, path: string, body: unknown) {
  const handler = matchMock(method, path);
  if (!handler) {
    throw new ApiError({
      code: "mock_not_found",
      message: `No mock registered for ${method} ${path}`,
      status: 501,
    });
  }
  await simulateLatency();
  const [p, qs] = path.split("?");
  return handler({
    method,
    path: p,
    query: new URLSearchParams(qs ?? ""),
    body,
  });
}

async function attachAuthHeaders(headers: Headers) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } catch {
    // ignore — treat as unauthenticated
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const method = (opts.method ?? "GET").toUpperCase();
  const useMock = opts.mock ?? (mocksEnabled || !env.API_URL);
  const fallback = opts.networkFallback ?? mocksEnabled;

  if (useMock) {
    return (await runMock(method, path, opts.body)) as T;
  }

  const headers = new Headers(opts.headers as HeadersInit | undefined);
  const isForm = opts.body instanceof FormData;
  let body: BodyInit | undefined;
  if (opts.body !== undefined && opts.body !== null) {
    if (isForm) {
      body = opts.body as FormData;
    } else {
      headers.set("content-type", "application/json");
      body = JSON.stringify(opts.body);
    }
  }
  if (!opts.noAuth) await attachAuthHeaders(headers);
  headers.set("accept", "application/json");

  // Correlation + idempotency + Turnstile (backend contract).
  const requestId = newRequestId();
  headers.set("x-request-id", requestId);
  if (opts.turnstileToken) headers.set("x-turnstile-token", opts.turnstileToken);
  if (method !== "GET" && method !== "HEAD") {
    headers.set("Idempotency-Key", opts.idempotencyKey ?? requestId);
  }

  const url = `${env.API_URL!.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), 4000);
  const signal = opts.signal
    ? (AbortSignal.any ? AbortSignal.any([opts.signal, timeoutCtrl.signal]) : timeoutCtrl.signal)
    : timeoutCtrl.signal;
  try {
    res = await fetch(url, { ...opts, method, headers, body, signal });
  } catch (err) {
    if (fallback) return (await runMock(method, path, opts.body)) as T;
    throw new ApiError({
      code: "network_error",
      message: err instanceof Error ? err.message : "Network request failed",
      status: 0,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401 && typeof window !== "undefined" && !opts.noAuth) {
    // Open-access app: on 401, clear the (possibly stale) session so the
    // SessionProvider can mint a fresh anonymous one on next render.
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
  }


  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const envelope = payload as ApiErrorEnvelope | null;
    throw new ApiError({
      code: envelope?.error?.code ?? `http_${res.status}`,
      message: envelope?.error?.message ?? `Request failed with status ${res.status}`,
      status: res.status,
      requestId: envelope?.error?.request_id,
    });
  }

  return payload as T;
}

export { ApiError };
