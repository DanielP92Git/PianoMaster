---
phase: 04-child-profiles-parental-gating
plan: 10
subsystem: child-profile-management
tags: [coppa, parental-gate, child-crud, data-rights]
dependency-graph:
  requires:
    - src/services/apiChildProfiles.js (Plan 02 — createChildProfile, renameChildProfile, updateChildAvatar, setChildActive, getChildProfiles)
    - src/services/accountDeletionService.js#deleteChildProfile (Plan 03 — per-child delete, no signOut)
    - src/services/dataExportService.js (Plan 03 — exportStudentData, downloadStudentDataJSON)
    - src/components/auth/ParentGateProtectedRoute.jsx (Plan 05)
    - src/components/children/ChildProfileForm.jsx (Plan 08)
    - src/hooks/useChildProfiles.js, src/contexts/ActiveChildContext.jsx (Plan 02)
  provides:
    - src/components/children/ManageChildrenScreen.jsx (default export — gated /manage-children screen)
    - src/components/children/ChildProfilePanel.jsx (default export — per-child Profile + Data & Privacy sections)
    - src/components/children/DeleteChildModal.jsx (default export — red name-confirm delete modal)
  affects:
    - src/App.jsx (new /manage-children route)
    - src/locales/en/common.json, src/locales/he/common.json (children.manage.statusActive/statusPaused/empty)
tech-stack:
  added: []
  patterns:
    - "Gated route via ParentGateProtectedRoute wrapping (mirrors /parent-portal precedent, no local gateOpen state)"
    - "In-page selection state (selectedChildId) for list->panel drill-in instead of a nested route, mirroring how ManageChildrenScreen owns both the list and the panel render"
    - "Amber inline confirm (reversible Pause) vs. red full modal (permanent Delete), never sharing a color or a confirmation mechanism"
key-files:
  created:
    - src/components/children/ManageChildrenScreen.jsx
    - src/components/children/ManageChildrenScreen.test.jsx
    - src/components/children/ChildProfilePanel.jsx
    - src/components/children/ChildProfilePanel.test.jsx
    - src/components/children/DeleteChildModal.jsx
  modified:
    - src/App.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
decisions:
  - "Tasks 2 and 3 committed together (single commit 92f7b8e3): ChildProfilePanel.jsx unconditionally renders <DeleteChildModal>, so the two files cannot build or be tested independently — splitting them across commits would leave an intermediate commit broken."
  - "Review Data renders the exportStudentData() result as a per-table record-count summary (description + recordCount), not raw JSON — per plan's 'planner discretion' on the on-screen summary shape."
  - "Avatar row images in ManageChildrenScreen resolve via a local ['avatars'] query (same query key as ChildProfileForm/apiAvatars) rather than a new lookup service."
metrics:
  duration: ~50min
  completed: 2026-08-04
---

# Phase 04 Plan 10: Manage Children Screen (D-09) Summary

Gated `/manage-children` screen listing a parent's children (active + paused) that drills into a per-child panel combining profile editing (rename/avatar via the reusable `ChildProfileForm`) with a Data & Privacy section (Review Data, Download, Pause/Turn Back On, and a visually-demoted red Delete), completing the parent-facing per-child data-rights surface for COPPA-01/03/04/05/06 and PROFILE-01.

## What Was Built

- **`ManageChildrenScreen.jsx`** — page shell mirroring `ParentPortalPage`'s `BackButton` + glass-container + heading pattern. Lists every child (not just active ones, unlike the "Who's playing?" switcher) with an avatar, nickname, and an Active/Paused status pill; a row click drills into `ChildProfilePanel`. `?add=1` renders `ChildProfileForm` in create mode; on success it auto-switches into the new child (`switchChild`) and navigates to `/dashboard` (D-15).
- **`/manage-children` route** registered in `App.jsx`, sibling of `/parent-portal`, wrapped in `ParentGateProtectedRoute` (mount re-check enforces COPPA-01 — no direct-URL or back-button bypass). Not added to `LANDSCAPE_ROUTES`/`gameRoutes` (not a game route, verified via diff — 0 occurrences added).
- **`ChildProfilePanel.jsx`** — two sections: "Profile" (`ChildProfileForm` edit mode) and "Data & Privacy". Review Data calls `exportStudentData(childId)` and renders a per-table record-count summary inline; Download calls `downloadStudentDataJSON(childId)` and triggers a browser download (blob URL + anchor click, mirroring `DataExportModal`'s pattern) with a loading-spinner state. Pause is an amber inline confirm (no name typing, reversible) calling `setChildActive(childId, false)`; a paused child shows amber-free green "Turn Back On" calling `setChildActive(childId, true)`. Both invalidate `["child-profiles", parentId]`. Delete is visually last/lowest and red, opening `DeleteChildModal`.
- **`DeleteChildModal.jsx`** — mirrors `AccountDeletionModal`'s structure (red warning banner -> name-confirmation input -> disabled-until-match submit) but scoped to one child, with zero waiting-period copy anywhere (D-12: immediate, not the whole-account 30-day-grace flow). Calls `accountDeletionService.deleteChildProfile(childId, typed)`, which does **not** call `supabase.auth.signOut()` — the parent stays logged in after deleting one of their children.

## Verification

- `npx vitest run src/components/children/ManageChildrenScreen.test.jsx src/components/children/ChildProfilePanel.test.jsx` — 16/16 passing (6 + 10).
- Full suite: `npm run test:run` — 128/129 test files passed (1 pre-existing unrelated skip), 2283/2287 tests passed (4 pre-existing todos), 0 regressions.
- ESLint clean on all new/modified files.
- Grep gates from the plan's acceptance criteria, all satisfied:
  - `path="/manage-children"` present in `App.jsx`, wrapped in `ParentGateProtectedRoute`.
  - `LANDSCAPE_ROUTES`/`gameRoutes` diff count: 0 (untouched).
  - `setChildActive` called with both `false` (pause) and `true` (reactivate) in `ChildProfilePanel.jsx`.
  - `downloadStudentDataJSON`/`exportStudentData` both called in `ChildProfilePanel.jsx`.
  - `deleteChildProfile` called in `DeleteChildModal.jsx`; `grep -ci "30.day|grace"` on that file is `0`.
  - Submit disabled until case-insensitive nickname match (`toLowerCase` + `disabled` present); test asserts disabled -> typed-wrong-still-disabled -> typed-correct-enabled.
  - Test asserts no `signOut` call on the per-child delete path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DeleteChildModal doc comment self-defeated its own acceptance gate**

- **Found during:** Verification pass (running the plan's literal `grep -ci "30.day|grace"` acceptance-criteria check).
- **Issue:** The JSDoc comment explaining that the modal "drops all 30-day-grace language" contained the literal substring `30-day-grace`, so the grep gate (which exists to prove no user-facing waiting-period copy leaked into the per-child delete flow) matched the comment itself — a false positive, not an actual copy leak.
- **Fix:** Reworded the comment to describe the same intent ("no waiting-period copy anywhere") without using the literal flagged words.
- **Files modified:** `src/components/children/DeleteChildModal.jsx`
- **Commit:** `b193257b`

### Task-boundary bundling (not a plan deviation, documented for traceability)

Tasks 2 and 3 were committed together in `92f7b8e3` rather than as two separate commits. `ChildProfilePanel.jsx` (Task 2) unconditionally imports and renders `<DeleteChildModal>` (Task 3) to complete the Delete button's wiring per the plan's own instruction ("Task 2 rendered it; here complete the onClick -> open modal"). Splitting them would have produced an intermediate commit that fails to build/test. Both files and their shared test file (`ChildProfilePanel.test.jsx`, 10 tests covering both Task 2's Data & Privacy behavior and Task 3's delete-modal wiring) landed in one atomic, fully-tested commit.

## Known Stubs

None — no empty data, placeholder text, or unwired components in this plan's surface. Review Data renders real `exportStudentData()` output; Download triggers a real file download; Pause/Reactivate/Delete all call the real Plan 02/03 services.

## Threat Flags

None. All new surface (the `/manage-children` route, the Pause/Delete/Export actions) is exactly the surface enumerated in the plan's own `<threat_model>` (T-04-10-01 through T-04-10-04), all disposed `mitigate`/`accept` there — no new trust boundary was introduced beyond what the plan anticipated.

## Self-Check: PASSED

- `src/components/children/ManageChildrenScreen.jsx` — FOUND
- `src/components/children/ManageChildrenScreen.test.jsx` — FOUND
- `src/components/children/ChildProfilePanel.jsx` — FOUND
- `src/components/children/ChildProfilePanel.test.jsx` — FOUND
- `src/components/children/DeleteChildModal.jsx` — FOUND
- `src/App.jsx` — FOUND (route added)
- Commit `a2f2eb8b` — FOUND in `git log --oneline`
- Commit `92f7b8e3` — FOUND in `git log --oneline`
- Commit `b193257b` — FOUND in `git log --oneline`
