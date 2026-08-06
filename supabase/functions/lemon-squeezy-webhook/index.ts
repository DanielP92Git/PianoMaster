// Lemon Squeezy Webhook Edge Function
// Thin entry point — HTTP in/out only. Business logic lives in lib/.
//
// Responsibilities:
//   1. Reject non-POST requests (405)
//   2. Read raw body before parsing (required for HMAC verification)
//   3. Verify X-Signature HMAC-SHA256 (400 on failure)
//   4. Parse and extract whitelisted payload fields
//   5. Route by event_name — ignore unhandled events (200)
//   6. Resolve custom_data id -> parent via the D-01 resolve-chain (parents, then child_profiles)
//   7. Unresolved -> dead-letter to unresolved_webhook_log + alert, return 200 (D-03)
//   8. UPSERT to parent_subscriptions via service role client
//   9. Return 200 on success, 500 on DB error (allows LS retry)
//
// Security:
//   - No CORS headers (server-to-server POST from Lemon Squeezy, not browser)
//   - Service role key bypasses RLS (parent_subscriptions has no write policies);
//     unresolved_webhook_log is deny-all RLS, service-role write only
//   - Parent email logged in redacted format (COPPA compliance)
//   - verify_jwt = false in config.toml (LS sends no Supabase JWT)
//
// Source: https://docs.lemonsqueezy.com/help/webhooks
//         https://supabase.com/docs/guides/functions/examples/stripe-webhooks

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySignature } from "./lib/verifySignature.ts";
import { extractPayload } from "./lib/extractPayload.ts";
import { upsertSubscription } from "./lib/upsertSubscription.ts";
import { resolveParent } from "./lib/resolveParent.ts";
import { recordUnresolvedWebhook } from "./lib/deadLetter.ts";

// The 4 core subscription lifecycle events this function handles.
// All other LS events (payment_success, payment_failed, paused, etc.) return 200 silently.
const HANDLED_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
]);

/**
 * Redacts a parent email address for COPPA-compliant logging.
 * Example: "parent@example.com" → "p***@example.com"
 */
function redactEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return "***";
  return email[0] + "***@" + email.slice(at + 1);
}

Deno.serve(async (req) => {
  // 1. Only accept POST — reject everything else
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // 2. Read raw body FIRST — body stream is consumed once.
  //    HMAC must be verified against the exact raw bytes before any parsing.
  const rawBody = await req.text();

  // 3. Verify HMAC-SHA256 signature
  const signingSecret = Deno.env.get("LS_SIGNING_SECRET") ?? "";
  const signature = req.headers.get("X-Signature") ?? "";
  const isValid = await verifySignature(rawBody, signature, signingSecret);

  if (!isValid) {
    console.error("Webhook: invalid or missing X-Signature header");
    return new Response("Invalid signature", { status: 400 });
  }

  // 4. Parse JSON (safe to parse now — signature is verified)
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // 5. Extract whitelisted fields from LS JSON:API payload
  const payload = extractPayload(body);

  // 6. Skip unhandled event types — return 200 to stop LS retries
  if (!HANDLED_EVENTS.has(payload.event_name)) {
    console.log(
      `Webhook: unhandled event type "${payload.event_name}", skipping`
    );
    return new Response("Event not handled", { status: 200 });
  }

  // Create service role client — bypasses RLS for parent_subscriptions writes, and is
  // needed by resolveParent()'s two probes. Moved up ahead of the resolve step (was
  // previously created after the old missing-student_id guard).
  // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.
  //
  // T-5-01: this client creation — and therefore the first database probe — must stay
  // strictly AFTER HMAC verification (step 3) and JSON parse (step 4). An unsigned
  // request is rejected with 400 before a single database call is made.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 7. Resolve the incoming custom_data id to an authoritative parent (D-01 resolve-chain).
  //    D-02: prefer parent_id when present; fall back to the legacy student_id shape so a
  //    checkout started before this deploy and completed after it still resolves.
  const resolution = await resolveParent(
    supabase,
    payload.parent_id ?? payload.student_id
  );

  // 7b. D-03: an unresolvable PAID webhook is a Pitfall-13 incident, not a no-op. Persist the
  //     whole payload, alert, and still return 200 so Lemon Squeezy stops retrying — retries
  //     cannot fix an id that does not exist. This replaces the previous silent
  //     console.error + 200 + never-written-row.
  if ("unresolved" in resolution) {
    await recordUnresolvedWebhook(supabase, body, payload);
    return new Response("Unresolved parent — recorded for review", {
      status: 200,
    });
  }

  // 8. UPSERT subscription row (idempotent — ON CONFLICT on ls_subscription_id)
  try {
    await upsertSubscription(supabase, payload, resolution.parentId);
  } catch (err) {
    // RESEARCH Q3 (resolved): a DB failure AFTER successful resolution is a TRANSIENT fault and
    // stays on the existing 500-and-LS-retry path. It is deliberately NOT dead-lettered —
    // the dead-letter table is reserved for permanent, human-reviewable resolution failures (D-03).
    // Return 500 so Lemon Squeezy retries (transient DB errors may resolve)
    console.error("Webhook: DB upsert failed", err);
    return new Response("Internal server error", { status: 500 });
  }

  // 9. Log successful processing with redacted email (COPPA compliance)
  const redactedEmail = payload.parent_email
    ? redactEmail(payload.parent_email)
    : "no-email";
  console.log(`Webhook: processed ${payload.event_name} for ${redactedEmail}`, {
    ls_subscription_id: payload.ls_subscription_id,
    status: payload.status,
  });

  return new Response("OK", { status: 200 });
});
