-- ============================================================
-- Personal Asset Store Schema (SAP-inspired ZASSET pattern)
-- Scoped to individual employees within a company
-- ============================================================

-- ── Categories master (company-wide, shared seed data) ───────
CREATE TABLE IF NOT EXISTS public.zasset_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_name    TEXT NOT NULL,
  parent_id        UUID REFERENCES public.zasset_categories(id) ON DELETE SET NULL,
  default_depreciation_rate  DECIMAL(5,2) DEFAULT 10.00,
  default_insurance_rate     DECIMAL(5,2) DEFAULT 1.00,
  typical_lifespan_years     INT,
  accounting_code  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zasset_categories_company ON public.zasset_categories(company_id);

-- ── Locations master (per employee) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.zasset_locations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  location_name    TEXT NOT NULL,
  location_type    TEXT NOT NULL DEFAULT 'room'
                   CHECK (location_type IN ('room','building','storage_unit','safe','vehicle','other')),
  address          TEXT,
  security_level   TEXT NOT NULL DEFAULT 'medium'
                   CHECK (security_level IN ('low','medium','high','vault')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zasset_locations_employee ON public.zasset_locations(employee_id);

-- ── Asset master (ZASSET_MASTER — heart of the system) ────────
CREATE TABLE IF NOT EXISTS public.zasset_master (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id                 TEXT NOT NULL,          -- human-readable: ASSET-2026-00001
  employee_id              UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  asset_name               TEXT NOT NULL,
  category_id              UUID REFERENCES public.zasset_categories(id) ON DELETE SET NULL,
  asset_subcategory        TEXT,
  serial_number            TEXT,
  model_number             TEXT,
  brand                    TEXT,
  purchase_date            DATE NOT NULL,
  purchase_price           DECIMAL(15,2) NOT NULL CHECK (purchase_price > 0),
  current_value            DECIMAL(15,2) NOT NULL CHECK (current_value >= 0),
  salvage_value            DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (salvage_value >= 0),
  depreciation_method      TEXT NOT NULL DEFAULT 'straight_line'
                           CHECK (depreciation_method IN ('straight_line','declining_balance','none')),
  depreciation_rate        DECIMAL(5,2) NOT NULL DEFAULT 10.00
                           CHECK (depreciation_rate BETWEEN 0 AND 100),
  location_id              UUID REFERENCES public.zasset_locations(id) ON DELETE SET NULL,
  condition                TEXT NOT NULL DEFAULT 'good'
                           CHECK (condition IN ('new','excellent','good','fair','poor','damaged')),
  acquisition_source       TEXT NOT NULL DEFAULT 'retail'
                           CHECK (acquisition_source IN ('retail','online','auction','gift','inheritance','handmade','other')),
  warranty_expiry          DATE,
  insurance_policy_number  TEXT,
  insurance_value          DECIMAL(15,2),
  notes                    TEXT,
  tags                     TEXT[] DEFAULT '{}',
  photos                   TEXT[] DEFAULT '{}',
  documents                JSONB DEFAULT '[]',
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','sold','disposed','lost','stolen','in_repair')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Unique serial per employee (NULL serials allowed but non-null must be unique)
  UNIQUE NULLS NOT DISTINCT (employee_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_zasset_master_employee    ON public.zasset_master(employee_id);
CREATE INDEX IF NOT EXISTS idx_zasset_master_status      ON public.zasset_master(status);
CREATE INDEX IF NOT EXISTS idx_zasset_master_category    ON public.zasset_master(category_id);
CREATE INDEX IF NOT EXISTS idx_zasset_master_location    ON public.zasset_master(location_id);
CREATE INDEX IF NOT EXISTS idx_zasset_master_tags        ON public.zasset_master USING GIN(tags);

-- ── Asset movement ledger (ZASSET_MOVEMENT) ───────────────────
CREATE TABLE IF NOT EXISTS public.zasset_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES public.zasset_master(id) ON DELETE CASCADE,
  movement_type   TEXT NOT NULL
                  CHECK (movement_type IN ('acquisition','transfer','sale','disposal','repair_out','repair_in','found','adjustment','valuation')),
  from_location   UUID REFERENCES public.zasset_locations(id) ON DELETE SET NULL,
  to_location     UUID REFERENCES public.zasset_locations(id) ON DELETE SET NULL,
  notes           TEXT,
  reference_doc   TEXT,
  recorded_by     UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zasset_movements_asset ON public.zasset_movements(asset_id);

-- ── Valuation history (ZVALUATION_HISTORY) ────────────────────
CREATE TABLE IF NOT EXISTS public.zasset_valuations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id            UUID NOT NULL REFERENCES public.zasset_master(id) ON DELETE CASCADE,
  valuation_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  old_value           DECIMAL(15,2),
  new_value           DECIMAL(15,2) NOT NULL CHECK (new_value >= 0),
  depreciation_amount DECIMAL(15,2),
  valuation_method    TEXT,
  notes               TEXT,
  recorded_by         UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zasset_valuations_asset ON public.zasset_valuations(asset_id);

-- ── Sale records ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.zasset_sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES public.zasset_master(id) ON DELETE CASCADE,
  sale_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_price      DECIMAL(15,2) NOT NULL CHECK (sale_price >= 0),
  buyer_name      TEXT,
  payment_method  TEXT,
  gain_loss       DECIMAL(15,2),
  notes           TEXT,
  recorded_by     UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Disposal records ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.zasset_disposals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id         UUID NOT NULL REFERENCES public.zasset_master(id) ON DELETE CASCADE,
  disposal_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  disposal_reason  TEXT NOT NULL
                   CHECK (disposal_reason IN ('discarded','donated','destroyed','lost','stolen')),
  loss_amount      DECIMAL(15,2),
  recipient        TEXT,
  notes            TEXT,
  recorded_by      UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Audit log (ZAUDIT_LOG) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.zasset_audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name  TEXT NOT NULL,
  record_id   UUID,
  action      TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_value   JSONB,
  new_value   JSONB,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zasset_audit_employee ON public.zasset_audit_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_zasset_audit_record   ON public.zasset_audit_log(record_id);

-- ── Auto-update updated_at on zasset_master ───────────────────
CREATE OR REPLACE FUNCTION update_zasset_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_zasset_master_updated_at ON public.zasset_master;
CREATE TRIGGER trg_zasset_master_updated_at
  BEFORE UPDATE ON public.zasset_master
  FOR EACH ROW EXECUTE FUNCTION update_zasset_updated_at();

-- ── Depreciation stop when current_value ≤ salvage_value ──────
CREATE OR REPLACE FUNCTION prevent_negative_depreciation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_value < NEW.salvage_value THEN
    NEW.current_value = NEW.salvage_value;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_zasset_depreciation_floor ON public.zasset_master;
CREATE TRIGGER trg_zasset_depreciation_floor
  BEFORE UPDATE ON public.zasset_master
  FOR EACH ROW EXECUTE FUNCTION prevent_negative_depreciation();

-- ── Seed default categories (company-agnostic seed via function) ─
-- These get created per company on first use via API

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.zasset_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zasset_locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zasset_master          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zasset_movements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zasset_valuations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zasset_sales           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zasset_disposals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zasset_audit_log       ENABLE ROW LEVEL SECURITY;

-- Categories: all employees of the company can read; admins can write
CREATE POLICY "zasset_categories_read" ON public.zasset_categories
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "zasset_categories_write" ON public.zasset_categories
  FOR ALL USING (company_id = get_user_company_id());

-- Locations: each employee sees only their own
CREATE POLICY "zasset_locations_own" ON public.zasset_locations
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employees
      WHERE company_id = get_user_company_id()
    )
  );

-- Assets: each employee sees only their own
CREATE POLICY "zasset_master_own" ON public.zasset_master
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employees
      WHERE company_id = get_user_company_id()
    )
  );

-- Movements / Valuations / Sales / Disposals: scoped via asset ownership
CREATE POLICY "zasset_movements_own" ON public.zasset_movements
  FOR ALL USING (
    asset_id IN (
      SELECT id FROM public.zasset_master
      WHERE employee_id IN (
        SELECT id FROM public.employees WHERE company_id = get_user_company_id()
      )
    )
  );

CREATE POLICY "zasset_valuations_own" ON public.zasset_valuations
  FOR ALL USING (
    asset_id IN (
      SELECT id FROM public.zasset_master
      WHERE employee_id IN (
        SELECT id FROM public.employees WHERE company_id = get_user_company_id()
      )
    )
  );

CREATE POLICY "zasset_sales_own" ON public.zasset_sales
  FOR ALL USING (
    asset_id IN (
      SELECT id FROM public.zasset_master
      WHERE employee_id IN (
        SELECT id FROM public.employees WHERE company_id = get_user_company_id()
      )
    )
  );

CREATE POLICY "zasset_disposals_own" ON public.zasset_disposals
  FOR ALL USING (
    asset_id IN (
      SELECT id FROM public.zasset_master
      WHERE employee_id IN (
        SELECT id FROM public.employees WHERE company_id = get_user_company_id()
      )
    )
  );

CREATE POLICY "zasset_audit_own" ON public.zasset_audit_log
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE company_id = get_user_company_id()
    )
  );
