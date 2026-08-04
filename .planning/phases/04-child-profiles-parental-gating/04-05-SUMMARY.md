---
phase: 04-child-profiles-parental-gating
plan: 05
subsystem: auth
tags: [react-context, react-router, coppa, i18n, vitest]

# Dependency graph
requires:
  - phase: 04-child-profiles-parental-gating (Plan 01)
    provides: generalized parentGate.* i18n namespace (EN+HE) used by the repointed ParentGateMath
  - phase: 04-child-profiles-parental-gating (Plan 02)
    provides: ActiveChildContext / useActiveChild (activeChildId) subscribed for the profile-switch close trigger
provides:
  - ParentGateContext / useParentGate — shared, short-lived (3-min), in-memory parental gate with all four D-05 close triggers (timeout, profile-switch, blur/visibilitychange, route-change to a child surface)
  - ParentGateProtectedRoute — route wrapper that mount-re-checks the gate and renders ParentGateMath inline when not passed
  - ParentGateProvider wired into App.jsx (nested inside ActiveChildProvider)
  - ParentGateMath repointed to the generalized parentGate.* i18n keys
affects: [04-10-manage-children-screen, 04-11-parent-portal-split]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Provider+co-located-hook triad (createContext/Provider/useXxx) matching SettingsContext.jsx"
    - "Route-wrapper mount-recheck pattern mirroring src/ui/ProtectedRoute.jsx (auth check swapped for gate-passed check)"

key-files:
  created:
    - src/contexts/ParentGateContext.jsx
    - src/components/auth/ParentGateProtectedRoute.jsx
    - src/components/auth/ParentGateProtectedRoute.test.jsx
  modified:
    - src/components/settings/ParentGateMath.jsx
    - src/App.jsx

key-decisions:
  - "WINDOW_MS = 3 * 60 * 1000 (3 min) — mid-point of the D-05 discretionary 2-5 min range"
  - "ParentGateProvider nested immediately inside ActiveChildProvider (not SubscriptionProvider, which doesn't need active-child) so the profile-switch close trigger can observe activeChildId changes and useLocation resolves inside the BrowserRouter tree"
  - "visibilitychange listener attached to document, not window (Rule 1 fix — the plan's interfaces sketch used window; the Page Visibility API event does not bubble to window, and AudioContextProvider.jsx already establishes the document convention in this codebase)"

patterns-established:
  - "CHILD_SURFACE_ROUTES + isChildSurfaceRoute(pathname) helper for classifying post-auth routes as child-vs-parent surfaces; reusable by Plan 10/11 gated-route additions"

requirements-completed: [COPPA-01, COPPA-02]

# Metrics
duration: 20min
completed: 2026-08-04
---

# Phase 4 Plan 05: Shared Parental Gate Summary

**Shared in-memory `ParentGateContext` (3-min window, four D-05 close triggers) plus a `ParentGateProtectedRoute` mount-recheck wrapper, proven by a 6-case adversarial COPPA-01/02 test including a real MemoryRouter route-transition no-linger case.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-04T13:00:00Z (approx, worktree base-correction preceded task work)
- **Completed:** 2026-08-04T13:15:09Z
- **Tasks:** 2/2
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- `ParentGateContext.jsx`: gate-passed state lives only in `useState`/`useRef` (never written to any Web Storage API), derived `passed = passedAt !== null && Date.now() - passedAt < WINDOW_MS`, and closes on all four D-05 triggers — timeout (`setTimeout` armed in `pass()`), profile-switch (`useEffect` on `activeChildId`), blur/visibilitychange (`document`/`window` listeners), and route-change into a `CHILD_SURFACE_ROUTES` path (`useLocation` + `useEffect`).
- `ParentGateMath.jsx` repointed from the mount-local `pages.settings.notifications.parentGate.*` namespace to the generalized `parentGate.*` keys added in Plan 01 — mechanism (math generation, attempt/hint logic, glass modal shell, props) unchanged, per D-06 lock. Verified transparent to the three existing consumers (ParentPortalPage, FeedbackForm, NotificationPermissionCard), which mount `<ParentGateMath/>` without copy overrides.
- `ParentGateProtectedRoute.jsx`: mirrors `src/ui/ProtectedRoute.jsx`'s structure exactly — swaps the `isAuthenticated`/`isLoading` check for `useParentGate().passed`, renders `ParentGateMath` inline (not a redirect) when unpassed, renders `children` when passed. Because it's a pure functional read of context with no local mount-cache, any remount (URL entry, back-button) inherently re-checks.
- `App.jsx`: `ParentGateProvider` nested immediately inside `ActiveChildProvider`. `/manage-children` route intentionally NOT added (Plan 10's responsibility) — confirmed via grep (0 matches).
- `ParentGateProtectedRoute.test.jsx`: 6 tests, all green — COPPA-01 gate/child-content visibility (2 cases), COPPA-02 direct-URL fresh-mount-no-bypass, COPPA-02 no-linger via blur+forced remount (via a `key`-swapped route wrapper so the state persists on the same `ParentGateProvider` instance), and the **MANDATORY real-route-transition case**: solve the gate, click a real `<Link>` to `/trail` (an actual `MemoryRouter` navigation exercising the route-change listener, not a manual `closeGate()` call), then navigate back to `/parent-portal` and assert the gate re-prompts. A 6th test covers gate-cancel calling `navigate(-1)`.
- Full suite green: `npx vitest run src/components/auth/ParentGateProtectedRoute.test.jsx` (6/6) and `npm run test:run` (2228 passed, 4 todo, 1 file skipped — no regressions).

## Task Commits

1. **Task 1: ParentGateContext (in-memory, short-lived, ALL FOUR close triggers incl. route-change) + ParentGateMath key repoint** - `ae02b1f7` (feat)
2. **Task 2: ParentGateProtectedRoute wrapper + App wiring + MANDATORY COPPA-02 adversarial test (incl. real route-transition re-prompt)** - `6056133e` (feat)

_Note: Task 2's Rule 1 `visibilitychange` fix (document vs window) is folded into its commit — discovered while writing the adversarial test, before any consumer relied on the buggy behavior._

## Files Created/Modified

- `src/contexts/ParentGateContext.jsx` - Shared in-memory parental gate provider/hook (all four D-05 close triggers)
- `src/components/settings/ParentGateMath.jsx` - i18n key namespace repointed to generalized `parentGate.*`
- `src/components/auth/ParentGateProtectedRoute.jsx` - Mount-re-checked gate route wrapper
- `src/components/auth/ParentGateProtectedRoute.test.jsx` - MANDATORY COPPA-01/02 adversarial test (6 cases)
- `src/App.jsx` - `ParentGateProvider` import + nesting inside `ActiveChildProvider`

## Decisions Made

- `WINDOW_MS = 3 * 60 * 1000` — mid-point of the plan's discretionary 2-5 min range, matching the interfaces block's literal example.
- `ParentGateProvider` placed immediately inside `ActiveChildProvider` per `04-PATTERNS.md` guidance (needs `useActiveChild()` for the profile-switch trigger; `useLocation()` needs to be inside the router tree, which it is since `main.jsx` wraps `<App/>` in `BrowserRouter`).
- Test strategy mocks `ParentGateMath` as a lightweight Consent/Cancel stub (matching the existing `ParentPortalPage.test.jsx` / `FeedbackForm.test.jsx` convention) rather than solving the real random math problem — keeps the adversarial test focused on gate state/routing logic, not the (already-tested-elsewhere) math mechanism.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `visibilitychange` listener attached to `window` instead of `document`**

- **Found during:** Task 2, while writing the blur/visibilitychange adversarial test case
- **Issue:** The plan's `<interfaces>` sketch showed `window.addEventListener("visibilitychange", ...)`. Per the Page Visibility API spec the `visibilitychange` event fires on `document` and does not bubble to `window`, so the trigger would silently never fire in production (jsdom's test double happens to be lenient, which would have masked the bug even in a passing test).
- **Fix:** Moved the listener registration (and matching cleanup) from `window` to `document`, matching the existing convention already established in `src/contexts/AudioContextProvider.jsx`.
- **Files modified:** `src/contexts/ParentGateContext.jsx`
- **Verification:** `npx vitest run src/components/auth/ParentGateProtectedRoute.test.jsx` blur test case passes against the corrected listener; grep still confirms both `visibilitychange` and `blur` are present per the plan's Task 1 verification gate.
- **Committed in:** `6056133e` (part of Task 2 commit, discovered before Task 1's commit closed but folded into Task 2 since Task 1 had already been committed and this is a documentation-safe correction of the same file)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fixes a real production correctness gap in trigger 3 (blur/visibilitychange) before any downstream plan could depend on the buggy behavior. No scope creep — same file, same trigger, corrected event target only.

## Issues Encountered

The worktree's initial `HEAD` was on the wrong branch tip (`abcadb7d`, an unrelated merged PR #17 diverging from the expected wave-2 base `f5885dae`). Corrected via the mandatory `<worktree_branch_check>` `git reset --hard` to `f5885dae4030db67efceb1fd83685af13ed91082` before any task work began — no plan-related commits were at risk.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ParentGateProvider`/`useParentGate` and `ParentGateProtectedRoute` are ready for Plan 10 (`/manage-children` route) and Plan 11 (Parent Portal gate split, D-08) to consume directly — no further scaffolding needed.
- `CHILD_SURFACE_ROUTES` / `isChildSurfaceRoute` in `ParentGateContext.jsx` is the canonical list; if Plan 10 adds new top-level parent-only routes they do NOT need to be added to this list (only child-facing surfaces need to be listed to trigger gate-closing).
- No blockers.

---

_Phase: 04-child-profiles-parental-gating_
_Completed: 2026-08-04_

## Self-Check: PASSED

- FOUND: src/contexts/ParentGateContext.jsx
- FOUND: src/components/auth/ParentGateProtectedRoute.jsx
- FOUND: src/components/auth/ParentGateProtectedRoute.test.jsx
- FOUND commit: ae02b1f7
- FOUND commit: 6056133e
