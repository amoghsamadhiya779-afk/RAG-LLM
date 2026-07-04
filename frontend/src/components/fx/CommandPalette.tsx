import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Briefcase, Home, Moon, Search, Sparkles, Sun, User } from "lucide-react";
import { listJobs } from "@/lib/api/jobs";
import { useTheme } from "@/components/theme/ThemeProvider";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { resolvedTheme, toggle } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const { data } = useQuery({
    queryKey: ["palette-jobs", debounced],
    queryFn: () => listJobs({ q: debounced || undefined, page_size: 6 }),
    enabled: open && debounced.length > 1,
    staleTime: 60_000,
  });

  const go = useCallback(
    (fn: () => void) => {
      setOpen(false);
      setTimeout(fn, 60);
    },
    [],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search jobs, pages, actions…"
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {data && data.items.length > 0 && (
          <>
            <CommandGroup heading="Jobs">
              {data.items.map((j) => (
                <CommandItem
                  key={j.id}
                  value={`${j.title} ${typeof j.company === "string" ? j.company : j.company?.name || "Unknown"} ${debounced}`}
                  onSelect={() =>
                    go(() => navigate({ to: "/jobs/$id", params: { id: j.id } }))
                  }
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  <span className="truncate">{j.title}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {typeof j.company === "string" ? j.company : j.company?.name || "Unknown"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Pages">
          <CommandItem value="home" onSelect={() => go(() => navigate({ to: "/" }))}>
            <Home className="mr-2 h-4 w-4" /> Home
          </CommandItem>
          <CommandItem value="jobs browse" onSelect={() => go(() => navigate({ to: "/jobs" }))}>
            <Search className="mr-2 h-4 w-4" /> Browse jobs
          </CommandItem>
          <CommandItem value="dashboard" onSelect={() => go(() => (window.location.href = "/dashboard"))}>
            <User className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem value="toggle theme dark light" onSelect={() => go(() => toggle())}>
            {resolvedTheme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle theme
          </CommandItem>
          <CommandItem
            value="analyze resume ats"
            onSelect={() => go(() => (window.location.href = "/resume"))}
          >
            <Sparkles className="mr-2 h-4 w-4" /> Analyze my resume
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
