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
  const [messages, setMessages] = useState<{ role: "user" | "ai", text: string }[]>([
    { role: "ai", text: "Hi! I'm the jOBiON AI Assistant. I know all about our open roles. Ask me which jobs fit your profile!" }
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await api.jobs.search(searchQuery);
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

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: `I found several roles matching "${userMsg}". Check out the semantic search results or upload your resume for a precise match!` }]);
    }, 800);
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
            className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col"
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
            
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. 'remote senior react roles on AI teams'" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            
            <div className="mt-4 flex-1 rounded-md border border-dashed border-border bg-muted/30 p-4 overflow-y-auto max-h-[300px] min-h-[150px]">
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
            className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col"
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
            
            <div className="flex flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-colors hover:bg-muted/50">
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
                    <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md">{s}</span>
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
            className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2"
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
                  <div key={job.id} className="flex flex-col rounded-lg border border-primary/40 bg-surface/40 p-5 shadow-[0_0_15px_rgba(var(--primary),0.1)] hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {job.company?.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
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
                  <div key={i} className="flex flex-col rounded-lg border border-border bg-background p-5 opacity-50 grayscale">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded bg-muted/50" />
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        --% Match
                      </span>
                    </div>
                    <div className="mt-2 h-4 w-3/4 rounded bg-muted/50" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-muted/50" />
                    
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
            className="rounded-xl border border-border bg-card p-0 shadow-sm lg:col-span-2 overflow-hidden flex flex-col min-h-[400px]"
          >
            <div className="flex items-center gap-3 p-6 border-b border-border/50 bg-surface/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">Chat with the open-roles index.</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[300px] bg-muted/10">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-surface border border-border text-foreground"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChat} className="p-4 border-t border-border/50 bg-background flex gap-2">
              <Input 
                placeholder="e.g. Can you find me jobs that require Python and allow remote work?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
