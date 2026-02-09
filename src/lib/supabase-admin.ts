import { createClient } from '@supabase/supabase-js';

/**
 * Server-only admin client — bypasses RLS with service role key.
 * Use ONLY in API routes; never import from client components.
 */
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey && typeof window === 'undefined') {
  console.warn(
    '[Supabase] WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'Admin operations will use the anon key with reduced permissions.'
  );
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
