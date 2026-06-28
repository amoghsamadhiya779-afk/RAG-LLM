"use client";

import React, { useState, useEffect } from "react";
import { useRAG } from "@/context/RAGContext";

interface AtsScore {
  total_score?: number;
  breakdown?: {
    formatting?: number;
    content?: number;
    style?: number;
    match?: number;
  };
}

interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  match_score?: number;
  salary?: string;
  requirements?: string[];
}

interface InterviewQuestion {
  question: string;
  answer_guide: string;
}
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FileText, PlayCircle, Sparkles, CheckCircle, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const JobBoard = () => {
  const { uploadResume, analyzeResume, matchJobs, seedJobs, generateInterview, ingestDocument } = useRAG();

  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [atsScore, setAtsScore] = useState<AtsScore | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);
  const [activeTab, setActiveTab] = useState<"ats" | "jobs">("ats");
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
        
        try {
          await ingestDocument(resumeFile.name, textToAnalyze);
        } catch (e) {
          console.error("Failed to ingest globally:", e);
        }
      } else if (resumeText.trim()) {
        try {
          await ingestDocument("pasted-resume.txt", textToAnalyze);
        } catch (e) {
          console.error("Failed to ingest globally:", e);
        }
      }
      const data = await analyzeResume(textToAnalyze);
      setProfileData(data.profile as Record<string, unknown>);
      setAtsScore(data.scoring as AtsScore);
      const jobs = await matchJobs(data.profile as Record<string, unknown>);
      setMatchedJobs(jobs as Job[]);
      setActiveTab("ats");
    } catch (e: unknown) {
      console.error(e);
      const err = e as Error;
      setErrorMsg(err.message || "Network Error: Unable to connect to the backend API.");
    }
    setIsAnalyzing(false);
  };

  const handlePrepInterview = async (job: Job) => {
    if (!profileData) return;
    setSelectedJob(job);
    setInterviewQuestions([]);
    setIsGeneratingInterview(true);
    try {
      const data = await generateInterview(String(job.id), profileData);
      setInterviewQuestions(data.questions as InterviewQuestion[]);
    } catch (e) {
      console.error(e);
    }
    setIsGeneratingInterview(false);
  };

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case "HIGH": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "MEDIUM": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "STRETCH": return "text-[var(--color-primary-600)] bg-[var(--color-primary-500)]/10 border-[var(--color-primary-500)]/20";
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
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
            Job Board Analytics
          </h1>
          <p className="text-sm mt-2 text-gray-400 font-medium">
            Upload your resume to discover matching opportunities and analyze your ATS score.
          </p>
        </motion.div>
        
        {profileData && (
          <motion.div variants={itemVariants} className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-lg border border-white/40 shadow-sm">
            <button
              onClick={() => setActiveTab("ats")}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${activeTab === "ats" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${activeTab === "jobs" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
            >
              Job Matches
            </button>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-[1400px] mx-auto w-full">
        
        {/* LEFT PANE: Upload Panel */}
        <motion.div variants={itemVariants} className="relative clay-card overflow-hidden flex flex-col min-h-[600px]">
          <div className="px-6 py-4 border-b border-white/40 bg-transparent flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-white">
              <FileText className="w-4 h-4 text-gray-400" /> Resume Document
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
                <label className="w-full max-w-md flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/40 rounded-xl cursor-pointer transition-all duration-300 hover:bg-[var(--color-primary-100)] hover:border-[var(--color-primary-500)] group bg-transparent">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
                    <Sparkles className="w-6 h-6 text-[var(--color-primary-600)]" />
                  </div>
                  <p className="mb-2 text-base font-semibold text-center text-white truncate w-full px-4" title={resumeFile ? resumeFile.name : ""}>
                    {resumeFile ? resumeFile.name : "Upload Resume File"}
                  </p>
                  <p className="text-xs text-center px-4 text-gray-400">
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
                  <span className="text-xs font-medium text-gray-400">OR PASTE TEXT</span>
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
                  className="w-full max-w-md p-4 text-sm leading-relaxed rounded-xl border border-white/40 bg-transparent text-white focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none shadow-sm placeholder:text-gray-500"
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={!resumeText.trim() && !resumeFile}
                  className={`mt-8 w-full max-w-md py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
                    ${(!resumeText.trim() && !resumeFile) ? "bg-[var(--border)] text-gray-500 cursor-not-allowed" : "bg-[var(--color-primary-500)] text-white shadow-md hover:bg-[var(--color-primary-600)]"}`}
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
                    <div className="absolute left-0 right-0 h-1 bg-[var(--color-primary-500)] animate-scan shadow-[0_0_20px_var(--accent)]" />
                  </div>
                )}
                <div className={`relative z-10 whitespace-pre-wrap ${isAnalyzing ? "text-white animate-pulse-subtle" : "text-gray-400"}`}>
                  {resumeText || (resumeFile ? `Scanning file: ${resumeFile.name}...` : "")}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="relative flex flex-col h-full min-h-[600px]">
          {isAnalyzing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-t-2 border-[var(--color-primary-500)] animate-spin opacity-80"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-[var(--color-primary-500)] animate-spin opacity-40 animation-delay-200"></div>
                <Sparkles className="w-6 h-6 text-[var(--color-primary-600)] animate-pulse-subtle" />
              </div>
              <p className="mt-6 text-sm font-semibold text-gray-400">Analyzing Resume Data...</p>
            </motion.div>
          ) : profileData && activeTab === "ats" ? (
             <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin">
               
               <div className="clay-card p-8 flex flex-col items-center justify-center relative overflow-hidden">
                 <h3 className="text-sm font-semibold text-gray-400 mb-6 z-10">Overall ATS Score</h3>
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
                     <span className="text-4xl font-bold text-white">{atsScore?.total_score || 0}</span>
                     <span className="text-xs font-semibold text-gray-500 tracking-widest mt-1">OUT OF 100</span>
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                  {accordions.map((acc) => (
                   <motion.div variants={itemVariants} key={acc.id} className="clay-card border-white/40 rounded-xl overflow-hidden bg-white/60 backdrop-blur-md">
                     <button
                       onClick={() => toggleAccordion(acc.id)}
                       className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-transparent transition-colors"
                     >
                       <div className="flex items-center gap-4 w-full">
                         <div className="flex items-center gap-3">
                           <span className="text-sm font-bold text-white">{acc.label}</span>
                         </div>
                         <div className="flex items-center gap-4">
                           <span className="text-xs font-semibold text-gray-400">{acc.score}/{acc.max} pts</span>
                           <div className="w-full bg-[var(--border)] h-1.5 mt-2 rounded-full overflow-hidden relative">
                             <motion.div
                               initial={{ width: 0 }}
                               animate={{ width: `${(acc.score / acc.max) * 100}%` }}
                               transition={{ duration: 1, delay: 0.2 }}
                               className="h-full bg-[var(--color-primary-500)]"
                             />
                           </div>
                         </div>
                         {expandedAccordion === acc.id ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
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
                           <div className="px-6 pb-6 pt-2 text-sm text-gray-400 leading-relaxed">
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
                 <div className="text-center py-20 text-sm font-medium text-gray-400">No jobs found matching your profile.</div>
               ) : selectedJob ? (
                 <div className="clay-card p-8 relative overflow-hidden flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                   <div>
                     <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       <BookOpen className="w-5 h-5 text-[var(--color-primary-500)]" /> Technical Interview Prep
                     </h3>
                     <p className="text-sm text-gray-400 mt-1 font-medium">Custom tailored to {selectedJob.title} at {selectedJob.company}</p>
                   </div>
                   <button onClick={() => setSelectedJob(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-white bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-lg transition-colors border border-white/40">
                     Back to Matches
                   </button>
                 </div>
                 {isGeneratingInterview ? (
                   <div className="flex-1 flex flex-col items-center justify-center py-12">
                     <div className="w-16 h-16 rounded-full border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-500)] animate-spin mb-4"></div>
                     <p className="text-sm font-bold text-gray-400">Synthesizing interview questions...</p>
                   </div>
                 ) : (
                    <div className="space-y-4">
                      {interviewQuestions.map((iq, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-white/40 bg-transparent">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-[var(--color-primary-100)] text-[var(--color-primary-600)] border border-[var(--color-primary-500)]/20">
                              {iq.type}
                            </span>
                          </div>
                          <p className="font-semibold text-sm mb-2 text-white">{iq.question}</p>
                          <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-white/40 pl-3 py-1">
                            {iq.answer_guide}
                          </p>
                        </div>
                      ))}
                    </div>
                 )}
                 </div>
               ) : (
                  matchedJobs.map((job) => (
                   <div key={job.id} className="clay-card p-6 flex flex-col gap-4 relative overflow-hidden group">
                     <div className="flex justify-between items-start">
                       <div>
                         <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-primary-600)] transition-colors">{job.title}</h3>
                         <p className="text-sm font-semibold text-gray-400 mt-1 flex items-center gap-2">
                           {job.company} <span className="w-1 h-1 rounded-full bg-gray-300"></span> {job.location}
                         </p>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600">
                           {job.match_score}%
                         </span>
                         <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${getConfidenceColor(job.application_confidence)}`}>
                           {job.application_confidence}
                         </span>
                       </div>
                     </div>
                     <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                       {job.culture || job.description}
                     </p>
                     <div className="flex items-center gap-4 mt-2 border-t border-white/20 pt-4">
                       <button onClick={() => window.open(job.href || "#", "_blank")} className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary-50)] hover:bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-sm font-bold transition-colors">
                         View Details
                       </button>
                       <button onClick={() => handlePrepInterview(job)} className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-sm font-bold transition-colors shadow-sm">
                         Prep Interview
                       </button>
                     </div>
                   </div>
                 ))
               )}
              </motion.div>
           ) : null}
        </div>
      </motion.div>
    </div>
  );
};
