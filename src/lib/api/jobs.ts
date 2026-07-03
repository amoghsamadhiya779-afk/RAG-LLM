import { apiFetch } from "./client";
import type { Job, JobFilters, Paginated } from "./types";

function toQuery(filters: JobFilters = {}): string {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.remote !== undefined) p.set("remote", String(filters.remote));
  if (filters.page) p.set("page", String(filters.page));
  if (filters.page_size) p.set("page_size", String(filters.page_size));
  filters.tags?.forEach((t) => p.append("tag", t));
  filters.seniority?.forEach((s) => p.append("seniority", s));
  filters.employment_type?.forEach((e) => p.append("employment_type", e));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const listJobs = (filters?: JobFilters) =>
  apiFetch<Paginated<Job>>(`/jobs${toQuery(filters)}`);

export const getJob = (id: string) => apiFetch<Job>(`/jobs/${id}`);

export const saveJob = (id: string) =>
  apiFetch<{ saved: true }>(`/jobs/${id}/save`, { method: "POST" });

export const unsaveJob = (id: string) =>
  apiFetch<{ saved: false }>(`/jobs/${id}/save`, { method: "DELETE" });

export const listSavedJobs = () => apiFetch<Paginated<Job>>("/jobs/saved");
