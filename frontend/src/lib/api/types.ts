// Shared DTOs. Backend (FastAPI) is the source of truth for these shapes;
// keep them in sync with your OpenAPI contract.

export type Role = "seeker" | "employer" | "admin";

export interface Me {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
}

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

export type Seniority = "intern" | "junior" | "mid" | "senior" | "staff" | "principal";
export type JobStatus = "draft" | "pending" | "live" | "closed";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";

export interface Job {
  id: string;
  source: string;
  title: string;
  company: Company | string;
  location: string;
  remote: boolean;
  seniority?: Seniority;
  employment_type?: EmploymentType;
  job_type?: EmploymentType;
  level?: Seniority;
  tags: string[];
  description_md: string;
  apply_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  status: JobStatus;
  is_featured: boolean;
  featured_until: string | null;
  created_at: string;
}

export interface JobFilters {
  q?: string;
  tags?: string[];
  remote?: boolean;
  seniority?: Seniority[];
  employment_type?: EmploymentType[];
  page?: number;
  page_size?: number;
  salary_min?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ApplicationStatus = "submitted" | "in_review" | "interview" | "rejected" | "hired";

export interface Application {
  id: string;
  job: Job;
  resume_id: string;
  cover_letter: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface Resume {
  id: string;
  filename: string;
  storage_path: string;
  size_bytes: number;
  created_at: string;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  extracted_skills: string[];
  created_at: string;
}

export interface AtsScore {
  id: string;
  resume_id: string;
  job_id: string | null;
  jd_snippet: string;
  overall: number; // 0-100
  sections: {
    keywords: number;
    experience: number;
    education: number;
    formatting: number;
  };
  matched_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}


export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface EmployerJob extends Job {
  views: number;
  applicant_count: number;
  new_applicants: number;
}

export type ApplicantStage = "new" | "reviewed" | "interview" | "rejected" | "hired";

export interface Applicant {
  id: string; // application id
  job_id: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    headline: string | null;
    location: string | null;
  };
  resume: {
    id: string;
    filename: string;
    storage_path: string;
    preview_url: string | null;
  };
  ats_score: number; // 0-100
  matched_keywords: string[];
  missing_keywords: string[];
  cover_letter: string | null;
  stage: ApplicantStage;
  applied_at: string;
}


