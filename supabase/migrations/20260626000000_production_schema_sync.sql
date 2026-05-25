-- ============================================================
-- Production Schema Sync Migration
-- Adds all missing columns and tables that the API routes
-- depend on but earlier migrations never defined.
-- All DDL is idempotent (IF NOT EXISTS / ALTER TABLE IF NOT EXISTS).
-- ============================================================

-- ── 0. Extensions ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Employees: add missing columns ────────────────────────
DO $$ BEGIN
  -- full_name (might exist from earlier migrations or manual SQL)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='full_name') THEN
    ALTER TABLE public.employees ADD COLUMN full_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='email') THEN
    ALTER TABLE public.employees ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='phone') THEN
    ALTER TABLE public.employees ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='role') THEN
    ALTER TABLE public.employees ADD COLUMN role TEXT DEFAULT 'employee'
      CHECK (role IN ('admin', 'hr', 'manager', 'employee', 'accountant'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='designation') THEN
    ALTER TABLE public.employees ADD COLUMN designation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='department') THEN
    ALTER TABLE public.employees ADD COLUMN department TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='department_id') THEN
    ALTER TABLE public.employees ADD COLUMN department_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='position_id') THEN
    ALTER TABLE public.employees ADD COLUMN position_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='manager_id') THEN
    ALTER TABLE public.employees ADD COLUMN manager_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='avatar_url') THEN
    ALTER TABLE public.employees ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='date_of_birth') THEN
    ALTER TABLE public.employees ADD COLUMN date_of_birth DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='employment_type') THEN
    ALTER TABLE public.employees ADD COLUMN employment_type TEXT DEFAULT 'full_time';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='pan_number') THEN
    ALTER TABLE public.employees ADD COLUMN pan_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='bank_account') THEN
    ALTER TABLE public.employees ADD COLUMN bank_account TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='bank_ifsc') THEN
    ALTER TABLE public.employees ADD COLUMN bank_ifsc TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='bank_name') THEN
    ALTER TABLE public.employees ADD COLUMN bank_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='emergency_contact_name') THEN
    ALTER TABLE public.employees ADD COLUMN emergency_contact_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='emergency_contact_phone') THEN
    ALTER TABLE public.employees ADD COLUMN emergency_contact_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='user_id') THEN
    ALTER TABLE public.employees ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='company_id') THEN
    ALTER TABLE public.employees ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── 2. Salary structures: replace old schema with Indian payroll columns ──────
-- Drop old saas_schema version and recreate with proper schema (IF NOT EXISTS guards)
CREATE TABLE IF NOT EXISTS public.salary_structures (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  effective_from   DATE    NOT NULL DEFAULT CURRENT_DATE,
  is_active        BOOLEAN DEFAULT true,
  -- CTC breakdown (monthly, INR)
  ctc_monthly            NUMERIC(15,2) DEFAULT 0,
  basic                  NUMERIC(15,2) DEFAULT 0,
  hra                    NUMERIC(15,2) DEFAULT 0,
  special_allowance      NUMERIC(15,2) DEFAULT 0,
  transport_allowance    NUMERIC(15,2) DEFAULT 0,
  medical_allowance      NUMERIC(15,2) DEFAULT 0,
  lta_monthly            NUMERIC(15,2) DEFAULT 0,
  -- Employer contributions (not deducted from employee take-home)
  pf_employer            NUMERIC(15,2) DEFAULT 0,
  gratuity_monthly       NUMERIC(15,2) DEFAULT 0,
  insurance_monthly      NUMERIC(15,2) DEFAULT 0,
  -- Employee deductions
  pf_employee            NUMERIC(15,2) DEFAULT 0,
  esi_employee           NUMERIC(15,2) DEFAULT 0,
  esi_employer           NUMERIC(15,2) DEFAULT 0,
  professional_tax       NUMERIC(15,2) DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns in case old table exists without them
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='salary_structures' AND column_name='ctc_monthly') THEN
    ALTER TABLE public.salary_structures ADD COLUMN ctc_monthly NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN basic NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN hra NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN special_allowance NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN transport_allowance NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN medical_allowance NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN lta_monthly NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN pf_employer NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN gratuity_monthly NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN insurance_monthly NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN pf_employee NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN esi_employee NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN esi_employer NUMERIC(15,2) DEFAULT 0;
    ALTER TABLE public.salary_structures ADD COLUMN professional_tax NUMERIC(15,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='salary_structures' AND column_name='effective_from') THEN
    ALTER TABLE public.salary_structures ADD COLUMN effective_from DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='salary_structures' AND column_name='is_active') THEN
    ALTER TABLE public.salary_structures ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ── 3. Payrolls: add missing columns ─────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payrolls' AND column_name='payroll_month') THEN
    ALTER TABLE public.payrolls ADD COLUMN payroll_month TEXT; -- 'YYYY-MM'
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payrolls' AND column_name='total_employees') THEN
    ALTER TABLE public.payrolls ADD COLUMN total_employees INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payrolls' AND column_name='total_deductions') THEN
    ALTER TABLE public.payrolls ADD COLUMN total_deductions NUMERIC(15,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payrolls' AND column_name='total_reimbursements') THEN
    ALTER TABLE public.payrolls ADD COLUMN total_reimbursements NUMERIC(15,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payrolls' AND column_name='processed_by') THEN
    ALTER TABLE public.payrolls ADD COLUMN processed_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payrolls' AND column_name='processed_at') THEN
    ALTER TABLE public.payrolls ADD COLUMN processed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payrolls' AND column_name='locked_at') THEN
    ALTER TABLE public.payrolls ADD COLUMN locked_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payrolls' AND column_name='notes') THEN
    ALTER TABLE public.payrolls ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payrolls' AND column_name='company_id') THEN
    ALTER TABLE public.payrolls ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix payrolls status constraint to include all used values
ALTER TABLE public.payrolls DROP CONSTRAINT IF EXISTS payrolls_status_check;
ALTER TABLE public.payrolls ADD CONSTRAINT payrolls_status_check
  CHECK (status IN ('draft', 'processing', 'completed', 'locked', 'failed', 'approved', 'paid'));

-- ── 4. Payslips: replace sparse saas_schema version ──────────
-- The saas_schema version only has gross_salary/net_salary/earnings JSONB.
-- We need detailed column-per-component for payslip generation.
CREATE TABLE IF NOT EXISTS public.payslips (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id       UUID    REFERENCES public.payrolls(id) ON DELETE CASCADE,
  employee_id      UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  salary_structure_id UUID REFERENCES public.salary_structures(id),
  payroll_month    TEXT    NOT NULL,   -- 'YYYY-MM'
  working_days     INTEGER DEFAULT 0,
  paid_days        INTEGER DEFAULT 0,
  loss_of_pay_days INTEGER DEFAULT 0,
  -- Earnings (prorated)
  basic_paid                NUMERIC(15,2) DEFAULT 0,
  hra_paid                  NUMERIC(15,2) DEFAULT 0,
  special_allowance_paid    NUMERIC(15,2) DEFAULT 0,
  transport_allowance_paid  NUMERIC(15,2) DEFAULT 0,
  medical_allowance_paid    NUMERIC(15,2) DEFAULT 0,
  lta_paid                  NUMERIC(15,2) DEFAULT 0,
  bonus_paid                NUMERIC(15,2) DEFAULT 0,
  other_earnings            NUMERIC(15,2) DEFAULT 0,
  -- Deductions
  pf_employee_deduction     NUMERIC(15,2) DEFAULT 0,
  esi_employee_deduction    NUMERIC(15,2) DEFAULT 0,
  professional_tax_deduction NUMERIC(15,2) DEFAULT 0,
  tds_deduction             NUMERIC(15,2) DEFAULT 0,
  advance_deduction         NUMERIC(15,2) DEFAULT 0,
  -- Totals
  gross_earnings     NUMERIC(15,2) DEFAULT 0,
  total_deductions   NUMERIC(15,2) DEFAULT 0,
  net_salary         NUMERIC(15,2) DEFAULT 0,
  reimbursements_paid NUMERIC(15,2) DEFAULT 0,
  -- Lifecycle
  status       TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'finalized', 'paid')),
  generated_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to existing payslips table (if old schema exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payslips' AND column_name='payroll_month') THEN
    ALTER TABLE public.payslips ADD COLUMN payroll_month TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payslips' AND column_name='gross_earnings') THEN
    ALTER TABLE public.payslips ADD COLUMN gross_earnings NUMERIC(15,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payslips' AND column_name='salary_structure_id') THEN
    ALTER TABLE public.payslips ADD COLUMN salary_structure_id UUID;
  END IF;
END $$;

-- ── 5. Attendance sessions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date           DATE    NOT NULL,
  check_in_at    TIMESTAMPTZ,
  check_out_at   TIMESTAMPTZ,
  status         TEXT    DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  duration_minutes INTEGER,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_employee_id ON public.attendance_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(date);

-- ── 6. Work schedules ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_schedules (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun,1=Mon,...6=Sat
  start_time    TEXT    DEFAULT '09:00',
  end_time      TEXT    DEFAULT '18:00',
  is_working_day BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_work_schedules_employee_id ON public.work_schedules(employee_id);

-- ── 7. Leave balances ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type     TEXT    NOT NULL CHECK (leave_type IN ('casual', 'sick', 'earned', 'comp_off', 'maternity', 'paternity')),
  year           INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  total_days     NUMERIC(5,1) DEFAULT 0,
  used_days      NUMERIC(5,1) DEFAULT 0,
  available_days NUMERIC(5,1) DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, leave_type, year)
);

-- ── 8. Approvals (leave requests + other) ────────────────────
CREATE TABLE IF NOT EXISTS public.approvals (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID    REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  approver_id UUID    REFERENCES public.employees(id),
  type        TEXT    NOT NULL CHECK (type IN ('leave', 'wfh', 'expense', 'overtime', 'comp_off')),
  title       TEXT    NOT NULL,
  status      TEXT    DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  from_date   DATE,
  to_date     DATE,
  days_count  NUMERIC(5,1),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_employee_id ON public.approvals(employee_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON public.approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);

-- ── 9. Notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  message     TEXT,
  type        TEXT    DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_employee_id ON public.notifications(employee_id);

-- ── 10. Holidays ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.holidays (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID  REFERENCES public.companies(id) ON DELETE CASCADE,
  name       TEXT  NOT NULL,
  date       DATE  NOT NULL,
  type       TEXT  DEFAULT 'national' CHECK (type IN ('national', 'company', 'optional')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holidays_company_date ON public.holidays(company_id, date);

-- ── 11. Compliance records (statutory deductions per employee per month) ───────
CREATE TABLE IF NOT EXISTS public.compliance_records (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  record_month    TEXT    NOT NULL,  -- 'YYYY-MM'
  pf_employee     NUMERIC(15,2) DEFAULT 0,
  pf_employer     NUMERIC(15,2) DEFAULT 0,
  esi_employee    NUMERIC(15,2) DEFAULT 0,
  esi_employer    NUMERIC(15,2) DEFAULT 0,
  esi_applicable  BOOLEAN DEFAULT false,
  professional_tax NUMERIC(15,2) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, record_month)
);

-- ── 12. Reimbursements ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reimbursements (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category     TEXT    DEFAULT 'other' CHECK (category IN ('internet', 'travel', 'fuel', 'petty_cash', 'food', 'other')),
  amount       NUMERIC(15,2) NOT NULL,
  claim_month  TEXT    NOT NULL,  -- 'YYYY-MM'
  description  TEXT,
  status       TEXT    DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_at  TIMESTAMPTZ,
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 13. Salary revisions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.salary_revisions (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID    NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  approved_by      UUID    REFERENCES public.employees(id),
  revision_date    DATE    NOT NULL DEFAULT CURRENT_DATE,
  revision_type    TEXT    DEFAULT 'increment' CHECK (revision_type IN ('joining', 'increment', 'promotion', 'correction', 'restructure')),
  old_ctc_monthly  NUMERIC(15,2),
  new_ctc_monthly  NUMERIC(15,2) NOT NULL,
  percentage_change NUMERIC(6,2),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 14. Admin settings (per company) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID    NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  payroll_cutoff_day  INTEGER DEFAULT 25,
  default_work_start  TEXT    DEFAULT '09:00',
  default_work_end    TEXT    DEFAULT '18:00',
  late_threshold_mins INTEGER DEFAULT 15,
  timezone            TEXT    DEFAULT 'Asia/Kolkata',
  currency            TEXT    DEFAULT 'INR',
  pf_applicable       BOOLEAN DEFAULT true,
  esi_applicable      BOOLEAN DEFAULT true,
  pt_applicable       BOOLEAN DEFAULT true,
  gratuity_applicable BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 15. Departments: ensure all needed columns exist ─────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='code') THEN
    ALTER TABLE public.departments ADD COLUMN code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='status') THEN
    ALTER TABLE public.departments ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='parent_department_id') THEN
    ALTER TABLE public.departments ADD COLUMN parent_department_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='company_id') THEN
    ALTER TABLE public.departments ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── 16. Offer letters ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offer_letters (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID    REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id  UUID    REFERENCES public.employees(id),
  candidate_name TEXT  NOT NULL,
  candidate_email TEXT NOT NULL,
  designation  TEXT    NOT NULL,
  department   TEXT,
  joining_date DATE,
  ctc_annual   NUMERIC(15,2),
  status       TEXT    DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 17. Per-company audit log (used by lib/services/audit.ts) ─
-- The saas_schema and enterprise_erp_schema both create audit_logs differently.
-- The API's logAudit() service expects: actor_id, actor_email, action, resource_type, resource_id, old_values, new_values
CREATE TABLE IF NOT EXISTS public.audit_log (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID    REFERENCES public.companies(id),
  actor_id      UUID    NOT NULL,
  actor_email   TEXT,
  action        TEXT    NOT NULL,
  resource_type TEXT    NOT NULL,
  resource_id   TEXT,
  old_values    JSONB,
  new_values    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_company ON public.audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ── 18. Indexes for performance ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employees_user_id    ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_role       ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_salary_structures_employee_id ON public.salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_active ON public.salary_structures(employee_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payrolls_company_month ON public.payrolls(company_id, payroll_month);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_month ON public.payslips(employee_id, payroll_month);
CREATE INDEX IF NOT EXISTS idx_payslips_payroll_id ON public.payslips(payroll_id);

-- ── 19. RLS enablement ────────────────────────────────────────
DO $$ BEGIN ALTER TABLE public.attendance_sessions  ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.work_schedules        ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.leave_balances        ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.approvals             ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.holidays              ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.compliance_records    ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.reimbursements        ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.salary_revisions      ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.salary_structures     ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.admin_settings        ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.offer_letters         ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.audit_log             ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.payrolls              ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.payslips              ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 20. THE calculate_payslip FUNCTION ───────────────────────
-- Called by lib/services/payroll.ts for each employee during payroll run.
-- Returns a complete payslip calculation based on:
--   - salary_structures: CTC breakdown
--   - work_schedules: working days per month
--   - attendance_sessions: actual attendance for LOP calculation
--   - admin_settings: company-level PF/ESI/PT toggles
CREATE OR REPLACE FUNCTION public.calculate_payslip(
  p_employee_id UUID,
  p_month       TEXT   -- 'YYYY-MM'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_salary        RECORD;
  v_year          INTEGER;
  v_month_num     INTEGER;
  v_days_in_month INTEGER;
  v_working_days  INTEGER;
  v_attended_days INTEGER;
  v_lop_days      INTEGER;
  v_paid_days     INTEGER;
  v_prorate       NUMERIC;
  -- Earnings
  v_basic_paid                NUMERIC(15,2);
  v_hra_paid                  NUMERIC(15,2);
  v_special_paid              NUMERIC(15,2);
  v_transport_paid            NUMERIC(15,2);
  v_medical_paid              NUMERIC(15,2);
  v_lta_paid                  NUMERIC(15,2);
  v_gross                     NUMERIC(15,2);
  -- Deductions
  v_pf_employee               NUMERIC(15,2);
  v_esi_employee              NUMERIC(15,2);
  v_esi_applicable            BOOLEAN;
  v_pt                        NUMERIC(15,2);
  v_total_deductions          NUMERIC(15,2);
  v_net                       NUMERIC(15,2);
  -- Employer
  v_pf_employer               NUMERIC(15,2);
  v_esi_employer              NUMERIC(15,2);
BEGIN
  -- Parse month
  v_year      := EXTRACT(YEAR  FROM to_date(p_month || '-01', 'YYYY-MM-DD'));
  v_month_num := EXTRACT(MONTH FROM to_date(p_month || '-01', 'YYYY-MM-DD'));

  -- Days in this month
  v_days_in_month := DATE_PART('day',
    (DATE_TRUNC('month', to_date(p_month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month - 1 day')::date
  )::INTEGER;

  -- Get active salary structure for this employee
  SELECT * INTO v_salary
  FROM public.salary_structures
  WHERE employee_id = p_employee_id
    AND is_active = true
    AND effective_from <= (p_month || '-01')::date
  ORDER BY effective_from DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No active salary structure found');
  END IF;

  -- Count scheduled working days in this month from work_schedules
  -- day_of_week: 1=Mon, 2=Tue, ..., 5=Fri (ISO weekday)
  SELECT COUNT(*) INTO v_working_days
  FROM generate_series(
    DATE_TRUNC('month', (p_month || '-01')::date),
    (DATE_TRUNC('month', (p_month || '-01')::date) + INTERVAL '1 month - 1 day')::date,
    '1 day'::interval
  ) AS d(date_val)
  JOIN public.work_schedules ws ON
    ws.employee_id = p_employee_id
    AND ws.is_working_day = true
    AND ws.day_of_week = EXTRACT(ISODOW FROM d.date_val)::INTEGER
  WHERE EXTRACT(MONTH FROM d.date_val) = v_month_num
    AND EXTRACT(YEAR FROM d.date_val)  = v_year;

  -- Default to 26 working days if no schedule found
  IF v_working_days IS NULL OR v_working_days = 0 THEN
    v_working_days := 26;
  END IF;

  -- Count attendance sessions (any present = attended)
  SELECT COUNT(DISTINCT date) INTO v_attended_days
  FROM public.attendance_sessions
  WHERE employee_id = p_employee_id
    AND date >= (p_month || '-01')::date
    AND date <= (DATE_TRUNC('month', (p_month || '-01')::date) + INTERVAL '1 month - 1 day')::date;

  IF v_attended_days IS NULL THEN v_attended_days := 0; END IF;

  -- LOP = working days NOT attended (capped at 0)
  v_lop_days  := GREATEST(0, v_working_days - v_attended_days);
  v_paid_days := GREATEST(0, v_working_days - v_lop_days);

  -- Proration factor
  IF v_working_days > 0 THEN
    v_prorate := v_paid_days::NUMERIC / v_working_days::NUMERIC;
  ELSE
    v_prorate := 1;
  END IF;

  -- Prorate earnings
  v_basic_paid     := ROUND((v_salary.basic             * v_prorate)::NUMERIC, 2);
  v_hra_paid       := ROUND((v_salary.hra               * v_prorate)::NUMERIC, 2);
  v_special_paid   := ROUND((v_salary.special_allowance * v_prorate)::NUMERIC, 2);
  v_transport_paid := ROUND((v_salary.transport_allowance * v_prorate)::NUMERIC, 2);
  v_medical_paid   := ROUND((v_salary.medical_allowance * v_prorate)::NUMERIC, 2);
  v_lta_paid       := ROUND((v_salary.lta_monthly       * v_prorate)::NUMERIC, 2);

  v_gross := v_basic_paid + v_hra_paid + v_special_paid + v_transport_paid + v_medical_paid + v_lta_paid;

  -- PF: 12% of prorated basic (statutory minimum)
  v_pf_employee  := ROUND((v_basic_paid * 0.12)::NUMERIC, 2);
  v_pf_employer  := v_pf_employee;  -- employer matches

  -- ESI: 0.75% employee, 3.25% employer — only if gross ≤ ₹21,000
  v_esi_applicable := (v_gross <= 21000);
  IF v_esi_applicable THEN
    v_esi_employee := ROUND((v_gross * 0.0075)::NUMERIC, 2);
    v_esi_employer := ROUND((v_gross * 0.0325)::NUMERIC, 2);
  ELSE
    v_esi_employee := 0;
    v_esi_employer := 0;
  END IF;

  -- Professional Tax (Maharashtra slab — ₹200/month if gross > ₹10,000)
  IF v_gross > 10000 THEN
    v_pt := 200;
  ELSE
    v_pt := 0;
  END IF;

  v_total_deductions := v_pf_employee + v_esi_employee + v_pt;
  v_net              := v_gross - v_total_deductions;

  RETURN json_build_object(
    'salary_structure_id',    v_salary.id,
    'working_days',           v_working_days,
    'paid_days',              v_paid_days,
    'loss_of_pay_days',       v_lop_days,
    'basic_paid',             v_basic_paid,
    'hra_paid',               v_hra_paid,
    'special_allowance_paid', v_special_paid,
    'transport_allowance_paid', v_transport_paid,
    'medical_allowance_paid', v_medical_paid,
    'lta_paid',               v_lta_paid,
    'pf_employee_deduction',  v_pf_employee,
    'esi_employee_deduction', v_esi_employee,
    'professional_tax_deduction', v_pt,
    'gross_earnings',         v_gross,
    'total_deductions',       v_total_deductions,
    'net_salary',             v_net,
    'pf_employer',            v_pf_employer,
    'esi_employer',           v_esi_employer,
    'esi_applicable',         v_esi_applicable
  );
END;
$$;

-- Grant execute to authenticated users (Supabase uses service role for payroll)
GRANT EXECUTE ON FUNCTION public.calculate_payslip(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_payslip(UUID, TEXT) TO service_role;
