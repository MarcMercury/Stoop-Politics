-- Fix: Add RLS policy to allow public verification of subscriptions
-- This allows the returning subscriber flow to check if an email exists

-- Drop the old restrictive SELECT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view subscribers" ON subscribers;

-- Create a new policy that allows anyone to SELECT (for email verification)
CREATE POLICY "Anyone can verify their subscription" ON subscribers
  FOR SELECT USING (true);
