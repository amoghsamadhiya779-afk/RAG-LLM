import { apiFetch } from "./client";
import type { Me } from "./types";

export interface UpdateMePayload extends Record<string, unknown> {
  full_name?: string | null;
  avatar_url?: string | null;
}

export const getMe = () => apiFetch<Me>("/me");

export const updateMe = (payload: UpdateMePayload) =>
  apiFetch<Me>("/me", { method: "PATCH", body: payload });

/** Right-to-delete: purge account + PII. Backend handles cascade. */
export const deleteAccount = () =>
  apiFetch<{ ok: true }>("/me", { method: "DELETE" });
