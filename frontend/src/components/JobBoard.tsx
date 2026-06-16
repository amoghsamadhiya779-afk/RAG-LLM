"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, PlayCircle, Sparkles, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const JobBoard = () => {
  const { uploadResume, analyzeResume, matchJobs, seedJobs, generateInterview } = useChat();

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [expandedAccordion, setExpandedAccordion] = useState<string | null>("formatting");

  useEffect(() => {
    seedJobs().catch(() => {});
  }, [seedJobs]);

  const handleAnalyze = async () => {
    if (!resumeText.trim() && !resumeFile) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      let textToAnalyze = resumeText;
      if (resumeFile) {
        textToAnalyze = await uploadResume(resumeFile);
        if (!resumeText) setResumeText("SCANNING DOCUMENT...\n\nEXTRACTING TOKENS...\n\nINITIALIZING AI MODEL...");
      }
      const data = await analyzeResume(textToAnalyze);
      setProfileData(data.profile);
      setAtsScore(data.scoring);
      const jobs = await matchJobs(data.profile);
      setMatchedJobs(jobs);
      setActiveTab("ats");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Network Error: Unable to connect to the backend API.");
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
      case "HIGH": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
      case "MEDIUM": return "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]";
      case "STRETCH": return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.3)]";
      default: return "text-red-400 bg-red-500/10 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
    }
  };

  const toggleAccordion = (id: string) => setExpandedAccordion(expandedAccordion === id ? null : id);

  const accordions = [
    { id: "formatting", label: "Formatting & Parse Rate", score: atsScore?.breakdown?.formatting || 0, max: 25, tip: "Ideal formatting length detected for seamless ATS parsing." },
    { id: "content", label: "Keyword Density", score: atsScore?.breakdown?.content || 0, max: 25, tip: "Hard skill density matched against global indices." },
    { id: "style", label: "Action Verbs", score: atsScore?.breakdown?.style || 0, max: 25, tip: "Action verbs and dynamic vocabulary scoring." },
    { id: "match", label: "Global AI Match", score: atsScore?.breakdown?.match || 0, max: 25, tip: "Overall semantic similarity against premium tech roles." },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-8 sm:px-12 w-full mx-auto select-text scrollbar-thin">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 max-w-[1400px] mx-auto w-full">
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-bold tracking-tight text-white neon-text uppercase font-sans">
            Strategic Matrix
          </h1>
          <p className="text-sm mt-2 text-white/50 font-mono tracking-widest uppercase">
            System Online // Awaiting Target Resume Data
          </p>
        </motion.div>
        
        {profileData && (
          <motion.div variants={itemVariants} className="flex bg-black/40 p-1.5 rounded-lg border border-[var(--accent)]/30 shadow-[inset_0_0_10px_rgba(45,226,230,0.1)]">
            <button
              onClick={() => setActiveTab("ats")}
              className={`px-8 py-2.5 rounded-md text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === "ats" ? "bg-[var(--accent)] text-black neon-glow" : "text-white/40 hover:text-[var(--accent)]"}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-8 py-2.5 rounded-md text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === "jobs" ? "bg-[var(--accent)] text-black neon-glow" : "text-white/40 hover:text-[var(--accent)]"}`}
            >
              Targets
            </button>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-[1400px] mx-auto w-full">
        
        {/* LEFT PANE: Terminal Preview */}
        <motion.div variants={itemVariants} className="relative glass-panel-premium overflow-hidden flex flex-col min-h-[600px]">
          <div className="px-6 py-4 border-b border-[var(--accent)]/20 bg-black/40 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--accent)]">
              <FileText className="w-4 h-4" /> Root_Terminal_Input
            </h2>
            {profileData && (
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                VERIFIED
              </span>
            )}
          </div>

          <div className="flex-1 p-8 relative overflow-y-auto scrollbar-thin">
            {!profileData && !isAnalyzing ? (
              <div className="h-full flex flex-col justify-center items-center">
                <label className="w-full max-w-md flex flex-col items-center justify-center p-12 border border-dashed border-[var(--accent)]/40 rounded-xl cursor-pointer transition-all duration-300 hover:bg-[var(--accent)]/5 hover:border-[var(--accent)] group bg-black/20">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 bg-[var(--accent)]/10 shadow-[0_0_20px_rgba(45,226,230,0.2)]">
                    <Sparkles className="w-8 h-8 text-[var(--accent)]" />
                  </div>
                  <p className="mb-3 text-lg font-bold text-center text-white font-mono uppercase tracking-widest">
                    {resumeFile ? resumeFile.name : "DROP DATA FILE"}
                  </p>
                  <p className="text-xs text-center px-4 text-white/40 font-mono">
                    System accepts .pdf, .docx, .txt formats.
                  </p>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setResumeFile(e.target.files[0]);
                      setResumeText(""); 
                    }
                  }} />
                </label>
                
                <div className="flex items-center gap-4 w-full max-w-md my-8 opacity-40">
                  <div className="flex-1 h-px bg-[var(--accent)]"></div>
                  <span className="text-[10px] font-mono text-[var(--accent)]">OR INJECT TEXT</span>
                  <div className="flex-1 h-px bg-[var(--accent)]"></div>
                </div>

                <textarea
                  rows={6}
                  placeholder=">_ Paste raw data stream here..."
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setResumeFile(null);
                  }}
                  className="w-full max-w-md p-5 text-sm leading-relaxed rounded-xl border border-[var(--accent)]/20 bg-black/40 text-[var(--accent)] font-mono focus:outline-none focus:border-[var(--accent)] transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] resize-none"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAnalyze}
                  disabled={!resumeText.trim() && !resumeFile}
                  className={`mt-8 w-full max-w-md py-4 rounded-xl text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 font-mono
                    ${(!resumeText.trim() && !resumeFile) ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5" : "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)] neon-glow hover:bg-[var(--accent)] hover:text-black"}`}
                >
                  <PlayCircle className="w-5 h-5" /> Execute Scan
                </motion.button>
                
                {errorMsg && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 border border-red-500/50 bg-red-500/10 rounded-xl text-red-400 font-mono text-sm max-w-md w-full text-center">
                    {errorMsg}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="h-full w-full font-mono text-sm leading-loose">
                {isAnalyzing && (
                  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute left-0 right-0 h-1 bg-[var(--accent)] animate-scan shadow-[0_0_20px_var(--accent)]" />
                  </div>
                )}
                <div className={`relative z-10 whitespace-pre-wrap ${isAnalyzing ? "text-[var(--accent)] animate-pulse" : "text-white/70"}`}>
                  {resumeText || (resumeFile ? `Scanning file: ${resumeFile.name}...` : "")}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT PANE: Analysis / Output */}
        <div className="relative flex flex-col h-full min-h-[600px]">
          {isAnalyzing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-t-2 border-[var(--accent)] animate-spin opacity-50 shadow-[0_0_15px_var(--accent)]"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-[var(--accent)] animate-spin opacity-30 animation-delay-200"></div>
                <div className="absolute inset-4 rounded-full border-b-2 border-[var(--accent)] animate-spin opacity-10 animation-delay-500"></div>
                <Sparkles className="w-8 h-8 text-[var(--accent)] animate-pulse" />
              </div>
              <p className="mt-8 text-sm font-mono uppercase tracking-[0.3em] text-[var(--accent)] neon-text">Processing Vectors...</p>
            </motion.div>
          ) : profileData && activeTab === "ats" ? (
             <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin">
               
               <div className="glass-panel-premium p-8 flex flex-col items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,226,230,0.1),transparent_70%)]" />
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-6 font-mono z-10">Global Fit Index</h3>
                 <div className="relative w-48 h-48 flex items-center justify-center z-10">
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                     <motion.circle
                       initial={{ strokeDasharray: "0 1000" }}
                       animate={{ strokeDasharray: `${atsScore?.total_score ? (atsScore.total_score / 100) * 552.9 : 0} 1000` }}
                       transition={{ duration: 2, ease: "easeOut" }}
                       cx="96" cy="96" r="88"
                       stroke="var(--accent)"
                       strokeWidth="8"
                       strokeLinecap="round"
                       fill="none"
                       style={{ filter: "drop-shadow(0 0 10px var(--accent))" }}
                     />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-6xl font-black text-white font-mono neon-text">{atsScore?.total_score || 0}</span>
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                 {accordions.map((acc, i) => (
                   <motion.div variants={itemVariants} key={acc.id} className="glass-panel-premium border-white/5 rounded-xl overflow-hidden bg-black/40">
                     <button
                       onClick={() => toggleAccordion(acc.id)}
                       className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--accent)]/5 transition-colors"
                     >
                       <div className="flex items-center gap-4 w-full">
                         <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-sm font-black font-mono text-[var(--accent)]">
                           {acc.score}
                         </div>
                         <div className="flex-1">
                           <h4 className="font-bold text-white uppercase tracking-wider font-sans">{acc.label}</h4>
                           <div className="w-full bg-white/5 h-1.5 mt-2 rounded-full overflow-hidden relative">
                             <motion.div
                               initial={{ width: 0 }}
                               animate={{ width: `${(acc.score / acc.max) * 100}%` }}
                               transition={{ duration: 1, delay: 0.5 }}
                               className="h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"
                             />
                           </div>
                         </div>
                         {expandedAccordion === acc.id ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
                       </div>
                     </button>
                     <AnimatePresence>
                       {expandedAccordion === acc.id && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: "auto", opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="overflow-hidden"
                         >
                           <div className="px-6 pb-6 pt-2 text-sm text-white/60 leading-relaxed font-mono">
                             {acc.tip}
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </motion.div>
                 ))}
               </div>

             </motion.div>
          ) : profileData && activeTab === "jobs" ? (
             <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
               {matchedJobs.length === 0 ? (
                 <div className="text-center py-20 opacity-40 text-sm font-mono uppercase tracking-widest">Querying Global Matrix...</div>
               ) : (
                 matchedJobs.map((job, idx) => (
                   <motion.div
                     variants={itemVariants}
                     key={job.id}
                     className="p-6 rounded-2xl glass-panel-premium bg-black/60 hover:bg-black/80 transition-all group"
                   >
                     <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4">
                       <div>
                         <h3 className="font-bold text-xl text-white font-sans uppercase tracking-wide group-hover:text-[var(--accent)] transition-colors">{job.title}</h3>
                         <div className="text-xs mt-2 text-white/50 font-mono tracking-widest uppercase flex items-center gap-2">
                           <span className="text-[var(--accent)]">[{job.company}]</span> | {job.location || "REMOTE"} | {job.salary_range || "N/A"}
                         </div>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <span className={`px-3 py-1.5 text-[10px] font-bold rounded uppercase tracking-[0.2em] border ${getConfidenceColor(job.application_confidence)}`}>
                           {job.application_confidence} FIT
                         </span>
                         <span className="text-xs font-mono font-bold text-white/70">
                           SIMILARITY: <span className="text-[var(--accent)]">{job.match_score}%</span>
                         </span>
                       </div>
                     </div>
                     
                     <div className="mb-6">
                       <div className="text-[10px] uppercase font-bold tracking-[0.2em] mb-3 text-white/40 font-mono">Missing Vectors</div>
                       <div className="flex flex-wrap gap-2">
                         {job.missing_skills?.length > 0 ? job.missing_skills.map((ms: string, i: number) => (
                           <span key={i} className="px-3 py-1 text-[10px] font-mono rounded border bg-red-500/10 border-red-500/30 text-red-400">
                             {ms}
                           </span>
                         )) : (
                           <span className="text-xs text-[var(--accent)] font-mono">100% Vector Match</span>
                         )}
                       </div>
                     </div>
                     <div className="flex gap-3">
                       {job.href ? (
                         <a href={job.href} target="_blank" rel="noreferrer" className="flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-[0.1em] text-center transition-all bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/30">
                           Intercept Application
                         </a>
                       ) : null}
                       <button
                         onClick={() => handlePrepInterview(job)}
                         className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-[0.1em] transition-all font-mono
                           ${isGeneratingInterview && selectedJob?.id === job.id ? "bg-white/10 text-white/50 cursor-wait" : "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-black neon-glow"}`}
                       >
                         {isGeneratingInterview && selectedJob?.id === job.id ? "Compiling..." : "Generate Interview"}
                       </button>
                     </div>
                   </motion.div>
                 ))
               )}

               <AnimatePresence>
                 {interviewQuestions.length > 0 && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                     <div className="p-8 rounded-2xl glass-panel-premium bg-[var(--accent)]/5 border border-[var(--accent)]/30 mt-6 shadow-[inset_0_0_20px_rgba(45,226,230,0.1)]">
                       <div className="flex items-center justify-between mb-8 border-b border-[var(--accent)]/20 pb-4">
                         <h4 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-3 text-[var(--accent)]">
                           <PlayCircle className="w-5 h-5" /> Target Simulation Active
                         </h4>
                         <button onClick={() => setInterviewQuestions([])} className="text-xs font-mono opacity-50 hover:opacity-100 hover:text-red-400 uppercase tracking-widest transition-colors">Abort</button>
                       </div>
                       <div className="space-y-6">
                         {interviewQuestions.map((iq, idx) => (
                           <div key={idx} className="p-5 rounded-xl border border-white/5 bg-black/40">
                             <div className="flex items-center gap-2 mb-3">
                               <span className="px-2.5 py-1 text-[9px] font-bold rounded uppercase tracking-[0.2em] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                 {iq.type}
                               </span>
                             </div>
                             <p className="font-semibold text-sm mb-3 text-white/90 font-sans">{iq.question}</p>
                             <p className="text-xs text-white/50 font-mono leading-relaxed border-l-2 border-[var(--accent)]/50 pl-3 py-1">
                               {iq.answer_guide}
                             </p>
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
      </motion.div>
    </div>
  );
};
