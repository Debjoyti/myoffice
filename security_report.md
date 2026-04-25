# Security Assessment Report: Supabase SaaS Backend

## 1. Authentication (Supabase Auth)

### Findings:
- Profile triggers (`handle_new_user`) use `SECURITY DEFINER` with an empty search path, which is good practice.
- The webhook trigger (`trigger_welcome_email`) passes `user_id` and `email` to an edge function using the anonymous/service role key dynamically constructed.
- Profiles don't currently include tenant isolation references (like `organization_id` or `company_id`). While `companies` has `organization_id`, user profiles lack an association directly via Supabase Auth schema, though it might be present in user metadata or a different application layer (e.g. backend MongoDB has it, per seed scripts).

## 2. Row Level Security (RLS) Policies

### Findings:
- RLS is explicitly enabled on all 29 public tables (HRMS, Finance, Inventory, etc.) and core tables (profiles, activity logs).
- **CRITICAL VULNERABILITY**: Almost all table policies in `saas_schema.sql` are using `USING (true)` and `WITH CHECK (true)`. For example:
  ```sql
  CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (true);
  CREATE POLICY "Users can update their own company" ON public.companies FOR UPDATE USING (true);
  ```
  This completely nullifies multi-tenant isolation, allowing any authenticated (or even anonymous, if policies apply to public role) user to read, update, and insert data across all tenants and tables (payrolls, invoices, positions).
- **Public Profiles Data Leak**: `public.profiles` has a SELECT policy with `USING (true)`, meaning any user can read all other users' emails, names, etc., leading to PII leaks.
- Only a few tables like `activity_logs` have properly scoped policies (`USING (auth.uid() = user_id)`).

## 3. Edge Functions

### Findings:
- The `send-email` function instantiates the Supabase client using the `SUPABASE_SERVICE_ROLE_KEY`. This bypasses RLS completely. It does check for HTTP POST and has basic error handling, but lacks any signature verification to ensure the webhook caller is trusted (since `SUPABASE_SERVICE_ROLE_KEY` is passed in headers, it might be vulnerable if the trigger function leaks or if exposed).

## 4. Fix Recommendations

1. **Implement Proper Multi-Tenant RLS**:
   - Update `profiles` table to include an `organization_id` or `company_id`.
   - Update all `saas_schema.sql` policies to verify `company_id` against the current user's associated company. For example:
     ```sql
     CREATE POLICY "Tenant isolation for companies" ON public.companies
     FOR ALL USING (id IN (SELECT company_id FROM public.employees WHERE user_id = auth.uid()));
     ```
   - Limit `public.profiles` SELECT to only allow users to see profiles within their own organization.

2. **Restrict Webhook Access**:
   - In `send-email`, validate the Authorization header specifically or use a signed payload (e.g., HMAC) to ensure the invocation originates from the trusted Postgres instance rather than just passing the service role key over HTTP.

## 5. Security Score

**Score: 2/10 (Critical)**
The system suffers from a total failure of tenant isolation due to placeholder RLS policies (`USING (true)`). Immediate remediation is required before any production deployment.
