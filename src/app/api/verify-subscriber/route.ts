import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 verify attempts per IP per minute
    const ip = getClientIp(request);
    if (!checkRateLimit(`verify:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if email exists and is active
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('id, status, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !subscriber) {
      return NextResponse.json(
        { error: 'Email not found. Please subscribe first.' },
        { status: 404 }
      );
    }

    if (subscriber.status === 'banned') {
      return NextResponse.json(
        { error: 'This email has been blocked.' },
        { status: 403 }
      );
    }

    // Email exists and is active - allow access
    return NextResponse.json({ 
      success: true, 
      message: 'Welcome back to the Stoop!',
      email: subscriber.email
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
