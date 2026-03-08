# Phase 1: Critical Security Fixes - Research

**Researched:** 2026-01-31
**Domain:** Supabase RLS, PostgreSQL SECURITY DEFINER, Client-side Authorization, Service Worker Security
**Confidence:** HIGH

## Summary

This research investigates implementing comprehensive authorization enforcement across three layers: database (RLS policies), server functions (SECURITY DEFINER), and client-side services. The app is designed for 8-year-old learners on shared devices in school environments, creating unique security requirements around session persistence and child-friendly error messaging.

Key findings reveal that the codebase already has good security patterns in place (database state verification, auth.uid() checks in functions, service worker auth exclusions, localStorage cleanup), but requires systematic verification and hardening across all tables and functions. The primary challenge is implementing rate limiting and child-appropriate error messaging in a bilingual (English/Hebrew) context while maintaining COPPA compliance.

**Primary recommendation:** Systematically audit all RLS policies to replace user_metadata checks with database state queries, add auth.uid() verification to all SECURITY DEFINER functions, implement client-side authorization checks in all service methods, and create i18n error message keys with age-appropriate language.

## Standard Stack

The established technologies for this security implementation:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase | Latest | Backend with built-in RLS | Industry-standard Postgres + Auth + Real-time |
| PostgreSQL | 14+ | Database with RLS support | RLS introduced in 9.5, mature feature |
| i18next | Latest (in use) | Internationalization | Already integrated, supports Hebrew RTL |
| React Hot Toast | Latest (in use) | Error notifications | Already integrated UI library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage | Native | Client-side violation tracking | Rate limiting, migration flags |
| Service Worker | Native | Cache management | Auth endpoint exclusion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase RLS | Custom middleware auth | RLS is database-enforced, middleware can be bypassed |
| localStorage for rate limiting | Server-side tracking | Server-side more secure but adds latency; client-side adequate for soft limits |
| i18next | Custom translation | i18next already integrated, supports pluralization and RTL |

**Installation:**
No new packages required - all functionality uses existing stack.

## Architecture Patterns

### Recommended Implementation Structure
```
Security Layers (Defense in Depth):
1. Client-side checks (fast, user-friendly errors)
2. RLS policies (database-enforced, can't be bypassed)
3. SECURITY DEFINER auth checks (function-level protection)
```

### Pattern 1: RLS Policy Database State Verification
**What:** RLS policies query database tables to verify authorization instead of trusting JWT metadata
**When to use:** All RLS policies requiring role/permission checks
**Example:**
```sql
-- Source: Supabase Official Docs + Existing Migration 20260127000001
-- BAD: Uses mutable user_metadata
CREATE POLICY "Admin access" ON accessories
  FOR ALL USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- GOOD: Queries database state
CREATE POLICY "Admin access" ON accessories
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role'
    OR public.is_admin()  -- Helper function checks teachers table
  );

-- Helper function (SECURITY DEFINER allows bypassing RLS to check teachers table)
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

### Pattern 2: SECURITY DEFINER Function Authorization Checks
**What:** Functions with SECURITY DEFINER must verify auth.uid() before execution
**When to use:** All SECURITY DEFINER functions, especially those modifying data
**Example:**
```sql
-- Source: Migration 20260126000001_fix_award_xp_security.sql
CREATE OR REPLACE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS TABLE(...) AS $$
BEGIN
  -- SECURITY CHECK: User can only award XP to themselves
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only award XP to yourself';
  END IF;

  -- Function logic here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Pattern 3: Client-side Service Authorization Verification
**What:** Service methods verify user.id matches target before API calls
**When to use:** All service methods accepting studentId or userId parameters
**Example:**
```javascript
// Source: src/services/apiScores.js
async function verifyStudentDataAccess(studentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Students can access their own data
  if (user.id === studentId) {
    return true;
  }

  // Teachers verify relationship in teacher_student_connections table
  const { data: connection, error } = await supabase
    .from("teacher_student_connections")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("student_id", studentId)
    .eq("status", "accepted")
    .single();

  if (error || !connection) {
    throw new Error("Unauthorized: No access to this student's data");
  }

  return true;
}

export async function getStudentScores(studentId) {
  await verifyStudentDataAccess(studentId);
  // Proceed with database query
}
```

### Pattern 4: Service Worker Auth Endpoint Exclusion
**What:** Service worker never caches authentication-related endpoints
**When to use:** All service worker implementations
**Example:**
```javascript
// Source: public/sw.js (lines 29-42, 235-270)
const AUTH_EXCLUDED_PATTERNS = [
  /\/auth\//,     // All auth-related paths
  /\/token/,      // Token endpoints
  /\/session/,    // Session endpoints
  /\/logout/,     // Logout endpoints
  /\/user/,       // User info endpoints
];

function isAuthEndpoint(url) {
  if (!url.hostname.includes('supabase.co')) return false;
  return AUTH_EXCLUDED_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// In fetch handler
if (isAuthEndpoint(url)) {
  return new Response(JSON.stringify({
    error: "Offline",
    message: "Authentication requires an active network connection"
  }), { status: 503 });
}
```

### Pattern 5: Logout Data Clearing for Shared Devices
**What:** Clear user-specific localStorage keys on logout to prevent data leakage
**When to use:** All logout implementations
**Example:**
```javascript
// Source: src/services/apiAuth.js (lines 185-208)
export async function logout() {
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
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
```

### Pattern 6: Client-side Rate Limiting with localStorage
**What:** Track authorization violations in localStorage and block after threshold
**When to use:** Rate limiting unauthorized access attempts
**Example:**
```javascript
// Recommended pattern based on research
const VIOLATION_THRESHOLD = 3;
const VIOLATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function trackViolation(resourceType, userId) {
  const key = `violations_${resourceType}_${userId}`;
  const stored = localStorage.getItem(key);
  const violations = stored ? JSON.parse(stored) : [];

  const now = Date.now();
  const recent = violations.filter(v => now - v < VIOLATION_WINDOW_MS);
  recent.push(now);

  localStorage.setItem(key, JSON.stringify(recent));

  if (recent.length >= VIOLATION_THRESHOLD) {
    return { rateLimited: true, until: recent[0] + VIOLATION_WINDOW_MS };
  }
  return { rateLimited: false };
}
```

### Pattern 7: Child-Friendly Error Messages via i18n
**What:** Age-appropriate error messages for 8-year-olds, translated via i18next
**When to use:** All authorization error displays
**Example:**
```javascript
// Recommended i18n structure based on existing locales
// src/locales/en/common.json
{
  "errors": {
    "unauthorized": {
      "student": "Oops! You can't see that.",
      "teacher": "You don't have permission. Try selecting a student from your list.",
      "notAuthenticated": "Please log in to continue."
    },
    "rateLimited": {
      "student": "Slow down! Try again in a few minutes.",
      "teacher": "Too many attempts. Please wait {{minutes}} minutes."
    }
  }
}

// Usage in service
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();

if (!authorized) {
  const message = isStudent
    ? t('errors.unauthorized.student')
    : t('errors.unauthorized.teacher');
  toast.error(message);
}
```

### Anti-Patterns to Avoid
- **Using user_metadata for authorization:** Can be modified by users via `supabase.auth.updateUser()`
- **SECURITY DEFINER without auth checks:** Runs with superuser privileges, can bypass all RLS
- **Caching auth endpoints:** Causes token persistence after logout, session leakage on shared devices
- **Generic error messages:** "Something went wrong" provides no actionable guidance
- **Accepting studentId without verification:** IDOR vulnerability allowing access to any student's data

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT metadata authorization | Custom claims parsing | Database state queries (teachers/students tables) | JWT metadata is client-modifiable; database state is authoritative |
| RLS policy optimization | Manual subquery writing | Wrap functions in SELECT, index auth.uid() = user_id | Postgres caches (SELECT auth.uid()), prevents recalculation per row |
| Rate limiting | Custom Redis/server-side | localStorage with timestamp tracking | Client-side adequate for soft limits; adds no latency |
| i18n error messages | String interpolation | i18next with pluralization | Already integrated, supports RTL Hebrew, handles pluralization |
| Admin verification | Check user_metadata role | is_admin() helper function | user_metadata mutable; helper function queries database |

**Key insight:** The existing codebase already implements most security patterns correctly (database state verification in getCurrentUser, auth.uid() checks in award_xp, service worker auth exclusion). The task is to systematically verify coverage across all tables and functions, not to reinvent patterns.

## Common Pitfalls

### Pitfall 1: JWT Freshness Assumption
**What goes wrong:** Relying on auth.jwt() for real-time authorization when permissions have changed
**Why it happens:** JWTs are not refreshed immediately after metadata/role updates
**How to avoid:** Use database state for dynamic permissions; JWT only for static user identification
**Warning signs:** User permissions don't update until re-login

### Pitfall 2: SECURITY DEFINER Privilege Escalation
**What goes wrong:** Function created by superuser bypasses all RLS, allows any operation
**Why it happens:** SECURITY DEFINER runs with creator's privileges (often postgres superuser)
**How to avoid:** Add explicit auth.uid() checks at function start; revoke PUBLIC execute, grant to authenticated only
**Warning signs:** Users can access data they shouldn't after calling function

### Pitfall 3: Incomplete localStorage Cleanup
**What goes wrong:** User-specific data persists after logout on shared devices
**Why it happens:** Only auth token cleared, not user-specific cache keys
**How to avoid:** Iterate localStorage, remove keys with user IDs, migration flags, or student-specific data
**Warning signs:** Next user sees previous user's data/settings

### Pitfall 4: Service Worker Auth Caching
**What goes wrong:** Auth tokens cached, persist after logout, leak between users
**Why it happens:** Service worker caches all fetch requests including auth endpoints
**How to avoid:** Exclude auth endpoints from caching (use regex patterns on URL pathname)
**Warning signs:** User remains logged in after logout, wrong user's session loaded

### Pitfall 5: RLS Policy Performance with Subqueries
**What goes wrong:** RLS policy with subquery executed per row, causes massive performance degradation
**Why it happens:** Postgres doesn't automatically cache subquery results in RLS context
**How to avoid:** Wrap functions in (SELECT ...), use STABLE functions, index columns in auth checks
**Warning signs:** Queries on large tables timeout or take >1 second

### Pitfall 6: Teacher-Student Relationship Bypass
**What goes wrong:** Teacher accesses any student's data by guessing student ID
**Why it happens:** No verification of teacher_student_connections relationship
**How to avoid:** Query teacher_student_connections with status='accepted' before allowing access
**Warning signs:** Teachers can see students not in their class

### Pitfall 7: Child-Unfriendly Error Messages
**What goes wrong:** Technical error messages confuse 8-year-old users
**Why it happens:** Default error handling returns technical messages
**How to avoid:** Use i18n with age-appropriate language; "Oops! You can't see that." not "Unauthorized access"
**Warning signs:** Children don't understand what went wrong or what to do

## Code Examples

Verified patterns from official sources and existing codebase:

### RLS Policy with Database State
```sql
-- Source: Migration 20260127000001_fix_admin_rls_verification.sql
-- Create helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teachers
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_teachers_is_admin
ON public.teachers(id) WHERE is_admin = true;

-- Use in RLS policy
CREATE POLICY "Admin can manage accessories"
ON public.accessories
FOR ALL TO authenticated
USING (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
)
WITH CHECK (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
);
```

### SECURITY DEFINER with Authorization Check
```sql
-- Source: Migration 20260126000001_fix_award_xp_security.sql
CREATE OR REPLACE FUNCTION award_xp(
  p_student_id UUID,
  p_xp_amount INTEGER
)
RETURNS TABLE(
  new_total_xp INTEGER,
  new_level INTEGER,
  leveled_up BOOLEAN
) AS $$
BEGIN
  -- SECURITY CHECK: Ensure the caller can only award XP to themselves
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only award XP to yourself';
  END IF;

  -- Function logic here...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION award_xp(UUID, INTEGER) TO authenticated;

-- Document the security requirement
COMMENT ON FUNCTION award_xp IS
  'Awards XP to a student. Security: Users can only award XP to themselves (auth.uid() must equal p_student_id).';
```

### RLS Performance Optimization
```sql
-- Source: Supabase Docs + Migration 20260127000003_optimize_rls_auth_plan.sql
-- BAD: Subquery executed per row
CREATE POLICY "Students can read own data"
ON student_skill_progress
FOR SELECT USING (
  student_id = auth.uid()  -- No index if not wrapped
);

-- GOOD: Wrapped function cached, column indexed
CREATE POLICY "Students can read own data"
ON student_skill_progress
FOR SELECT USING (
  student_id = (SELECT auth.uid())
);

-- Create index on foreign key column
CREATE INDEX IF NOT EXISTS idx_student_skill_progress_student_id
ON student_skill_progress(student_id);
```

### Client-side Authorization Verification
```javascript
// Source: src/services/apiScores.js (modified for generality)
async function verifyAccess(userId, resourceType) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Users can access their own resources
  if (user.id === userId) {
    return true;
  }

  // Teachers verify relationship
  const { data: connection, error } = await supabase
    .from("teacher_student_connections")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("student_id", userId)
    .eq("status", "accepted")
    .single();

  if (error || !connection) {
    // Log violation for rate limiting (Phase 1 implementation)
    const violation = trackViolation(resourceType, user.id);

    if (violation.rateLimited) {
      const minutes = Math.ceil((violation.until - Date.now()) / 60000);
      throw new Error(`Rate limited. Try again in ${minutes} minutes.`);
    }

    throw new Error("Unauthorized: No access to this student's data");
  }

  return true;
}
```

### Service Worker Auth Exclusion
```javascript
// Source: public/sw.js (lines 29-60)
const AUTH_EXCLUDED_PATTERNS = [
  /\/auth\//,      // All auth-related paths
  /\/token/,       // Token endpoints
  /\/session/,     // Session endpoints
  /\/logout/,      // Logout endpoints
  /\/signup/,      // Signup endpoints
  /\/recover/,     // Password recovery
  /\/verify/,      // Email/phone verification
  /\/user/,        // User info endpoints
];

function isAuthEndpoint(url) {
  // Only check Supabase URLs
  if (!url.hostname.includes('supabase.co')) {
    return false;
  }

  const pathname = url.pathname;

  // Check against all auth-excluded patterns
  return AUTH_EXCLUDED_PATTERNS.some((pattern) => pattern.test(pathname));
}

// In fetch event handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (isAuthEndpoint(url)) {
    event.respondWith(fetch(event.request)); // Never cache
    return;
  }

  // Apply caching strategies for non-auth requests
});
```

### Logout with localStorage Cleanup
```javascript
// Source: src/services/apiAuth.js (lines 185-208)
export async function logout() {
  // Clear user-specific localStorage keys before signing out
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

  // Then sign out from Supabase
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| user_metadata for roles | Database tables (teachers/students) | 2026-01-27 (migration) | Role verification now authoritative, can't be spoofed |
| SECURITY DEFINER without checks | Explicit auth.uid() verification | 2026-01-26 (award_xp) | Functions can't be exploited for privilege escalation |
| Caching all fetch requests | Auth endpoint exclusion | Unknown (already in sw.js) | Prevents token persistence after logout |
| Clearing only auth token | Full user-specific localStorage cleanup | Unknown (already in apiAuth.js) | Prevents data leakage on shared devices |
| Generic error messages | (TO BE IMPLEMENTED) Age-appropriate i18n | Phase 1 | 8-year-olds understand what went wrong |

**Deprecated/outdated:**
- **user_metadata role checks:** Now considered insecure; replaced with database state queries
- **PUBLIC execute on SECURITY DEFINER:** Should be revoked and granted only to authenticated
- **Unindexed RLS policies:** Performance issue on large tables; all auth.uid() checks should have indexes

## Open Questions

Things that couldn't be fully resolved:

1. **Rate Limit Block Duration**
   - What we know: User wants 3 violations in 5 minutes triggers rate limit
   - What's unclear: How long should the block last? 5 minutes? 15 minutes? Until manual reset?
   - Recommendation: Start with 5-minute block (same as violation window), can increase if abuse continues

2. **Rate Limit UX for Legitimate Users**
   - What we know: Rate-limited users should be blocked from the action that caused violations
   - What's unclear: Can they still access their legitimate students? Or full account lock?
   - Recommendation: Block only the specific action (e.g., accessing student data), not entire account

3. **IndexedDB Cleanup on Logout**
   - What we know: localStorage is cleared of user-specific keys
   - What's unclear: Does the app use IndexedDB for any user-specific data?
   - Recommendation: Check for IndexedDB usage (audio cache, practice session data); if found, clear on logout

4. **Security Update Notice Duration**
   - What we know: Force re-login after deploying RLS policies with notice explaining why
   - What's unclear: One-time banner? Dismissible? Persistent for first login?
   - Recommendation: One-time banner shown once per user, dismissible, stored in localStorage (not user-specific, so survives logout)

5. **Teacher Violation Visibility**
   - What we know: Teachers should not be notified about student-side violations
   - What's unclear: Should teachers see their own violation history? For audit/debugging?
   - Recommendation: No visibility in Phase 1; can add admin dashboard in future phase if needed

6. **Console Logging Approach**
   - What we know: Authorization violations should be logged for audit
   - What's unclear: Development-only detailed logs? Or production minimal logs?
   - Recommendation: Development logs include user ID, resource type, timestamp; production logs only timestamp and resource type (no PII)

## Sources

### Primary (HIGH confidence)
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS patterns, auth.uid() usage, JWT metadata security
- [Token Security and Row Level Security | Supabase Docs](https://supabase.com/docs/guides/auth/oauth-server/token-security) - JWT metadata vs app_metadata, custom claims
- [Database Authorization — PostgREST Documentation](https://docs.postgrest.org/en/v12/explanations/db_authz.html) - SECURITY DEFINER best practices
- Migration 20260126000001_fix_award_xp_security.sql - SECURITY DEFINER authorization pattern
- Migration 20260127000001_fix_admin_rls_verification.sql - is_admin() helper function pattern
- src/services/apiAuth.js - Logout localStorage cleanup pattern
- src/services/apiScores.js - Client-side authorization verification pattern
- public/sw.js - Service worker auth endpoint exclusion pattern

### Secondary (MEDIUM confidence)
- [Optimizing RLS Performance with Supabase(postgres) | by AntStack Inc. | Medium](https://medium.com/@antstack/optimizing-rls-performance-with-supabase-postgres-fa4e2b6e196d) - Wrap functions in SELECT, index auth.uid()
- [Designing the most performant Row Level Security schema in Postgres | by Caleb Brewer | Medium](https://cazzer.medium.com/designing-the-most-performant-row-level-security-strategy-in-postgres-a06084f31945) - GIN indexes for ACL columns, avoid passing row data to functions
- [Securing Service Workers and Handling Sensitive Data | by Mani L | Medium](https://medium.com/@lmssrinivas/securing-service-workers-and-handling-sensitive-data-f6a3312ef755) - Never cache sensitive data, HTTPS only, validate network requests
- [Level Up Your Logout Functionality with "Clear-Site-Data" - DEV Community](https://dev.to/tusharprajapatiii/level-up-your-logout-functionality-with-clear-site-data-3fjd) - Clear-Site-Data header for comprehensive cleanup
- [Children's UX: Usability Issues in Designing for Young People - NN/G](https://www.nngroup.com/articles/childrens-websites-usability-issues/) - Age-appropriate language for 6-8 year olds
- [Top 10 UI/UX Design Tips for Child-Friendly Interfaces](https://www.aufaitux.com/blog/ui-ux-designing-for-children/) - Visual cues, simple language, limited working memory

### Tertiary (LOW confidence)
- Client-side rate limiting WebSearch results - General patterns, not specific to this stack
- Error message UX for children - No 2026-specific research, extrapolated from general UX guidelines

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All technologies already in use, verified in package.json and codebase
- Architecture patterns: HIGH - Patterns extracted from existing migrations and service files
- RLS optimization: MEDIUM - Supabase docs verified, but performance gains not tested on this codebase
- Rate limiting: LOW - Pattern is standard but not yet implemented; localStorage approach needs validation
- Child-friendly UX: MEDIUM - General UX guidelines verified, but not specific to this app's age group
- Service worker security: HIGH - Pattern already implemented in sw.js, verified against best practices

**Research date:** 2026-01-31
**Valid until:** 2026-03-31 (60 days - PostgreSQL/Supabase RLS is stable, unlikely to change)
