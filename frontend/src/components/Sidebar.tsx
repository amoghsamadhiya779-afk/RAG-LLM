"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/ChatContext";
import { Logo } from "./Logo";
import {
  Plus,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Briefcase,
  Target,
} from "lucide-react";

export const Sidebar = () => {
  const {
    isSidebarExpanded,
    setIsSidebarExpanded,
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewChat,
    deleteSession,
    setIsSettingsOpen,
    theme,
    activeView,
    setActiveView,
  } = useChat();

  const handleSessionSelect = (id: string) => {
    setCurrentSessionId(id);
  };

  const isDark = theme === "dark";

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
        className={`fixed md:relative top-0 bottom-0 left-0 z-40 flex flex-col h-full overflow-hidden border-r transition-colors duration-300 glass-panel
          ${
            isDark
              ? "bg-dark-surface/45 border-dark-border text-dark-text-primary"
              : "bg-light-surface/45 border-light-border text-light-text-primary"
          }
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
                <Logo className="w-5.5 h-5.5" />
                <span className="font-bold">AETHER RESUME RAG</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-semibold ${isDark ? "bg-[#111827]/80 text-[#818cf8]" : "bg-slate-100 text-indigo-755"}`}>v1.0</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto"
              >
                <Logo className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle sidebar button (Desktop only) */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={`hidden md:flex items-center justify-center p-1.5 rounded-lg border transition-all duration-200 cursor-pointer
              ${
                isDark
                  ? "border-dark-border bg-white/2 hover:bg-white/8"
                  : "border-light-border bg-black/1 hover:bg-black/5"
              }
            `}
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
            ${
              isDark
                ? "bg-dark-accent hover:bg-dark-accent-hover border-dark-accent text-dark-bg shadow-[0_4px_14px_rgba(129,140,248,0.25)]"
                : "bg-light-accent hover:bg-light-accent-hover border-light-accent text-white shadow-[0_4px_14px_rgba(79,70,229,0.2)]"
            }
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
                  ? isDark
                    ? "bg-dark-elevated/85 text-white border-dark-accent/30 shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
                    : "bg-white text-light-text-primary border-light-accent/20 shadow-[0_2px_10px_rgba(31,38,135,0.02)]"
                  : isDark
                  ? "text-[#CBD5E1] border-transparent hover:bg-dark-elevated/40 hover:text-white"
                  : "text-light-text-secondary border-transparent hover:bg-white/60 hover:text-light-text-primary"
              }
            `}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Briefcase className={`w-4 h-4 shrink-0 ${activeView === "board" ? (isDark ? "text-dark-accent" : "text-light-accent") : "opacity-70"}`} />
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
                  ? isDark
                    ? "bg-dark-elevated/85 text-white border-dark-accent/30 shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
                    : "bg-white text-light-text-primary border-light-accent/20 shadow-[0_2px_10px_rgba(31,38,135,0.02)]"
                  : isDark
                  ? "text-[#CBD5E1] border-transparent hover:bg-dark-elevated/40 hover:text-white"
                  : "text-light-text-secondary border-transparent hover:bg-white/60 hover:text-light-text-primary"
              }
            `}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Target className={`w-4 h-4 shrink-0 ${activeView === "matcher" ? (isDark ? "text-dark-accent" : "text-light-accent") : "opacity-70"}`} />
              {isSidebarExpanded && <span>Role Matcher</span>}
            </div>
          </motion.button>
        </div>

        {/* Bottom Menu Navigation */}
        <div className={`mt-auto pt-4 border-t space-y-1.5 ${isDark ? "border-dark-border" : "border-light-border"}`}>
          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer
              ${isDark ? "hover:bg-dark-elevated/40 text-dark-text-secondary hover:text-white" : "hover:bg-white/60 text-light-text-secondary hover:text-light-text-primary"}
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
