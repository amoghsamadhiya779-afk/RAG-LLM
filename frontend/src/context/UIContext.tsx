"use client";
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";

export type ViewType = "chat" | "matcher" | "board";

interface UIContextType {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarExpanded, setIsSidebarExpandedState] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [isSettingsOpen, setIsSettingsOpenState] = useState(false);
  const [activeView, setActiveViewState] = useState<ViewType>("board");

  const setIsSidebarExpanded = useCallback((expanded: boolean) => setIsSidebarExpandedState(expanded), []);
  const setIsSettingsOpen = useCallback((open: boolean) => setIsSettingsOpenState(open), []);
  const setActiveView = useCallback((view: ViewType) => setActiveViewState(view), []);

  const value = useMemo(
    () => ({
      isSidebarExpanded,
      setIsSidebarExpanded,
      isSettingsOpen,
      setIsSettingsOpen,
      activeView,
      setActiveView,
    }),
    [isSidebarExpanded, setIsSidebarExpanded, isSettingsOpen, setIsSettingsOpen, activeView, setActiveView]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within a UIProvider");
  return context;
};
