import { apiFetch } from "./client";
import type { Application, Paginated } from "./types";

export const listApplications = () => apiFetch<Paginated<Application>>("/applications");
export const createApplication = (payload: {
  job_id: string;
  resume_id: string;
  cover_letter?: string;
}) => apiFetch<Application>("/applications", { method: "POST", body: payload });
export const withdrawApplication = (id: string) =>
  apiFetch<void>(`/applications/${id}`, { method: "DELETE" });
