# DevBoard API Contract

Single source of truth for the backend implementation. The frontend calls the typed client in `src/services/api.ts`; every method maps 1-to-1 to a REST endpoint listed here. Shared types live in `src/types/index.ts`.

To swap mock → real: replace each method body in `api.ts` with a `fetch` against `BASE_URL + path` returning the same shape. UI stays untouched.

## Conventions

- Auth: `Authorization: Bearer <token>` from `auth.signIn`/`auth.signUp` responses.
- Errors: `{ "error": "string" }` with appropriate HTTP status (`400/401/403/404/409/500`).
- Timestamps: ISO 8601 UTC.
- Pagination: `?page=1&pageSize=20` → `Paginated<T>`.

## Endpoints

### Auth
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/auth/sign-up` | `{ email, password, role, fullName }` | `AuthSession` |
| POST | `/auth/sign-in` | `{ email, password }` | `AuthSession` |
| POST | `/auth/sign-out` | — | `204` |
| GET  | `/auth/me` | — | `AuthSession \| null` |

### Jobs
| Method | Path | Body / Query | Response |
| --- | --- | --- | --- |
| GET  | `/jobs` | `JobFilters & { page, pageSize }` | `Paginated<JobWithCompany>` |
| GET  | `/jobs/:id` | — | `JobWithCompany` |
| POST | `/jobs` | `Omit<Job,'id'\|'status'\|'featured'\|'views'\|'createdAt'>` | `Job` (status defaults to `pending`) |
| PATCH| `/jobs/:id` | `Partial<Job>` | `Job` |
| GET  | `/jobs/mine` | — | `JobWithCompany[]` (employer's jobs) |
| GET  | `/jobs/search?q=` | `?q=` | `JobWithCompany[]` (semantic + lexical, ordered) |
| GET  | `/jobs/recommended?resumeId=` | `?resumeId=` | `JobWithCompany[]` |
| GET  | `/jobs/:id/similar` | — | `JobWithCompany[]` |

### Companies
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET  | `/companies` | — | `Company[]` |
| GET  | `/companies/:idOrSlug` | — | `{ company, jobs }` |
| PUT  | `/companies/:id` | `Partial<Company>` | `Company` |

### Applications
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/jobs/:jobId/applications` | `{ coverNote?, resumeId? }` | `Application` |
| GET  | `/jobs/:jobId/applications` | — (employer only) | `Application[]` w/ `applicant` |
| GET  | `/applications/mine` | — | `Application[]` w/ `job` |
| PATCH| `/applications/:id` | `{ stage }` | `Application` |

### Resumes
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/resumes` | multipart/form-data `file` | `Resume` (parsed=null) |
| POST | `/resumes/:id/parse` | — | `ParsedResume` (server fills `resume.parsed`) |
| GET  | `/resumes/mine` | — | `Resume[]` |

### Saved jobs
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET  | `/saved-jobs` | — | `JobWithCompany[]` |
| GET  | `/saved-jobs/ids` | — | `string[]` |
| POST | `/saved-jobs` | `{ jobId }` | `{ saved: boolean }` (toggle) |

### Admin
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET  | `/admin/jobs?status=pending` | — | `JobWithCompany[]` |
| PATCH| `/admin/jobs/:id/status` | `{ status }` | `Job` |
| GET  | `/admin/stats` | — | `{ totalJobs, live, pending, applications, companies }` |

### Billing
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/billing/feature-job` | `{ jobId }` | `{ url, sessionId }` (redirect target) |

## Types

See `src/types/index.ts` — that file is the canonical schema. Any change to a response shape MUST also update the type and this contract document.
