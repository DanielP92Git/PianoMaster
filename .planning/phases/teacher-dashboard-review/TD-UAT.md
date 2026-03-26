---
status: complete
phase: teacher-dashboard-review
source: code-review (no SUMMARY.md - standalone audit)
started: 2026-03-26T12:00:00Z
updated: 2026-03-27T10:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Teacher Auto-Redirect
expected: When logged in as a teacher, navigating to "/" automatically redirects to "/teacher". The sidebar shows only the teacher dashboard nav item (GraduationCap icon). No student-specific nav items are visible.
result: pass

### 2. Student List Loading
expected: The teacher dashboard default view shows a "Students" tab with a list of all connected students. Each student card shows: name, level, XP, streak count, recent activity summary (color-coded), and last session details (duration + accuracy). A summary bar at top shows total students, active students, total practice, and average accuracy.
result: pass

### 3. Search Students
expected: Typing in the search bar filters the student list by first name, last name, or email in real-time. Clearing the search restores the full list.
result: pass

### 4. Filter Students
expected: Clicking the filter icon reveals filter options for: performance level, activity status, attendance range, streak range, XP range, and student level. Selecting a filter narrows the student list. Multiple filters can be combined. A "Clear Filters" option resets all.
result: pass

### 5. Add Student (Multi-Step Form)
expected: Clicking "Add Student" opens a modal with a multi-step form: Step 1 (name) -> Step 2 (level) -> Step 3 (studying year) -> Step 4 (email) -> Step 5 (start date, DD/MM/YYYY format). Each step validates before allowing "Next". On submit, a success toast appears and the student appears in the list.
result: issue
reported: "Registered email returns 409 conflict: duplicate key on students_email_key — RPC ON CONFLICT (id) doesn't catch email uniqueness. Unregistered email creates pending connection but getTeacherStudents only fetches status='accepted', so student never appears despite success toast."
severity: blocker

### 6. Edit Student Details
expected: Clicking the edit icon on a student opens a modal with tabbed sections: Basic Info (name, email), Contact (phone, parent email/phone), Learning (level, year, instrument, goals), Account (active/archived status). Changes save with a success toast.
result: issue
reported: "First edit works and saves. Re-opening edit modal on same student crashes: RangeError: Invalid time value at Date.toISOString (line 450). Root cause: member_since is stored as localized string 'DD/MM/YYYY' via toLocaleDateString('en-GB'), then new Date() can't parse it back. Also: 406 error on useAccountStatus querying account_status/parent_email/deletion_scheduled_at columns — some students always trigger this."
severity: blocker

### 7. View Student Detail Modal
expected: Clicking the eye/view icon on a student opens a comprehensive detail modal showing: performance metrics (level, attendance rate, recent activity), practice history with duration and accuracy, game scores grouped by type (collapsible sections), XP, level, and streak information.
result: pass

### 8. Send Message to Student
expected: Clicking the message icon on a student opens a modal to compose and send a message. On submit, a success toast appears confirming delivery.
result: pass
note: Student-side receipt not verified

### 9. Delete Single Student
expected: Clicking delete on a student shows a confirmation modal with the student's name. Confirming removes the student from the list with a success toast.
result: pass

### 10. Bulk Select & Delete Students
expected: Checkboxes appear on student cards for multi-select. Selecting multiple students enables a bulk delete button. Confirming deletion removes all selected students with a success toast showing count.
result: issue
reported: "1) Delete bulk button appears next to Teacher Dashboard title instead of inside My Students container. 2) Deletion modal text colors are unreadable against background. 3) Placeholder dev text visible: 'Students Tab Content — This is the students route working! The students content will be moved here.'"
severity: minor

### 11. Analytics Tab
expected: Clicking the "Analytics" tab navigates to "/teacher/analytics" and shows an analytics dashboard with: class performance chart, top performers leaderboard, practice activity timeline, and performance distribution visualization.
result: issue
reported: "Clicking the Trends button crashes with 'Oops! Something went wrong'. Other analytics sections work but the entire analytics feature needs replanning/research for what's actually useful for teachers."
severity: major

### 12. Recordings Review Tab
expected: Clicking the "Recordings" tab navigates to "/teacher/recordings" and shows practice session recordings from students. Each recording shows student name, date, and review status (pending_review, reviewed, needs_work, excellent). Audio playback is available. A badge on the tab shows count of new unreviewed recordings.
result: pass

### 13. Recording Feedback
expected: Opening a recording allows the teacher to listen to the audio, then set a review status and add written feedback. Saving updates the recording's status with a success toast.
result: pass

### 14. Assignments Tab
expected: Clicking the "Assignments" tab navigates to "/teacher/assignments" and shows existing assignments with: title, type, due date, points, and submission count. A "Create Assignment" button is available.
result: pass

### 15. Create Assignment
expected: Clicking "Create Assignment" opens a multi-step form with: title, description, instructions, assignment type (practice/exercise/assessment/project), due date, points possible, and configurable requirements (min sessions, practice time, target accuracy, practice mode). On submit, the assignment appears in the list.
result: issue
reported: "Form works and assignment is created, but there is no student selection — assignments aren't delivered to specific students, making the feature incomplete."
severity: major

### 16. Assignment Submissions & Grading
expected: Clicking an assignment shows student submissions with status (assigned, in_progress, submitted, graded, returned). Teacher can score submissions and provide written feedback. Saving updates the submission status.
result: issue
reported: "Clicking View (eye icon) pops error toast 'Failed to load assignment details'. Console: 400 Bad Request — PGRST200: Could not find a relationship between 'assignment_submissions' and 'students' in the schema cache. Missing FK relationship in database."
severity: blocker

### 17. Notifications Tab
expected: Clicking the "Notifications" tab navigates to "/teacher/notifications" and shows a notification center. Teacher can send targeted notifications to students with configurable type (message, achievement, assignment, reminder) and priority (low, normal, high, urgent). Existing notifications can be archived or deleted.
result: issue
reported: "Send notification modal works (select student, type, priority, title, message). Clicking send closes modal with success toast. No console errors. But the sent notification doesn't appear in the notifications list on screen."
severity: major

### 18. Data Export
expected: Clicking the export/download icon on a student opens a Data Export modal showing a data summary (practice sessions count, recordings count, assignments). Clicking export downloads a JSON file with timestamped filename containing the student's performance data.
result: pass
note: Works technically but needs COPPA legal review — exporting student data may have compliance implications.

### 19. Student Account Deletion
expected: In the edit student modal's Account tab, there is an option to request account deletion. This opens a confirmation modal with data protection notices. Confirming triggers the deletion workflow.
result: issue
reported: "Feature works technically but should NOT exist in teacher dashboard. Teachers should not have power to permanently delete a student's account — that's a decision for the student/parent only. This is both a UX confusion and a COPPA/authorization concern. AccountDeletionModal should be removed from teacher dashboard."
severity: major

### 20. Mobile Responsive Layout
expected: On mobile screen sizes, the teacher dashboard adapts: tab navigation becomes scrollable/compact, student cards stack vertically, modals are full-screen or appropriately sized, and all functionality remains accessible.
result: issue
reported: "1) Edit student modal tabs overflow — hidden tabs can't be scrolled to, dragging moves the entire modal instead. Needs horizontal scroll with overflow hint like main dashboard. 2) Analytics page same tab scrolling issue. 3) Recordings container has very messy mobile UI, needs serious redesign. 4) Assignments container layout issues on mobile. 5) Notifications filter container needs UI tune-up (Unread only label misaligned)."
severity: cosmetic

### 21. Real-Time Recording Notifications
expected: When a student submits a new practice recording, the recordings tab badge count updates (polling every 30 seconds). The badge reflects unreviewed recordings since the teacher's last visit to the recordings tab.
result: blocked
blocked_by: other
reason: "Student recording feature crashes: AudioRecorder.jsx:288 ReferenceError: Cannot access 'stopRecording' before initialization. Cannot create test recordings to verify teacher-side notification."

## Summary

total: 21
passed: 10
issues: 9
pending: 0
skipped: 0
blocked: 1

## Gaps

- truth: "Adding a student with a registered email should create the connection and show them in the list"
  status: failed
  reason: "User reported: 409 conflict on students_email_key unique constraint. RPC ON CONFLICT (id) doesn't catch email uniqueness."
  severity: blocker
  test: 5
  root_cause: "teacher_link_student RPC does INSERT INTO students ON CONFLICT (id) but the email column has a separate unique constraint (students_email_key). When student already exists in students table, insert hits email conflict before id conflict handler."
  artifacts:
    - path: "supabase/migrations/20251129000001_teacher_student_linking.sql"
      issue: "ON CONFLICT (id) doesn't handle email uniqueness"
    - path: "src/services/apiTeacher.js"
      issue: "addStudentToTeacher calls teacher_link_student RPC"
  missing:
    - "RPC should handle ON CONFLICT (id) OR (email), or check existence before insert"

- truth: "Adding a student with an unregistered email should show them in the list (even as pending)"
  status: failed
  reason: "User reported: success toast fires but student never appears. getTeacherStudents only fetches status='accepted' connections."
  severity: blocker
  test: 5
  root_cause: "getTeacherStudents queries teacher_student_connections with .eq('status', 'accepted'), but teacher_link_student creates pending connections for unregistered emails."
  artifacts:
    - path: "src/services/apiTeacher.js:98"
      issue: "getTeacherStudents filters to status='accepted' only"
    - path: "supabase/migrations/20251129000001_teacher_student_linking.sql:178"
      issue: "Connection status is 'pending' for unregistered emails"
  missing:
    - "Either show pending students in UI with pending badge, or change RPC to set accepted status for teacher-added students"

- truth: "Re-opening edit modal on same student should work without errors"
  status: failed
  reason: "User reported: RangeError: Invalid time value at Date.toISOString — crash on second edit"
  severity: blocker
  test: 6
  root_cause: "member_since is formatted as localized string 'DD/MM/YYYY' via toLocaleDateString('en-GB') in getTeacherStudents (line 230-231). EditStudentModal line 450 then tries new Date('26/03/2026').toISOString() which creates Invalid Date because DD/MM/YYYY isn't parseable by Date constructor."
  artifacts:
    - path: "src/services/apiTeacher.js:230-231"
      issue: "member_since stored as localized date string instead of ISO format"
    - path: "src/components/layout/TeacherDashboard.jsx:450"
      issue: "new Date(member_since).toISOString() fails on non-ISO date strings"
  missing:
    - "Store member_since as ISO date string, format for display only in UI"

- truth: "Delete bulk button should be inside My Students container"
  status: failed
  reason: "User reported: button appears next to Teacher Dashboard title. Modal text colors unreadable. Placeholder dev text visible."
  severity: minor
  test: 10
  root_cause: "Delete Selected button is rendered in the dashboard header instead of the My Students section. DeleteConfirmationModal uses wrong text colors for glass/dark background. Placeholder text block not removed."
  artifacts:
    - path: "src/components/layout/TeacherDashboard.jsx"
      issue: "Delete button placement, modal colors, leftover placeholder text"
  missing:
    - "Move delete button into My Students container"
    - "Fix modal text colors for readability"
    - "Remove placeholder dev text"

- truth: "Analytics Trends view should load without crashing"
  status: failed
  reason: "User reported: clicking Trends button crashes. Feature needs replanning."
  severity: major
  test: 11
  root_cause: "Trends component crashes on render — likely data/prop issue"
  artifacts:
    - path: "src/components/charts/AnalyticsDashboard.jsx"
      issue: "Trends tab crashes"
  missing:
    - "Debug crash, then replan analytics feature for teacher usefulness"

- truth: "Assignments should be assignable to specific students"
  status: failed
  reason: "User reported: no student selection in create form — assignments aren't delivered to specific students"
  severity: major
  test: 15
  root_cause: "CreateAssignment form has no student picker. Assignments are created globally but have no delivery mechanism to specific students."
  artifacts:
    - path: "src/components/teacher/AssignmentManagement.jsx"
      issue: "No student selection in assignment creation flow"
  missing:
    - "Add student multi-select to assignment creation"
    - "Create assignment_submissions records for selected students on creation"

- truth: "Viewing assignment details should show student submissions"
  status: failed
  reason: "User reported: 400 Bad Request — PGRST200: Could not find FK between assignment_submissions and students"
  severity: blocker
  test: 16
  root_cause: "getAssignmentSubmissions tries to join assignment_submissions with students table but no foreign key relationship exists in the database schema."
  artifacts:
    - path: "src/services/apiTeacher.js"
      issue: "getAssignmentSubmissions query assumes FK that doesn't exist"
    - path: "supabase/migrations/"
      issue: "Missing FK from assignment_submissions.student_id to students.id"
  missing:
    - "Add FK constraint from assignment_submissions.student_id to students.id"
    - "Or restructure query to avoid join"

- truth: "Sent notifications should appear in the notifications list"
  status: failed
  reason: "User reported: success toast fires but notification doesn't appear in list"
  severity: major
  test: 17
  root_cause: "Likely invalidateQueries using v4 array syntax instead of v5 object syntax, or the fetch query filters don't match what was just created"
  artifacts:
    - path: "src/components/teacher/NotificationCenter.jsx"
      issue: "Sent notification not appearing after creation"
  missing:
    - "Fix query invalidation and/or fetch filter to include newly created notifications"

- truth: "Teacher dashboard should NOT have student account deletion capability"
  status: failed
  reason: "User reported: teachers should not be able to permanently delete student accounts — only parents/students should"
  severity: major
  test: 19
  root_cause: "AccountDeletionModal is included in teacher dashboard but teachers are not account owners. This is a COPPA/authorization concern."
  artifacts:
    - path: "src/components/layout/TeacherDashboard.jsx:2689-2694"
      issue: "AccountDeletionModal rendered in teacher dashboard"
    - path: "src/components/teacher/AccountDeletionModal.jsx"
      issue: "Component should only be accessible from Parent Portal"
  missing:
    - "Remove AccountDeletionModal from TeacherDashboard"
    - "Remove account deletion option from edit student Account tab"

- truth: "Mobile responsive layout should be usable across all tabs"
  status: failed
  reason: "User reported: edit modal tabs overflow without scroll, analytics tabs clipped, recordings/assignments/notifications need mobile redesign"
  severity: cosmetic
  test: 20
  root_cause: "Tab containers lack overflow-x-auto and scroll hint UI. Subpage layouts not optimized for mobile viewports."
  artifacts:
    - path: "src/components/layout/TeacherDashboard.jsx"
      issue: "Edit modal tab overflow"
    - path: "src/components/teacher/RecordingsReview.jsx"
      issue: "Mobile layout messy"
    - path: "src/components/teacher/AssignmentManagement.jsx"
      issue: "Mobile layout issues"
    - path: "src/components/teacher/NotificationCenter.jsx"
      issue: "Filter container misalignment"
  missing:
    - "Add horizontal tab scroll with overflow hints"
    - "Mobile-first redesign pass for all teacher subpages"
