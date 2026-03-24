---
phase: 02-data-foundation-and-core-logging
plan: 02
subsystem: ui-component
tags: [dashboard, practice-tracking, i18n, react-query, glassmorphism, framer-motion, streak, xp, rtl]
dependency_graph:
  requires:
    - Plan 01 (practiceLogService, practiceStreakService, dateUtils)
  provides:
    - PracticeLogCard component (src/components/dashboard/PracticeLogCard.jsx)
    - EN/HE practice namespace translations
  affects:
    - Dashboard layout (new card between UnifiedStatsCard and Practice Tools)
    - Plan 03 (push notification integration will reference same query keys)
    - Plan 04 (parent heatmap will share same locale namespace)
tech_stack:
  added: []
  patterns:
    - useQuery + useMutation for data fetching and logging
    - optimistic cache update via queryClient.setQueryData (no loading flash on return)
    - logState local FSM: idle -> logging -> settled
    - useMotionTokens for reduced-motion gate
    - useEffect to sync logStatus.logged -> settled on mount
key_files:
  created:
    - src/components/dashboard/PracticeLogCard.jsx
    - src/components/dashboard/PracticeLogCard.test.jsx
  modified:
    - src/locales/en/common.json
    - src/locales/he/common.json
    - src/components/layout/Dashboard.jsx
decisions:
  - "logState FSM (idle/logging/settled) prevents double-tap and manages 2-second hold (D-06, D-07)"
  - "useEffect syncs logStatus.logged=true -> settled on mount, preventing idle flash on return (D-08)"
  - "i18next mocked in tests with inline translations map — simpler than i18n provider setup"
  - "motion.span wraps CheckCircle for scale-in; reduce=true renders plain span (no animation)"
metrics:
  duration: "4 minutes"
  completed: "2026-03-24"
  tasks_completed: 2
  tasks_total: 3
  files_created: 3
  test_files: 1
  tests_passing: 5
---

# Phase 02 Plan 02: PracticeLogCard UI Component Summary

**One-liner:** PracticeLogCard with 4 states (loading/active/logging/settled), emerald/green glassmorphism, framer-motion scale-in, reduced-motion gate, React Query integration, and EN/HE i18n — wired into Dashboard.jsx between UnifiedStatsCard and Practice Tools.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | i18n translations (EN + HE) | b49948f | en/common.json, he/common.json |
| 2 | PracticeLogCard + Dashboard wiring + tests | 049c7ad | PracticeLogCard.jsx, PracticeLogCard.test.jsx, Dashboard.jsx |

## What Was Built

### Task 1: i18n Translations

Added `"practice"` top-level key to both locale files:

**English (`en/common.json`):** `practice.card.{title, prompt, logButton, loggingText, xpBadge, completedHeading, xpEarned}` and `practice.streak.{dayLabel, dayLabel_plural}` — 8 strings total.

**Hebrew (`he/common.json`):** Matching Hebrew translations including RTL-appropriate exclamation mark placement (e.g., `"!כן, תרגלתי"` ends with `!` per Hebrew convention).

### Task 2: PracticeLogCard Component

Self-contained React component that fetches its own data (no props) — matches DailyChallengeCard pattern.

**4 states:**
1. **Loading:** Pulse skeleton divs while queries load
2. **Active prompt:** "Did you practice today?" + "Yes, I practiced!" button with `bg-emerald-600`
3. **Logging:** Button disables, shows "Logged! +25 XP" with animated CheckCircle (scale-in 150ms, or instant for reduced-motion users)
4. **Completed:** Card border changes to `border-emerald-400/30`, content area to `bg-green-500/10 border-green-400/30`, shows "Practiced today!" + "+25 XP earned"

**State management:**
- `logState` FSM: `'idle' | 'logging' | 'settled'`
- `useEffect` syncs `logStatus.logged === true` → `settled` on mount (prevents idle flash on return)
- `queryClient.setQueryData` for instant cache update after log (D-08)
- 2-second `setTimeout` before settling (D-07)
- `onError` reverts to `idle` silently (D-07 error state)

**Streak display:**
- Uses Piano icon (lucide-react `Piano`) — not Flame, visually distinct from app-usage streak (D-09)
- Hidden when `streakCount === 0`, visible when `>= 1`
- Emerald/green text in active state, muted `text-white/60` in completed state

**Accessibility:**
- `min-h-[44px]` touch target on log button (WCAG)
- `aria-hidden="true"` on all decorative Piano/CheckCircle icons
- `disabled` + `aria-disabled="true"` on logging state button
- RTL: `dir={isRTL ? 'rtl' : 'ltr'}` on all flex row containers

**Dashboard wiring (`Dashboard.jsx`):**
- Import added at line 32 (after PushOptInCard import)
- `{isStudent && <PracticeLogCard />}` placed at line 699 — between `UnifiedStatsCard` close (line 695) and `PRACTICE TOOLS` comment (line 701), per D-02

### Tests (5 passing)

- **Loading skeleton**: Queries pending → pulse divs rendered, no button/heading
- **Active prompt (streak=0)**: Shows "Practice Instrument" title, "Did you practice today?" prompt, "Yes, I practiced!" button
- **Completed state**: Shows "Practiced today!" + "+25 XP earned", no active button
- **Streak hidden at 0**: "day practice streak" text absent
- **Streak visible at 5**: "5" and "day practice streak" text present

## Verification Results

```
1 test file — 5 tests — 0 failures
✓ src/components/dashboard/PracticeLogCard.test.jsx (5 tests)
```

Task 3 (Visual verification) is a `checkpoint:human-verify` gate — execution stopped here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] react-i18next mock missing `i18n.dir` function**
- **Found during:** Task 2 (first test run)
- **Issue:** Test render threw `TypeError: i18n.dir is not a function` — default react-i18next mock doesn't include the `i18n` object with `dir()` method
- **Fix:** Added a comprehensive `vi.mock('react-i18next', ...)` with `useTranslation` returning `{ t, i18n: { dir: () => 'ltr' } }` and inline translations map
- **Files modified:** `src/components/dashboard/PracticeLogCard.test.jsx`
- **Commit:** 049c7ad

## Known Stubs

None — component fetches real data from practiceLogService and practiceStreakService (implemented in Plan 01). i18n keys are fully populated in both locale files.

## Self-Check: PASSED

Verification:
- `src/components/dashboard/PracticeLogCard.jsx` exists: FOUND
- `src/components/dashboard/PracticeLogCard.test.jsx` exists: FOUND
- `src/locales/en/common.json` contains "practice" key: FOUND
- `src/locales/he/common.json` contains "practice" key: FOUND
- `src/components/layout/Dashboard.jsx` contains "PracticeLogCard": FOUND (import + usage)
- Commit b49948f (i18n): FOUND in git log
- Commit 049c7ad (component): FOUND in git log
- 5 tests passing: CONFIRMED
