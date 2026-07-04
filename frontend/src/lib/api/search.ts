import { apiFetch } from "./client";
import type { Job } from "./types";

export const globalSearch = (q: string) =>
  apiFetch<{ jobs: Job[] }>(`/search?q=${encodeURIComponent(q)}`);

export const searchWeb = async (q: string) => {
  if (!q || q.length < 2) return { items: [] as Job[] };
  return apiFetch<{ items: Job[] }>(`/search/web?q=${encodeURIComponent(q)}`);
};
