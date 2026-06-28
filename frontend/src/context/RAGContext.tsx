"use client";
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from "react";
import { SourceSnippet, MatchResult } from "./ChatContext";

interface RAGContextType {
  ingestedDocs: string[];
  fetchIngestedDocs: () => Promise<void>;
  ingestDocument: (name: string, content: string) => Promise<{ chunksAdded: number; success: boolean }>;
  matchResult: MatchResult | null;
  matchLoading: boolean;
  runMatchEvaluation: (roleTitle: string, jobDescription: string, sourceDoc?: string) => Promise<void>;
  clearMatchResult: () => void;
  isBackendConnected: boolean;
  backendStats: { indexedChunks: number; environment: string } | null;
  uploadResume: (file: File) => Promise<string>;
  analyzeResume: (text: string) => Promise<Record<string, unknown>>;
  matchJobs: (profile: any) => Promise<any[]>;
  upgradeSkills: (profile: any, skills: string[]) => Promise<any>;
  generateInterview: (jobId: string, profile: any) => Promise<any>;
  seedJobs: () => Promise<void>;
  openaiKey: string;
  setOpenaiKey: (key: string) => void;
  backendApiKey: string;
  setBackendApiKey: (key: string) => void;
}

const API_URL_RAW = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_URL = API_URL_RAW.replace(/\/+$/, "");

const RAGContext = createContext<RAGContextType | undefined>(undefined);

export const RAGProvider = ({ children }: { children: ReactNode }) => {
  const [ingestedDocs, setIngestedDocs] = useState<string[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [backendStats, setBackendStats] = useState<{ indexedChunks: number; environment: string } | null>(null);
  const [openaiKey, setOpenaiKeyState] = useState<string>("");
  const [backendApiKey, setBackendApiKeyState] = useState<string>("");

  const setOpenaiKey = useCallback((key: string) => setOpenaiKeyState(key), []);
  const setBackendApiKey = useCallback((key: string) => setBackendApiKeyState(key), []);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (openaiKey) {
      headers["X-OpenAI-Key"] = openaiKey;
    }
    if (backendApiKey) {
      headers["X-API-Key"] = backendApiKey;
    }
    return headers;
  }, [openaiKey, backendApiKey]);

  const checkBackendHealth = useCallback(async () => {
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
  }, []);

  const fetchIngestedDocs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/documents`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const docs = data.map((d: { source?: string; name?: string }) => d.source || d.name);
        setIngestedDocs(Array.from(new Set(docs)) as string[]);
      }
    } catch {}
  }, [getHeaders]);

  const ingestDocument = useCallback(async (name: string, content: string) => {
    try {
      const res = await fetch(`${API_URL}/documents`, {
        method: "POST",
        headers: getHeaders(),
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
      throw new Error(`Ingest Failed (${res.status})`);
    } catch (e: any) {
      throw new Error(e.message || "Failed to ingest document");
    }
  }, [getHeaders, checkBackendHealth, fetchIngestedDocs]);

  const runMatchEvaluation = useCallback(async (roleTitle: string, jobDescription: string, sourceDoc?: string) => {
    setMatchLoading(true);
    setMatchResult(null);
    try {
      const res = await fetch(`${API_URL}/match`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          role_title: roleTitle,
          job_description: jobDescription,
          top_k: 8,
          source_doc: sourceDoc || undefined
        })
      });
      if (!res.ok) throw new Error("Failed to run match evaluation");
      const data = await res.json();
      setMatchResult(data);
    } catch (e) {
      setMatchLoading(false);
      throw e;
    }
    setMatchLoading(false);
  }, [getHeaders]);

  const clearMatchResult = useCallback(() => setMatchResult(null), []);

  const uploadResume = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    if (openaiKey) {
      headers["X-OpenAI-Key"] = openaiKey;
    }
    if (backendApiKey) {
      headers["X-API-Key"] = backendApiKey;
    }
    const res = await fetch(`${API_URL}/upload/resume`, {
      method: "POST",
      headers,
      body: formData
    });
    if (!res.ok) {
      let errTxt = "Unknown error";
      try {
        const errObj = await res.json();
        errTxt = errObj.detail || JSON.stringify(errObj);
      } catch {
        errTxt = res.statusText;
      }
      throw new Error(`Upload Failed (${res.status}): ${errTxt}`);
    }
    const data = await res.json();
    return data.text;
  }, [openaiKey]);

  const analyzeResume = useCallback(async (text: string): Promise<Record<string, unknown>> => {
    const res = await fetch(`${API_URL}/analyze/resume`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ text, openai_key: openaiKey || undefined })
    });
    if (!res.ok) throw new Error("Failed to analyze resume");
    return res.json();
  }, [getHeaders, openaiKey]);

  const matchJobs = useCallback(async (profile: any): Promise<any[]> => {
    const res = await fetch(`${API_URL}/analyze/match`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ profile, top_k: 10 })
    });
    if (!res.ok) throw new Error("Failed to match jobs");
    return res.json();
  }, [getHeaders]);

  const upgradeSkills = useCallback(async (profile: any, skills: string[]): Promise<any> => {
    const res = await fetch(`${API_URL}/analyze/upgrade`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ profile, learned_skills: skills })
    });
    if (!res.ok) throw new Error("Failed to evaluate skill upgrades");
    return res.json();
  }, [getHeaders]);

  const generateInterview = useCallback(async (jobId: string, profile: any): Promise<any> => {
    const res = await fetch(`${API_URL}/analyze/interview`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ job_id: jobId, profile })
    });
    if (!res.ok) throw new Error("Failed to generate interview");
    return res.json();
  }, [getHeaders]);

  const seedJobs = useCallback(async () => {
    const res = await fetch(`${API_URL}/jobs/seed`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to seed jobs");
  }, []);

  useEffect(() => {
    checkBackendHealth();
    fetchIngestedDocs();
  }, [checkBackendHealth, fetchIngestedDocs]);

  const value = useMemo(() => ({
    ingestedDocs, fetchIngestedDocs, ingestDocument, matchResult, matchLoading,
    runMatchEvaluation, clearMatchResult, isBackendConnected, backendStats,
    uploadResume, analyzeResume, matchJobs, upgradeSkills, generateInterview, seedJobs,
    openaiKey, setOpenaiKey, backendApiKey, setBackendApiKey
  }), [
    ingestedDocs, fetchIngestedDocs, ingestDocument, matchResult, matchLoading,
    runMatchEvaluation, clearMatchResult, isBackendConnected, backendStats,
    uploadResume, analyzeResume, matchJobs, upgradeSkills, generateInterview, seedJobs,
    openaiKey, setOpenaiKey, backendApiKey, setBackendApiKey
  ]);

  return <RAGContext.Provider value={value}>{children}</RAGContext.Provider>;
};

export const useRAG = () => {
  const context = useContext(RAGContext);
  if (!context) throw new Error("useRAG must be used within a RAGProvider");
  return context;
};
