"use client";

import { motion } from "framer-motion";

const blobVariants = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 360],
    borderRadius: ["30% 70% 70% 30%", "60% 40% 30% 70%", "30% 70% 70% 30%"],
  },
};

export function BlobBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--color-primary-50)]">
      {/* Primary Blob */}
      <motion.div
        className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full blur-[120px] opacity-60"
        style={{
          background: "linear-gradient(135deg, var(--color-primary-300) 0%, var(--color-primary-200) 100%)",
        }}
        variants={blobVariants}
        animate="animate"
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary Blob */}
      <motion.div
        className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full blur-[100px] opacity-50"
        style={{
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        }}
        variants={blobVariants}
        animate="animate"
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Tertiary Blob */}
      <motion.div
        className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full blur-3xl opacity-40"
        style={{
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        }}
        variants={blobVariants}
        animate="animate"
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Overlay for subtle mesh effect */}
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] mix-blend-overlay"></div>
    </div>
  );
}
