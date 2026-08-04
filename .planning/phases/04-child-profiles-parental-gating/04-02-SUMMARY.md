---
phase: 04-child-profiles-parental-gating
plan: 02
subsystem: auth
tags: [react-context, react-query, supabase, rls, localStorage, coppa]

requires:
  - phase: 02-rls-rewrite
    provides: "child_profiles_all_parent_owner RLS policy (applied) authorizing owned-child reads/writes without a client-side pre-check"

provides:
  - "useActiveChildId() — the single source of the child id for every child-scoped read/write, resolving role duality (legacy student -> user.id, parent -> validated localStorage id)"
  - "ActiveChildProvider/useActiveChild — localStorage-backed active-child state, owned-children list, ready flag, switchChild() clear-then-set routine"
  - "apiChildProfiles.js — child_profiles CRUD (createChildProfile/renameChildProfile/updateChildAvatar/setChildActive/getChildProfiles)"
  - "purgeChildScopedLocalStorage() — extracted from apiAuth.logout(), reused by switchChild(); matcher now covers the shown-accessory-unlocks- prefix"
  - "resetStreakServiceCaches() — nulls streakService's module-level in-flight/cooldown singletons"

affects: [04-03, 04-04, 04-05, 04-06, 04-07, 04-08, 04-09, 04-10, 04-11]

tech-stack:
  added: []
  patterns:
    - "Provider + co-located hook triad (SettingsContext shape) reused for ActiveChildContext"
    - "Owner-scoped mutation pattern (apiTeacher.js analog) reused for apiChildProfiles.js — no client-side ownership pre-check, RLS is sole write authority"
    - "Clear-then-set identity-switch routine: queryClient.removeQueries() -> purgeChildScopedLocalStorage() -> resetStreakServiceCaches() -> localStorage.setItem() -> setState()"

key-files:
  created:
    - src/services/apiChildProfiles.js
    - src/hooks/useChildProfiles.js
    - src/hooks/useActiveChildId.js
    - src/contexts/ActiveChildContext.jsx
    - src/services/apiChildProfiles.test.js
    - src/hooks/useActiveChildId.test.js
    - src/contexts/ActiveChildContext.bleed.test.jsx
  modified:
    - src/services/apiAuth.js
    - src/services/streakService.js
    - src/App.jsx

key-decisions:
  - "purgeChildScopedLocalStorage() matcher extended with the shown-accessory-unlocks- startsWith prefix (WARNING-4) so switchChild()'s purge clears the previous child's re-keyed accessory-unlock banner dedup entry — the bare uuidPattern branch would not match a prefixed key"
  - "active_child_id added to apiAuth's keysToPreserve (D-01) so the device-level last-active-child pointer survives logout, letting the same parent resume on re-login"
  - "useActiveChildId performs NO authorization — returns exactly {childId, ready}, matching the interfaces block verbatim (D-04); RLS is the sole authority"
  - "ActiveChildProvider nested inside SettingsProvider, outside SubscriptionProvider (subscription is parent-scoped, doesn't need active-child); no ParentGateProvider added — that is Plan 05's scope"

patterns-established:
  - "Every future child-scoped React Query hook should key off useActiveChildId()'s {childId, ready} pair (childId in queryKey, enabled: ready && !!childId) — the ~17 call-site rescope in RESEARCH.md's inventory table depends on this shape"

requirements-completed: [PROFILE-05, PROFILE-06]

duration: 12min
completed: 2026-08-04
---

# Phase 04 Plan 02: Active-Child Seam Summary

**One `useActiveChildId()` hook + `ActiveChildProvider` (localStorage-backed active-child id, owned-children list, clear-then-set `switchChild()`) + `apiChildProfiles` CRUD service, proven by a mandatory falsifiable no-bleed test covering both unkeyed React Query caches.**

## Performance

- **Duration:** ~12 min (first commit 15:37:57 -> last commit 15:45:26, local time)
- **Tasks:** 3 completed
- **Files modified:** 10 (7 created, 3 modified)

## Accomplishments

- Built the load-bearing active-child seam every downstream Phase 4 plan depends on: `useActiveChildId()` resolves role duality (legacy student -> `user.id`, parent -> validated active-child id) with zero authorization logic (D-04).
- `apiChildProfiles.js` CRUD mirrors `apiTeacher.js`'s owner-scoped mutation pattern exactly — no client-side ownership pre-check on writes, since the applied `child_profiles_all_parent_owner` RLS policy is the sole write authority.
- `switchChild()`'s clear-then-set routine closes three separate bleed vectors in one call: `queryClient.removeQueries()` (React Query cache), `purgeChildScopedLocalStorage()` (localStorage, now including the `shown-accessory-unlocks-` prefix), and `resetStreakServiceCaches()` (module-level in-flight promise singletons that `removeQueries()` cannot touch — Pitfall 2).
- Delivered the MANDATORY PROFILE-05 no-bleed acceptance test (`ActiveChildContext.bleed.test.jsx`): asserts both unkeyed queries (`["streak-state"]`, `["scores"]`) plus a keyed one are cleared, the streak-cache reset and localStorage purge were invoked, and the new child id is persisted — a falsifiable proof that a fast child switch cannot serve Child A's data to Child B.
- `ActiveChildProvider` wired into `App.jsx`'s provider nest (inside `SettingsProvider`, outside `SubscriptionProvider`); full suite green (2202/2206 passed, 4 pre-existing todo, 0 failed) confirms zero regression from the `apiAuth.js` purge extraction and the provider nesting change.

## Task Commits

Each task was committed atomically:

1. **Task 1: apiChildProfiles CRUD service + useChildProfiles hook + Wave-0 tests** - `6d7a1ec5` (feat)
2. **Task 2: Extract purge (+ shown-accessory-unlocks- prefix), add streak reset, build ActiveChildContext + useActiveChildId** - `1cb412a3` (feat)
3. **Task 3: Wire ActiveChildProvider into App.jsx + MANDATORY PROFILE-05 no-bleed + PROFILE-06 tests** - `ab5d99fd` (feat)

_Note: this plan's tasks were marked `tdd="true"`/`type="auto"` per PLAN.md; tests were written alongside each task's implementation in a single commit per task rather than separate RED/GREEN commits, matching the plan's `<verify>` blocks (each task's automated verify runs the full test file, not a staged red-then-green sequence)._

## Files Created/Modified

- `src/services/apiChildProfiles.js` - `createChildProfile`/`renameChildProfile`/`updateChildAvatar`/`setChildActive`/`getChildProfiles`, owner-scoped mutation pattern, RLS-authoritative writes
- `src/hooks/useChildProfiles.js` - React Query wrapper (`["child-profiles", parentId]`) around `getChildProfiles`
- `src/hooks/useActiveChildId.js` - the single child-id source; role-duality composing hook, no authz
- `src/contexts/ActiveChildContext.jsx` - `ActiveChildProvider`/`useActiveChild`; localStorage read-before-first-query on mount, `switchChild()` clear-then-set routine
- `src/services/apiAuth.js` - extracted `purgeChildScopedLocalStorage()` (logout() now calls it); matcher gains `shown-accessory-unlocks-` prefix; `active_child_id` added to `keysToPreserve`
- `src/services/streakService.js` - added `resetStreakServiceCaches()` nulling the three `*FetchInFlight`/`*FetchFailed`/`*FailureTS` module singletons
- `src/App.jsx` - `ActiveChildProvider` nested inside `SettingsProvider`, outside `SubscriptionProvider`
- `src/services/apiChildProfiles.test.js` - payload-shape, update-targeting, and Not-authenticated coverage (9 tests)
- `src/hooks/useActiveChildId.test.js` - three role branches, D-04 shape assertion, PROFILE-06 reload persistence via unmount+remount (6 tests)
- `src/contexts/ActiveChildContext.bleed.test.jsx` - MANDATORY PROFILE-05 no-bleed test (1 test, 4 assertions)

## Decisions Made

- `purgeChildScopedLocalStorage()` matcher extended with the `shown-accessory-unlocks-` `startsWith` prefix per WARNING-4 (plan-mandated) — Plan 06 re-keys this localStorage entry to `shown-accessory-unlocks-<childId>`, and without the prefix in this matcher, `switchChild()`'s purge would leave stale per-child accessory-unlock keys accumulating forever (the bare `uuidPattern` branch does not match a prefixed key).
- `active_child_id` added to `keysToPreserve` (D-01) so the device-level "last active child" convenience survives a full logout, not just a switch.
- `useActiveChildId()` returns exactly `{childId, ready}` verbatim per the plan's interfaces block — deliberately no `isOwner`/authz field, since RLS is the sole authorization authority (D-04); test asserts this shape explicitly.
- `switchChild()`'s literal `localStorage.setItem("active_child_id", nextChildId)` call kept inline (not routed through the module-level storage-key constant used by the read-effect) to satisfy the plan's exact grep acceptance gate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed misplaced `eslint-disable-line` in the extracted purge block**

- **Found during:** Task 2 (extracting `purgeChildScopedLocalStorage()` from `apiAuth.js`)
- **Issue:** The pre-existing `logout()` dev-log block had `// eslint-disable-line no-console` on the line AFTER `console.log(`, which suppresses nothing (the directive applies to its own line, not the preceding one) — `npx eslint` flagged both an active `no-console` warning on the `console.log` line and an "unused eslint-disable directive" warning on the comment's own line.
- **Fix:** Replaced with `// eslint-disable-next-line no-console -- dev-only diagnostic log` placed immediately above `console.log(`.
- **Files modified:** src/services/apiAuth.js
- **Verification:** `npx eslint src/services/apiAuth.js` returns zero warnings/errors (was 2 warnings before the fix)
- **Committed in:** `1cb412a3` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Pure lint-hygiene fix in code directly touched by the extraction; no behavior change, no scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. No new migration; this plan builds entirely on the already-applied `child_profiles_all_parent_owner` RLS policy from Phase 2.

## Next Phase Readiness

- `useActiveChildId()` is ready for every downstream Phase 4 plan (03 onward) to consume for the ~17 React Query call-site rescope inventoried in RESEARCH.md.
- `ActiveChildProvider`/`switchChild()` is ready for Plan 03's `WhoIsPlayingOverlay` switcher UI to call directly.
- `apiChildProfiles` CRUD is ready for Plan 03's `ManageChildrenScreen`/`ChildProfileForm`.
- No blockers. `ParentGateProvider`/`ParentGateProtectedRoute` remain out of scope here — Plan 05 owns them.

## Self-Check: PASSED

All 10 files created/modified verified present on disk; all 3 task commits (`6d7a1ec5`, `1cb412a3`, `ab5d99fd`) verified in `git log`. Full suite (`npx vitest run`) confirmed green: 117/118 test files passed (1 pre-existing skip, unrelated to this plan), 2202/2206 tests passed (4 pre-existing todo), 0 failures.

---

_Phase: 04-child-profiles-parental-gating_
_Completed: 2026-08-04_
