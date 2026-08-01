import { Link } from "@tanstack/react-router";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { useRef, type ComponentType } from "react";
import {
  Briefcase,
  FileText,
  Gauge,
  LayoutDashboard,
  Send,
  Bookmark,
  PlusSquare,
  Users,
  Sparkles,
  Settings,
} from "lucide-react";

type Item = {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

const ITEMS: Item[] = [
  { to: "/jobs", label: "Jobs", Icon: Briefcase },
  { to: "/dashboard/ats", label: "ATS Score", Icon: Gauge },
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/dashboard/applications", label: "Applications", Icon: Send },
  { to: "/saved", label: "Saved", Icon: Bookmark },
  { to: "/employer/jobs/new", label: "Post a job", Icon: PlusSquare },
  { to: "/employer", label: "Employer", Icon: Users },
  { to: "/features", label: "Features", Icon: Sparkles },
  { to: "/settings", label: "Settings", Icon: Settings },
];

const dockIn = { y: 24, opacity: 0 };
const dockShow = { y: 0, opacity: 1 };
const dockTransition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 };

function DockItem({
  item,
  mouseX,
  reduce,
}: {
  item: Item;
  mouseX: MotionValue<number>;
  reduce: boolean | null;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const distance = useTransform(mouseX, (x) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: 0,
    } as DOMRect;
    return x - rect.x - rect.width / 2;
  });
  const sizeSync = useTransform(distance, [-130, 0, 130], [1, 1.55, 1]);
  const scale = useSpring(sizeSync, { stiffness: 220, damping: 18, mass: 0.2 });
  const { Icon } = item;

  return (
    <Link
      to={item.to as never}
      aria-label={item.label}
      activeProps={{ className: "text-primary ring-1 ring-primary/40 bg-primary/10" }}
      className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-foreground/5 bg-foreground/[0.03] text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <motion.span
        ref={ref as never}
        style={reduce ? undefined : { scale }}
        className="pointer-events-none flex h-full w-full items-center justify-center"
      >
        <Icon className="h-5 w-5" />
      </motion.span>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md border border-border bg-background/90 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-foreground/80 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {item.label}
      </span>
    </Link>
  );
}

export function FloatingDock() {
  const reduce = useReducedMotion();
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.nav
      initial={dockIn}
      animate={dockShow}
      transition={dockTransition}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      aria-label="Primary"
      className="glass fixed left-1/2 bottom-5 z-40 hidden max-w-[94vw] -translate-x-1/2 items-end gap-2 overflow-x-auto rounded-full border border-foreground/10 bg-background/60 px-3 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden"
    >
      {ITEMS.map((item) => (
        <DockItem key={item.to} item={item} mouseX={mouseX} reduce={reduce} />
      ))}
    </motion.nav>
  );
}

/** Bottom-docked mobile variant — no hover magnify, thumb-reach placement. */
export function FloatingDockMobile() {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.nav
      initial={dockIn}
      animate={dockShow}
      transition={dockTransition}
      aria-label="Primary"
      className="glass fixed inset-x-3 bottom-3 z-50 flex max-w-full items-end gap-2 overflow-x-auto rounded-2xl border border-foreground/10 bg-background/70 px-3 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      {ITEMS.map((item) => (
        <DockItem key={item.to} item={item} mouseX={mouseX} reduce={true} />
      ))}
    </motion.nav>
  );
}
