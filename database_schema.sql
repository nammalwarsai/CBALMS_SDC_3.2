-- Create a table for public profiles using the uuid from auth.users
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text default 'employee',
  department text,
  mobile_number text,
  employee_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Policy: Admin (service role) has full access - Implicit, but if RLS is strict:
-- Supabase service role bypasses RLS by default.

-- Add status and photo columns to profiles
ALTER TABLE profiles ADD COLUMN present_status_of_employee text DEFAULT 'Absent';
ALTER TABLE profiles ADD COLUMN profile_photo text;

-- Create attendance table
CREATE TABLE attendance (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id uuid REFERENCES profiles(id) NOT NULL,
  date date NOT NULL,
  check_in time,
  check_out time,
  status text DEFAULT 'Absent',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance" ON attendance
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert own attendance" ON attendance
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update own attendance" ON attendance
  FOR UPDATE USING (auth.uid() = employee_id);

-- Create leaves table for leave management
CREATE TABLE leaves (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id uuid REFERENCES profiles(id) NOT NULL,
  leave_type text NOT NULL, -- 'Sick', 'Casual', 'Earned'
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  admin_remarks text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for leaves
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leaves" ON leaves
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert own leaves" ON leaves
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- Note: Admins will use service role to update leaves (approve/reject)
