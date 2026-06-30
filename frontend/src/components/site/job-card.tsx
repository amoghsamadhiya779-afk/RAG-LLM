import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Briefcase, DollarSign, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { JobWithCompany } from "@/types";
import { motion } from "framer-motion";

export function JobCard({ job, matchScore }: { job: JobWithCompany; matchScore?: number }) {
  const isMatch = matchScore !== undefined && matchScore >= 70;
  
  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
    if (min && max) return `${fmt(min)}–${fmt(max)}`;
    return fmt((min ?? max)!);
  };
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Link href={`/jobs/${job.id}`} className="block group">
        <div className="glass-card flex gap-4 p-5 transition-all hover:bg-iron/40 hover:border-bone/20">
          <Avatar className="h-12 w-12 rounded-xl bg-void border border-bone/10 shadow-sm shrink-0">
            <AvatarImage src={job.company.logoUrl || ""} />
            <AvatarFallback className="rounded-xl font-bold text-void bg-bone">{job.company.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-geist text-[18px] font-medium text-paper group-hover:text-paper/90 transition-colors">
                  {job.title}
                </h3>
                {isMatch && (
                  <Badge variant="secondary" className="rounded-pill bg-indigo-haze/20 text-bone border-none gap-1 px-2 py-0.5">
                    <Sparkles className="h-3 w-3" />
                    {Math.round(matchScore)}% Match
                  </Badge>
                )}
              </div>
              <p className="text-[15px] text-mist">{job.company.name}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[14px] text-fog">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-ash" />
                {job.remote ? "Remote" : job.location || "Remote"}
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-ash" />
                <span className="capitalize">{job.jobType.replace("_", " ")}</span>
              </div>
              {salary && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-ash" />
                  {salary}
                </div>
              )}
              <div className="flex items-center gap-1.5 ml-auto text-[13px]">
                <Clock className="h-3.5 w-3.5 text-ash" />
                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </div>
            </div>
            
            {(job.tags?.length > 0 || job.requirements?.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-bone/[0.06]">
                {(job.tags || job.requirements).slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-pill border-bone/10 bg-iron/40 text-mist px-2.5 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
