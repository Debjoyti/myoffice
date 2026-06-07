-- ============================================================
-- Attendance & HR: RLS policies + automatic seeding
-- ============================================================
-- ROOT CAUSE THIS MIGRATION FIXES
-- The attendance/leave/holiday tables had ROW LEVEL SECURITY *enabled*
-- (production_schema_sync §19) but ZERO policies were ever created.
-- With RLS on and no policy, Postgres denies every SELECT/INSERT/UPDATE
-- to the anon/authenticated client the app uses — so check-in failed,
-- attendance history was always empty, leave balances were blank, and
-- the holiday list never loaded. On top of that nothing ever seeded
-- holidays / leave balances / work schedules, so even with access the
-- screens were empty.
--
-- This migration:
--   1. Adds the missing holidays.description column (the API selects it).
--   2. Adds tenant-scoped RLS policies for every HR/attendance table.
--   3. Seeds sensible HR defaults (leave balances + Mon–Fri schedule) for
--      every employee, and a year of holidays for every company — both as
--      a one-time backfill AND via triggers for all future rows.
-- ============================================================

-- ── 1. Fix holidays schema (API selects `description`) ───────────────────────
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS description TEXT;

-- ── 2. RLS POLICIES ──────────────────────────────────────────────────────────
-- Tenancy is resolved through get_user_company_id() (users.id = auth.uid()).
-- Employee-keyed tables join through employees to reach the company.

-- attendance_sessions (keyed by employee_id)
DO $$ BEGIN
  CREATE POLICY tenant_attendance_sessions ON public.attendance_sessions FOR ALL
    USING      (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()))
    WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- work_schedules (keyed by employee_id)
DO $$ BEGIN
  CREATE POLICY tenant_work_schedules ON public.work_schedules FOR ALL
    USING      (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()))
    WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- leave_balances (keyed by employee_id)
DO $$ BEGIN
  CREATE POLICY tenant_leave_balances ON public.leave_balances FOR ALL
    USING      (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()))
    WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- approvals (has company_id directly)
DO $$ BEGIN
  CREATE POLICY tenant_approvals ON public.approvals FOR ALL
    USING      (company_id = get_user_company_id())
    WITH CHECK (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- notifications (keyed by employee_id)
DO $$ BEGIN
  CREATE POLICY tenant_notifications ON public.notifications FOR ALL
    USING      (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()))
    WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- holidays (has company_id directly)
DO $$ BEGIN
  CREATE POLICY tenant_holidays ON public.holidays FOR ALL
    USING      (company_id = get_user_company_id())
    WITH CHECK (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- leave_requests (enterprise schema — keyed by employee_id; guard if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leave_requests') THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
      EXECUTE $p$CREATE POLICY tenant_leave_requests ON public.leave_requests FOR ALL
        USING      (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()))
        WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE company_id = get_user_company_id()))$p$;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- ── 3. SEEDING FUNCTIONS ─────────────────────────────────────────────────────

-- Per-employee HR defaults: leave balances (current year) + Mon–Fri schedule.
CREATE OR REPLACE FUNCTION public.seed_employee_hr_defaults(p_employee_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_dow  INTEGER;
BEGIN
  -- Default annual leave entitlements (India SME baseline)
  INSERT INTO public.leave_balances (employee_id, leave_type, year, total_days, used_days, available_days)
  VALUES
    (p_employee_id, 'casual', v_year, 12, 0, 12),
    (p_employee_id, 'sick',   v_year, 12, 0, 12),
    (p_employee_id, 'earned', v_year, 18, 0, 18),
    (p_employee_id, 'comp_off', v_year, 0, 0, 0)
  ON CONFLICT (employee_id, leave_type, year) DO NOTHING;

  -- Default work schedule: Mon–Fri working, Sat/Sun off (0=Sun .. 6=Sat)
  FOR v_dow IN 0..6 LOOP
    INSERT INTO public.work_schedules (employee_id, day_of_week, start_time, end_time, is_working_day)
    VALUES (p_employee_id, v_dow, '09:00', '18:00', v_dow BETWEEN 1 AND 5)
    ON CONFLICT (employee_id, day_of_week) DO NOTHING;
  END LOOP;
END $$;

-- Per-company holiday calendar for a given year (India national + common festivals).
CREATE OR REPLACE FUNCTION public.seed_company_holidays(p_company_id UUID, p_year INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.holidays (company_id, name, date, type, description)
  VALUES
    (p_company_id, 'New Year''s Day',   make_date(p_year, 1, 1),   'optional', 'Gregorian new year'),
    (p_company_id, 'Republic Day',      make_date(p_year, 1, 26),  'national', 'National holiday'),
    (p_company_id, 'Holi',              make_date(p_year, 3, 4),   'national', 'Festival of colours'),
    (p_company_id, 'Good Friday',       make_date(p_year, 4, 3),   'optional', 'Christian holiday'),
    (p_company_id, 'Labour Day',        make_date(p_year, 5, 1),   'national', 'International Workers'' Day'),
    (p_company_id, 'Independence Day',  make_date(p_year, 8, 15),  'national', 'National holiday'),
    (p_company_id, 'Gandhi Jayanti',    make_date(p_year, 10, 2),  'national', 'Birth of Mahatma Gandhi'),
    (p_company_id, 'Dussehra',          make_date(p_year, 10, 20), 'national', 'Vijayadashami'),
    (p_company_id, 'Diwali',            make_date(p_year, 11, 8),  'national', 'Festival of lights'),
    (p_company_id, 'Christmas',         make_date(p_year, 12, 25), 'national', 'Christmas Day')
  ON CONFLICT DO NOTHING;
END $$;

-- ── 4. TRIGGERS (CLAUDE.md rule #3 — automatic side-effect on row change) ─────

-- When an employee is created, seed their HR defaults.
CREATE OR REPLACE FUNCTION public.trg_seed_employee_hr_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.seed_employee_hr_defaults(NEW.id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS after_employee_insert_seed_hr ON public.employees;
CREATE TRIGGER after_employee_insert_seed_hr
  AFTER INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.trg_seed_employee_hr_defaults();

-- When a company is created, seed this year's + next year's holidays.
CREATE OR REPLACE FUNCTION public.trg_seed_company_holidays()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  PERFORM public.seed_company_holidays(NEW.id, v_year);
  PERFORM public.seed_company_holidays(NEW.id, v_year + 1);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS after_company_insert_seed_holidays ON public.companies;
CREATE TRIGGER after_company_insert_seed_holidays
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.trg_seed_company_holidays();

-- ── 5. ONE-TIME BACKFILL for existing rows ───────────────────────────────────

-- Seed HR defaults for every existing employee that has no leave balances yet.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT e.id FROM public.employees e
    WHERE NOT EXISTS (
      SELECT 1 FROM public.leave_balances lb
      WHERE lb.employee_id = e.id AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
    )
  LOOP
    PERFORM public.seed_employee_hr_defaults(r.id);
  END LOOP;
END $$;

-- Seed this year's + next year's holidays for every company that has none.
DO $$
DECLARE r RECORD; v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  FOR r IN
    SELECT c.id FROM public.companies c
    WHERE NOT EXISTS (
      SELECT 1 FROM public.holidays h
      WHERE h.company_id = c.id
        AND EXTRACT(YEAR FROM h.date) = v_year
    )
  LOOP
    PERFORM public.seed_company_holidays(r.id, v_year);
    PERFORM public.seed_company_holidays(r.id, v_year + 1);
  END LOOP;
END $$;
