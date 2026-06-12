"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Message, useChat } from "@/context/ChatContext";
import { Copy, Check, RefreshCw, Sparkles, User } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

export const MessageBubble = ({ message, isLast }: MessageBubbleProps) => {
  const { copyMessage, regenerateMessage, isStreaming } = useChat();
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";

  const handleCopy = () => {
    copyMessage(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (isStreaming) return;
    regenerateMessage(message.id);
  };

  // Check if content has code blocks to render them with styling
  const renderContent = (text: string) => {
    if (!text) return null;
    
    // Very simple parser for code blocks (```code```)
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        const language = lines[0] && lines[0].length < 10 ? lines[0] : "";
        const code = language ? lines.slice(1).join("\n") : lines.join("\n");
        
        return (
          <div
            key={index}
            className={`my-3 rounded-xl border overflow-hidden font-mono text-xs leading-relaxed transition-colors duration-300
              bg-[var(--color-bg)]/80 border-[var(--color-border)]
            `}
          >
            {language && (
              <div className="px-4 py-2 border-b flex items-center justify-between text-[9px] font-bold uppercase tracking-wider bg-[var(--color-surface)]/40 border-[var(--color-border)] text-[var(--color-text-muted)]">
                <span>{language}</span>
                <span className="font-normal font-sans lowercase">read-only</span>
              </div>
            )}
            <pre className="p-4 overflow-x-auto select-text">
              <code className="text-[var(--color-text-primary)]">{code}</code>
            </pre>
          </div>
        );
      }

      // Simple markdown format for bold text (**bold**)
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index} className="whitespace-pre-wrap select-text">
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith("**") && bPart.endsWith("**")) {
              return (
                <strong key={bIdx} className="text-[var(--color-text-primary)] font-semibold">
                  {bPart.slice(2, -2)}
                </strong>
              );
            }
            return bPart;
          })}
        </span>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex w-full gap-4 mb-6 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full border shrink-0 flex items-center justify-center transition-colors duration-300 bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-accent)]">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        </div>
      )}

      {/* Message Box */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl p-4 text-xs leading-relaxed border transition-colors duration-300 glass-panel
            ${
              isUser
                ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20 text-[var(--color-text-primary)] shadow-sm"
                : "bg-[var(--color-surface)]/50 border-[var(--color-border)] text-[var(--color-text-secondary)]"
            }
          `}
        >
          {/* Header metadata */}
          {!isUser && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-mono tracking-wider uppercase font-semibold text-[var(--color-accent)]">
                RAG Engine
              </span>
            </div>
          )}

          {/* Render Text / Markdown */}
          <div>{renderContent(message.content)}</div>
        </div>

        {/* Action Bar (under bubble, visible on hover or last assistant message) */}
        {!isUser && (
          <div className="flex items-center gap-2.5 mt-2 ml-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="p-1 rounded transition-colors duration-150 cursor-pointer flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              title="Copy response"
            >
              {copied ? <Check className="w-3 h-3 text-green-550" /> : <Copy className="w-3 h-3" />}
            </motion.button>

            {isLast && !isStreaming && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRegenerate}
                className="p-1 rounded transition-colors duration-150 cursor-pointer flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                title="Regenerate response"
              >
                <RefreshCw className="w-3 h-3" />
              </motion.button>
            )}

            <span className="text-[9px] font-mono select-none text-[var(--color-text-muted)]">
              {message.timestamp}
            </span>
          </div>
        )}

        {isUser && (
          <div className="flex items-center gap-1.5 mt-1.5 mr-1 text-[9px] font-mono">
            <span className="text-[var(--color-text-muted)]">{message.timestamp}</span>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full border shrink-0 flex items-center justify-center transition-colors duration-300 bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </motion.div>
  );
};
