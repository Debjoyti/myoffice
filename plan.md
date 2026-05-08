1.  **Fix Phase 1 Foundation Database Migration:**
    *   Update `supabase/migrations/20260601000000_phase1_foundation.sql` to include `deleted_at` on ALL domain tables (`user_company_roles`, `domain_events`, etc.).
    *   Update RLS policies to include `AND deleted_at IS NULL` for soft deletes.
    *   Update the `public.users` trigger to actually inject the JWT claim for company_id + role (wait, supabase auth.users jwt claim injection is usually handled via an auth hook edge function or a postgrest pre-request hook; I will set up the postgrest pre-request hook).

2.  **Fix API Middleware (Implement Upstash & Auth Check):**
    *   Update `api/src/middleware/index.ts` to implement actual Supabase auth checking using `@supabase/auth-helpers-nextjs` and Upstash rate limiting using `@upstash/ratelimit` and `@upstash/redis`.

3.  **Implement Remaining Phase 1 Libraries:**
    *   Create `api/src/lib/db/index.ts`.
    *   Create `api/src/lib/auth/index.ts`.
    *   Create `api/src/lib/logger/index.ts` (using `pino`).
    *   Create `api/src/lib/telemetry/index.ts` (using `posthog-node`).

4.  **Fix pgTAP Tenant Isolation Test:**
    *   Update `supabase/tests/database/01-tenant-isolation.sql` to actually create mock tenants and test RLS isolation instead of just passing.

5.  **Pre-commit Steps:**
    *   Call `request_code_review`.
    *   Call `initiate_memory_recording`.

6.  **Submission:**
    *   Submit the finalized Phase 1 setup.
