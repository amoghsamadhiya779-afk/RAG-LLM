"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface SourceSnippet {
  source: string;
  doc_type: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
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
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
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
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
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
  
  // Enterprise RAG additions
  activeView: "chat" | "matcher";
  setActiveView: (view: "chat" | "matcher") => void;
  ingestedDocs: string[];
  fetchIngestedDocs: () => Promise<void>;
  ingestDocument: (name: string, content: string) => Promise<{ chunksAdded: number; success: boolean }>;
  matchResult: MatchResult | null;
  matchLoading: boolean;
  runMatchEvaluation: (roleTitle: string, jobDescription: string) => Promise<void>;
  clearMatchResult: () => void;
  isBackendConnected: boolean;
  backendStats: { indexedChunks: number; environment: string } | null;
  
  // Board State
  analyzeResume: (text: string) => Promise<any>;
  matchJobs: (profile: any) => Promise<any[]>;
  upgradeSkills: (profile: any, skills: string[]) => Promise<any>;
  generateInterview: (jobId: string, profile: any) => Promise<any>;
  seedJobs: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  // Theme state
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  // Model settings
  const [activeModel, setActiveModel] = useState<string>("gemini-2.5-pro");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topK, setTopK] = useState<number>(4);
  const [topP, setTopP] = useState<number>(0.9);
  const [maxTokens, setMaxTokens] = useState<number>(2048);

  // Layout states
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Chat sessions states
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Streaming response states
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // RAG States
  const [activeView, setActiveView] = useState<"chat" | "matcher">("chat");
  const [ingestedDocs, setIngestedDocs] = useState<string[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [backendStats, setBackendStats] = useState<{ indexedChunks: number; environment: string } | null>(null);

  // Check backend connection & fetch stats
  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setIsBackendConnected(true);
        setBackendStats({
          indexedChunks: data.indexed_chunks,
          environment: data.environment,
        });
      } else {
        setIsBackendConnected(false);
      }
    } catch {
      setIsBackendConnected(false);
    }
  };

  const fetchIngestedDocs = async () => {
    try {
      const res = await fetch(`${API_URL}/documents`);
      if (res.ok) {
        const data = await res.json();
        // Extract unique source names
        const docs = data.map((d: { source?: string; name?: string }) => d.source || d.name);
        setIngestedDocs(Array.from(new Set(docs)) as string[]);
      }
    } catch {}
  };

  const ingestDocument = async (name: string, content: string) => {
    try {
      const res = await fetch(`${API_URL}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content,
          source: name,
          doc_type: "resume",
          metadata: {}
        })
      });
      if (res.ok) {
        const data = await res.json();
        await checkBackendHealth();
        await fetchIngestedDocs();
        return { chunksAdded: data.chunks_added, success: true };
      }
    } catch {}
    return { chunksAdded: 0, success: false };
  };

  const runMatchEvaluation = async (roleTitle: string, jobDescription: string) => {
    setMatchLoading(true);
    setMatchResult(null);
    try {
      const res = await fetch(`${API_URL}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_title: roleTitle,
          job_description: jobDescription,
          top_k: 8
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMatchResult(data);
      }
    } catch {}
    setMatchLoading(false);
  };

  const clearMatchResult = () => setMatchResult(null);

  const analyzeResume = async (text: string) => {
    const res = await fetch(`${API_URL}/analyze/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error("Failed to analyze resume");
    return res.json();
  };

  const matchJobs = async (profile: any) => {
    const res = await fetch(`${API_URL}/analyze/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, top_k: 10 })
    });
    if (!res.ok) throw new Error("Failed to match jobs");
    return res.json();
  };

  const upgradeSkills = async (profile: any, skills: string[]) => {
    const res = await fetch(`${API_URL}/analyze/upgrade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, learned_skills: skills })
    });
    if (!res.ok) throw new Error("Failed to evaluate skill upgrades");
    return res.json();
  };

  const generateInterview = async (jobId: string, profile: any) => {
    const res = await fetch(`${API_URL}/analyze/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, profile })
    });
    if (!res.ok) throw new Error("Failed to generate interview");
    return res.json();
  };

  const seedJobs = async () => {
    const res = await fetch(`${API_URL}/jobs/seed`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to seed jobs");
  };

  // Load from local storage
  useEffect(() => {
    // Collapse sidebar by default on mobile screens
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarExpanded(false);
    }

    const savedTheme = localStorage.getItem("chat-ui-theme") as "dark" | "light" | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      document.documentElement.className = "dark";
    }

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

    // Ping backend API on mount
    checkBackendHealth();
    fetchIngestedDocs();
  }, []);

  const initDefaultSession = () => {
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
  };

  const setTheme = (newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    localStorage.setItem("chat-ui-theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Sync active session settings
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  // Update session settings in local storage
  const updateCurrentSessionSettings = (updates: Partial<ChatSession>) => {
    if (!currentSessionId) return;
    const updated = sessions.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, ...updates };
      }
      return s;
    });
    setSessions(updated);
    localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
  };

  const updateModel = (model: string) => {
    setActiveModel(model);
    updateCurrentSessionSettings({ model });
  };

  const updateTemperature = (temp: number) => {
    setTemperature(temp);
    updateCurrentSessionSettings({ temperature: temp });
  };

  const updateTopK = (k: number) => {
    setTopK(k);
    updateCurrentSessionSettings({ topK: k });
  };

  const updateTopP = (p: number) => {
    setTopP(p);
    updateCurrentSessionSettings({ topP: p });
  };

  const updateMaxTokens = (tokens: number) => {
    setMaxTokens(tokens);
    updateCurrentSessionSettings({ maxTokens: tokens });
  };

  const createNewChat = () => {
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
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSessionId);
    setMessages([]);
    localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
    if (currentSessionId === id) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        initDefaultSession();
      }
    }
  };

  const clearHistory = () => {
    initDefaultSession();
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsStreaming(false);
  };

  // Real API RAG query executor with SSE streaming
  const executeRAGQuery = async (userMsg: string, currentMsgs: Message[]) => {
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
        const updated = sessions.map(s => {
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
        setSessions(updated);
        localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
      }
    }

    setIsStreaming(false);
    setStreamingText("");
    setAbortController(null);
  };

  const sendMessage = async (content: string, attachmentName?: string | null, attachmentText?: string | null) => {
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
      const updated = sessions.map(s => {
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
      setSessions(updated);
      localStorage.setItem("chat-ui-sessions", JSON.stringify(updated));
    }

    await executeRAGQuery(userMsg.content, newMsgs);
  };

  const regenerateMessage = async (messageId: string) => {
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
  };

  return (
    <ChatContext.Provider
      value={{
        theme,
        setTheme,
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
        isSidebarExpanded,
        setIsSidebarExpanded,
        isSettingsOpen,
        setIsSettingsOpen,
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
        clearHistory,
        
        // RAG States & Utilities
        activeView,
        setActiveView,
        ingestedDocs,
        fetchIngestedDocs,
        ingestDocument,
        matchResult,
        matchLoading,
        runMatchEvaluation,
        clearMatchResult,
        isBackendConnected,
        backendStats,
        
        // Board API
        analyzeResume,
        matchJobs,
        upgradeSkills,
        generateInterview,
        seedJobs
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
