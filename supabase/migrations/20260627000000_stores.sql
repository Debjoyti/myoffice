-- Stores: physical store/warehouse locations linked to a company
CREATE TABLE IF NOT EXISTS public.stores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,
  manager     TEXT,
  contact     TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_company_id ON public.stores(company_id);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_stores_all" ON public.stores
  FOR ALL USING (company_id = get_user_company_id());

-- Add store_id to purchase_orders if not already present
DO $$ BEGIN
  ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
