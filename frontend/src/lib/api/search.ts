import { apiFetch } from "./client";
import type { Job } from "./types";

export const globalSearch = (q: string) =>
  apiFetch<{ jobs: Job[] }>(`/search?q=${encodeURIComponent(q)}`);
