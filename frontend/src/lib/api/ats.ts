import { apiFetch } from "./client";
import type { AtsScore } from "./types";

// The deterministic score now returns immediately (ai_status: "pending");
// Gemini enrichment happens in the background and is polled via getAtsScore.
export const scoreResume = (payload: {
  resume_id: string;
  job_id?: string;
  jd_text?: string;
}) => apiFetch<AtsScore>("/ats/score", { method: "POST", body: payload, timeout: 20000 });

export const getAtsScore = (id: string) => apiFetch<AtsScore>(`/ats/${id}`);
