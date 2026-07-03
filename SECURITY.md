# Security Architecture & Audit Report

## 1. Authentication & Authorization (AuthZ) Matrix
- **Identity Provider**: Supabase Auth (JWT).
- **Enforcement**: strict route dependencies via `app.core.deps.py`.
  - `require_user`: Validates JWT signature (via JWKS or HS256 secret) and ensures the user exists in the local database. Hard-rejects with 401 if invalid.
  - `optional_user`: Specifically designed for Guest-First routes (e.g., AI inference). Returns `None` for missing/invalid tokens but permits the request to proceed.
  - `require_role([RoleEnum])`: Strict Role-Based Access Control (RBAC). Rejects with 403 Forbidden if the authenticated user lacks the required role.

**Mitigated Risks**: Removed all `MOCK_` bypass variables that previously disabled authentication in production environments.

## 2. Abuse Controls & Rate Limiting
- **Global API Rate Limits**: Powered by Upstash Redis and `slowapi`.
- **Guest AI Guard**: 
  - Routes exposed to guests enforce a tiered limit: **5/min**, **20/hr**, and **60/day** per IP.
  - **Cloudflare Turnstile**: Mandatory challenge verification for unauthenticated AI routes to prevent bot exhaustion.
- **Idempotency**: 
  - Mutation endpoints (POST, PUT, PATCH, DELETE) honor an `Idempotency-Key` header.
  - Custom `IdempotentRoute` class intercepts mutating requests, caches the JSON response in Upstash Redis for 48 hours, and replays it for duplicate keys (returning `Idempotency-Replayed: true`).
- **AI Budget**: 
  - Global daily AI token budget enforces a circuit breaker to prevent runaway LLM costs.

## 3. Safe Configuration & Secret Hygiene
- **Strict Pydantic Settings**: `app.core.config.Settings` is now the sole reader of environment variables. Missing required secrets prevent application startup with a clear initialization error.
- **Removed Pervasive `os.environ`**: Replaced all inline `os.environ.get()` calls with strongly typed `settings` properties.
- **Secret Masking**: Utility scripts (e.g., `check_connections.py`) mask secrets, showing only the final 4 characters.

## 4. Transport Security & Network
- **CORS Hardening**: Removed wildcard `allow_origins=["*"]`. The application now strictly binds to `settings.ALLOWED_ORIGINS` (comma-split, whitespace/slash stripped), ensuring only verified frontend domains can interact with the API.
- **Upstream Timeouts**: All external API calls (Supabase, Turnstile, Resend, Adzuna, Gemini) via `httpx.AsyncClient` now enforce explicit connection and read timeouts (`timeout=10.0`), preventing resource starvation from hanging third-party services.

## 5. Logging & Observability
- **PII Redaction**: `structlog` pipeline includes a custom redactor that obfuscates sensitive keys (`password`, `token`, `secret`, `api_key`, `authorization`, `email`, `phone`) as `****REDACTED****` before serialization.
- **Structured JSON Logs**: Deployed structured JSON logging for reliable ingestion by logging agents.

## 6. Dependency Auditing
- Added `pip-audit` to the verification workflow to scan Python dependencies for known CVEs. Continuous auditing ensures vulnerable packages are flagged before deployment.

## 7. Database Integrity
- Disabled SQLAlchemy's internal statement caching (`statement_cache_size=0`, `prepared_statement_cache_size=0`) and implemented `NullPool` to ensure compatibility with Supavisor's transaction-mode connection pooler, preventing stale connection errors.
