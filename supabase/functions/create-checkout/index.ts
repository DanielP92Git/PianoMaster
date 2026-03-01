// create-checkout Edge Function
// Creates a Lemon Squeezy checkout URL server-side so the LS API key never reaches the browser.
//
// Responsibilities:
//   1. Reject non-POST requests and handle OPTIONS preflight (CORS)
//   2. Verify JWT — Supabase auto-verifies via verify_jwt = true in config.toml
//   3. Parse body: { planId, studentId }
//   4. Defense in depth: verify studentId === auth.uid() from JWT
//   5. Look up lemon_squeezy_variant_id from subscription_plans by planId
//   6. Call POST https://api.lemonsqueezy.com/v1/checkouts
//      with embed: true and student_id in checkout_data.custom
//   7. Return { checkoutUrl } on success, { error } on failure
//
// Security:
//   - verify_jwt = true in config.toml (only authenticated users can call)
//   - studentId verified against auth.uid() (prevents IDOR attacks)
//   - LS_API_KEY stays server-side (never exposed to browser)
//   - CORS restricted to authorization header only

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  // Handle OPTIONS preflight for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // 1. Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
  }

  // 2. Get auth.uid() from JWT via user client
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    console.error('create-checkout: auth error', authError);
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // 3. Parse request body
  let planId: string;
  let studentId: string;
  try {
    const body = await req.json();
    planId = body.planId;
    studentId = body.studentId;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!planId || !studentId) {
    return jsonResponse({ error: 'Missing planId or studentId' }, 400);
  }

  // 4. Defense in depth: verify studentId matches authenticated user
  if (user.id !== studentId) {
    console.error('create-checkout: studentId mismatch', {
      authUid: user.id,
      requestedStudentId: studentId,
    });
    return jsonResponse({ error: 'Forbidden: studentId does not match authenticated user' }, 403);
  }

  // 5. Look up lemon_squeezy_variant_id from subscription_plans
  //    Using service role client — plan lookup is public (RLS: USING(true)) but
  //    service role is consistent with webhook pattern and avoids any edge cases.
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: plan, error: planError } = await supabaseService
    .from('subscription_plans')
    .select('lemon_squeezy_variant_id')
    .eq('id', planId)
    .eq('is_active', true)
    .maybeSingle();

  if (planError || !plan) {
    console.error('create-checkout: plan not found', { planId, planError });
    return jsonResponse({ error: 'Plan not found' }, 400);
  }

  if (!plan.lemon_squeezy_variant_id) {
    console.error('create-checkout: plan has no variant ID (pre-flight data step required)', { planId });
    return jsonResponse({ error: 'Plan variant ID not configured' }, 400);
  }

  const variantId = plan.lemon_squeezy_variant_id;

  // 6. Call Lemon Squeezy API to create checkout
  const LS_API_KEY = Deno.env.get('LS_API_KEY');
  const LS_STORE_ID = Deno.env.get('LS_STORE_ID');

  if (!LS_API_KEY || !LS_STORE_ID) {
    console.error('create-checkout: missing LS env vars (LS_API_KEY or LS_STORE_ID)');
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  let lsResponse: Response;
  try {
    lsResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${LS_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_options: {
              embed: true,
            },
            checkout_data: {
              custom: {
                student_id: studentId,
              },
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: LS_STORE_ID },
            },
            variant: {
              data: { type: 'variants', id: variantId },
            },
          },
        },
      }),
    });
  } catch (fetchError) {
    console.error('create-checkout: LS API fetch failed', fetchError);
    return jsonResponse({ error: 'Checkout creation failed' }, 500);
  }

  if (!lsResponse.ok) {
    const lsError = await lsResponse.text();
    console.error('create-checkout: LS API error', {
      status: lsResponse.status,
      body: lsError,
    });
    return jsonResponse({ error: 'Checkout creation failed' }, 500);
  }

  // 7. Extract checkoutUrl from LS response
  const lsJson = await lsResponse.json();
  const checkoutUrl = lsJson?.data?.attributes?.url;

  if (!checkoutUrl) {
    console.error('create-checkout: no URL in LS response', lsJson);
    return jsonResponse({ error: 'Checkout creation failed' }, 500);
  }

  // 8. Return checkout URL to client
  return jsonResponse({ checkoutUrl });
});
