import type {
  AdminUser,
  Application,
  AtsScore,
  ChatMessage,
  Job,
  Me,
  Resume,
  ResumeAnalysis,
} from "@/lib/api/types";
import { registerMock } from "./registry";

// ---------- Me ----------
const mockMe: Me = {
  id: "usr_mock_1",
  email: "you@jobion.dev",
  full_name: "Ada Lovelace",
  avatar_url: null,
  role: "seeker",
};
registerMock("GET /me", () => mockMe);
registerMock("PATCH /me", ({ body }) => {
  const b = (body ?? {}) as Partial<Me>;
  if (typeof b.full_name !== "undefined") mockMe.full_name = b.full_name;
  if (typeof b.avatar_url !== "undefined") mockMe.avatar_url = b.avatar_url;
  return mockMe;
});
registerMock("DELETE /me", () => ({ ok: true as const }));

// ---------- Jobs ----------
const companies = [
  { id: "c1", name: "Vercel", logo_url: null },
  { id: "c2", name: "Linear", logo_url: null },
  { id: "c3", name: "Stripe", logo_url: null },
  { id: "c4", name: "Supabase", logo_url: null },
  { id: "c5", name: "Anthropic", logo_url: null },
  { id: "c6", name: "Ramp", logo_url: null },
];
const titles = [
  "Senior Frontend Engineer",
  "Staff Product Designer",
  "Full-Stack Engineer, Growth",
  "AI Platform Engineer",
  "Developer Relations Lead",
  "Backend Engineer, Payments",
  "Site Reliability Engineer",
  "Founding Engineer",
  "Design Engineer",
  "Machine Learning Engineer",
  "Head of Engineering",
  "Product Manager, Platform",
];
const tagPool = [
  ["React", "TypeScript", "Next.js"],
  ["Rust", "WASM", "Systems"],
  ["Python", "FastAPI", "Postgres"],
  ["LLMs", "PyTorch", "Inference"],
  ["Go", "Kubernetes", "Observability"],
  ["Design Systems", "Figma", "Motion"],
];

export const mockJobs: Job[] = Array.from({ length: 24 }, (_, i) => {
  const company = companies[i % companies.length];
  const seniorityOptions = ["junior", "mid", "senior", "staff", "principal"] as const;
  const empOptions = ["full_time", "contract"] as const;
  return {
    id: `job_${i + 1}`,
    title: titles[i % titles.length],
    company,
    location: ["Remote", "San Francisco", "New York", "London", "Berlin"][i % 5],
    remote: i % 3 !== 0,
    seniority: seniorityOptions[i % seniorityOptions.length],
    employment_type: empOptions[i % empOptions.length],
    tags: tagPool[i % tagPool.length],
    description_md: `## About the role\n\nWe are hiring for **${titles[i % titles.length]}** at ${company.name}. Ship product with a small, senior team.\n\n### What you'll do\n- Own features end-to-end\n- Collaborate with design + product\n- Care about craft\n`,
    apply_url: "https://example.com/apply",
    salary_min: 140_000 + (i % 5) * 10_000,
    salary_max: 200_000 + (i % 5) * 15_000,
    currency: "USD",
    status: "live",
    is_featured: i < 3,
    featured_until: i < 3 ? new Date(Date.now() + 7 * 864e5).toISOString() : null,
    created_at: new Date(Date.now() - i * 36e5 * 8).toISOString(),
  };
});

registerMock("GET /jobs", ({ query }) => {
  const page = Number(query.get("page") ?? 1);
  const size = Number(query.get("page_size") ?? 12);
  const q = query.get("q")?.toLowerCase();
  let items = mockJobs;
  if (q) {
    items = items.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.name.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  const start = (page - 1) * size;
  return {
    items: items.slice(start, start + size),
    total: items.length,
    page,
    page_size: size,
  };
});

registerMock("GET /jobs/:id", ({ path }) => {
  const id = path.split("/").pop();
  return mockJobs.find((j) => j.id === id) ?? mockJobs[0];
});

// ---------- Applications ----------
const mockApplications: Application[] = mockJobs.slice(0, 3).map((job, i) => ({
  id: `app_${i + 1}`,
  job,
  resume_id: "res_1",
  cover_letter: null,
  status: (["submitted", "in_review", "interview"] as const)[i],
  created_at: new Date(Date.now() - i * 864e5).toISOString(),
}));
registerMock("GET /applications", () => ({
  items: mockApplications,
  total: mockApplications.length,
  page: 1,
  page_size: 20,
}));

// ---------- Resumes ----------
const mockResumes: Resume[] = [
  {
    id: "res_1",
    filename: "ada-lovelace-resume.pdf",
    storage_path: "resumes/ada-lovelace-resume.pdf",
    size_bytes: 187_432,
    created_at: new Date(Date.now() - 2 * 864e5).toISOString(),
  },
];
registerMock("GET /resumes", () => ({
  items: mockResumes,
  total: mockResumes.length,
  page: 1,
  page_size: 20,
}));

const mockAnalysis: ResumeAnalysis = {
  id: "an_1",
  resume_id: "res_1",
  summary: "Senior frontend engineer with 8 years of experience shipping product at scale.",
  strengths: ["React ecosystem depth", "Design collaboration", "Performance work"],
  gaps: ["Limited backend systems experience", "No public speaking / DevRel"],
  suggestions: [
    "Quantify performance wins with concrete numbers",
    "Add a section on cross-functional leadership",
  ],
  extracted_skills: ["React", "TypeScript", "Next.js", "GraphQL", "Figma"],
  created_at: new Date().toISOString(),
};
registerMock("GET /resumes/:id/analysis", () => mockAnalysis);
registerMock("POST /resumes", ({ body }) => {
  const b = body as { filename: string; storage_path: string };
  const r: Resume = {
    id: `res_${Date.now()}`,
    filename: b.filename,
    storage_path: b.storage_path,
    size_bytes: 0,
    created_at: new Date().toISOString(),
  };
  mockResumes.unshift(r);
  return r;
});
registerMock("DELETE /resumes/:id", () => ({ ok: true }));

// ---------- ATS ----------
const mockScore: AtsScore = {
  id: "ats_1",
  resume_id: "res_1",
  job_id: "job_1",
  jd_snippet: "Senior Frontend Engineer at Vercel...",
  overall: 82,
  sections: { keywords: 78, experience: 88, education: 90, formatting: 74 },
  matched_keywords: ["React", "TypeScript", "Next.js", "Design Systems"],
  missing_keywords: ["Edge runtime", "Turbopack", "Rust"],
  suggestions: [
    "Mention edge/serverless experience explicitly",
    "Add a link to a live project or repo",
  ],
  created_at: new Date().toISOString(),
};
registerMock("POST /ats/score", () => mockScore);
registerMock("GET /ats/:id", () => mockScore);

// ---------- Chat ----------
const mockChat: ChatMessage[] = [
  {
    id: "m_1",
    role: "assistant",
    content: "Hi — I'm the jOBiON assistant. Ask me about a job, your resume, or your ATS score.",
    created_at: new Date().toISOString(),
  },
];
registerMock("GET /chat/messages", () => mockChat);
registerMock("POST /chat/messages", ({ body }) => {
  const b = body as { content?: string };
  return {
    id: `m_${Date.now()}`,
    role: "assistant",
    content: `You said: "${b?.content ?? ""}". (mock response)`,
    created_at: new Date().toISOString(),
  } satisfies ChatMessage;
});

// Billing removed — jOBiON is free for everyone.

// ---------- Admin ----------
const adminFirstNames = ["Ada", "Grace", "Alan", "Linus", "Margaret", "Guido", "Anders", "Rasmus", "Dennis", "Bjarne", "Yukihiro", "Rich"];
const adminLastNames = ["Lovelace", "Hopper", "Turing", "Torvalds", "Hamilton", "van Rossum", "Hejlsberg", "Lerdorf", "Ritchie", "Stroustrup", "Matsumoto", "Hickey"];
const adminRoles = ["seeker", "seeker", "seeker", "employer", "employer", "admin"] as const;
const mockAdminUsers: AdminUser[] = Array.from({ length: 14 }, (_, i) => {
  const first = adminFirstNames[i % adminFirstNames.length];
  const last = adminLastNames[(i * 3) % adminLastNames.length];
  return {
    id: `usr_${i + 1}`,
    email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s+/g, "")}@jobion.dev`,
    full_name: `${first} ${last}`,
    role: adminRoles[i % adminRoles.length],
    created_at: new Date(Date.now() - (i + 1) * 26 * 36e5).toISOString(),
  };
});
registerMock("GET /admin/users", () => ({
  items: mockAdminUsers,
  total: mockAdminUsers.length,
  page: 1,
  page_size: mockAdminUsers.length,
}));
registerMock("PATCH /admin/users/:id/role", ({ path, body }) => {
  const id = path.split("/")[3];
  const b = body as { role: AdminUser["role"] };
  const user = mockAdminUsers.find((u) => u.id === id);
  if (user) user.role = b.role;
  return user ?? mockAdminUsers[0];
});
registerMock("DELETE /admin/users/:id", ({ path }) => {
  const id = path.split("/")[3];
  const idx = mockAdminUsers.findIndex((u) => u.id === id);
  if (idx >= 0) mockAdminUsers.splice(idx, 1);
  return { ok: true as const };
});

// Admin moderation queue (pending jobs)
const pendingJobs: Job[] = mockJobs.slice(0, 6).map((j, i) => ({
  ...j,
  id: `pending_${i + 1}`,
  status: "pending" as const,
  created_at: new Date(Date.now() - (i + 1) * 4 * 36e5).toISOString(),
}));

registerMock("GET /admin/jobs/pending", () => ({
  items: pendingJobs,
  total: pendingJobs.length,
  page: 1,
  page_size: pendingJobs.length,
}));
registerMock("GET /admin/jobs", () => ({
  items: mockJobs,
  total: mockJobs.length,
  page: 1,
  page_size: mockJobs.length,
}));
registerMock("POST /admin/jobs/:id/approve", ({ path }) => {
  const id = path.split("/")[3];
  const idx = pendingJobs.findIndex((j) => j.id === id);
  if (idx >= 0) {
    const [job] = pendingJobs.splice(idx, 1);
    job.status = "live";
    return job;
  }
  return { ...mockJobs[0], status: "live" as const };
});
registerMock("POST /admin/jobs/:id/reject", ({ path }) => {
  const id = path.split("/")[3];
  const idx = pendingJobs.findIndex((j) => j.id === id);
  if (idx >= 0) {
    const [job] = pendingJobs.splice(idx, 1);
    job.status = "archived";
    return job;
  }
  return { ...mockJobs[0], status: "archived" as const };
});
registerMock("GET /admin/metrics", () => ({
  users: mockAdminUsers.length,
  jobs: mockJobs.length,
  applications: 128,
  pending_jobs: pendingJobs.length,
}));

// ---------- Saved jobs (mock in-memory) ----------
const savedSet = new Set<string>();
registerMock("POST /jobs/:id/save", ({ path }) => {
  const id = path.split("/")[2];
  savedSet.add(id);
  return { saved: true as const };
});
registerMock("DELETE /jobs/:id/save", ({ path }) => {
  const id = path.split("/")[2];
  savedSet.delete(id);
  return { saved: false as const };
});
registerMock("GET /jobs/saved", () => {
  const items = mockJobs.filter((j) => savedSet.has(j.id));
  return { items, total: items.length, page: 1, page_size: items.length };
});

// ---------- Applications (create) ----------
registerMock("POST /applications", ({ body }) => {
  const b = body as { job_id: string; resume_id: string; cover_letter?: string };
  const job = mockJobs.find((j) => j.id === b.job_id) ?? mockJobs[0];
  return {
    id: `app_${Date.now()}`,
    job,
    resume_id: b.resume_id ?? "res_1",
    cover_letter: b.cover_letter ?? null,
    status: "submitted" as const,
    created_at: new Date().toISOString(),
  };
});

// ---------- Employer ----------
const myJobs = mockJobs.slice(0, 8).map((j, i) => ({
  ...j,
  status: (["live", "live", "live", "pending", "draft", "live", "archived", "live"] as const)[i],
  views: 120 + i * 87 + (i % 3) * 40,
  applicant_count: 3 + i * 4 + (i % 4),
  new_applicants: i % 3 === 0 ? (i % 5) + 1 : 0,
}));

registerMock("GET /employer/jobs", () => ({
  items: myJobs,
  total: myJobs.length,
  page: 1,
  page_size: myJobs.length,
}));

registerMock("GET /employer/stats", () => ({
  total_jobs: myJobs.length,
  live_jobs: myJobs.filter((j) => j.status === "live").length,
  total_views: myJobs.reduce((a, j) => a + j.views, 0),
  total_applicants: myJobs.reduce((a, j) => a + j.applicant_count, 0),
}));


registerMock("POST /employer/jobs", ({ body }) => {
  const b = body as Record<string, unknown>;
  const now = new Date().toISOString();
  const job = {
    id: `job_new_${Date.now()}`,
    title: String(b.title ?? "Untitled role"),
    company: { id: "c_new", name: String(b.company_name ?? "Your Company"), logo_url: null },
    location: String(b.location ?? "Remote"),
    remote: Boolean(b.remote),
    seniority: (b.seniority as never) ?? "mid",
    employment_type: (b.employment_type as never) ?? "full_time",
    tags: (b.tags as string[]) ?? [],
    description_md: String(b.description_md ?? ""),
    apply_url: (b.apply_url as string) ?? null,
    salary_min: (b.salary_min as number) ?? null,
    salary_max: (b.salary_max as number) ?? null,
    currency: (b.currency as string) ?? "USD",
    status: "pending" as const,
    is_featured: false,
    featured_until: null,
    created_at: now,
    views: 0,
    applicant_count: 0,
    new_applicants: 0,
  };
  return job;
});

registerMock("POST /employer/jobs/feature-checkout", () => ({
  url: "https://checkout.stripe.com/mock-session",
}));

// ---------- Employer applicants ----------
const firstNames = ["Aisha", "Marcus", "Priya", "Diego", "Nora", "Kenji", "Sofia", "Idris", "Lena", "Rafael", "Mei", "Jonas"];
const lastNames = ["Okafor", "Bennett", "Sharma", "Alvarez", "Sundqvist", "Watanabe", "Rossi", "Malik", "Kowalski", "Silva", "Zhao", "Berger"];
const headlines = [
  "Senior Frontend Engineer — React, Design Systems",
  "Full-stack engineer (TS + Python)",
  "Design Engineer, ex-Linear",
  "Platform Engineer — Rust, Go",
  "PM turned engineer, LLM tooling",
  "Staff SWE, distributed systems",
];
const kwPool = ["React", "TypeScript", "Next.js", "Design Systems", "GraphQL", "Node.js", "Postgres", "Kubernetes", "Rust", "Python", "FastAPI", "Edge runtime"];

function makeApplicants(jobId: string, count = 9) {
  return Array.from({ length: count }, (_, i) => {
    const first = firstNames[(i * 3) % firstNames.length];
    const last = lastNames[(i * 5) % lastNames.length];
    const stage = (["new", "new", "reviewed", "shortlisted", "interview", "reviewed", "rejected", "shortlisted", "hired"] as const)[i % 9];
    const score = 62 + ((i * 7) % 34);
    const matched = kwPool.filter((_, k) => (k + i) % 3 === 0).slice(0, 5);
    const missing = kwPool.filter((_, k) => (k + i) % 4 === 1).slice(0, 3);
    return {
      id: `app_${jobId}_${i + 1}`,
      job_id: jobId,
      candidate: {
        id: `usr_${jobId}_${i + 1}`,
        full_name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        avatar_url: null,
        headline: headlines[i % headlines.length],
        location: ["Remote", "Berlin", "SF", "London", "NYC", "Lisbon"][i % 6],
      },
      resume: {
        id: `res_${jobId}_${i + 1}`,
        filename: `${first.toLowerCase()}-${last.toLowerCase()}-resume.pdf`,
        storage_path: `resumes/mock/${first.toLowerCase()}-${last.toLowerCase()}.pdf`,
        preview_url: null,
      },
      ats_score: score,
      matched_keywords: matched,
      missing_keywords: missing,
      cover_letter:
        i % 2 === 0
          ? `Hi team,\n\nI'm ${first} — ${headlines[i % headlines.length].toLowerCase()}. I've been following your work and would love to help ship the next chapter.\n\nBest,\n${first}`
          : null,
      stage,
      applied_at: new Date(Date.now() - (i + 1) * 6 * 36e5).toISOString(),
    };
  });
}

registerMock("GET /employer/jobs/:id/applicants", ({ path }) => {
  const parts = path.split("/");
  const jobId = parts[3];
  const items = makeApplicants(jobId);
  return { items, total: items.length, page: 1, page_size: items.length };
});

registerMock("PATCH /employer/applicants/:id/stage", ({ path, body }) => {
  const b = body as { stage: string };
  return { id: path.split("/")[3], stage: b.stage };
});
