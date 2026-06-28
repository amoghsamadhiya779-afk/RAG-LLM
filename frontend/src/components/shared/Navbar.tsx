"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// NAMING RULE: Always use "Job Matching" and "Resume Insights" for the two main routes (nav/tab/headings). Do not deviate.
export function Navbar() {
  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-7xl relative h-16 flex items-center justify-between px-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
        
        {/* Logo */}
        <motion.div className="relative z-10 flex-shrink-0">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-md"
          >
            Drew.
          </Link>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          className="relative z-10 px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all border border-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Get Started
        </motion.button>
      </div>
    </motion.nav>
  );
}
