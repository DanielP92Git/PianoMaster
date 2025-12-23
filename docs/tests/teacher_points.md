# Teacher Dashboard Points Debug

This project used to store student totals in `students_total_score`. That table was removed in
`supabase/migrations/20251207000004_drop_students_total_score_table.sql`.

Teacher dashboards now need to read totals derived from:

- `students_score.score` (gameplay points)
- `student_achievements.points` (achievement points)

To make this reliable even when RLS policies are consolidated, we added an RPC:
`teacher_get_student_points()` (see `supabase/migrations/20251215000001_restore_teacher_points_access.sql`).

## Quick manual check

1. Start two dev servers:
   - student: `http://localhost:5174`
   - teacher: `http://localhost:5175`
2. Log in as a student in the student window and complete an exercise that records a score.
3. Log in as the teacher in the teacher window and open the Students list.
4. Confirm each connected student shows a non-zero **Total Points** once they have scores/achievements.

## Scripted check (RPC)

This calls `teacher_get_student_points()` with a teacher access token so `auth.uid()` is set.

1. In the teacher browser window, open DevTools and find the Supabase session access token.
   - Usually in `localStorage` under a key starting with `sb-` and containing `access_token`.
2. Run:

```bash
set SUPABASE_URL=<your_supabase_url>
set SUPABASE_ANON_KEY=<your_anon_key>
set TEACHER_ACCESS_TOKEN=<teacher_access_token>
node scripts/verify-teacher-points.mjs
```

If you have connected students but the RPC returns an empty array, check:

- `teacher_student_connections.status` is `accepted`
- The teacher is authenticated in Supabase (valid JWT)
- Migration `20251215000001_restore_teacher_points_access.sql` has been applied

## Ledger (student_point_transactions) access

Teachers may also need to read the **ledger** for connected students when investigating spend/refunds.
RLS for `student_point_transactions` is enabled and should allow:

- Student: read own rows
- Teacher: read rows for connected students (`teacher_student_connections.status = 'accepted'`)
- Admin/service_role: read/write all

Quick check (Supabase SQL Editor):

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'student_point_transactions'
order by policyname;
```




