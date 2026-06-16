"use client";

import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ParticleBackground } from "@/components/ParticleBackground";
import { CompanyMarquee } from "@/components/CompanyMarquee";
import { useChat } from "@/context/ChatContext";

import { ResumeMatcher } from "@/components/ResumeMatcher";
import { JobBoard } from "@/components/JobBoard";

export default function Home() {
  const { activeView } = useChat();

  return (
    <main
      className="relative flex w-screen h-screen overflow-hidden select-none bg-[var(--bg)] text-[var(--text-primary)]"
    >
      {/* CryptOwl Hero Background Gradients */}
      <div className="absolute inset-0 z-0 hero-bg-glow pointer-events-none" />
      
      {/* Cinematic Starfield Canvas Layer */}
      <ParticleBackground />

      <div className="relative z-10 flex w-full h-full overflow-hidden">
        {/* Left Sidebar Menu */}
        <Sidebar />

        {/* Central Content Area */}
        <section className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative">
          
          <div className="w-full relative z-0 mt-4 opacity-70">
             <CompanyMarquee />
          </div>

          <div className="flex-1 overflow-hidden relative z-10">
            {activeView === "matcher" && <ResumeMatcher />}
            {activeView === "board" && <JobBoard />}
          </div>
        </section>

        {/* Right Settings panel parameters */}
        <SettingsPanel />
      </div>
    </main>
  );
}
