// unsubscribe-weekly-report Edge Function
// Handles GET requests from unsubscribe links in weekly progress emails.
//
// Flow:
//   1. Parse ?sid= and ?token= query parameters from the URL
//   2. Verify the HMAC-SHA256 token matches the student ID
//   3. Update push_subscriptions.weekly_report_opted_out = true
//   4. Return a branded HTML confirmation page
//
// Security:
//   - verify_jwt = false in config.toml (parent clicks a link from email, no JWT)
//   - HMAC token prevents URL guessing -- only email recipients have valid tokens
//   - Service role client bypasses RLS (parent has no Supabase account)
//   - No PII in logs (student_id only, no names or emails)
//
// Environment variables required:
//   WEEKLY_REPORT_HMAC_SECRET   -- same secret used by send-weekly-report to sign tokens
//   SUPABASE_URL                -- auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY   -- auto-injected by Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================
// HMAC verification: verify the unsubscribe token
// ============================================================
async function verifyUnsubscribeToken(studentId: string, token: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(studentId));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return token === expected;
}

// ============================================================
// HTML response generator
// Branded page with PianoMaster styling (modern CSS, not table-based)
// ============================================================
function generateResponseHTML(success: boolean): string {
  const title = success ? 'Unsubscribed Successfully' : 'Invalid Link';
  const message = success
    ? 'You have been unsubscribed from PianoMaster weekly progress reports. You can re-enable these emails from the app\'s Settings page at any time.'
    : 'Invalid or expired unsubscribe link. Please try again from a recent email.';
  const icon = success ? '&#9989;' : '&#10060;';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - PianoMaster</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background-color: #f0f4f8;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
      padding: 36px 32px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .body {
      padding: 40px 32px;
      text-align: center;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .body h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
    }
    .body p {
      font-size: 15px;
      line-height: 24px;
      color: #64748b;
    }
    .footer {
      padding: 20px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>&#127929; PianoMaster</h1>
    </div>
    <div class="body">
      <div class="icon">${icon}</div>
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 PianoMaster. A safe learning environment for young musicians.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================
// Main handler
// ============================================================
Deno.serve(async (req: Request) => {
  // Only accept GET (browser click from email link)
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse query parameters
  const url = new URL(req.url);
  const sid = url.searchParams.get('sid');
  const token = url.searchParams.get('token');

  // Validate both params exist
  if (!sid || !token) {
    return new Response(generateResponseHTML(false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Get HMAC secret
  const hmacSecret = Deno.env.get('WEEKLY_REPORT_HMAC_SECRET');
  if (!hmacSecret) {
    console.error('unsubscribe-weekly-report: missing WEEKLY_REPORT_HMAC_SECRET');
    return new Response(generateResponseHTML(false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Verify HMAC token
  const isValid = await verifyUnsubscribeToken(sid, token, hmacSecret);
  if (!isValid) {
    console.log(`unsubscribe-weekly-report: invalid token for student ${sid}`);
    return new Response(generateResponseHTML(false), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Initialize Supabase service role client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Update opt-out status
  const { error: updateError } = await supabase
    .from('push_subscriptions')
    .update({ weekly_report_opted_out: true })
    .eq('student_id', sid);

  if (updateError) {
    console.error(`unsubscribe-weekly-report: DB update error for student ${sid}:`, updateError);
    return new Response(generateResponseHTML(false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  console.log(`unsubscribe-weekly-report: student ${sid} opted out`);

  return new Response(generateResponseHTML(true), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});
