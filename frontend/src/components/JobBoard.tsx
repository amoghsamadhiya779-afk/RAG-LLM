/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Target, FileText, Code2, AlertTriangle, Lightbulb, PlayCircle, Sparkles, Zap, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

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

  const [expandedAccordion, setExpandedAccordion] = useState<string | null>("formatting");

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
        // Also set a simulated preview text if empty so we see something in the left pane
        if (!resumeText) setResumeText("Scanning document...\n\nExtracting skills...\n\nEvaluating ATS keywords...");
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

  const toggleAccordion = (id: string) => {
    if (expandedAccordion === id) {
      setExpandedAccordion(null);
    } else {
      setExpandedAccordion(id);
    }
  };

  const accordions = [
    { id: "formatting", label: "Formatting & Length", score: atsScore?.breakdown?.formatting || 0, max: 25, tip: "Keep your resume to 1-2 pages. Ensure a clean structure with standard headings (Experience, Education, Skills) for ATS parsers to read easily." },
    { id: "content", label: "Skill Density", score: atsScore?.breakdown?.content || 0, max: 25, tip: "Your resume needs a higher density of hard skills relevant to the roles you apply for. Add tools, frameworks, and methodologies." },
    { id: "style", label: "Action Verbs & Style", score: atsScore?.breakdown?.style || 0, max: 25, tip: "Start bullet points with strong action verbs (e.g., Architected, Spearheaded, Optimized) instead of passive phrases like 'Responsible for'." },
    { id: "match", label: "ATS Readiness", score: atsScore?.breakdown?.match || 0, max: 25, tip: "Avoid complex tables, columns, or graphics. Standard text formatting ensures the ATS accurately extracts your contact info and timeline." },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-6 sm:px-8 w-full mx-auto select-text scrollbar-thin">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-[1400px] mx-auto w-full">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${isDark ? "text-dark-text-primary" : "text-light-text-primary"}`}>
            Resume Checker & Job Match
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}>
            Get your ATS score, actionable feedback, and matched opportunities.
          </p>
        </div>
        {profileData && (
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 shadow-inner">
            <button
              onClick={() => setActiveTab("ats")}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === "ats" ? (isDark ? "bg-dark-elevated text-white shadow-lg shadow-black/50" : "bg-white text-light-accent shadow-md") : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black")}`}
            >
              Feedback
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === "jobs" ? (isDark ? "bg-dark-elevated text-white shadow-lg shadow-black/50" : "bg-white text-light-accent shadow-md") : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black")}`}
            >
              Jobs
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1400px] mx-auto w-full">
        
        {/* LEFT PANE: Input / Preview */}
        <div className={`relative rounded-[2rem] border overflow-hidden flex flex-col transition-colors duration-300 ${isDark ? "bg-dark-surface/30 border-dark-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : "bg-white border-light-border shadow-[0_8px_32px_rgba(0,0,0,0.05)]"}`}>
          
          <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? "border-dark-border bg-dark-surface/50" : "border-light-border bg-slate-50"}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <FileText className={`w-4 h-4 ${isDark ? "text-dark-accent" : "text-light-accent"}`} />
              Document Preview
            </h2>
            {profileData && (
              <span className={`text-[10px] font-mono px-2 py-1 rounded-md ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Parsed Successfully
              </span>
            )}
          </div>

          <div className="flex-1 p-6 relative overflow-y-auto scrollbar-thin">
            {!profileData && !isAnalyzing ? (
              // Upload State
              <div className="h-full flex flex-col justify-center items-center">
                <label className={`w-full max-w-md flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 group ${isDark ? "border-dark-border hover:border-dark-accent bg-dark-bg/50" : "border-light-border hover:border-light-accent bg-light-bg/50"}`}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2 shadow-lg" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}>
                    <FileText className={`w-8 h-8 ${isDark ? "text-slate-300" : "text-slate-600"}`} />
                  </div>
                  <p className={`mb-3 text-lg font-bold text-center ${isDark ? "text-white" : "text-slate-800"}`}>
                    {resumeFile ? resumeFile.name : "Drop your resume here"}
                  </p>
                  <p className={`text-sm text-center px-4 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                    Support for PDF, DOCX, and TXT files. We'll automatically parse and grade it.
                  </p>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setResumeFile(e.target.files[0]);
                      setResumeText(""); 
                    }
                  }} />
                </label>
                
                <div className="flex items-center gap-4 w-full max-w-md my-8">
                  <div className={`flex-1 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`}></div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>OR PASTE TEXT</span>
                  <div className={`flex-1 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`}></div>
                </div>

                <textarea
                  rows={5}
                  placeholder="Paste the candidate's resume text here..."
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setResumeFile(null);
                  }}
                  className={`w-full max-w-md p-5 text-sm leading-relaxed rounded-2xl border focus:outline-none transition-all duration-300 resize-none shadow-inner ${isDark ? "bg-dark-bg border-dark-border text-white focus:border-dark-accent" : "bg-light-bg border-light-border text-light-text-primary focus:border-light-accent"}`}
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={!resumeText.trim() && !resumeFile}
                  className={`mt-8 w-full max-w-md py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-300 justify-center flex items-center gap-2
                    ${(!resumeText.trim() && !resumeFile) ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50" : isDark ? "bg-dark-accent text-dark-bg shadow-[0_0_20px_rgba(129,140,248,0.4)]" : "bg-light-accent text-white shadow-[0_4px_14px_rgba(79,70,229,0.3)]"}`}
                >
                  <Sparkles className="w-5 h-5" />
                  Grade My Resume
                </motion.button>
              </div>
            ) : (
              // Preview State & Scanning Animation
              <div className="relative h-full text-sm font-mono leading-relaxed whitespace-pre-wrap">
                {isAnalyzing && (
                  <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
                    <div className="absolute w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] animate-scan"></div>
                    <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
                  </div>
                )}
                <div className={`opacity-${isAnalyzing ? "50" : "100"} transition-opacity duration-500`}>
                  {resumeText || "Analyzing uploaded document... Please wait as we extract content and calculate ATS compatibility."}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Dashboard & Feedback */}
        <div className="flex flex-col h-full space-y-6">
          {isAnalyzing ? (
             <div className={`flex-1 rounded-[2rem] border flex flex-col items-center justify-center ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white border-light-border"}`}>
               <Activity className={`w-12 h-12 mb-4 animate-pulse ${isDark ? "text-dark-accent" : "text-light-accent"}`} />
               <h3 className="text-xl font-bold animate-pulse">Running AI Analysis...</h3>
               <p className={`text-sm mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Checking grammar, scanning ATS keywords, and scoring.</p>
             </div>
          ) : profileData && activeTab === "ats" ? (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-6">
               
               {/* Speedometer Card */}
               <div className={`p-8 rounded-[2rem] border flex flex-col sm:flex-row items-center gap-8 shadow-sm ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white border-light-border"}`}>
                 <div className="relative w-48 h-48 flex-shrink-0">
                   <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                     <circle cx="60" cy="60" r="50" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="10" fill="transparent" />
                     <motion.circle
                       cx="60" cy="60" r="50" stroke={getScoreDialColor(atsScore?.total_score || 0)} strokeWidth="10" fill="transparent"
                       strokeDasharray={314.159}
                       initial={{ strokeDashoffset: 314.159 }}
                       animate={{ strokeDashoffset: 314.159 - ((atsScore?.total_score || 0) / 100) * 314.159 }}
                       transition={{ duration: 1.8, ease: "easeOut", type: "spring", bounce: 0.2 }} strokeLinecap="round"
                     />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                     <motion.span 
                       initial={{ opacity: 0, scale: 0.5 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: 0.5, duration: 0.5 }}
                       className="text-5xl font-black tracking-tighter"
                       style={{ color: getScoreDialColor(atsScore?.total_score || 0) }}
                     >
                       {atsScore?.total_score}
                     </motion.span>
                     <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Overall Score</span>
                   </div>
                 </div>
                 
                 <div className="flex-1 text-center sm:text-left">
                   <h2 className="text-2xl font-bold mb-2">{profileData.current_title}</h2>
                   <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                     {profileData.experience_years} years exp • {profileData.education}
                   </p>
                   <div className={`p-3 rounded-xl border ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                     <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                       <Lightbulb className="w-4 h-4 inline mr-2 text-yellow-500" />
                       Your resume is structured well, but could use more quantifiable metrics in the bullet points.
                     </p>
                   </div>
                 </div>
               </div>

               {/* Accordions */}
               <div className="space-y-3">
                 {accordions.map((acc, idx) => (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 * idx }}
                     key={acc.id} 
                     className={`rounded-2xl border overflow-hidden transition-colors ${isDark ? "bg-dark-surface/30 border-dark-border" : "bg-white border-light-border"}`}
                   >
                     <button 
                       onClick={() => toggleAccordion(acc.id)}
                       className="w-full px-6 py-4 flex items-center justify-between outline-none"
                     >
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${getScoreDialColor((acc.score / acc.max) * 100)}20`, color: getScoreDialColor((acc.score / acc.max) * 100) }}>
                           {acc.score}/{acc.max}
                         </div>
                         <span className="font-semibold text-sm">{acc.label}</span>
                       </div>
                       {expandedAccordion === acc.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                     </button>
                     
                     <AnimatePresence>
                       {expandedAccordion === acc.id && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: "auto", opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           transition={{ duration: 0.3 }}
                         >
                           <div className={`px-6 pb-5 pt-2 text-sm leading-relaxed border-t ${isDark ? "border-dark-border text-slate-300 bg-dark-surface/50" : "border-light-border text-slate-600 bg-slate-50"}`}>
                             {acc.tip}
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </motion.div>
                 ))}
               </div>

               {/* Keyword Refiner */}
               <div className={`p-6 rounded-2xl border ${isDark ? "bg-dark-surface/50 border-dark-border" : "bg-white border-light-border"}`}>
                 <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Target className="w-4 h-4" /> Detected ATS Keywords
                 </h4>
                 <div className="flex flex-wrap gap-2 mb-4">
                   {profileData.skills.map((skill: string, idx: number) => (
                     <motion.span 
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ delay: idx * 0.05 }}
                       key={idx} 
                       className={`group relative flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-default overflow-hidden transition-all ${isDark ? "bg-dark-elevated border-dark-border hover:border-red-500/50" : "bg-white border-light-border hover:border-red-500/50 shadow-sm"}`}
                     >
                       {skill}
                       <button onClick={() => {
                         const updated = { ...profileData, skills: profileData.skills.filter((s: string) => s !== skill) };
                         setProfileData(updated);
                         matchJobs(updated).then(setMatchedJobs).catch(console.error);
                       }} className="absolute right-0 top-0 bottom-0 px-2 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         ×
                       </button>
                     </motion.span>
                   ))}
                 </div>
                 <div className="flex gap-2">
                   <input
                     type="text"
                     value={newSkill}
                     onChange={(e) => setNewSkill(e.target.value)}
                     placeholder="Add a missing skill..."
                     onKeyDown={(e) => {
                       if (e.key === "Enter" && newSkill.trim()) {
                         const updated = { ...profileData, skills: [...profileData.skills, newSkill.trim()] };
                         setProfileData(updated);
                         setNewSkill("");
                         matchJobs(updated).then(setMatchedJobs).catch(console.error);
                       }
                     }}
                     className={`flex-1 px-3 py-2 text-xs rounded-lg border focus:outline-none ${isDark ? "bg-dark-bg border-dark-border focus:border-dark-accent" : "bg-white border-light-border focus:border-light-accent"}`}
                   />
                   <button
                     onClick={() => {
                       if (newSkill.trim()) {
                         const updated = { ...profileData, skills: [...profileData.skills, newSkill.trim()] };
                         setProfileData(updated);
                         setNewSkill("");
                         matchJobs(updated).then(setMatchedJobs).catch(console.error);
                       }
                     }}
                     className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${isDark ? "bg-dark-accent text-dark-bg hover:bg-dark-accent-hover" : "bg-light-accent text-white hover:bg-light-accent-hover"}`}
                   >
                     Add
                   </button>
                 </div>
               </div>

             </motion.div>
          ) : profileData && activeTab === "jobs" ? (
             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
               {matchedJobs.length === 0 ? (
                 <div className="text-center py-10 opacity-50 text-sm">Searching the market for optimal roles...</div>
               ) : (
                 matchedJobs.map((job, idx) => (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     key={job.id}
                     className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-dark-surface/50 border-dark-border hover:border-dark-accent/30" : "bg-white border-light-border hover:border-light-accent/30 shadow-sm"}`}
                   >
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <h3 className="font-bold text-lg">{job.title}</h3>
                         <div className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                           {job.company} • {job.location || "Remote"} • {job.salary_range || "Competitive"}
                         </div>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getConfidenceColor(job.application_confidence)}`}>
                           {job.application_confidence} MATCH
                         </span>
                         <span className={`text-xs font-mono font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                           {job.match_score}% Score
                         </span>
                       </div>
                     </div>
                     <div className="mb-4">
                       <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Missing Skills</div>
                       <div className="flex flex-wrap gap-1.5">
                         {job.missing_skills?.length > 0 ? job.missing_skills.map((ms: string, i: number) => (
                           <span key={i} className={`px-2 py-0.5 text-[10px] font-mono rounded border ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                             {ms}
                           </span>
                         )) : (
                           <span className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Perfect stack match!</span>
                         )}
                       </div>
                     </div>
                     <div className="flex gap-2">
                       {job.href ? (
                         <a href={job.href} target="_blank" rel="noreferrer" className={`flex-1 py-2 rounded-lg text-xs font-bold text-center transition-colors ${isDark ? "bg-dark-elevated hover:bg-dark-border text-white" : "bg-slate-100 hover:bg-slate-200 text-black"}`}>
                           View Application
                         </a>
                       ) : null}
                       <button
                         onClick={() => handlePrepInterview(job)}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${isDark ? "bg-dark-accent text-dark-bg hover:bg-dark-accent-hover" : "bg-light-accent text-white hover:bg-light-accent-hover"}`}
                       >
                         {isGeneratingInterview && selectedJob?.id === job.id ? "Generating..." : "Generate Interview"}
                       </button>
                     </div>
                   </motion.div>
                 ))
               )}

               {/* Interview Questions Modal / Inline */}
               <AnimatePresence>
                 {interviewQuestions.length > 0 && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                     <div className={`p-6 rounded-2xl border mt-6 ${isDark ? "bg-dark-surface/80 border-dark-border" : "bg-slate-50 border-light-border shadow-inner"}`}>
                       <div className="flex items-center justify-between mb-4">
                         <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                           <PlayCircle className="w-5 h-5" /> Mock Interview
                         </h4>
                         <button onClick={() => setInterviewQuestions([])} className="text-xs opacity-50 hover:opacity-100">Close</button>
                       </div>
                       <div className="space-y-4">
                         {interviewQuestions.map((iq, idx) => (
                           <div key={idx} className={`p-4 rounded-xl border ${isDark ? "bg-dark-bg/50 border-white/5" : "bg-white border-black/5 shadow-sm"}`}>
                             <div className="flex items-center gap-2 mb-2">
                               <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}>
                                 {iq.type}
                               </span>
                             </div>
                             <p className="font-semibold text-sm mb-2">{iq.question}</p>
                             <p className={`text-xs italic ${isDark ? "text-slate-400" : "text-slate-500"}`}>{iq.answer_guide}</p>
                           </div>
                         ))}
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
