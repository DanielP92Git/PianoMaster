// Takes an injected Supabase client — does NOT create its own client.
// This makes the function testable without Deno environment.

import type { WebhookPayload } from "./extractPayload.ts";

/**
 * UPSERTs a subscription row into parent_subscriptions using the LS subscription ID
 * as the conflict target. Idempotent: the same event arriving twice produces one row.
 *
 * Requires a service-role Supabase client (bypasses RLS — parent_subscriptions has
 * no authenticated INSERT/UPDATE/DELETE policies).
 *
 * Maps ls_variant_id → plan_id via subscription_plans table lookup.
 * Falls back to null if no matching plan found (defensive — handles unknown variant IDs).
 *
 * @param supabase - A Supabase client initialized with SUPABASE_SERVICE_ROLE_KEY
 * @param payload  - The whitelisted webhook payload from extractPayload()
 * @param parentId - The authoritative parent id returned by resolveParent() (D-01)
 * @throws If the upsert fails (caller handles HTTP 500 response + LS retry)
 */
export async function upsertSubscription(
  supabase: any,
  payload: WebhookPayload,
  parentId: string
): Promise<void> {
  // Look up plan_id from subscription_plans by ls_variant_id.
  // Defensive: falls back to null if no matching plan found (e.g., unknown variant ID).
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("lemon_squeezy_variant_id", payload.ls_variant_id)
    .maybeSingle();

  // D-14: writers target parent_id ONLY. student_id is deliberately NOT dual-written — the two
  // columns would drift the moment a parent has a second child. The legacy column is frozen as a
  // historical record until Phase 8 drops it.
  const { error } = await supabase.from("parent_subscriptions").upsert(
    {
      parent_id: parentId,
      ls_subscription_id: payload.ls_subscription_id,
      ls_customer_id: payload.ls_customer_id,
      ls_variant_id: payload.ls_variant_id,
      plan_id: plan?.id ?? null,
      status: payload.status,
      current_period_end: payload.current_period_end || null,
      parent_email: payload.parent_email || null,
    },
    { onConflict: "ls_subscription_id" }
  );

  if (error) {
    // Re-throw so index.ts can return HTTP 500 and allow LS to retry
    throw error;
  }
}
