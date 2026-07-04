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

import { supabase } from "@/integrations/supabase/client";

async function hasSession() {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export const saveJob = async (id: string) => {
  if (!(await hasSession())) return { saved: true }; // Guests use localStorage (handled in UI)
  return apiFetch<{ saved: true }>(`/saved/${id}`, { method: "POST" });
};

export const unsaveJob = async (id: string) => {
  if (!(await hasSession())) return { saved: false };
  return apiFetch<{ saved: false }>(`/saved/${id}`, { method: "DELETE" });
};

export const listSavedJobs = async () => {
  if (!(await hasSession())) return { items: [], total: 0, page: 1, page_size: 20 };
  return apiFetch<Paginated<Job>>("/saved");
};
