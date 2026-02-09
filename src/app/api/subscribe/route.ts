import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 subscribe attempts per IP per minute
    const ip = getClientIp(request);
    if (!checkRateLimit(`subscribe:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const { email, notifyMe } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      if (existing.status === 'banned') {
        return NextResponse.json(
          { error: 'This email has been blocked' },
          { status: 403 }
        );
      }
      
      // Already subscribed, update notification preference if needed
      await supabase
        .from('subscribers')
        .update({ 
          notifications_enabled: notifyMe,
          status: 'active'
        })
        .eq('id', existing.id);

      return NextResponse.json({ 
        success: true, 
        message: 'Welcome back! Your preferences have been updated.',
        isReturning: true
      });
    }

    // Create new subscriber
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({
        email: email.toLowerCase().trim(),
        notifications_enabled: notifyMe,
        status: 'active',
      });

    if (insertError) {
      console.error('Subscription error:', insertError);
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    // Send welcome email (non-blocking)
    try {
      const baseUrl = request.nextUrl.origin;
      await fetch(`${baseUrl}/api/email/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, notifyMe }),
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome to the Stoop!',
      isReturning: false
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
