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
