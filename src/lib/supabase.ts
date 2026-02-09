import { createClient } from '@supabase/supabase-js';

// Public client - for client-side operations (uses anon key with RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Warn if service role key is missing (server-side only)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey && typeof window === 'undefined') {
  console.warn(
    '[Supabase] WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'Admin operations will use the anon key with reduced permissions.'
  );
}

// Admin client - for server-side operations (bypasses RLS)
// Only use this in API routes, never expose to client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
