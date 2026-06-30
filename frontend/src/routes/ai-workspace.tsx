import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Sparkles, FileText, Zap, UploadCloud } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/ai-workspace")({
  component: AiWorkspacePage,
});

function AiWorkspacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="container-page py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-display font-bold tracking-tight sm:text-5xl">
          AI <span className="text-gradient-accent">Workspace</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience the power of semantic search, instant resume parsing, and personalized AI matching all in one place.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Semantic Search Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
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
              className="flex-1"
            />
            <Button>Search</Button>
          </div>
          <div className="mt-4 rounded-md border border-dashed border-border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
            {searchQuery ? `Searching vector database for: "${searchQuery}"...` : "Try searching for a job role in plain English."}
          </div>
        </motion.div>

        {/* Resume Parsing Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
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
          
          <div className="flex flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-colors hover:bg-muted/50">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF or DOCX (max. 5MB)</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsUploading(true)}>
              {isUploading ? "Uploading..." : "Select Resume"}
            </Button>
          </div>
        </motion.div>

        {/* AI Matching Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col rounded-lg border border-border bg-background p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-10 w-10 rounded bg-muted/50 animate-pulse" />
                  <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                    9{4-i}% Match
                  </span>
                </div>
                <div className="mt-2 h-4 w-3/4 rounded bg-muted/50 animate-pulse" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted/50 animate-pulse" />
                
                <div className="mt-6">
                  <Button className="w-full gap-2" variant="default">
                    <Zap className="h-4 w-4 fill-current" />
                    One-click Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
