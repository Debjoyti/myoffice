-- ============================================================
-- Migration: Add accountant role + normalize employees schema
-- ============================================================

-- 1. Drop the old CHECK constraint on employees.role (if it exists)
DO $$
BEGIN
  -- Find and drop any CHECK constraint on employees.role
  DECLARE
    constraint_name TEXT;
  BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.employees'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%';

    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.employees DROP CONSTRAINT %I', constraint_name);
    END IF;
  END;
END$$;

-- 2. Add new CHECK constraint that includes accountant
ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_role_check;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_role_check
  CHECK (role IN ('admin', 'hr', 'manager', 'employee', 'accountant'));

-- 3. Ensure full_name column exists (might be first_name + last_name in older schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employees'
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN full_name TEXT;
    -- Backfill from first_name + last_name if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='first_name') THEN
      UPDATE public.employees SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''));
    END IF;
  END IF;
END$$;

-- 4. Ensure user_id references auth.users (not profiles) for the getAuthenticatedEmployee() helper
-- This is a safe check — only alters if constraint doesn't already reference auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
    WHERE kcu.table_name = 'employees' AND kcu.column_name = 'user_id'
      AND rc.unique_constraint_schema = 'auth'
  ) THEN
    -- Attempt to fix user_id FK to point to auth.users
    -- (only if no FK currently exists on user_id)
    BEGIN
      ALTER TABLE public.employees
        DROP CONSTRAINT IF EXISTS employees_user_id_fkey;
      ALTER TABLE public.employees
        ADD CONSTRAINT employees_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not update user_id FK: %', SQLERRM;
    END;
  END IF;
END$$;

-- 5. Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);

-- ============================================================
-- Note: Demo data is seeded via the API endpoint:
--   POST /api/v1/admin/seed-demo
--
-- Test accounts (all password: Demo@123456):
--   superadmin@prsk.demo  — Admin (full access)
--   hradmin@prsk.demo     — HR Manager
--   accountant@prsk.demo  — Accountant (finance)
--   employee@prsk.demo    — Employee (self-service)
-- ============================================================
