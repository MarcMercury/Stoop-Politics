import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Health check endpoint for notification system
 * GET /api/notifications/health
 * 
 * Returns status of:
 * - Database connection
 * - Subscribers table access
 * - Email service configuration
 */
export async function GET(request: NextRequest) {
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
  } catch (err: any) {
    health.checks.database = { status: 'error', message: err.message || 'Connection failed' };
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
  } catch (err: any) {
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

  return NextResponse.json(health, { 
    status: health.status === 'error' ? 500 : 200 
  });
}
