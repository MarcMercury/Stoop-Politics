import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { email, notifyMe } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Skip if no API key configured
    if (!resend) {
      console.log('[Welcome Email] Skipping - No RESEND_API_KEY configured');
      return NextResponse.json({ success: true, skipped: true });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stooppolitics.com';
    const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Stoop Politics <noreply@stooppolitics.com>',
      to: email,
      subject: 'Welcome to the Stoop 🏙️',
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
      
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 16px 0; color: #1c1917;">
        Welcome to the Stoop! 🎙️
      </h2>
      
      <p style="color: #44403c; margin: 0 0 16px 0;">
        You're now part of the neighborhood. We're excited to have you sitting on the stoop with us.
      </p>
      
      <p style="color: #44403c; margin: 0 0 24px 0;">
        ${notifyMe 
          ? "You've opted in to receive notifications when new episodes drop. We'll keep you posted on the latest gossip from the stoop." 
          : "You can always opt in to receive notifications when new episodes drop by visiting our site."
        }
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}" style="display: inline-block; background-color: #1c1917; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Check Out the Latest Gossip →
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
      ${notifyMe ? `
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #78716c; text-decoration: underline;">
          Unsubscribe from notifications
        </a>
      </p>
      ` : ''}
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('[Welcome Email] Failed:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    console.log('[Welcome Email] Sent successfully:', data?.id);
    return NextResponse.json({ success: true, messageId: data?.id });

  } catch (error) {
    console.error('[Welcome Email] Error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
