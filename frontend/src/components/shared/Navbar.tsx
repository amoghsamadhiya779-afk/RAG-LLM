"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Navbar() {
  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-7xl relative h-16 flex items-center justify-between px-6 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm">
        
        {/* Logo */}
        <motion.div className="relative z-10 flex-shrink-0">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-[var(--color-primary-600)] to-[#f5576c] bg-clip-text text-transparent"
          >
            Drew.
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="relative z-10 hidden md:flex gap-8">
          <motion.a
            href="#workspace"
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group"
            whileHover={{ scale: 1.05 }}
          >
            Workspace
          </motion.a>
          <motion.a
            href="#insights"
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium relative group"
            whileHover={{ scale: 1.05 }}
          >
            Insights
          </motion.a>
        </div>

        {/* CTA Button */}
        <motion.button
          className="relative z-10 px-6 py-2 rounded-full bg-gradient-to-r from-[var(--color-primary-500)] to-[#f5576c] text-white font-semibold shadow-lg hover:shadow-xl transition-all border border-white/20"
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
