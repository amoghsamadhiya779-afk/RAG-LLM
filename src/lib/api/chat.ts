import { apiFetch } from "./client";
import type { ChatMessage } from "./types";

export const listChatMessages = () => apiFetch<ChatMessage[]>("/chat/messages");
export const sendChatMessage = (content: string) =>
  apiFetch<ChatMessage>("/chat/messages", { method: "POST", body: { content } });
