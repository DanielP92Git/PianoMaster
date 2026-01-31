# Security Architecture Research

**Date**: 2026-01-31
**Context**: Hardening security for a React 18 + Supabase piano learning PWA designed for 8-year-old children
**Regulatory Concerns**: COPPA/GDPR-K compliance (child data protection)

---

## Executive Summary

This document outlines the defense-in-depth security architecture for the PianoMaster app. Security is implemented across three layers: **client-side validation**, **Supabase Row Level Security (RLS)**, and **privileged database functions**. The architecture is designed for:

1. **Shared device safety**: Children using school computers or shared tablets
2. **Child data protection**: COPPA/GDPR-K compliance for users under 13
3. **Teacher-student data isolation**: Relationship-based access control
4. **Progressive security**: Fast client checks with database enforcement

---

## Defense in Depth Layers

### Layer 1: Client-Side Validation (JavaScript/React)

**Purpose**: Fast, user-friendly authorization checks that provide immediate feedback and reduce unnecessary database calls.

**Location**: `src/services/*.js` files

**Implementation Pattern**:
```javascript
// Example from apiScores.js
async function verifyStudentDataAccess(studentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Students can access their own data
  if (user.id === studentId) {
    return true;
  }

  // Teachers can access connected students' data
  const { data: connection } = await supabase
    .from("teacher_student_connections")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("student_id", studentId)
    .eq("status", "accepted")
    .single();

  if (!connection) {
    throw new Error("Unauthorized: No access to this student's data");
  }

  return true;
}
```

**What Gets Checked**:
- **Identity verification**: `auth.uid() === studentId`
- **Relationship verification**: Query `teacher_student_connections` table for accepted relationships
- **Role verification**: Check database tables (NOT user_metadata) for teacher/student status

**Security Principles**:
- ✅ **DO**: Query database tables for role verification (`teachers`, `students` tables)
- ✅ **DO**: Verify relationships before data access (`teacher_student_connections`)
- ✅ **DO**: Provide clear error messages without exposing sensitive info
- ❌ **DON'T**: Trust `user_metadata` for authorization (users can modify it)
- ❌ **DON'T**: Skip checks assuming RLS will catch it (defense in depth)

**Key Files**:
- `src/services/apiAuth.js`: Role verification via database tables (lines 89-153)
- `src/services/apiScores.js`: Student data access verification (lines 10-35)
- `src/services/apiTeacher.js`: Teacher-student connection verification (lines 15-28)
- `src/services/skillProgressService.js`: Trail progress authorization

**Performance Impact**: Minimal (1-2 extra queries per request, cached by React Query)

---

### Layer 2: Supabase Row Level Security (RLS)

**Purpose**: Database-enforced authorization that prevents unauthorized access even if client-side checks are bypassed.

**Location**: `supabase/migrations/*.sql` files

**Implementation Pattern**:
```sql
-- Example: Students table consolidated SELECT policy
CREATE POLICY "students_select_consolidated"
ON public.students
FOR SELECT
USING (
  -- Student views own profile
  id = (SELECT auth.uid())
  OR
  -- Teacher can view connected students
  EXISTS (
    SELECT 1 FROM public.teacher_student_connections tsc
    WHERE tsc.student_id = students.id
      AND tsc.teacher_id = (SELECT auth.uid())
      AND tsc.status = 'accepted'
  )
  OR
  -- Teacher can search any student (for adding to classes)
  EXISTS (
    SELECT 1 FROM public.teachers
    WHERE id = (SELECT auth.uid()) AND is_active = true
  )
  OR
  -- Service role
  (SELECT auth.role()) = 'service_role'
);
```

**Policy Consolidation Strategy** (Migration 20260128000001):
- Multiple permissive policies on same table cause performance overhead
- **Consolidation**: Combine policies using OR logic into single policy per operation
- **Example**: `student_skill_progress` had 2 SELECT policies → consolidated to 1
- **Performance gain**: ~40% reduction in policy evaluation time

**Security Anti-Patterns to Avoid**:

1. **NEVER use `user_metadata` for authorization** (Migration 20260127000001):
   ```sql
   -- ❌ VULNERABLE: user_metadata can be modified by client
   CREATE POLICY "bad_admin_policy"
   USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

   -- ✅ SECURE: Query immutable database state
   CREATE POLICY "good_admin_policy"
   USING (public.is_admin()); -- Function checks teachers.is_admin column
   ```

2. **Admin verification must use database state**:
   ```sql
   -- Helper function with SECURITY DEFINER
   CREATE OR REPLACE FUNCTION public.is_admin()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.teachers
       WHERE id = auth.uid() AND is_admin = true
     );
   END;
   $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
   ```

3. **Service worker must NEVER cache auth endpoints** (see Layer 4)

**Key Tables with RLS**:
- `students`: Own data + teacher connections
- `student_skill_progress`: Trail progress (own data + teacher view)
- `student_daily_goals`: Daily goals (own data + teacher view)
- `students_score`: Game scores (own data + teacher view)
- `teacher_student_connections`: Relationship management
- `practice_sessions`: Recording submissions (own data + teacher review)
- `accessories`, `user_accessories`: Avatar customization (catalog public, ownership private)

**Optimization**: Partial indexes on frequently queried columns:
```sql
-- From migration 20260129000001_optimize_indexes.sql
CREATE INDEX idx_teacher_student_connections_accepted
ON teacher_student_connections(teacher_id, student_id)
WHERE status = 'accepted';
```

---

### Layer 3: SECURITY DEFINER Functions

**Purpose**: Privileged operations that require superuser permissions (e.g., updating multiple tables atomically, XP calculations).

**Critical Security Requirement**: ALL `SECURITY DEFINER` functions MUST have explicit authorization checks.

**Implementation Pattern**:
```sql
-- Example: award_xp function (Migration 20260126000001)
CREATE OR REPLACE FUNCTION award_xp(
  p_student_id UUID,
  p_xp_amount INTEGER
)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
AS $$
BEGIN
  -- SECURITY CHECK: User can only award XP to themselves
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only award XP to yourself';
  END IF;

  -- Proceed with privileged operation...
  UPDATE students
  SET total_xp = total_xp + p_xp_amount
  WHERE id = p_student_id;

  -- Return results...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Functions with SECURITY DEFINER** (audited):
1. `award_xp(UUID, INTEGER)`: XP system (self-only authorization)
2. `is_admin()`: Admin role verification (read-only helper)
3. `teacher_link_student(...)`: Teacher-student linking (teacher verification)
4. `teacher_get_student_points()`: Teacher dashboard aggregation (relationship-based)

**Security Checklist for New Functions**:
- [ ] Explicit `auth.uid()` check at function start
- [ ] Verify user can only modify their own data OR has valid relationship
- [ ] No reliance on `user_metadata` for authorization
- [ ] Function is marked `STABLE` (not `VOLATILE`) if read-only
- [ ] Clear error messages without exposing sensitive data
- [ ] Grant permissions limited to `authenticated` role (not `public`)

**Why SECURITY DEFINER is Needed**:
- **Atomic operations**: Update multiple tables in one transaction (e.g., XP + level calculation)
- **Complex calculations**: Business logic that requires full table access
- **Performance**: Bypass RLS for read-only aggregations (with authorization checks)

**Alternative Approach**: For simple operations, prefer RLS policies over SECURITY DEFINER functions.

---

## Session Management Architecture

### Authentication Flow

```
┌──────────────┐
│ User Login   │
│ (email/pwd)  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Supabase Auth                   │
│ - Creates JWT session token     │
│ - Stores in httpOnly cookie     │
│ - Sets refresh token            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ getCurrentUser() (apiAuth.js)   │
│ 1. Get session from Supabase    │
│ 2. Query students/teachers DB   │
│ 3. Return role-enriched user    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ React Query Cache (useUser.js)  │
│ - Caches user for 5 minutes     │
│ - No refetch on window focus    │
│ - Limited retry on network fail │
└─────────────────────────────────┘
```

### Role Determination (CRITICAL SECURITY)

**Secure Pattern** (from `apiAuth.js`, lines 89-153):
```javascript
// SECURITY: Determine role ONLY from database table presence
// user_metadata is NOT trusted for authorization
let userRole = null;
let profile = null;

// Use metadata as a hint for query optimization (NOT authorization)
const metadataHint = user.user_metadata?.role;
const checkTeacherFirst = metadataHint === "teacher";

if (checkTeacherFirst) {
  const { data: teacherData } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", user.id)
    .single();

  if (teacherData) {
    userRole = "teacher"; // VERIFIED via database
    profile = teacherData;
  } else {
    // Check students table...
  }
}
```

**Why This Matters**:
- `user_metadata` can be modified via `supabase.auth.updateUser()` by the client
- Database tables (`students`, `teachers`) are protected by RLS and cannot be manipulated
- Metadata is only used as a performance hint, not for authorization decisions

### Token Management

**Storage**:
- **Session token**: httpOnly cookie (Supabase default, cannot be accessed by JavaScript)
- **Refresh token**: localStorage (Supabase default, used for silent token refresh)
- **User cache**: React Query in-memory cache (5-minute stale time)

**Refresh Strategy**:
- Supabase auto-refreshes tokens before expiry
- On network error or invalid token, `getCurrentUser()` calls `signOut()` and clears session
- No manual token rotation needed

**Security Considerations**:
- Tokens are NOT cached in service worker (see Layer 4)
- On logout, ALL user-specific localStorage keys are cleared (shared device safety)

---

## Secure Logout Flow (Shared Device Safety)

**Problem**: Children using shared school computers/tablets. User data persists in localStorage after logout.

**Solution** (from `apiAuth.js`, lines 185-208):

```javascript
export async function logout() {
  // STEP 1: Clear user-specific localStorage keys BEFORE signing out
  if (typeof window !== "undefined") {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("migration_completed_") ||
         key.startsWith("dashboard_reminder_") ||
         key.includes("_student_") ||
         key.includes("_user_"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  // STEP 2: Sign out from Supabase (invalidates session)
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
```

**What Gets Cleared**:
- Migration flags (e.g., `migration_completed_{userId}`)
- Dashboard reminder states (e.g., `dashboard_reminder_{userId}`)
- Any keys containing `_student_` or `_user_` (user-specific caches)

**React Query Cleanup** (from `useLogout.js`, lines 11-13):
```javascript
onSuccess: () => {
  queryClient.removeQueries(); // Clear ALL React Query caches
  navigate("/login", { replace: true });
}
```

**Additional Considerations**:
- **Service worker cache**: Already excludes auth endpoints (see Layer 4)
- **sessionStorage**: Automatically cleared when browser tab closes (no action needed)
- **Cookies**: httpOnly cookies are cleared by `supabase.auth.signOut()`

---

## Service Worker Security (Layer 4)

**Purpose**: Offline support for PWA WITHOUT compromising authentication security.

**Location**: `public/sw.js`

### Auth Endpoint Exclusion (CRITICAL)

**Problem**: Caching auth endpoints causes:
1. Auth tokens to persist after logout
2. Session tokens to leak between users on shared devices
3. Stale user data to be served after account changes

**Solution** (from `sw.js`, lines 29-59):

```javascript
// SECURITY: Auth endpoints must NEVER be cached
const AUTH_EXCLUDED_PATTERNS = [
  /\/auth\//,           // All auth-related paths
  /\/token/,            // Token endpoints
  /\/session/,          // Session endpoints
  /\/logout/,           // Logout endpoints
  /\/signup/,           // Signup endpoints
  /\/recover/,          // Password recovery
  /\/verify/,           // Email/phone verification
  /\/user/,             // User info endpoints
];

function isAuthEndpoint(url) {
  // Only check Supabase URLs
  if (!url.hostname.includes('supabase.co')) {
    return false;
  }

  const pathname = url.pathname;
  return AUTH_EXCLUDED_PATTERNS.some((pattern) => pattern.test(pathname));
}
```

**Enforcement in Fetch Handler** (lines 236-271):

```javascript
// SECURITY: Never cache auth-related endpoints
const isAuth = isAuthEndpoint(url);
const shouldCache = matchesPattern && !isAuth;

if (shouldCache) {
  await cache.put(event.request, networkResponse.clone());
}

// On network failure, auth endpoints get error response (not cached fallback)
if (isAuthEndpoint(url)) {
  return new Response(
    JSON.stringify({
      error: "Offline",
      message: "Authentication requires an active network connection",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}
```

### Caching Strategy Summary

| Resource Type | Strategy | Rationale |
|--------------|----------|-----------|
| **Auth endpoints** | Never cache | Prevent token persistence |
| **Navigation** | Cache-first with offline fallback | PWA offline support |
| **Static assets** (`/assets/*`) | Cache-first | Long-lived hashed files |
| **Accessory images** | Cache-first (separate cache) | Large images, rarely change |
| **API calls (non-auth)** | Network-first with cache fallback | Fresh data when online |
| **JavaScript modules** | Never intercept | Prevent MIME type errors |

**Cache Versioning**:
- `CACHE_NAME = "pianomaster-v2"` (bump version to force cache refresh)
- `ACCESSORY_CACHE_NAME = "pianomaster-accessories-v2"` (separate for large images)

---

## Rate Limiting Architecture

**Current State**: No rate limiting implemented.

**Where to Implement**:

### Option 1: Supabase Edge Functions (Recommended)
- **Location**: Between client and database
- **Technology**: Deno runtime with Supabase Edge Functions
- **Pattern**: Middleware wrapper for RPC calls
- **Example**:
  ```javascript
  // edge-function/rate-limit-wrapper.ts
  import { createClient } from '@supabase/supabase-js';
  import { Ratelimit } from '@upstash/ratelimit';
  import { Redis } from '@upstash/redis';

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  });

  Deno.serve(async (req) => {
    const userId = req.headers.get('user-id');
    const { success } = await ratelimit.limit(userId);

    if (!success) {
      return new Response("Too Many Requests", { status: 429 });
    }

    // Forward to actual function...
  });
  ```

**Cost**: Upstash Redis (free tier: 10,000 requests/day)

### Option 2: Database-Level (Simple, No External Dependencies)
- **Location**: PostgreSQL database
- **Technology**: `pg_cron` + custom tracking table
- **Pattern**: Track request counts per user/endpoint in `rate_limit_log` table
- **Example**:
  ```sql
  CREATE TABLE rate_limit_log (
    user_id UUID,
    endpoint TEXT,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, endpoint, window_start)
  );

  -- Function to check rate limit before operation
  CREATE FUNCTION check_rate_limit(p_endpoint TEXT, p_max_requests INT)
  RETURNS BOOLEAN AS $$
  DECLARE
    v_count INT;
  BEGIN
    -- Count requests in last minute
    SELECT COUNT(*) INTO v_count
    FROM rate_limit_log
    WHERE user_id = auth.uid()
      AND endpoint = p_endpoint
      AND window_start > NOW() - INTERVAL '1 minute';

    IF v_count >= p_max_requests THEN
      RAISE EXCEPTION 'Rate limit exceeded';
    END IF;

    -- Log this request
    INSERT INTO rate_limit_log (user_id, endpoint)
    VALUES (auth.uid(), p_endpoint);

    RETURN TRUE;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```

**Cost**: Free (uses existing Supabase database)

### Option 3: Client-Side (Least Secure, Development Only)
- **Location**: React hooks with localStorage
- **Technology**: Custom `useRateLimit` hook
- **Pattern**: Track request timestamps in localStorage
- **Security Risk**: Can be bypassed by clearing localStorage

**Recommended Endpoints to Rate Limit**:
1. **XP awards**: `award_xp()` - Max 10/minute (prevent XP farming)
2. **Score submissions**: `updateStudentScore()` - Max 20/minute
3. **Trail progress updates**: `updateExerciseProgress()` - Max 30/minute
4. **Teacher bulk operations**: `removeMultipleStudentsFromTeacher()` - Max 5/minute

---

## Implementation Order (Dependencies)

### Phase 1: Foundation (Already Complete ✅)
1. ✅ **RLS Policies** (migrations 20260128000001 and earlier)
   - All tables have RLS enabled
   - Policies consolidated for performance
   - Admin verification uses database state (not user_metadata)

2. ✅ **Client-Side Authorization** (services layer)
   - `verifyStudentDataAccess()` in apiScores.js
   - `verifyTeacherStudentConnection()` in apiTeacher.js
   - Role verification from database tables in apiAuth.js

3. ✅ **Secure Logout Flow** (apiAuth.js, useLogout.js)
   - localStorage cleanup
   - React Query cache clearing
   - Service worker auth exclusion

4. ✅ **SECURITY DEFINER Functions** (migrations)
   - `award_xp()` with self-only authorization
   - `is_admin()` helper function
   - `teacher_link_student()` with relationship verification

### Phase 2: Hardening (Upcoming)
1. **Rate Limiting** (choose Option 1 or 2)
   - Add rate limiting to XP awards, score submissions, bulk operations
   - Implement before public launch (prevents abuse)
   - Dependencies: None (can be added independently)

2. **Audit Logging** (recommended for compliance)
   - Log all teacher actions on student data (COPPA requirement)
   - Table: `audit_log` with (user_id, action, target_id, timestamp)
   - Implementation: Add to all teacher service functions
   - Dependencies: Phase 1 complete

3. **Session Timeout** (optional for shared devices)
   - Auto-logout after 30 minutes of inactivity
   - Implementation: React hook with `setTimeout` + logout()
   - Dependencies: Secure logout flow

4. **COPPA Compliance Enhancements**
   - Parental consent workflow (for children under 13)
   - Data export feature (GDPR right to access)
   - Data deletion feature (GDPR right to erasure)
   - Dependencies: Audit logging (to track data deletion requests)

### Phase 3: Monitoring (Post-Launch)
1. **Security Advisors** (Supabase built-in)
   - Run `mcp__supabase__get_advisors` regularly
   - Check for missing RLS policies, unindexed foreign keys
   - Schedule: Weekly automated check

2. **Log Analysis**
   - Query `audit_log` for suspicious patterns
   - Alert on multiple failed login attempts
   - Alert on rate limit violations

---

## Data Flow Diagrams

### Authentication Flow
```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. Login (email/password)
       ▼
┌─────────────────────────────┐
│   Supabase Auth Service     │
│   - Validates credentials   │
│   - Creates JWT + refresh   │
│   - Sets httpOnly cookie    │
└──────┬──────────────────────┘
       │ 2. Session token
       ▼
┌─────────────────────────────┐
│   Client Service Layer      │
│   (apiAuth.getCurrentUser)  │
│   - Query students/teachers │
│   - Verify role from DB     │
└──────┬──────────────────────┘
       │ 3. Role-enriched user
       ▼
┌─────────────────────────────┐
│   React Query Cache         │
│   (useUser hook)            │
│   - Cached for 5 minutes    │
└─────────────────────────────┘
```

### Authorization Flow (Teacher Accessing Student Data)
```
┌─────────────┐
│   Teacher   │
│   Client    │
└──────┬──────┘
       │ 1. Request student data (getStudentProgress)
       ▼
┌────────────────────────────────────┐
│   Client-Side Check (Layer 1)     │
│   verifyTeacherStudentConnection() │
│   - Query teacher_student_conns   │
│   - Verify status = 'accepted'    │
└──────┬─────────────────────────────┘
       │ 2. If authorized, proceed
       ▼
┌────────────────────────────────────┐
│   Supabase Query                   │
│   SELECT * FROM student_skill_prog │
└──────┬─────────────────────────────┘
       │ 3. RLS policy evaluation (Layer 2)
       ▼
┌────────────────────────────────────┐
│   RLS Policy Check                 │
│   - auth.uid() = teacher_id?       │
│   - EXISTS in teacher_student_conn?│
│   - status = 'accepted'?           │
└──────┬─────────────────────────────┘
       │ 4. If policy passes, return data
       ▼
┌────────────────────────────────────┐
│   Response to Client               │
└────────────────────────────────────┘
```

### Secure Logout Flow
```
┌─────────────┐
│   Student   │
│   Client    │
└──────┬──────┘
       │ 1. Click logout
       ▼
┌────────────────────────────────────┐
│   useLogout hook                   │
│   - Call logoutApi()               │
└──────┬─────────────────────────────┘
       │ 2. Execute logout
       ▼
┌────────────────────────────────────┐
│   apiAuth.logout()                 │
│   STEP 1: Clear localStorage keys  │
│   - migration_completed_*          │
│   - dashboard_reminder_*           │
│   - *_student_*, *_user_*          │
└──────┬─────────────────────────────┘
       │ 3. After localStorage cleared
       ▼
┌────────────────────────────────────┐
│   Supabase signOut()               │
│   - Invalidate session token       │
│   - Clear httpOnly cookies         │
│   - Clear refresh token            │
└──────┬─────────────────────────────┘
       │ 4. On success
       ▼
┌────────────────────────────────────┐
│   React Query                      │
│   queryClient.removeQueries()      │
│   - Clear ALL cached data          │
└──────┬─────────────────────────────┘
       │ 5. Navigate to login
       ▼
┌────────────────────────────────────┐
│   /login page                      │
│   - Fresh state, no user data      │
└────────────────────────────────────┘
```

---

## Security Checklist for New Features

When adding new features (gamification, social features, etc.), verify:

### Client-Side (Layer 1)
- [ ] Service function calls `supabase.auth.getUser()` to verify authentication
- [ ] User can only modify their own data OR has valid relationship (teacher-student)
- [ ] Relationship verification queries `teacher_student_connections` table
- [ ] Errors provide clear messages without exposing sensitive info
- [ ] No reliance on `user_metadata` for authorization decisions

### Database (Layer 2)
- [ ] Table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- [ ] Policies use database state, not JWT metadata
- [ ] Admin checks use `is_admin()` function (not user_metadata)
- [ ] SELECT policies limit data exposure appropriately
- [ ] Multiple permissive policies consolidated into single policy with OR logic

### Functions (Layer 3)
- [ ] `SECURITY DEFINER` functions have explicit `auth.uid()` checks
- [ ] Functions verify user can only modify their own data OR have valid relationship
- [ ] No use of `user_metadata` for authorization
- [ ] Sensitive operations are logged for audit purposes
- [ ] Function is marked `STABLE` (read-only) or `VOLATILE` (modifies data)

### Session Management
- [ ] Logout clears all user-specific localStorage data
- [ ] Auth state changes trigger appropriate cleanup
- [ ] No auth endpoints cached in service worker
- [ ] Role verified from database tables, not user_metadata

### Data Privacy (COPPA/GDPR-K)
- [ ] Child usernames anonymized in public-facing features (leaderboards)
- [ ] Only necessary data collected and stored
- [ ] Parents/teachers can view and delete child data
- [ ] No cross-user data leakage in shared features

---

## Key Security Files

### Client-Side Services
- `src/services/apiAuth.js`: Authentication, role verification, secure logout
- `src/services/apiScores.js`: Score operations with authorization checks
- `src/services/apiTeacher.js`: Teacher operations with relationship verification
- `src/services/skillProgressService.js`: Trail progress with authorization

### React Hooks
- `src/features/authentication/useUser.js`: User state with React Query caching
- `src/features/authentication/useLogout.js`: Logout with cache clearing

### Database Migrations
- `supabase/migrations/20260126000001_fix_award_xp_security.sql`: SECURITY DEFINER with auth checks
- `supabase/migrations/20260127000001_fix_admin_rls_verification.sql`: Admin verification via database
- `supabase/migrations/20260128000001_consolidate_rls_policies.sql`: Policy consolidation for performance

### Service Worker
- `public/sw.js`: Caching strategy with auth endpoint exclusion

---

## Performance Considerations

### RLS Policy Optimization
- **Consolidate policies**: Multiple permissive policies on same table cause 2-3x overhead
- **Use partial indexes**: Index on filtered columns (e.g., `WHERE status = 'accepted'`)
- **Cache helper functions**: Mark read-only functions as `STABLE` for query plan caching
- **Avoid nested subqueries**: Use EXISTS instead of COUNT(*) in policies

### Client-Side Optimization
- **React Query caching**: 5-minute stale time reduces unnecessary re-fetches
- **Relationship caching**: Cache teacher-student connections in React Query
- **Batch operations**: Use Supabase `.in()` for bulk queries instead of loops

### Service Worker Optimization
- **Separate caches**: Large assets (accessories) in separate cache to avoid eviction
- **Skip unnecessary intercepts**: Don't intercept JavaScript modules, let browser handle
- **Cache versioning**: Bump version to force fresh cache after deployments

---

## Threat Model

### Threats Mitigated
1. ✅ **IDOR (Insecure Direct Object Reference)**: Client + RLS verify user can only access own data
2. ✅ **Privilege Escalation**: Role verification from database (not mutable metadata)
3. ✅ **Session Hijacking (Shared Devices)**: Secure logout clears all user data
4. ✅ **Auth Bypass**: SECURITY DEFINER functions have explicit authorization checks
5. ✅ **Child Data Exposure**: RLS policies prevent cross-user data access

### Threats Not Yet Mitigated
1. ⚠️ **Rate Limiting**: No protection against XP farming or abuse (Phase 2)
2. ⚠️ **Audit Logging**: Teacher actions on student data not logged (COPPA gap)
3. ⚠️ **Session Timeout**: No auto-logout after inactivity (shared device risk)
4. ⚠️ **COPPA Consent**: No parental consent workflow for children under 13

### Out of Scope
- **DDoS Protection**: Handled by Supabase/Vercel infrastructure
- **SQL Injection**: Prevented by Supabase parameterized queries
- **XSS**: Mitigated by React's automatic escaping

---

## References

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [COPPA Compliance Guide](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [GDPR-K (Children's Privacy)](https://gdpr.eu/children/)

---

**Researched**: 2026-01-31
**Next Review**: Before Phase 2 implementation (rate limiting, audit logging)
