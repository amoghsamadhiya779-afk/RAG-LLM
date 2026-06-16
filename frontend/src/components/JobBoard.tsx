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
        if (!resumeText) setResumeText("Processing document...\n\nExtracting text content...\n\nInitializing analysis...");
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
      case "HIGH": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "MEDIUM": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "STRETCH": return "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20";
      default: return "text-red-500 bg-red-500/10 border-red-500/20";
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
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
            Job Board Analytics
          </h1>
          <p className="text-sm mt-2 text-[var(--text-secondary)] font-medium">
            Upload your resume to discover matching opportunities and analyze your ATS score.
          </p>
        </motion.div>
        
        {profileData && (
          <motion.div variants={itemVariants} className="flex bg-[var(--surface)] p-1.5 rounded-lg border border-[var(--border)] shadow-sm">
            <button
              onClick={() => setActiveTab("ats")}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${activeTab === "ats" ? "bg-[var(--bg)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${activeTab === "jobs" ? "bg-[var(--bg)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              Job Matches
            </button>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-[1400px] mx-auto w-full">
        
        {/* LEFT PANE: Upload Panel */}
        <motion.div variants={itemVariants} className="relative glass-panel-premium overflow-hidden flex flex-col min-h-[600px]">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
              <FileText className="w-4 h-4 text-[var(--text-secondary)]" /> Resume Document
            </h2>
            {profileData && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1.5" /> Parsed
              </span>
            )}
          </div>

          <div className="flex-1 p-8 relative overflow-y-auto scrollbar-thin">
            {!profileData && !isAnalyzing ? (
              <div className="h-full flex flex-col justify-center items-center">
                <label className="w-full max-w-md flex flex-col items-center justify-center p-10 border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer transition-all duration-300 hover:bg-[var(--accent-subtle)] hover:border-[var(--accent)] group bg-[var(--bg)]">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 bg-[var(--surface)] border border-[var(--border)] shadow-sm">
                    <Sparkles className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <p className="mb-2 text-base font-semibold text-center text-[var(--text-primary)] truncate w-full px-4" title={resumeFile ? resumeFile.name : ""}>
                    {resumeFile ? resumeFile.name : "Upload Resume File"}
                  </p>
                  <p className="text-xs text-center px-4 text-[var(--text-secondary)]">
                    Supports .pdf, .docx, .txt up to 10MB
                  </p>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setResumeFile(e.target.files[0]);
                      setResumeText(""); 
                    }
                  }} />
                </label>
                
                <div className="flex items-center gap-4 w-full max-w-md my-8">
                  <div className="flex-1 h-px bg-[var(--border)]"></div>
                  <span className="text-xs font-medium text-[var(--text-muted)]">OR PASTE TEXT</span>
                  <div className="flex-1 h-px bg-[var(--border)]"></div>
                </div>

                <textarea
                  rows={6}
                  placeholder="Paste your resume content here..."
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setResumeFile(null);
                  }}
                  className="w-full max-w-md p-4 text-sm leading-relaxed rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none shadow-sm"
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={!resumeText.trim() && !resumeFile}
                  className={`mt-8 w-full max-w-md py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
                    ${(!resumeText.trim() && !resumeFile) ? "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed" : "bg-[var(--accent)] text-white shadow-md hover:bg-[var(--accent-hover)]"}`}
                >
                  <PlayCircle className="w-5 h-5" /> Analyze Resume
                </motion.button>
                
                {errorMsg && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 border border-red-500/20 bg-red-500/5 rounded-xl text-red-500 text-sm max-w-md w-full text-center">
                    {errorMsg}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="h-full w-full text-sm leading-loose">
                {isAnalyzing && (
                  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-10">
                    <div className="absolute left-0 right-0 h-1 bg-[var(--accent)] animate-scan shadow-[0_0_20px_var(--accent)]" />
                  </div>
                )}
                <div className={`relative z-10 whitespace-pre-wrap ${isAnalyzing ? "text-[var(--text-primary)] animate-pulse-subtle" : "text-[var(--text-secondary)]"}`}>
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
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-t-2 border-[var(--accent)] animate-spin opacity-80"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-[var(--accent)] animate-spin opacity-40 animation-delay-200"></div>
                <Sparkles className="w-6 h-6 text-[var(--accent)] animate-pulse-subtle" />
              </div>
              <p className="mt-6 text-sm font-semibold text-[var(--text-secondary)]">Analyzing Resume Data...</p>
            </motion.div>
          ) : profileData && activeTab === "ats" ? (
             <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin">
               
               <div className="glass-panel-premium p-8 flex flex-col items-center justify-center relative overflow-hidden">
                 <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-6 z-10">Overall ATS Score</h3>
                 <div className="relative w-48 h-48 flex items-center justify-center z-10">
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="96" cy="96" r="88" stroke="var(--border)" strokeWidth="8" fill="none" />
                     <motion.circle
                       initial={{ strokeDasharray: "0 1000" }}
                       animate={{ strokeDasharray: `${atsScore?.total_score ? (atsScore.total_score / 100) * 552.9 : 0} 1000` }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       cx="96" cy="96" r="88"
                       stroke="var(--accent)"
                       strokeWidth="8"
                       strokeLinecap="round"
                       fill="none"
                     />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-5xl font-bold text-[var(--text-primary)]">{atsScore?.total_score || 0}</span>
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                 {accordions.map((acc, i) => (
                   <motion.div variants={itemVariants} key={acc.id} className="glass-panel-premium border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
                     <button
                       onClick={() => toggleAccordion(acc.id)}
                       className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--bg)] transition-colors"
                     >
                       <div className="flex items-center gap-4 w-full">
                         <div className="w-10 h-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
                           {acc.score}
                         </div>
                         <div className="flex-1">
                           <h4 className="font-semibold text-[var(--text-primary)]">{acc.label}</h4>
                           <div className="w-full bg-[var(--border)] h-1.5 mt-2 rounded-full overflow-hidden relative">
                             <motion.div
                               initial={{ width: 0 }}
                               animate={{ width: `${(acc.score / acc.max) * 100}%` }}
                               transition={{ duration: 1, delay: 0.2 }}
                               className="h-full bg-[var(--accent)]"
                             />
                           </div>
                         </div>
                         {expandedAccordion === acc.id ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
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
                           <div className="px-6 pb-6 pt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
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
                 <div className="text-center py-20 text-sm font-medium text-[var(--text-muted)]">No jobs found matching your profile.</div>
               ) : (
                 matchedJobs.map((job, idx) => (
                   <motion.div
                     variants={itemVariants}
                     key={job.id}
                     className="p-6 rounded-2xl glass-panel-premium bg-[var(--surface)] hover:bg-[var(--bg)] transition-all group border-[var(--border)]"
                   >
                     <div className="flex justify-between items-start mb-4 border-b border-[var(--border)] pb-4">
                       <div>
                         <h3 className="font-semibold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{job.title}</h3>
                         <div className="text-xs mt-1.5 text-[var(--text-secondary)] font-medium flex items-center gap-2">
                           <span className="text-[var(--text-primary)]">{job.company}</span> • {job.location || "Remote"} • {job.salary_range || "N/A"}
                         </div>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider border ${getConfidenceColor(job.application_confidence)}`}>
                           {job.application_confidence} MATCH
                         </span>
                         <span className="text-xs font-semibold text-[var(--text-secondary)]">
                           Similarity: <span className="text-[var(--text-primary)]">{job.match_score}%</span>
                         </span>
                       </div>
                     </div>
                     
                     <div className="mb-6">
                       <div className="text-xs font-semibold mb-2 text-[var(--text-muted)]">Missing Skills</div>
                       <div className="flex flex-wrap gap-2">
                         {job.missing_skills?.length > 0 ? job.missing_skills.map((ms: string, i: number) => (
                           <span key={i} className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)]">
                             {ms}
                           </span>
                         )) : (
                           <span className="text-xs text-emerald-500 font-medium">100% Match</span>
                         )}
                       </div>
                     </div>
                     <div className="flex gap-3">
                       {job.href ? (
                         <a href={job.href} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-center transition-all bg-[var(--bg)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)]">
                           View Application
                         </a>
                       ) : null}
                       <button
                         onClick={() => handlePrepInterview(job)}
                         className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all
                           ${isGeneratingInterview && selectedJob?.id === job.id ? "bg-[var(--bg)] text-[var(--text-muted)] cursor-wait" : "bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"}`}
                       >
                         {isGeneratingInterview && selectedJob?.id === job.id ? "Generating..." : "Generate Interview"}
                       </button>
                     </div>
                   </motion.div>
                 ))
               )}

               <AnimatePresence>
                 {interviewQuestions.length > 0 && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                     <div className="p-6 rounded-2xl glass-panel-premium bg-[var(--surface)] border-[var(--border)] mt-6">
                       <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
                         <h4 className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                           <PlayCircle className="w-4 h-4 text-[var(--accent)]" /> Interview Prep Generated
                         </h4>
                         <button onClick={() => setInterviewQuestions([])} className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors">Close</button>
                       </div>
                       <div className="space-y-4">
                         {interviewQuestions.map((iq, idx) => (
                           <div key={idx} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                             <div className="flex items-center gap-2 mb-2">
                               <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/20">
                                 {iq.type}
                               </span>
                             </div>
                             <p className="font-semibold text-sm mb-2 text-[var(--text-primary)]">{iq.question}</p>
                             <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--border)] pl-3 py-1">
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
