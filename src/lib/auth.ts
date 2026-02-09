import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify that the request is from an authenticated admin user.
 * Use this in API routes that should only be accessible to admins
 * (e.g., email broadcasts, transcription, subscriber management).
 *
 * @returns NextResponse with 401 error if unauthorized, or null if authorized.
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op for API route auth checks
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in as an admin.' },
      { status: 401 }
    );
  }

  return null; // null = authorized
}
