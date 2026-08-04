---
phase: 04-child-profiles-parental-gating
plan: 08
subsystem: ui
tags: [react, react-query, vitest, i18n, child-profiles, avatars]

# Dependency graph
requires:
  - phase: 04-child-profiles-parental-gating (Plan 01)
    provides: children.form.* / dataRights.* / switcher.* i18n keys (EN+HE parity)
  - phase: 04-child-profiles-parental-gating (Plan 02)
    provides: apiChildProfiles.js (createChildProfile/renameChildProfile/updateChildAvatar/getChildProfiles/setChildActive)
provides:
  - "src/utils/nicknameHeuristic.js — looksLikeFullName(nickname) conservative pure heuristic"
  - "src/components/children/ChildProfileForm.jsx — reusable create/edit child profile form"
affects:
  [04-09 (Add-first-child switcher flow), 04-10 (Manage Children edit panel)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure utility + co-located Vitest test (mirrors src/utils/isIOSSafari.js pairing)"
    - 'Compact preset-avatar picker reusing the existing ["avatars"] React Query catalog query (apiAvatars.getAvatar) without importing the heavy Avatars.jsx page'
    - "Soft, non-blocking inline validation warning (amber) that never disables submit"

key-files:
  created:
    - src/utils/nicknameHeuristic.js
    - src/utils/nicknameHeuristic.test.js
    - src/components/children/ChildProfileForm.jsx
    - src/components/children/ChildProfileForm.test.jsx
  modified: []

key-decisions:
  - "Submit is gated on nickname-present + avatar-selected (basic form completeness), which is orthogonal to and independent from the full-name warning — the warning itself never adds a disabling condition, satisfying D-14's non-blocking contract."
  - "Avatar tiles get an aria-label from avatar.name plus aria-pressed for selection state, enabling accessible querying in tests and for screen readers, without changing the visual/behavioral contract in the plan."

patterns-established:
  - "Reusable child-profile form pattern (childId prop presence toggles create vs edit mode; onSaved callback owns post-save navigation) — to be reused verbatim by Plan 09 (Add-first-child) and Plan 10 (Manage Children edit panel)."

requirements-completed: [PROFILE-01, PROFILE-02, PROFILE-03]

# Metrics
duration: 25min
completed: 2026-08-04
---

# Phase 04 Plan 08: Reusable Child Create/Edit Form Summary

**Reusable ChildProfileForm component (nickname + preset-avatar-only) with an always-visible privacy helper and a conservative, non-blocking full-name heuristic warning, ready for the switcher's "Add" flow and the Manage Children edit panel.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-08-04T13:09:00Z
- **Tasks:** 2/2 completed
- **Files modified:** 4 (all new)

## Accomplishments

- `looksLikeFullName(nickname)` pure heuristic: flags exactly-two-capitalized-token nicknames as "looks like a full name", while explicitly excluding hyphenated names, 1-token or 3+-token nicknames, and non-cased scripts (Hebrew nicknames never trigger it) — 11 passing test cases covering every documented behavior plus the false-positive guardrails.
- `ChildProfileForm.jsx`: a glass-card create/edit form with nickname input → always-visible helper text → conditional amber non-blocking warning → 56px preset-avatar grid (reusing the existing `["avatars"]` query verbatim) → submit CTA. Create mode calls `createChildProfile`; edit mode (via `childId` prop) calls `renameChildProfile` + `updateChildAvatar`. Zero file-input/upload affordance anywhere in the DOM (PROFILE-02).
- 6 component tests cover: helper always visible, warning shows without disabling submit, avatar tile selection (`aria-pressed`), full create-mode submit call shape, full edit-mode submit call shape (both mutations), and a DOM-wide assertion that no `input[type="file"]` exists.

## Task Commits

Each task was committed atomically:

1. **Task 1: nicknameHeuristic pure utility + test** - `07d3b6b3` (test)
2. **Task 2: ChildProfileForm (nickname + guidance + compact avatar grid) + test** - `55d0af21` (feat)

_Note: pre-commit hook (lint-staged/Prettier with the Tailwind class-order plugin) reformatted class strings and import wrapping on both new component files as part of each commit — no semantic changes, tests re-verified green after formatting._

## Files Created/Modified

- `src/utils/nicknameHeuristic.js` - `looksLikeFullName(nickname)` conservative pure heuristic (D-14)
- `src/utils/nicknameHeuristic.test.js` - 11 test cases (behavior spec + false-positive guardrails + Hebrew non-trigger)
- `src/components/children/ChildProfileForm.jsx` - reusable create/edit child profile form (nickname, helper, warning, avatar grid, submit)
- `src/components/children/ChildProfileForm.test.jsx` - 6 tests covering the full behavior contract

## Decisions Made

- Submit-button enablement is gated on basic form completeness (non-empty nickname + a selected avatar) — this gate is independent of `looksLikeFullName`, so the full-name warning never contributes to disabling submit, matching D-14's "non-blocking by contract" requirement precisely rather than accidentally over-restricting via a combined validity check.
- Added `aria-label`/`aria-pressed` to avatar tiles (not explicitly specified in the plan) for accessibility and reliable test querying — a natural extension of the existing plan requirement ("selected tile → indigo ring; unselected → bg-white/5 border-white/10") rather than a deviation from it.

## Deviations from Plan

None - plan executed exactly as written. The `aria-label`/`aria-pressed` additions above are accessibility/testability refinements within the explicitly-specified avatar-grid behavior, not scope changes.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ChildProfileForm` is ready to be imported and driven by Plan 09 (the "Add your first child" switcher flow, create mode with no `childId`) and Plan 10 (Manage Children per-child edit panel, edit mode with `childId`/`initialNickname`/`initialAvatarId`).
- No blockers. The component's `onSaved(result)` callback contract lets each consumer own its own post-save navigation (e.g. D-15's "auto-switch into the new child and land on their dashboard" for Plan 09, versus a simple panel-close/refresh for Plan 10) without any changes needed to this form.

---

_Phase: 04-child-profiles-parental-gating_
_Completed: 2026-08-04_

## Self-Check: PASSED

- FOUND: src/utils/nicknameHeuristic.js
- FOUND: src/utils/nicknameHeuristic.test.js
- FOUND: src/components/children/ChildProfileForm.jsx
- FOUND: src/components/children/ChildProfileForm.test.jsx
- FOUND: .planning/phases/04-child-profiles-parental-gating/04-08-SUMMARY.md
- FOUND commit: 07d3b6b3 (Task 1)
- FOUND commit: 55d0af21 (Task 2)
