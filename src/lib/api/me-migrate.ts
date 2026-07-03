import { apiFetch } from "./client";
import { registerMock } from "./mocks/registry";
import type { GuestSnapshot } from "@/lib/guest-store";

export interface MigrateVisitorPayload extends Record<string, unknown> {
  from_visitor_id: string;
  to_user_id: string;
  snapshot: GuestSnapshot;
}

export interface MigrateVisitorResult {
  ok: true;
  merged: {
    saved_jobs: number;
    applications: number;
    ats_reports: number;
    resume: boolean;
  };
}

export const migrateVisitor = (payload: MigrateVisitorPayload) =>
  apiFetch<MigrateVisitorResult>("/me/migrate", {
    method: "POST",
    body: payload,
  });

// Mock: pretend the server accepted and merged everything.
registerMock("POST /me/migrate", ({ body }) => {
  const p = (body ?? {}) as MigrateVisitorPayload;
  const s = p.snapshot ?? {
    savedJobs: [],
    applications: [],
    resumeMeta: null,
    atsReports: [],
    chatHistory: [],
  };
  return {
    ok: true,
    merged: {
      saved_jobs: s.savedJobs.length,
      applications: s.applications.length,
      ats_reports: s.atsReports.length,
      resume: !!s.resumeMeta,
    },
  } satisfies MigrateVisitorResult;
});
