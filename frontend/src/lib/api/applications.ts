import { apiFetch } from "./client";
import type { Application, Paginated } from "./types";

export const listApplications = () => apiFetch<Paginated<Application>>("/applications/mine");
export const createApplication = (payload: {
  job_id: string;
  resume_id?: string;
  cover_note?: string;
}) => apiFetch<Application>(`/jobs/${payload.job_id}/applications`, { method: "POST", body: payload });
export const withdrawApplication = (id: string) =>
  apiFetch<void>(`/applications/${id}`, { method: "PATCH", body: { stage: "withdrawn" } });
