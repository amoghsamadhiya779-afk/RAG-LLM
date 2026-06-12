/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { motion } from "framer-motion";
import { Activity, Target, FileText, Code2, AlertTriangle, Lightbulb, PlayCircle, Sparkles, Zap, CheckCircle } from "lucide-react";

export const JobBoard = () => {
  const {
    uploadResume,
    analyzeResume,
    matchJobs,
    seedJobs,
    generateInterview,
    theme,
  } = useChat();

  const isDark = theme === "dark";

  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [atsScore, setAtsScore] = useState<any | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);
  const [activeTab, setActiveTab] = useState<"ats" | "jobs">("ats");
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    seedJobs().catch(() => {});
  }, [seedJobs]);

  const handleAnalyze = async () => {
    if (!resumeText.trim() && !resumeFile) return;
    setIsAnalyzing(true);
    try {
      let textToAnalyze = resumeText;
      if (resumeFile) {
        textToAnalyze = await uploadResume(resumeFile);
      }
      
      const data = await analyzeResume(textToAnalyze);
      setProfileData(data.profile);
      setAtsScore(data.scoring);

      const jobs = await matchJobs(data.profile);
      setMatchedJobs(jobs);
      setActiveTab("ats");
    } catch (e) {
      console.error(e);
    }
    setIsAnalyzing(false);
  };

  const handlePrepInterview = async (job: any) => {
    setSelectedJob(job);
    setInterviewQuestions([]);
    setIsGeneratingInterview(true);
    try {
      const data = await generateInterview(job.id, profileData);
      setInterviewQuestions(data.questions);
    } catch (e) {
      console.error(e);
    }
    setIsGeneratingInterview(false);
  };

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case "HIGH": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "MEDIUM": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "STRETCH": return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      default: return "text-red-400 bg-red-500/10 border-red-500/20";
    }
  };

  const getScoreDialColor = (score: number) => {
    if (score >= 80) return isDark ? "#34d399" : "#059669";
    if (score >= 50) return isDark ? "#fbbf24" : "#d97706";
    return isDark ? "#f87171" : "#dc2626";
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-6 sm:px-6 w-full max-w-[1280px] mx-auto select-text scrollbar-thin">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold tracking-tight uppercase transition-colors duration-300 ${isDark ? "text-dark-text-primary" : "text-light-text-primary"}`}>
            Job Intelligence Board
          </h1>
          <p className={`text-xs ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}>
            RAG-powered career compass: ATS Parsing, Skill Gap Analysis, and Intelligent Job Matching.
          </p>
        </div>
        {profileData && (
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("ats")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${activeTab === "ats" ? (isDark ? "bg-dark-elevated text-white shadow-md" : "bg-white text-light-accent shadow-md") : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black")}`}
            >
              ATS Analysis
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${activeTab === "jobs" ? (isDark ? "bg-dark-elevated text-white shadow-md" : "bg-white text-light-accent shadow-md") : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black")}`}
            >
              Job Recommendations
            </button>
          </div>
        )}
      </div>

      {!profileData ? (
        <div className={`p-6 rounded-2xl border glass-panel max-w-2xl mx-auto mt-10 transition-colors duration-300 ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white/50 border-light-border"}`}>
          <div className="flex items-center gap-3 mb-6">
            <FileText className={`w-5 h-5 ${isDark ? "text-dark-accent" : "text-light-accent"}`} />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Candidate Input</h2>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <label className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${isDark ? "border-dark-border hover:border-dark-accent/50 bg-dark-bg/50" : "border-light-border hover:border-light-accent/50 bg-light-bg/50"}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  <FileText className={`w-8 h-8 mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                  <p className={`mb-2 text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {resumeFile ? resumeFile.name : "Click to upload Resume (PDF, DOCX)"}
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>or drag and drop</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setResumeFile(e.target.files[0]);
                    setResumeText(""); // clear text if file uploaded
                  }
                }} />
              </label>
              
              <div className="flex items-center gap-4">
                <div className={`flex-1 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`}></div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>OR PASTE TEXT</span>
                <div className={`flex-1 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`}></div>
              </div>

              <textarea
                rows={8}
                placeholder="Paste the candidate's resume text here..."
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setResumeFile(null); // clear file if typing
                }}
                className={`w-full p-4 text-xs leading-relaxed rounded-xl border focus:outline-none transition-all duration-200 resize-none ${isDark ? "bg-dark-bg border-dark-border text-white focus:border-dark-accent/40" : "bg-light-bg border-light-border text-light-text-primary focus:border-light-accent/40"}`}
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!resumeText.trim() && !resumeFile)}
              className={`w-full p-3.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all duration-200 justify-center flex items-center gap-2
                ${isAnalyzing || (!resumeText.trim() && !resumeFile) ? "bg-slate-800 text-slate-500 border-transparent cursor-not-allowed opacity-50" : isDark ? "bg-dark-accent border-dark-accent text-dark-bg hover:bg-dark-accent-hover shadow-[0_4px_14px_rgba(129,140,248,0.2)]" : "bg-light-accent border-light-accent text-white hover:bg-light-accent-hover shadow-[0_4px_14px_rgba(79,70,229,0.15)]"}`}
            >
              {isAnalyzing ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Extracting Intelligence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Career Intelligence</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      ) : activeTab === "ats" ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className={`p-6 rounded-2xl border glass-panel flex flex-col items-center ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white/50 border-light-border"}`}>
              <div className="relative w-36 h-36 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="8" fill="transparent" />
                  <motion.circle
                    cx="60" cy="60" r="50" stroke={getScoreDialColor(atsScore?.total_score || 0)} strokeWidth="8" fill="transparent"
                    strokeDasharray={314.159}
                    initial={{ strokeDashoffset: 314.159 }}
                    animate={{ strokeDashoffset: 314.159 - ((atsScore?.total_score || 0) / 100) * 314.159 }}
                    transition={{ duration: 1.5, ease: "easeOut" }} strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold font-mono">{atsScore?.total_score}</span>
                  <span className={`text-[9px] uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>ATS Score</span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-center uppercase tracking-wider mb-2">{profileData.current_title}</h3>
              <p className={`text-xs text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {profileData.experience_years} years of experience • {profileData.education}
              </p>
            </div>
            <div className={`p-6 rounded-2xl border glass-panel ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white/50 border-light-border"}`}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2"><Target className="w-4 h-4" /> Scoring Breakdown</h4>
              <div className="space-y-4">
                {[
                  { label: "Formatting & Length", score: atsScore?.breakdown.formatting, max: 25 },
                  { label: "Skill Density", score: atsScore?.breakdown.content, max: 25 },
                  { label: "Action Verbs & Style", score: atsScore?.breakdown.style, max: 25 },
                  { label: "ATS Readiness", score: atsScore?.breakdown.match, max: 25 },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px] uppercase font-semibold mb-1">
                      <span>{item.label}</span>
                      <span className="font-mono text-slate-400">{item.score} / {item.max}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.score / item.max) * 100}%` }}
                        transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getScoreDialColor((item.score / item.max) * 100) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <div className={`p-6 rounded-2xl border glass-panel ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white/50 border-light-border"}`}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2"><Code2 className="w-4 h-4" /> Keyword Refiner</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {profileData.skills.map((skill: string, idx: number) => (
                  <span key={idx} className={`group flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-semibold rounded-lg border transition-all ${isDark ? "bg-white/5 border-white/10 text-slate-300" : "bg-black/5 border-black/10 text-slate-700"}`}>
                    {skill}
                    <button onClick={() => {
                      const updated = { ...profileData, skills: profileData.skills.filter((s: string) => s !== skill) };
                      setProfileData(updated);
                      matchJobs(updated).then(setMatchedJobs).catch(console.error);
                    }} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSkill.trim()) {
                      const skill = newSkill.trim();
                      if (!profileData.skills.includes(skill)) {
                        const updated = { ...profileData, skills: [...profileData.skills, skill] };
                        setProfileData(updated);
                        matchJobs(updated).then(setMatchedJobs).catch(console.error);
                      }
                      setNewSkill("");
                    }
                  }}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none ${isDark ? "bg-dark-bg border-dark-border text-white" : "bg-light-bg border-light-border text-black"}`}
                />
                <button onClick={() => {
                  if (newSkill.trim()) {
                    const skill = newSkill.trim();
                    if (!profileData.skills.includes(skill)) {
                      const updated = { ...profileData, skills: [...profileData.skills, skill] };
                      setProfileData(updated);
                      matchJobs(updated).then(setMatchedJobs).catch(console.error);
                    }
                    setNewSkill("");
                  }
                }} className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border ${isDark ? "bg-dark-elevated border-dark-border hover:bg-dark-accent/20" : "bg-light-bg border-light-border hover:bg-light-accent/10"}`}>Add</button>
              </div>
              <div className="pt-3 border-t border-white/5">
                <h5 className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-slate-500">Suggested Missing Keywords</h5>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(matchedJobs.flatMap(j => j.missing_skills))).slice(0, 8).map((ms: string, i: number) => (
                    <button key={i} onClick={() => {
                      if (!profileData.skills.includes(ms)) {
                        const updated = { ...profileData, skills: [...profileData.skills, ms] };
                        setProfileData(updated);
                        matchJobs(updated).then(setMatchedJobs).catch(console.error);
                      }
                    }} className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30" : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"}`}>
                      + {ms}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={`p-6 rounded-2xl border glass-panel ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white/50 border-light-border"}`}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> ATS Recommendations</h4>
              <div className="space-y-3">
                {atsScore?.logs.map((log: string, idx: number) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border text-xs leading-relaxed ${isDark ? "bg-dark-bg border-dark-border text-slate-300" : "bg-light-bg border-light-border text-slate-700"}`}>
                    {log.toLowerCase().includes("weak") || log.toLowerCase().includes("few") || log.toLowerCase().includes("missing") || log.toLowerCase().includes("high") ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                    )}
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          {!selectedJob ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedJobs.map((job) => (
                <motion.div whileHover={{ y: -4 }} key={job.id} className={`p-5 rounded-2xl border glass-panel flex flex-col gap-4 cursor-pointer transition-all duration-300 ${isDark ? "bg-dark-surface/50 border-dark-border hover:border-dark-accent/50" : "bg-white/50 border-light-border hover:border-light-accent/50"}`} onClick={() => handlePrepInterview(job)}>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm leading-tight">{job.title}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${getConfidenceColor(job.application_confidence)}`}>
                        {job.application_confidence}
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{job.company} • {job.location}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-black/10 p-2.5 rounded-xl border border-white/5">
                    <div className="relative w-10 h-10 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="10" fill="transparent" />
                        <circle cx="60" cy="60" r="50" stroke={getScoreDialColor(job.match_score)} strokeWidth="10" fill="transparent" strokeDasharray={314.159} strokeDashoffset={314.159 - (job.match_score / 100) * 314.159} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-bold font-mono">{job.match_score}</span></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1">Match Score</div>
                      <div className="flex gap-1 overflow-hidden h-1.5 w-full bg-black/20 rounded-full">
                        <div className="bg-indigo-500 rounded-full" style={{ width: `${job.skill_match_percentage}%` }} title="Skill Match" />
                        <div className="bg-emerald-500 rounded-full" style={{ width: `${100 - job.skill_match_percentage}%` }} title="Semantic Context Match" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.missing_skills.slice(0, 3).map((ms: string, i: number) => (
                         <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>Missing: {ms}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 ${isDark ? "bg-dark-elevated border-dark-border hover:bg-dark-accent/20 hover:text-dark-accent hover:border-dark-accent/30" : "bg-light-bg border-light-border hover:bg-light-accent/10 hover:text-light-accent hover:border-light-accent/30"}`}>
                        <PlayCircle className="w-3.5 h-3.5" /> Prep
                      </button>
                      {job.href && (
                        <a href={job.href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 ${isDark ? "bg-dark-accent text-dark-bg border-dark-accent hover:bg-dark-accent-hover" : "bg-light-accent text-white border-light-accent hover:bg-light-accent-hover"}`}>
                          Apply Now
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`p-6 rounded-2xl border glass-panel ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white/50 border-light-border"}`}>
              <button onClick={() => setSelectedJob(null)} className={`mb-6 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black"}`}>
                ← Back to Matches
              </button>
              
              <div className="flex items-start justify-between border-b pb-6 mb-6 border-white/10">
                <div>
                  <h2 className="text-xl font-bold">{selectedJob.title}</h2>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{selectedJob.company} • {selectedJob.location}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${getConfidenceColor(selectedJob.application_confidence)}`}>
                  {selectedJob.match_score}% Match
                </div>
              </div>

              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> AI Interview Simulation</h3>
              
              {isGeneratingInterview ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Activity className={`w-8 h-8 mb-4 animate-pulse ${isDark ? "text-dark-accent" : "text-light-accent"}`} />
                  <p className="text-xs uppercase tracking-widest animate-pulse font-semibold">Generating tailored questions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviewQuestions.map((q, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${isDark ? "bg-dark-bg/60 border-dark-border" : "bg-light-bg border-light-border"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${q.type === "technical" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : q.type === "behavioral" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                          {q.type}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-relaxed mb-3">{q.question}</p>
                      <div className={`p-3 rounded-lg border text-xs leading-relaxed ${isDark ? "bg-black/30 border-white/5 text-slate-300" : "bg-white border-black/5 text-slate-700"}`}>
                        <span className="font-bold opacity-70 block mb-1 uppercase tracking-wider text-[10px]">Evaluation Guide:</span>
                        {q.answer_guide}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
