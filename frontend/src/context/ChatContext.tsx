/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { API_URL } from "./RAGContext";

export interface SourceSnippet {
  source: string;
  doc_type: string;
  score: number;
  text: string;
  metadata: any;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: SourceSnippet[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
  timestamp: string;
}

export interface MatchResult {
  role_title: string;
  match_score: number;
  strengths: string[];
  gaps: string[];
  evidence: SourceSnippet[];
}

interface ChatContextType {
  activeModel: string;
  setActiveModel: (model: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  topK: number;
  setTopK: (k: number) => void;
  topP: number;
  setTopP: (p: number) => void;
  maxTokens: number;
  setMaxTokens: (tokens: number) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  messages: Message[];
  isStreaming: boolean;
  streamingText: string;
  sendMessage: (content: string, attachmentName?: string | null, attachmentText?: string | null) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  copyMessage: (content: string) => void;
  stopGeneration: () => void;
  createNewChat: () => void;
  deleteSession: (id: string) => void;
  clearHistory: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [activeModel, setActiveModel] = useState<string>("gemini-2.5-pro");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topK, setTopK] = useState<number>(4);
  const [topP, setTopP] = useState<number>(0.9);
  const [maxTokens, setMaxTokens] = useState<number>(2048);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const initDefaultSession = useCallback(() => {
    const defaultSession: ChatSession = {
      id: "default-session-id",
      title: "RAG Evaluation Session",
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Welcome to Aether Resume Intelligence. You can upload candidate resumes (text files) using the attachment tool to index them, or test matching credentials against active roles using the **Role Matcher** console.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      model: "gemini-2.5-pro",
      temperature: 0.7,
      topK: 4,
      topP: 0.9,
      maxTokens: 2048,
      timestamp: new Date().toISOString()
    };
    setSessions([defaultSession]);
    setCurrentSessionId(defaultSession.id);
    setMessages(defaultSession.messages);
    localStorage.setItem("chat-ui-sessions", JSON.stringify([defaultSession]));
  }, []);

  useEffect(() => {
    const savedSessions = localStorage.getItem("chat-ui-sessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages);
        } else {
          initDefaultSession();
        }
      } catch {
        initDefaultSession();
      }
    } else {
      initDefaultSession();
    }
  }, [initDefaultSession]);

  useEffect(() => {
    if (!currentSessionId) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
      setActiveModel(session.model);
      setTemperature(session.temperature);
      setTopK(session.topK);
      setTopP(session.topP);
      setMaxTokens(session.maxTokens);
      setMessages(session.messages);
    }
  }, [currentSessionId, sessions]);

  const updateCurrentSessionSettings = useCallback((updates: Partial<ChatSession>) => {
    if (!currentSessionId) return;
    setSessions(prev => {
      const updated = prev.map(s => (s.id === currentSessionId ? { ...s, ...updates } : s));
      localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
      return updated;
    });
  }, [currentSessionId]);

  const updateModel = useCallback((model: string) => {
    setActiveModel(model);
    updateCurrentSessionSettings({ model });
  }, [updateCurrentSessionSettings]);

  const updateTemperature = useCallback((temp: number) => {
    setTemperature(temp);
    updateCurrentSessionSettings({ temperature: temp });
  }, [updateCurrentSessionSettings]);

  const updateTopK = useCallback((k: number) => {
    setTopK(k);
    updateCurrentSessionSettings({ topK: k });
  }, [updateCurrentSessionSettings]);

  const updateTopP = useCallback((p: number) => {
    setTopP(p);
    updateCurrentSessionSettings({ topP: p });
  }, [updateCurrentSessionSettings]);

  const updateMaxTokens = useCallback((tokens: number) => {
    setMaxTokens(tokens);
    updateCurrentSessionSettings({ maxTokens: tokens });
  }, [updateCurrentSessionSettings]);

  const createNewChat = useCallback(() => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: "New Chat",
      messages: [],
      model: activeModel,
      temperature,
      topK,
      topP,
      maxTokens,
      timestamp: new Date().toISOString()
    };
    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
      return updated;
    });
    setCurrentSessionId(newSessionId);
    setMessages([]);
  }, [activeModel, temperature, topK, topP, maxTokens]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
      if (currentSessionId === id) {
        if (updated.length > 0) {
          setCurrentSessionId(updated[0].id);
          setMessages(updated[0].messages);
        } else {
          initDefaultSession();
        }
      }
      return updated;
    });
  }, [currentSessionId, initDefaultSession]);

  const clearHistory = useCallback(() => {
    initDefaultSession();
  }, [initDefaultSession]);

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
    setIsStreaming(false);
  }, [abortController]);

  const executeRAGQuery = useCallback(async (userMsg: string, currentMsgs: Message[]) => {
    setIsStreaming(true);
    setStreamingText("");
    const controller = new AbortController();
    setAbortController(controller);

    let answer = "";
    let sources: SourceSnippet[] = [];

    try {
      const res = await fetch(`${API_URL}/query/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg,
          top_k: topK
        }),
        signal: controller.signal
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.substring(6);
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.sources) {
                  sources = parsed.sources;
                } else if (parsed.token !== undefined) {
                  answer += parsed.token;
                  setStreamingText(answer);
                }
              } catch (e) {
                console.error("Failed to parse SSE data frame:", e, dataStr);
              }
            }
          }
        }
      } else {
        answer = "Error: Failed to fetch RAG evaluation from backend API. Please make sure the FastAPI server is running.";
        setStreamingText(answer);
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setIsStreaming(false);
        setAbortController(null);
        return;
      }
      answer = "Network Error: Unable to connect to the local FastAPI backend. Ensure the backend is active at http://localhost:8000.";
      setStreamingText(answer);
    }

    if (!controller.signal.aborted) {
      const assistantMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: sources
      };

      const finalMessages = [...currentMsgs, assistantMsg];
      setMessages(finalMessages);
      
      if (currentSessionId) {
        setSessions(prev => {
          const updated = prev.map(s => {
            if (s.id === currentSessionId) {
              const title = s.title === "New Chat" || s.title === "RAG Evaluation Session"
                ? (userMsg.length > 24 ? userMsg.substring(0, 24) + "..." : userMsg)
                : s.title;
              return {
                ...s,
                title,
                messages: finalMessages,
                timestamp: new Date().toISOString()
              };
            }
            return s;
          });
          localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
          return updated;
        });
      }
    }

    setIsStreaming(false);
    setStreamingText("");
    setAbortController(null);
  }, [topK, currentSessionId]);

  const sendMessage = useCallback(async (content: string, attachmentName?: string | null, attachmentText?: string | null) => {
    if (!content.trim() && !attachmentText) return;
    if (isStreaming) return;

    let userContent = content;
    if (attachmentName) {
      userContent = `[Grounded on document: ${attachmentName}]\n${content}`;
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);

    if (currentSessionId) {
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === currentSessionId) {
            const title = s.title === "New Chat" || s.title === "RAG Evaluation Session"
              ? (content.length > 24 ? content.substring(0, 24) + "..." : content)
              : s.title;
            return {
              ...s,
              title,
              messages: newMsgs,
              timestamp: new Date().toISOString()
            };
          }
          return s;
        });
        localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
        return updated;
      });
    }

    await executeRAGQuery(userMsg.content, newMsgs);
  }, [messages, isStreaming, currentSessionId, executeRAGQuery]);

  const regenerateMessage = useCallback(async (messageId: string) => {
    if (isStreaming) return;

    const msgIdx = messages.findIndex(m => m.id === messageId);
    if (msgIdx === -1) return;

    let lastUserQuery = "";
    let cleanMsgs: Message[] = [];

    if (messages[msgIdx].role === "assistant") {
      cleanMsgs = messages.slice(0, msgIdx);
      for (let i = cleanMsgs.length - 1; i >= 0; i--) {
        if (cleanMsgs[i].role === "user") {
          lastUserQuery = cleanMsgs[i].content;
          break;
        }
      }
    } else {
      lastUserQuery = messages[msgIdx].content;
      cleanMsgs = messages.slice(0, msgIdx);
    }

    if (!lastUserQuery) return;
    setMessages(cleanMsgs);

    await executeRAGQuery(lastUserQuery, cleanMsgs);
  }, [messages, isStreaming, executeRAGQuery]);

  const value = useMemo(() => ({
    activeModel,
    setActiveModel: updateModel,
    temperature,
    setTemperature: updateTemperature,
    topK,
    setTopK: updateTopK,
    topP,
    setTopP: updateTopP,
    maxTokens,
    setMaxTokens: updateMaxTokens,
    sessions,
    currentSessionId,
    setCurrentSessionId,
    messages,
    isStreaming,
    streamingText,
    sendMessage,
    regenerateMessage,
    copyMessage,
    stopGeneration,
    createNewChat,
    deleteSession,
    clearHistory
  }), [
    activeModel, updateModel, temperature, updateTemperature,
    topK, updateTopK, topP, updateTopP, maxTokens, updateMaxTokens,
    sessions, currentSessionId, messages, isStreaming, streamingText,
    sendMessage, regenerateMessage, copyMessage, stopGeneration,
    createNewChat, deleteSession, clearHistory
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
