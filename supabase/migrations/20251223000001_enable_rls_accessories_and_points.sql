-- Enable RLS for accessories + points ledger tables
-- Ensures:
-- - Students can read the accessory catalog and manage their own owned accessories
-- - Students can only INSERT negative point deltas (spending) for purchases
-- - Teachers can read connected students' point transactions
-- - Admin/service_role can manage everything
--
-- Generated on 2025-12-23

begin;

-- 1) Enable RLS (safe if already enabled)
alter table public.accessories enable row level security;
alter table public.user_accessories enable row level security;
alter table public.student_point_transactions enable row level security;

-- Helper predicate: admin user via JWT user_metadata.role
-- NOTE: teachers are inferred via teacher_student_connections, not via JWT role.

-- =========================
-- accessories (catalog)
-- =========================
drop policy if exists "Students can read accessories" on public.accessories;
create policy "Students can read accessories"
on public.accessories
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = (select auth.uid())
  )
  or (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admin can manage accessories" on public.accessories;
create policy "Admin can manage accessories"
on public.accessories
for all
to authenticated
using (
  (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- =========================
-- user_accessories (ownership/equipped state)
-- =========================
drop policy if exists "Students can manage own accessories" on public.user_accessories;
create policy "Students can manage own accessories"
on public.user_accessories
for all
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);

drop policy if exists "Admin can manage user accessories" on public.user_accessories;
create policy "Admin can manage user accessories"
on public.user_accessories
for all
to authenticated
using (
  (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- =========================
-- student_point_transactions (ledger)
-- =========================
drop policy if exists "Students can read own point transactions" on public.student_point_transactions;
create policy "Students can read own point transactions"
on public.student_point_transactions
for select
to authenticated
using (
  student_id = (select auth.uid())
);

drop policy if exists "Teachers can read connected students point transactions" on public.student_point_transactions;
create policy "Teachers can read connected students point transactions"
on public.student_point_transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.teacher_student_connections tsc
    where tsc.teacher_id = (select auth.uid())
      and tsc.student_id = public.student_point_transactions.student_id
      and tsc.status = 'accepted'
  )
);

drop policy if exists "Admin can read point transactions" on public.student_point_transactions;
create policy "Admin can read point transactions"
on public.student_point_transactions
for select
to authenticated
using (
  (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Students may record SPENDING only (negative deltas) to support in-app purchases.
drop policy if exists "Students can record point spending" on public.student_point_transactions;
create policy "Students can record point spending"
on public.student_point_transactions
for insert
to authenticated
with check (
  student_id = (select auth.uid())
  and delta <= 0
);

-- Admin/service_role can write any transactions (awards, adjustments, refunds, etc.)
drop policy if exists "Admin can insert point transactions" on public.student_point_transactions;
create policy "Admin can insert point transactions"
on public.student_point_transactions
for insert
to authenticated
with check (
  (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admin can update point transactions" on public.student_point_transactions;
create policy "Admin can update point transactions"
on public.student_point_transactions
for update
to authenticated
using (
  (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admin can delete point transactions" on public.student_point_transactions;
create policy "Admin can delete point transactions"
on public.student_point_transactions
for delete
to authenticated
using (
  (select auth.role()) = 'service_role'
  or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

commit;


