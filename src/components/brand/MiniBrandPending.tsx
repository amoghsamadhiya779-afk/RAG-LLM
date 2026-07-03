import { motion } from "framer-motion";
import { JobionMark } from "@/components/brand/JobionLogo";

const pulse = {
  opacity: [0.4, 1, 0.4],
  scale: [0.96, 1, 0.96],
};

const pulseTransition = { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const };

export function MiniBrandPending() {
  return (
    <div className="grid min-h-[60vh] w-full place-items-center">
      <motion.div animate={pulse} transition={pulseTransition}>
        <JobionMark className="h-14 w-14 rounded-3xl" />
      </motion.div>
    </div>
  );
}

export default MiniBrandPending;
