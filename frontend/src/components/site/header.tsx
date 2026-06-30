import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = session?.profile.role;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <nav className="floating-nav flex h-10 items-center gap-1 px-1 py-1">
        <Link href="/" className="flex h-8 items-center gap-2 rounded-pill px-3 transition-colors hover:bg-iron">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-bone text-[9px] font-bold text-void">J</span>
          <span className="text-[15px] font-medium text-bone">jOBiON</span>
        </Link>
        
        <div className="mx-2 h-4 w-px bg-bone/10" />

        <div className="flex items-center gap-1">
          {pathname === "/" ? (
            <>
              <Link href="#features" className="flex h-8 items-center rounded-pill px-3 text-[15px] font-medium text-mist transition-colors hover:bg-iron hover:text-bone">Features</Link>
              <Link href="#use-cases" className="flex h-8 items-center rounded-pill px-3 text-[15px] font-medium text-mist transition-colors hover:bg-iron hover:text-bone">Use Cases</Link>
              <Link href="#pricing" className="flex h-8 items-center rounded-pill px-3 text-[15px] font-medium text-mist transition-colors hover:bg-iron hover:text-bone">Pricing</Link>
            </>
          ) : (
            <>
              <Link href="/jobs" className="flex h-8 items-center rounded-pill px-3 text-[15px] font-medium text-mist transition-colors hover:bg-iron hover:text-bone">Jobs</Link>
              <Link href="/companies" className="flex h-8 items-center rounded-pill px-3 text-[15px] font-medium text-mist transition-colors hover:bg-iron hover:text-bone">Companies</Link>
            </>
          )}

          {session ? (
            <>
              {role === "employer" && (
                <Link href="/dashboard" className="flex h-8 items-center rounded-pill px-3 text-[15px] font-medium text-mist transition-colors hover:bg-iron hover:text-bone">Dashboard</Link>
              )}
              <Link href="/ai-workspace" className="flex h-8 items-center rounded-pill px-3 text-[15px] font-medium text-mist transition-colors hover:bg-iron hover:text-bone">AI Workspace</Link>
              
              <div className="mx-2 h-4 w-px bg-bone/10" />
              
              <button
                onClick={async () => { await signOut(); router.push("/"); }}
                className="flex h-8 w-8 items-center justify-center rounded-pill text-mist transition-colors hover:bg-iron hover:text-bone"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="mx-2 h-4 w-px bg-bone/10" />
              <Link href="/auth" className="flex h-8 items-center rounded-pill bg-paper px-4 text-[15px] font-medium text-void transition-colors hover:bg-paper/90">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
