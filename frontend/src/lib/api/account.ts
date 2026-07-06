import { apiFetch } from "./client";
import type { Role } from "./types";

/**
 * Client stub for the become-recruiter endpoint.
 *
 * Contract (FastAPI):
 *   POST /me/role/recruiter
 *   Headers: Authorization: Bearer <jwt>, x-turnstile-token: <token?>
 *   Body: { }
 *   Response: { role: "recruiter" }  (server also updates app_metadata.role)
 *
 * Frontend NEVER writes app_metadata directly — that would be trivially
 * bypassable. The server is the sole grantor of roles. See G4 in the audit.
 */
export interface BecomeRecruiterResponse {
  role: Extract<Role, "employer">;
}

export async function becomeRecruiter(opts?: {
  turnstileToken?: string;
}): Promise<BecomeRecruiterResponse> {
  return apiFetch<BecomeRecruiterResponse>("/users/become-recruiter", {
    method: "POST",
    body: {},
    headers: opts?.turnstileToken
      ? { "x-turnstile-token": opts.turnstileToken }
      : undefined,
  });
}
