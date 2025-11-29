# Teacher ↔ Student Linking Rules

## Canonical identifiers

- `students.id` is always the Supabase `auth.users.id` for enrolled students.
- Practice data (`practice_sessions.student_id`), scores (`students_total_score.student_id`), streak tables, assignments, and teacher connections must reference that same UUID so historical data aggregates correctly.

## Email normalization

- Normalize emails with `email = trim(lower(email))` before persisting anywhere (auth sign-up, students, teachers, invitations).
- Add a functional index on `lower(students.email)` to make lookups deterministic and prevent case-based duplicates.

## Placeholder students

- Teachers may still pre-create “placeholder” students when a learner has not signed up yet.
- Placeholder rows are marked with `is_placeholder = true`, `invited_by_teacher`, and `pending_email`. They never receive practice data because they do not have an auth identity yet.
- When the real student signs up, we merge the placeholder via `promote_placeholder_student`, re-pointing every referencing row (connections, assignments, notifications, streaks) to the real `auth.users.id` and then archiving the placeholder row.

## Linking flow (teacher adds by email)

1. Front-end calls the RPC `teacher_link_student` with the normalized email plus optional metadata (names, study year, start date).
2. The function (security definer) validates the caller is a teacher, normalizes the email, and tries to find an `auth.users` record with that email.
3. If found:
   - Ensures a `students` profile exists for that UUID (upsert).
   - Inserts/updates `teacher_student_connections` with `status = 'accepted'` and the provided `connected_at`.
   - Returns student + connection info so the UI can immediately display historical practice data.
4. If no auth user exists yet:
   - Creates/updates a placeholder student row linked to the inviting teacher.
   - Returns `needs_signup = true` so the UI can show an onboarding reminder.

## Student signup flow

- After a student completes signup, the client calls `promote_placeholder_student`. The function:
  1. Normalizes the student’s email.
  2. Finds any placeholder rows with the same normalized email.
  3. Moves every dependent record (`teacher_student_connections`, `assignment_submissions`, `notifications`, etc.) to the real student UUID.
  4. Deletes (or archives) the obsolete placeholder rows.

## RLS and safety considerations

- Teachers still cannot arbitrarily `SELECT` from `students`; the linking RPC is the only path that can resolve an email to a UUID, and it requires knowledge of the email plus an authenticated teacher session.
- All inserts/updates continue to reference `teacher_student_connections` so downstream policies (`students_total_score`, `current_streak`, `practice_sessions`) guard access based on accepted connections.

## Required implementation pieces

- SQL migration that adds placeholder metadata columns, the `teacher_link_student` and `promote_placeholder_student` RPCs, and the `lower(email)` index.
- Front-end updates (`useSignup`, `apiTeacher.addStudentToTeacher`) to normalize emails and call the new RPCs.
- Backfill script to migrate existing duplicate students: re-link connections by email to the real UUIDs and archive the orphan placeholders.
