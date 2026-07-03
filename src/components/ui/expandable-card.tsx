"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const fadeHidden = { opacity: 0 };
const fadeShown = { opacity: 1 };
const iconTransition = { duration: 0.3 };
const plusToClose = { rotate: 45 };
const plusDefault = { rotate: 0 };

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    function listener(event: Event) {
      const target = event.target as Node | null;
      if (!ref.current || !target || ref.current.contains(target)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, active]);
}

export interface ExpandableCardRenderArgs {
  layoutIds: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  close: () => void;
}

export interface ExpandableCardProps {
  /** stable id — usually the entity id */
  id: string;
  /** collapsed tile — receives shared layoutIds so titles etc. can animate */
  collapsed: (args: ExpandableCardRenderArgs) => ReactNode;
  /** expanded overlay body */
  expanded: (args: ExpandableCardRenderArgs) => ReactNode;
  /** wrapper class for the collapsed shell (positioning only) */
  className?: string;
  /** max width of the expanded panel */
  expandedMaxWidthClass?: string;
}

export function ExpandableCard({
  id,
  collapsed,
  expanded,
  className,
  expandedMaxWidthClass = "max-w-[850px]",
}: ExpandableCardProps) {
  const uid = useId();
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const layoutIds = {
    card: `card-${id}-${uid}`,
    title: `title-${id}-${uid}`,
    description: `description-${id}-${uid}`,
    image: `image-${id}-${uid}`,
  };

  const close = () => setActive(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(false);
    }
    if (active) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  useOutsideClick(containerRef, () => setActive(false), active);

  const renderArgs: ExpandableCardRenderArgs = { layoutIds, close };
  // Framer's `layoutId` handles the shared-element transition. Under
  // reduced-motion we drop layoutId so it becomes a plain fade.
  const layoutProp = reduce ? {} : { layoutId: layoutIds.card };

  return (
    <>
      {/* Collapsed tile — click opens */}
      <motion.div
        {...layoutProp}
        onClick={() => setActive(true)}
        className={cn("cursor-pointer", className)}
      >
        {collapsed(renderArgs)}
      </motion.div>

      {/* Expanded overlay */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-[70] grid place-items-center p-4 sm:p-6">
            <motion.div
              initial={fadeHidden}
              animate={fadeShown}
              exit={fadeHidden}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={close}
              aria-hidden
            />
            <motion.div
              {...layoutProp}
              ref={containerRef}
              className={cn(
                "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-card/80 shadow-2xl backdrop-blur-xl sm:rounded-3xl",
                expandedMaxWidthClass,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <motion.svg
                  animate={plusToClose}
                  transition={iconTransition}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </motion.svg>
              </button>

              <motion.div
                initial={fadeHidden}
                animate={fadeShown}
                exit={fadeHidden}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
              >
                {expanded(renderArgs)}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Convenience export for consumers that want the "+" icon animation state */
export const expandableCardIconStates = { plusDefault, plusToClose, iconTransition };
