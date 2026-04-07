---
phase: teacher-dashboard-review
plan: TD-03
subsystem: teacher-dashboard
tags: [assignments, crud, edit-modal, react-query, lucide-icons]
dependency_graph:
  requires: [TD-02]
  provides: [edit-assignment-ui]
  affects: [AssignmentManagement.jsx]
tech_stack:
  added: []
  patterns: [modal-dual-mode, useMutation-update]
key_files:
  modified:
    - src/components/teacher/AssignmentManagement.jsx
decisions:
  - Reuse CreateAssignmentModal for edit mode via optional assignment prop rather than creating a separate EditAssignmentModal component
  - useEffect dependency stays as [isOpen] only (from TD-02 fix) — the assignment prop is read inside the effect body, not listed as a dep, to avoid retriggering on object reference changes
metrics:
  duration: ~15min
  completed: 2026-04-07
  tasks_completed: 2
  files_modified: 1
---

# Phase TD Plan 03: Edit Assignment Functionality Summary

**One-liner:** Modal dual-mode pattern repurposing CreateAssignmentModal for edit via optional `assignment` prop, wired to `updateAssignment` API and Pencil icon button in each card's action row.

## What Was Built

Added end-to-end Edit Assignment functionality (closing UAT gap 16). The `updateAssignment()` API function already existed in `apiTeacher.js` but had no UI surface. This plan wires the full flow:

1. **Edit button** — Pencil icon added between Eye (view) and Trash2 (delete) in each assignment card action group, with yellow hover styling.
2. **Modal dual-mode** — `CreateAssignmentModal` extended with `assignment = null` and `onUpdateAssignment` props. When `assignment` is provided, the modal pre-fills all form fields from the existing assignment data and the submit button reads "Save Changes" instead of "Create Assignment".
3. **useEffect pre-fill** — The existing `[isOpen]` effect body branches on `assignment`: edit mode maps snake_case DB fields to camelCase form state; create mode resets to defaults. The eslint-disable comment from TD-02 is preserved.
4. **Update mutation** — `updateAssignmentMutation` using `useMutation` maps form state back to snake_case for the API call, invalidates `teacherAssignments` query on success, and shows toast.
5. **Edit modal instance** — A second `<CreateAssignmentModal>` rendered below the existing modals, bound to `showEditModal` / `editingAssignment` state.

## Tasks

| Task | Description                                                 | Status   | Commit  |
| ---- | ----------------------------------------------------------- | -------- | ------- |
| 1    | Extend CreateAssignmentModal to support edit mode           | Complete | 4ae1119 |
| 2    | Add edit button and update mutation in AssignmentManagement | Complete | 4ae1119 |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The edit flow is fully wired: button → state → modal pre-fill → API call → cache invalidation → success toast.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced. The `updateAssignment` API function was pre-existing with RLS enforcement.

## Self-Check: PASSED

- [x] `src/components/teacher/AssignmentManagement.jsx` modified — confirmed present
- [x] Commit `4ae1119` exists — confirmed via `git log`
- [x] ESLint passes with 0 warnings
- [x] All 10 change points from plan applied: 1a (Pencil import), 1a (updateAssignment import), 1b (props), 1c (useEffect branch), 1d (handleSubmit), 1e (modal title), 1f (button text), 2a (state), 2b (mutation), 2c (handlers), 2d (edit button), 2e (modal instance)
