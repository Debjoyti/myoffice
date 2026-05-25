-- ==========================================
-- DIFFERENTIATION FEATURES SCHEMA EXTENSION
-- Feature 1: WhatsApp as the UI
-- NOTE: Fully idempotent — IF NOT EXISTS on all objects.
-- ==========================================

CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  waba_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  webhook_verify_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
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

CREATE TABLE IF NOT EXISTS public.whatsapp_pending_actions (
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

-- Cockpit metrics materialized view — depends on payments and invoices tables
-- from saas_schema (20260423070517). Safe because saas_schema runs before this.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cockpit_metrics AS
SELECT
  c.id AS company_id,

  -- Revenue today
  COALESCE(SUM(p.amount) FILTER (WHERE p.payment_date = CURRENT_DATE AND p.type = 'received'), 0) AS revenue_today,

  -- Revenue this month
  COALESCE(SUM(p.amount) FILTER (WHERE DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', CURRENT_DATE) AND p.type = 'received'), 0) AS revenue_mtd,

  -- Overdue invoices
  COALESCE(COUNT(*) FILTER (WHERE i.status = 'overdue'), 0) AS overdue_invoices_count,
  COALESCE(SUM(i.total) FILTER (WHERE i.status = 'overdue'), 0) AS overdue_invoices_value,

  0 AS pipeline_value,
  0 AS present_today,
  0 AS pending_leaves,
  0 AS pending_expenses

FROM public.companies c
LEFT JOIN public.payments p ON p.company_id = c.id
LEFT JOIN public.invoices i ON i.company_id = c.id
GROUP BY c.id;

-- Refresh every 15 minutes (via pg_cron or Inngest)
CREATE UNIQUE INDEX IF NOT EXISTS cockpit_metrics_company_id_idx ON public.cockpit_metrics (company_id);
