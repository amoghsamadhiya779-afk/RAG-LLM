import { apiFetch } from "./client";
import type { Applicant, ApplicantStage, EmployerJob, Job, Paginated } from "./types";


export interface CreateJobInput {
  title: string;
  location: string;
  remote: boolean;
  seniority: Job["seniority"];
  employment_type: Job["employment_type"];
  tags: string[];
  description_md: string;
  apply_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
}

export const createJob = (input: CreateJobInput) => {
  const payload = {
    ...input,
    description_html: input.description_md,
    source: "internal",
    external_id: "tmp_id"
  };
  return apiFetch<EmployerJob>("/jobs", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
  });
};

export const listMyJobs = () =>
  apiFetch<Paginated<EmployerJob>>("/jobs/mine");

export interface EmployerStats {
  total_jobs: number;
  live_jobs: number;
  total_views: number;
  total_applicants: number;
}

export const getEmployerStats = () =>
  apiFetch<EmployerStats>("/jobs/employer/stats");

export const listJobApplicants = (jobId: string) =>
  apiFetch<Paginated<Applicant>>(`/jobs/${jobId}/applications`);

export const updateApplicantStage = (applicationId: string, stage: ApplicantStage) =>
  apiFetch<Applicant>(`/applications/${applicationId}`, {
    method: "PATCH",
    body: { stage },
  });

export const updateJob = (jobId: string, payload: Partial<CreateJobInput> & { status?: string }) =>
  apiFetch<EmployerJob>(`/jobs/${jobId}`, {
    method: "PATCH",
    body: payload as any,
  });
