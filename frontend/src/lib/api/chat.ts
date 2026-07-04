import { apiFetch } from "./client";
import type { ChatMessage } from "./types";

export const listChatMessages = () => apiFetch<ChatMessage[]>("/chat");
export const sendChatMessage = (content: string) =>
  apiFetch<ChatMessage>("/chat", { method: "POST", body: { message: content } });
