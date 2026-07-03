import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const INTRO_TOTAL_MS = 2600;
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-void"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-bone text-2xl font-display text-void">
              J
            </div>
            <h1 className="text-[2rem] font-ui text-bone tracking-tight">
              jOBiON
            </h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
