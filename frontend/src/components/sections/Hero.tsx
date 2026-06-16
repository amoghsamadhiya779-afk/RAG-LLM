"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";
import { ArrowDown } from "lucide-react";

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.8, // Wait for logo reveal
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-10">
      <motion.div
        className="relative z-10 max-w-4xl mx-auto text-center px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <GlassCard className="inline-block mb-8 px-6 py-2 rounded-full clay-glass" variant="glass">
            <p className="text-sm font-semibold text-gray-300 tracking-wide">
              ✨ Experience Next-Gen Career Intelligence
            </p>
          </GlassCard>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight text-white drop-shadow-2xl"
          variants={itemVariants}
        >
          Shape Your Digital
          <br/>
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 bg-clip-text text-transparent">
            Professional Presence
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium"
          variants={itemVariants}
        >
          Experience the future of resume analysis with clay morphism and fluid glass effects. 
          Upload your resume below to instantly reveal deep ATS insights.
        </motion.p>

        {/* Scroll CTA */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mt-12"
        >
          <motion.a
            href="#workspace"
            className="flex items-center justify-center w-14 h-14 rounded-full clay-glass text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow"
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <ArrowDown className="w-6 h-6" />
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}
