import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

/**
 * On-demand revalidation endpoint.
 * Call after publishing/unpublishing episodes so the cached homepage updates immediately.
 * POST /api/revalidate
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  revalidatePath('/');

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
