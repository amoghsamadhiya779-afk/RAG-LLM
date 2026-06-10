"use client";

import React, { ReactNode } from "react";
import { ChatProvider } from "@/context/ChatContext";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return <ChatProvider>{children}</ChatProvider>;
};
