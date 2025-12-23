# Accessories Feature Test Plan

## 1. Avatar Assets Mapping

- Select each available avatar and confirm the image resolves from bundled assets when available.
- Toggle between teacher and student profiles to ensure legacy `image_url` records still display correctly.

## 2. Accessories Shop & Loadout

- Open `/avatars` and verify the preview card reflects currently equipped accessories.
- Attempt to purchase an accessory with insufficient points and confirm the action is disabled.
- Purchase an accessory with enough points; ensure it appears under “My Accessories” and the balance updates.
- Equip and unequip items while confirming the status badge and preview update instantly.

## 3. Header Rendering

- Refresh the dashboard; header avatar should display equipped accessories without reloading the whole page.
- Unequip an item and confirm the overlay disappears after the mutation succeeds.

## 4. Offline & Caching

- Load the accessories page, then go offline (DevTools > Network > Offline).
- Reload and confirm previously fetched Supabase accessory images are served from the cache.
- Verify the rest of the PWA continues to use the offline page fallback for navigation requests.

## 5. Error Handling

- Force a network failure (DevTools > Request blocking) during purchase to ensure the UI surfaces `toast` errors.
- Simulate Supabase errors by providing an invalid session token and confirm mutations report failures cleanly.

## 6. RLS (Row Level Security) Checks

These checks validate that RLS is enabled and your app flows still work with RLS policies applied.

### 6.1 Policy presence (Supabase SQL Editor)

Run:

```sql
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('accessories', 'user_accessories', 'student_point_transactions');

select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('accessories', 'user_accessories', 'student_point_transactions')
order by tablename, policyname;
```

### 6.2 App smoke test (Student)

- Log in as a student and open `/avatars`.
- Verify the catalog loads (accessories query succeeds).
- Purchase an accessory:
  - `user_accessories` insert should succeed.
  - `student_point_transactions` insert should succeed and must be a **negative delta**.
- Equip/unequip and drag-position an accessory (updates on `user_accessories.custom_metadata` should succeed).

### 6.3 Negative test (prevent point forgery)

- In DevTools > Console, attempt to run a manual insert to `student_point_transactions` with a **positive delta** (or use a custom request).
- Expect the insert to be rejected by RLS.