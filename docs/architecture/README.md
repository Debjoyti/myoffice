# PRSK Architecture

## Canonical Architecture

ONE backend. ONE language. ONE runtime. ONE deploy target.

```
┌─────────────────────────────────────────────────────────┐
│ Next.js App Router (Vercel)                             │
│  ├─ /app/(routes)            ← UI                       │
│  ├─ /app/api/v1/*            ← REST API (TypeScript)    │
│  ├─ /lib/db/                 ← Supabase client wrappers │
│  ├─ /lib/integrations/*      ← Third-party API clients  │
│  ├─ /lib/services/*          ← Business logic modules   │
│  └─ /inngest/functions/*     ← Background jobs          │
└─────────────────────────────────────────────────────────┘
                  ↓                       ↓
┌─────────────────────────────┐  ┌──────────────────────┐
│ Supabase                    │  │ Inngest              │
│  ├─ Postgres + RLS          │  │  ├─ Scheduled jobs   │
│  ├─ Auth (JWT)              │  │  ├─ Webhook fan-out  │
│  ├─ Storage                 │  │  ├─ Retries          │
│  ├─ Realtime                │  │  └─ Long workflows   │
│  └─ Edge Functions          │  └──────────────────────┘
│     (only for DB-near work) │
└─────────────────────────────┘
```

**No FastAPI. No Python service. No second backend.**

## The Rule for "Where does this code live?"

A new piece of backend logic. Where does it go? Walk this decision tree top-to-bottom; first match wins:

1. **Is it a constraint that must be enforced atomically with a write?** (e.g., "you can't have two primary contacts on a vendor")
   → **Postgres CHECK constraint or trigger** in a Supabase migration.

2. **Is it a permission rule about who can see/edit which rows?**
   → **Supabase RLS policy** in a migration. Never enforce tenancy in app code alone.

3. **Is it an automatic side-effect when a row changes?** (e.g., "when payroll_run becomes complete, generate payslips")
   → **Postgres trigger** that writes to `private.event_outbox` + an **Inngest function** that consumes the event and does the side-effect.

4. **Is it a request/response — user does X, gets Y back?**
   → **Next.js API route** at `/app/api/v1/<resource>/route.ts`. Validates with Zod, calls one or more services, returns typed JSON.

5. **Is it shared business logic used by multiple API routes or jobs?** (e.g., "calculate invoice total with tax")
   → **A function in `/lib/services/<domain>.ts`**. Pure where possible. Reusable.

6. **Is it a third-party API call?** (Razorpay, WhatsApp, Setu, Claude)
   → **`/lib/integrations/<provider>/client.ts`** following the integrations registry pattern. Never call third parties from API routes directly.

7. **Is it a job that runs on a schedule, retries, fans out, or takes >10 seconds?** (e.g., daily founder digest, bulk payout)
   → **Inngest function** at `/inngest/functions/<job>.ts`.

8. **Is it a heavy report or a query that summarizes many rows for a UI?** (e.g., founder cockpit metrics)
   → **Postgres function** (PL/pgSQL) called from the API route, OR a **materialized view** refreshed by Inngest. Faster than fetching rows + aggregating in JS.

9. **Is it a data transformation right at the moment of read?** (e.g., camelCase keys in API response)
   → **Zod transform or service-layer mapper** — never a database trigger.

10. **Is it AI-powered?** (LLM call, embedding, classification)
    → **`/lib/integrations/<provider>/`** for the API client, called from a service in `/lib/services/ai/<feature>.ts`. AI is just another integration; it doesn't need a separate runtime.

## When would a separate backend ever make sense?

You'd add a separate (Python or otherwise) service if and only if:
- You're training or self-hosting ML models (PRSK is not — it consumes Claude/Gemini)
- You need a stateful long-lived process (PRSK has none — Inngest handles state)
- You need a binary library only available in Python/Go (PRSK has none)
- A specific compliance regulator demands an air-gapped service (none)

## Mapping: PRSK Modules
- **Auth**: `/app/api/v1/auth/*` and `/lib/services/auth.ts`
- **Other modules**: Follow the same structure in `/app/api/v1/` and `/lib/services/`.
