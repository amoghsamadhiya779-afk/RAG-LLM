import { apiFetch, attachAuthHeaders, isMockMode, newRequestId } from "./client";
import { ApiError, type ApiErrorEnvelope } from "./errors";
import type { ChatMessage } from "./types";
import { env } from "@/lib/env";

export const listChatMessages = () => apiFetch<ChatMessage[]>("/chat");
export const sendChatMessage = (content: string) =>
  apiFetch<ChatMessage>("/chat", { method: "POST", body: { message: content } });

export type ChatStreamEvent =
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * Streams /chat/stream token-by-token via SSE. Falls back to a single
 * synthetic "token" + "done" pair (via the mocked non-streaming endpoint)
 * when running in mock/offline mode, since there's no mock SSE transport.
 */
export async function streamChatMessage(
  message: string,
  onEvent: (event: ChatStreamEvent) => void,
  opts: { turnstileToken?: string; signal?: AbortSignal } = {},
): Promise<void> {
  if (isMockMode()) {
    try {
      const data = await apiFetch<{ response: string }>("/chat", {
        method: "POST",
        body: { message },
        turnstileToken: opts.turnstileToken,
      });
      onEvent({ type: "token", text: data.response });
      onEvent({ type: "done" });
    } catch (err) {
      onEvent({ type: "error", message: err instanceof Error ? err.message : "Mock chat failed" });
    }
    return;
  }

  const headers = new Headers();
  headers.set("content-type", "application/json");
  headers.set("accept", "text/event-stream");
  await attachAuthHeaders(headers);
  const requestId = newRequestId();
  headers.set("x-request-id", requestId);
  headers.set("Idempotency-Key", requestId);
  if (opts.turnstileToken) headers.set("x-turnstile-token", opts.turnstileToken);

  const baseUrl = env.API_URL!.replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/chat/stream`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    let envelope: ApiErrorEnvelope | null = null;
    try {
      envelope = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError({
      code: envelope?.error?.code ?? `http_${res.status}`,
      message: envelope?.error?.message ?? `Request failed with status ${res.status}`,
      status: res.status,
      requestId: envelope?.error?.request_id,
    });
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      let eventType = "message";
      let data = "";
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) eventType = line.slice(6).trim();
        else if (line.startsWith("data:")) data = line.slice(5).trim();
      }
      if (!data) continue;

      try {
        const parsed = JSON.parse(data);
        if (eventType === "token" && typeof parsed.text === "string") {
          onEvent({ type: "token", text: parsed.text });
        } else if (eventType === "done") {
          onEvent({ type: "done" });
        } else if (eventType === "error") {
          onEvent({ type: "error", message: parsed.message ?? "Chat stream failed" });
        }
      } catch {
        // ignore malformed SSE frame
      }
    }
  }
}
