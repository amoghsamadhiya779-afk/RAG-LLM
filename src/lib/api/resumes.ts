import { apiFetch } from "./client";
import type { Paginated, Resume, ResumeAnalysis } from "./types";

export const listResumes = () => apiFetch<Paginated<Resume>>("/resumes");
export const getResume = (id: string) => apiFetch<Resume>(`/resumes/${id}`);
export const deleteResume = (id: string) =>
  apiFetch<void>(`/resumes/${id}`, { method: "DELETE" });
export const getResumeAnalysis = (id: string) =>
  apiFetch<ResumeAnalysis>(`/resumes/${id}/analysis`);

/** Called by FastAPI after Supabase Storage upload; frontend sends storage_path. */
export const registerResume = (payload: { filename: string; storage_path: string }) =>
  apiFetch<Resume>("/resumes", { method: "POST", body: payload });
