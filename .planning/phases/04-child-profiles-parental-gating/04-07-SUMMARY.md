---
phase: 04-child-profiles-parental-gating
plan: 07
subsystem: ui
tags: [react-query, tanstack-query, child-profiles, coppa]

# Dependency graph
requires:
  - phase: 04-child-profiles-parental-gating (Plan 02)
    provides: useActiveChildId() hook — { childId, ready } contract, resolves
      student/parent role duality and the localStorage-backed active-child id
provides:
  - "useScores.js, useAccessories.js (3 read hooks), useUserProfile.js keyed on childId"
  - "AchievementsRedesign.jsx, TrailMapPage.jsx, XPProgressCard.jsx keyed on childId"
  - 'Unkeyed ["scores"] query closed (no more cross-child cache bleed)'
  - "isStudent enable-gate landmine removed from all 6 rescoped call sites"
affects:
  [
    child-profiles-parental-gating,
    streak-service-rescope,
    useVictoryState-rescope,
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "5-step React Query rescope: useActiveChildId() replaces user.id source; queryKey gains childId; queryFn takes childId; enabled: ready && !!childId; invalidations swap studentId->childId 1:1"

key-files:
  created:
    - src/features/userData/useScores.test.js
  modified:
    - src/features/userData/useScores.js
    - src/hooks/useAccessories.js
    - src/hooks/useUserProfile.js
    - src/pages/AchievementsRedesign.jsx
    - src/pages/TrailMapPage.jsx
    - src/components/dashboard/XPProgressCard.jsx

key-decisions:
  - "useUserProfile.js: preserved the teacher branch on user?.id (not childId) since useActiveChildId only resolves student/parent roles and returns null for teachers — a blind transform would have silently broken teacher profile fetching (Rule 1)"
  - "useAccessories.js mutation hooks (purchase/equip/unequip/updateMetadata) left on user?.id — out of this plan's explicit scope (RESEARCH.md only lists the 3 read-query keys at lines 28/39/51) and their only caller (Avatars.jsx) already passes an explicit userId override, so the hook's internal default is unreachable dead code either way"

requirements-completed: [PROFILE-05]

# Metrics
duration: ~15min
completed: 2026-08-04
---

# Phase 04 Plan 07: Rescope XP/Scores/Achievements/Accessories/Profile Queries to Active Child Summary

**Rescoped 6 React Query call sites (useScores, useAccessories reads, useUserProfile, AchievementsRedesign, TrailMapPage, XPProgressCard) from `user.id` to `useActiveChildId().childId`, closing the unkeyed `["scores"]` cache-bleed vector and the `isStudent` enable-gate that left a fresh parent's dashboard inert.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files modified:** 6 (+ 1 test file created)

## Accomplishments

- Closed the unkeyed `["scores"]` query key (Pitfall 1) — scores now key on `["scores", childId]`, so React Query cannot serve one child's cached scores to a sibling after a switch
- Removed the `isStudent`-gated `enabled` landmine (Pitfall 5) from all 6 call sites — replaced with `ready && !!childId`, so a parent-role session (isParent, isStudent=false) now actually fetches the active child's XP/scores/achievements/accessories/profile instead of the query staying permanently disabled
- All invalidation calls (score update mutation) swapped `studentId`→`childId` 1:1, keeping cache invalidation consistent with the new key shape
- `useUserProfile.js` preserved teacher-profile fetching (a role `useActiveChildId` doesn't resolve) while still rescoping the student/parent branch to `childId`

## Task Commits

Each task was committed atomically:

1. **Task 1: Rescope useScores + useAccessories + useUserProfile** - `ffd4634d` (feat)
2. **Task 2: Rescope AchievementsRedesign + TrailMapPage + XPProgressCard** - `9ddf97d2` (feat)

_Note: Task 1 was `tdd="true"` — the test file was authored alongside the implementation in the same commit (no pre-existing test to RED first; `useScores.test.js` did not exist before this plan)._

## Files Created/Modified

- `src/features/userData/useScores.js` - `queryClient.getQueryData(["user"])`/`isStudent` reads replaced with `useActiveChildId()`; `["scores", childId]` key; `enabled: ready && !!childId`; all 5 invalidations swapped to `childId`
- `src/features/userData/useScores.test.js` - new: asserts childId-keyed query, queryFn call args, parent-role enable (no isStudent gate), disabled-until-resolved, key changes across a child switch (bleed proof), and childId-scoped mutation/invalidation calls
- `src/hooks/useAccessories.js` - `useUserAccessories`/`usePointBalance`/`usePointTransactions` rescoped to `childId`; mutation hooks (purchase/equip/unequip/updateMetadata) unchanged (see Decisions)
- `src/hooks/useUserProfile.js` - student/parent branch rescoped to `childId`; teacher branch preserved on `user?.id`
- `src/pages/AchievementsRedesign.jsx` - `earned-achievements`/`achievements-with-progress` keyed and fetched on `childId`; `useUser()` import dropped entirely (was only used for these two queries)
- `src/pages/TrailMapPage.jsx` - `student-xp` query keyed and fetched on `childId`
- `src/components/dashboard/XPProgressCard.jsx` - `student-xp` query keyed and fetched on `childId`

## Decisions Made

- **useUserProfile.js teacher-branch carve-out** — `useActiveChildId()` only resolves `childId` for `isStudent`/`isParent` roles (returns `{ childId: null, ready: false }` for teachers). The plan's blind 5-step transform, applied literally, would have made `["user-profile", childId]` permanently `enabled: false` for every teacher, silently breaking their own profile fetch (avatar/name display). Fixed by branching `profileId`/`queryFn`/`enabled` on `user?.isTeacher`: teachers keep `user?.id`, everyone else uses `childId`. This is a Rule 1 auto-fix (bug the plan's transform would have introduced), not a scope deviation — the teacher code path itself is untouched in shape, only its id source is preserved instead of blindly swapped.
- **useAccessories.js mutation hooks left unchanged** — RESEARCH.md's inventory and the plan's `<interfaces>` block explicitly name only the 3 read-query keys (`useAccessories.js:28/39/51`). The 4 mutation hooks (`usePurchaseAccessory`, `useEquipAccessory`, `useUnequipAccessory`, `useUpdateAccessoryMetadata`) default `userId = user?.id`, but their sole caller (`Avatars.jsx`, not in this plan's `files_modified`) always passes an explicit `userId: user.id` override, so the default is dead code regardless. Rescoping the mutations' default/invalidation without also touching `Avatars.jsx` would create a queryKey mismatch (mutation invalidates `["user-accessories", "<some id>"]` while the read query is keyed `["user-accessories", childId]`) without fixing the actual write path. Left as-is; flagged below as a gap for whichever plan touches `Avatars.jsx`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved teacher-profile fetching in useUserProfile.js**

- **Found during:** Task 1 (useUserProfile.js rescope)
- **Issue:** The plan's literal 5-step transform (`user?.id` → `childId` everywhere) would have broken the existing teacher branch, since `useActiveChildId()` returns `childId: null` for teacher-role sessions (it only resolves student/parent). Teachers would lose their own profile display.
- **Fix:** Branched `profileId`, `queryFn`, and `enabled` on `user?.isTeacher` — teacher branch keeps `user?.id` as its id source (queryKey `["user-profile", user.id]`, `enabled: !!user?.id`); student/parent branch uses `childId` (queryKey `["user-profile", childId]`, `enabled: ready && !!childId`).
- **Files modified:** `src/hooks/useUserProfile.js`
- **Verification:** `grep -n "useActiveChildId" src/hooks/useUserProfile.js` matches (acceptance criteria); manual trace of both branches confirms teacher and student/parent paths each resolve to a non-null id when their respective role is active.
- **Committed in:** `ffd4634d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary correctness fix — the plan's own `<interfaces>` transform, applied without this carve-out, would have introduced a new regression (teacher profile fetch broken) as a side effect of fixing the child-scoping bug. No scope creep — the teacher code path's shape and behavior are unchanged, only its id source is now explicit rather than accidentally correct.

## Issues Encountered

None.

## Known Gaps (out of this plan's scope, tracked for a future plan)

- `src/components/Avatars.jsx` still passes `userId: user.id` explicitly to `usePurchaseAccessory`/`useEquipAccessory`/`useUnequipAccessory`/`useUpdateAccessoryMetadata`. For a parent-role session where `childId !== user.id`, these mutations still write/invalidate against the parent's own id, not the active child's. The 3 _read_ queries this plan rescoped (`useUserAccessories`, `usePointBalance`, `usePointTransactions`) now correctly key on `childId`, so this is a write-path gap, not a read-path bleed — but it means a parent purchasing/equipping an accessory for a child today targets the wrong row until `Avatars.jsx` (and the 4 mutation hooks' defaults) are rescoped in a later plan. Not fixed here because `Avatars.jsx` is not in this plan's `files_modified` list and RESEARCH.md's inventory only lists the 3 read-query keys for `useAccessories.js`.
- `useVictoryState.js` (lines ~149/181/454/514/537/656) still keys `earned-achievements`/`user-accessories`/`student-xp`/`student-scores` on `user.id` — explicitly out of scope per the plan's own note ("NOTE: useVictoryState.js is NOT in this plan (it also calls streakService → Plan 06). Do not touch it here.").

## Next Phase Readiness

- 6 of the ~17 child-scoped React Query call sites in RESEARCH.md's inventory are now rescoped and closed (the unkeyed `["scores"]` + `isStudent`-gate bugs this plan targeted).
- Remaining call sites (`useVictoryState.js`, `PracticeSessions.jsx`, `PracticeLogCard.jsx`, `PracticeHeatmapCard.jsx`, `DailyChallengeCard.jsx`, `StreakDisplay.jsx`, `ParentPortalPage.jsx`) are owned by other plans in this phase/wave per the plan's own scoping notes.
- No blockers for downstream plans; `useActiveChildId()` contract consumed exactly as documented by Plan 02.

---

_Phase: 04-child-profiles-parental-gating_
_Completed: 2026-08-04_

## Self-Check: PASSED

All 7 modified/created files confirmed present on disk; both task commits (`ffd4634d`, `9ddf97d2`) confirmed present in git log.
