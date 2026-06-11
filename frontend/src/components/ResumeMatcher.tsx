"use client";

import React, { useState } from "react";
import { useChat } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, FileText, Sparkles, BookOpen, Layers } from "lucide-react";

export const ResumeMatcher = () => {
  const {
    ingestedDocs,
    matchResult,
    matchLoading,
    runMatchEvaluation,
    clearMatchResult,
    ingestDocument,
    uploadResume,
    theme,
  } = useChat();

  const [selectedDoc, setSelectedDoc] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"strengths" | "gaps" | "evidence">("strengths");

  const [isUploading, setIsUploading] = useState(false);
  const isDark = theme === "dark";

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const text = await uploadResume(file);
      await ingestDocument(file.name, text);
      setSelectedDoc(file.name);
    } catch (e) {
      console.error(e);
    }
    setIsUploading(false);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim() || !jobDescription.trim()) return;
    await runMatchEvaluation(roleTitle, jobDescription);
  };

  // SVG parameters for the radial match score dial
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const score = matchResult?.match_score || 0;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-6 sm:px-6 w-full max-w-[1280px] mx-auto select-text scrollbar-thin">
      
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold tracking-tight uppercase transition-colors duration-300
            ${isDark ? "text-dark-text-primary" : "text-light-text-primary"}`}>
            RAG Profile Evaluator
          </h1>
          <p className={`text-xs ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}>
            Cross-evaluate candidate credentials against role requirements using semantic search embeddings.
          </p>
        </div>
        {matchResult && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={clearMatchResult}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer
              ${isDark ? "border-dark-border hover:bg-white/5" : "border-light-border hover:bg-black/5"}`}
          >
            Reset Analysis
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form Panel */}
        <div className="lg:col-span-5">
          <div className={`p-5 rounded-2xl border glass-panel transition-colors duration-300
            ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white/50 border-light-border"}`}>
            
            <div className="flex items-center gap-2 mb-4">
              <FileText className={`w-4 h-4 ${isDark ? "text-dark-accent" : "text-light-accent"}`} />
              <h2 className="text-sm font-semibold uppercase tracking-wider">Evaluation Specs</h2>
            </div>

            <form onSubmit={handleEvaluate} className="space-y-4">
              {/* Select Resume Document */}
              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Candidate Profile Index
                </label>
                <select
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none transition-all duration-200 cursor-pointer mb-3
                    ${isDark 
                      ? "bg-dark-bg border-dark-border text-white focus:border-dark-accent/40" 
                      : "bg-light-bg border-light-border text-light-text-primary focus:border-light-accent/40"}`}
                >
                  <option value="">Select Ingested Document...</option>
                  {ingestedDocs.map((doc, idx) => (
                    <option key={idx} value={doc}>{doc}</option>
                  ))}
                </select>

                <div className="flex items-center gap-4 mb-3">
                  <div className={`flex-1 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`}></div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>OR UPLOAD NEW</span>
                  <div className={`flex-1 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`}></div>
                </div>

                <label className={`w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${isDark ? "border-dark-border hover:border-dark-accent/50 bg-dark-bg/50" : "border-light-border hover:border-light-accent/50 bg-light-bg/50"}`}>
                  <div className="flex flex-col items-center justify-center text-center">
                    <FileText className={`w-5 h-5 mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                    <p className={`mb-1 text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {isUploading ? "Uploading & Ingesting..." : "Upload Resume (PDF, DOCX)"}
                    </p>
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }} disabled={isUploading} />
                </label>
              </div>

              {/* Target Role Title */}
              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Target Role Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none transition-all duration-200
                    ${isDark 
                      ? "bg-dark-bg border-dark-border text-white focus:border-dark-accent/40" 
                      : "bg-light-bg border-light-border text-light-text-primary focus:border-light-accent/40"}`}
                />
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Job Description / Role Specs (Min 50 chars)
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste details of target qualifications, stack preferences, and role parameters..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none transition-all duration-200 resize-none leading-relaxed
                    ${isDark 
                      ? "bg-dark-bg border-dark-border text-white focus:border-dark-accent/40" 
                      : "bg-light-bg border-light-border text-light-text-primary focus:border-light-accent/40"}`}
                />
              </div>

              {/* Run Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={matchLoading || !roleTitle.trim() || jobDescription.trim().length < 50}
                className={`w-full p-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer justify-center flex items-center gap-2
                  ${
                    matchLoading || !roleTitle.trim() || jobDescription.trim().length < 50
                      ? "bg-slate-800 text-slate-500 border-transparent cursor-not-allowed opacity-50"
                      : isDark
                      ? "bg-dark-accent border-dark-accent text-dark-bg hover:bg-dark-accent-hover shadow-[0_4px_14px_rgba(129,140,248,0.2)]"
                      : "bg-light-accent border-light-accent text-white hover:bg-light-accent-hover shadow-[0_4px_14px_rgba(79,70,229,0.15)]"
                  }
                `}
              >
                {matchLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Evaluating Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Match Analysis</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>

        {/* Right Results Panel */}
        <div className="lg:col-span-7 h-full">
          <AnimatePresence mode="wait">
            {matchLoading ? (
              /* Loading State */
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex flex-col items-center justify-center p-12 rounded-2xl border min-h-[350px] glass-panel transition-colors duration-300
                  ${isDark ? "bg-dark-surface/30 border-dark-border" : "bg-white/30 border-light-border"}`}
              >
                <div className="relative w-16 h-16 mb-4">
                  <motion.div
                    className={`absolute inset-0 rounded-full border-t-2 border-r-2 ${isDark ? "border-dark-accent" : "border-light-accent"}`}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  />
                  <Layers className={`absolute inset-0 m-auto w-6 h-6 animate-pulse ${isDark ? "text-dark-accent" : "text-light-accent"}`} />
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-1">Vector Index Retrieval</h3>
                <p className={`text-[10px] max-w-[240px] text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Retrieving grounded chunks and evaluating semantic matching coefficients...
                </p>
              </motion.div>
            ) : matchResult ? (
              /* Evaluation Results Active */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className={`p-5 rounded-2xl border glass-panel transition-colors duration-300 flex flex-col gap-6
                  ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white/50 border-light-border"}`}
              >
                {/* Score & Radial Dial */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-white/5">
                  {/* SVG radial progress dial */}
                  <div className="relative w-28 h-28 shrink-0 select-none">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {/* Gray track circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      {/* Active progress circle */}
                      <motion.circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke={isDark ? "url(#logo-grad-dark)" : "url(#logo-grad-light)"}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Inner score label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                      <span className="text-xl font-bold">{score}%</span>
                      <span className={`text-[8px] uppercase font-sans tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        Match
                      </span>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider">{matchResult.role_title}</h3>
                    <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Semantically verified. The candidate profile matches the target specifications with a coefficient score of {score}/100.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border
                        ${score >= 80 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : score >= 50 
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                          : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                        {score >= 80 ? "High Fit" : score >= 50 ? "Moderate Fit" : "Low Fit"}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${isDark ? "bg-white/2 border-white/5 text-slate-500" : "bg-black/2 border-black/5 text-slate-400"}`}>
                        {matchResult.evidence.length} context nodes retrieved
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex border-b border-white/5 p-0.5 rounded-xl bg-black/10 self-start">
                  {[
                    { id: "strengths", name: "Strengths", count: matchResult.strengths.length },
                    { id: "gaps", name: "Gaps & Gaps", count: matchResult.gaps.length },
                    { id: "evidence", name: "RAG Evidence", count: matchResult.evidence.length },
                  ].map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as "strengths" | "gaps" | "evidence")}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5
                          ${
                            isSelected
                              ? isDark
                                ? "bg-dark-elevated text-white border border-white/5"
                                : "bg-white text-light-accent shadow-sm border border-light-border"
                              : isDark
                              ? "text-slate-400 hover:text-white"
                              : "text-slate-550 hover:text-black"
                          }
                        `}
                      >
                        <span>{tab.id === "gaps" ? "Gaps" : tab.name}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isSelected ? (isDark ? "bg-dark-accent/20 text-dark-accent" : "bg-light-accent/10 text-light-accent") : "bg-white/5 text-slate-500"}`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content Panels */}
                <div className="flex-1 min-h-[220px]">
                  <AnimatePresence mode="wait">
                    {activeTab === "strengths" && (
                      <motion.div
                        key="strengths"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="space-y-2"
                      >
                        {matchResult.strengths.map((str, idx) => (
                          <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border text-xs leading-relaxed
                            ${isDark ? "bg-white/1 border-white/5" : "bg-black/1 border-black/5"}`}>
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                            <span>{str}</span>
                          </div>
                        ))}
                        {matchResult.strengths.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-6">No specific semantic strengths evaluated.</p>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "gaps" && (
                      <motion.div
                        key="gaps"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="space-y-2"
                      >
                        {matchResult.gaps.map((gap, idx) => (
                          <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border text-xs leading-relaxed
                            ${isDark ? "bg-white/1 border-white/5" : "bg-black/1 border-black/5"}`}>
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                            <span>{gap}</span>
                          </div>
                        ))}
                        {matchResult.gaps.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-6">No critical candidate profile gaps detected!</p>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "evidence" && (
                      <motion.div
                        key="evidence"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="space-y-3"
                      >
                        {matchResult.evidence.map((snippet, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2
                            ${isDark ? "bg-dark-bg/60 border-dark-border" : "bg-light-bg border-light-border"}`}>
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                <span>{snippet.source}</span>
                              </span>
                              <span className={`font-semibold ${isDark ? "text-dark-accent" : "text-light-accent"}`}>
                                Similarity: {Math.round(snippet.score * 100)}%
                              </span>
                            </div>
                            <p className={`text-[11px] leading-relaxed italic ${isDark ? "text-slate-355" : "text-slate-700"}`}>
                              &quot;{snippet.text}&quot;
                            </p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              /* Empty Placeholder State */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed min-h-[350px] transition-colors duration-300
                  ${isDark ? "border-dark-border text-slate-500" : "border-light-border text-slate-400"}`}
              >
                <Layers className="w-8 h-8 mb-4 stroke-1 opacity-50" />
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-1">Awaiting spec analysis</h3>
                <p className="text-[10px] max-w-[200px] text-center opacity-60">
                  Select a candidate resume and enter target job requirements to generate a role fit report.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
