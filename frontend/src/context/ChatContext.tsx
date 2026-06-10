"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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
  sendMessage: (content: string, attachment?: string | null) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  copyMessage: (content: string) => void;
  stopGeneration: () => void;
  createNewChat: () => void;
  deleteSession: (id: string) => void;
  clearHistory: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DEFAULT_MODELS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "claude-3-5-sonnet",
  "gpt-4o",
  "deepseek-reasoner",
  "llama-3.3-70b"
];

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  // Theme state
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  // Model settings
  const [activeModel, setActiveModel] = useState<string>("gemini-2.5-pro");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topK, setTopK] = useState<number>(40);
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
          // Initialize first session
          initDefaultSession();
        }
      } catch (e) {
        initDefaultSession();
      }
    } else {
      initDefaultSession();
    }
  }, []);

  const initDefaultSession = () => {
    const defaultSession: ChatSession = {
      id: "default-session-id",
      title: "New Chat",
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Welcome. How can I assist you with inference today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      model: "gemini-2.5-pro",
      temperature: 0.7,
      topK: 40,
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

  // Simulated AI response streaming (typewriter/token feel)
  const streamAIResponse = async (userMsg: string, currentMsgs: Message[]) => {
    setIsStreaming(true);
    setStreamingText("");
    const controller = new AbortController();
    setAbortController(controller);

    const prompts: Record<string, string> = {
      "hello": "Hello! I am your LLM assistant. How can I assist with your development or analysis goals today?",
      "help": "I can assist you in writing clean code, reviewing architectural designs, explaining neural network parameters (like Temperature, Top-K, Top-P), or parsing complex documents. What are you working on?",
      "explain parameters": "Here is a breakdown of the sampling parameters you can adjust in the settings panel:\n\n1. **Temperature**: Controls the randomness of the model. Lower values (e.g., 0.2) make output deterministic and focused, while higher values (e.g., 0.8) increase creativity and variety.\n2. **Top-P (Nucleus Sampling)**: Filters out tokens whose cumulative probability is lower than the value P (e.g., 0.9). It balances predictability and vocabulary diversity.\n3. **Top-K**: Limits the search to the top K most likely words. Lower Top-K leads to highly consistent generation; larger values permit rare words.\n4. **Max Tokens**: The absolute length threshold of the output response.",
      "default": `This is a simulated token-by-token generation response from **${activeModel}**.

Your query: *"${userMsg}"*

### Parameters Applied:
* **Temperature**: ${temperature}
* **Top-P**: ${topP}
* **Top-K**: ${topK}
* **Max Tokens**: ${maxTokens}

### Model Context:
As a Principal Frontend Architect, Senior Product Designer, and Staff Engineer, I can confirm that this interface is rendering at a target **60 FPS** with premium CSS layout systems, responsive 8px grid spacing, and hardware-accelerated animations. 

Let me know if you want me to write code snippets or help analyze logs!`
    };

    let replyText = prompts.default;
    const lower = userMsg.toLowerCase().trim();
    if (lower.includes("hello") || lower.includes("hi")) {
      replyText = prompts.hello;
    } else if (lower.includes("help")) {
      replyText = prompts.help;
    } else if (lower.includes("parameter") || lower.includes("temperature") || lower.includes("top-p")) {
      replyText = prompts["explain parameters"];
    }

    // Split response into tokens (words or short sequences)
    const tokens = replyText.split(" ");
    let currentResponse = "";
    
    for (let i = 0; i < tokens.length; i++) {
      if (controller.signal.aborted) break;
      
      currentResponse += (i === 0 ? "" : " ") + tokens[i];
      setStreamingText(currentResponse);
      
      // Variable speed to simulate realistic network/generation lag
      const delay = Math.random() * 40 + 20; 
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (!controller.signal.aborted) {
      const assistantMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: currentResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...currentMsgs, assistantMsg];
      setMessages(finalMessages);
      
      // Update session in list & local storage
      if (currentSessionId) {
        const updated = sessions.map(s => {
          if (s.id === currentSessionId) {
            // Update title from the first user query if it was named "New Chat"
            const title = s.title === "New Chat" ? (userMsg.length > 24 ? userMsg.substring(0, 24) + "..." : userMsg) : s.title;
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

  const sendMessage = async (content: string, attachment?: string | null) => {
    if (!content.trim() && !attachment) return;
    if (isStreaming) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: attachment ? `[Attachment: ${attachment}] ${content}` : content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);

    // If current session is empty, make sure it is updated
    if (currentSessionId) {
      const updated = sessions.map(s => {
        if (s.id === currentSessionId) {
          const title = s.title === "New Chat" ? (content.length > 24 ? content.substring(0, 24) + "..." : content) : s.title;
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

    // Stream simulated AI response
    await streamAIResponse(content, newMsgs);
  };

  const regenerateMessage = async (messageId: string) => {
    if (isStreaming) return;

    // Find the message index
    const msgIdx = messages.findIndex(m => m.id === messageId);
    if (msgIdx === -1) return;

    // We want to slice messages up to the user query prior to this assistant response
    let lastUserQuery = "";
    let cleanMsgs: Message[] = [];

    if (messages[msgIdx].role === "assistant") {
      cleanMsgs = messages.slice(0, msgIdx);
      // Find the last user message
      for (let i = cleanMsgs.length - 1; i >= 0; i--) {
        if (cleanMsgs[i].role === "user") {
          lastUserQuery = cleanMsgs[i].content;
          break;
        }
      }
    } else {
      // It's a user message, regenerate from this query
      lastUserQuery = messages[msgIdx].content;
      cleanMsgs = messages.slice(0, msgIdx);
    }

    if (!lastUserQuery) return;
    setMessages(cleanMsgs);

    await streamAIResponse(lastUserQuery, cleanMsgs);
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
        clearHistory
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
