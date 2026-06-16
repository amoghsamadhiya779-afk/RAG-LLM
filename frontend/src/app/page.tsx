"use client";

import React, { useState } from "react";
import { Hero } from "@/components/sections/Hero";
import { ResumeMatcher } from "@/components/ResumeMatcher";
import { JobBoard } from "@/components/JobBoard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CompanyMarquee } from "@/components/CompanyMarquee";
import { useChat } from "@/context/ChatContext";
import { GlassCard } from "@/components/shared/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import { StartupSequence } from "@/components/animations/StartupSequence";
import { BackdropEngine } from "@/components/canvas/BackdropEngine";

export default function Home() {
  const { activeView, setActiveView } = useChat();
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
          <BackdropEngine />

          {/* Content overlay */}
          <div className="relative z-10 w-full flex flex-col">
            {/* Hero Landing Section */}
            <Hero />

            {/* Workspace Section */}
            <section id="workspace" className="relative z-10 w-full max-w-7xl mx-auto px-4 pb-24">
              
              {/* Navigation Tabs & Settings Toggle */}
              <GlassCard className="flex items-center justify-between mb-8 p-4 clay-glass" variant="glass">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveView("matcher")}
                    className={`px-6 py-2 rounded-full transition-all font-semibold ${
                      activeView === "matcher" 
                        ? "bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" 
                        : "hover:bg-white/10 text-gray-400"
                    }`}
                  >
                    Resume Insights
                  </button>
                  <button
                    onClick={() => setActiveView("board")}
                    className={`px-6 py-2 rounded-full transition-all font-semibold ${
                      activeView === "board" 
                        ? "bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" 
                        : "hover:bg-white/10 text-gray-400"
                    }`}
                  >
                    Job Matching
                  </button>
                </div>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                  title="API Settings"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </GlassCard>

              {/* Settings Modal/Expand */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 overflow-hidden"
                  >
                    <GlassCard variant="clay" className="clay-glass p-6">
                      <SettingsPanel />
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content Area */}
              <div id="insights" className="relative z-10 w-full rounded-3xl overflow-hidden min-h-[600px] clay-glass p-6">
                {activeView === "matcher" && <ResumeMatcher />}
                {activeView === "board" && <JobBoard />}
              </div>
            </section>

            {/* Marquee Footer */}
            <section className="w-full relative z-0 py-10 opacity-60 pointer-events-none">
              <CompanyMarquee />
            </section>
          </div>
        </motion.div>
      )}
    </main>
  );
}
