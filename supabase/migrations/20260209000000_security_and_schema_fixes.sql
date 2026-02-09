-- ============================================================================
-- STOOP POLITICS - Security & Schema Consolidation Migration
-- Date: 2026-02-09
-- Description:
--   1. Fix overly permissive subscribers RLS policies (data leak)
--   2. Fix episodes/transcript_nodes RLS to use auth.uid()
--   3. Add missing columns to episodes table
--   4. Add updated_at trigger to episodes
--   5. Add inbox message length constraint
-- ============================================================================


-- ============================================================================
-- SECTION 1: FIX SUBSCRIBERS RLS POLICIES
-- Previously SELECT and UPDATE were open to anon users (data leak).
-- Now: INSERT open (for subscribing), everything else admin-only.
-- Subscriber lookups in API routes use supabaseAdmin (service role key).
-- ============================================================================

-- Drop all existing subscriber policies
DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
DROP POLICY IF EXISTS "Anyone can verify their subscription" ON subscribers;
DROP POLICY IF EXISTS "Anyone can update their notification preferences" ON subscribers;
DROP POLICY IF EXISTS "Authenticated users can view subscribers" ON subscribers;
DROP POLICY IF EXISTS "Authenticated users can manage subscribers" ON subscribers;

-- Public can subscribe (INSERT only)
CREATE POLICY "Public can subscribe" ON subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (admin) can SELECT
CREATE POLICY "Admin can view subscribers" ON subscribers
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users (admin) can UPDATE
CREATE POLICY "Admin can update subscribers" ON subscribers
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users (admin) can DELETE
CREATE POLICY "Admin can delete subscribers" ON subscribers
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);


-- ============================================================================
-- SECTION 2: FIX EPISODES & TRANSCRIPT_NODES RLS POLICIES
-- Replace deprecated auth.role() = 'authenticated' with auth.uid() IS NOT NULL
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage episodes" ON episodes;
CREATE POLICY "Admin can manage episodes" ON episodes
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can manage transcripts" ON transcript_nodes;
CREATE POLICY "Admin can manage transcripts" ON transcript_nodes
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================================
-- SECTION 3: ADD MISSING COLUMNS TO EPISODES TABLE
-- These are referenced in code but were added ad-hoc, not in schema.
-- ============================================================================

ALTER TABLE episodes ADD COLUMN IF NOT EXISTS transcription_status TEXT DEFAULT 'pending';
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS audio_file_size BIGINT;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS audio_format TEXT;


-- ============================================================================
-- SECTION 4: ADD updated_at TRIGGER TO EPISODES
-- Subscribers table has this but episodes was missing it.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_episodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_episodes_updated_at ON episodes;
CREATE TRIGGER trigger_episodes_updated_at
  BEFORE UPDATE ON episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_episodes_updated_at();


-- ============================================================================
-- SECTION 5: ADD INBOX MESSAGE LENGTH CONSTRAINT
-- Frontend caps at 1000 chars; allow 2000 in DB for safety margin.
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'inbox_message_length'
    AND table_name = 'inbox'
  ) THEN
    ALTER TABLE inbox ADD CONSTRAINT inbox_message_length CHECK (length(message) <= 2000);
  END IF;
END $$;
