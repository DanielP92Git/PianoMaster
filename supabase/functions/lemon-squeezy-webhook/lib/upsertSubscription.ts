// Takes an injected Supabase client — does NOT create its own client.
// This makes the function testable without Deno environment.

import type { WebhookPayload } from './extractPayload.ts';

/**
 * UPSERTs a subscription row into parent_subscriptions using the LS subscription ID
 * as the conflict target. Idempotent: the same event arriving twice produces one row.
 *
 * Requires a service-role Supabase client (bypasses RLS — parent_subscriptions has
 * no authenticated INSERT/UPDATE/DELETE policies).
 *
 * plan_id is left NULL intentionally — Phase 16 will map ls_variant_id → plan_id.
 *
 * @param supabase - A Supabase client initialized with SUPABASE_SERVICE_ROLE_KEY
 * @param payload  - The whitelisted webhook payload from extractPayload()
 * @throws If the upsert fails (caller handles HTTP 500 response + LS retry)
 */
export async function upsertSubscription(
  supabase: any,
  payload: WebhookPayload
): Promise<void> {
  const { error } = await supabase
    .from('parent_subscriptions')
    .upsert(
      {
        student_id: payload.student_id,
        ls_subscription_id: payload.ls_subscription_id,
        ls_customer_id: payload.ls_customer_id,
        ls_variant_id: payload.ls_variant_id,
        plan_id: null, // Phase 16 will map ls_variant_id → plan_id
        status: payload.status,
        current_period_end: payload.current_period_end || null,
        parent_email: payload.parent_email || null,
      },
      { onConflict: 'ls_subscription_id' }
    );

  if (error) {
    // Re-throw so index.ts can return HTTP 500 and allow LS to retry
    throw error;
  }
}
