import { apiFetch } from "./client";
import type { Applicant, ApplicantStage, EmployerJob, Job, Paginated } from "./types";


export interface CreateJobInput {
  title: string;
  company_name: string;
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

export const createJob = (input: CreateJobInput) =>
  apiFetch<EmployerJob>("/employer/jobs", {
    method: "POST",
    body: input as unknown as Record<string, unknown>,
  });

export const listMyJobs = () =>
  apiFetch<Paginated<EmployerJob>>("/employer/jobs");

export interface EmployerStats {
  total_jobs: number;
  live_jobs: number;
  total_views: number;
  total_applicants: number;
}

export const getEmployerStats = () =>
  apiFetch<EmployerStats>("/employer/stats");

export const listJobApplicants = (jobId: string) =>
  apiFetch<Paginated<Applicant>>(`/employer/jobs/${jobId}/applicants`);

export const updateApplicantStage = (applicationId: string, stage: ApplicantStage) =>
  apiFetch<Applicant>(`/employer/applicants/${applicationId}/stage`, {
    method: "PATCH",
    body: { stage },
  });
