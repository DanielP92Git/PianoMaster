// cancel-subscription Edge Function
// Cancels a Lemon Squeezy subscription server-side so the LS API key never reaches the browser.
//
// Responsibilities:
//   1. Reject non-POST requests and handle OPTIONS preflight (CORS)
//   2. Verify JWT — Supabase auto-verifies via verify_jwt = true in config.toml
//   3. Get auth.uid() from JWT — no body needed (parent ID comes from auth)
//   4. Select parent_subscriptions rows WHERE parent_id = auth.uid(); classify active; 0 -> 404,
//      1 -> cancel, >1 -> 409 AMBIGUOUS_ACTIVE_SUBSCRIPTIONS (D-06)
//   5. Call DELETE https://api.lemonsqueezy.com/v1/subscriptions/{ls_subscription_id}
//   6. Return { ok: true, endsAt } for optimistic UI display
//
// Security:
//   - verify_jwt = true in config.toml (only authenticated users can call)
//   - Parent can only cancel their own family's subscription (auth.uid() from JWT; no
//     request body is read)
//   - LS_API_KEY stays server-side (never exposed to browser)
//
// After cancellation, LS fires a subscription_cancelled webhook which the Phase 13
// webhook function handles — it upserts status: 'cancelled' into parent_subscriptions.
// The Realtime channel in SubscriptionContext auto-invalidates the React Query cache.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { selectActiveSubscription } from "./lib/selectActiveSubscription.ts";

const ALLOWED_ORIGINS = [
  "https://my-pianomaster.netlify.app",
  "http://localhost:5174",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Handle OPTIONS preflight for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Only accept POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // 2. Get auth.uid() from JWT via user client
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    console.error("cancel-subscription: auth error", authError);
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // The JWT's auth.uid() IS the parent uid post-Phase 3/4 — this was already true before
  // Phase 5, the column it was compared against was simply misnamed.
  const parentId = user.id;

  // 3. Create service role client to read parent_subscriptions
  //    (need service role to bypass RLS — parent_subscriptions has no authenticated read policy for UPDATE path)
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 4. Select the parent's subscription rows and classify (D-06).
  //    A parent can legitimately hold multiple rows; the old single-row-only query used to
  //    throw on that, blocking cancellation entirely.
  const result = await selectActiveSubscription(supabaseService, parentId);

  if (result.outcome === "db_error") {
    console.error(
      "cancel-subscription: DB error fetching subscription",
      result.error
    );
    return jsonResponse({ error: "Cancellation failed" }, 500);
  }

  if (result.outcome === "none") {
    console.error(
      "cancel-subscription: no active subscription found for parent",
      { parentId }
    );
    return jsonResponse({ error: "No active subscription found" }, 404);
  }

  if (result.outcome === "missing_ls_id") {
    console.error(
      "cancel-subscription: subscription has no ls_subscription_id",
      { parentId }
    );
    return jsonResponse({ error: "Subscription ID not found" }, 404);
  }

  // D-06: MORE than one active row -> a distinct, machine-readable error plus an alert.
  // We never pick arbitrarily: cancelling the wrong subscription while another keeps billing
  // is a support/refund incident (ROADMAP Pitfall 13). A human resolves this in the
  // Lemon Squeezy dashboard.
  if (result.outcome === "ambiguous") {
    console.error("CANCEL_AMBIGUOUS:", {
      parentId,
      count: result.subscriptions.length,
      ls_subscription_ids: result.subscriptions.map(
        (s) => s.ls_subscription_id
      ),
    });
    return jsonResponse(
      {
        error:
          "Multiple active subscriptions found — cancellation needs manual review",
        code: "AMBIGUOUS_ACTIVE_SUBSCRIPTIONS",
        count: result.subscriptions.length,
      },
      409
    );
  }

  const subscription = result.subscription;

  // 5. Call Lemon Squeezy API to cancel the subscription
  const LS_API_KEY = Deno.env.get("LS_API_KEY");

  if (!LS_API_KEY) {
    console.error("cancel-subscription: missing LS_API_KEY env var");
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  let lsResponse: Response;
  try {
    lsResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.ls_subscription_id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${LS_API_KEY}`,
        },
      }
    );
  } catch (fetchError) {
    console.error("cancel-subscription: LS API fetch failed", fetchError);
    return jsonResponse({ error: "Cancellation failed" }, 500);
  }

  if (!lsResponse.ok) {
    const lsError = await lsResponse.text();
    console.error("cancel-subscription: LS API error", {
      status: lsResponse.status,
      body: lsError,
    });
    return jsonResponse({ error: "Cancellation failed" }, 500);
  }

  // 6. Extract ends_at from LS response for optimistic UI display
  //    The webhook will also fire and update parent_subscriptions via Phase 13 function.
  const lsJson = await lsResponse.json();
  const endsAt =
    lsJson?.data?.attributes?.ends_at ??
    subscription.current_period_end ??
    null;

  console.log("cancel-subscription: subscription cancelled", {
    parentId,
    ls_subscription_id: subscription.ls_subscription_id,
    endsAt,
  });

  return jsonResponse({ ok: true, endsAt });
});
