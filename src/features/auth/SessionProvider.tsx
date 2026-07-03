import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/api/me";
import { migrateVisitor } from "@/lib/api/me-migrate";
import { readGuestSnapshot, clearGuestStore } from "@/lib/guest-store";
import type { Me, Role } from "@/lib/api/types";

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  me: Me | null;
  role: Role | null;
  visitorId: string;
  isGuest: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const DEVICE_KEY = "jobion.device_id";

function readDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_KEY, id);
  return id;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [deviceId] = useState<string>(readDeviceId);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const queryClient = useQueryClient();
  const prevVisitorRef = useRef<{ id: string; isAnon: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        setSession(data.session);
        prevVisitorRef.current = {
          id: data.session.user.id,
          isAnon: !!data.session.user.is_anonymous,
        };
        setIsLoadingSession(false);
        return;
      }
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (!mounted) return;
      if (error) {
        setSession(null);
      } else {
        setSession(anon.session);
        if (anon.session) {
          prevVisitorRef.current = { id: anon.session.user.id, isAnon: true };
        }
      }
      setIsLoadingSession(false);
    }

    void bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // Only react to identity transitions — ignore TOKEN_REFRESHED/INITIAL_SESSION.
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }
      setSession(s);

      const prev = prevVisitorRef.current;
      const nextUser = s?.user ?? null;

      // Detect anon → identified migration.
      if (
        event === "SIGNED_IN" &&
        nextUser &&
        !nextUser.is_anonymous &&
        prev &&
        prev.isAnon &&
        prev.id !== nextUser.id
      ) {
        void (async () => {
          try {
            const snapshot = readGuestSnapshot();
            await migrateVisitor({
              from_visitor_id: prev.id,
              to_user_id: nextUser.id,
              snapshot,
            });
            clearGuestStore();
            queryClient.invalidateQueries();
            toast.success("Welcome — your saved items were moved to your account.");
          } catch {
            toast.error("Couldn't migrate your guest data. Please try again.");
          }
        })();
      } else if (event === "SIGNED_OUT") {
        // Cache belonged to previous identity; drop it. Bootstrap will mint a new anon.
        queryClient.clear();
        prevVisitorRef.current = null;
        void supabase.auth.signInAnonymously().then(({ data: anon }) => {
          if (anon.session) {
            setSession(anon.session);
            prevVisitorRef.current = { id: anon.session.user.id, isAnon: true };
          }
        });
      }

      if (nextUser) {
        prevVisitorRef.current = { id: nextUser.id, isAnon: !!nextUser.is_anonymous };
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const visitorId = session?.user.id ?? deviceId;
  const isGuest = !session?.user || !!session.user.is_anonymous;

  const meQuery = useQuery({
    queryKey: ["me", visitorId],
    queryFn: getMe,
    staleTime: 60_000,
    retry: 1,
    enabled: !isGuest,
  });

  // Prefer role from app_metadata when signed-in; fallback to /me payload.
  const metadataRole = (session?.user?.app_metadata?.role as Role | undefined) ?? null;
  const role: Role | null = isGuest
    ? "seeker"
    : metadataRole ?? meQuery.data?.role ?? "seeker";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }

  const value: SessionContextValue = {
    session,
    user: session?.user ?? null,
    me: meQuery.data ?? null,
    role,
    visitorId,
    isGuest,
    isLoading: isLoadingSession || (!isGuest && meQuery.isLoading),
    signOut,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
