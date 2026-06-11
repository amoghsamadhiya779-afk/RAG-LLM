"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/ChatContext";
import { X, Sun, Moon, Sliders, Settings2 } from "lucide-react";

export const SettingsPanel = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    temperature,
    setTemperature,
    topK,
    setTopK,
    topP,
    setTopP,
    maxTokens,
    setMaxTokens,
    theme,
    setTheme,
  } = useChat();

  const isDark = theme === "dark";

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsOpen(false)}
            className="fixed inset-0 bg-black/70 z-50 pointer-events-auto backdrop-blur-[2px]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-4 right-4 bottom-4 w-[calc(100vw-32px)] sm:w-[380px] z-50 rounded-2xl flex flex-col overflow-hidden pointer-events-auto
              glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.4)] border transition-colors duration-300
              ${
                isDark
                  ? "bg-dark-surface/75 border-dark-border text-dark-text-primary"
                  : "bg-light-surface/75 border-light-border text-light-text-primary"
              }
            `}
          >
            {/* Header */}
            <div className={`p-5 flex items-center justify-between border-b ${isDark ? "border-dark-border" : "border-light-border"}`}>
              <div className="flex items-center gap-2">
                <Settings2 className={`w-4.5 h-4.5 ${isDark ? "text-dark-accent" : "text-light-accent"}`} />
                <h2 className="font-semibold text-sm uppercase tracking-wider">Playground Options</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSettingsOpen(false)}
                className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer
                  ${
                    isDark
                      ? "border-dark-border hover:bg-white/8 text-slate-400 hover:text-white"
                      : "border-light-border hover:bg-black/5 text-slate-500 hover:text-black"
                  }
                `}
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              {/* Theme Settings Toggle Group */}
              <div className="space-y-2.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Interface Appearance
                </label>
                <div className={`flex p-1 rounded-xl border ${isDark ? "bg-dark-bg/60 border-dark-border" : "bg-light-bg border-light-border"}`}>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200
                      ${
                        isDark
                          ? "bg-dark-elevated text-white shadow-sm border border-white/5"
                          : "text-slate-500 hover:text-[#0F172A]"
                      }
                    `}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200
                      ${
                        !isDark
                          ? "bg-white text-light-accent shadow-sm border border-light-border"
                          : "text-[#94A3B8] hover:text-white"
                      }
                    `}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Temperature Slider with Pill Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Temperature ({temperature.toFixed(1)})
                  </label>
                  <span className={`text-[10px] font-semibold tracking-wide uppercase ${isDark ? "text-dark-accent" : "text-light-accent"}`}>
                    {temperature <= 0.3 ? "Deterministic" : temperature >= 0.8 ? "Creative" : "Balanced"}
                  </span>
                </div>
                
                {/* Custom Slider */}
                <input
                  type="range"
                  min="0.0"
                  max="1.2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-dark-accent
                    ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                />

                {/* Pill selection options */}
                <div className="flex gap-1.5">
                  {[0.2, 0.5, 0.7, 1.0].map((val) => {
                    const isSelected = Math.abs(temperature - val) < 0.05;
                    return (
                      <motion.button
                        key={val}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setTemperature(val)}
                        className={`flex-1 text-[10px] font-mono py-1.5 rounded-lg border text-center transition-all duration-200 cursor-pointer
                          ${
                            isSelected
                              ? isDark
                                ? "bg-dark-accent/20 border-dark-accent text-white"
                                : "bg-light-accent/10 border-light-accent text-light-accent font-semibold"
                              : isDark
                              ? "bg-dark-bg/40 border-dark-border text-slate-400 hover:text-white"
                              : "bg-light-bg border-light-border text-slate-500 hover:text-black"
                          }
                        `}
                      >
                        {val.toFixed(1)}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Max Tokens pills */}
              <div className="space-y-2.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Max Output Length
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[512, 1024, 2048, 4096].map((tokens) => {
                    const isSelected = maxTokens === tokens;
                    return (
                      <motion.button
                        key={tokens}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMaxTokens(tokens)}
                        className={`text-[10px] font-mono py-2 rounded-lg border text-center transition-all duration-200 cursor-pointer
                          ${
                            isSelected
                              ? isDark
                                ? "bg-dark-accent/20 border-dark-accent text-white"
                                : "bg-light-accent/10 border-light-accent text-light-accent font-semibold"
                              : isDark
                              ? "bg-dark-bg/40 border-dark-border text-slate-400 hover:text-white"
                              : "bg-light-bg border-light-border text-slate-500 hover:text-black"
                          }
                        `}
                      >
                        {tokens}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Top-P Selectors */}
              <div className="space-y-2.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Top-P (Nucleus Sampling)
                </label>
                <div className="flex gap-1.5">
                  {[0.1, 0.5, 0.9, 1.0].map((val) => {
                    const isSelected = Math.abs(topP - val) < 0.05;
                    return (
                      <motion.button
                        key={val}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setTopP(val)}
                        className={`flex-1 text-[10px] font-mono py-1.5 rounded-lg border text-center transition-all duration-200 cursor-pointer
                          ${
                            isSelected
                              ? isDark
                                ? "bg-dark-accent/20 border-dark-accent text-white"
                                : "bg-light-accent/10 border-light-accent text-light-accent font-semibold"
                              : isDark
                              ? "bg-dark-bg/40 border-dark-border text-slate-400 hover:text-white"
                              : "bg-light-bg border-light-border text-slate-500 hover:text-black"
                          }
                        `}
                      >
                        {val.toFixed(1)}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Top-K Selectors */}
              <div className="space-y-2.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Top-K Filter
                </label>
                <div className="flex gap-1.5">
                  {[10, 40, 80, 100].map((val) => {
                    const isSelected = topK === val;
                    return (
                      <motion.button
                        key={val}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setTopK(val)}
                        className={`flex-1 text-[10px] font-mono py-1.5 rounded-lg border text-center transition-all duration-200 cursor-pointer
                          ${
                            isSelected
                              ? isDark
                                ? "bg-dark-accent/20 border-dark-accent text-white"
                                : "bg-light-accent/10 border-light-accent text-light-accent font-semibold"
                              : isDark
                              ? "bg-dark-bg/40 border-dark-border text-slate-400 hover:text-white"
                              : "bg-light-bg border-light-border text-slate-500 hover:text-black"
                          }
                        `}
                      >
                        {val}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Summary */}
            <div className={`p-5 mt-auto border-t text-[10px] font-mono flex items-center gap-2
              ${isDark ? "border-dark-border text-slate-500" : "border-light-border text-slate-400"}`}>
              <Sliders className="w-3.5 h-3.5" />
              <span>Context metrics loaded instantly</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
