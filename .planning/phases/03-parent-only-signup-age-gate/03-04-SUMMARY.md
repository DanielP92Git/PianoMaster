---
phase: 03-parent-only-signup-age-gate
plan: 04
subsystem: auth
tags: [react, vitest, tdd, i18n]

# Dependency graph
requires:
  - phase: 03-parent-only-signup-age-gate
    plan: 01
    provides: ageUtils.js (isValidDOB, dobPartsToDate, isUnder18) + auth.signup.dobGate/ageBlock i18n keys (EN+HE)
provides:
  - "AgeGate: open-field Month/Day/Year DOB gate (onSubmit for 18+, onUnder18 for minors, red error banner for invalid/incomplete)"
  - "AgeBlockScreen: blue-tone, no-op-on-persistence under-18 dead-end with tryAgain/backToLogin ghost actions"
affects:
  [
    "03-parent-only-signup-age-gate (Plan 07 email wizard consumes AgeGate+AgeBlockScreen; Plan 08 OAuth completion consumes both)",
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Open-field M/D/Y date entry (grid-cols-3) replacing native <input type=date> for locale-neutral DOB collection"
    - "Blue informational banner tone (rgba(37,99,235,0.22)) reserved for guidance/dead-end screens, never reused for validation errors"

key-files:
  created:
    - src/components/auth/AgeBlockScreen.jsx
  modified:
    - src/components/auth/AgeGate.jsx
    - src/components/auth/AgeGate.test.jsx

key-decisions:
  - "Test-only deviation from the plan's error-path test sketch: filling only Month and leaving Day/Year empty never reaches the JS handler at all, because AuthInput/AuthSelect render native `required` attributes and jsdom enforces HTML5 form validation on submit. Rewrote the invalid-DOB test to fill all three fields with a date that fails isValidDOB's business-logic check (year 1800, over the 120-year limit) instead of an incomplete one, so the assertion actually exercises the component's own error branch rather than the browser's native validation."

patterns-established: []

requirements-completed: [SIGNUP-01, SIGNUP-02]

# Metrics
duration: 25min
completed: 2026-08-03
---

# Phase 3 Plan 4: Open-Field DOB Gate + Under-18 Block Screen Summary

**Rewrote the year-only `AgeGate` dropdown as a three-field open Month/Day/Year date-of-birth gate wired to Plan 01's `ageUtils`, and added a new `AgeBlockScreen` guidance-toned dead-end for under-18 users that creates, persists, and logs nothing.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-08-03
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `AgeGate.jsx` rewritten: renders Month (`AuthSelect`, 1-12 + placeholder), Day and Year (`AuthInput type="number"`) in a `grid grid-cols-3 gap-3` row, all at the locked 52px control height
- `handleSubmit` routes to exactly one of three outcomes per DOB validity: `onSubmit(dob)` for 18+, `onUnder18()` for under-18 (D-10 — no data forwarded, nothing persisted), or the red error banner for invalid/incomplete input (calls neither callback)
- Continue CTA uses `variant="secondary"` (fuchsia `#c026d3`) per the locked color table, not the primary blue
- No native `<input type="date">` anywhere — open-field entry per the FTC-defensible neutral-gate framing
- `AgeGate.test.jsx` fully rewritten (4 tests): three labelled fields render, an 18+ computed DOB calls `onSubmit` exactly once and never `onUnder18`, a 17-year-old computed DOB calls `onUnder18` exactly once and never `onSubmit`, an invalid DOB (year 1800, exceeds the 120-year sanity limit) shows the error banner and calls neither — ages computed relative to `new Date()` at test run time so they never go stale
- `AgeBlockScreen.jsx` created: blue informational banner (`rgba(37,99,235,0.22)` bg / `rgba(96,165,250,0.35)` border / `#93c5fd` icon) with title+body copy, two `variant="ghost"` actions ("Try a different date" / "Back to login"), zero destructive/red styling
- D-11 verified by grep gate: no `useMutation`, `supabase`, `umami`, `track(`, or `console.*` call anywhere in `AgeBlockScreen.jsx` — the blocked event is not logged or persisted

## Task Commits

1. **Task 1: Rewrite AgeGate.jsx + AgeGate.test.jsx** - `50c56a42` (feat)
2. **Task 2: Create AgeBlockScreen.jsx** - `b03f49cb` (feat)

## Files Created/Modified

- `src/components/auth/AgeGate.jsx` - Replaced the single year `<select>` with three open fields (Month/Day/Year), wired to `isValidDOB`/`dobPartsToDate`/`isUnder18` from `ageUtils`; new `onUnder18` prop and branch
- `src/components/auth/AgeGate.test.jsx` - Fully rewritten: 3-field render assertion, 18+ submit path, under-18 routing path, invalid-DOB error path
- `src/components/auth/AgeBlockScreen.jsx` (new) - Blue-tone guidance dead-end with two ghost actions, no persistence/logging

## Decisions Made

- **Error-path test had to diverge from the plan's literal sketch.** The plan's `<behavior>` block described testing an "invalid/incomplete DOB" by implication of leaving fields blank, but `AuthInput`/`AuthSelect` both render the native `required` attribute, so jsdom's HTML5 form validation blocks the submit event entirely before React's `handleSubmit` ever runs when required fields are empty — no error banner, no callback, but also no code path exercised. Filled all three fields with a value that is syntactically complete but fails `isValidDOB`'s business-logic check (a date more than 120 years in the past) so the test genuinely exercises `AgeGate`'s own validation branch rather than only proving the browser blocks empty required fields.
- **`isUnder18` acceptance-criteria grep count (Rule 1-adjacent note, not a functional change):** the plan's acceptance criteria state `grep -c "isUnder18" src/components/auth/AgeGate.jsx` should return 1, but the plan's own prescribed code (named import `{ ..., isUnder18 }` plus a separate usage call `isUnder18(...)`) inherently produces 2 matching lines — one for the import, one for the call. Implemented exactly per the plan's `<action>` code sample (verbatim import + validation shape); actual grep count is 2. This is a pre-existing inconsistency between the plan's own acceptance criteria and its own prescribed implementation, not a functional gap — `isUnder18` is correctly imported and called exactly once at runtime, and the `must_haves.artifacts` "contains: isUnder18" requirement (a presence check, not a count) is satisfied. Not treated as a Rule 4 architectural question since it doesn't affect correctness, security, or completion.

## Deviations from Plan

### Auto-fixed Issues

None — no bugs, missing functionality, or blocking issues were found; both deviations above are test-methodology and acceptance-criteria-wording adjustments made within the scope of Task 1, not corrections to broken behavior.

## Issues Encountered

None.

## User Setup Required

None — pure client-side component work, no external service configuration.

## Verification

- `npx vitest run src/components/auth/AgeGate.test.jsx` — 4/4 passed
- `npx vitest run src/components/auth/` — 5 files, 31 passed, 5 todo (pre-existing `ParentEmailStep.test.jsx` skips)
- `npm run test:run` (full suite) — 114 files passed, 2 skipped; 2177 tests passed, 12 todo; 0 failures
- All `AgeBlockScreen.jsx` grep gates pass exactly: blue tone (1), no `bg-red-500` (0), two `variant="ghost"` (2), zero logging/persistence calls (0), both i18n key references present (1 each)
- `AgeGate.jsx` grep gates: `grid-cols-3` (1/1 ✓), `variant="secondary"` (1/1 ✓), `type="date"` (0/0 ✓), `isUnder18` (2, plan expected 1 — see Decisions Made)

## Next Phase Readiness

- `AgeGate` and `AgeBlockScreen` are both pure presentational/validation components ready for Plan 07 (email signup wizard) and Plan 08 (OAuth completion screen) to wire into their step machines.
- No blockers for downstream plans consuming these two components.

---

_Phase: 03-parent-only-signup-age-gate_
_Completed: 2026-08-03_

## Self-Check: PASSED

- FOUND: src/components/auth/AgeGate.jsx
- FOUND: src/components/auth/AgeGate.test.jsx
- FOUND: src/components/auth/AgeBlockScreen.jsx
- FOUND: .planning/phases/03-parent-only-signup-age-gate/03-04-SUMMARY.md
- FOUND commit: 50c56a42 (feat)
- FOUND commit: b03f49cb (feat)
