"use client";

import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { Composer } from "@/components/Composer";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ParticleBackground } from "@/components/ParticleBackground";
import { AntigravityCursor } from "@/components/AntigravityCursor";
import { useChat } from "@/context/ChatContext";

export default function Home() {
  const { theme } = useChat();
  const isDark = theme === "dark";

  return (
    <main
      className={`relative flex w-screen h-screen overflow-hidden transition-colors duration-300 select-none
        ${isDark ? "bg-dark-bg text-dark-text-primary" : "bg-light-bg text-light-text-primary"}`}
    >
      {/* Cinematic Starfield Canvas Layer */}
      <ParticleBackground />

      {/* Ultra-Smooth Spring Inertia Cursor */}
      <AntigravityCursor />

      <div className="relative z-10 flex w-full h-full overflow-hidden">
        {/* Left Sidebar Menu */}
        <Sidebar />

        {/* Conversation Workspace Workspace */}
        <section className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <ChatWindow />
          <Composer />
        </section>

        {/* Right Settings panel parameters */}
        <SettingsPanel />
      </div>
    </main>
  );
}
