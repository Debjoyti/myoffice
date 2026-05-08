# ADR-001: Single Backend Architecture (Next.js + Supabase + Inngest)

## Context
There has been architectural confusion regarding whether application logic should live in Supabase Edge Functions, FastAPI Python services, or the Next.js backend. This led to fragmented implementations, with duplicated functionality and logic placed at the "wrong layer" (e.g. FastAPI doing app logic instead of Next.js, and tenancy filtering in app code rather than Supabase RLS).

## Decision
We are committing to a **single backend** built on Next.js App Router, Supabase, and Inngest, using exclusively TypeScript.

- **FastAPI** / Python is entirely removed for standard application logic.
- **Supabase Edge Functions** are restricted to database-adjacent work (like being called from a Postgres Trigger or PostgREST RPC). HTTP API endpoints must live in Next.js API Routes.
- **Supabase Postgres + RLS** is the sole source of truth for authorization rules (tenancy isolation).
- **Inngest** will handle all asynchronous/background jobs.

## Rationale
- **Single mental model**: TypeScript + Supabase + Next.js + Inngest. Only four nouns make up the entire backend, simplifying onboarding and mental overhead.
- **Lower payroll cost**: Hiring one TypeScript engineer is more cost-effective and scalable than needing "TypeScript + Python" full-stack engineers.
- **Faster iteration**: Deploying changes does not require service-to-service coordination. The whole Next.js application is deployed together on Vercel.
- **Fewer auth/error/test stories**: One consistent way of handling requests, errors, auth checking, and testing, instead of replicating logic across FastAPI and Next.js.
- **Clearer billing**: Consolidation reduces our external providers to Vercel, Supabase, and Inngest.

## Consequences
**Positive:**
- Centralized rule for code placement (the Decision Tree in `CLAUDE.md`).
- Faster onboarding and simpler deployments.
- No need to synchronize auth state or data models between Python and TypeScript.

**Negative:**
- Large initial migration effort to port ~200 FastAPI endpoints to Next.js API routes.
- Python-specific libraries (like specific AI SDKs or Optimization libs like OR-Tools) will require finding TS alternatives or, as an absolute last resort exception, a dedicated microservice specifically for that single function.

## Alternatives Considered
- **FastAPI alongside Next.js:** Rejected due to cognitive load, deployment complexity, and duplicate business logic.
- **Separate Python ML service:** Rejected because we are primarily consuming external AI APIs (Claude/Gemini), which can easily be done via TS integrations.
- **Full Edge Functions Backend:** Rejected because edge functions are harder to test and debug locally for full-blown application endpoints, compared to Next.js API Routes which integrate well into our Vercel workflow.
