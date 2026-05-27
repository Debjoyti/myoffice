# Code Placement Decision Tree

A new piece of backend logic. Where does it go? Walk this decision tree top-to-bottom; first match wins:

1. **Is it a constraint that must be enforced atomically with a write?**
   *Example: "you can't have two primary contacts on a vendor", "an invoice's line items sum must equal the invoice total"*
   → **Postgres CHECK constraint or trigger** in a Supabase migration.

2. **Is it a permission rule about who can see/edit which rows?**
   *Example: "A user can only see vendors for their company"*
   → **Supabase RLS policy** in a migration. Never enforce tenancy in app code alone.

3. **Is it an automatic side-effect when a row changes?**
   *Example: "when payroll_run becomes complete, generate payslips"*
   → **Postgres trigger** that writes to `private.event_outbox` + an **Inngest function** that consumes the event and does the side-effect (calls APIs, creates other rows, sends WhatsApp). Triggers do NOT call external APIs directly. Outbox + Inngest is the pattern.

4. **Is it a request/response — user does X, gets Y back?**
   *Example: "Fetch list of employees", "Submit a time-off request"*
   → **Next.js API route** at `/app/api/v1/<resource>/route.ts`. Validates with Zod, calls one or more services, returns typed JSON.

5. **Is it shared business logic used by multiple API routes or jobs?**
   *Example: "calculate invoice total with tax", "compute trust score"*
   → **A function in `/lib/services/<domain>.ts`**. Pure where possible. Reusable.

6. **Is it a third-party API call?**
   *Example: Razorpay, WhatsApp, Setu, Claude*
   → **`/lib/integrations/<provider>/client.ts`** following the integrations registry pattern. Never call third parties from API routes directly; always go through the lib.

7. **Is it a job that runs on a schedule, retries, fans out, or takes >10 seconds?**
   *Example: daily founder digest, nightly reconciliation, GSTR-1 generation, bulk payout*
   → **Inngest function** at `/inngest/functions/<job>.ts`.

8. **Is it a heavy report or a query that summarizes many rows for a UI?**
   *Example: founder cockpit metrics*
   → **Postgres function** (PL/pgSQL) called from the API route, OR a **materialized view** refreshed by Inngest. Faster than fetching rows + aggregating in JS.

9. **Is it a data transformation right at the moment of read?**
   *Example: camelCase keys in API response*
   → **Zod transform or service-layer mapper** — never a database trigger.

10. **Is it AI-powered?**
    *Example: LLM call, embedding, classification*
    → **`/lib/integrations/<provider>/`** for the API client, called from a service in `/lib/services/ai/<feature>.ts`. AI is just another integration; it doesn't need a separate runtime.
