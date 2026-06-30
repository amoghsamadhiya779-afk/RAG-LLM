import type { Application, Company, Job, Profile, Resume, User } from "@/types";

// Stable mock users
export const seedUsers: User[] = [
  { id: "u-seeker", email: "alex@example.com", createdAt: "2025-01-10T10:00:00Z" },
  { id: "u-employer", email: "hire@stellar.dev", createdAt: "2025-01-05T10:00:00Z" },
  { id: "u-admin", email: "admin@jOBiON.io", createdAt: "2025-01-01T10:00:00Z" },
];

export const seedProfiles: Profile[] = [
  { id: "u-seeker", fullName: "Alex Rivera", role: "seeker", headline: "Full-stack engineer", bio: "Building delightful product. TS, React, Postgres.", avatarUrl: null },
  { id: "u-employer", fullName: "Sam Chen", role: "employer", headline: "Head of Talent @ Stellar Labs", avatarUrl: null },
  { id: "u-admin", fullName: "jOBiON Admin", role: "admin", avatarUrl: null },
];

export const seedCompanies: Company[] = [
  { id: "c-stellar", slug: "stellar-labs", name: "Stellar Labs", about: "Stellar Labs builds AI tooling for product teams. We are 40 people, profitable, and remote-first.", location: "Remote / NYC", size: "11–50", ownerId: "u-employer", logoUrl: null, website: "https://stellar.dev" },
  { id: "c-orbit", slug: "orbit", name: "Orbit", about: "The orchestration layer for modern data teams.", location: "San Francisco", size: "51–200", ownerId: "u-employer", logoUrl: null, website: "https://orbit.example" },
  { id: "c-northwind", slug: "northwind", name: "Northwind", about: "Open-source observability for distributed systems.", location: "Remote (EU/US)", size: "11–50", ownerId: "u-employer", logoUrl: null },
  { id: "c-prism", slug: "prism", name: "Prism", about: "Design tooling for cross-functional product teams.", location: "Berlin", size: "201–500", ownerId: "u-employer", logoUrl: null },
  { id: "c-cobalt", slug: "cobalt", name: "Cobalt Robotics", about: "Hardware + ML for warehouse automation.", location: "Austin", size: "51–200", ownerId: "u-employer", logoUrl: null },
  { id: "c-loom", slug: "loomstack", name: "Loomstack", about: "Edge compute infrastructure for AI inference.", location: "Remote", size: "11–50", ownerId: "u-employer", logoUrl: null },
];

const now = Date.now();
const day = 86400_000;
const t = (d: number) => new Date(now - d * day).toISOString();

export const seedJobs: Job[] = [
  { id: "j-1", companyId: "c-stellar", title: "Senior Full-stack Engineer", description: "Own end-to-end features across our Next.js + Postgres stack. Partner with design on shipping polished, performant product.", requirements: ["5+ years building web products", "Deep TypeScript fluency", "Comfortable with SQL and schema design"], location: "Remote", remote: true, jobType: "full_time", level: "senior", salaryMin: 160000, salaryMax: 210000, tags: ["TypeScript", "React", "Next.js", "Postgres"], status: "live", featured: true, views: 1240, createdAt: t(2) },
  { id: "j-2", companyId: "c-orbit", title: "Staff Backend Engineer (Go)", description: "Design and scale the orchestration engine that powers thousands of data pipelines per minute.", requirements: ["Go in production at scale", "Distributed systems experience", "Strong API design taste"], location: "San Francisco", remote: false, jobType: "full_time", level: "staff", salaryMin: 220000, salaryMax: 290000, tags: ["Go", "Kafka", "Kubernetes", "AWS"], status: "live", featured: true, views: 980, createdAt: t(4) },
  { id: "j-3", companyId: "c-northwind", title: "Software Engineer, Observability", description: "Help us build the open-source standard for tracing and metrics across polyglot systems.", requirements: ["Rust or Go", "Curious about OpenTelemetry", "Care about developer experience"], location: "Remote (EU/US)", remote: true, jobType: "full_time", level: "mid", salaryMin: 130000, salaryMax: 170000, tags: ["Rust", "OpenTelemetry", "DevTools"], status: "live", featured: false, views: 612, createdAt: t(6) },
  { id: "j-4", companyId: "c-prism", title: "Senior Frontend Engineer", description: "Push the boundaries of what a design tool can feel like in the browser. Canvas, WebGL, real-time collaboration.", requirements: ["Expert React + TypeScript", "Comfortable with canvas / WebGL", "Care about animation and performance"], location: "Berlin", remote: false, jobType: "full_time", level: "senior", salaryMin: 110000, salaryMax: 150000, tags: ["React", "TypeScript", "WebGL", "Canvas"], status: "live", featured: true, views: 1502, createdAt: t(1) },
  { id: "j-5", companyId: "c-cobalt", title: "ML Engineer — Perception", description: "Train and deploy perception models on robots that run 24/7 in real warehouses.", requirements: ["PyTorch in production", "Computer vision experience", "Comfortable with embedded constraints"], location: "Austin", remote: false, jobType: "full_time", level: "senior", salaryMin: 170000, salaryMax: 220000, tags: ["Python", "PyTorch", "Computer Vision", "Robotics"], status: "live", featured: false, views: 420, createdAt: t(8) },
  { id: "j-6", companyId: "c-loom", title: "Infrastructure Engineer", description: "Build the control plane for edge inference across hundreds of POPs.", requirements: ["Rust or Go", "Kubernetes at scale", "Networking fundamentals"], location: "Remote", remote: true, jobType: "full_time", level: "senior", salaryMin: 180000, salaryMax: 230000, tags: ["Rust", "Kubernetes", "Networking", "Infra"], status: "live", featured: false, views: 731, createdAt: t(10) },
  { id: "j-7", companyId: "c-stellar", title: "Founding Designer", description: "Define the visual and interaction language for our entire product surface.", requirements: ["Senior product design experience", "Strong systems thinker", "Comfortable in Figma + prototyping tools"], location: "Remote / NYC", remote: true, jobType: "full_time", level: "senior", salaryMin: 150000, salaryMax: 200000, tags: ["Design", "Figma", "Systems"], status: "live", featured: false, views: 388, createdAt: t(12) },
  { id: "j-8", companyId: "c-orbit", title: "Software Engineering Intern (Summer)", description: "12-week paid internship building features end-to-end on our open-source SDK.", requirements: ["Currently enrolled in CS or related", "Comfortable shipping in Python or TS", "Curious about distributed systems"], location: "San Francisco / Remote", remote: true, jobType: "internship", level: "intern", salaryMin: 8000, salaryMax: 10000, tags: ["Python", "TypeScript", "Open Source"], status: "live", featured: true, views: 2100, createdAt: t(3) },
  { id: "j-9", companyId: "c-prism", title: "DevRel Engineer", description: "Be the bridge between our product and the developer community. Talks, demos, sample apps.", requirements: ["Strong written + speaking skills", "Solid React + TS", "Loves teaching"], location: "Remote (EU)", remote: true, jobType: "full_time", level: "mid", salaryMin: 100000, salaryMax: 140000, tags: ["DevRel", "React", "TypeScript", "Writing"], status: "live", featured: false, views: 297, createdAt: t(14) },
  { id: "j-10", companyId: "c-northwind", title: "Site Reliability Engineer", description: "Own the reliability of a system handling billions of spans per day.", requirements: ["Strong systems debugging", "Comfortable on-call", "Linux internals"], location: "Remote", remote: true, jobType: "full_time", level: "senior", salaryMin: 160000, salaryMax: 200000, tags: ["SRE", "Linux", "Observability"], status: "live", featured: false, views: 511, createdAt: t(16) },
  { id: "j-11", companyId: "c-cobalt", title: "Embedded Software Engineer", description: "Write firmware that runs on every robot we deploy.", requirements: ["C/C++ in production", "RTOS experience", "Hardware empathy"], location: "Austin", remote: false, jobType: "full_time", level: "mid", salaryMin: 140000, salaryMax: 180000, tags: ["C++", "Embedded", "Firmware"], status: "live", featured: false, views: 188, createdAt: t(20) },
  { id: "j-12", companyId: "c-loom", title: "Developer Experience Engineer", description: "Make our SDKs feel like magic across 6 languages.", requirements: ["Authored a popular OSS library", "Cares about API ergonomics", "Strong technical writing"], location: "Remote", remote: true, jobType: "full_time", level: "senior", salaryMin: 160000, salaryMax: 200000, tags: ["DevEx", "TypeScript", "Go", "OSS"], status: "live", featured: false, views: 244, createdAt: t(22) },
  // Pending for admin queue
  { id: "j-13", companyId: "c-stellar", title: "Engineering Manager, Platform", description: "Grow and lead the platform team behind everything we ship.", requirements: ["3+ years managing engineers", "Hands-on technical background", "Strong written comms"], location: "Remote / NYC", remote: true, jobType: "full_time", level: "principal", salaryMin: 220000, salaryMax: 280000, tags: ["Management", "Platform"], status: "pending", featured: false, views: 0, createdAt: t(0) },
  { id: "j-14", companyId: "c-orbit", title: "Junior Backend Engineer", description: "Join our backend team and learn distributed systems by doing.", requirements: ["1+ years backend experience", "Solid in any typed language", "Hungry to learn"], location: "San Francisco", remote: false, jobType: "full_time", level: "junior", salaryMin: 110000, salaryMax: 140000, tags: ["Go", "Python", "Postgres"], status: "pending", featured: false, views: 0, createdAt: t(0) },
];

export const seedApplications: Application[] = [
  { id: "a-1", jobId: "j-1", userId: "u-seeker", stage: "applied", createdAt: t(2), coverNote: "Big fan of your product, would love to chat." },
  { id: "a-2", jobId: "j-4", userId: "u-seeker", stage: "reviewing", createdAt: t(5) },
];

export const seedResumes: Resume[] = [
  {
    id: "r-1",
    userId: "u-seeker",
    fileName: "alex-rivera-resume.pdf",
    uploadedAt: t(7),
    parsed: {
      skills: ["TypeScript", "React", "Next.js", "Node.js", "Postgres", "GraphQL", "Tailwind"],
      experience: [
        { title: "Senior Engineer", company: "Acme", years: 3 },
        { title: "Full-stack Engineer", company: "Hyperloop", years: 2 },
      ],
      education: [{ school: "UC Berkeley", degree: "B.S. Computer Science" }],
    },
  },
];
