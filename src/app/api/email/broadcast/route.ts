import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { subject, message } = await request.json();

    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Skip if no API key configured
    if (!resend) {
      console.log('[Broadcast] Skipping - No RESEND_API_KEY configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Email service not configured. Please set RESEND_API_KEY environment variable.'
      }, { status: 503 });
    }

    // Fetch all subscribers with notifications enabled
    const { data: subscribers, error: fetchError } = await supabaseAdmin
      .from('subscribers')
      .select('email')
      .eq('notifications_enabled', true)
      .eq('status', 'active');

    if (fetchError) {
      console.error('[Broadcast] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, message: 'No subscribers to notify' });
    }

    console.log(`[Broadcast] Sending to ${subscribers.length} subscribers`);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stooppolitics.com';
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Convert plain text message to HTML (preserve line breaks)
    const htmlMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    // Helper to delay between emails (Resend free tier: 2 requests/second)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Send emails to each subscriber
    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

      // Add delay after first email to respect rate limits
      if (i > 0) await delay(600);
      
      try {
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Stoop Politics <noreply@stooppolitics.com>',
          to: subscriber.email,
          subject: subject,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1c1917; margin: 0; padding: 0; background-color: #fafaf9;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; font-weight: 800; margin: 0; font-family: Georgia, serif;">
        Stoop<span style="color: #ea580c;">Politics</span>
      </h1>
      <p style="color: #78716c; font-size: 14px; margin-top: 4px; font-style: italic;">Watch your step</p>
    </div>

    <!-- Main Content -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e7e5e4;">
      
      <div style="color: #44403c; font-size: 16px; line-height: 1.7;">
        ${htmlMessage}
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${baseUrl}" style="display: inline-block; background-color: #ea580c; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Visit the Stoop →
        </a>
      </div>

      <p style="color: #78716c; font-size: 14px; margin: 0; text-align: center;">
        — Jessie Mercury
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #a8a29e; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">
        🏙️ Live from Manhattan
      </p>
      <p style="margin: 0 0 16px 0;">
        © ${new Date().getFullYear()} Stoop Politics. All rights reserved.
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #78716c; text-decoration: underline;">
          Unsubscribe from notifications
        </a>
      </p>
    </div>
  </div>
</body>
</html>
          `,
        });

        if (error) {
          console.error(`[Broadcast] Failed for ${subscriber.email}:`, error);
          errors.push(`${subscriber.email}: ${error.message || 'Unknown error'}`);
          errorCount++;
        } else {
          console.log(`[Broadcast] Sent to ${subscriber.email}`);
          successCount++;
        }
      } catch (err: any) {
        console.error(`[Broadcast] Error for ${subscriber.email}:`, err);
        errors.push(`${subscriber.email}: ${err.message || 'Unknown error'}`);
        errorCount++;
      }
    }

    console.log(`[Broadcast] Completed: ${successCount} sent, ${errorCount} failed`);
    
    if (errorCount > 0 && successCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `All emails failed. First error: ${errors[0] || 'Unknown'}`,
        sentCount: successCount, 
        errorCount,
        totalSubscribers: subscribers.length 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      sentCount: successCount, 
      errorCount,
      totalSubscribers: subscribers.length,
      ...(errorCount > 0 && { partialErrors: errors.slice(0, 3) })
    });

  } catch (error: any) {
    console.error('[Broadcast] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send broadcast' }, { status: 500 });
  }
}
