---
status: investigating
trigger: "Investigate why updating an assignment via the teacher dashboard returns a 400 error from Supabase"
created: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Focus

hypothesis: The update payload includes `assign_to` which does not exist as a column in the `assignments` table
test: Compare update payload fields against table schema
expecting: Column mismatch confirmed
next_action: Confirm root cause and report

## Symptoms

expected: Editing an assignment and saving should update it successfully
actual: Supabase REST API returns HTTP 400
errors: "Error updating assignment" (Object), "Update assignment error" (Object), HTTP 400
reproduction: Edit any assignment in teacher dashboard, modify fields, click save
started: Unknown

## Eliminated

## Evidence

- timestamp: 2026-04-08T00:01:00Z
  checked: assignments table schema in migration 20250625120001
  found: Table columns are: id, created_at, updated_at, teacher_id, class_id, title, description, instructions, assignment_type, due_date, points_possible, is_active, requirements
  implication: No `assign_to` column exists in the table

- timestamp: 2026-04-08T00:02:00Z
  checked: handleUpdateAssignment in AssignmentManagement.jsx (line 718-731)
  found: Update payload sends `assign_to: formData.assignTo` as a column in the update object
  implication: This field does not exist in the DB schema, causing a 400

- timestamp: 2026-04-08T00:03:00Z
  checked: createAssignment in apiTeacher.js (line 942-982)
  found: The CREATE function correctly does NOT include assign_to in the insert payload. It uses assignTo only AFTER insert to determine which students get submission records.
  implication: The update function incorrectly treats assign_to as a table column, while the create function correctly handles it as application logic

- timestamp: 2026-04-08T00:04:00Z
  checked: All migrations for ALTER TABLE assignments ADD
  found: No migration ever adds an assign_to column
  implication: Confirms assign_to has never been part of the schema

## Resolution

root_cause: The `handleUpdateAssignment` function in AssignmentManagement.jsx (line 728) includes `assign_to: formData.assignTo` in the update payload object. The `assignments` table has no `assign_to` column. Supabase PostgREST rejects the PATCH request with HTTP 400 because it encounters an unknown column name.
fix: Remove `assign_to` from the update payload in handleUpdateAssignment (line 728). If reassignment logic is needed on update, it should be handled separately (like createAssignment does) by modifying assignment_submissions, not by writing to a nonexistent column.
verification: pending
files_changed: [src/components/teacher/AssignmentManagement.jsx]
