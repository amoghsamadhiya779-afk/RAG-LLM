// Shared data model. This IS the contract Antigravity will implement.
// Keep these shapes identical across mock client and real backend.

export type Role = "seeker" | "employer" | "admin";

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type Profile = {
  id: string; // matches User.id
  fullName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  role: Role;
};

export type AuthSession = {
  user: User;
  profile: Profile;
  token: string; // opaque mock token; real backend returns JWT
};

export type Company = {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  about: string;
  location?: string | null;
  size?: string | null;
  ownerId: string; // employer who manages the company
};

export type JobStatus = "pending" | "live" | "rejected";
export type JobType = "full_time" | "part_time" | "contract" | "internship";
export type JobLevel = "intern" | "junior" | "mid" | "senior" | "staff" | "principal";

export type Job = {
  id: string;
  companyId: string;
  title: string;
  description: string; // markdown / plain text
  requirements: string[];
  location: string | null;
  remote: boolean;
  jobType: JobType;
  level: JobLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
  status: JobStatus;
  featured: boolean;
  views: number;
  createdAt: string;
};

export type JobWithCompany = Job & { company: Company };

export type ApplicationStage = "applied" | "reviewing" | "interview" | "offer" | "rejected";

export type Application = {
  id: string;
  jobId: string;
  userId: string;
  coverNote?: string | null;
  resumeId?: string | null;
  stage: ApplicationStage;
  createdAt: string;
  // expanded on listForJob / mine
  applicant?: Pick<Profile, "id" | "fullName" | "avatarUrl" | "headline">;
  job?: Pick<Job, "id" | "title"> & { company?: Pick<Company, "id" | "name" | "logoUrl"> };
};

export type ParsedResume = {
  skills: string[];
  experience: { title: string; company: string; years: number }[];
  education: { school: string; degree: string }[];
};

export type Resume = {
  id: string;
  userId: string;
  fileName: string;
  uploadedAt: string;
  parsed: ParsedResume | null; // null until parsed
};

export type JobFilters = {
  query?: string;
  tags?: string[];
  remote?: boolean;
  jobType?: JobType;
  level?: JobLevel;
  salaryMin?: number;
  featured?: boolean;
  status?: JobStatus;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CheckoutSession = {
  url: string;
  sessionId: string;
};
