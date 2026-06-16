"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function StartupSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500); // Glow appears
    const t2 = setTimeout(() => setPhase(2), 1500); // Liquid Clay Morph
    const t3 = setTimeout(() => setPhase(3), 2800); // Neural Network Expand
    const t4 = setTimeout(() => {
      setPhase(4);
      setTimeout(onComplete, 1000); // Dissolve into homepage
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Particles Background */}
          {phase >= 1 && (
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_50%)]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.5 }}
              transition={{ duration: 3, ease: "easeOut" }}
            />
          )}

          {/* DREW Logo */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, filter: "blur(20px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <h1
              className={`text-6xl md:text-8xl font-bold tracking-[0.2em] uppercase transition-all duration-1000 ${
                phase >= 2
                  ? "bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent blur-[1px]"
                  : "text-white"
              }`}
              style={{
                textShadow: phase >= 2 ? "0 0 40px rgba(168,85,247,0.4)" : "none",
              }}
            >
              Drew
            </h1>

            {/* Neural Network Expansion */}
            {phase >= 3 && (
              <motion.div
                className="absolute inset-0 -z-10 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.5, scale: [1, 2, 4] }}
                transition={{ duration: 1.5, ease: "easeIn" }}
              >
                <div className="w-[1px] h-[200vh] bg-white/20 rotate-45 absolute" />
                <div className="w-[1px] h-[200vh] bg-white/20 -rotate-45 absolute" />
                <div className="w-[200vw] h-[1px] bg-white/20 absolute" />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
