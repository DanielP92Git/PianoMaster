/**
 * Send Feedback Edge Function
 *
 * Receives authenticated feedback submissions, validates input,
 * enforces rate limiting (3/hour per user), and sends plain-text
 * email to support inbox via Brevo API.
 *
 * Request Body:
 *   - type: 'bug' | 'suggestion' | 'other' (required)
 *   - message: string, 10-1000 chars after trim (required)
 *   - version: string (optional, defaults to 'unknown')
 *
 * Returns:
 *   - 200: { success: true }
 *   - 400: { success: false, error: string } (validation)
 *   - 401: { success: false, error: 'Unauthorized' }
 *   - 429: { success: false, error: 'rate_limit' }
 *   - 500: { success: false, error: string } (server/email)
 *   - 504: { success: false, error: 'Email service timeout' }
 *
 * Environment Variables:
 *   - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase)
 *   - BREVO_API_KEY: Brevo API key (required)
 *   - SENDER_EMAIL: Verified sender email (optional, defaults to noreply@pianomaster.app)
 *   - SENDER_NAME: Sender display name (optional, defaults to PianoMaster)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://my-pianomaster.netlify.app', 'http://localhost:5174'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // POST-only guard
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // 1. JWT extraction and authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('send-feedback: auth error', authError);
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    // 2. Parse and validate request body
    let type: string;
    let message: string;
    let version: string | undefined;

    try {
      const body = await req.json();
      type = body.type;
      message = body.message;
      version = body.version;
    } catch {
      return jsonResponse({ success: false, error: 'Invalid request body' }, 400);
    }

    const VALID_TYPES = ['bug', 'suggestion', 'other'];
    if (!VALID_TYPES.includes(type)) {
      return jsonResponse({ success: false, error: 'Invalid feedback type' }, 400);
    }

    const trimmed = (message ?? '').trim();
    if (trimmed.length < 10) {
      return jsonResponse({ success: false, error: 'Message must be at least 10 characters' }, 400);
    }
    if (trimmed.length > 1000) {
      return jsonResponse({ success: false, error: 'Message must not exceed 1000 characters' }, 400);
    }

    // 3. Rate check — service role bypasses RLS for COUNT query (no SELECT policy for authenticated users)
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseService
      .from('feedback_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .gt('created_at', oneHourAgo);

    if (countError) {
      console.error('send-feedback: rate check error', countError);
      return jsonResponse({ success: false, error: 'Internal server error' }, 500);
    }

    if ((count ?? 0) >= 3) {
      return jsonResponse({ success: false, error: 'rate_limit' }, 429);
    }

    // 4. Insert submission row (type only — message content NOT stored per D-07, COPPA-safe)
    const { error: insertError } = await supabaseService
      .from('feedback_submissions')
      .insert({ student_id: user.id, type });

    if (insertError) {
      console.error('send-feedback: insert error', insertError);
      return jsonResponse({ success: false, error: 'Internal server error' }, 500);
    }

    // 5. Build email content
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1); // e.g., "Bug", "Suggestion", "Other"
    const studentPrefix = user.id.substring(0, 8); // first 8 chars only — no full UUID in email (D-15)
    const timestamp = new Date().toISOString();
    const appVersion = version ?? 'unknown'; // missing version shows "unknown" (D-18)

    const subject = `[${typeLabel}] PianoMaster Feedback`;
    const emailBody = [
      `Type: ${typeLabel}`,
      `Student: ${studentPrefix}...`,
      `Version: ${appVersion}`,
      `Submitted: ${timestamp}`,
      '',
      '--- Message ---',
      trimmed,
    ].join('\n');

    // 6. Send via Brevo API
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      console.error('send-feedback: BREVO_API_KEY not set');
      return jsonResponse({ success: false, error: 'Email service configuration error' }, 500);
    }

    const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'noreply@pianomaster.app';
    const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'PianoMaster';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: SENDER_EMAIL },
          to: [{ email: SENDER_EMAIL }],
          subject,
          textContent: emailBody,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!brevoResponse.ok) {
        const errorData = await brevoResponse.text();
        console.error('send-feedback: Brevo API error', brevoResponse.status, errorData);
        return jsonResponse({ success: false, error: 'Email delivery failed' }, 500);
      }
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('send-feedback: Brevo API timeout');
        return jsonResponse({ success: false, error: 'Email service timeout' }, 504);
      }
      throw fetchError;
    }

    // 7. Success
    return jsonResponse({ success: true });

  } catch (error) {
    console.error('send-feedback: unhandled error', error);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500);
  }
});
