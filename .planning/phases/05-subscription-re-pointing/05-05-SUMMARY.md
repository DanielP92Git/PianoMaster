---
phase: 05-subscription-re-pointing
plan: 05
subsystem: payments
tags: [supabase, react-query, realtime, i18n, subscription, parent_id]

# Dependency graph
requires:
  - phase: 05-subscription-re-pointing (05-01)
    provides: "Discovery facts — confirmed has_active_subscription() signature stable, parent_subscriptions live column set (no parent_id yet), SC-2 row-count correction (9 rows, not 3)"
provides:
  - "fetchSubscriptionStatus and fetchSubscriptionDetail re-pointed onto parent_id with a shared isQualifying() predicate mirroring has_active_subscription()'s SQL body exactly (D-05, D-07)"
  - "SubscriptionContext Realtime filter swapped to parent_id=eq.${userId} (D-14)"
  - "ParentPortalPage's cancel flow surfaces a distinct AMBIGUOUS_ACTIVE_SUBSCRIPTIONS toast instead of the generic cancellation-failed message (D-06 client half)"
  - "19 new/rewritten subscriptionService tests locking in D-05 multi-row semantics and the parent_id column at the query layer"
affects: [05-09-production-apply, phase-8-legacy-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared isQualifying(row, nowIso) module-level predicate reused by both read functions so the JS mirror of has_active_subscription()'s SQL body cannot drift between the two call sites"
    - "Vitest mock chain shortened to match: .eq() resolves directly as a real Promise carrying .order/.maybeSingle properties, so the same mock supports fetchSubscriptionStatus's short chain and fetchSubscriptionDetail's longer one without duplicating mock scaffolding"

key-files:
  created: []
  modified:
    - src/services/subscriptionService.js
    - src/services/__tests__/subscriptionService.test.js
    - src/contexts/SubscriptionContext.jsx
    - src/pages/ParentPortalPage.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Locale keys were added to src/locales/en/common.json and src/locales/he/common.json, not translation.json as the plan's files_modified list named — the project's actual i18n namespace file is common.json (confirmed by locating the existing parentPortal.cancelError key); translation.json does not exist in this codebase (Rule 3 — corrected file target, no functional deviation)."
  - "Kept SubscriptionContext's channel name (subscription-changes-${userId}) and React Query key (['subscription', userId]) unchanged per the plan's Claude's Discretion — only the Realtime filter itself changed to parent_id."
  - "cancel-subscription/index.ts itself was NOT modified in this worktree — its D-06 409 AMBIGUOUS_ACTIVE_SUBSCRIPTIONS response is plan 05-04's responsibility, running concurrently in a sibling worktree. This plan's client branch is written defensively against that documented response shape (checked on both data.code and error.context.json()) so it will function correctly once the two branches merge."

patterns-established:
  - "Predicate parity: any future change to has_active_subscription()'s SQL body must be mirrored in isQualifying() (subscriptionService.js) to avoid re-introducing the D-05 split-brain."

requirements-completed: [MIGRATE-04]

# Metrics
duration: 27min
completed: 2026-08-06
---

# Phase 05 Plan 05: Subscription Client Re-Pointing Summary

**Re-pointed subscriptionService.js's two read functions and SubscriptionContext's Realtime filter from student_id to parent_id, replacing JS's "most-recent row" premium check with Postgres's "any qualifying row" EXISTS semantics, and added a distinct client-side branch for the multi-active-subscription cancel-ambiguity case.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-08-06T10:35:46+03:00 (worktree base correction)
- **Completed:** 2026-08-06T11:01:57+03:00
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Killed the premium-check split-brain (D-05): `fetchSubscriptionStatus` now fetches all of a parent's `parent_subscriptions` rows and returns `isPremium: true` if ANY row qualifies, matching `has_active_subscription()`'s `EXISTS(...)` semantics instead of JS's old `order by created_at desc limit 1` pick.
- `fetchSubscriptionDetail` now shows the active row when one exists, falling back to the most-recent row otherwise (D-07), so the Parent Portal always agrees with the gate the parent actually experiences.
- Both functions renamed `studentId` → `parentId` and query `eq("parent_id", ...)` instead of `eq("student_id", ...)`.
- `SubscriptionContext`'s Realtime `postgres_changes` filter swapped to `parent_id=eq.${userId}` so webhook writes (once plan 05-02/05-03 land the column and plan 05-09 applies it) actually invalidate the client cache.
- `ParentPortalPage`'s cancel flow now recognizes a `409 { code: 'AMBIGUOUS_ACTIVE_SUBSCRIPTIONS' }` response and shows a dedicated "contact support" toast rather than the generic cancellation-failed message — the case where a parent holds two simultaneously-active subscriptions and the server refuses to guess which to cancel (D-06 client half).
- Added `parentPortal.cancelAmbiguous` to both EN and HE locale files, beside the existing `cancelError` key.
- Rewrote `subscriptionService.test.js`'s mock chain to match the shortened query paths and added 12 new test cases (19 total) covering D-05 multi-row semantics, D-07 fallback behavior, and a hard assertion that the query calls `.eq("parent_id", ...)` and never `.order()`/`.limit()`/`.maybeSingle()` in the status path.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite fetchSubscriptionStatus (D-05) and fetchSubscriptionDetail (D-07) onto parent_id** - `0c90d924` (feat)
2. **Task 2: Swap the Realtime filter and surface the D-06 ambiguity response distinctly** - `e1b8bb90` (feat)

**Plan metadata:** (this commit) `docs(05-05): complete plan`

## Files Created/Modified

- `src/services/subscriptionService.js` - Added shared `isQualifying(row, nowIso)` helper; rewrote `fetchSubscriptionStatus` to fetch all rows via `.eq("parent_id", parentId)` with no `.order()/.limit()/.maybeSingle()`, returning `isPremium: data.some(isQualifying)`; rewrote `fetchSubscriptionDetail` to fetch all rows ordered `created_at desc`, choosing the first qualifying row or falling back to `data[0]`
- `src/services/__tests__/subscriptionService.test.js` - Rewrote the mock chain (`.eq()` resolves directly as a thenable carrying `.order`/`.maybeSingle`); 19 tests total (13 for `fetchSubscriptionStatus`, 6 for `fetchSubscriptionDetail`)
- `src/contexts/SubscriptionContext.jsx` - Realtime filter `student_id=eq.${userId}` → `parent_id=eq.${userId}`, with a comment explaining the rename
- `src/pages/ParentPortalPage.jsx` - `handleCancel` now checks for the D-06 ambiguity response before the generic error branch, using `t("parentPortal.cancelAmbiguous")` and returning without setting `optimisticCancel`
- `src/locales/en/common.json` - Added `parentPortal.cancelAmbiguous`
- `src/locales/he/common.json` - Added `parentPortal.cancelAmbiguous` (Hebrew)

## Decisions Made

- Locale keys landed in `common.json` (the codebase's real i18n namespace file), not the `translation.json` path named in the plan's frontmatter — verified by grepping for the existing `cancelError` sibling key before editing (Rule 3: corrected a stale file reference, no functional deviation).
- `SubscriptionContext`'s channel name and React Query key were left unchanged (`subscription-changes-${userId}`, `["subscription", userId]`) per the plan's explicit Claude's Discretion call — only the Realtime filter itself needed to change.
- `supabase/functions/cancel-subscription/index.ts` was deliberately left untouched in this worktree. Its 409 `AMBIGUOUS_ACTIVE_SUBSCRIPTIONS` response is plan 05-04's responsibility (a sibling worktree running concurrently); this plan's client branch was written to defensively match that documented response shape so the two halves compose correctly once merged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected locale file path from translation.json to common.json**
- **Found during:** Task 2 (adding the `cancelAmbiguous` locale key)
- **Issue:** The plan's frontmatter and action block both named `src/locales/en/translation.json` / `src/locales/he/translation.json`, but no such files exist in this codebase — the actual i18n namespace file holding `parentPortal.*` keys (including the existing `cancelError` sibling key the plan pointed at) is `common.json`.
- **Fix:** Located the existing `cancelError` key via grep across `src/locales/`, confirmed it lives in `common.json` for both locales, and added `cancelAmbiguous` immediately after it in both files, exactly as the plan specified positionally.
- **Files modified:** `src/locales/en/common.json`, `src/locales/he/common.json`
- **Verification:** `grep -qF "cancelAmbiguous"` passes for both files; both files parse as valid JSON; full test suite (which includes locale-parity tests) is green.
- **Committed in:** `e1b8bb90` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — corrected file path)
**Impact on plan:** Purely a stale-reference correction; the locale content, wording, and positioning specified by the plan were followed exactly.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. This plan is code + tests only; per the plan's DEPLOY-GATE, this branch must not reach `main`/Netlify production until plan `05-09` Task 1 (migration applied) and Task 3 (Edge Functions deployed) are both complete and `05-apply-log.md` reads `frontend_deploy_gate: RELEASED`.

## Next Phase Readiness

- Client read paths, Realtime invalidation, and the cancel-ambiguity UX are all re-pointed onto `parent_id` and covered by tests; full suite green (2314 passed, 0 failed across 131/132 test files, 1 pre-existing skip), lint clean (0 errors, pre-existing warnings unrelated to this plan's files), build clean.
- DEPLOY-GATE verified holding: `origin/main`'s copy of `subscriptionService.js` does not yet contain `eq("parent_id"` — this branch is safe to keep local until 05-09 releases the gate.
- This plan's code assumes: (a) the `parent_id` column exists on `parent_subscriptions` (plan 05-02), (b) `cancel-subscription`'s Edge Function returns the `AMBIGUOUS_ACTIVE_SUBSCRIPTIONS` 409 shape this plan's client branch checks for (plan 05-04). Neither dependency blocks this plan's own tests (which mock the network layer), but full end-to-end behavior only manifests after all Wave 2 plans merge and 05-09 applies the production migration.

---

_Phase: 05-subscription-re-pointing_
_Completed: 2026-08-06_

## Self-Check: PASSED

All 6 modified files and the SUMMARY.md itself confirmed present on disk; both task commits (`0c90d924`, `e1b8bb90`) confirmed present in `git log`.
