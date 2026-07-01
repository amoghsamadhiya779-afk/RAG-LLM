import type {
  Application,
  ApplicationStage,
  AuthSession,
  CheckoutSession,
  Company,
  Job,
  JobFilters,
  JobStatus,
  JobWithCompany,
  Paginated,
  ParsedResume,
  Profile,
  Resume,
  Role,
  User,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SESSION_KEY = "jOBiON:session:v1";

const isBrowser = typeof window !== "undefined";

function saveSession(session: AuthSession | null) {
  if (!isBrowser) return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

function getToken() {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    return session.token;
  } catch {
    return null;
  }
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (options?.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = "API Error";
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

export const auth = {
  async signUp(input: { email: string; password: string; role: Role; fullName: string }): Promise<AuthSession> {
    const session = await fetchApi<AuthSession>("/auth/sign-up", {
      method: "POST",
      body: JSON.stringify(input),
    });
    saveSession(session);
    return session;
  },

  async signIn(input: { email: string; password: string }): Promise<AuthSession> {
    const session = await fetchApi<AuthSession>("/auth/sign-in", {
      method: "POST",
      body: JSON.stringify(input),
    });
    saveSession(session);
    return session;
  },

  async signOut(): Promise<void> {
    await fetchApi("/auth/sign-out", { method: "POST" }).catch(() => {});
    saveSession(null);
  },

  async me(): Promise<AuthSession | null> {
    if (!getToken()) return null;
    try {
      const session = await fetchApi<AuthSession>("/auth/me");
      saveSession(session);
      return session;
    } catch {
      saveSession(null);
      return null;
    }
  },
};

export const jobs = {
  async list(filters: JobFilters = {}, page = 1, pageSize = 20): Promise<Paginated<JobWithCompany>> {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("pageSize", pageSize.toString());
    
    if (filters.query) params.set("query", filters.query);
    if (filters.remote) params.set("remote", "true");
    if (filters.jobType) params.set("jobType", filters.jobType);
    if (filters.level) params.set("level", filters.level);
    if (filters.salaryMin) params.set("salaryMin", filters.salaryMin.toString());
    if (filters.featured) params.set("featured", "true");
    if (filters.status) params.set("status", filters.status);
    
    if (filters.tags?.length) {
      filters.tags.forEach(t => params.append("tags", t));
    }

    return fetchApi(`/jobs?${params.toString()}`);
  },

  async get(id: string): Promise<JobWithCompany> {
    return fetchApi(`/jobs/${id}`);
  },

  async create(input: Partial<Job> & { companyId: string }): Promise<Job> {
    return fetchApi("/jobs", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(id: string, patch: Partial<Job>): Promise<Job> {
    return fetchApi(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async mine(): Promise<JobWithCompany[]> {
    return fetchApi("/jobs/mine");
  },

  async search(query: string): Promise<JobWithCompany[]> {
    if (!query.trim()) {
      const res = await this.list();
      return res.items;
    }
    
    // Call the POST /jobs/search endpoint which queries Brave Search
    const results = await fetchApi<any[]>("/jobs/search", {
      method: "POST",
      body: JSON.stringify({ keywords: query.split(" ").filter(Boolean) })
    });
    
    // Map internet search results to JobWithCompany shape for the UI
    return results.map(r => ({
      id: r.id,
      companyId: r.id,
      title: r.title,
      description: r.description,
      url: r.url,
      company: { id: r.id, name: r.source || "Web Search", logoUrl: "" },
      salaryMin: null,
      salaryMax: null,
      remote: true,
      location: "Remote",
      level: null,
      jobType: "full_time",
      createdAt: new Date().toISOString(),
      tags: ["Internet Result"],
      requirements: [],
      status: "live",
      featured: false,
      views: 0
    } as unknown as JobWithCompany));
  },

  async semanticSearch(query: string): Promise<JobWithCompany[]> {
    if (!query.trim()) {
      const res = await this.list();
      return res.items;
    }
    return fetchApi<JobWithCompany[]>(`/jobs/search/semantic?q=${encodeURIComponent(query)}`);
  },

  async recommended(resumeId: string): Promise<JobWithCompany[]> {
    return fetchApi(`/jobs/recommended?resumeId=${resumeId}`);
  },

  async similar(id: string): Promise<JobWithCompany[]> {
    return fetchApi(`/jobs/${id}/similar`);
  },
};

export const companies = {
  async get(id: string): Promise<{ company: Company; jobs: Job[] } | null> {
    return fetchApi<{ company: Company; jobs: Job[] }>(`/companies/${id}`).catch(() => null);
  },

  async upsert(input: Partial<Company>): Promise<Company> {
    if (input.id) {
      return fetchApi(`/companies/${input.id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      });
    }
    return fetchApi("/companies", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async list(): Promise<Company[]> {
    return fetchApi("/companies");
  },
};

export const applications = {
  async create(jobId: string, input: { userId: string; coverNote?: string; resumeId?: string }): Promise<Application> {
    return fetchApi(`/jobs/${jobId}/applications`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async listForJob(jobId: string): Promise<Application[]> {
    return fetchApi(`/jobs/${jobId}/applications`);
  },

  async mine(): Promise<Application[]> {
    return fetchApi("/applications/mine");
  },

  async setStage(id: string, stage: ApplicationStage): Promise<Application> {
    return fetchApi(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
  },
};

export const resumes = {
  async upload(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append("file", file);
    
    return fetchApi("/resumes", {
      method: "POST",
      body: formData,
    });
  },

  async parse(id: string): Promise<ParsedResume> {
    return fetchApi(`/resumes/${id}/parse`, { method: "POST" });
  },

  async mine(): Promise<Resume[]> {
    return fetchApi("/resumes/mine");
  },
};

export const saved = {
  async list(): Promise<JobWithCompany[]> {
    return fetchApi("/saved-jobs");
  },

  async toggle(jobId: string): Promise<{ saved: boolean }> {
    return fetchApi("/saved-jobs", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    });
  },

  async ids(): Promise<string[]> {
    return fetchApi("/saved-jobs/ids");
  },
};

export const admin = {
  async pendingJobs(): Promise<JobWithCompany[]> {
    return fetchApi("/admin/jobs?status=pending");
  },

  async setStatus(id: string, status: JobStatus): Promise<Job> {
    return fetchApi(`/admin/jobs/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async stats(): Promise<{ totalJobs: number; live: number; pending: number; applications: number; companies: number }> {
    return fetchApi("/admin/stats");
  },
};

export const billing = {
  async featureJob(jobId: string): Promise<CheckoutSession> {
    return fetchApi("/billing/feature-job", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    });
  },
};

export const chat = {
  async send(message: string): Promise<{ response: string }> {
    return fetchApi("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};

export const insights = {
  async skillGap(resumeId: string): Promise<any[]> {
    return fetchApi(`/insights/skill-gap?resumeId=${resumeId}`);
  }
};

export const api = { auth, jobs, companies, applications, resumes, saved, admin, billing, chat, insights };
export type Api = typeof api;
