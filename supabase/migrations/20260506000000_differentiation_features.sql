-- ==========================================
-- DIFFERENTIATION FEATURES SCHEMA EXTENSION
-- Feature 1: WhatsApp as the UI
-- ==========================================

CREATE TABLE public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  waba_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  webhook_verify_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('outbound', 'inbound')),
  wa_message_id TEXT,
  to_phone TEXT,
  from_phone TEXT,
  template_name TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent',
  context_type TEXT,
  context_id UUID,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.whatsapp_pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_id UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) + interval '48 hours',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- Feature 2: The Founder's Cockpit
-- ==========================================

-- Cockpit requires payments, invoices, deals, attendance_records, etc.
-- This materialized view provides a fast dashboard summary.
CREATE MATERIALIZED VIEW public.cockpit_metrics AS
SELECT
  c.id AS company_id,

  -- Revenue today
  COALESCE(SUM(p.amount) FILTER (WHERE p.payment_date = CURRENT_DATE AND p.type = 'received'), 0) AS revenue_today,

  -- Revenue this month
  COALESCE(SUM(p.amount) FILTER (WHERE DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', CURRENT_DATE) AND p.type = 'received'), 0) AS revenue_mtd,

  -- Cash (sum of bank account balances — from chart_of_accounts type='asset' tagged as bank)
  -- Overdue invoices
  COALESCE(COUNT(*) FILTER (WHERE i.status = 'overdue'), 0) AS overdue_invoices_count,
  COALESCE(SUM(i.total) FILTER (WHERE i.status = 'overdue'), 0) AS overdue_invoices_value,

  -- Open deals pipeline (assuming a deals table exists, mapped as an example or mock)
  -- Since we're in Supabase, we assume a deals table
  0 AS pipeline_value,

  -- Attendance today (mocking, as attendance might be in MongoDB or another table structure)
  0 AS present_today,

  -- Pending approvals
  0 AS pending_leaves,
  0 AS pending_expenses

FROM public.companies c
LEFT JOIN public.payments p ON p.company_id = c.id
LEFT JOIN public.invoices i ON i.company_id = c.id
GROUP BY c.id;

-- Refresh every 15 minutes (would be done via pg_cron or edge function)
CREATE UNIQUE INDEX ON public.cockpit_metrics (company_id);
