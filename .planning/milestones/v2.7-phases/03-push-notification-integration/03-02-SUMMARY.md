---
phase: 03-push-notification-integration
plan: 02
subsystem: ui
tags: [service-worker, push-notifications, react-query, i18n, dashboard]

# Dependency graph
requires:
  - phase: 02-data-foundation-and-core-logging
    provides: practiceLogService with logPractice() and getCalendarDate(), PracticeLogCard component

provides:
  - practice-checkin push handler in service worker with action buttons (yes-practiced / not-yet)
  - one-shot 2-hour snooze via SW setTimeout wrapped in event.waitUntil Promise
  - notificationclick routing for practice-checkin type with snoozed flag preventing recursive snooze
  - Dashboard URL param detection (?practice_checkin=1) triggering auto-log and cache invalidation
  - practice.toast EN/HE i18n namespace (autoLogged, alreadyLogged, autoLogError)

affects:
  - service-worker
  - dashboard
  - push-notifications
  - i18n

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SW notificationclick type dispatch via data.type field — practice-checkin handler added alongside existing daily-practice/practice-reminder
    - URL param auto-log pattern — useSearchParams + replaceState + useEffect for notification-to-action bridge
    - Snooze-once pattern — snoozed flag in notification data.snoozed prevents infinite snooze chain
    - Cache invalidation trio after auto-log — practice-log-today, practice-streak, student-xp

key-files:
  created: []
  modified:
    - public/sw.js
    - src/components/layout/Dashboard.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "action string is 'yes-practiced' (not 'yes') matching UI-SPEC"
  - "snoozed notification tag 'practice-checkin-snoozed' distinct from original to allow coexistence"
  - "replaceState before async logPractice call — prevents re-trigger on re-render cycle"
  - "useEffect deps [hasPracticeCheckin, user?.id, isStudent] — queryClient/t/toast are stable refs"
  - "merged main before implementing — phase 02 practiceLogService/PracticeLogCard required"

patterns-established:
  - "SW notification type dispatch: add handler block before daily-practice block using same pattern"
  - "Dashboard URL param bridge: detect → replaceState → async service call → cache invalidation → toast"

requirements-completed: [PUSH-04, PUSH-05]

# Metrics
duration: 45min
completed: 2026-03-24
---

# Phase 03 Plan 02: Push Notification Integration - Dashboard Auto-Log Summary

**Service worker practice-checkin push handler with action buttons, one-shot snooze, and Dashboard URL-param auto-log that triggers PracticeLogCard settled state via React Query cache invalidation**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-24T15:20:00Z
- **Completed:** 2026-03-24T16:05:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Service worker push handler now shows `yes-practiced` / `not-yet` action buttons for `practice-checkin` tagged notifications (Android/desktop), falling back to standard `open` / `close` for all other notification types
- Notification click handler routes: `yes-practiced` or iOS body tap → opens `/?practice_checkin=1`; `not-yet` on first notification → schedules 2-hour snoozed follow-up; `not-yet` on snoozed notification → just dismisses (no recursive snooze)
- Dashboard detects `?practice_checkin=1` URL param, auto-logs practice via `practiceLogService.logPractice()`, invalidates `practice-log-today` / `practice-streak` / `student-xp` query caches, shows success/already-logged/error toasts, and cleans up the URL with `replaceState` before the async call
- Full EN + HE translations for all 3 toast messages under `practice.toast` namespace

## Task Commits

Each task was committed atomically:

1. **Task 1: Add practice-checkin push and click handlers to service worker** - `1e9f50e` (feat)
2. **Task 2: Dashboard URL param detection, auto-log, toast feedback, and i18n keys** - `eded3e0` (feat)

## Files Created/Modified

- `public/sw.js` - Conditional actions array in push handler; new practice-checkin block in notificationclick handler with yes/not-yet/snooze routing
- `src/components/layout/Dashboard.jsx` - New imports (useSearchParams, useQueryClient, practiceLogService); URL param hooks; auto-log useEffect
- `src/locales/en/common.json` - Added `practice.toast` namespace with 3 keys
- `src/locales/he/common.json` - Added `practice.toast` namespace with 3 Hebrew keys

## Decisions Made

- `action === 'yes-practiced'` (not `'yes'`) to match UI-SPEC and avoid collision with generic `'open'` action
- Snoozed notification uses separate tag `practice-checkin-snoozed` and `data.snoozed: true` flag so the "Not yet" handler can distinguish first vs. snoozed notification without needing a separate notification type
- `window.history.replaceState` before async `logPractice()` call to prevent the URL param from re-triggering the useEffect on React re-renders
- ESLint suppression comment on useEffect deps array since `queryClient`, `t`, and `toast` are stable refs (standard React Query + i18next pattern)
- Merged `main` into `worktree-agent-aa5eaf04` before implementation — `practiceLogService.js` and `PracticeLogCard.jsx` from phase 02 were not yet on this branch

## Deviations from Plan

### Pre-execution Branch Sync Required

**[Rule 3 - Blocking] Merged main to get phase 02 dependencies**
- **Found during:** Pre-task analysis
- **Issue:** `practiceLogService.js` and `PracticeLogCard.jsx` created in phase 02 were not on this worktree branch. Task 2 imports `practiceLogService` and the plan's interface contract references it.
- **Fix:** `git merge main` (fast-forward, no conflicts) to bring phase 02 work onto this branch before starting implementation
- **Files modified:** All phase 02 files (53 files via fast-forward)
- **Verification:** `practiceLogService.js` accessible at `src/services/practiceLogService.js`

---

**Total deviations:** 1 auto-fixed (blocking — branch sync)
**Impact on plan:** Required for correctness. Phase 03-02 depends on phase 02 outputs. No scope creep.

## Issues Encountered

- 3 pre-existing test failures (xpSystem.test.js, NotesRecognitionGame.autogrow.test.js, SightReadingGame.micRestart.test.jsx) — all fail at module import time due to missing `VITE_SUPABASE_URL` env variable in test environment. Confirmed pre-existing by verifying same failures before and after our changes.

## Known Stubs

None — all functionality is wired end-to-end.

## Next Phase Readiness

- Service worker and Dashboard are ready; push notification delivery requires the `send-daily-push` Edge Function changes from plan 03-01 to send `practice-checkin` typed payloads with the correct tag
- The full E2E flow works once 03-01's Edge Function is deployed to Supabase

---
*Phase: 03-push-notification-integration*
*Completed: 2026-03-24*
