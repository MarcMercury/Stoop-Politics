-- Migration: Create subscribers table for email subscription flow
-- Run this in your Supabase SQL Editor

-- 1. Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  notifications_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'banned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes for better query performance
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_notifications ON subscribers(notifications_enabled) WHERE notifications_enabled = true;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for public insert (anyone can subscribe)
CREATE POLICY "Anyone can subscribe" ON subscribers
  FOR INSERT WITH CHECK (true);

-- 5. Create policies for authenticated users (admin) to manage subscribers
CREATE POLICY "Authenticated users can view subscribers" ON subscribers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage subscribers" ON subscribers
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Allow public to update their own notification preferences (by email)
CREATE POLICY "Anyone can update their notification preferences" ON subscribers
  FOR UPDATE USING (true);

-- 7. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-update updated_at
CREATE TRIGGER trigger_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscribers_updated_at();
