-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Drop existing tables if they exist (THIS WILL DELETE ALL DATA)
DROP TABLE IF EXISTS transcript_nodes CASCADE;
DROP TABLE IF EXISTS episodes CASCADE;

-- 1. Create episodes table
CREATE TABLE episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  duration_seconds INTEGER,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create transcript_nodes table
CREATE TABLE transcript_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  start_time FLOAT,
  end_time FLOAT,
  reference_link TEXT,
  reference_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for better query performance
CREATE INDEX idx_episodes_published ON episodes(is_published, published_at DESC);
CREATE INDEX idx_transcript_nodes_episode ON transcript_nodes(episode_id, display_order);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_nodes ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for public read access (for published episodes)
CREATE POLICY "Public can view published episodes" ON episodes
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view transcripts of published episodes" ON transcript_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM episodes 
      WHERE episodes.id = transcript_nodes.episode_id 
      AND episodes.is_published = true
    )
  );

-- 6. Create policies for authenticated users (admin) to manage everything
CREATE POLICY "Authenticated users can manage episodes" ON episodes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage transcripts" ON transcript_nodes
  FOR ALL USING (auth.role() = 'authenticated');
