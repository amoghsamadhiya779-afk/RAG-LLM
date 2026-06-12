"use client";

import React, { useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { MessageBubble } from "./MessageBubble";
import { Logo } from "./Logo";
import { motion } from "framer-motion";
import { Terminal, BookOpen, Menu } from "lucide-react";

export const ChatWindow = () => {
  const {
    messages,
    isStreaming,
    streamingText,
    sendMessage,
    isSidebarExpanded,
    setIsSidebarExpanded,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, isStreaming]);

  const handleSuggestionClick = async (suggestion: string) => {
    await sendMessage(suggestion);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden p-4 flex items-center justify-between border-b shrink-0 transition-colors duration-300 z-10 glass-panel bg-[var(--color-surface)]/80 border-[var(--color-border)]">
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="p-2 rounded-xl border transition-all duration-200 cursor-pointer border-[var(--color-border)] hover:bg-[var(--color-surface)]"
        >
          <Menu className="w-4 h-4" />
        </button>
        <span className="font-semibold text-xs tracking-wider uppercase">Aether Workspace</span>
        <div className="w-8" /> {/* Spacer */}
      </header>

      {/* Message List Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 w-full max-w-[900px] mx-auto select-text scrollbar-thin"
      >
        {!hasMessages ? (
          /* Clean, Premium Empty State */
          <div className="h-full flex flex-col justify-center items-center max-w-[600px] mx-auto text-center px-4 select-none">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-6 transition-all duration-300 bg-[var(--color-surface)]/80 border-[var(--color-border)] text-[var(--color-accent)] shadow-[0_4px_20px_var(--color-accent)]/20"
            >
              <Logo className="w-8 h-8" />
            </motion.div>

            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-base font-bold tracking-wider mb-2 uppercase transition-colors duration-300 text-[var(--color-text-primary)]"
            >
              AETHER RESUME INTELLIGENCE
            </motion.h1>
            
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-xs mb-8 leading-relaxed max-w-[420px] transition-colors duration-300 text-[var(--color-text-secondary)]"
            >
              An evaluation workspace for parsing candidate resumes, assessing job-role fits, and executing grounded contextual queries locally.
            </motion.p>

            {/* Prompt suggestions grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {[
                {
                  title: "Resume Parameters",
                  desc: "Analyze retrieval weights, Top-P, and Temperature",
                  icon: Terminal,
                  prompt: "Explain parameters like Temperature, Top-K, and Top-P",
                },
                {
                  title: "Role Matcher Demo",
                  desc: "Simulate matching a profile with a job role",
                  icon: BookOpen,
                  prompt: "Show a TypeScript React component code example",
                },
              ].map((card, idx) => (
                <motion.button
                  key={idx}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSuggestionClick(card.prompt)}
                  className="text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-1 glass-panel bg-[var(--color-surface)]/40 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/90"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <card.icon className="w-4 h-4 text-[var(--color-accent)]" />
                    <span className="text-xs font-semibold">{card.title}</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)]">{card.desc}</span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          /* Rendering messages list */
          <div className="space-y-2">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
              />
            ))}

            {/* Typing reveal bubble for active streaming */}
            {isStreaming && streamingText && (
              <MessageBubble
                message={{
                  id: "streaming-message",
                  role: "assistant",
                  content: streamingText,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }}
                isLast={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
