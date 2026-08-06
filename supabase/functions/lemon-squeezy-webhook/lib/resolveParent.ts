// Pure function — zero imports.
// Takes an injected Supabase client — does NOT create its own client.
// This makes the function testable without a Deno environment.

/**
 * D-01 resolve-chain: turns an incoming Lemon Squeezy custom_data id — which may be a
 * parent_id, a legacy student_id, or garbage — into an authoritative parent_id.
 *
 * Probe order is load-bearing: parents.id first (all 3 live subscriptions are expected to
 * hit this, because Phase 1 reused UUIDs), then child_profiles.id -> parent_id as the
 * compatibility shim for a legacy or unexpected payload shape. The shim is removed in
 * Phase 8 (D-04).
 *
 * A lookup error is deliberately treated as a miss rather than thrown: falling through to
 * { unresolved: true } routes the event to the dead-letter table (loud, durable, reviewable),
 * which is the safe failure mode on a billing path.
 *
 * @param supabase    - A Supabase client initialized with SUPABASE_SERVICE_ROLE_KEY
 * @param candidateId - custom_data.parent_id ?? custom_data.student_id
 */
export async function resolveParent(
  supabase: any,
  candidateId: string | undefined
): Promise<{ parentId: string } | { unresolved: true }> {
  if (!candidateId) return { unresolved: true };

  // Probe 1: does this id already identify a parent?
  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("id", candidateId)
    .maybeSingle();
  if (parent) return { parentId: parent.id };

  // Probe 2: legacy shape — is this a child_profiles.id with a resolvable parent_id?
  const { data: child } = await supabase
    .from("child_profiles")
    .select("parent_id")
    .eq("id", candidateId)
    .maybeSingle();
  if (child?.parent_id) return { parentId: child.parent_id };

  // Both probes missed, or child.parent_id is NULL (teacher-owned, parent-less profile).
  return { unresolved: true };
}
