import supabase from "./supabase";

/**
 * Mirrors has_active_subscription()'s SQL predicate EXACTLY
 * (supabase/migrations/20260404000001_ensure_subscription_rls.sql lines 43-54).
 * D-05: any divergence between this and the SQL re-creates the split-brain where the database
 * permits a write the UI believes is impossible.
 */
function isQualifying(row, nowIso) {
  if (row.status === "active" || row.status === "on_trial") return true;
  if (
    row.status === "cancelled" &&
    row.current_period_end &&
    row.current_period_end > nowIso
  ) {
    return true;
  }
  if (row.status === "past_due" && row.current_period_end) {
    const graceEnd = new Date(
      new Date(row.current_period_end).getTime() + 3 * 24 * 60 * 60 * 1000
    ).toISOString();
    if (graceEnd > nowIso) return true;
  }
  return false;
}

/**
 * Fetch subscription status for the authenticated parent.
 *
 * Mirrors the has_active_subscription() Postgres helper logic:
 * - active | on_trial -> isPremium: true
 * - cancelled + current_period_end in the future -> isPremium: true (grace)
 * - past_due + current_period_end within 3-day grace window -> isPremium: true
 * - Everything else -> isPremium: false (safe default)
 *
 * D-05: Any active row wins — matches the Postgres EXISTS semantics. A subscription is
 * family-wide, so a parent with multiple rows is premium if any one of them qualifies.
 *
 * @param {string|null} parentId - The parent's auth uid (the family-wide subscription owner)
 * @returns {Promise<{ isPremium: boolean }>}
 */
export async function fetchSubscriptionStatus(parentId) {
  if (!parentId) return { isPremium: false };

  const now = new Date().toISOString();

  // A parent may have multiple subscription rows (e.g. repeated test-mode checkouts,
  // or a genuine anomaly). Fetch ALL rows — premium if ANY one qualifies (D-05).
  const { data, error } = await supabase
    .from("parent_subscriptions")
    .select("status, current_period_end")
    .eq("parent_id", parentId);

  if (error) {
    console.error(
      "[subscriptionService] fetchSubscriptionStatus error:",
      error.message,
      error.code
    );
    return { isPremium: false };
  }

  return { isPremium: (data ?? []).some((r) => isQualifying(r, now)) };
}

/**
 * Fetch subscription plans for a given currency.
 *
 * Uses the subscription_plans table (RLS: subscription_plans_select_public — USING(true),
 * so any authenticated user can read plans).
 *
 * @param {'ILS'|'USD'} currency - The currency to filter plans by
 * @returns {Promise<Array>} Array of plan objects, or empty array on error
 */
export async function fetchSubscriptionPlans(currency) {
  if (!currency) return [];

  const { data, error } = await supabase
    .from("subscription_plans")
    .select(
      "id, name, billing_period, currency, amount_cents, lemon_squeezy_variant_id"
    )
    .eq("currency", currency)
    .eq("is_active", true)
    .order("billing_period"); // 'monthly' sorts before 'yearly'

  if (error) {
    console.error("fetchSubscriptionPlans error:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch full subscription detail for display in the parent portal.
 *
 * Queries parent_subscriptions for the parent's rows, then fetches the associated
 * plan name and billing details from subscription_plans if a plan_id is present.
 *
 * Uses parent_subscriptions_select_own_parent RLS policy (parent_id = auth.uid()) — the
 * calling user must be authenticated as the parentId provided. The legacy
 * parent_subscriptions_select_own policy (student_id = auth.uid()) remains additive
 * until Phase 8.
 *
 * D-07: shows the active row, falling back to the most-recent row when none is active, so
 * the Parent Portal always agrees with the gate the parent actually experiences.
 *
 * @param {string|null} parentId - The parent's auth uid (the family-wide subscription owner)
 * @returns {Promise<{status: string, currentPeriodEnd: string|null, planName: string|null, billingPeriod: string|null, currency: string|null, amountCents: number|null, lsSubscriptionId: string|null}|null>}
 */
export async function fetchSubscriptionDetail(parentId) {
  if (!parentId) return null;

  // A parent may have multiple subscription rows — fetch all, most-recent first.
  const { data, error } = await supabase
    .from("parent_subscriptions")
    .select("status, current_period_end, plan_id, ls_subscription_id")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[subscriptionService] fetchSubscriptionDetail error:",
      error.message,
      error.code
    );
    return null;
  }
  if (!data || data.length === 0) return null;

  // D-07: show the active row; fall back to the most-recent when none is active, so the
  // portal always agrees with the gate the parent actually experiences while a lapsed
  // parent still sees their billing history and something for the renew/cancel UI to render.
  const now = new Date().toISOString();
  const chosen = data.find((r) => isQualifying(r, now)) ?? data[0];

  // Fetch plan details if plan_id is present
  let planName = null;
  let billingPeriod = null;
  let currency = null;
  let amountCents = null;

  if (chosen.plan_id) {
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("name, billing_period, currency, amount_cents")
      .eq("id", chosen.plan_id)
      .maybeSingle();

    if (!planError && plan) {
      planName = plan.name;
      billingPeriod = plan.billing_period;
      currency = plan.currency;
      amountCents = plan.amount_cents;
    }
  }

  return {
    status: chosen.status,
    currentPeriodEnd: chosen.current_period_end,
    planName,
    billingPeriod,
    currency,
    amountCents,
    lsSubscriptionId: chosen.ls_subscription_id,
  };
}

export default {
  fetchSubscriptionStatus,
  fetchSubscriptionPlans,
  fetchSubscriptionDetail,
};
