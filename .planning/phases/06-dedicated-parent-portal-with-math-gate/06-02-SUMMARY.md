---
phase: 06-dedicated-parent-portal-with-math-gate
plan: 02
subsystem: ui
tags: [react, i18n, react-query, parent-portal, glassmorphism]

# Dependency graph
requires:
  - phase: 06-dedicated-parent-portal-with-math-gate/06-01
    provides: "Navigation config, ParentZoneEntryCard, AppLayout title, i18n keys"
provides:
  - "ParentPortalPage refactored with gate-first architecture and 4 content sections"
  - "QuickStatsGrid component: 2x2 glass stat cards for Level, Stars, Nodes, Streak"
  - "Math gate (ParentGateMath) renders on every /parent-portal visit"
  - "Quick Stats, Practice Heatmap, Subscription Management, Parent Settings sections"
affects:
  - "06-03-plan (AppSettings integration of ParentZoneEntryCard)"
  - "06-04-plan (DailyChallengeCard and TrailNodeModal subscription checks)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gate-first portal pattern: conditional render with gateOpen state, gate always first"
    - "Props-driven stats component: data fetched in parent page, passed as props to QuickStatsGrid"
    - "Deferred queries: enabled: !!user?.id && !gateOpen prevents fetching until gate is passed"

key-files:
  created:
    - src/components/parent/QuickStatsGrid.jsx
    - .planning/phases/06-dedicated-parent-portal-with-math-gate/06-02-SUMMARY.md
  modified:
    - src/pages/ParentPortalPage.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Gate state initialized to true (open) on every page mount — no persistent consent per session, parent must re-verify each visit per D-04"
  - "Quick Stats queries gated by !gateOpen to prevent data fetching before gate is passed — reduces unnecessary API calls"
  - "Weekend pass toggle has no individual ParentGateMath gate per D-13 (portal gate covers the entire page)"
  - "BackButton uses navigate(-1) default instead of hardcoded /settings — handles both desktop (sidebar) and mobile (settings) entry points"
  - "Subscription management loading spinner scoped to Section 3 only — removed top-level loading guard that would block gate from rendering"
  - "i18n keys for this plan added inline since Plan 01 runs in parallel on a different worktree branch"

patterns-established:
  - "Gate-first portal: useState(true) for gateOpen, ParentGateMath always renders first in JSX, content only when !gateOpen"
  - "Deferred React Query: enabled: !!user?.id && !gateOpen — skip fetching until parent has verified identity"
  - "Pure stat card components: data passed as props from page-level queries, not fetched internally"

requirements-completed: [D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-13, REQ-03, REQ-04, REQ-05, REQ-06]

# Metrics
duration: 15min
completed: 2026-03-25
---

# Phase 06 Plan 02: Dedicated Parent Portal Gate-First Refactor Summary

**Gate-first ParentPortalPage with math gate on every visit, QuickStatsGrid 2x2 glass stats, and 4-section scrollable layout (Quick Stats, Practice Heatmap, Subscription Management, Parent Settings)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-25T19:00:00Z
- **Completed:** 2026-03-25T19:03:47Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created QuickStatsGrid component: pure 2x2 glass card grid with loading skeletons and em-dash fallbacks
- Refactored ParentPortalPage from subscription-only to gate-first portal with 4 content sections
- Math gate (ParentGateMath) renders on every visit before any portal content
- Quick Stats data queries deferred until gate is passed (enabled: !gateOpen)
- Weekend pass toggle integrated directly in Parent Settings section, no sub-gate (D-13)
- NotificationPermissionCard preserved with its own internal gate intact

## Task Commits

Each task was committed atomically:

1. **Task 1: Create QuickStatsGrid component** - `0bd6c67` (feat)
2. **Task 2: Refactor ParentPortalPage into gate-first portal shell** - `ec8a7b3` (feat)

## Files Created/Modified
- `src/components/parent/QuickStatsGrid.jsx` - New 2x2 glass stat card grid component (Level, Stars, Nodes, Streak)
- `src/pages/ParentPortalPage.jsx` - Gate-first portal shell with 4 sections
- `src/locales/en/common.json` - Added Plan 01 i18n keys (parentZoneTitle, quickStatsHeading, etc.)
- `src/locales/he/common.json` - Added matching Hebrew translations

## Decisions Made
- Gate state initialized to `true` on every page mount — parent must verify each visit
- Quick Stats queries use `enabled: !gateOpen` to defer fetching until gate is passed
- Weekend pass toggle needs no sub-gate per D-13; the page-level gate covers it
- BackButton uses `navigate(-1)` default (no `to` prop) for both desktop/mobile entry points
- Top-level loading spinner removed so gate renders immediately without waiting for subscription data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing i18n keys from Plan 01**
- **Found during:** Task 2 (Refactor ParentPortalPage)
- **Issue:** Plan 01 creates i18n keys (parentZoneTitle, quickStatsHeading, parentSettingsHeading, statLevel, statStars, statNodes, statStreak, noSubscriptionHeading, noSubscriptionBody) in en/common.json and he/common.json. Plan 01 runs in parallel on a separate worktree branch. The current worktree did not have these keys, which would cause runtime errors when the refactored ParentPortalPage uses `t('parentPortal.parentZoneTitle')` etc.
- **Fix:** Added all 9 new i18n keys to both en/common.json and he/common.json in this worktree. Keys match exactly what Plan 01 specifies.
- **Files modified:** src/locales/en/common.json, src/locales/he/common.json
- **Verification:** Grep confirms all keys present in both locale files
- **Committed in:** ec8a7b3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for correct runtime behavior. The i18n keys will be a merge conflict when Plan 01 is merged, but both sets of keys are identical so merge should be trivial. No scope creep.

## Issues Encountered
- `ParentEmailStep` test was already failing before this plan's changes (`i18n.dir is not a function` in test environment). Pre-existing issue, out of scope.
- Worktree has separate `src/` directory from main project — file had to be created in worktree path, not main project path.

## Known Stubs
None - all data is fetched via React Query from real services. QuickStatsGrid shows em-dash for null values, which is correct behavior when data is unavailable, not a stub.

## Next Phase Readiness
- Plan 03: AppSettings can import ParentZoneEntryCard (created by Plan 01) and render it at top of page
- Plan 04: DailyChallengeCard and TrailNodeModal changes are unblocked
- Gate-first architecture is in place; all subsequent plans can rely on it

---
*Phase: 06-dedicated-parent-portal-with-math-gate*
*Completed: 2026-03-25*
