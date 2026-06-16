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
  } = useChat();

  const [selectedDoc, setSelectedDoc] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"strengths" | "gaps" | "evidence">("strengths");

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const text = await uploadResume(file);
      await ingestDocument(file.name, text);
      setSelectedDoc(file.name);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to upload document.");
    }
    setIsUploading(false);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim() || !jobDescription.trim()) return;
    setErrorMsg(null);
    try {
      await runMatchEvaluation(roleTitle, jobDescription);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to run match evaluation.");
    }
  };

  // SVG parameters for the radial match score dial
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const score = matchResult?.match_score || 0;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-8 sm:px-12 w-full max-w-[1400px] mx-auto select-text scrollbar-thin">
      
      {/* Page Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">
            Profile Evaluator
          </h1>
          <p className="text-sm mt-2 text-gray-600 font-medium">
            Cross-evaluate candidate credentials against role requirements using semantic search embeddings.
          </p>
        </div>
        {matchResult && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearMatchResult}
            className="px-5 py-2.5 rounded-lg border border-white/40 bg-white/60 backdrop-blur-md text-gray-900 text-sm font-semibold transition-all shadow-sm hover:bg-transparent"
          >
            Reset Analysis
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Form Panel */}
        <div className="lg:col-span-5">
          <div className="p-8 rounded-2xl clay-card">
            
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-[var(--color-primary-600)]" />
              <h2 className="text-lg font-semibold text-gray-900">Evaluation Specs</h2>
            </div>

            <form onSubmit={handleEvaluate} className="space-y-6">
              {/* Select Resume Document */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">
                  Candidate Profile Index
                </label>
                <select
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-white/40 bg-transparent text-gray-900 focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--accent)] transition-all cursor-pointer shadow-sm"
                >
                  <option value="">Select Ingested Document...</option>
                  {ingestedDocs.map((doc, idx) => (
                    <option key={idx} value={doc}>{doc}</option>
                  ))}
                </select>

                <div className="flex items-center gap-4 py-4">
                  <div className="flex-1 h-px bg-[var(--border)]"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">OR UPLOAD NEW</span>
                  <div className="flex-1 h-px bg-[var(--border)]"></div>
                </div>

                <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/40 rounded-xl cursor-pointer transition-all hover:bg-[var(--color-primary-100)] hover:border-[var(--color-primary-500)] bg-transparent">
                  <div className="flex flex-col items-center justify-center text-center">
                    <FileText className="w-6 h-6 mb-3 text-gray-600" />
                    <p className="mb-1 text-sm font-semibold text-gray-900">
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
                <label className="text-xs font-semibold text-gray-600">
                  Target Role Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-white/40 bg-transparent text-gray-900 focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-sm"
                />
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">
                  Job Description / Role Specs (Min 50 chars)
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Paste details of target qualifications, stack preferences, and role parameters..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-white/40 bg-transparent text-gray-900 focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none shadow-sm"
                />
              </div>

              {errorMsg && (
                <div className="p-3 border border-red-500/20 bg-red-500/10 rounded-xl text-red-500 text-sm text-center">
                  {errorMsg}
                </div>
              )}

              {/* Run Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={matchLoading || !roleTitle.trim() || jobDescription.trim().length < 50}
                className={`w-full p-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md
                  ${
                    matchLoading || !roleTitle.trim() || jobDescription.trim().length < 50
                      ? "bg-white/60 backdrop-blur-md text-gray-500 border border-white/40 cursor-not-allowed"
                      : "bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]"
                  }
                `}
              >
                {matchLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Evaluating Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
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
                className="flex flex-col items-center justify-center p-12 rounded-2xl clay-card min-h-[500px]"
              >
                <div className="relative w-20 h-20 mb-6">
                  <motion.div
                    className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[var(--color-primary-500)]"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  />
                  <Layers className="absolute inset-0 m-auto w-8 h-8 animate-pulse-subtle text-[var(--color-primary-600)]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Vector Index Retrieval</h3>
                <p className="text-sm max-w-[300px] text-center text-gray-600">
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
                className="p-8 rounded-2xl clay-card flex flex-col gap-8 min-h-[500px]"
              >
                {/* Score & Radial Dial */}
                <div className="flex flex-col sm:flex-row items-center gap-8 pb-6 border-b border-white/40">
                  {/* SVG radial progress dial */}
                  <div className="relative w-32 h-32 shrink-0 select-none">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="var(--border)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      <motion.circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="var(--accent)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">{score}%</span>
                      <span className="text-[10px] uppercase font-semibold text-gray-600 tracking-wider">
                        Match
                      </span>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">{matchResult.role_title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Semantically verified. The candidate profile matches the target specifications with a coefficient score of {score}/100.
                    </p>
                    <div className="pt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border
                        ${score >= 80 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                          : score >= 50 
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                          : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                        {score >= 80 ? "High Fit" : score >= 50 ? "Moderate Fit" : "Low Fit"}
                      </span>
                      <span className="text-xs font-medium px-3 py-1 rounded-full border bg-white/60 backdrop-blur-md border-white/40 text-gray-600">
                        {matchResult.evidence.length} chunks retrieved
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex border-b border-white/40 p-1 rounded-xl bg-white/60 backdrop-blur-md self-start shadow-sm">
                  {[
                    { id: "strengths", name: "Strengths", count: matchResult.strengths.length },
                    { id: "gaps", name: "Gaps", count: matchResult.gaps.length },
                    { id: "evidence", name: "RAG Evidence", count: matchResult.evidence.length },
                  ].map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as "strengths" | "gaps" | "evidence")}
                        className={`text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-2
                          ${
                            isSelected
                              ? "bg-transparent text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }
                        `}
                      >
                        <span>{tab.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-[var(--color-primary-100)] text-[var(--color-primary-600)]" : "bg-[var(--border)] text-gray-500"}`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content Panels */}
                <div className="flex-1 min-h-[250px]">
                  <AnimatePresence mode="wait">
                    {activeTab === "strengths" && (
                      <motion.div
                        key="strengths"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="space-y-3"
                      >
                        {matchResult.strengths.map((str, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-white/40 bg-white/60 backdrop-blur-md text-sm leading-relaxed text-gray-900 shadow-sm">
                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                            <span>{str}</span>
                          </div>
                        ))}
                        {matchResult.strengths.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-10">No specific semantic strengths evaluated.</p>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "gaps" && (
                      <motion.div
                        key="gaps"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="space-y-3"
                      >
                        {matchResult.gaps.map((gap, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-white/40 bg-white/60 backdrop-blur-md text-sm leading-relaxed text-gray-900 shadow-sm">
                            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                            <span>{gap}</span>
                          </div>
                        ))}
                        {matchResult.gaps.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-10">No critical candidate profile gaps detected!</p>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "evidence" && (
                      <motion.div
                        key="evidence"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="space-y-4"
                      >
                        {matchResult.evidence.map((snippet, idx) => (
                          <div key={idx} className="p-5 rounded-xl border border-white/40 bg-white/60 backdrop-blur-md flex flex-col gap-3 shadow-sm">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                              <span className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                <span>{snippet.source}</span>
                              </span>
                              <span className="text-[var(--color-primary-600)] bg-[var(--color-primary-100)] px-2.5 py-1 rounded-full">
                                Similarity: {Math.round(snippet.score * 100)}%
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed italic text-gray-900 opacity-90 border-l-2 border-white/40 pl-4">
                              "{snippet.text}"
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
                className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/40 bg-transparent min-h-[500px]"
              >
                <Layers className="w-12 h-12 mb-6 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Awaiting Analysis</h3>
                <p className="text-sm max-w-[300px] text-center text-gray-600 leading-relaxed">
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
