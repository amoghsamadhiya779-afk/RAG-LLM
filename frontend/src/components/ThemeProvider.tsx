"use client";

import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { ChatProvider } from "@/context/ChatContext";

export type BaseTheme = "light" | "dark";
export type AccentColor = "green" | "red" | "blue" | "orange" | "grey";

interface ThemeContextType {
  baseTheme: BaseTheme;
  setBaseTheme: (theme: BaseTheme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [baseTheme, setBaseTheme] = useState<BaseTheme>("dark");
  const [accentColor, setAccentColor] = useState<AccentColor>("green");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from local storage if available
    const savedBase = localStorage.getItem("baseTheme") as BaseTheme;
    const savedAccent = localStorage.getItem("accentColor") as AccentColor;
    if (savedBase) setBaseTheme(savedBase);
    if (savedAccent) setAccentColor(savedAccent);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("baseTheme", baseTheme);
    localStorage.setItem("accentColor", accentColor);
    
    // Apply classes to HTML
    const html = document.documentElement;
    
    // Base theme
    html.classList.remove("light", "dark");
    html.classList.add(baseTheme);
    
    // Accent color
    const classesToRemove = Array.from(html.classList).filter(cls => cls.startsWith("theme-"));
    classesToRemove.forEach(cls => html.classList.remove(cls));
    html.classList.add(`theme-${accentColor}`);
  }, [baseTheme, accentColor, mounted]);

  // Hide children until mounted to prevent hydration errors from class mismatches
  if (!mounted) return <div className="w-screen h-screen bg-[#09090b]"></div>;

  return (
    <ThemeContext.Provider value={{ baseTheme, setBaseTheme, accentColor, setAccentColor }}>
      <ChatProvider>{children}</ChatProvider>
    </ThemeContext.Provider>
  );
};
