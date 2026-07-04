/**
 * Guest-mode daily quota tracker.
 * Counters are per-action, reset at UTC midnight, and stored client-side only.
 * Signed-in users are unlimited (server-side quotas take over via FastAPI).
 *
 * NOTE: This is UX-only. Real abuse controls MUST live in the backend
 * (per-IP + per-device rate limits, Turnstile verification, spend kill-switch).
 * See G1 in the audit — this file merely prevents accidental overuse and
 * surfaces the "Sign in for more" CTA before we spend the guest's budget.
 */

export type GuestAction = "resume_analyze" | "chat_message" | "ats_score" | "resume_upload";

const LIMITS: Record<GuestAction, number> = {
  resume_analyze: 2,
  chat_message: 10,
  ats_score: 3,
  resume_upload: 3,
};

const KEY = "jobion.guest.quota.v1";

interface QuotaShape {
  date: string; // YYYY-MM-DD (UTC)
  counts: Partial<Record<GuestAction, number>>;
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function read(): QuotaShape {
  if (typeof window === "undefined") return { date: utcDay(), counts: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { date: utcDay(), counts: {} };
    const parsed = JSON.parse(raw) as QuotaShape;
    if (parsed.date !== utcDay()) return { date: utcDay(), counts: {} };
    return parsed;
  } catch {
    return { date: utcDay(), counts: {} };
  }
}

function write(state: QuotaShape) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
}

export function limitFor(action: GuestAction): number {
  return LIMITS[action];
}

export function usedFor(action: GuestAction): number {
  return read().counts[action] ?? 0;
}

export function remainingFor(action: GuestAction): number {
  return Math.max(0, LIMITS[action] - usedFor(action));
}

export function canConsume(action: GuestAction): boolean {
  return remainingFor(action) > 0;
}

/** Increments the counter. Returns false if the quota was already exhausted. */
export function consume(action: GuestAction): boolean {
  const state = read();
  const current = state.counts[action] ?? 0;
  if (current >= LIMITS[action]) return false;
  state.counts[action] = current + 1;
  write(state);
  return true;
}

export function clearGuestQuota() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
