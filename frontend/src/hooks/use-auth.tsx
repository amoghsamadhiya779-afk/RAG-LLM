import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/services/api";
import type { AuthSession, Role } from "@/types";

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  signIn: (input: { email: string; password: string }) => Promise<AuthSession>;
  signUp: (input: { email: string; password: string; role: Role; fullName: string }) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await api.auth.me();
    setSession(s);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.auth.me().then((s) => { if (!cancelled) { setSession(s); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    refresh,
    signIn: async (input) => {
      const s = await api.auth.signIn(input);
      setSession(s);
      return s;
    },
    signUp: async (input) => {
      const s = await api.auth.signUp(input);
      setSession(s);
      return s;
    },
    signOut: async () => {
      await api.auth.signOut();
      setSession(null);
    },
  }), [session, loading, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/** Synchronous session reader for route guards (reads localStorage). */
export function readMockSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("jOBiON:session:v1");
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}
