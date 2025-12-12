-- ============================================================================
-- STOOP POLITICS - BULLETPROOF DATABASE SCHEMA
-- Senior Database Engineer Review & Optimization
-- Created: December 12, 2025
-- ============================================================================

-- ============================================================================
-- SECTION 1: CLEANUP - Remove conflicting/redundant policies
-- ============================================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admin has full access to episodes" ON "public"."episodes";
DROP POLICY IF EXISTS "Authenticated users can manage episodes" ON "public"."episodes";
DROP POLICY IF EXISTS "Public can view published episodes" ON "public"."episodes";
DROP POLICY IF EXISTS "Authenticated users can manage transcripts" ON "public"."transcript_nodes";
DROP POLICY IF EXISTS "Public can view transcripts of published episodes" ON "public"."transcript_nodes";

-- ============================================================================
-- SECTION 2: ENHANCED EPISODES TABLE
-- ============================================================================

-- Add missing columns for better data integrity and features
ALTER TABLE "public"."episodes" 
  ADD COLUMN IF NOT EXISTS "created_by" UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "episode_number" INTEGER,
  ADD COLUMN IF NOT EXISTS "season_number" INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "transcription_status" TEXT DEFAULT 'pending' 
    CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS "audio_file_size" BIGINT,
  ADD COLUMN IF NOT EXISTS "audio_format" TEXT DEFAULT 'webm';

-- Add unique constraint on slug for SEO-friendly URLs
CREATE UNIQUE INDEX IF NOT EXISTS "episodes_slug_unique" ON "public"."episodes"("slug") WHERE "slug" IS NOT NULL;

-- Add index for soft deletes (only show non-deleted)
CREATE INDEX IF NOT EXISTS "idx_episodes_active" ON "public"."episodes"("deleted_at") WHERE "deleted_at" IS NULL;

-- Add index for episode numbering
CREATE INDEX IF NOT EXISTS "idx_episodes_numbering" ON "public"."episodes"("season_number", "episode_number");

-- Add check constraint for duration
ALTER TABLE "public"."episodes" 
  ADD CONSTRAINT "episodes_duration_positive" CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

-- ============================================================================
-- SECTION 3: ENHANCED TRANSCRIPT_NODES TABLE
-- ============================================================================

-- Ensure episode_id is NOT NULL (every transcript node must belong to an episode)
-- First, delete any orphaned nodes
DELETE FROM "public"."transcript_nodes" WHERE "episode_id" IS NULL;

-- Make episode_id required
ALTER TABLE "public"."transcript_nodes" 
  ALTER COLUMN "episode_id" SET NOT NULL;

-- Add updated_at column for tracking edits
ALTER TABLE "public"."transcript_nodes"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW();

-- Add speaker identification (for future multi-speaker support)
ALTER TABLE "public"."transcript_nodes"
  ADD COLUMN IF NOT EXISTS "speaker" TEXT;

-- Add confidence score from transcription
ALTER TABLE "public"."transcript_nodes"
  ADD COLUMN IF NOT EXISTS "confidence" REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));

-- Add full-text search vector column
ALTER TABLE "public"."transcript_nodes"
  ADD COLUMN IF NOT EXISTS "search_vector" TSVECTOR;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "idx_transcript_search" ON "public"."transcript_nodes" USING GIN("search_vector");

-- Add index for time-based queries (audio sync)
CREATE INDEX IF NOT EXISTS "idx_transcript_timing" ON "public"."transcript_nodes"("episode_id", "start_time", "end_time");

-- ============================================================================
-- SECTION 4: ANALYTICS TABLE - Track Episode Listens
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."episode_analytics" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "episode_id" UUID NOT NULL REFERENCES "public"."episodes"("id") ON DELETE CASCADE,
  "event_type" TEXT NOT NULL CHECK (event_type IN ('play', 'pause', 'complete', 'seek', 'share')),
  "listener_id" TEXT, -- Anonymous fingerprint or user ID
  "listen_duration_seconds" INTEGER,
  "percentage_listened" REAL CHECK (percentage_listened IS NULL OR (percentage_listened >= 0 AND percentage_listened <= 100)),
  "user_agent" TEXT,
  "ip_country" TEXT,
  "ip_city" TEXT,
  "referrer" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS "idx_analytics_episode" ON "public"."episode_analytics"("episode_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_analytics_event" ON "public"."episode_analytics"("event_type", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_analytics_daily" ON "public"."episode_analytics"(DATE("created_at"), "episode_id");

-- ============================================================================
-- SECTION 5: AUDIT LOG TABLE - Track All Admin Actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."audit_log" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID REFERENCES auth.users(id),
  "action" TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish', 'unpublish')),
  "table_name" TEXT NOT NULL,
  "record_id" UUID NOT NULL,
  "old_values" JSONB,
  "new_values" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_audit_user" ON "public"."audit_log"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_audit_record" ON "public"."audit_log"("table_name", "record_id");

-- ============================================================================
-- SECTION 6: REFERENCE SOURCES TABLE - Normalize reference links
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."reference_sources" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "domain" TEXT,
  "favicon_url" TEXT,
  "description" TEXT,
  "og_image_url" TEXT,
  "last_verified_at" TIMESTAMPTZ,
  "is_valid" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index on URL to avoid duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "reference_sources_url_unique" ON "public"."reference_sources"("url");

-- ============================================================================
-- SECTION 7: FUNCTIONS - Auto-update timestamps
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for episodes
DROP TRIGGER IF EXISTS update_episodes_updated_at ON "public"."episodes";
CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON "public"."episodes"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for transcript_nodes
DROP TRIGGER IF EXISTS update_transcript_nodes_updated_at ON "public"."transcript_nodes";
CREATE TRIGGER update_transcript_nodes_updated_at
  BEFORE UPDATE ON "public"."transcript_nodes"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 8: FUNCTIONS - Auto-update search vector
-- ============================================================================

CREATE OR REPLACE FUNCTION update_transcript_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transcript_search ON "public"."transcript_nodes";
CREATE TRIGGER update_transcript_search
  BEFORE INSERT OR UPDATE OF content ON "public"."transcript_nodes"
  FOR EACH ROW
  EXECUTE FUNCTION update_transcript_search_vector();

-- Backfill existing records
UPDATE "public"."transcript_nodes" 
SET search_vector = to_tsvector('english', COALESCE(content, ''))
WHERE search_vector IS NULL;

-- ============================================================================
-- SECTION 9: FUNCTIONS - Generate slug from title
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_episode_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = LOWER(REGEXP_REPLACE(
      REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ));
    -- Ensure uniqueness by appending timestamp if needed
    IF EXISTS (SELECT 1 FROM episodes WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug = NEW.slug || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_episode_slug_trigger ON "public"."episodes";
CREATE TRIGGER generate_episode_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON "public"."episodes"
  FOR EACH ROW
  EXECUTE FUNCTION generate_episode_slug();

-- ============================================================================
-- SECTION 10: FUNCTIONS - Auto-assign episode numbers
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_episode_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.episode_number IS NULL THEN
    SELECT COALESCE(MAX(episode_number), 0) + 1 INTO NEW.episode_number
    FROM episodes
    WHERE season_number = NEW.season_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assign_episode_number_trigger ON "public"."episodes";
CREATE TRIGGER assign_episode_number_trigger
  BEFORE INSERT ON "public"."episodes"
  FOR EACH ROW
  EXECUTE FUNCTION assign_episode_number();

-- ============================================================================
-- SECTION 11: ROW LEVEL SECURITY - Clean, non-overlapping policies
-- ============================================================================

-- EPISODES POLICIES
-- Policy 1: Public can view published, non-deleted episodes
CREATE POLICY "episodes_public_read" ON "public"."episodes"
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE AND deleted_at IS NULL);

-- Policy 2: Authenticated users can do everything (admin)
CREATE POLICY "episodes_admin_all" ON "public"."episodes"
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- TRANSCRIPT_NODES POLICIES
-- Policy 1: Public can view transcripts of published episodes
CREATE POLICY "transcripts_public_read" ON "public"."transcript_nodes"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM episodes 
      WHERE episodes.id = transcript_nodes.episode_id 
      AND episodes.is_published = TRUE 
      AND episodes.deleted_at IS NULL
    )
  );

-- Policy 2: Authenticated users can do everything (admin)
CREATE POLICY "transcripts_admin_all" ON "public"."transcript_nodes"
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ANALYTICS POLICIES
ALTER TABLE "public"."episode_analytics" ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics (track plays)
CREATE POLICY "analytics_public_insert" ON "public"."episode_analytics"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Only authenticated can read analytics
CREATE POLICY "analytics_admin_read" ON "public"."episode_analytics"
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- AUDIT LOG POLICIES
ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;

-- Only authenticated can read audit logs
CREATE POLICY "audit_admin_read" ON "public"."audit_log"
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- System inserts (via triggers) - using service role
CREATE POLICY "audit_system_insert" ON "public"."audit_log"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- REFERENCE SOURCES POLICIES
ALTER TABLE "public"."reference_sources" ENABLE ROW LEVEL SECURITY;

-- Anyone can read references
CREATE POLICY "references_public_read" ON "public"."reference_sources"
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Authenticated can manage references
CREATE POLICY "references_admin_all" ON "public"."reference_sources"
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- SECTION 12: VIEWS - Convenient data access
-- ============================================================================

-- View for published episodes with stats
CREATE OR REPLACE VIEW "public"."published_episodes_with_stats" AS
SELECT 
  e.*,
  (SELECT COUNT(*) FROM transcript_nodes tn WHERE tn.episode_id = e.id) as node_count,
  (SELECT COUNT(*) FROM episode_analytics ea WHERE ea.episode_id = e.id AND ea.event_type = 'play') as play_count,
  (SELECT COUNT(*) FROM episode_analytics ea WHERE ea.episode_id = e.id AND ea.event_type = 'complete') as completion_count
FROM episodes e
WHERE e.is_published = TRUE AND e.deleted_at IS NULL
ORDER BY e.published_at DESC;

-- View for admin dashboard stats
CREATE OR REPLACE VIEW "public"."admin_dashboard_stats" AS
SELECT
  (SELECT COUNT(*) FROM episodes WHERE deleted_at IS NULL) as total_episodes,
  (SELECT COUNT(*) FROM episodes WHERE is_published = TRUE AND deleted_at IS NULL) as published_episodes,
  (SELECT COUNT(*) FROM episodes WHERE is_published = FALSE AND deleted_at IS NULL) as draft_episodes,
  (SELECT COUNT(*) FROM transcript_nodes) as total_transcript_nodes,
  (SELECT COUNT(*) FROM episode_analytics WHERE event_type = 'play') as total_plays,
  (SELECT COUNT(DISTINCT listener_id) FROM episode_analytics) as unique_listeners,
  (SELECT COALESCE(SUM(duration_seconds), 0) FROM episodes WHERE deleted_at IS NULL) as total_content_seconds;

-- ============================================================================
-- SECTION 13: HELPER FUNCTIONS - For the app
-- ============================================================================

-- Function to search transcripts
CREATE OR REPLACE FUNCTION search_transcripts(search_query TEXT)
RETURNS TABLE (
  episode_id UUID,
  episode_title TEXT,
  node_id UUID,
  content TEXT,
  start_time DOUBLE PRECISION,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as episode_id,
    e.title as episode_title,
    tn.id as node_id,
    tn.content,
    tn.start_time,
    ts_rank(tn.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM transcript_nodes tn
  JOIN episodes e ON e.id = tn.episode_id
  WHERE 
    tn.search_vector @@ plainto_tsquery('english', search_query)
    AND e.is_published = TRUE
    AND e.deleted_at IS NULL
  ORDER BY rank DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get episode by slug
CREATE OR REPLACE FUNCTION get_episode_by_slug(episode_slug TEXT)
RETURNS SETOF episodes AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM episodes 
  WHERE slug = episode_slug 
  AND is_published = TRUE 
  AND deleted_at IS NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete an episode
CREATE OR REPLACE FUNCTION soft_delete_episode(episode_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE episodes 
  SET deleted_at = NOW(), is_published = FALSE
  WHERE id = episode_uuid;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a soft-deleted episode
CREATE OR REPLACE FUNCTION restore_episode(episode_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE episodes 
  SET deleted_at = NULL
  WHERE id = episode_uuid;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 14: GRANT PERMISSIONS
-- ============================================================================

-- Grant access to new tables
GRANT ALL ON TABLE "public"."episode_analytics" TO anon;
GRANT ALL ON TABLE "public"."episode_analytics" TO authenticated;
GRANT ALL ON TABLE "public"."episode_analytics" TO service_role;

GRANT ALL ON TABLE "public"."audit_log" TO authenticated;
GRANT ALL ON TABLE "public"."audit_log" TO service_role;

GRANT ALL ON TABLE "public"."reference_sources" TO anon;
GRANT ALL ON TABLE "public"."reference_sources" TO authenticated;
GRANT ALL ON TABLE "public"."reference_sources" TO service_role;

-- Grant access to views
GRANT SELECT ON "public"."published_episodes_with_stats" TO anon;
GRANT SELECT ON "public"."published_episodes_with_stats" TO authenticated;

GRANT SELECT ON "public"."admin_dashboard_stats" TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION search_transcripts(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION search_transcripts(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_episode_by_slug(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_episode_by_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_episode(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_episode(UUID) TO authenticated;

-- ============================================================================
-- SECTION 15: FIX STORAGE POLICIES
-- ============================================================================

-- Drop policies that reference wrong bucket name
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;

-- Create correct policy for 'media' bucket
CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'media');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
