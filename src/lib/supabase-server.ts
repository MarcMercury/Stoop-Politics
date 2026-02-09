import { createClient } from '@supabase/supabase-js';

/**
 * Lightweight anon client for server components (no auth state needed).
 * Used to read public data via RLS (e.g., published episodes).
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);
