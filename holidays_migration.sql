-- =============================================
-- Holidays Table
-- =============================================
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- If table already exists, add the type column
ALTER TABLE holidays ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'public';

-- Index for fast year-based lookups
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- RLS
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can read holidays
CREATE POLICY "Authenticated users can view holidays" ON holidays
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access to holidays" ON holidays
  FOR ALL USING (true) WITH CHECK (true);
