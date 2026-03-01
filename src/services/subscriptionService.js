import supabase from "./supabase";

/**
 * Fetch subscription status for the authenticated student.
 *
 * Mirrors the has_active_subscription() Postgres helper logic:
 * - active | on_trial -> isPremium: true
 * - cancelled + current_period_end in the future -> isPremium: true (grace)
 * - past_due + current_period_end within 3-day grace window -> isPremium: true
 * - Everything else -> isPremium: false (safe default)
 *
 * @param {string|null} studentId - The UUID of the authenticated student
 * @returns {Promise<{ isPremium: boolean }>}
 */
export async function fetchSubscriptionStatus(studentId) {
  if (!studentId) return { isPremium: false };

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("parent_subscriptions")
    .select("status, current_period_end")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error || !data) return { isPremium: false };

  const { status, current_period_end } = data;

  // Active or on trial — premium
  if (status === "active" || status === "on_trial") {
    return { isPremium: true };
  }

  // Cancelled but period not ended — still premium (grace period)
  if (status === "cancelled" && current_period_end && current_period_end > now) {
    return { isPremium: true };
  }

  // Past due with 3-day grace period (mirrors Postgres helper)
  if (status === "past_due" && current_period_end) {
    const threeDaysLater = new Date(
      new Date(current_period_end).getTime() + 3 * 24 * 60 * 60 * 1000
    ).toISOString();
    if (threeDaysLater > now) return { isPremium: true };
  }

  return { isPremium: false };
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
 * Queries parent_subscriptions for the student's row, then fetches the associated
 * plan name and billing details from subscription_plans if a plan_id is present.
 *
 * Uses parent_subscriptions_select_own RLS policy (student_id = auth.uid()) — the
 * calling user must be authenticated as the studentId provided.
 *
 * @param {string|null} studentId - The UUID of the authenticated student
 * @returns {Promise<{status: string, currentPeriodEnd: string|null, planName: string|null, billingPeriod: string|null, currency: string|null, amountCents: number|null, lsSubscriptionId: string|null}|null>}
 */
export async function fetchSubscriptionDetail(studentId) {
  if (!studentId) return null;

  const { data, error } = await supabase
    .from("parent_subscriptions")
    .select("status, current_period_end, plan_id, ls_subscription_id")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error || !data) return null;

  // Fetch plan details if plan_id is present
  let planName = null;
  let billingPeriod = null;
  let currency = null;
  let amountCents = null;

  if (data.plan_id) {
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("name, billing_period, currency, amount_cents")
      .eq("id", data.plan_id)
      .maybeSingle();

    if (!planError && plan) {
      planName = plan.name;
      billingPeriod = plan.billing_period;
      currency = plan.currency;
      amountCents = plan.amount_cents;
    }
  }

  return {
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    planName,
    billingPeriod,
    currency,
    amountCents,
    lsSubscriptionId: data.ls_subscription_id,
  };
}

export default { fetchSubscriptionStatus, fetchSubscriptionPlans, fetchSubscriptionDetail };
