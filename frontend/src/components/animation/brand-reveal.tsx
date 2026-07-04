import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { AnimatedJobionMark } from "@/components/brand/AnimatedJobionMark";

const INTRO_TOTAL_MS = 2600;
const HERO_ENTRANCE_DELAY_S = 2.2;
const SEEN_KEY = "jobion:intro-seen";

export function BrandReveal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem(SEEN_KEY);
    if (!hasSeen) {
      setShow(true);
      sessionStorage.setItem(SEEN_KEY, "true");
      
      const timer = setTimeout(() => {
        setShow(false);
      }, INTRO_TOTAL_MS);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B0C0E]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatedJobionMark className="w-20 h-20 mb-6" />
          
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          >
            <h1 className="text-[2rem] font-ui text-foreground tracking-tight font-bold">
              jOBiON
            </h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
