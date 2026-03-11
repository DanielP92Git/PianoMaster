/**
 * Verify Parental Consent Edge Function
 *
 * Securely verifies parental consent tokens server-side using the
 * verify_parental_consent() SECURITY DEFINER function with service role.
 *
 * Parents click a link in their email and land on /consent/verify?token=xxx&student=yyy.
 * The client sends { studentId, token } here instead of querying tables directly.
 *
 * Security:
 * - verify_jwt = false (parents are not logged in)
 * - Token is hashed server-side before DB lookup (raw token never stored)
 * - Uses service role to call SECURITY DEFINER function
 * - Rate limiting via token expiry (7 days) and single-use tokens
 * - CORS restricted to known origins
 *
 * Request Body:
 * - studentId: string (UUID)
 * - token: string (raw consent token from email link)
 *
 * Returns:
 * - Success: { success: true }
 * - Error: { success: false, error: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://testpianomaster.netlify.app', 'http://localhost:5174'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

/**
 * Hash a token using SHA-256 (matches client-side hashToken in consentService.js)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const { studentId, token } = await req.json();

    // Validate inputs
    if (!studentId || !token) {
      return jsonResponse(
        { success: false, error: 'Missing required parameters: studentId and token' },
        400
      );
    }

    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studentId)) {
      return jsonResponse({ success: false, error: 'Invalid student ID format' }, 400);
    }

    // Hash the token server-side
    const tokenHash = await hashToken(token);

    // Create service role client to call SECURITY DEFINER function
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Call the DB function that verifies token, activates account, and logs
    const { data, error } = await supabaseAdmin.rpc('verify_parental_consent', {
      p_student_id: studentId,
      p_token_hash: tokenHash,
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null,
      p_user_agent: req.headers.get('user-agent') || null,
    });

    if (error) {
      console.error('verify_parental_consent error:', error);
      return jsonResponse({ success: false, error: 'Verification failed' }, 500);
    }

    // data is boolean — false means token not found/expired/used
    if (!data) {
      return jsonResponse(
        { success: false, error: 'Invalid or expired consent token' },
        400
      );
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Edge Function error:', err);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500);
  }
});
