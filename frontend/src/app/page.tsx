"use client";

import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ParticleBackground } from "@/components/ParticleBackground";
import { useChat } from "@/context/ChatContext";

import { ResumeMatcher } from "@/components/ResumeMatcher";
import { JobBoard } from "@/components/JobBoard";

export default function Home() {
  const { activeView } = useChat();

  return (
    <main
      className="relative flex w-screen h-screen overflow-hidden transition-colors duration-300 select-none bg-[var(--color-bg)] text-[var(--color-text-primary)]"
    >
      {/* Cinematic Starfield Canvas Layer */}
      <ParticleBackground />

      <div className="relative z-10 flex w-full h-full overflow-hidden">
        {/* Left Sidebar Menu */}
        <Sidebar />

        {/* Central Content Area */}
        <section className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {activeView === "matcher" && <ResumeMatcher />}
          {activeView === "board" && <JobBoard />}
        </section>

        {/* Right Settings panel parameters */}
        <SettingsPanel />
      </div>
    </main>
  );
}
