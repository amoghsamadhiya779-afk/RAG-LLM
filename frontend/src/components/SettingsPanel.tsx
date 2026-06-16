"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/ChatContext";
import { useTheme } from "@/components/ThemeProvider";
import { X, Sun, Moon, Sliders, Settings2, Palette } from "lucide-react";

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
  } = useChat();

  const { baseTheme, setBaseTheme, accentColor, setAccentColor } = useTheme();

  const isDark = baseTheme === "dark";

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
              glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-colors duration-300
            `}
          >
            {/* Header */}
            <div className={`p-5 flex items-center justify-between border-b border-border/50`}>
              <div className="flex items-center gap-2">
                <Settings2 className="w-4.5 h-4.5 text-[var(--color-accent)]" />
                <h2 className="font-semibold text-sm uppercase tracking-wider text-[var(--color-text-primary)]">Playground Options</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSettingsOpen(false)}
                className={`p-1.5 rounded-lg border border-border/50 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]`}
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              {/* OpenAI API Key Input */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  OpenAI API Key (Required for AI Features)
                </label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-border/50 bg-[var(--color-bg)]/50 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]/50 transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] font-mono"
                />
              </div>

              {/* Theme Settings Toggle Group */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Interface Appearance
                </label>
                <div className="flex p-1 rounded-xl border border-border/50 bg-[var(--color-bg)]/50">
                  <button
                    onClick={() => setBaseTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200
                      ${
                        isDark
                          ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm border border-border/50"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      }
                    `}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => setBaseTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200
                      ${
                        !isDark
                          ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm border border-border/50"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      }
                    `}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Accent Color
                </label>
                <div className="flex gap-2.5">
                  {(["green", "red", "blue", "orange", "grey"] as const).map((color) => {
                    const isSelected = accentColor === color;
                    const colorCodes = {
                      green: "#10B981",
                      red: "#EF4444",
                      blue: "#3B82F6",
                      orange: "#F59E0B",
                      grey: "#64748B",
                    };
                    return (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center`}
                        style={{
                          backgroundColor: colorCodes[color],
                          borderColor: isSelected ? "var(--color-text-primary)" : "transparent",
                          transform: isSelected ? "scale(1.1)" : "scale(1)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Temperature Slider with Pill Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Temperature ({temperature.toFixed(1)})
                  </label>
                  <span className="text-[10px] font-semibold tracking-wide uppercase text-[var(--color-accent)]">
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
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--color-border)]"
                  style={{ accentColor: "var(--color-accent)" }}
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
                              ? "bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-text-primary)]"
                              : "bg-[var(--color-bg)] border-border/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
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
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
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
                              ? "bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-text-primary)]"
                              : "bg-[var(--color-bg)] border-border/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
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
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
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
                              ? "bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-text-primary)]"
                              : "bg-[var(--color-bg)] border-border/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
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
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
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
                              ? "bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-text-primary)]"
                              : "bg-[var(--color-bg)] border-border/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
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
            <div className="p-5 mt-auto border-t border-border/50 text-[10px] font-mono flex items-center gap-2 text-[var(--color-text-muted)]">
              <Sliders className="w-3.5 h-3.5" />
              <span>Context metrics loaded instantly</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
