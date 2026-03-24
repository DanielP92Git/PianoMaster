---
phase: 04-parent-calendar-heatmap
plan: 02
subsystem: ui
tags: [react, react-activity-calendar, parent-portal, heatmap, i18n, rtl, tanstack-query]

# Dependency graph
requires:
  - phase: 04-parent-calendar-heatmap
    plan: 01
    provides: getHistoricalLogs, buildHeatmapData, computeLongestStreak from practiceLogService

provides:
  - PracticeHeatmapCard component — 52-week heatmap with glass card, summary stats, loading/empty/error states
  - EN+HE i18n keys under parentPortal.practiceCalendar (11 keys each)
  - Parent portal (/parent-portal) shows heatmap below subscription card
affects:
  - src/pages/ParentPortalPage.jsx — PracticeHeatmapCard added below subscription card
  - src/locales/en/common.json — 11 new keys under parentPortal.practiceCalendar
  - src/locales/he/common.json — 11 new Hebrew keys under parentPortal.practiceCalendar

# Tech tracking
tech-stack:
  added:
    - react-activity-calendar@3.1.1 — GitHub-style heatmap component (npm package)
  patterns:
    - Two parallel useQuery calls for history + streak — avoids duplicating weekend-pass streak logic
    - RTL via CSS scaleX(-1) on ActivityCalendar inside direction:ltr wrapper — showMonthLabels=false in RTL to avoid double-mirror text
    - v3 prop names: showColorLegend/showTotalCount (not v2 hideColorLegend/hideTotalCount)
    - Locale-aware month labels via Intl.DateTimeFormat (not hardcoded arrays)

key-files:
  created:
    - src/components/parent/PracticeHeatmapCard.jsx
  modified:
    - package.json (react-activity-calendar dependency added)
    - package-lock.json
    - src/pages/ParentPortalPage.jsx (import + render PracticeHeatmapCard)
    - src/locales/en/common.json (11 practiceCalendar keys added)
    - src/locales/he/common.json (11 Hebrew practiceCalendar keys added)

key-decisions:
  - "v3 prop names used: showColorLegend={false} and showTotalCount={false} — UI-SPEC had incorrect v2 names; RESEARCH.md corrections applied"
  - "showMonthLabels={false} in RTL mode to avoid double-mirror of SVG text labels (Pitfall 4 from RESEARCH.md)"
  - "Two parallel useQuery calls: practice-history + practice-streak — keeps weekend-pass streak logic in practiceStreakService"
  - "studentId prop used only for query key — RLS enforced via session.user.id in service (consistent with plan 01 decision)"

requirements-completed: [PARENT-01, PARENT-02]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 04 Plan 02: Parent Calendar Heatmap UI Component Summary

**52-week practice heatmap card added to parent portal with react-activity-calendar v3, binary emerald/gray coloring, summary stats, RTL CSS mirror, loading/empty/error states, and full EN/HE i18n**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-24T17:47:18Z
- **Completed:** 2026-03-24T17:52:39Z
- **Tasks completed:** 1 of 2 (Task 2 is checkpoint:human-verify — stopped for visual verification)
- **Files modified:** 5 (1 created)

## Accomplishments

- Installed `react-activity-calendar@3.1.1` npm package (15KB gzipped, GitHub-style heatmap grid)
- Created `src/components/parent/PracticeHeatmapCard.jsx` — glass card component with:
  - Loading state: animated pulse skeletons for stat chips + heatmap area
  - Empty state: full 52-week all-gray grid + encouraging copy below (D-10: parent immediately understands the feature)
  - Populated state: emerald cells for practiced days, neutral gray for non-practiced (D-05, D-06, D-07)
  - Error state: inline error message (no toast, no skeleton)
  - Summary stats row: 3 chips (days practiced / current streak / longest streak) using `<dl>/<dt>/<dd>` semantics
  - RTL support: `scaleX(-1)` CSS transform inside `direction: ltr` wrapper; `showMonthLabels={false}` in RTL to avoid mirrored SVG text
  - Mobile scroll: `overflow-x-auto` wrapper
  - Accessibility: `<section aria-label>`, `role="status"` on loading skeleton, `aria-label` on ActivityCalendar
- Added 11 EN keys and 11 HE keys under `parentPortal.practiceCalendar` namespace
- Wired `PracticeHeatmapCard` into `ParentPortalPage.jsx`:
  - Import added at top
  - Rendered with `studentId={user?.id}` inside the `max-w-lg` container
  - Placed OUTSIDE the `effectiveDetail &&` conditional — always visible regardless of subscription (D-02)
  - `mt-6` spacing from subscription card (D-01)
  - `data-section="practice-heatmap"` for future premium gating wrapper
- Build: `npm run build` passes (exit 0)
- Lint: `npm run lint` passes (0 errors — 5 pre-existing warnings in unrelated files)
- Tests: 299/299 passing (1 pre-existing failure in `ParentEmailStep.test.jsx` — `i18n.dir is not a function`, documented in 04-01-SUMMARY.md as out-of-scope)

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| Task 1 | Install react-activity-calendar + create PracticeHeatmapCard + wire + i18n | `e37a505` |
| Task 2 | (checkpoint:human-verify — visual inspection required) | — |

## Files Created/Modified

- `src/components/parent/PracticeHeatmapCard.jsx` — NEW. 192 lines. Full heatmap card component.
- `src/pages/ParentPortalPage.jsx` — Added `import PracticeHeatmapCard` and render block (8 lines added)
- `src/locales/en/common.json` — Added `practiceCalendar` object (13 lines) inside `parentPortal`
- `src/locales/he/common.json` — Added `practiceCalendar` object (13 lines) inside `parentPortal`
- `package.json` — `react-activity-calendar` added to dependencies
- `package-lock.json` — lockfile updated

## Decisions Made

- Applied v3 prop name corrections from 04-RESEARCH.md Pitfall 1: `showColorLegend={false}` and `showTotalCount={false}` (UI-SPEC used incorrect v2 names `hideColorLegend`/`hideTotalCount`)
- Used `showMonthLabels={false}` in RTL mode per RESEARCH.md open question resolution — avoids fragile SVG text targeting; heatmap is still functional without month labels in v1 RTL
- `interactive` prop omitted entirely (removed in v3; non-interactivity is default per D-09)
- Two parallel queries (`practice-history` + `practice-streak`) per RESEARCH.md Pattern 4 recommendation

## Deviations from Plan

None — plan executed exactly as written. All v3 prop corrections from RESEARCH.md applied as specified.

## Issues Encountered

**Pre-existing test failure (out of scope):** `ParentEmailStep.test.jsx` fails with `i18n.dir is not a function` — pre-existing from Phase 01 signup flow i18n work. Not introduced by this plan. Documented in 04-01-SUMMARY.md.

## Known Stubs

None — all 4 component states (loading, empty, populated, error) are fully implemented. Data flows from:
- `practiceLogService.getHistoricalLogs()` → `buildHeatmapData()` → `ActivityCalendar data` prop
- `practiceStreakService.getPracticeStreak()` → `currentStreak` stat chip

No hardcoded empty values, no placeholders, no TODO comments. The component will show real data once a student has logged practice.

## Checkpoint: Task 2 Awaiting Visual Verification

Task 2 is `checkpoint:human-verify` — requires navigating to `/parent-portal` in the dev server and visually confirming the heatmap renders correctly. See checkpoint details in the execution output.

---
*Phase: 04-parent-calendar-heatmap*
*Completed: 2026-03-24*
