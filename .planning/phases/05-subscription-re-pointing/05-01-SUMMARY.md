---
phase: 05-subscription-re-pointing
plan: 01
subsystem: database
tags: [supabase, pg_catalog, lemon-squeezy, sentry, discovery, coppa]

# Dependency graph
requires:
  - phase: 01-identity-schema-expand
    provides: "parents/child_profiles schema + 01-fk-checklist.md sign-off doc format precedent"
  - phase: 02-rls-rewrite-ownership-based-access-control
    provides: "dual-policy additive rollout convention, owner-gated production apply pattern, pg_catalog over information_schema precedent"
provides:
  - "05-discovery.md fully populated: real parent_subscriptions live schema (columns, constraints, FK delete rule, RLS policy, has_active_subscription() drift check), 9-row pre-backfill audit, Lemon Squeezy test-mode readiness facts, Sentry/tooling/RPC-body facts"
  - "05-subscription-signoff.md: D-11 before-backfill sign-off table for all 9 live parent_subscriptions rows, redacted per COPPA/GDPR-K, empty after-backfill table stubbed for plan 05-09"
  - "SC-2 correction: real row count is 9, not the plan's assumed 3 -- documented with owner-confirmed row-by-row explanation"
affects: [05-02, 05-03, 05-04, 05-06, 05-08, 05-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "console.error greppable-prefix alerting (WEBHOOK_UNRESOLVED:/CANCEL_AMBIGUOUS:) as the Sentry-unavailable fallback for Deno Edge Functions"
    - "throwaway-Supabase-project sandbox target (Docker unavailable locally)"
    - "pg_catalog over information_schema for all production introspection (Supabase non-owner query role returns [] under information_schema)"

key-files:
  created:
    - .planning/phases/05-subscription-re-pointing/05-discovery.md
    - .planning/phases/05-subscription-re-pointing/05-subscription-signoff.md
  modified: []

key-decisions:
  - "sentry_in_edge_functions: no -- zero grep matches across supabase/functions, config.toml, docs/DEPLOY.md; locked in console.error('WEBHOOK_UNRESOLVED:', ...) / console.error('CANCEL_AMBIGUOUS:', ...) as the D-03/D-06 alerting contract for plans 05-03/05-04"
  - "sandbox_target: throwaway-project -- Docker unavailable in this environment (DOCKER_UNAVAILABLE), so plan 05-06's seed script targets a throwaway second Supabase project instead of a local CLI stack"
  - "existing_student_id_fk_on_delete: CASCADE -- plan 05-02's new parent_id FK on parent_subscriptions must match this delete rule"
  - "SC-2 owner decision: D-11 sign-off scoped to all 9 live rows (not the plan's assumed 3) -- 7 rows are the owner's own dev/test checkout repeats (all status=expired, same legacy_student_id), 2 rows are manually-inserted out-of-band grants (uat-bypass-..., comp_...) with non-numeric ls_subscription_id values no real LS webhook could produce; none are currently-billing real customers, but the backfill will touch every row so sign-off covers all 9"
  - "test_mode_variant_id: 861115 -- confirmed for plan 05-06's seed script; NEVER write it into production subscription_plans (RESEARCH Pitfall 2)"
  - "test_mode_webhook_registration left as pending_verification (not separate/shared) -- store activation still pending as of this plan; plan 05-08 must re-verify before any re-pointing, since a shared registration would require temporary re-point + restore as an extra owner step"

requirements-completed: [MIGRATE-04]

# Metrics
duration: ~55min (Task 1 ~15min + Task 2/3 continuation ~40min)
completed: 2026-08-06
---

# Phase 5 Plan 01: Discovery & Owner-Gated Readiness Checks Summary

**Production `parent_subscriptions` schema, FK delete rule, RLS baseline, and D-11 pre-backfill sign-off (9 rows, not the assumed 3) confirmed via owner-run `pg_catalog` queries; Lemon Squeezy test-mode variant/checkout confirmed working.**

## Performance

- **Duration:** ~55 min total (Task 1 ~15 min, previously committed; Tasks 2-3 continuation ~40 min)
- **Started:** 2026-08-05T09:40:00Z (approx, Task 1)
- **Completed:** 2026-08-06 (Tasks 2-3, this continuation)
- **Tasks:** 3 of 3 completed
- **Files modified:** 2 (`05-discovery.md` modified across Tasks 1-3, `05-subscription-signoff.md` created in Task 2)

## Accomplishments

- **Task 1** (previously committed, `022f4637`): Confirmed zero Sentry references in the Edge Function surface, locking in the `console.error('WEBHOOK_UNRESOLVED:', ...)` / `console.error('CANCEL_AMBIGUOUS:', ...)` fallback for plans 05-03/05-04; confirmed Docker unavailable, locking in `throwaway-project` as the D-10(b) sandbox target; captured the verbatim `has_active_subscription(p_student_id UUID)` body as the "before" reference for plan 05-02.
- **Task 2**: Owner ran a 7-query read-only `pg_catalog` pack against production project `hdltcvgqrtxuxgjdvzzu`. Confirmed `parent_subscriptions` has 11 columns (no `parent_id` yet — phase premise valid), the `student_id` FK is `ON DELETE CASCADE` (plan 05-02's new `parent_id` FK must match), exactly one RLS policy (`parent_subscriptions_select_own`), and `has_active_subscription()` has zero drift between the tracked migration and production. Captured the D-11 "before" resolve-chain preview for all 9 live rows (not 3 — see Deviations) with zero resolve-chain failures, and confirmed zero duplicate-active-rows anomaly (D-08).
- **Task 3**: Owner confirmed a Lemon Squeezy test-mode variant (`861115`) exists and the test-mode checkout page renders a full, functional checkout form. Signing secret and API key availability confirmed (values never recorded). One open item flagged for plan 05-08: whether the single visible webhook registration is Test-mode-only or shared with Live could not be confirmed (store activation still pending), so plan 05-08 must re-verify before re-pointing anything.
- Created `05-subscription-signoff.md`, templated on `01-fk-checklist.md`'s structure, with the D-11 before-backfill table populated for all 9 rows (redacted emails, no full addresses committed) and an empty after-backfill table + owner sign-off checklist stubbed for plan 05-09.

## Task Commits

1. **Task 1: Determine Sentry-in-Edge-Functions availability and local-stack tooling readiness** - `022f4637` (docs)
2. **Task 2: [OWNER] Read-only production introspection + D-11 "before" capture** - `01974a52` (docs)
3. **Task 3: [OWNER] Confirm/create test-mode variant, webhook, and API key** - `a6a844a2` (docs)

_Note: This plan halted after Task 1 at commit `f3ee0f67` (interim summary), continued after `d1316111` (worktree merge), and completed Tasks 2-3 in this continuation session._

## Files Created/Modified

- `.planning/phases/05-subscription-re-pointing/05-discovery.md` - All six `## N.` sections now populated: (1) live schema/constraints/RLS/has_active_subscription() drift-check, (2) 9-row pre-backfill audit + SC-2 correction, (3) Lemon Squeezy test-mode readiness + plan 05-08 consequences, (4) alerting mechanism, (5) sandbox tooling, (6) has_active_subscription() before-body
- `.planning/phases/05-subscription-re-pointing/05-subscription-signoff.md` - D-11 sign-off doc: before-backfill table (9 rows, redacted emails), empty after-backfill table, owner sign-off checklist (9 checkboxes)

## Decisions Made

- **existing_student_id_fk_on_delete: CASCADE** — plan 05-02's new `parent_id` FK must use the same delete rule.
- **SC-2 scope correction**: D-11 sign-off covers all 9 live rows, not the plan's assumed 3 (see Deviations below for full rationale).
- **sentry_in_edge_functions: no** — locked in console.error prefix contract for plans 05-03/05-04.
- **sandbox_target: throwaway-project** — Docker unavailable locally.
- **test_mode_variant_id: 861115** — for plan 05-06's seed script; must never reach production `subscription_plans`.

## Deviations from Plan

### Auto-fixed / Owner-Approved Deviations

**1. [Rule 4 - owner-approved scope correction] SC-2 assumption of "3 live subscriptions" was factually wrong; real count is 9**

- **Found during:** Task 2, executing Q7 (`SELECT COUNT(*) AS total_rows FROM parent_subscriptions`)
- **Issue:** The plan's acceptance criteria and `<how-to-verify>` block both hard-coded an expectation of exactly 3 rows for Q5/Q7 and the `## Before backfill` sign-off table. The real production count is 9.
- **Root cause (owner-confirmed):** `parent_subscriptions` has no tracked `CREATE TABLE` migration (created out-of-band — this plan's own `<objective>`). Of the 9 rows:
  - 7 rows share one `legacy_student_id` (`1f569340-c919-438c-b61c-246d7c3b4cac`), all `status: expired` — the owner's own dev/test account from repeated manual checkout testing during development, not 7 distinct customers. 6 of the 7 show `emails_match: no`, which is the owner using a different test email at checkout than their real login email — a known, benign test artifact, not a fraud signal.
  - 2 rows (`uat-bypass-8650dc76-...`, `comp_e79437b8-...`) have non-numeric `ls_subscription_id` values that no real Lemon Squeezy webhook could ever produce — confirmed by the owner as manually-inserted out-of-band rows (a UAT bypass grant and a complimentary/friends-access grant with a permanent `2999-12-31` expiry sentinel).
  - None of the 9 rows represent a currently-billing real Lemon Squeezy customer today.
- **Resolution (owner decision, not unilaterally auto-fixed):** the owner reviewed the full per-row data and explicitly chose to scope the D-11 sign-off to **all 9 rows**, since plan 05-02's backfill will assign `parent_id` to every row in the table regardless of status — more conservative than the plan's original 3-row assumption, not less.
- **Files modified:** `05-discovery.md` §2 (explicit SC-2 correction + rationale recorded), `05-subscription-signoff.md` (9 data rows, 9 sign-off checkboxes)
- **Downstream impact documented:** plans 05-02, 05-03, 05-04, and 05-09 must all account for 9 rows (not 3), including the two non-numeric synthetic `ls_subscription_id` values surviving the backfill/migration unharmed as legitimate rows.
- **Committed in:** `01974a52` (Task 2 commit)

**2. [Informational, no fix needed] Task 2 Q3 false alarm — stale query briefly returned unrelated policies**

- **Found during:** Task 2, running Q3 (RLS policy audit)
- **Issue:** An earlier run in the owner's SQL Editor session accidentally returned unrelated policies from many other tables, due to a stale/incomplete query paste.
- **Resolution:** Owner re-ran the query cleanly; the confirmed result is the expected single policy, `parent_subscriptions_select_own`. No action needed, noted for the record only.
- **Files modified:** none (informational note only, recorded in `05-discovery.md` §1)

---

**Total deviations:** 1 owner-approved scope correction (SC-2 9-vs-3), 1 informational false-alarm note.
**Impact on plan:** The SC-2 correction changes the row count baseline for four downstream plans (05-02, 05-03, 05-04, 05-09) but does not change any migration logic, FK design, or RLS approach — it only means the backfill and its verification touch 9 rows instead of 3. No scope creep; strictly a factual correction the owner explicitly signed off on.

## Issues Encountered

None blocking. The two `checkpoint:human-action` gates (Task 2: Supabase SQL Editor, Task 3: Lemon Squeezy dashboard) both resolved cleanly with owner-supplied data; no `UNRESOLVED` rows, no duplicate-active-rows anomaly, no secrets or unredacted emails committed.

One open item carried forward as an explicit action item for plan 05-08 (not a blocker for this plan): whether the single visible Lemon Squeezy webhook registration in Test mode is separate from or shared with the Live registration could not be confirmed, because store ID verification/activation is still pending and the owner cannot currently toggle Test mode off to compare. Recorded in `05-discovery.md` §3 "Consequences for plan 05-08" as a mandatory re-check before any re-pointing.

## User Setup Required

None further. Both owner-run checkpoints (Supabase SQL Editor introspection, Lemon Squeezy dashboard confirmation) are complete for this plan. One informational follow-up is queued for plan 05-08 (re-verify webhook registration shared-vs-separate status) — not an action required now.

## Known Stubs

`05-subscription-signoff.md`'s `## After backfill` table is intentionally empty (header row only) — this is the designed data-dependency gate for plan 05-09, which populates it once the actual backfill migration has run. Not a code stub; matches the plan's own `<output>` spec ("post-backfill table stubbed").

## Next Phase Readiness

**Ready.** Plan 05-02 can now write the forward migration against confirmed live schema facts: the real 11-column list, the real `CASCADE` FK delete rule to match, and the real single-policy RLS baseline. Plan 05-08 has a confirmed Lemon Squeezy test-mode variant (`861115`) to check out against, plus an explicit pre-flight task (re-verify webhook registration scope) queued from this plan's findings. Plans 05-03/05-04 have a locked alerting mechanism (`WEBHOOK_UNRESOLVED:` / `CANCEL_AMBIGUOUS:` console.error prefixes) to implement and test against. Plans 05-02/05-03/05-04/05-09 must all use the corrected **9-row** baseline (not the original 3-row assumption) documented in this summary and in `05-discovery.md` §2.

---

*Phase: 05-subscription-re-pointing*
*Plan: 01*
*Completed: 2026-08-06*

## Self-Check: PASSED

- FOUND: `.planning/phases/05-subscription-re-pointing/05-discovery.md`
- FOUND: `.planning/phases/05-subscription-re-pointing/05-subscription-signoff.md`
- FOUND: `.planning/phases/05-subscription-re-pointing/05-01-SUMMARY.md`
- FOUND: commit `022f4637` in `git log --oneline --all`
- FOUND: commit `01974a52` in `git log --oneline --all`
- FOUND: commit `a6a844a2` in `git log --oneline --all`
- CONFIRMED: `05-discovery.md` contains zero `_pending_` placeholders (6/6 sections populated)
- CONFIRMED: `05-subscription-signoff.md` has 9 data rows in `## Before backfill`, empty `## After backfill`, `## OWNER SIGN-OFF` present
- CONFIRMED: no key-shaped strings (`(sk|lsq)_[A-Za-z0-9]{16,}`) in either file
- CONFIRMED: no unredacted email local-parts (regex `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+` returns zero matches in `05-subscription-signoff.md`)
