---
phase: 05-subscription-re-pointing
plan: 03
subsystem: payments
tags: [supabase-edge-functions, deno, lemon-squeezy, webhooks, vitest]

# Dependency graph
requires:
  - phase: 05-subscription-re-pointing (plan 05-01)
    provides: "confirmed live parent_subscriptions schema (no parent_id column yet), locked alerting fallback contract (WEBHOOK_UNRESOLVED: prefix, sentry_in_edge_functions:no)"
provides:
  - "resolveParent.ts: D-01 resolve-chain (parents.id probe, then child_profiles.id -> parent_id safety net)"
  - "deadLetter.ts: recordUnresolvedWebhook (D-03) — durable audit row + greppable alert, never throws"
  - "extractPayload.ts whitelist extended to 9 fields with parent_id (D-02)"
  - "upsertSubscription.ts re-pointed to write parent_id only, not dual-writing student_id (D-14)"
  - "index.ts rewired: resolve-chain replaces the old silent missing-student_id guard"
affects: [05-04, 05-08, 05-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Injectable pure-function lib/ modules for Deno Edge Functions (take a client, never construct one) — directly unit-testable in Vitest with zero Deno environment"
    - "Local mock Supabase client factory per test file (chain-satisfying .from().select().eq().maybeSingle() / .from().insert()/.upsert()) instead of a shared mock library"

key-files:
  created:
    - supabase/functions/lemon-squeezy-webhook/lib/resolveParent.ts
    - supabase/functions/lemon-squeezy-webhook/lib/deadLetter.ts
  modified:
    - supabase/functions/lemon-squeezy-webhook/lib/extractPayload.ts
    - supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts
    - supabase/functions/lemon-squeezy-webhook/index.ts
    - src/services/__tests__/webhookLogic.test.js

key-decisions:
  - "Followed the plan's Pattern 1/Pattern 2 implementations verbatim (resolveParent.ts, deadLetter.ts) — no deviation from the RESEARCH-derived shape."
  - "Reworded one deadLetter.ts comment from 'never thrown' to 'never raises an exception' to avoid a literal grep-for-throw false positive against the word 'thrown' inside a comment (acceptance criterion: deadLetter.ts contains no throw statement)."

patterns-established:
  - "D-01 resolve-chain pattern: try authoritative table first, fall back to a legacy/compat join, treat any miss (including a lookup error) as unresolved rather than throwing — the safe failure mode on a billing path is a durable dead-letter row, not a thrown exception."

requirements-completed: [MIGRATE-04]

# Metrics
duration: 15min
completed: 2026-08-06
---

# Phase 5 Plan 03: Webhook Re-Pointing onto Parent Identity Summary

**Lemon Squeezy webhook now resolves `custom_data` to an authoritative `parent_id` via a two-probe resolve-chain (parents, then child_profiles), writes `parent_id`-only to `parent_subscriptions`, and turns its previous silent "missing student_id -> 200 -> nothing written" failure mode into a durable `unresolved_webhook_log` row plus a greppable `WEBHOOK_UNRESOLVED:` alert.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-06T10:40:00Z (approx, first test run)
- **Completed:** 2026-08-06T10:53:24Z
- **Tasks:** 3/3
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- `resolveParent.ts` created as a fourth pure, injectable `lib/` sibling implementing the D-01 resolve-chain — probes `parents.id` first (all live subscriptions expected to hit this via Phase 1's UUID reuse), falls back to `child_profiles.id -> parent_id` as the compatibility shim for legacy/unexpected payload shapes, and treats a transient lookup error or a parent-less child (`parent_id IS NULL`, the 5 teacher-owned profiles) as unresolved rather than throwing.
- `deadLetter.ts` created implementing D-03: `recordUnresolvedWebhook` persists the full raw payload to `unresolved_webhook_log`, fires the locked `WEBHOOK_UNRESOLVED:` alert (never logging the raw payload itself, which can carry a real parent's email), and swallows an insert failure so the audit write can never change the caller's HTTP response.
- `extractPayload.ts` whitelist extended from 8 to 9 fields with `parent_id` (D-02) — `create-checkout`'s future dual-embed of `parent_id` + legacy `student_id` both resolve correctly, with `parent_id` preferred.
- `upsertSubscription.ts` re-pointed: signature now threads a resolved `parentId` param, the upsert writes `parent_id` only and does not dual-write `student_id` (D-14, prevents drift the moment a parent has a second child).
- `index.ts` rewired: the service-role client creation moved ahead of the resolve step (still strictly after HMAC verification and JSON parse, satisfying threat T-5-01's ordering requirement); the old silent `if (!payload.student_id)` guard is fully removed and replaced by the resolve-chain + dead-letter branch; a post-resolution upsert DB failure deliberately stays on the existing 500-and-LS-retry path and is NOT dead-lettered (RESEARCH Q3, kept the two failure modes separate).
- 18 new Vitest cases added (11 for Task 1, 7 for Task 2) — full webhook logic suite now 42/42 passing, full project suite 2320/2320 passing (131 files, 1 skipped/unrelated, 4 todo), zero regressions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create resolveParent.ts and deadLetter.ts with full unit coverage** - `fa6ae976` (feat)
2. **Task 2: Add parent_id to the payload whitelist and re-point the upsert onto parent_id** - `5a684b86` (feat)
3. **Task 3: Rewire index.ts — resolve-chain replaces the silent missing-student_id guard** - `ad7f6016` (feat)

_No TDD RED/GREEN commit split was used — tests and implementation were authored together per task and verified green before commit, consistent with this plan's `tdd="true"` tag on Tasks 1-2 being satisfied by test-and-implementation co-delivery with a passing verification gate, not a separate failing-test commit._

## Files Created/Modified

- `supabase/functions/lemon-squeezy-webhook/lib/resolveParent.ts` - D-01 resolve-chain, pure/injectable, zero imports
- `supabase/functions/lemon-squeezy-webhook/lib/deadLetter.ts` - D-03 dead-letter write + `WEBHOOK_UNRESOLVED:` alert, never throws
- `supabase/functions/lemon-squeezy-webhook/lib/extractPayload.ts` - whitelist gains `parent_id` (9 fields)
- `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` - writes `parent_id` only (D-14), signature takes resolved `parentId`
- `supabase/functions/lemon-squeezy-webhook/index.ts` - resolve-chain replaces the old silent guard; client creation reordered
- `src/services/__tests__/webhookLogic.test.js` - 18 new cases across `resolveParent`, `recordUnresolvedWebhook`, `extractPayload` (parent_id), `upsertSubscription`

## Decisions Made

- Followed the plan's `<action>` blocks verbatim for `resolveParent.ts` and `deadLetter.ts` (copied from RESEARCH §Pattern 1/2) — no implementation deviation.
- Reworded a `deadLetter.ts` doc comment ("never thrown" → "never raises an exception") purely to avoid a literal substring collision with the acceptance criterion's `grep -c "throw"` check against the word "thrown" inside a comment. No behavioral change.

## Deviations from Plan

None - plan executed exactly as written. The one comment reword above is a wording adjustment to satisfy a grep-based acceptance criterion literally, not a functional deviation.

## Issues Encountered

None. All three tasks' automated verification (`npx vitest run`, the Task 3 bash ordering/grep script, `npm run lint`, `npm run test:run`) passed on first attempt.

## User Setup Required

None - no external service configuration required. No database or external service was touched; this plan is code + tests only.

## Next Phase Readiness

- The webhook's code half of SC-3 is complete: a legacy `student_id`-shaped payload resolves via the `child_profiles` hop with zero Lemon Squeezy-side changes, and any unresolvable id (including a parent-less child profile or a missing id) lands in `unresolved_webhook_log` with an alert and HTTP 200.
- `unresolved_webhook_log` table itself is NOT created by this plan — it is plan 05-02's responsibility (sibling wave, running in parallel). This plan's code assumes that table's documented shape (`id, received_at, event_name, ls_subscription_id, attempted_id, raw_payload JSONB NOT NULL, resolved BOOLEAN`) exists before any real webhook traffic hits the unresolved branch.
- `parent_id` column on `parent_subscriptions` also does not exist in production yet (confirmed via 05-discovery.md) — also plan 05-02's responsibility. This plan's `upsertSubscription.ts` writes `parent_id` unconditionally, so this code must not be deployed ahead of plan 05-02's migration.
- No database or external service was touched by this plan — purely code + tests, ready for the D-10 sandbox verification step (HMAC-signed synthetic webhook replays, later plan) to exercise it end-to-end.
- Ready for plan 05-04 (cancel-subscription D-06 ambiguity handling) and downstream sandbox/replay verification plans.

---

_Phase: 05-subscription-re-pointing_
_Completed: 2026-08-06_

## Self-Check: PASSED

All 7 claimed files found on disk (resolveParent.ts, deadLetter.ts, extractPayload.ts,
upsertSubscription.ts, index.ts, webhookLogic.test.js, this SUMMARY.md). All 3 claimed commit
hashes (`fa6ae976`, `5a684b86`, `ad7f6016`) found in `git log --oneline --all`.
