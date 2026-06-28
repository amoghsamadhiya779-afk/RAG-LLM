"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/ChatContext";
import { useUI } from "@/context/UIContext";
import { Logo } from "./Logo";
import {
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Target,
} from "lucide-react";

export const Sidebar = () => {
  const {
    setCurrentSessionId,
    createNewChat,
  } = useChat();

  const {
    isSidebarExpanded,
    setIsSidebarExpanded,
    setIsSettingsOpen,
    activeView,
    setActiveView,
  } = useUI();

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      <div className="md:hidden">
        <AnimatePresence>
          {isSidebarExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarExpanded(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
          )}
        </AnimatePresence>
      </div>

      <motion.aside
        initial={false}
        animate={{
          width: isSidebarExpanded ? 280 : 72,
          x: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 28,
        }}
        className={`fixed md:relative top-0 bottom-0 left-0 z-40 flex flex-col h-full overflow-hidden border-r border-[var(--color-border)] transition-colors duration-300 glass-panel bg-[var(--color-surface)]/45 text-[var(--color-text-primary)]
          ${isSidebarExpanded ? "p-6" : "p-3"}
          ${isSidebarExpanded ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Brand / Logo Area */}
        <div className="flex items-center justify-between mb-6 h-8">
          <AnimatePresence mode="wait">
            {isSidebarExpanded ? (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 font-bold text-sm tracking-tight select-none shrink-0"
              >
                <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] text-white flex items-center justify-center font-bold">R</div>
                <span className="font-bold text-[var(--color-text-primary)]">RagAI SaaS</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">PRO</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto"
              >
                <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] text-white flex items-center justify-center font-bold">R</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle sidebar button (Desktop only) */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/20 hover:bg-[var(--color-border)] transition-all duration-200 cursor-pointer"
          >
            {isSidebarExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* New Chat Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={createNewChat}
          className={`flex items-center gap-3 w-full p-3 mb-6 rounded-xl border text-xs font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer justify-center
            bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] border-[var(--color-accent)] text-[var(--color-bg)] shadow-[0_4px_14px_var(--color-accent)]/20
            ${!isSidebarExpanded && "p-2.5"}
          `}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {isSidebarExpanded && <span>New Chat</span>}
        </motion.button>

        {/* View Navigation */}
        <div className="space-y-1.5 mb-6">

          <motion.button
            whileHover={{ x: isSidebarExpanded ? 4 : 0, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveView("board")}
            className={`group flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold cursor-pointer transition-all duration-200 border
              ${
                activeView === "board"
                  ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-accent)]/30 shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
                  : "text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-surface)]/60 hover:text-[var(--color-text-primary)]"
              }
            `}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Briefcase className={`w-4 h-4 shrink-0 ${activeView === "board" ? "text-[var(--color-accent)]" : "opacity-70"}`} />
              {isSidebarExpanded && <span>Job Board</span>}
            </div>
          </motion.button>
          
          <motion.button
            whileHover={{ x: isSidebarExpanded ? 4 : 0, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveView("matcher")}
            className={`group flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold cursor-pointer transition-all duration-200 border
              ${
                activeView === "matcher"
                  ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-accent)]/30 shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
                  : "text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-surface)]/60 hover:text-[var(--color-text-primary)]"
              }
            `}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Target className={`w-4 h-4 shrink-0 ${activeView === "matcher" ? "text-[var(--color-accent)]" : "opacity-70"}`} />
              {isSidebarExpanded && <span>Role Matcher</span>}
            </div>
          </motion.button>
        </div>

        {/* Bottom Menu Navigation */}
        <div className="mt-auto pt-4 border-t border-[var(--color-border)] space-y-1.5">
          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer
              hover:bg-[var(--color-surface)]/60 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
              ${!isSidebarExpanded && "justify-center"}
            `}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {isSidebarExpanded && <span>Playground Settings</span>}
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
};
