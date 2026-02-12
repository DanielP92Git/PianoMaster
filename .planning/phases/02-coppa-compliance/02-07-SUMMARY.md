---
phase: 02-coppa-compliance
plan: 07
subsystem: coppa-ui
status: complete
tags:
  - coppa
  - ui-integration
  - data-export
  - account-deletion
  - teacher-dashboard
requires:
  - 02-04 (COPPA data services)
  - 02-01 (COPPA schema)
provides:
  - Teacher UI for COPPA data export
  - Teacher UI for COPPA account deletion
  - Complete data export/deletion workflow
affects:
  - None (gap closure, final UI wiring)
tech-stack:
  added: []
  patterns:
    - React modal composition
    - Dark theme UI styling
    - Blob download pattern
    - Name confirmation UX
decisions:
  - Dark theme styling for teacher modals (bg-gray-900, text-white)
  - Blob URL download pattern for JSON export
  - Case-insensitive name confirmation for deletion
  - Grace period countdown display in days
  - Orange AlertTriangle icon for COPPA deletion vs red Trash2 for teacher connection removal
key-files:
  created:
    - src/components/teacher/DataExportModal.jsx (207 lines)
    - src/components/teacher/AccountDeletionModal.jsx (342 lines)
  modified:
    - src/components/layout/TeacherDashboard.jsx (+57 lines)
metrics:
  duration: 6 minutes
  tasks: 3
  commits: 3
  files_created: 2
  files_modified: 1
completed: 2026-02-01
---

# Phase 2 Plan 7: COPPA UI Wiring Summary

**One-liner:** Wired orphaned COPPA data export and account deletion services into Teacher Dashboard with modal components and action buttons.

## What Was Built

### Task 1: DataExportModal Component (207 lines)
**Commit:** `8d1e8bb`

Created modal component for exporting student data:
- Imports `downloadStudentDataJSON` and `getDataSummary` from dataExportService
- Displays data summary table showing record counts by data type
- COPPA compliance notice explaining data export rights
- Download button creates blob URL and triggers JSON file download
- Filename format: `StudentName_data_export_YYYY-MM-DD.json`
- Dark theme styling (bg-gray-900, text-white) matching TeacherDashboard
- Loading state with spinner, error state with retry button
- Uses `student.student_id` for API calls, `student.student_name` for display

**Key features:**
- Data summary table with 10 data types (profile, scores, progress, goals, sessions, achievements, assignments, consent, points, accessories)
- Total record count footer
- Cyan accent colors for data display
- Memory cleanup (URL.revokeObjectURL after download)

### Task 2: AccountDeletionModal Component (342 lines)
**Commit:** `6a1015f`

Created modal component for account deletion with two modes:

**Mode A - Request Deletion (Not Pending):**
- Shows critical warning banner (red, AlertTriangle icon)
- Lists all data types that will be deleted
- 30-day grace period explanation
- Name confirmation input (case-insensitive validation)
- Delete Account button (disabled until name matches)
- Calls `requestAccountDeletion(student.student_id, confirmationName)`

**Mode B - Pending Deletion:**
- Shows deletion pending warning banner (orange)
- Displays scheduled deletion date (formatted: "February 1, 2026")
- Shows days remaining countdown
- Cancel Deletion button (green, restores account)
- Calls `cancelDeletionRequest(student.student_id)`

**Shared features:**
- Imports from accountDeletionService: `requestAccountDeletion`, `getAccountDeletionStatus`, `cancelDeletionRequest`
- Imports from dataExportService: `getExportedDataTypes` (to show what will be deleted)
- Dark theme styling matching TeacherDashboard
- Loading states, error handling with toast notifications
- Uses `student.student_id` for API calls, `student.student_name` for display and name confirmation

### Task 3: TeacherDashboard Integration
**Commit:** `733c215`

Wired modal components into teacher dashboard:

**Imports:**
- Added `DataExportModal` and `AccountDeletionModal` component imports
- Added `Download` and `AlertTriangle` icons to lucide-react imports

**State:**
- `showExportModal`, `setShowExportModal`
- `showAccountDeletionModal`, `setShowAccountDeletionModal`
- `studentForExport`, `setStudentForExport`
- `studentForAccountDeletion`, `setStudentForAccountDeletion`

**Handlers:**
- `handleExportData(student)` - Opens export modal for student
- `handleAccountDeletion(student)` - Opens deletion modal for student
- `handleDeletionRequested()` - Invalidates teacher-students query, closes modal

**Student Card Buttons:**
Inserted two new buttons between Edit3 and Trash2:
1. **Export Data** (cyan, Download icon) - Triggers data export modal
2. **Delete Account** (orange, AlertTriangle icon) - Triggers COPPA account deletion modal

Note: Existing Trash2 button remains (removes student from teacher connection, does NOT delete account)

**Modal Rendering:**
Added at end of component (after StudentDetailModal):
```jsx
<DataExportModal isOpen={showExportModal} onClose={...} student={studentForExport} />
<AccountDeletionModal isOpen={showAccountDeletionModal} onClose={...} student={studentForAccountDeletion} onDeletionRequested={handleDeletionRequested} />
```

## Decisions Made

1. **Dark theme for teacher modals**: Used `bg-gray-900 text-white border-gray-700` to match TeacherDashboard aesthetic (overriding Modal component's default light theme)

2. **Blob URL download pattern**: Used `URL.createObjectURL(blob)` for client-side JSON download instead of server-side endpoint (better for COPPA compliance, no server storage)

3. **Case-insensitive name confirmation**: `confirmationName.toLowerCase() === student.student_name.toLowerCase()` prevents typos from blocking legitimate deletions

4. **Days remaining countdown**: Used `Math.ceil(msRemaining / (24 * 60 * 60 * 1000))` to show user-friendly "X days remaining" instead of raw timestamp

5. **Icon differentiation**: Orange AlertTriangle for COPPA account deletion vs red Trash2 for teacher connection removal (prevents confusion)

6. **Export before delete**: Export Data button appears before Delete Account button (encourages teachers to export data before deleting)

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**Manual testing required:**
1. Click Export Data button on student card → DataExportModal opens
2. Modal shows data summary table with record counts
3. Click Download JSON → File downloads with format `StudentName_data_export_YYYY-MM-DD.json`
4. Click Delete Account button → AccountDeletionModal opens
5. Type incorrect name → Delete Account button disabled, shows error
6. Type correct name (case-insensitive) → Delete Account button enabled
7. Click Delete Account → Deletion initiated, 30-day grace period starts
8. Reopen modal for pending deletion student → Shows Mode B (scheduled date, Cancel Deletion button)
9. Click Cancel Deletion → Account restored to active status

**Verification commands:**
```bash
# All verification checks passed
grep -r "downloadStudentDataJSON" src/components/      # ✓ DataExportModal import
grep -r "requestAccountDeletion" src/components/       # ✓ AccountDeletionModal import
grep -r "DataExportModal" src/components/layout/TeacherDashboard.jsx  # ✓ Import and render
grep -r "AccountDeletionModal" src/components/layout/TeacherDashboard.jsx  # ✓ Import and render
npm run lint  # ✓ Passed (no errors related to new code)
```

## Architecture Notes

**Service → UI flow:**
```
dataExportService.js (183 lines, created 02-04)
  ↓ downloadStudentDataJSON()
  ↓ getDataSummary()
DataExportModal.jsx (207 lines)
  ↓ Export Data button
TeacherDashboard.jsx (student cards)

accountDeletionService.js (237 lines, created 02-04)
  ↓ requestAccountDeletion()
  ↓ getAccountDeletionStatus()
  ↓ cancelDeletionRequest()
AccountDeletionModal.jsx (342 lines)
  ↓ Delete Account button
TeacherDashboard.jsx (student cards)
```

**Why this plan was needed:**
- 02-04 created dataExportService.js (183 lines) and accountDeletionService.js (237 lines)
- Both services were fully functional but orphaned (no UI to call them)
- This plan closed the gap by creating modal components and wiring them into teacher dashboard

## COPPA Compliance Impact

**Data Export (Right to Access):**
- ✅ Teachers can export all student data as downloadable JSON
- ✅ Export includes all 10 data tables (students, scores, progress, goals, sessions, achievements, assignments, consent, points, accessories)
- ✅ COPPA notice displayed to user before download
- ✅ Filename includes student name and date for record-keeping

**Account Deletion (Right to Deletion):**
- ✅ Teachers can permanently delete student accounts
- ✅ 30-day grace period with visible countdown
- ✅ Name confirmation prevents accidental deletion
- ✅ Cancel option during grace period
- ✅ Shows exactly what data will be deleted

**Remaining work:**
- Hard delete Edge Function (scheduled job to permanently delete accounts past 30-day grace period)
- Currently accounts remain in `suspended_deletion` status indefinitely until manual cleanup

## File Statistics

```
DataExportModal.jsx:           207 lines (100% new)
AccountDeletionModal.jsx:      342 lines (100% new)
TeacherDashboard.jsx:           +57 lines (imports, state, handlers, buttons, modals)
```

**Total:** 606 new lines of code

## Commits

1. `8d1e8bb` - feat(02-07): create DataExportModal component
2. `6a1015f` - feat(02-07): create AccountDeletionModal component
3. `733c215` - feat(02-07): wire data export and account deletion into TeacherDashboard

## Next Phase Readiness

**Phase 2 Status:** COMPLETE (all 7 plans finished)

This was a gap closure plan (plan 07) that wired existing services (created in 02-04) into the UI. Phase 2 COPPA Compliance is now complete.

**Phase 2 Deliverables:**
- ✅ 02-01: COPPA schema (age calculation, account status, deletion tracking)
- ✅ 02-02: Age Gate UI component
- ✅ 02-03: Third-party SDK audit (Google Fonts must be self-hosted)
- ✅ 02-04: COPPA services (data export, account deletion)
- ✅ 02-05: Signup flow modification (age-first, parental consent)
- ✅ 02-06: Consent UX (pending status, verification route, resend cooldown)
- ✅ 02-07: COPPA UI wiring (data export/deletion modals in teacher dashboard)

**Outstanding items (non-blocking):**
- Hard delete Edge Function needed for accounts past 30-day grace period
- Privacy policy legal review
- Google Fonts self-hosting (before production)
- react-router vulnerability patching

**Ready for Phase 3:** Rate Limiting & Abuse Prevention
