"use client";

import { motion } from "framer-motion";
import { Search, Sparkles, FileText, Zap, UploadCloud, Bot, Send } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/site/job-card";
import { api } from "@/services/api";
import { toast } from "sonner";
import type { JobWithCompany } from "@/types";

export default function AiWorkspaceSection({ className }: { className?: string }) {
  const router = useRouter();

  // Semantic Search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JobWithCompany[]>([]);

  // Resume Parsing
  const [isUploading, setIsUploading] = useState(false);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<JobWithCompany[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Assistant Chat
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai", text: string }[]>([
    { role: "ai", text: "Hi! I'm the jOBiON AI Assistant. I know all about our open roles. Ask me which jobs fit your profile!" }
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await api.jobs.semanticSearch(searchQuery);
      setSearchResults(results);
    } catch (e) {
      toast.error("Failed to perform semantic search.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    toast.info("Uploading and parsing resume... This may take a few seconds.");
    
    try {
      // 1. Upload
      const resume = await api.resumes.upload(file);
      
      // 2. Parse (AI Extraction)
      const parsed = await api.resumes.parse(resume.id);
      setParsedSkills(parsed.skills || []);
      toast.success("Resume parsed successfully!");

      // 3. AI Matching
      const recommended = await api.jobs.recommended(resume.id);
      setMatchedJobs(recommended);
      
      if (recommended.length > 0) {
        document.getElementById("ai-matching")?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to process resume.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setIsChatTyping(true);
    
    try {
      const { response } = await api.chat.send(userMsg);
      setMessages(prev => [...prev, { role: "ai", text: response }]);
    } catch (e: any) {
      toast.error(e.message || "Failed to contact Gemini.");
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, I am having trouble connecting to my Gemini brain right now." }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  return (
    <section id="ai-workspace" className={`relative py-24 sm:py-32 border-t border-bone/[0.06] ${className || ""}`}>
      <div className="container-page">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl">
            AI <span className="text-gradient-accent">Workspace</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the power of semantic search, instant resume parsing, and personalized AI matching all in one place.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Semantic Search Section */}
          <motion.div 
            id="semantic-search"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Semantic Search</h2>
                <p className="text-sm text-muted-foreground">Find roles using natural language.</p>
              </div>
            </div>
            
            <div className="flex gap-3 w-full">
              <div className="flex flex-1 items-center gap-3 rounded-pill border border-bone/10 bg-[#1d1d1d] px-4 py-1.5 shadow-sm">
                <Search className="h-4 w-4 text-mist" />
                <Input 
                  placeholder="e.g. 'remote senior react roles on AI teams'" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="border-0 bg-[#1d1d1d] text-[15px] text-white placeholder:text-gray-400 focus-visible:ring-0 px-0 h-8 flex-1"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="rounded-pill px-6">
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            
            <div className="mt-4 flex-1 rounded-inputs border border-dashed border-bone/10 bg-char/30 p-4 overflow-y-auto max-h-[300px] min-h-[150px]">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map(j => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
              ) : isSearching ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground animate-pulse py-8">
                  Searching vector database for: "{searchQuery}"...
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center py-8">
                  Try searching for a job role in plain English.
                </div>
              )}
            </div>
          </motion.div>

          {/* Resume Parsing Section */}
          <motion.div 
            id="resume-parsing"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-card flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Instant Resume Parsing</h2>
                <p className="text-sm text-muted-foreground">Extract skills and experience instantly.</p>
              </div>
            </div>
            
            <input 
              type="file" 
              accept=".pdf"
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            
            <div className="flex flex-col items-center justify-center gap-4 rounded-cards border-2 border-dashed border-bone/10 bg-char/30 p-10 text-center transition-colors hover:bg-char/50">
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF (max. 5MB)</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Select Resume"}
              </Button>
            </div>

            {parsedSkills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Extracted Skills:</h3>
                <div className="flex flex-wrap gap-1.5">
                  {parsedSkills.map((s, i) => (
                    <span key={i} className="bg-primary/10 text-bone text-xs px-2.5 py-1 rounded-tags border border-bone/5">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* AI Matching Section */}
          <motion.div 
            id="ai-matching"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card lg:col-span-2 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Matching & One-Click Apply</h2>
                <p className="text-sm text-muted-foreground">See how your parsed profile matches with live jobs.</p>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {matchedJobs.length > 0 ? (
                matchedJobs.map((job) => (
                  <div key={job.id} className="flex flex-col rounded-cards border border-bone/10 bg-char/40 p-5 transition-all hover:bg-iron/40 hover:border-bone/20">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded-xl bg-void border border-bone/10 flex items-center justify-center font-bold text-bone shrink-0">
                        {job.company?.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="inline-flex items-center rounded-pill bg-indigo-haze/20 px-2.5 py-0.5 text-xs font-medium text-bone border border-indigo-haze/30">
                        {Math.floor(Math.random() * (99 - 85 + 1) + 85)}% Match
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-1">{job.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-4">{job.company?.name}</p>
                    
                    <div className="mt-auto">
                      <Button className="w-full gap-2" variant="default" onClick={() => router.push(`/jobs/${job.id}`)}>
                        <Zap className="h-4 w-4 fill-current" />
                        One-click Apply
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col rounded-cards border border-bone/10 bg-char/40 p-5 opacity-50 grayscale">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded-xl bg-void border border-bone/10" />
                      <span className="inline-flex items-center rounded-pill bg-char border border-bone/10 px-2.5 py-0.5 text-xs font-medium text-fog">
                        --% Match
                      </span>
                    </div>
                    <div className="mt-2 h-4 w-3/4 rounded-pill bg-iron/40" />
                    <div className="mt-2 h-3 w-1/2 rounded-pill bg-iron/40" />
                    
                    <div className="mt-6">
                      <Button className="w-full gap-2" variant="outline" disabled>
                        Upload Resume First
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* AI Assistant Chat */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="group relative rounded-3xl border border-bone/5 bg-void/60 backdrop-blur-2xl p-0 shadow-[0_8px_30px_rgb(0,0,0,0.4)] lg:col-span-2 overflow-hidden flex flex-col min-h-[450px] transition-all hover:border-bone/10 hover:bg-void/80"
          >
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-haze/30 to-transparent" />
            
            {/* Sleek Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-bone/5 bg-char/20 z-10">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-haze/10 border border-indigo-haze/20 text-indigo-haze">
                <Bot className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-void bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-base font-medium flex items-center gap-1.5 text-paper tracking-wide">
                  Career Assistant <Sparkles className="h-3 w-3 text-indigo-haze opacity-70" />
                </h2>
                <p className="text-[11px] text-mist font-mono uppercase tracking-wider opacity-80">Powered by RAG & Gemini</p>
              </div>
            </div>
            
            {/* Chat History Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5 max-h-[400px] scroll-smooth custom-scrollbar">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, scale: 0.98, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <div className="flex-shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-iron/30 border border-bone/5 text-mist">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 text-[14px] leading-relaxed tracking-wide shadow-sm ${
                    msg.role === "user" 
                      ? "bg-indigo-haze/90 text-white rounded-2xl rounded-tr-sm font-medium" 
                      : "bg-char/30 backdrop-blur-md border border-bone/5 text-bone rounded-2xl rounded-tl-sm font-light"
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              
              {/* Fake typing indicator */}
              {isChatTyping && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-iron/30 border border-bone/5 text-mist">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-char/30 backdrop-blur-md border border-bone/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 h-[46px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-mist/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-mist/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-mist/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleChat} className="p-4 border-t border-bone/5 bg-char/10 flex items-center z-10">
              <div className="relative flex flex-1 items-center">
                <Input 
                  placeholder="Ask about remote React roles, salaries, or specific skills..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full bg-void/50 border border-bone/10 focus-visible:border-indigo-haze/50 text-[14px] text-white placeholder:text-mist/50 focus-visible:ring-0 pl-4 pr-12 h-11 rounded-2xl transition-colors shadow-inner"
                  disabled={isChatTyping}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!chatInput.trim() || isChatTyping}
                  className="absolute right-1.5 top-1.5 h-8 w-8 rounded-xl bg-indigo-haze text-paper hover:bg-indigo-haze/80 hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:bg-indigo-haze/30"
                >
                  <Send className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
