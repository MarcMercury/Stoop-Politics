import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client — uses cookies for auth (compatible with middleware).
 * createBrowserClient is a singleton; safe to call from multiple components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * @deprecated Use `createClient()` instead. Kept as alias for compatibility.
 */
export const supabase = createClient();
