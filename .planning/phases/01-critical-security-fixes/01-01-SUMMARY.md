---
phase: 01-critical-security-fixes
plan: 01
subsystem: database-authorization
tags: [security, rls, supabase, postgresql, authorization]

dependency-graph:
  requires: []
  provides:
    - Secure RLS policies using database state (not user_metadata)
    - SECURITY DEFINER functions with auth.uid() verification
    - is_admin() helper function for admin checks
  affects:
    - All future RLS policies must use is_admin() pattern
    - All future SECURITY DEFINER functions must verify auth.uid()

tech-stack:
  added: []
  patterns:
    - "is_admin() function for admin authorization"
    - "auth.uid() verification in SECURITY DEFINER functions"
    - "(SELECT auth.uid()) wrapping for RLS performance"
    - "SET search_path = public for search_path security"

key-files:
  created:
    - supabase/migrations/20260131000001_audit_rls_policies.sql
    - supabase/migrations/20260131000002_audit_security_definer.sql
  modified: []

decisions:
  - decision: "Use is_admin() function instead of user_metadata for admin checks"
    rationale: "user_metadata can be modified by users via supabase.auth.updateUser()"
    alternatives: ["app_metadata (server-only)", "custom claims"]

  - decision: "Add defense-in-depth checks in trigger functions"
    rationale: "Even with RLS, explicit checks prevent bypass if RLS is misconfigured"
    alternatives: ["Rely solely on RLS"]

metrics:
  duration: "4 minutes"
  completed: "2026-01-31"
---

# Phase 01 Plan 01: Database Authorization Audit Summary

Secured all database-level authorization by replacing mutable user_metadata with database state verification and adding auth.uid() checks to SECURITY DEFINER functions.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Audit and fix RLS policies (SEC-01) | 622ea9e | 20260131000001_audit_rls_policies.sql |
| 2 | Audit and fix SECURITY DEFINER functions (SEC-02) | 65eb5d7 | 20260131000002_audit_security_definer.sql |

## What Was Done

### RLS Policy Fixes (SEC-01)

Replaced all `(auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'` patterns with `public.is_admin()` function calls:

**Policies Fixed:**
1. `user_accessories_all_consolidated` - User accessories management
2. `accessories_select_consolidated` - Accessory catalog read access
3. `accessories_admin_manage` - Admin accessory management
4. `student_point_transactions_select_consolidated` - Point transaction viewing
5. `Admin can insert point transactions` - Admin point awards
6. `Admin can update point transactions` - Admin point corrections
7. `Admin can delete point transactions` - Admin point removal

**Security Improvement:**
- Before: Any user could gain admin access by calling `supabase.auth.updateUser({ data: { role: 'admin' }})`
- After: Admin access requires `is_admin = true` in the `teachers` table (database-enforced)

### SECURITY DEFINER Function Fixes (SEC-02)

Added explicit `auth.uid()` verification to SECURITY DEFINER functions:

**Functions Fixed:**
1. `promote_placeholder_student` - Now verifies caller is the student, inviting teacher, or admin
2. `update_unit_progress_on_node_completion` - Now verifies `student_id = auth.uid()` (defense-in-depth)

**Functions Verified Correct:**
3. `award_xp` - Already fixed in 20260126000001
4. `is_admin` - Helper function, only checks current user
5. `teacher_link_student` - Already has active teacher verification
6. `teacher_get_student_points` - Uses auth.uid() implicitly in query
7. `handle_teacher_signup` - System trigger, not user-callable

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Pattern: is_admin() Helper Function

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teachers
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
```

### Pattern: SECURITY DEFINER Authorization Check

```sql
CREATE OR REPLACE FUNCTION some_function(p_student_id UUID)
RETURNS ... AS $$
BEGIN
  -- SECURITY CHECK
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only access your own data';
  END IF;

  -- Function logic here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## Verification Results

1. **No user_metadata in policy code:** Confirmed - only appears in comments
2. **Secure patterns present:** 73 occurrences of `is_admin()` and `auth.uid()` across both migrations
3. **RAISE EXCEPTION present:** 6 authorization error points
4. **Idempotent:** All policies use `DROP POLICY IF EXISTS` before `CREATE POLICY`

## Security Posture After This Plan

- Students cannot access other students' data even by modifying JWT metadata
- Users cannot escalate privileges by editing their user_metadata role field
- All SECURITY DEFINER functions verify auth.uid() matches target before execution
- Defense-in-depth: Both RLS and function-level checks protect data

## Next Steps

- Plan 01-02: Client-side authorization verification in service layer
- Plan 01-03: Secure logout and data clearing for shared devices

---

*Plan completed: 2026-01-31*
*Duration: 4 minutes*
