import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "./use-lenis";

export function useHighlightSection() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    // wait a moment for rendering and framer-motion transition
    const timeout = setTimeout(() => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          if (lenis) {
            lenis.scrollTo(element as HTMLElement, { offset: -100 });
          } else {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          
          // Apply highlight effect
          element.classList.add("ring-2", "ring-primary", "ring-offset-4", "ring-offset-background", "shadow-[0_0_30px_rgba(var(--primary),0.3)]", "transition-all", "duration-1000");
          
          // Remove effect after a few seconds
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-offset-4", "ring-offset-background", "shadow-[0_0_30px_rgba(var(--primary),0.3)]");
          }, 3000);
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [pathname]);
}
