---
phase: 01-signup-flow-redesign
plan: "02"
subsystem: auth
tags: [react, coppa, auth, signup, components]

# Dependency graph
requires:
  - phase: 01-signup-flow-redesign
    provides: "Plan 00 test scaffolding and phase context"
provides:
  - "AgeGate.jsx — birth year only dropdown, calls onSubmit(integer year)"
  - "ParentEmailStep.jsx — optional parent email with Skip button and purpose-driven messaging"
affects:
  - "01-03 — SignupForm wizard rewrite consumes these updated sub-component APIs"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Year-only DOB collection (single integer) instead of full date for COPPA simplification"
    - "Optional progressive disclosure: Skip for now button pattern for non-mandatory parent info"

key-files:
  created: []
  modified:
    - src/components/auth/AgeGate.jsx
    - src/components/auth/ParentEmailStep.jsx

key-decisions:
  - "AgeGate calls onSubmit(parsedYear) with integer — Plan 03 determines under-13 from year alone"
  - "ParentEmailStep email field removes required attribute and confirm field — Step is opt-in"
  - "Three-button row layout (Back | Skip for now | Continue) signals optionality clearly to 8-year-olds"

patterns-established:
  - "Single-field year select pattern: max-w-[200px] mx-auto centered, 100-year range from currentYear"
  - "Info banner purpose copy: what the data is used for, not why it is required"

requirements-completed: [D-06, D-07, D-14]

# Metrics
duration: 3min
completed: "2026-03-23"
---

# Phase 01 Plan 02: Sub-components Simplified Summary

**AgeGate simplified to single year dropdown (onSubmit receives integer year) and ParentEmailStep made optional with Skip button and weekly-reports messaging**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-23T20:31:45Z
- **Completed:** 2026-03-23T20:34:10Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments

- AgeGate.jsx rewritten: single year dropdown, removes month/day/MONTHS/ageUtils imports, calls onSubmit with integer year
- ParentEmailStep.jsx rewritten: single email field (no confirm), onSkip prop + "Skip for now" button, messaging changed to purpose (weekly reports, practice reminders) and explicitly optional
- Both components maintain named + default exports for backward compat with Plan 03 importer

## Task Commits

Each task was committed atomically:

1. **Task 1: Simplify AgeGate.jsx to birth year only dropdown** - `d621a67` (feat)
2. **Task 2: Update ParentEmailStep.jsx — optional with Skip, new messaging** - `d9d0bb4` (feat)

## Files Created/Modified

- `src/components/auth/AgeGate.jsx` — Birth year only dropdown; onSubmit(parsedYear integer); removes ageUtils dependency; 91 lines reduced to 81
- `src/components/auth/ParentEmailStep.jsx` — Optional parent email; onSkip prop; single email field; purpose-driven info banner; 137 lines reduced to 116

## Decisions Made

- AgeGate drops full DOB in favour of year-only: Plan 03 (SignupForm) will derive under-13 status from birth year (current year - birth year < 13)
- ParentEmailStep's email field is no longer `required` — validation still fires if user types something invalid, but empty submit routes to onSkip path (handled by the form submit error message prompting them to skip)
- Three-button layout chosen over toggle/checkbox to make optionality immediately visible to children

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AgeGate API: `onSubmit(year: number)` — ready for Plan 03 SignupForm integration
- ParentEmailStep API: `onSubmit(email: string)`, `onSkip()`, `onBack()` — ready for Plan 03 SignupForm integration
- Both components lint-clean with zero warnings/errors

---
*Phase: 01-signup-flow-redesign*
*Completed: 2026-03-23*
