---
phase: 04-child-profiles-parental-gating
plan: 09
subsystem: ui
tags: [react, react-router, tanstack-query, i18n, coppa]

# Dependency graph
requires:
  - phase: 04-child-profiles-parental-gating (Plan 02)
    provides: ActiveChildContext (activeChildId, ownedChildren, switchChild) — clear-then-set cache/localStorage/singleton purge
  - phase: 04-child-profiles-parental-gating (Plan 01)
    provides: switcher.* / common.errorRetryAskParent i18n keys (EN+HE)
  - phase: 04-child-profiles-parental-gating (Plan 05)
    provides: parental-gate pattern (ParentGateMath scrim/card shell reused for shell only, not gate logic)
  - phase: 04-child-profiles-parental-gating (Plan 08)
    provides: child_profiles CRUD service (apiChildProfiles.js) whose rows feed ownedChildren
provides:
  - WhoIsPlayingOverlay.jsx — ungated sibling switcher overlay + Add tile + empty state
  - Header.jsx avatar entry point repointed to open the switcher instead of Link to="/avatars"
affects:
  [
    04-10 (ManageChildrenScreen/manage-children route — the Add tile's navigation target),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ungated-by-design component: no ParentGateMath import anywhere in WhoIsPlayingOverlay.jsx (D-07); only the Add tile crosses into gated territory by navigating to a route wrapped in ParentGateProtectedRoute"
    - "Active-entity avatar resolution: avatar_id -> avatars table row -> getAvatarImageSource(), same two-hop lookup used by ChildProfileForm.jsx's avatar picker"

key-files:
  created:
    - src/components/switcher/WhoIsPlayingOverlay.jsx
    - src/components/switcher/WhoIsPlayingOverlay.test.jsx
  modified:
    - src/components/layout/Header.jsx

key-decisions:
  - "Header avatar now resolves from the ACTIVE child (ActiveChildContext + avatars query) with a fallback to the parent's own profile avatar when no active child is set yet — keeps the header working during the zero-child / not-yet-chosen window instead of going blank."
  - "Used t('common.errorRetryAskParent') (verified against the actual locale JSON structure), not the plan's literal t('errorRetryAskParent') — the key is nested under a top-level 'common' object inside common.json, confirmed also by 04-UI-SPEC.md's own i18n key reference and ChildProfileForm.jsx's existing usage."

patterns-established:
  - "Pattern: overlay components that must stay ungated should not import the gate component at all (grep-verifiable), and should route the one legitimately-gated action to a URL guarded by a route wrapper rather than gating inline."

requirements-completed: [PROFILE-04]

# Metrics
duration: 20min
completed: 2026-08-04
---

# Phase 04 Plan 09: Who's Playing? Switcher Summary

**Ungated "Who's playing?" sibling-switcher overlay wired to the header avatar — one tap switches active child via `ActiveChildContext.switchChild`, zero-child parents see an empty-state Add CTA, and only "Add" crosses into the parental gate via `/manage-children?add=1`.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-08-04
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `WhoIsPlayingOverlay.jsx` renders one 72px tile per active (non-paused) sibling + a dashed "Add" tile, with the currently-active child's tile ringed in indigo; zero-child parents see an empty-state heading/body instead of tiles
- Tapping a sibling tile calls `switchChild(childId)` then closes the overlay — no gate rendered anywhere in the component (grep-verified `ParentGateMath` count = 0)
- Tapping "Add" navigates to `/manage-children?add=1` (the gate is enforced by that route's `ParentGateProtectedRoute` wrapper in Plan 10, not here)
- `Header.jsx`'s avatar entry point changed from `<Link to="/avatars">` to a `<button>` that opens the overlay, with an accessible label (active child's nickname, falling back to `t("switcher.title")`); the 48px avatar's sizing/styling classes are untouched
- The header avatar image itself now sources from the ACTIVE child (via `ActiveChildContext` + an `avatars` lookup), not the logged-in parent, falling back to the parent's profile avatar only when no active child is set

## Task Commits

Each task was committed atomically:

1. **Task 1: WhoIsPlayingOverlay (siblings + Add + empty state) + test** — TDD (RED then GREEN):
   - `ea5b000a` (test) — 6 failing tests against a not-yet-existing module
   - `4e9a387b` (feat) — implementation; all 6 tests green
2. **Task 2: Repoint Header avatar to open the overlay** - `8a7a7c41` (feat)

_TDD task produced 2 commits (test → feat); no refactor commit needed._

## Files Created/Modified

- `src/components/switcher/WhoIsPlayingOverlay.jsx` - ungated sibling switcher overlay (siblings grid + Add tile + empty state)
- `src/components/switcher/WhoIsPlayingOverlay.test.jsx` - 6 tests: closed-state no-render, tile rendering + no-gate assertion, paused-child filtering, sibling-tap switch+close, empty state, Add-tap navigation+close
- `src/components/layout/Header.jsx` - avatar entry point repointed from `Link to="/avatars"` to a button opening `WhoIsPlayingOverlay`; avatar image source now resolves from the active child

## Decisions Made

- **Error-copy key correction:** the plan's interfaces section says `t("errorRetryAskParent")`, but the actual locale file nests this key under a top-level `common` object inside `common.json` (confirmed by both the JSON structure and 04-UI-SPEC.md's own reference table, and by the existing precedent in `ChildProfileForm.jsx`). Used `t("common.errorRetryAskParent")` to match reality.
- **Header avatar fallback:** rather than rendering nothing when `activeChildId` is null (e.g., the brief window before a first child is chosen, or a parent with zero children), the header falls back to the parent's own profile avatar (the prior behavior) so the header never goes blank. This is a minimal, additive change — the active child still takes priority whenever one is set.
- **Avatars fetched via the same `["avatars"]` React Query key** already used by `ChildProfileForm.jsx`, so both components share one cached fetch of the `avatars` table (no duplicate network calls once both are mounted in the same session).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the i18n key path for the switch-failure toast**

- **Found during:** Task 1 (WhoIsPlayingOverlay implementation)
- **Issue:** The plan's interfaces section specifies `t("errorRetryAskParent")`, but that key does not exist at the top level of `common.json` — it is nested under `common.errorRetryAskParent`. Using the plan's literal string would have rendered the raw i18next key instead of the translated copy.
- **Fix:** Used `t("common.errorRetryAskParent")`, matching the actual locale structure, `ChildProfileForm.jsx`'s existing usage, and 04-UI-SPEC.md's own key reference table (row: "Error state (switch/save/network failure)").
- **Files modified:** `src/components/switcher/WhoIsPlayingOverlay.jsx`
- **Verification:** Confirmed via `grep` against `src/locales/en/common.json` / `src/locales/he/common.json` structure.
- **Committed in:** `4e9a387b` (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix — i18n key path correction)
**Impact on plan:** Necessary for correctness (the error toast would otherwise show a raw i18next key to an 8-year-old). No scope creep.

## Issues Encountered

None. The `/manage-children` route referenced by the Add tile's `navigate()` call does not exist yet in this worktree (it ships in the parallel Plan 10, same wave) — this is expected per the plan's explicit sequencing note ("Plan 10's gated route hosts the create form") and does not affect this plan's own tests or acceptance criteria, which only assert the `navigate()` call target.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `WhoIsPlayingOverlay` is fully wired into `Header.jsx` and ready to use as soon as Plan 10 lands the `/manage-children?add=1` route (same wave, parallel worktree) — no further integration work needed on this plan's side.
- No blockers. `ActiveChildContext`, the `switcher.*`/`common.errorRetryAskParent` i18n keys, and `apiChildProfiles`/`apiAvatars` were all already merged dependencies and required no changes here.

---

## Self-Check: PASSED

- FOUND: `src/components/switcher/WhoIsPlayingOverlay.jsx`
- FOUND: `src/components/switcher/WhoIsPlayingOverlay.test.jsx`
- FOUND: `src/components/layout/Header.jsx`
- FOUND: commit `ea5b000a` (test)
- FOUND: commit `4e9a387b` (feat)
- FOUND: commit `8a7a7c41` (feat)

---

_Phase: 04-child-profiles-parental-gating_
_Completed: 2026-08-04_
