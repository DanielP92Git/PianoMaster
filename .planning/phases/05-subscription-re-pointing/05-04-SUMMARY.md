---
phase: 05-subscription-re-pointing
plan: 04
subsystem: payments
tags: [supabase-edge-functions, lemon-squeezy, deno, vitest, cancel-subscription, create-checkout, coppa-deletion]

# Dependency graph
requires:
  - phase: 05-subscription-re-pointing
    provides: "05-01 discovery facts (sentry_in_edge_functions:no, live parent_subscriptions schema, SC-2 9-row correction)"
provides:
  - "cancel-subscription Edge Function operating on parent_id with a correct D-06 three-branch (0/1/>1 active) decision instead of the .maybeSingle()-throws bug"
  - "A pure, unit-testable selectActiveSubscription.ts lib module (isQualifyingSubscription + selectActiveSubscription) mirroring has_active_subscription()'s SQL predicate"
  - "create-checkout embedding both parent_id and legacy student_id in checkout_data.custom (D-02)"
  - "process-account-deletions dual-column (.or) subscription lookup so LS cancellation still fires once the webhook stops writing student_id (D-14), closing the orphan-billing regression"
affects: ["05-05", "05-08", "05-09", "phase-8-legacy-cleanup"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Injectable pure-lib module convention for Deno Edge Function business logic (supabase: any client param, no client construction, JSDoc, plain-value returns for expected branches) — extended from lemon-squeezy-webhook/lib/ to cancel-subscription/lib/"
    - "Cross-runtime Vitest import seam: a zero-Deno-import .ts lib under supabase/functions/ imported directly into a Vitest test under src/services/__tests__/"

key-files:
  created:
    - supabase/functions/cancel-subscription/lib/selectActiveSubscription.ts
    - src/services/__tests__/cancelSubscriptionLogic.test.js
  modified:
    - supabase/functions/cancel-subscription/index.ts
    - supabase/functions/create-checkout/index.ts
    - supabase/functions/process-account-deletions/index.ts

key-decisions:
  - "Reworded the plan's own suggested inline comment (which literally contained the string \".maybeSingle()\") to avoid tripping the plan's own verify grep that forbids that literal string surviving in cancel-subscription/index.ts — meaning preserved, wording changed"
  - "process-account-deletions' LS-cancel failure path uses an lsCancelFailed flag + break/continue rather than a bare continue inside the new per-subscription for-loop, so an LS DELETE failure aborts the WHOLE account (skips STEP 2 delete, increments failed, retries next cron run) rather than only skipping to the next subscription row — required to preserve the plan's exact existing failure semantics now that cancellation is a loop instead of a single if-branch"

patterns-established:
  - "D-06 ambiguity response shape: HTTP 409 with { error, code: 'AMBIGUOUS_ACTIVE_SUBSCRIPTIONS', count }, paired with a CANCEL_AMBIGUOUS: console.error alert (locked-in fallback per 05-discovery.md §4, since Sentry is not available inside Edge Functions)"

requirements-completed: [MIGRATE-04]

# Metrics
duration: 14min
completed: 2026-08-06
---

# Phase 5 Plan 04: Cancel-Subscription & Checkout Re-Pointing Summary

**cancel-subscription's `.maybeSingle()` multi-row throw bug replaced with a pure, unit-tested D-06 three-branch (0/1/>1-active) decision on `parent_id`; create-checkout now embeds both `parent_id` and legacy `student_id`; account deletion's LS cancellation now matches on either ownership column so it survives the webhook's D-14 cutover to parent-only writes.**

## Performance

- **Duration:** ~14 min (10:41–10:55 UTC+3, plus one full `npm run test:run` background wait)
- **Started:** 2026-08-06T10:41:00+03:00
- **Completed:** 2026-08-06T10:55:00+03:00
- **Tasks:** 3/3 completed
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- Extracted cancel-subscription's select→classify→decide logic into a pure, injectable-client lib module with full 15-case branch coverage (no live DB or Deno environment needed)
- Fixed the real production bug D-06 targets: `.maybeSingle()` used to **throw** outright the moment a parent had more than one `parent_subscriptions` row, blocking cancellation entirely; now it classifies deliberately and refuses loudly (409 `AMBIGUOUS_ACTIVE_SUBSCRIPTIONS` + `CANCEL_AMBIGUOUS:` alert) rather than either crashing or picking arbitrarily
- Re-pointed `cancel-subscription/index.ts` from `student_id` to `parent_id` end-to-end (query filter, variable naming, logging, header comments)
- `create-checkout` now writes both `parent_id` and `student_id` into `checkout_data.custom` (D-02) so an in-flight checkout survives the deploy under either the pre- or post-deploy webhook code path — the existing `user.id !== studentId` IDOR check (T-5-04) is untouched
- Closed the account-deletion orphan-billing regression: `process-account-deletions` now looks up subscriptions via `.or(parent_id.eq.X, student_id.eq.X)` instead of a single-column `.maybeSingle()`, so once the webhook stops writing `student_id` (D-14 lands in plan 05-03), deletion still cancels real Lemon Squeezy billing before removing the account

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract cancel-subscription's select→classify→decide logic into a pure lib module** - `74ad5b5c` (feat)
2. **Task 2: Rewire cancel-subscription/index.ts onto parent_id with the D-06 ambiguity branch** - `facf4cae` (feat)
3. **Task 3: create-checkout dual custom keys (D-02) + close the account-deletion orphan-billing regression** - `f215e9a9` (feat)

_Note: All three commits went through the repo's mandatory Husky/lint-staged pre-commit hook (ESLint + Prettier), which was NOT bypassed. `create-checkout/index.ts` had not previously been touched by Prettier under this repo's `singleQuote: false` config, so its first touch produced a larger cosmetic diff (quote-style + line-wrap normalization) alongside the functional change — the functional edit itself was verified as 8 insertions/1 deletion at edit time, satisfying the plan's "<20 changed lines" acceptance criterion before the hook ran._

## Files Created/Modified

- `supabase/functions/cancel-subscription/lib/selectActiveSubscription.ts` - New pure lib: `isQualifyingSubscription()` (mirrors `has_active_subscription()` SQL predicate exactly) and `selectActiveSubscription()` (D-06 zero/one/ambiguous decision, filters on `parent_id`, no `.maybeSingle()`)
- `src/services/__tests__/cancelSubscriptionLogic.test.js` - 15 test cases (Tests 1–8 predicate branches, Tests 9–15 selection outcomes) via the cross-runtime import seam
- `supabase/functions/cancel-subscription/index.ts` - `studentId` → `parentId` rename; `.maybeSingle()` fetch replaced with `selectActiveSubscription()` call + 4-way branch (db_error/none/missing_ls_id/ambiguous) before the existing LS DELETE call, which is otherwise byte-identical
- `supabase/functions/create-checkout/index.ts` - `checkout_data.custom` now carries both `parent_id: studentId` and `student_id: studentId`
- `supabase/functions/process-account-deletions/index.ts` - Dual-column `.or()` subscription lookup, loop over all cancellable rows, `lsCancelFailed` flag to correctly abort the whole account (not just the inner loop) on any LS DELETE failure; updated CASCADE comment for the new `parent_id` FK path

## Decisions Made

- Reworded a plan-supplied inline comment to remove a literal `.maybeSingle()` substring that would have failed the plan's own forbidding grep check — see key-decisions above (Rule 1: the plan's own action text and its own verify script contradicted each other; fixed by rewording without changing intent).
- Restructured the account-deletion LS-cancel loop with an explicit `lsCancelFailed` flag rather than a bare `continue` inside the new per-subscription `for` loop, to preserve the plan's mandated "any non-ok LS response aborts the whole account, not just that one row" semantics once cancellation became a loop over potentially multiple rows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's own suggested comment text violated the plan's own verify script**
- **Found during:** Task 2
- **Issue:** The plan's `<action>` block instructed inserting the comment `"A parent can legitimately hold multiple rows; .maybeSingle() used to throw on that, blocking cancellation entirely."` verbatim, but the same task's `<verify>` script runs `grep -qF ".maybeSingle()" "$F" && { echo "FORBIDDEN: maybeSingle survives"; exit 1; }` against the whole file — which would match that literal substring inside the comment and fail the verification.
- **Fix:** Reworded the comment to `"the old single-row-only query used to throw on that, blocking cancellation entirely"` — same meaning, no literal `.maybeSingle()` string.
- **Files modified:** `supabase/functions/cancel-subscription/index.ts`
- **Verification:** Task 2's full verify script (5 required substrings present, `.maybeSingle()` absent, `student_id` filter absent, ambiguity branch precedes the LS DELETE call) passes.
- **Committed in:** `facf4cae` (Task 2 commit)

**2. [Rule 1 - Bug] Bare `continue` inside a new inner loop would only skip to the next subscription row, not abort the account**
- **Found during:** Task 3, Part B (process-account-deletions)
- **Issue:** The plan's action text specified converting the old single-`if`-branch LS cancellation into a `for (const sub of cancellable) { ... }` loop, but literally reused the old code's `continue; }` statement inside that new loop. Since the surrounding code is now a nested loop (inner `for (const sub ...)` inside the outer per-account `for (const account ...)`), a bare `continue` inside the inner loop only moves to the next subscription row — it does NOT skip STEP 2 (student DELETE) and abort processing of the current account, which is what the plan's stated failure semantics require ("any non-ok LS response ... skips deletion ... is correct").
- **Fix:** Added an `lsCancelFailed` boolean, set + `break` out of the inner loop on LS failure, then `if (lsCancelFailed) { failed++; continue; }` immediately after the inner loop — this `continue` now correctly targets the outer per-account loop, matching the pre-existing (and still-required) behavior.
- **Files modified:** `supabase/functions/process-account-deletions/index.ts`
- **Verification:** Manual trace of control flow confirmed the `continue` after the flag check is not nested inside any loop other than the outer account loop; full test suite green (2318/2318 passed, no failures).
- **Committed in:** `f215e9a9` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs in the plan's own literal instructions, not in the pre-existing codebase)
**Impact on plan:** Both fixes were necessary for the plan's own verification to pass and for the specified failure semantics to actually hold. No scope creep — both are one-line/one-flag corrections confined to the exact code the plan already specified touching.

## Issues Encountered

None beyond the two deviations documented above.

## User Setup Required

None - no external service configuration required. No deploy occurred; this plan is code + tests only, per the plan's explicit scope boundary ("does NOT touch any live database or deploy anything").

## Next Phase Readiness

- Both JWT-gated Edge Functions (`cancel-subscription`, `create-checkout`) and `process-account-deletions` are ready to deploy alongside plan 05-02's `parent_id` column/backfill and plan 05-03's webhook `parent_id`-only write — this plan's changes are inert until `parent_subscriptions.parent_id` exists and is populated (plan 05-02) and are additive/backward-compatible in the meantime (still reads correctly if `parent_id` were absent, since `05-02` runs in a sibling worktree and lands independently).
- `selectActiveSubscription.ts` establishes the reusable "injectable client + pure decision function" pattern that plan 05-05 (or later phases) can follow for any other Edge Function logic that needs unit coverage without a live DB.
- Full test suite green throughout (2318 tests / 132 files passed, 1 pre-existing skip, 0 failures); `npm run lint` clean (0 errors, 121 pre-existing warnings unrelated to this plan's files).
- No blockers for the next wave.

---
*Phase: 05-subscription-re-pointing*
*Completed: 2026-08-06*

## Self-Check: PASSED

All 6 claimed artifacts verified present on disk (2 created lib/test files, 3 modified Edge Function
files, 1 SUMMARY.md); all 3 task commit hashes (`74ad5b5c`, `facf4cae`, `f215e9a9`) verified present in
`git log --oneline --all`.
