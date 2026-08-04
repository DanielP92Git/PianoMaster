---
phase: 04-child-profiles-parental-gating
plan: 06
subsystem: ui
tags: [react-query, react, coppa, streak, xp, trail-progress, hooks]

# Dependency graph
requires:
  - phase: 04-child-profiles-parental-gating (Plan 02)
    provides: useActiveChildId() hook, ActiveChildContext, purgeChildScopedLocalStorage() shown-accessory-unlocks- prefix
  - phase: 04-child-profiles-parental-gating (Plan 04)
    provides: childId-first signatures on streakService/practiceLogService/practiceStreakService
provides:
  - Streak/practice/daily-challenge dashboard surfaces (StreakDisplay, PracticeLogCard, PracticeHeatmapCard, PracticeSessions, DailyChallengeCard) keyed on the active child id
  - useVictoryState (the end-of-exercise victory flow) fully rescoped to the active child id, including trail-progress persistence and XP award
  - verifyStudentDataAccess()-based authorization on xpSystem.awardXP/getStudentXP (replacing the old self-only check that rejected all parent-role award/read calls)
affects: [04-07, 04-09, 04-10, 04-11, future-parent-portal-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "5-step React Query childId rescope (useActiveChildId() -> queryKey -> queryFn -> enabled -> invalidations), applied uniformly across 6 files"
    - "verifyStudentDataAccess(studentId) as the drop-in replacement for hardcoded auth.uid()===studentId self-checks in row-target services"

key-files:
  created:
    - src/hooks/useVictoryState.test.js
  modified:
    - src/components/streak/StreakDisplay.jsx
    - src/components/dashboard/PracticeLogCard.jsx
    - src/components/parent/PracticeHeatmapCard.jsx
    - src/pages/PracticeSessions.jsx
    - src/components/dashboard/DailyChallengeCard.jsx
    - src/hooks/useVictoryState.js
    - src/hooks/useStreakWithAchievements.js
    - src/pages/PracticeModes.jsx
    - src/utils/xpSystem.js
    - src/services/achievementService.js
    - src/components/dashboard/PracticeLogCard.test.jsx
    - src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx

key-decisions:
  - "PracticeHeatmapCard now resolves its own active child id via useActiveChildId() internally, dropping the studentId prop entirely, rather than continuing to depend on a caller-supplied id — its underlying service calls now hard-require an explicit childId (Plan 04), and the plan's own action text called for replacing user?.id/studentId id sources with the hook."
  - "Fixed 4 call sites outside the plan's files_modified list (useStreakWithAchievements.js, PracticeModes.jsx, xpSystem.js awardXP/getStudentXP, achievementService.js x2) because they sit directly in useVictoryState's own call chain and were left broken by Plan 04's streakService signature change / were never compatible with a childId that differs from the caller's own auth.uid() — leaving them as-is would have made this plan's own childId rescope non-functional for parent-role accounts, not just incomplete."
  - "useBossUnlockTracking(user?.id, nodeId) and hasLevelBeenCelebrated/markLevelCelebrated(user.id, ...) deliberately left un-rescoped (still keyed on the parent's own id) — not in the plan's interfaces block or acceptance criteria, lower severity (soft localStorage bleed, not a hard Unauthorized failure), and fixing them would touch two more files (useBossUnlockTracking.js, levelUpTracking.js) with no owning plan. Documented as a deferred item below."

patterns-established:
  - "verifyStudentDataAccess(studentId) replaces `if (user.id !== studentId) throw` in any service function that writes/reads a row keyed by an explicit target id — the correct pattern for every future service still doing a self-only check."

requirements-completed: [PROFILE-05]

# Metrics
duration: 55min
completed: 2026-08-04
---

# Phase 4 Plan 06: Streak/Practice/Victory-Flow Active-Child Rescope Summary

**Closed the second unkeyed React Query bleed vector (`["streak-state"]` in StreakDisplay) and rescoped the entire end-of-exercise victory flow — trail-progress persistence, XP award, streak update, and accessory-unlock localStorage — from the parent's own id to the active child id, fixing 4 upstream call sites that Plan 04's service signature change had left broken.**

## Performance

- **Duration:** ~55 min
- **Tasks:** 2
- **Files modified:** 12 (7 planned + 1 new test + 4 discovered-broken-call-site fixes)

## Accomplishments

- **Task 1** — `StreakDisplay.jsx`, `PracticeLogCard.jsx`, `PracticeHeatmapCard.jsx`, `PracticeSessions.jsx`, `DailyChallengeCard.jsx` all now resolve `useActiveChildId()` and key their React Query cache (query key, queryFn args, `enabled` gate, mutation/invalidation calls) on `childId` instead of `user?.id`/a caller-supplied `studentId` prop. Closed the second unkeyed bleed vector: `["streak-state"]` (no id at all) → `["streak-state", childId]`.
- **Task 2** — `useVictoryState.js` (the hook backing every game's post-session VictoryScreen) rescoped: streak-state query, `student-scores`/`earned-achievements`/`user-accessories`/`student-xp` invalidations, `useStreakWithAchievements`, and the trail-progress + `awardXP` calls (`getNodeProgress`/`updateNodeProgress`/`updateExerciseProgress`/`awardXP`) all now target `childId`. The `shown-accessory-unlocks-${user.id}` localStorage key is re-keyed to `shown-accessory-unlocks-${childId}` (Pitfall 12) — purge of the stale entry on switch is Plan 02's `purgeChildScopedLocalStorage()` prefix matcher, not touched here.
- New `useVictoryState.test.js` (8 tests, TDD-style) asserts: the streak-state query key/queryFn/enabled gate; `useStreakWithAchievements` constructed with `childId`; the accessory-unlock localStorage key; that switching the active child changes both the query key and the localStorage key (no bleed); that a completed trail node's `awardXP` call and its `student-xp` invalidation target `childId`, not the parent's own id.
- Fixed 4 call sites not in this plan's file list that sit directly inside `useVictoryState`'s dependency chain and would have silently broken the rescope for parent-role accounts (see Deviations).

## Task Commits

1. **Task 1: Rescope streak + practice dashboard sites** - `78027d3c` (feat)
2. **Task 2: Rescope useVictoryState + fix upstream call-chain breakage** - `9f6462f7` (feat)

## Files Created/Modified

- `src/components/streak/StreakDisplay.jsx` - closed unkeyed `["streak-state"]` bleed vector
- `src/components/dashboard/PracticeLogCard.jsx` - all queries/mutation/invalidations keyed on childId
- `src/components/parent/PracticeHeatmapCard.jsx` - dropped `studentId` prop, resolves `childId` internally
- `src/pages/PracticeSessions.jsx` - all `practice-sessions` cache operations keyed on childId
- `src/components/dashboard/DailyChallengeCard.jsx` - query keyed on childId, `getTodaysChallenge(childId)`
- `src/hooks/useVictoryState.js` - full victory-flow rescope (streak/XP/trail-progress/accessory-unlock)
- `src/hooks/useVictoryState.test.js` (new) - 8 tests covering the childId rescope + no-bleed switch behavior
- `src/hooks/useStreakWithAchievements.js` - now takes an explicit `childId` param
- `src/pages/PracticeModes.jsx` - passes `useActiveChildId()`'s childId into `useStreakWithAchievements`
- `src/utils/xpSystem.js` - `awardXP`/`getStudentXP` swapped the self-only `user.id !== studentId` check for `verifyStudentDataAccess(studentId)`
- `src/services/achievementService.js` - fixed 2 `streakService.getStreak()` calls missing the already-in-scope `studentId` arg
- `src/components/dashboard/PracticeLogCard.test.jsx` - updated mock from `useUser` to `useActiveChildId` (Task 1 consequence)
- `src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx` - added a `useActiveChildId` mock (Task 2 consequence)

## Decisions Made

- **PracticeHeatmapCard prop removal:** the plan's own action text instructed replacing `user?.id`/`studentId` id sources with `useActiveChildId()`; applied literally, which means the component no longer depends on `ParentPortalPage.jsx` (owned by another plan) passing the right id — it resolves correctly on its own regardless of what that caller does.
- **Fixed 4 out-of-scope call sites:** `useStreakWithAchievements.js`, `PracticeModes.jsx`, `xpSystem.js` (`awardXP`/`getStudentXP`), and `achievementService.js` (x2 `getStreak()` calls) were all broken by Plan 04's `streakService` signature change or hard-coded a self-only `user.id === studentId` check that unconditionally rejects any parent-role call (where `childId !== parent's own auth.uid()`). All 4 sit directly in `useVictoryState`'s call chain (`useStreakWithAchievements` is invoked from `useVictoryState`; `awardXP`/`getStudentXP` are the exact functions this plan's action explicitly names; `achievementService.checkForNewAchievements` is invoked from the now-fixed `useStreakWithAchievements`). Leaving them broken would mean this plan's own childId rescope silently fails end-to-end for every parent-role account — not a partial gap, a hard `Unauthorized` throw on every node completion. Applied Rule 1 (bug)/Rule 3 (blocking issue) rather than deferring.
- **Left `useBossUnlockTracking`/`levelUpTracking` un-rescoped:** these two localStorage-keyed utilities (`boss-unlocked-${userId}-${nodeId}`, `getCelebratedLevels(userId)`) are still keyed on the parent's own `user.id`, causing a soft cross-child bleed (a boss-unlock or level-up celebration might not re-fire for a second child, or fire again incorrectly) — not a hard failure like the 4 fixes above. Not in the plan's interfaces block, not in RESEARCH.md's inventory, and fixing them touches two more files with no owning plan. Documented below as a deferred item rather than silently expanding scope further.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `PracticeHeatmapCard.jsx` plan path mismatch**

- **Found during:** Task 1
- **Issue:** The plan's interfaces block references `src/components/dashboard/PracticeHeatmapCard.jsx`; the file actually lives at `src/components/parent/PracticeHeatmapCard.jsx`. The plan's own `<verify>` grep command for this file would have failed on a nonexistent path.
- **Fix:** Applied the rescope to the real file location; ran the equivalent grep checks against the correct path manually (all passed).
- **Files modified:** `src/components/parent/PracticeHeatmapCard.jsx`
- **Committed in:** `78027d3c`

**2. [Rule 1 - Bug] `useStreakWithAchievements.js` called `streakService.updateStreak()` with no args**

- **Found during:** Task 2
- **Issue:** Plan 04 made `streakService.updateStreak(childId)` require an explicit `childId`. This hook (invoked by `useVictoryState` at the ≥80%-score streak-update site) still called it with zero arguments, meaning `student_id` would be filtered against `undefined` for every streak update in the entire app, not just parent-role ones.
- **Fix:** `useStreakWithAchievements` now takes `childId` as an explicit hook param and passes it through to `updateStreak`/`checkForNewAchievements`; all its `invalidateQueries` calls rescoped to `childId`. Its only other call site (`PracticeModes.jsx`) updated to resolve and pass `useActiveChildId()`'s `childId`.
- **Files modified:** `src/hooks/useStreakWithAchievements.js`, `src/pages/PracticeModes.jsx`
- **Verification:** `npm run lint` clean; no existing tests reference either file (confirmed via glob).
- **Committed in:** `9f6462f7`

**3. [Rule 1 - Bug] `xpSystem.awardXP`/`getStudentXP` rejected every parent-role call**

- **Found during:** Task 2
- **Issue:** Both functions hard-coded `if (user.id !== studentId) throw new Error('Unauthorized: ...')` — a self-only check that unconditionally fails once `studentId` becomes the active child's id (which differs from the parent's own `auth.uid()`). This is the exact SEC-03 landmine `04-PATTERNS.md` documents for other files (`dataExportService`/`accountDeletionService`), just not previously applied here.
- **Fix:** Replaced both self-only checks with `await verifyStudentDataAccess(studentId)` — the same owned-child-aware authorization utility already used elsewhere in the codebase for this exact problem.
- **Files modified:** `src/utils/xpSystem.js`
- **Verification:** `npx vitest run src/utils/xpSystem.test.js` — 27/27 passed (no test asserted the old self-only error message).
- **Committed in:** `9f6462f7`

**4. [Rule 1 - Bug] `achievementService.js` called `streakService.getStreak()` with no args (x2)**

- **Found during:** Task 2 (while verifying the `useStreakWithAchievements` → `achievementService.checkForNewAchievements` call chain)
- **Issue:** `runAchievementCheck(studentId)` and `getAchievementsWithProgress(studentId)` both call `streakService.getStreak()` with no argument despite already having `studentId` in scope — another Plan-04-signature-change casualty.
- **Fix:** Both calls now pass the already-available `studentId`.
- **Files modified:** `src/services/achievementService.js`
- **Verification:** `npm run lint` clean; no existing tests reference this service.
- **Committed in:** `9f6462f7`

**5. [Rule 1 - Bug] `PracticeLogCard.test.jsx` and `SightReadingGame.mastery.test.jsx` broke as a direct consequence of Tasks 1/2**

- **Found during:** Task 1 verification (PracticeLogCard) and Task 2 verification (mastery test)
- **Issue:** `PracticeLogCard.test.jsx` mocked `useUser`, which the component no longer imports after Task 1. `SightReadingGame.mastery.test.jsx` renders `useVictoryState` directly via `renderHook`, which now throws `"useActiveChild must be used within an ActiveChildProvider"` without a mock.
- **Fix:** `PracticeLogCard.test.jsx` mocks `useActiveChildId` instead. `SightReadingGame.mastery.test.jsx` adds a `useActiveChildId` mock that mirrors the legacy/student-role resolution (`childId = user.id`) so its existing assertions (which don't depend on the specific id value) stay valid.
- **Files modified:** `src/components/dashboard/PracticeLogCard.test.jsx`, `src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx`
- **Verification:** Both files' full suites green (5/5 and 9/9 respectively); full `npx vitest run` afterward: 127 files passed / 1 intentionally skipped, 2275/2279 tests passed (4 todo, pre-existing).
- **Committed in:** `78027d3c` (PracticeLogCard.test.jsx), `9f6462f7` (mastery test)

---

**Total deviations:** 5 auto-fixed (all Rule 1 — bugs either pre-dating this plan from Plan 04's signature change, a pre-existing SEC-03-style landmine, or a direct test-breakage consequence of this plan's own changes)
**Impact on plan:** All 5 were necessary for the plan's own stated truths ("Victory-flow service calls (streak/practice/award_xp) pass the active child id") to actually hold at runtime for parent-role accounts, not just at the React Query key layer. No unrelated scope creep — deliberately stopped short of `useBossUnlockTracking`/`levelUpTracking` (see Decisions) and did not touch `ParentPortalPage.jsx`/`Dashboard.jsx`'s own broken `streakService.getStreak()`/`getStreakState()` calls, which are owned by other plans or unowned entirely (see Known Gaps below).

## Issues Encountered

- Initial `useVictoryState.test.js` `invalidateQueries` assertion failed intermittently because the `@tanstack/react-query` mock's `useQueryClient()` factory created a fresh `vi.fn()` on every render — since the hook re-renders many times as its async effects settle, a later render silently discarded the earlier `invalidateQueries` call history. Fixed by making the mock spy persistent across the test (only created once per test via a hoisted ref), matching how the real `QueryClient` instance persists across renders.

## User Setup Required

None - no external service configuration required.

## Known Gaps (out of this plan's scope, not fixed)

- `src/components/layout/Dashboard.jsx:86` calls `streakService.getStreak()` with no args (same Plan-04-signature-change bug as the 4 fixed above) — not in this plan's file list, not referenced in `04-RESEARCH.md`'s inventory, no owning plan found. Will break for parent-role accounts until fixed.
- `src/pages/ParentPortalPage.jsx:166` calls `streakService.getStreakState()` with no args — confirmed owned by another Phase 4 plan (per `04-07-SUMMARY.md`'s "remaining call sites... owned by other plans" note), not fixed here to avoid a cross-wave file clash.
- `useBossUnlockTracking(user?.id, nodeId)` and `hasLevelBeenCelebrated`/`markLevelCelebrated(user.id, ...)` in `useVictoryState.js` are still keyed on the parent's own id — soft cross-child bleed on boss-unlock/level-up celebration dedup, not a hard failure. See Decisions above.

## Next Phase Readiness

- Both unkeyed/mis-keyed bleed vectors named in this plan's objective are closed (`StreakDisplay`'s `["streak-state"]` and `useVictoryState`'s accessory-unlock localStorage key).
- The full end-of-exercise victory write path (streak, practice, trail progress, XP) now correctly targets the active child for parent-role accounts — previously this would have hard-failed with `Unauthorized` on the very first node completion.
- Three known gaps (Dashboard.jsx, ParentPortalPage.jsx call sites, boss-unlock/level-up localStorage keys) remain for other plans/a follow-up quick task — none block this plan's own PROFILE-05 acceptance, which Plan 02 already proved at the multi-child device-test level.

---

_Phase: 04-child-profiles-parental-gating_
_Completed: 2026-08-04_

## Self-Check: PASSED

- FOUND: src/hooks/useVictoryState.test.js
- FOUND: src/components/parent/PracticeHeatmapCard.jsx
- FOUND: .planning/phases/04-child-profiles-parental-gating/04-06-SUMMARY.md
- FOUND: commit 78027d3c
- FOUND: commit 9f6462f7
