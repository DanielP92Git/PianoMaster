---
phase: 03-parent-only-signup-age-gate
plan: 09
subsystem: auth
tags: [react, auth, oauth, coppa, vitest]

# Dependency graph
requires:
  - phase: 03-parent-only-signup-age-gate (plans 01-08)
    provides: OAuth completion flow (RoleSelection.jsx) with role-first + 18+ DOB gate, insert-gating behind AgeGate.onSubmit
provides:
  - Gap closure for WR-01 (03-VERIFICATION.md): the under-18 OAuth block-screen race is fixed — AgeBlockScreen now renders reliably before any sign-out/redirect
affects:
  [
    03-parent-only-signup-age-gate milestone-close,
    future auth/RoleSelection work,
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Defer session-clearing side effects (logout()) to explicit user dismissal rather than firing them at the moment a blocking UI state is set, when the blocking UI's continued visibility depends on the session/auth state staying intact."

key-files:
  created: []
  modified:
    - src/components/auth/RoleSelection.jsx
    - src/components/auth/RoleSelection.test.jsx

key-decisions:
  - "handleUnder18 became a pure setBlocked(true) (no logout()), mirroring SignupForm's already-reliable email-path pattern, rather than lifting a blockedUnder18 flag into AuthenticatedWrapper (App.jsx) — smaller blast radius, touches only one file."
  - "logout() moved into handleBackToLogin so the SIGNED_OUT->invalidate(['user'])->unmount->redirect chain only fires after the user has read the block-screen guidance."
  - "D-07 (session leaves no trace on shared device) is preserved: logout() still fires via the same wrapper, just deferred to explicit dismissal instead of firing before render. Residual case (user abandons the screen without dismissing) leaves an inert profile-less session — RLS denies it all data, identical in risk to the already-accepted inert auth.users row."

requirements-completed: [SIGNUP-02]

# Metrics
duration: 10min
completed: 2026-08-03
---

# Phase 03 Plan 09: OAuth Under-18 Block-Screen Race Fix (WR-01) Summary

**Deferred `logout()` from `handleUnder18` to `handleBackToLogin` in RoleSelection.jsx so the under-18 AgeBlockScreen renders reliably before any session-loss-triggered redirect.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-08-03T23:00:00+03:00 (approx, first edit)
- **Completed:** 2026-08-03T23:07:37+03:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Closed the single remaining gap (WR-01) from `03-VERIFICATION.md` (status was `gaps_found`, 4.5/5)
- `handleUnder18` is now a pure `setBlocked(true)` state update — no `await logout()` — so the session stays alive and `AuthenticatedWrapper` keeps rendering `RoleSelection`/`AgeBlockScreen` instead of racing them off the page via a `SIGNED_OUT`-triggered `["user"]` query invalidation
- `logout()` moved into `handleBackToLogin`, firing only when the user explicitly dismisses the block screen — after they've read the guidance
- `handleTryAgain` left untouched (already correct: returns to dob-gate with session intact)
- Test suite rewritten to assert the new ordering contract: under-18 submit shows the block screen with no logout/insert; "Back to login" signs out exactly once; "Try a different date" re-enters the DOB gate without signing out; teacher branch mirrors the parent branch
- Updated a stale doc comment on `RoleSelection` describing the old (buggy) sign-out-before-render ordering

## Task Commits

Each task was committed atomically:

1. **Task 1: Defer the under-18 sign-out to explicit dismissal (fix WR-01 race)** - `ba8aca5b` (fix)
2. **Task 2: Update RoleSelection.test.jsx to assert the new call-ordering contract** - `cbf29559` (test)

**Plan metadata:** (this commit, follows)

## Files Created/Modified

- `src/components/auth/RoleSelection.jsx` - `handleUnder18` is now a pure `setBlocked(true)`; `handleBackToLogin` now `await logout()`s; stale doc comment corrected
- `src/components/auth/RoleSelection.test.jsx` - Two old under-18 tests rewritten (no-logout-on-submit assertion), one new "Back to login signs out once" test added, one new "Try a different date doesn't sign out" test added; teacher under-18 test rewritten to match

## Decisions Made

- Chose the deferred-logout approach (verification's recommended fix) over lifting a `blockedUnder18` flag into `AuthenticatedWrapper` in `App.jsx` — smaller, single-file, and exactly mirrors the already-proven-reliable email path in `SignupForm.jsx`.
- D-07 ("no trace on a shared device") is preserved: `logout()` still fires through the same wrapper, just at dismissal instead of pre-render. The narrow residual case — a user who abandons the block screen without clicking "Back to login" — leaves an inert, profile-less session that RLS denies everywhere; this is the same risk profile D-07 already accepts for the auth.users row.

## Deviations from Plan

**1. [Rule 1 - Bug] Comment text tripped the plan's own verification regex**

- **Found during:** Task 1 verification
- **Issue:** The plan's suggested code comment for `handleUnder18` used the phrase `logout()'s SIGNED_OUT` to describe the downstream effect, which contains the literal substring `logout(` — the acceptance-criteria regex (`/logout\(/.test(handleUnder18Body)`) flagged this as a false positive, since it scans the whole function body including comments, not just executable code.
- **Fix:** Reworded the comment to "the resulting `SIGNED_OUT`" — same meaning, no `logout(` substring.
- **Files modified:** `src/components/auth/RoleSelection.jsx`
- **Verification:** Re-ran the exact `node -e` gate from the plan's `<verify>` block — passed.
- **Committed in:** `ba8aca5b` (Task 1 commit)

**2. [Rule 1 - Bug] Stale doc comment describing pre-fix ordering**

- **Found during:** Task 1
- **Issue:** The file-level JSDoc comment on `RoleSelection` stated "An under-18 user is signed out via logout() and shown the block screen" — describing the exact ordering this plan fixes. Left as-is it would misdescribe the new behavior to future readers.
- **Fix:** Updated the comment to describe the new ordering (block screen shown first with session intact, signed out only on "Back to login" dismissal).
- **Files modified:** `src/components/auth/RoleSelection.jsx`
- **Verification:** Read-through; no functional impact (comment only).
- **Committed in:** `ba8aca5b` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1, both within the single file the plan scoped)
**Impact on plan:** No scope creep — both fixes are inside `RoleSelection.jsx`, the plan's sole target file, and neither touches insert-gating or any other logic.

## Issues Encountered

- The plan's acceptance-criteria grep gate `grep -c 'setStep("dob-gate")' src/components/auth/RoleSelection.jsx` expects `1` but returns `2` in both the before and after states — `handleRoleContinue` also calls a step transition containing that substring pattern coincidentally (actually: `setStep("dob-gate")` appears once in `handleRoleContinue` and once in `handleTryAgain`, both pre-existing). This is a pre-existing imprecision in the plan's acceptance criteria, not a regression — `handleTryAgain` itself is verified unchanged by direct read-through and the passing test "'Try a different date' returns to the DOB gate without signing out". No action taken; documented here for the record.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WR-01 gap closed; SIGNUP-02's "sees guidance" clause is now reliably true for the OAuth entry point in the JSDOM-testable layer
- Full suite green: 114 test files passed (1 pre-existing skip), 2186 tests passed, 0 failures
- **Outstanding human checkpoint (carried forward, not resolved by this plan):** Live Google OAuth round-trip as a brand-new account, entering an under-18 DOB at the completion screen — confirms the fix holds in a real browser where the JSDOM test's mocked `logout()`/no-`AuthenticatedWrapper` setup can't fully replicate the `SIGNED_OUT` unmount race. See `03-VERIFICATION.md` human_verification item #1 and this plan's `<verification>` section.
- Deferred out of scope for this gap-closure (per plan's own notes, unchanged): WR-02 (DOB day-of-month bounds), WR-03 (swallowed profile-insert failures in `useSignup.js`), WR-04 (stale "Please select a valid birth year" copy in `AgeGate.jsx`)

## Self-Check: PASSED

- FOUND: src/components/auth/RoleSelection.jsx
- FOUND: src/components/auth/RoleSelection.test.jsx
- FOUND commit ba8aca5b
- FOUND commit cbf29559

---

_Phase: 03-parent-only-signup-age-gate_
_Completed: 2026-08-03_
