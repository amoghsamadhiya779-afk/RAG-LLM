# jOBiON — Frontend security posture

Frontend-only project. Server hardening (rate limits, JWKS verify, RLS policies,
webhook signatures, image transforms) is owned by the FastAPI + Supabase side.

## Shipped

### Headers
- `public/_headers` (Cloudflare/Netlify format): HSTS, nosniff,
  `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`,
  `frame-ancestors 'none'` in CSP.
- Meta CSP mirror in `src/routes/__root.tsx` for hosts that ignore `_headers`.
- Long-term cache for `/assets/*` + `/fonts/*`; `no-cache` on HTML.

### Auth / open-redirect
- `sanitizeRedirect` (`src/components/auth/auth-errors.ts`) accepts only
  same-origin paths — rejects protocol-relative (`//host`), backslash tricks
  (`/\host`), and any candidate containing `:` (blocks `javascript:` /
  `data:` scheme smuggling).
- All auth routes (`/login`, `/signup`, `/auth/callback`) run redirect
  targets through it before navigating.

### Build guards
- `src/lib/env.ts` throws at build/boot if `VITE_USE_MOCKS` is truthy in
  production, or if `VITE_API_URL` is missing when mocks are off.
- No `VITE_*` var carries a secret. Only publishable Supabase + optional
  Turnstile site key.

### Guest data
- `useGuestDataExpiry` (`src/hooks/useGuestDataExpiry.ts`) — day-6 warning,
  day-7 auto-purge.
- `GuestBanner` exposes a "Clear my guest data" action.
- Guest quotas (`src/lib/guest/quota.ts`) throttle expensive AI actions.

### Client hardening
- `apiFetch` attaches `x-request-id` + `Idempotency-Key` on every mutation
  and forwards a Turnstile token when supplied.
- Sentry init (`src/lib/observability/sentry.ts`) is lazy + PII-scrubbed.
- Dropzone validates 5 MB cap + PDF/DOCX/DOC magic bytes before upload.

## Follow-ups (backend / infra)

- Real Turnstile site key + server-side verification.
- Server-side rate limits per identity + IP on `/analyze`, `/apply`, and
  auth endpoints; global spend kill-switch on AI calls.
- Supabase RLS on every table + storage bucket; audit `service_role` usage.
- Backend JWKS verify of Supabase JWTs on every write.
- Move guest resume storage from `localStorage` base64 to IndexedDB
  (`idb-keyval`) once the FastAPI service defines a resumable upload
  contract.

## Verification

```bash
# Headers on preview
curl -I https://<preview>/ | grep -Ei 'content-security-policy|strict-transport|x-frame|referrer|permissions'

# Redirect fuzz
/login?redirect=//evil.com          # → "/"
/login?redirect=/\evil.com          # → "/"
/login?redirect=javascript:alert(1) # → "/"
/login?redirect=/dashboard          # → "/dashboard"
```
