-- =============================================================================
-- Migration:   20260801120000_rls_ownership_rewrite
-- Date:        2026-08-02
-- Milestone:   v4.0 — Parent-First Account Architecture (COPPA), Phase 2
-- Description: Additive, reversible RLS rewrite (RLS-01..RLS-06). Adds
--              owned_child_ids() SECURITY INVOKER SQL STABLE helper +
--              46 parent-ownership sibling policies (37 Group A + 7 Group B +
--              2 Group C) across the 24-table inventory, OR'd alongside legacy
--              `student_id = auth.uid()` policies (dual-policy, additive
--              discipline — "add, don't replace"). Handles 3 owner-resolved
--              edge cases (D-31 user_preferences, D-32 accessories +
--              assignments). Re-points award_xp/check_rate_limit ownership
--              checks (D-23). Legacy policies are NOT dropped — Phase 8's
--              contract step drops them after verified zero traffic.
-- Source artifacts (owner-signed):
--               .planning/phases/02-rls-rewrite-ownership-based-access-control/02-policy-inventory.md
--               .planning/phases/02-rls-rewrite-ownership-based-access-control/02-inlining-verdict.md (VERDICT=FUNCTION)
--               .planning/phases/02-rls-rewrite-ownership-based-access-control/02-CONTEXT.md (D-31/D-32/D-33)
-- Predecessor: 20260722120000_add_parents_and_child_profiles.sql (Phase 1 — creates
--              parents/child_profiles, backfills the 15-parented/5-null split)
-- Rollback:    20260801120000_rls_ownership_rewrite.down.sql
-- NOTE: this migration issues ZERO `DROP POLICY` against any legacy policy.
--       Every downstream _parent_owner predicate uses the FUNCTION shape
--       (`IN (SELECT public.owned_child_ids())`), per 02-inlining-verdict.md's
--       VERDICT=FUNCTION (plan-structure evidence: owned_child_ids() folds into
--       a one-time ProjectSet/HashAggregate, loops=1, not re-evaluated per row).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. owned_child_ids() — the ownership helper (RLS-01)
--    SECURITY INVOKER (deliberate deviation from a naive SECURITY DEFINER —
--    RLS-H1: DEFINER blocks planner inlining, the RLS-05 perf-cliff anti-pattern).
--    Downstream-only: NEVER call from child_profiles' own policies (RLS-H2).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owned_child_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id
  FROM public.child_profiles
  WHERE parent_id = (SELECT auth.uid());
$$;

COMMENT ON FUNCTION public.owned_child_ids() IS
  'Returns the child_profiles.id set owned by the calling parent (auth.uid()). '
  'SECURITY INVOKER (deliberately NOT DEFINER, per RLS-H1 deviation — DEFINER blocks '
  'planner inlining and is the RLS-05 perf-cliff anti-pattern). Downstream-only: '
  'never call from child_profiles'' own policies (RLS-H2, immediate 42P17).';

GRANT EXECUTE ON FUNCTION public.owned_child_ids() TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. child_profiles — its own two TERMINAL policies (Group C, additive from
--    zero — table is deny-all today per Phase 1 D-16). Bare column equality /
--    direct EXISTS only — NEVER owned_child_ids() (RLS-H2, else 42P17 recursion).
-- -----------------------------------------------------------------------------
CREATE POLICY "child_profiles_all_parent_owner"
  ON public.child_profiles
  FOR ALL
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE POLICY "child_profiles_select_teacher"
  ON public.child_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.teacher_id = (SELECT auth.uid())
        AND tsc.student_id = child_profiles.id
        AND tsc.status = 'accepted'
    )
  );

-- =============================================================================
-- Downstream _parent_owner sibling policies begin here (Task 2 / Task 3).
-- Every policy below uses `<id_col> IN (SELECT public.owned_child_ids())` —
-- never a correlated EXISTS (Pitfall 4) — and additive-only (no DROP POLICY).
-- =============================================================================
