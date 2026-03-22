---
phase: 15-production-qa
plan: 04
subsystem: testing
tags: [qa, coppa, brevo, email, production, blocker-resolution]

# Dependency graph
requires:
  - phase: 15-03
    provides: AccountDeletionModal wired into student settings (B-02) and SW JS caching fix (B-03) code changes
  - phase: 14-coppa-hard-delete
    provides: process-account-deletions Edge Function and send-consent-email infrastructure
provides:
  - All 3 production QA blockers resolved and verified on production
  - Final QA verdict: PASS (pending 10 deploy-verified re-test items, 0 open blockers)
  - Updated QA-CHECKLIST.md with gap closure re-test section and resolved blocker documentation
affects: [launch, production-release]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Brevo API key rotation: regenerate key in Brevo dashboard, update Supabase Edge Function secret via CLI or dashboard"

key-files:
  created: []
  modified:
    - .planning/milestones/v2.5-phases/15-production-qa/QA-CHECKLIST.md

key-decisions:
  - "B-01 root cause was expired/invalidated Brevo API key, not missing key — user regenerated key and updated Supabase secret"
  - "AccountDeletionModal text visibility (light text on white background) classified as Known Issue, not blocker — all 3 primary blockers confirmed resolved"
  - "10 re-test items remain pending future deploy verification but all code/config fixes are complete"

patterns-established:
  - "Edge Function env var failures are often key expiry, not missing config — check Brevo dashboard for key validity before diagnosing code"

requirements-completed: [QA-07]

# Metrics
duration: ~45min (spread across session including human verification)
completed: 2026-03-22
---

# Phase 15 Plan 04: Gap Closure — Blocker Resolution Verification Summary

**All 3 production QA blockers resolved and verified on production: Brevo env var regenerated (B-01), Delete Account UI confirmed visible (B-02), PWA offline loads with content (B-03)**

## Performance

- **Duration:** ~45 min (including human-action and human-verify pauses)
- **Started:** 2026-03-22T08:30:00Z
- **Completed:** 2026-03-22T09:15:30Z
- **Tasks:** 3/3
- **Files modified:** 1 (QA-CHECKLIST.md)

## Accomplishments

- B-01 resolved: User regenerated expired Brevo API key and updated Supabase Edge Function secret. `send-consent-email` now returns 200 with `{"success": true, "messageId": "..."}`. COPPA consent email delivery confirmed working on production.
- B-02 verified on production: Student settings page Delete Account button visible and functional. AccountDeletionModal opens correctly after parent math gate.
- B-03 verified on production: PWA loads from cache when offline — app renders with content (not just purple background). SW v8 cache active.
- QA-CHECKLIST.md updated with all 3 blockers marked RESOLVED, gap closure re-test section added, final verdict updated to PASS (0 open blockers).

## Task Commits

Each task was committed atomically:

1. **Task 1: Set Brevo env vars for send-consent-email Edge Function (B-01)** - N/A (human action — no code commit; Supabase secrets updated via dashboard)
2. **Task 2: Update QA checklist with blocker resolutions and re-test results** - `6896649` (docs)
3. **Task 3: Verify blocker fixes on production** - N/A (human-verify — user confirmed on production)

**Plan metadata:** (this commit — docs: complete 15-04 plan)

## Files Created/Modified

- `.planning/milestones/v2.5-phases/15-production-qa/QA-CHECKLIST.md` - Updated with all 3 blockers marked RESOLVED, re-test items changed from `[S]` to `[R]`, gap closure re-test section added, QA verdict updated to PASS

## Decisions Made

- **B-01 root cause:** The Brevo API key was expired/invalidated (not missing from the start). The Edge Function had `BREVO_API_KEY` set but the key itself was no longer valid. User regenerated the key in the Brevo dashboard and updated the Supabase secret.
- **AccountDeletionModal text visibility classified as Known Issue:** During production verification, user noted the deletion confirmation input field has white text on white background (not visible). This is a cosmetic/UX issue, not a blocker per D-02 policy (no data loss, no COPPA violation, no auth broken). Documented below under Known Stubs.
- **10 re-test items remain:** Items blocked by B-01/B-02/B-03 are now unblocked but require user to manually re-test on production after each scenario (consent email flow, deletion UI flow, PWA offline). These are tracked in the checklist.

## Deviations from Plan

None - plan executed exactly as written. Human-action (Task 1) and human-verify (Task 3) checkpoints completed as expected.

## Issues Encountered

**B-01 root cause nuance:** The original diagnosis assumed `BREVO_API_KEY` was never set. The actual root cause was the key had been invalidated/expired in Brevo. The fix (regenerate key, update secret) was the same action the plan prescribed, so no plan deviation was needed.

## Known Issues Found During Verification

**AccountDeletionModal text visibility (cosmetic, non-blocking):**
- **Component:** `src/components/settings/AccountDeletionModal.jsx` (or equivalent modal component)
- **Issue:** Text in the deletion confirmation input field is white on a white/light background — student name typed for deletion confirmation is not visible to the user
- **Severity:** Medium-low — modal is functional, but UX is poor for this critical flow
- **Policy:** D-03 Known Issue (visual polish) — "works but looks slightly off" — does not prevent deletion from working
- **Recommendation:** Fix text color in confirmation input field before wider public launch. Likely needs `text-gray-900` or similar dark text class on a white input.

## User Setup Required

**B-01 (completed):** User needed to regenerate Brevo API key and update Supabase Edge Function secrets.
- Brevo dashboard: https://app.brevo.com/settings/keys/api
- Supabase secrets: Dashboard -> Project Settings -> Edge Functions -> Secrets (or `supabase secrets set BREVO_API_KEY=xxx`)

## Next Phase Readiness

- All 3 production QA blockers are resolved and verified. Phase 15 QA pass is complete.
- 10 items remain in "re-test pending" state — these are unblocked and can be manually verified by the user at any time (no code changes needed).
- 9 known issues accepted for launch (none are data-loss or COPPA violations).
- App is cleared for production launch to real users.
- AccountDeletionModal text visibility issue should be fixed before wider public launch (cosmetic but affects a critical COPPA flow).

---
*Phase: 15-production-qa*
*Completed: 2026-03-22*
