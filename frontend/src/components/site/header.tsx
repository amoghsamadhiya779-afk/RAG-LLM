"use client";

import { Link } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { useLenis } from "@/hooks/use-lenis";

export function SiteHeader() {
  const pathname = useLocation().pathname;
  const lenis = useLenis();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    // If we're on the homepage, prevent default router navigation and smooth scroll using Lenis
    if (pathname === "/") {
      e.preventDefault();
      const targetElement = document.querySelector(hash);
      if (targetElement) {
        if (lenis) {
          lenis.scrollTo(targetElement as HTMLElement, { offset: -80 });
        } else {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // Update URL hash without causing a page jump
        window.history.pushState(null, "", hash);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[var(--z-sticky)] border-b border-[rgba(255,255,255,0.08)] bg-background/70 backdrop-blur-md backdrop-saturate-150">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-colors hover:opacity-80">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-bone text-[11px] font-display text-void">J</span>
          <span className="text-[18px] font-ui text-bone tracking-tight">jOBiON</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <a 
            href="#features" 
            onClick={(e) => handleAnchorClick(e, "#features")}
            className="text-[14px] font-ui text-mist transition-colors hover:text-bone"
          >
            Features
          </a>
          <a 
            href="#jobs" 
            onClick={(e) => handleAnchorClick(e, "#jobs")}
            className="text-[14px] font-ui text-mist transition-colors hover:text-bone"
          >
            Jobs
          </a>
          <a 
            href="#companies" 
            onClick={(e) => handleAnchorClick(e, "#companies")}
            className="text-[14px] font-ui text-mist transition-colors hover:text-bone"
          >
            Companies
          </a>
          <a 
            href="#ai-workspace" 
            onClick={(e) => handleAnchorClick(e, "#ai-workspace")}
            className="text-[14px] font-ui text-mist transition-colors hover:text-bone"
          >
            AI Workspace
          </a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="inline-flex h-9 items-center justify-center rounded-pill bg-paper px-4 text-[14px] font-ui text-void transition-colors hover:bg-paper/90">
            Post a Job
          </Link>
        </div>
      </div>
    </header>
  );
}
