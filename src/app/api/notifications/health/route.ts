import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Cache health check result for 30 seconds to prevent hammering
let cachedHealth: { data: any; expiry: number } | null = null;

/**
 * Health check endpoint for notification system
 * GET /api/notifications/health
 */
export async function GET() {
  // Return cached response if still valid
  const now = Date.now();
  if (cachedHealth && now < cachedHealth.expiry) {
    return NextResponse.json(cachedHealth.data, {
      status: cachedHealth.data.status === 'error' ? 500 : 200,
    });
  }
  const health = {
    timestamp: new Date().toISOString(),
    status: 'ok' as 'ok' | 'degraded' | 'error',
    checks: {
      database: { status: 'unknown' as string, message: '' },
      subscribersTable: { status: 'unknown' as string, count: 0, withNotifications: 0 },
      emailService: { status: 'unknown' as string, configured: false, from: '' },
    }
  };

  // Check database connection
  try {
    const { error } = await supabaseAdmin.from('subscribers').select('count', { count: 'exact', head: true });
    if (error) {
      health.checks.database = { status: 'error', message: error.message };
      health.status = 'error';
    } else {
      health.checks.database = { status: 'ok', message: 'Connected to Supabase' };
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Connection failed';
    health.checks.database = { status: 'error', message: errorMessage };
    health.status = 'error';
  }

  // Check subscribers table
  try {
    const { count: totalCount } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: notifyCount } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('notifications_enabled', true);

    health.checks.subscribersTable = {
      status: 'ok',
      count: totalCount || 0,
      withNotifications: notifyCount || 0,
    };
  } catch {
    health.checks.subscribersTable = {
      status: 'error',
      count: 0,
      withNotifications: 0,
    };
    health.status = 'degraded';
  }

  // Check email service configuration
  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'Stoop Politics <noreply@stooppolitics.com>';
  
  if (resendKey && resendKey.startsWith('re_')) {
    health.checks.emailService = {
      status: 'ok',
      configured: true,
      from: emailFrom,
    };
  } else {
    health.checks.emailService = {
      status: 'warning',
      configured: false,
      from: '',
    };
    if (health.status === 'ok') health.status = 'degraded';
  }

  // Cache the result for 30 seconds
  cachedHealth = { data: health, expiry: Date.now() + 30_000 };

  return NextResponse.json(health, { 
    status: health.status === 'error' ? 500 : 200 
  });
}
