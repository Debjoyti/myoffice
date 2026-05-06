# ADR 001: Phase 1 Foundation

## Status
Accepted

## Context
We are starting Phase 1 of the PRSK backend build. The goal is to establish the foundation for a multi-tenant business OS.

## Decisions
1. **Supabase Schema**: Created schemas for `public`, `private`, `audit`, and `integrations`.
2. **Helper Functions**: Defined SQL functions (`private.current_company_id()`, `private.user_has_role()`, etc.) to cleanly implement multi-tenant RLS.
3. **Core Tables**: Created `companies`, `users`, `user_company_roles` to act as the root of the data model.
4. **API Framework**: Next.js App Router API chosen. Placed inside a new `api` directory to cleanly separate from existing frontend/backend code.
5. **Validation**: Enforcing `zod` schemas for all boundaries, specifically including Indian format validators (PAN, GSTIN, etc.).

## Consequences
- Every new table must include a `company_id` and rely on these established RLS helper functions.
- The `api` directory becomes the primary backend layer using TypeScript, transitioning logic away from the legacy Python codebase when appropriate.
