-- =============================================
-- CBALMS Database Schema (Supabase / PostgreSQL)
-- =============================================

-- 1. Profiles table (already exists - reference only)
-- CREATE TABLE IF NOT EXISTS profiles (
--   id UUID PRIMARY KEY REFERENCES auth.users(id),
--   email TEXT,
--   full_name TEXT,
--   role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
--   department TEXT,
--   mobile_number TEXT,
--   employee_id TEXT,
--   profile_photo TEXT,
--   present_status_of_employee TEXT DEFAULT 'Absent',
--   created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
-- );

-- 2. Leaves table (already exists - reference only)
-- CREATE TABLE IF NOT EXISTS leaves (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   employee_id UUID REFERENCES profiles(id),
--   leave_type TEXT CHECK (leave_type IN ('Sick', 'Casual', 'Earned')),
--   start_date DATE NOT NULL,
--   end_date DATE NOT NULL,
--   reason TEXT,
--   status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
--   reviewed_by UUID REFERENCES profiles(id),
--   reviewed_at TIMESTAMPTZ,
--   admin_remarks TEXT,
--   created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
-- );

-- 3. Attendance table (already exists - reference only)
-- CREATE TABLE IF NOT EXISTS attendance (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   employee_id UUID REFERENCES profiles(id),
--   date DATE NOT NULL,
--   check_in TEXT,
--   check_out TEXT,
--   status TEXT DEFAULT 'Present',
--   created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
-- );

-- =============================================
-- NEW TABLES - Run these in Supabase SQL Editor
-- =============================================

-- 4. Leave Balances table
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Sick', 'Casual', 'Earned')),
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  remaining_days INTEGER GENERATED ALWAYS AS (total_days - used_days) STORED,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE(employee_id, leave_type, year)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON leave_balances(employee_id, year);

-- 5. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('leave_request', 'leave_approved', 'leave_rejected', 'attendance', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =============================================
-- FUNCTION: Initialize leave balances for a new employee
-- =============================================
CREATE OR REPLACE FUNCTION initialize_leave_balances()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create balances for employee role
  IF NEW.role = 'employee' THEN
    INSERT INTO leave_balances (employee_id, leave_type, total_days, year)
    VALUES
      (NEW.id, 'Sick', 12, EXTRACT(YEAR FROM CURRENT_DATE)),
      (NEW.id, 'Casual', 10, EXTRACT(YEAR FROM CURRENT_DATE)),
      (NEW.id, 'Earned', 15, EXTRACT(YEAR FROM CURRENT_DATE))
    ON CONFLICT (employee_id, leave_type, year) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create leave balances when a new profile is created
DROP TRIGGER IF EXISTS trigger_init_leave_balances ON profiles;
CREATE TRIGGER trigger_init_leave_balances
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_leave_balances();

-- =============================================
-- FUNCTION: Update leave balances when leave is approved
-- =============================================
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  leave_days INTEGER;
BEGIN
  -- Only act when status changes to 'Approved'
  IF NEW.status = 'Approved' AND (OLD.status IS NULL OR OLD.status != 'Approved') THEN
    -- Calculate working days (excluding weekends)
    SELECT COUNT(*) INTO leave_days
    FROM generate_series(NEW.start_date, NEW.end_date, '1 day'::interval) d
    WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);

    -- Update the leave balance
    UPDATE leave_balances
    SET used_days = used_days + leave_days,
        updated_at = timezone('utc', now())
    WHERE employee_id = NEW.employee_id
      AND leave_type = NEW.leave_type
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;

  -- If status changes FROM Approved to something else (e.g., cancelled), restore days
  IF OLD.status = 'Approved' AND NEW.status != 'Approved' THEN
    SELECT COUNT(*) INTO leave_days
    FROM generate_series(NEW.start_date, NEW.end_date, '1 day'::interval) d
    WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);

    UPDATE leave_balances
    SET used_days = GREATEST(0, used_days - leave_days),
        updated_at = timezone('utc', now())
    WHERE employee_id = NEW.employee_id
      AND leave_type = NEW.leave_type
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update leave balance on leave status change
DROP TRIGGER IF EXISTS trigger_update_leave_balance ON leaves;
CREATE TRIGGER trigger_update_leave_balance
  AFTER UPDATE OF status ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance_on_approval();

-- =============================================
-- FUNCTION: Auto-update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leave_balances_updated ON leave_balances;
CREATE TRIGGER trigger_leave_balances_updated
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Initialize leave balances for existing employees
-- =============================================
INSERT INTO leave_balances (employee_id, leave_type, total_days, year)
SELECT p.id, lt.leave_type, lt.total_days, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
FROM profiles p
CROSS JOIN (
  VALUES ('Sick', 12), ('Casual', 10), ('Earned', 15)
) AS lt(leave_type, total_days)
WHERE p.role = 'employee'
ON CONFLICT (employee_id, leave_type, year) DO NOTHING;

-- =============================================
-- RLS Policies for new tables
-- =============================================

-- Enable RLS
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Leave Balances: employees can view their own, admins can view all
CREATE POLICY "Employees can view own leave balances" ON leave_balances
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Service role full access to leave_balances" ON leave_balances
  FOR ALL USING (true) WITH CHECK (true);

-- Notifications: users can view/update their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);
