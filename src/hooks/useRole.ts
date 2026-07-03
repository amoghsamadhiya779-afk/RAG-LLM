import { useSession } from "@/features/auth/SessionProvider";
import type { Role } from "@/lib/api/types";

export function useRole(): Role {
  const { role } = useSession();
  return role ?? "seeker";
}

export function useIsRecruiter(): boolean {
  const role = useRole();
  return role === "employer" || role === "admin";
}

export function useIsAdmin(): boolean {
  return useRole() === "admin";
}

export function useIsGuest(): boolean {
  return useSession().isGuest;
}
