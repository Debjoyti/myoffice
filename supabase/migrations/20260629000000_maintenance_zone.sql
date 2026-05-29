-- Maintenance Zone: stores current & historical maintenance state

CREATE TABLE IF NOT EXISTS public.maintenance_state (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  is_active       boolean NOT NULL DEFAULT false,
  type            text NOT NULL CHECK (type IN ('scheduled', 'active', 'partial')) DEFAULT 'scheduled',
  start_time      timestamptz,
  end_time        timestamptz,
  duration        text,
  description     text CHECK (char_length(description) BETWEEN 10 AND 500),
  affected_features text[] DEFAULT '{}',
  contact_email   text NOT NULL DEFAULT 'support@example.com',
  alternate_url   text,
  redirect_url    text,
  created_by      uuid REFERENCES public.employees(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_time IS NULL OR end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.maintenance_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id  uuid NOT NULL REFERENCES public.maintenance_state(id) ON DELETE CASCADE,
  email           text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  notified_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (maintenance_id, email)
);

-- Only one active maintenance per company at a time
CREATE UNIQUE INDEX maintenance_one_active_per_company
  ON public.maintenance_state (company_id)
  WHERE is_active = true;

-- RLS
ALTER TABLE public.maintenance_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone in the company can read maintenance state
CREATE POLICY "maintenance_state_read" ON public.maintenance_state
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.employees WHERE user_id = auth.uid())
  );

-- Only admin/hr can write maintenance state
CREATE POLICY "maintenance_state_write" ON public.maintenance_state
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.employees
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- Anyone can insert notifications for active maintenance
CREATE POLICY "maintenance_notifications_insert" ON public.maintenance_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "maintenance_notifications_read" ON public.maintenance_notifications
  FOR SELECT USING (
    maintenance_id IN (
      SELECT id FROM public.maintenance_state
      WHERE company_id IN (
        SELECT company_id FROM public.employees WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER maintenance_state_updated_at
  BEFORE UPDATE ON public.maintenance_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
