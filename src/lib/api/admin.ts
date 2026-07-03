import { apiFetch } from "./client";
import type { AdminUser, Job, Paginated, Role } from "./types";

export interface AdminMetrics {
  users: number;
  jobs: number;
  applications: number;
  pending_jobs: number;
}

export const adminListUsers = () => apiFetch<Paginated<AdminUser>>("/admin/users");
export const adminListJobs = () => apiFetch<Paginated<Job>>("/admin/jobs");
export const adminListPendingJobs = () =>
  apiFetch<Paginated<Job>>("/admin/jobs/pending");
export const adminMetrics = () => apiFetch<AdminMetrics>("/admin/metrics");

export const adminApproveJob = (id: string) =>
  apiFetch<Job>(`/admin/jobs/${id}/approve`, { method: "POST" });

export const adminRejectJob = (id: string, reason?: string) =>
  apiFetch<Job>(`/admin/jobs/${id}/reject`, {
    method: "POST",
    body: { reason: reason ?? null },
  });

export const adminUpdateUserRole = (id: string, role: Role) =>
  apiFetch<AdminUser>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });

export const adminDeleteUser = (id: string) =>
  apiFetch<{ ok: true }>(`/admin/users/${id}`, { method: "DELETE" });
