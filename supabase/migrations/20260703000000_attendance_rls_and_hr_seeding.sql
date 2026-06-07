-- ============================================================
-- Attendance & HR — reconcile schema drift + seed HR defaults
-- ============================================================
-- CONTEXT
-- The live database evolved on a different track from the repo's later
-- migrations. On production the HR tables already exist with PERMISSIVE
-- RLS and real data, but their COLUMN SHAPES differ from what the app
-- code expected:
--   • leave_balances has no `available_days` column (the UI reads it) →
--     leave balances rendered as blank/undefined.
--   • work_schedules uses shift_start/shift_end (not start_time/end_time).
--   • some employees had no work schedule / leave balances seeded.
--
-- This migration is intentionally ADDITIVE and IDEMPOTENT so it is safe to
-- run against the live schema:
--   1. Adds a generated leave_balances.available_days (total - used) so the
--      existing UI shows real numbers with no redeploy required.
--   2. Backfills leave balances + a Mon–Fri work schedule for every employee
--      that is missing them.
--   3. Adds an AFTER INSERT trigger so every future employee is seeded too.
-- It does NOT touch RLS (production already has working policies) and does
-- NOT assume the repo-only `users` table / get_user_company_id() function.
-- ============================================================

-- ── 1. leave_balances.available_days (generated) ─────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.leave_balances
    ADD COLUMN available_days NUMERIC
    GENERATED ALWAYS AS (COALESCE(total_days,0) - COALESCE(used_days,0)) STORED;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── 2. Per-employee HR defaults (uses LIVE column names) ─────────────────────
CREATE OR REPLACE FUNCTION public.seed_employee_hr_defaults(p_employee_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_dow  INTEGER;
  v_type TEXT;
  v_total NUMERIC;
BEGIN
  -- Annual leave entitlements (India SME baseline). leave_type values must
  -- satisfy the live CHECK: casual/sick/earned/comp_off/maternity/paternity.
  FOR v_type, v_total IN
    SELECT * FROM (VALUES ('casual',12),('sick',12),('earned',18),('comp_off',0)) AS t(t,d)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.leave_balances
      WHERE employee_id = p_employee_id AND leave_type = v_type AND year = v_year
    ) THEN
      INSERT INTO public.leave_balances (employee_id, leave_type, year, total_days, used_days)
      VALUES (p_employee_id, v_type, v_year, v_total, 0);
    END IF;
  END LOOP;

  -- Default schedule: Mon–Fri working, Sat/Sun off (0=Sun .. 6=Sat).
  FOR v_dow IN 0..6 LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.work_schedules
      WHERE employee_id = p_employee_id AND day_of_week = v_dow
    ) THEN
      INSERT INTO public.work_schedules (employee_id, day_of_week, shift_start, shift_end, is_working_day)
      VALUES (p_employee_id, v_dow, TIME '09:00', TIME '18:00', v_dow BETWEEN 1 AND 5);
    END IF;
  END LOOP;
END $$;

-- ── 3. Trigger: seed HR defaults for every new employee ──────────────────────
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

-- ── 4. One-time backfill for existing employees ─────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.employees LOOP
    PERFORM public.seed_employee_hr_defaults(r.id);
  END LOOP;
END $$;
