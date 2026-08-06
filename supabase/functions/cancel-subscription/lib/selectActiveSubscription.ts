// Takes an injected Supabase client — does NOT create its own client.
// This makes the D-06 three-branch decision testable without a Deno environment or a live DB.

export interface SubscriptionRow {
  ls_subscription_id: string | null;
  current_period_end: string | null;
  status: string;
}

export type SelectOutcome =
  | { outcome: "db_error"; error: unknown }
  | { outcome: "none" }
  | { outcome: "missing_ls_id" }
  | { outcome: "one"; subscription: SubscriptionRow }
  | { outcome: "ambiguous"; subscriptions: SubscriptionRow[] };

/**
 * Mirrors has_active_subscription()'s SQL predicate EXACTLY
 * (supabase/migrations/20260404000001_ensure_subscription_rls.sql lines 43-54).
 * Any divergence re-creates the JS/SQL split-brain D-05 exists to close.
 */
export function isQualifyingSubscription(
  row: SubscriptionRow,
  nowIso: string
): boolean {
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
 * Selects a parent's parent_subscriptions rows and classifies them into a decision
 * outcome (D-06). A parent can legitimately hold multiple rows — this deliberately
 * does NOT call .maybeSingle(), and it never picks an arbitrary row when more than
 * one qualifies as active.
 *
 * @param supabase - A Supabase client initialized with SUPABASE_SERVICE_ROLE_KEY
 * @param parentId - The parent's auth.uid(), read only from the verified JWT
 */
export async function selectActiveSubscription(
  supabase: any,
  parentId: string
): Promise<SelectOutcome> {
  const { data, error } = await supabase
    .from("parent_subscriptions")
    .select("ls_subscription_id, current_period_end, status")
    .eq("parent_id", parentId); // NO .maybeSingle() — a parent can legitimately have many rows

  if (error) return { outcome: "db_error", error };

  const nowIso = new Date().toISOString();
  const qualifying = (data ?? []).filter((r: SubscriptionRow) =>
    isQualifyingSubscription(r, nowIso)
  );

  if (qualifying.length === 0) return { outcome: "none" };
  // D-06: more than one active row is NEVER resolved by picking. Cancelling the wrong
  // subscription while another keeps billing is a refund incident, not a bug.
  if (qualifying.length > 1)
    return { outcome: "ambiguous", subscriptions: qualifying };
  if (!qualifying[0].ls_subscription_id) return { outcome: "missing_ls_id" };
  return { outcome: "one", subscription: qualifying[0] };
}
