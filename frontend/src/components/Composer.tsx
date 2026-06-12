"use client";

import React, { useRef, useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { motion } from "framer-motion";
import {
  Paperclip,
  SendHorizontal,
  Square,
  RefreshCw,
  Copy,
  X,
  FileText,
  Check,
} from "lucide-react";

export const Composer = () => {
  const {
    sendMessage,
    isStreaming,
    stopGeneration,
    messages,
    regenerateMessage,
  } = useChat();

  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-expand text area height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "24px"; // Reset height
    const scrollHeight = textarea.scrollHeight;
    
    // Cap height at 180px
    if (scrollHeight > 180) {
      textarea.style.height = "180px";
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.height = `${scrollHeight - 4}px`;
      textarea.style.overflowY = "hidden";
    }
  }, [input]);

  const handleSend = async () => {
    if (isStreaming) return;
    const trimmedInput = input.trim();
    if (!trimmedInput && !attachment) return;

    setInput("");
    const attachToSend = attachment;
    setAttachment(null);
    await sendMessage(trimmedInput, attachToSend);

    // Focus textarea back
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simulate file upload attachment
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file.name);
    }
    // Reset file input value so same file can be attached again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
  };

  const handleRegenerate = async () => {
    if (isStreaming || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    await regenerateMessage(lastMsg.id);
  };

  const handleCopyLastResponse = () => {
    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    if (assistantMsgs.length === 0) return;
    const lastContent = assistantMsgs[assistantMsgs.length - 1].content;
    
    navigator.clipboard.writeText(lastContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const hasHistory = messages.length > 0;

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 mb-6">
      {/* Quick Composer Actions */}
      <div className="flex items-center justify-between px-2 mb-2">
        {hasHistory && (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRegenerate}
              disabled={isStreaming}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-all duration-200 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                border-[var(--color-border)] bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
              `}
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isStreaming ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyLastResponse}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-all duration-200 cursor-pointer
                border-[var(--color-border)] bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
              `}
            >
              {isCopied ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{isCopied ? "Copied" : "Copy Last"}</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Main Composer Box */}
      <div
        className={`relative flex flex-col p-2.5 rounded-3xl border transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.15)] glass-panel
          bg-[var(--color-surface)]/75 border-[var(--color-border)] focus-within:border-[var(--color-accent)]/40
        `}
      >
        {/* Attachment Pill (Renders inside composer box) */}
        {attachment && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold self-start mb-2 border transition-all duration-200
            bg-indigo-600/10 border-indigo-500/30 text-indigo-400">
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{attachment}</span>
            <button
              onClick={handleRemoveAttachment}
              className="p-0.5 rounded-full hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] transition-colors duration-150 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Attach Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAttachClick}
            type="button"
            className={`p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0
              hover:bg-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
            `}
          >
            <Paperclip className="w-4 h-4" />
          </motion.button>

          {/* Input Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? "AI generating response..."
                : attachment
                ? "Ask about this attachment..."
                : "Enter query or command parameters..."
            }
            disabled={isStreaming}
            className={`flex-1 max-h-[180px] py-1.5 px-2 bg-transparent text-sm resize-none focus:outline-none border-none outline-none leading-relaxed transition-opacity
              placeholder-[var(--color-text-muted)] disabled:opacity-60 text-[var(--color-text-primary)]
            `}
            style={{ height: "24px" }}
          />

          {/* Send / Stop Buttons */}
          {isStreaming ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopGeneration}
              type="button"
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() && !attachment}
              type="button"
              className={`p-2 rounded-xl transition-all duration-200 shrink-0 flex items-center justify-center cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  input.trim() || attachment
                    ? "bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)] font-semibold"
                    : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"
                }
              `}
            >
              <SendHorizontal className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
