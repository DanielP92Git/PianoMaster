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

export default { fetchSubscriptionStatus };
