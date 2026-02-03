import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, enabled } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find subscriber by email
    const { data: subscriber, error: findError } = await supabase
      .from('subscribers')
      .select('id, notifications_enabled')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (findError || !subscriber) {
      return NextResponse.json(
        { error: 'Email not found in our subscriber list' },
        { status: 404 }
      );
    }

    // Update notification preference
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ notifications_enabled: enabled })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      enabled,
      message: enabled 
        ? 'You will now receive notifications when new episodes drop!'
        : 'You have been unsubscribed from notifications.'
    });

  } catch (error) {
    console.error('Notification preference error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// GET endpoint to check notification status
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('notifications_enabled')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !subscriber) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      enabled: subscriber.notifications_enabled
    });

  } catch {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
