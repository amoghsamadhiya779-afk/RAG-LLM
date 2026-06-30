import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-bone/10 bg-void/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-colors hover:opacity-80">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-bone text-[11px] font-bold text-void">J</span>
          <span className="text-[18px] font-medium text-bone tracking-tight">jOBiON</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          {pathname === "/" ? (
            <>
              <Link href="#features" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Features</Link>
              <Link href="#use-cases" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Use Cases</Link>
              <Link href="#pricing" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Pricing</Link>
            </>
          ) : (
            <>
              <Link href="/jobs" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Jobs</Link>
              <Link href="/companies" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Companies</Link>
            </>
          )}

          <Link href="/dashboard" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Dashboard</Link>
          <Link href="/ai-workspace" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">AI Workspace</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link href="/post" className="inline-flex h-9 items-center justify-center rounded-pill bg-paper px-4 text-[14px] font-medium text-void transition-colors hover:bg-paper/90">
            Post a Job
          </Link>
        </div>
      </div>
    </header>
  );
}
