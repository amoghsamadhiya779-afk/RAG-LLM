import { useRouterState, Link } from "@tanstack/react-router";
import { LogOut, User as UserIcon, Briefcase, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import PillNav, { type PillNavItem } from "@/components/ui/pill-nav";
import { useSession } from "@/features/auth/SessionProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS: PillNavItem[] = [
  { label: "Jobs", href: "/jobs" },
  { label: "Resume", href: "/dashboard/resume" },
  { label: "ATS", href: "/dashboard/ats" },
  { label: "Saved", href: "/saved" },
  { label: "Employer", href: "/employer" },
  { label: "Features", href: "/features" },
];

function useActiveHref() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const match = NAV_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href;
}

export function Navbar() {
  const activeHref = useActiveHref();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isGuest, user, role, signOut } = useSession();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <header className="pointer-events-none fixed top-0 w-full z-40">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 pt-3">
        <div className="flex-1">
          <PillNav
            logo="/jobion-mark.svg"
            logoAlt="jOBiON"
            logoHref="/"
            logoText="jOBiON"
            items={NAV_ITEMS}
            activeHref={activeHref}
            baseColor={isDark ? "#000000" : "#ffffff"}
            pillColor={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
            pillTextColor={isDark ? "#FFFFFF" : "#000000"}
            hoveredPillTextColor={isDark ? "#FFFFFF" : "#000000"}
            initialLoadAnimation
          />
        </div>
        <div className="pointer-events-auto flex items-center gap-2 pt-1">
          {isGuest ? (
            <>
              <Link to="/login" search={{ redirect: pathname }}>
                <Button
                  size="sm"
                  className="h-9 rounded-full border border-foreground/10 bg-foreground/5 px-4 text-xs font-medium text-foreground hover:bg-foreground/10"
                  variant="ghost"
                >
                  Sign in
                </Button>
              </Link>
              <Link to="/signup" search={{ redirect: pathname }} className="hidden sm:inline-flex">
                <Button
                  size="sm"
                  className="h-9 rounded-full bg-foreground px-4 text-xs font-medium text-background hover:opacity-90"
                >
                  Sign up
                </Button>
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="grid h-9 w-9 place-items-center rounded-full border border-foreground/10 bg-foreground/5 text-xs font-medium text-foreground transition hover:bg-foreground/10"
                >
                  {(user?.email?.[0] ?? "U").toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email ?? "Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                {role === "employer" || role === "admin" ? (
                  <DropdownMenuItem asChild>
                    <Link to="/employer" className="cursor-pointer">
                      <Briefcase className="mr-2 h-4 w-4" /> Recruiter
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {role === "admin" ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void signOut()}
                  className="cursor-pointer text-rose-300 focus:text-rose-200"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
