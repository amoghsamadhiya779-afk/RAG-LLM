"use client";

import React, { useState } from "react";
import { Hero } from "@/components/sections/Hero";
import { ResumeMatcher } from "@/components/ResumeMatcher";
import { JobBoard } from "@/components/JobBoard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CompanyMarquee } from "@/components/CompanyMarquee";
import { useUI } from "@/context/UIContext";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import { StartupSequence } from "@/components/animations/StartupSequence";
import { BackdropEngine } from "@/components/canvas/BackdropEngine";

export default function Home() {
  const { activeView, setActiveView } = useUI();
  const [showSettings, setShowSettings] = useState(false);
  const [booted, setBooted] = useState(false);

  return (
    <main className="relative flex flex-col w-full min-h-screen font-sans">
      {!booted && <StartupSequence onComplete={() => setBooted(true)} />}
      
      {booted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative w-full flex flex-col items-center"
        >
          <div className="relative min-h-screen w-full overflow-hidden">
            <BackdropEngine />
            <div className="relative z-10 w-full flex flex-col">
              <Hero />
            </div>
          </div>

          {/* Workspace Section */}
          <section id="workspace" className="relative z-10 w-full bg-gradient-to-b from-transparent via-[#050505] to-[#050505] px-4 sm:px-8 md:px-12 lg:px-24 pb-24 pt-32 -mt-16">
            <div className="max-w-7xl mx-auto w-full">
              
              {/* Navigation Tabs & Settings Toggle */}
              <GlassCard className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 p-3 sm:p-4 clay-glass gap-4" variant="glass">
                <div className="flex space-x-2 w-full sm:w-auto overflow-x-auto scrollbar-none pb-2 sm:pb-0">
                  <button
                    onClick={() => setActiveView("matcher")}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-full transition-all duration-300 font-semibold text-sm ${
                      activeView === "matcher" 
                        ? "bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                        : "hover:bg-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    Job Matching
                  </button>
                  <button
                    onClick={() => setActiveView("board")}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-full transition-all duration-300 font-semibold text-sm ${
                      activeView === "board" 
                        ? "bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                        : "hover:bg-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    Resume Insights
                  </button>
                </div>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors self-end sm:self-auto"
                  title="API Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </GlassCard>

              {/* Settings Modal/Expand */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-10 overflow-hidden"
                  >
                    <GlassCard variant="clay" className="clay-glass p-6 md:p-8">
                      <SettingsPanel />
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content Area */}
              <div id="insights" className="relative z-10 w-full rounded-3xl overflow-hidden min-h-[600px] clay-glass p-4 sm:p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {activeView === "matcher" && (
                    <motion.div
                      key="matcher"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                    >
                      <ResumeMatcher />
                    </motion.div>
                  )}
                  {activeView === "board" && (
                    <motion.div
                      key="board"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                    >
                      <JobBoard />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

            {/* Marquee Footer */}
            <section className="w-full relative z-0 py-10 opacity-60 pointer-events-none">
              <CompanyMarquee />
            </section>
        </motion.div>
      )}
    </main>
  );
}
