# Security Stack Research

**Researched:** 2026-01-31

## Executive Summary

This document outlines the recommended security stack for a React + Supabase piano learning PWA targeting 8-year-old children. The app requires COPPA compliance, multi-tenancy (teacher-student), and preparation for Google Play and Apple App Store deployment.

### Key Compliance Requirements
- **COPPA Rule Amendments** effective June 23, 2025 (compliance deadline: April 22, 2026)
- **SOC 2 Type 2** compliance via Supabase
- **App Store Requirements** for child-directed apps (Google Play and Apple App Store)

---

## Supabase RLS Patterns

### 1. Enable RLS on All Tables

**Pattern:**
```sql
ALTER TABLE student_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_student ENABLE ROW LEVEL SECURITY;
```

**Rationale:** Without RLS, anyone with the anon key can read all data. Even for tables that seem non-sensitive, enable RLS by default and open access selectively with policies. This is the foundational security layer.

**Source:** [Supabase RLS Best Practices](https://www.leanware.co/insights/supabase-best-practices)

### 2. Never Use `user_metadata` in RLS Policies

**Vulnerable Pattern:**
```sql
-- BAD: user_metadata can be modified by clients
CREATE POLICY "Teacher access" ON students
  FOR ALL USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'teacher'
  );
```

**Secure Pattern:**
```sql
-- GOOD: Verify role from database tables
CREATE POLICY "Teacher access" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE id = auth.uid()
    )
  );
```

**Rationale:** `user_metadata` (stored as `raw_user_meta_data` in the database) can be changed by authenticated users via `supabase.auth.updateUser()`. **Never use it for authorization decisions.** Use `app_metadata` (stored as `raw_app_meta_data`) instead, which can only be modified server-side with the service_role key.

**Sources:**
- [RLS policy based on user metadata discussion](https://github.com/orgs/supabase/discussions/13091)
- [How do I use app metadata?](https://github.com/orgs/supabase/discussions/33931)

### 3. Multi-Tenancy Pattern for Teacher-Student Relationships

**Implementation:**

```sql
-- 1. Add tenant_id to tables
ALTER TABLE student_skill_progress ADD COLUMN student_id UUID REFERENCES students(id);

-- 2. Store teacher's student list in app_metadata or use junction table
CREATE TABLE teacher_student (
  teacher_id UUID REFERENCES teachers(id),
  student_id UUID REFERENCES students(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (teacher_id, student_id)
);

-- 3. Create helper function for relationship verification
CREATE OR REPLACE FUNCTION is_teacher_for_student(p_student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teacher_student
    WHERE teacher_id = auth.uid()
    AND student_id = p_student_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. RLS policy for students accessing their own data
CREATE POLICY "Students can view own progress" ON student_skill_progress
  FOR SELECT USING (student_id = auth.uid());

-- 5. RLS policy for teachers accessing their students' data
CREATE POLICY "Teachers can view student progress" ON student_skill_progress
  FOR SELECT USING (is_teacher_for_student(student_id));
```

**Rationale:** This implements defense-in-depth multi-tenancy. Students can only see their own data (`student_id = auth.uid()`), while teachers can see data for students they're connected to (verified via the `teacher_student` junction table). The `SECURITY DEFINER` function is safe here because it only reads data, doesn't modify it, and uses `auth.uid()` for verification.

**Sources:**
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Efficient multi tenancy with Supabase](https://arda.beyazoglu.com/supabase-multi-tenancy)

### 4. Keep Policies Simple for Performance

**Anti-Pattern:**
```sql
-- BAD: Complex join-heavy policy
CREATE POLICY "Complex access" ON student_skill_progress
  FOR SELECT USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN teacher_student ts ON ts.student_id = s.id
      JOIN teachers t ON t.id = ts.teacher_id
      WHERE t.id = auth.uid() OR s.id = auth.uid()
    )
  );
```

**Better Pattern:**
```sql
-- GOOD: Simple policy with helper function
CREATE POLICY "Simple access" ON student_skill_progress
  FOR SELECT USING (
    student_id = auth.uid() OR is_teacher_for_student(student_id)
  );
```

**Rationale:** Complex policies with multiple joins slow down queries. Extract complex logic into `SECURITY DEFINER` helper functions (marked `STABLE` for caching) and keep policies simple. The database can optimize simple policies better.

**Source:** [Supabase RLS Best Practices](https://www.leanware.co/insights/supabase-best-practices)

### 5. Child Data Protection Pattern (COPPA)

**Anonymization Pattern:**
```sql
-- Create view that anonymizes other students' data
CREATE OR REPLACE VIEW student_leaderboard AS
SELECT
  id,
  CASE
    WHEN id = auth.uid() THEN username
    ELSE 'Student ' || ROW_NUMBER() OVER (ORDER BY total_xp DESC)::TEXT
  END AS display_name,
  total_xp,
  current_level,
  id = auth.uid() AS is_current_user
FROM students
ORDER BY total_xp DESC
LIMIT 10;

-- RLS policy allows everyone to view the anonymized leaderboard
CREATE POLICY "Anyone can view leaderboard" ON student_leaderboard
  FOR SELECT USING (true);
```

**Rationale:** COPPA requires minimizing PII exposure for children under 13. In shared features like leaderboards, only show the current user's real username and anonymize everyone else. This prevents children from identifying classmates or collecting personal information about other users.

**2025 COPPA Amendment:** The updated rule (effective June 23, 2025) now includes biometric identifiers and mobile phone numbers as "personal information" and requires separate consent for third-party disclosure.

**Sources:**
- [COPPA Compliance in 2025: A Practical Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [Children's Online Privacy in 2025: The Amended COPPA Rule](https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule)

---

## SECURITY DEFINER Best Practices

### 1. Always Add Explicit Authorization Checks

**Vulnerable Pattern:**
```sql
-- BAD: Any authenticated user can award XP to any student
CREATE OR REPLACE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE students SET total_xp = total_xp + p_xp_amount WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Secure Pattern:**
```sql
-- GOOD: User can only award XP to themselves
CREATE OR REPLACE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS void AS $$
BEGIN
  -- Authorization check: user can only modify their own XP
  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot award XP to another user';
  END IF;

  UPDATE students SET total_xp = total_xp + p_xp_amount WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Rationale:** `SECURITY DEFINER` functions run with the privileges of the function owner (usually superuser), **bypassing RLS entirely**. Always add explicit `auth.uid()` checks at the start of the function. Without this, authenticated users could call the function to modify any student's data.

**Source:** [Supabase SECURITY DEFINER Best Practices](https://github.com/orgs/supabase/discussions/20521)

### 2. Set Empty Search Path for Security

**Pattern:**
```sql
CREATE OR REPLACE FUNCTION secure_function(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Must explicitly reference schema when search_path is empty
  UPDATE public.students SET last_active = NOW() WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''; -- Empty search path for security
```

**Rationale:** Setting an empty `search_path` prevents potential SQL injection via schema manipulation. You must explicitly reference schemas (e.g., `public.students`), but this limits damage if the function is exploited.

**Source:** [Supabase RLS using Functions - Security Definers](https://blog.entrostat.com/supabase-rls-functions/)

### 3. Prefer SECURITY INVOKER by Default

**Pattern:**
```sql
-- Default and recommended for most functions
CREATE OR REPLACE FUNCTION get_student_progress(p_student_id UUID)
RETURNS TABLE (node_id TEXT, stars INTEGER) AS $$
  SELECT node_id, stars FROM student_skill_progress WHERE student_id = p_student_id;
$$ LANGUAGE sql SECURITY INVOKER; -- Runs with caller's privileges
```

**When to Use SECURITY DEFINER:**
- **Bypassing RLS in policies** - To avoid circular dependencies when RLS policies need to query other tables
- **Many-to-many relationships** - Restricting access to junction tables while allowing policy checks
- **Performance optimization** - Avoiding RLS checks for complex queries (but add explicit auth checks!)

**Rationale:** `SECURITY INVOKER` (the default) is safer because it runs with the caller's privileges and respects RLS. Only use `SECURITY DEFINER` when you have a specific need to bypass RLS, and always add explicit authorization checks.

**Source:** [Database Functions | Supabase Docs](https://supabase.com/docs/guides/database/functions)

### 4. Use STABLE or IMMUTABLE for Helper Functions

**Pattern:**
```sql
CREATE OR REPLACE FUNCTION is_teacher_for_student(p_student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teacher_student
    WHERE teacher_id = auth.uid() AND student_id = p_student_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE; -- STABLE allows result caching
```

**Rationale:** Marking functions as `STABLE` (result doesn't change within a transaction) or `IMMUTABLE` (result never changes for same inputs) allows PostgreSQL to cache results and optimize queries. For RLS helper functions, `STABLE` is usually appropriate because `auth.uid()` doesn't change during a transaction.

**Source:** [Supabase SQL | RLS Policies with security definer functions](https://supabase-sql.vercel.app/rls-policies-with-security-definer-function)

### 5. Place Security Functions in Custom Schema

**Pattern:**
```sql
-- Create a custom schema for security functions
CREATE SCHEMA IF NOT EXISTS security;

-- Place helper functions in the security schema
CREATE OR REPLACE FUNCTION security.verify_teacher_access(p_student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teacher_student
    WHERE teacher_id = auth.uid() AND student_id = p_student_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Use in RLS policies with explicit schema reference
CREATE POLICY "Teachers can view student data" ON student_skill_progress
  FOR SELECT USING (security.verify_teacher_access(student_id));
```

**Rationale:** Placing security functions in a custom schema (not exposed via PostgREST) prevents clients from calling them directly via the API. They can only be used within RLS policies. This reduces the attack surface.

**Source:** [Supabase RLS using Functions - Security Definers](https://blog.entrostat.com/supabase-rls-functions/)

---

## Custom JWT Claims & Authorization

### 1. Use Custom Access Token Hook (Official 2025 Method)

**Implementation:**

1. **Create the custom claims function:**

```sql
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Fetch user role from database (NOT user_metadata)
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.teachers WHERE id = (event->>'user_id')::uuid) THEN 'teacher'
    WHEN EXISTS (SELECT 1 FROM public.students WHERE id = (event->>'user_id')::uuid) THEN 'student'
    ELSE 'unknown'
  END INTO user_role;

  -- Add role to JWT claims
  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));

  -- Return modified event with custom claims
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```

2. **Enable the hook in Supabase Dashboard:**
   - Navigate to **Authentication > Hooks (Beta)**
   - Select **Custom Access Token**
   - Choose `auth.custom_access_token_hook` from dropdown

3. **Use claims in RLS policies:**

```sql
CREATE POLICY "Role-based access" ON sensitive_table
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'teacher'
  );
```

**Rationale:** Custom Access Token Hooks (introduced in 2024-2025) are the **official Supabase method** for adding custom claims to JWTs. Claims are stored in the token and available via `current_setting('request.jwt.claims', true)`, giving PostgreSQL immediate access without disk I/O. This is more performant than querying tables in every RLS policy.

**Important Limitations:**
- The hook **only modifies the access token JWT**, not the auth response
- To access custom claims in your React app, you must **decode the access_token JWT**
- Claims **don't update automatically** - users may need to log out/in to refresh claims
- **Do NOT use** "provider" and "providers" as claim names (reserved by Supabase Auth)

**Sources:**
- [Custom Access Token Hook | Supabase Docs](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
- [Custom Claims & RBAC | Supabase Docs](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)

### 2. Store Roles in app_metadata for Service-Side Access

**Pattern:**

```javascript
// Server-side only (with service_role key)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Set role on user creation
async function createTeacherUser(email, password) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'teacher' } // Secure, user cannot modify
  })

  // Also insert into teachers table for RLS
  if (data.user) {
    await supabaseAdmin.from('teachers').insert({ id: data.user.id, email })
  }

  return { data, error }
}
```

**Rationale:** `app_metadata` (stored as `raw_app_meta_data`) can **only be modified server-side** with the service_role key. It's perfect for storing authorization data. However, for RLS policies, **prefer database tables over JWT claims** to avoid stale data issues (claims don't update until user logs out/in).

**Best Practice:** Use **both** approaches:
- **Custom JWT claims** for quick auth checks in RLS (performance)
- **Database tables** as the source of truth (can update without re-login)

**Source:** [How do I use app metadata?](https://github.com/orgs/supabase/discussions/33931)

---

## Session Management

### 1. Session Timeout Configuration (Supabase Dashboard)

**Settings to Configure:**

Navigate to **Authentication > Settings** in Supabase Dashboard:

1. **JWT Expiration Time**
   - Default: 3600 seconds (1 hour)
   - Minimum recommended: 300 seconds (5 minutes)
   - **Recommendation for children's app:** 1800 seconds (30 minutes)

2. **Inactivity Timeout**
   - Set to a positive duration (e.g., 900 seconds / 15 minutes)
   - Sessions expire after this period of inactivity
   - **Recommendation for shared devices:** 900 seconds (15 minutes)

3. **Time-box User Sessions**
   - Maximum session lifetime regardless of activity
   - **Recommendation for children's app:** 7200 seconds (2 hours)

**Important Behavior:**
- Sessions are **not proactively terminated** when timeouts are reached
- Cleanup happens **24 hours after** reaching timeout status
- Actual duration = configured timeout + JWT expiration time

**Rationale:** For children's apps on shared devices (common in schools), shorter session timeouts reduce the risk of unauthorized access if a child forgets to log out. The 24-hour cleanup delay is acceptable because the client-side token will be invalid before then.

**Source:** [User sessions | Supabase Docs](https://supabase.com/docs/guides/auth/sessions)

### 2. Automatic Token Refresh (Client-Side)

**Pattern:**

```javascript
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true, // Default is true
      persistSession: true,   // Use localStorage
      detectSessionInUrl: true
    }
  }
)
```

**React Hook for Session Monitoring:**

```javascript
// src/hooks/useAuthSession.js
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuthSession() {
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Clear user-specific data on logout
          clearUserData()
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Session refreshed successfully')
        } else if (event === 'USER_UPDATED') {
          // Handle user updates
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])
}

function clearUserData() {
  // Clear user-specific localStorage keys
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('user_') || key?.startsWith('progress_')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}
```

**Rationale:** Supabase automatically refreshes tokens before expiration when `autoRefreshToken` is enabled. The `onAuthStateChange` listener allows you to react to session events. **Important:** Remove any async calls from the callback to avoid deadlock issues.

**Sources:**
- [JavaScript: Listen to auth events | Supabase Docs](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Hanging react app on session refresh](https://github.com/dyad-sh/dyad/issues/1364)

### 3. Inactivity Timeout (Client-Side Implementation)

**Pattern:**

```javascript
// src/hooks/useInactivityTimeout.js
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export function useInactivityTimeout(timeoutMs = 15 * 60 * 1000) { // 15 minutes
  const navigate = useNavigate()
  const timeoutRef = useRef(null)

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      // Auto-logout on inactivity
      await supabase.auth.signOut()
      navigate('/login', { state: { message: 'Session expired due to inactivity' } })
    }, timeoutMs)
  }

  useEffect(() => {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true)
    })

    // Start initial timeout
    resetTimeout()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}

// Usage in App.jsx
function App() {
  useInactivityTimeout(15 * 60 * 1000) // 15 minutes
  // ... rest of app
}
```

**Rationale:** While Supabase provides server-side inactivity timeout configuration, **client-side enforcement provides immediate logout** without waiting for token expiration. This is critical for shared devices in schools where children may walk away without logging out.

**Source:** [Enhancing React App Security: Implementing Inactivity Logout](https://dev.to/ingeniouswebster/enhancing-react-app-security-implementing-inactivity-logout-for-peace-of-mind-3nol)

### 4. Secure Logout for Shared Devices

**Pattern:**

```javascript
// src/services/authService.js
import { supabase } from '../lib/supabaseClient'

export async function secureLogout() {
  // 1. Get user ID before signing out
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  // 2. Sign out from Supabase
  await supabase.auth.signOut()

  // 3. Clear ALL user-specific localStorage data
  if (userId) {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      // Clear keys containing user ID or user-specific prefixes
      if (key?.includes(userId) ||
          key?.startsWith('user_') ||
          key?.startsWith('progress_') ||
          key?.startsWith('cached_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  // 4. Clear migration flags and other cached data
  localStorage.removeItem('xp_migration_complete')
  localStorage.removeItem('last_sync_time')

  // 5. Clear service worker cache (optional but recommended)
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    )
  }

  return true
}
```

**Rationale:** On shared devices (common in schools), user data persists in localStorage after logout. The next user could access the previous user's data. **Always clear user-specific localStorage keys on logout.** Consider using `sessionStorage` instead of `localStorage` for even better shared-device security (cleared when tab closes).

**Alternative: Use sessionStorage for Shared Devices**

```javascript
// src/lib/supabaseClient.js
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: window.sessionStorage, // Cleared on tab close
      autoRefreshToken: true,
      persistSession: true
    }
  }
)
```

**Trade-offs:**
- **localStorage:** Better UX (stays logged in), worse security on shared devices
- **sessionStorage:** Better security (auto-logout on tab close), worse UX (must log in per tab)

**Recommendation:** For children's apps on shared school devices, **use sessionStorage** or implement aggressive localStorage cleanup on logout.

**Sources:**
- [How to Persist React State in Local Storage](https://felixgerschau.com/react-localstorage/)
- Existing project file: `C:\Users\pagis\OneDrive\WebDev\Projects\PianoApp2\CLAUDE.md` (Security Hardening Guidelines)

---

## Rate Limiting Options

### Problem Statement

Supabase RLS **does not provide rate limiting**. A malicious user with a valid account can write a loop that repeatedly queries or inserts data, potentially:
- Increasing costs (Supabase usage-based pricing)
- Degrading performance for other users
- Bringing down the application

**Source:** [Rate limits on postRest or graphql](https://github.com/orgs/supabase/discussions/19493)

### Option 1: Edge Functions with Redis (Recommended)

**Implementation:**

```typescript
// supabase/functions/rate-limited-endpoint/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { connect } from 'https://deno.land/x/redis@v0.29.0/mod.ts'

const redis = await connect({
  hostname: Deno.env.get('REDIS_HOST')!,
  port: 6379,
})

serve(async (req) => {
  // 1. Get authenticated user
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { data: { user }, error } = await supabaseClient.auth.getUser()
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Rate limit by user ID
  const key = `rate_limit:${user.id}`
  const requestCount = await redis.incr(key)

  if (requestCount === 1) {
    // Set 1-minute expiration on first request
    await redis.expire(key, 60)
  }

  if (requestCount > 100) { // 100 requests per minute
    return new Response('Rate limit exceeded', { status: 429 })
  }

  // 3. Process request (e.g., database query)
  const { data, error: dbError } = await supabaseClient
    .from('students_score')
    .insert({ student_id: user.id, /* ... */ })

  if (dbError) {
    return new Response(JSON.stringify({ error: dbError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Pros:**
- Atomic operations with Redis
- Rate limit by user ID (from Supabase Auth)
- Flexible rate limiting strategies (per-minute, per-hour, sliding window)
- Works with Edge Functions (2 second CPU limit, 150 second idle timeout)

**Cons:**
- Requires external Redis instance (Upstash, Redis Cloud, or self-hosted)
- Additional latency (200-400ms cold starts for Edge Functions)
- More complex architecture

**Rationale:** This is the **recommended production approach** for public-facing apps. Edge Functions act as an API gateway with rate limiting, protecting the database from abuse. While it adds complexity, it's the only scalable solution for apps with anonymous or untrusted users.

**Sources:**
- [Rate Limiting Edge Functions | Supabase Docs](https://supabase.com/docs/guides/functions/examples/rate-limiting)
- [Rate-limiting Edge Functions discussion](https://github.com/orgs/supabase/discussions/10807)

### Option 2: Client-Side Rate Limiting (Not Recommended for Production)

**Implementation:**

```javascript
// src/utils/rateLimiter.js
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = []
  }

  async throttle() {
    const now = Date.now()
    // Remove requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0]
      const waitTime = this.windowMs - (now - oldestRequest)
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)}s`)
    }

    this.requests.push(now)
  }
}

// Usage
const scoreRateLimiter = new RateLimiter(10, 60000) // 10 requests per minute

export async function saveScore(studentId, scoreData) {
  await scoreRateLimiter.throttle() // Throws if rate limit exceeded

  const { data, error } = await supabase
    .from('students_score')
    .insert({ student_id: studentId, ...scoreData })

  return { data, error }
}
```

**Pros:**
- Simple to implement
- No external dependencies
- Works offline (PWA)

**Cons:**
- **Trivially bypassable** - user can clear localStorage or inspect/modify the code
- No protection against malicious users
- Only prevents accidental over-use (e.g., double-clicks)

**Rationale:** Client-side rate limiting is **not a security measure**. It's only useful for UX (preventing accidental double-submissions). Do NOT rely on this for production apps with untrusted users.

### Option 3: Database Triggers with Throttling (Partial Solution)

**Implementation:**

```sql
-- Create a table to track request counts
CREATE TABLE user_request_log (
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  request_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, request_type, request_time)
);

-- Create index for efficient cleanup
CREATE INDEX idx_request_log_time ON user_request_log(request_time);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_request_type TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests in the time window
  SELECT COUNT(*) INTO request_count
  FROM user_request_log
  WHERE user_id = p_user_id
    AND request_type = p_request_type
    AND request_time > NOW() - INTERVAL '1 second' * p_window_seconds;

  IF request_count >= p_max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded for %', p_request_type;
  END IF;

  -- Log this request
  INSERT INTO user_request_log (user_id, request_type)
  VALUES (p_user_id, p_request_type);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Trigger on students_score insert
CREATE OR REPLACE FUNCTION rate_limit_score_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_rate_limit(
    NEW.student_id,
    'score_insert',
    10,  -- Max 10 scores
    60   -- Per 60 seconds
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_score_rate_limit
BEFORE INSERT ON students_score
FOR EACH ROW EXECUTE FUNCTION rate_limit_score_insert();

-- Cleanup old logs periodically (via cron or Edge Function)
DELETE FROM user_request_log
WHERE request_time < NOW() - INTERVAL '1 hour';
```

**Pros:**
- Enforced at database level (cannot bypass)
- No external dependencies
- Works with existing RLS setup

**Cons:**
- **Performance overhead** on every insert/update
- Requires cleanup of the log table (can grow large)
- Less flexible than Redis-based solutions
- Adds complexity to database

**Rationale:** This provides **database-level enforcement** but has performance implications. Suitable for low-traffic apps or specific high-risk operations (e.g., preventing spam in comment systems). For general API rate limiting, Edge Functions with Redis are better.

### Option 4: Supabase Enterprise Rate Limiting (Future)

Supabase is working on exposing rate limiting controls at the Kong gateway level for enterprise customers. This is **not currently available** for standard plans.

**Source:** [Rate limits on postRest or graphql](https://github.com/orgs/supabase/discussions/19493)

### Recommendations for This Project

**Phase 1 (MVP):**
- Use **client-side rate limiting** for UX (prevent double-clicks)
- Rely on **RLS policies** for access control
- Monitor usage via Supabase Dashboard

**Phase 2 (Production):**
- Implement **Edge Functions with Redis** for critical endpoints:
  - Saving scores (limit: 20/minute per student)
  - Creating practice sessions (limit: 10/minute per student)
  - Daily goals progress (limit: 5/minute per student)
- Keep direct database access (via PostgREST) for read-heavy operations with RLS

**Why Edge Functions for Writes:**
- Write operations (INSERT/UPDATE) are the primary attack vector for cost/performance abuse
- Read operations are less risky (RLS already limits what users can see)
- Redis-based rate limiting scales better than database triggers

**Cost Consideration:**
- Upstash Redis free tier: 10,000 commands/day
- For a class of 30 students × 10 requests/day = 300 commands/day (well within free tier)

---

## Audit Logging & Compliance

### 1. Auth Audit Logs (Built-in)

Supabase automatically logs all authentication events:
- User sign-ups
- Logins (successful and failed)
- Password resets
- MFA events
- Session refreshes

**Access:** Navigate to **Authentication > Logs** in Supabase Dashboard

**Retention:** Available on all plans, but retention period varies by plan

**Rationale:** Auth audit logs help with security monitoring and compliance (detecting suspicious login patterns, brute force attempts, etc.). No setup required.

**Source:** [Auth Audit Logs | Supabase Docs](https://supabase.com/docs/guides/auth/audit-logs)

### 2. Platform Audit Logs (Team/Enterprise Only)

Logs for platform actions (creating projects, modifying Edge Functions, changing settings).

**Availability:** Team and Enterprise plans only

**Rationale:** For production deployments, upgrade to Team plan to get platform audit logs for compliance and security auditing.

**Source:** [Platform Audit Logs | Supabase Docs](https://supabase.com/docs/guides/security/platform-audit-logs)

### 3. Database Audit Logging with PGAudit

**Installation:**

```sql
-- Enable PGAudit extension
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure audit settings
ALTER SYSTEM SET pgaudit.log = 'write, ddl';  -- Log writes and schema changes
ALTER SYSTEM SET pgaudit.log_catalog = off;   -- Don't log system catalog queries
ALTER SYSTEM SET pgaudit.log_parameter = on;  -- Include query parameters

-- Reload configuration
SELECT pg_reload_conf();
```

**View audit logs:**

```sql
-- Query Postgres logs
SELECT * FROM pg_read_file('log/postgresql-2026-01-31.log');

-- Or use Supabase Dashboard: Database > Logs
```

**What to Log for COPPA Compliance:**

```sql
-- Log data access and modifications for child accounts
ALTER SYSTEM SET pgaudit.log_relation = on;

-- Create audit triggers for sensitive tables
CREATE OR REPLACE FUNCTION audit_student_data_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    table_name,
    operation,
    record_id,
    timestamp
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    NEW.id,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_student_progress
AFTER INSERT OR UPDATE OR DELETE ON student_skill_progress
FOR EACH ROW EXECUTE FUNCTION audit_student_data_access();
```

**Rationale:** PGAudit helps meet compliance requirements (COPPA, GDPR) by logging who accessed/modified children's data. Critical for handling parent/guardian requests for data access or deletion.

**Important:** Audit logs can grow large. Implement log rotation and archival strategies.

**Sources:**
- [PGAudit: Postgres Auditing | Supabase Docs](https://supabase.com/docs/guides/database/extensions/pgaudit)
- [Simple Audit Trail for Supabase Database](https://medium.com/@harish.siri/simpe-audit-trail-for-supabase-database-efefcce622ff)

### 4. SOC 2 Compliance

Supabase is **SOC 2 Type 2 compliant**, audited yearly by an independent third party.

**Coverage:**
- Security
- Availability
- Processing integrity
- Confidentiality
- Privacy

**Audit Period:** Rolling 12 months (March 1 - February 28)

**Rationale:** For apps handling children's data, SOC 2 compliance demonstrates that Supabase follows industry-standard security practices. You can reference Supabase's SOC 2 compliance in your own privacy policy.

**Access SOC 2 Report:** Available to Supabase customers via support request

**Source:** [SOC 2 Compliance and Supabase | Supabase Docs](https://supabase.com/docs/guides/security/soc-2-compliance)

---

## React Security Checklist

### 1. XSS Prevention

**Never Use dangerouslySetInnerHTML with User Input:**

```javascript
// BAD: XSS vulnerability
function StudentProfile({ bio }) {
  return <div dangerouslySetInnerHTML={{ __html: bio }} />
}

// GOOD: React escapes by default
function StudentProfile({ bio }) {
  return <div>{bio}</div>
}

// GOOD: If HTML is necessary, sanitize with DOMPurify
import DOMPurify from 'dompurify'

function StudentProfile({ bio }) {
  const sanitizedBio = DOMPurify.sanitize(bio)
  return <div dangerouslySetInnerHTML={{ __html: sanitizedBio }} />
}
```

**Rationale:** React escapes JSX content by default, preventing XSS. If you must render HTML (e.g., rich text from a teacher), sanitize it with DOMPurify first.

**Install DOMPurify:**
```bash
npm install dompurify
npm install -D @types/dompurify
```

**Source:** [React Security Checklist: Complete Guide for 2025](https://www.propelcode.ai/blog/react-security-checklist-complete-guide-2025)

### 2. Secure Dependency Management

**Automate Security Audits:**

```json
// package.json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "precommit": "npm run audit"
  }
}
```

**Use Tools:**
- **npm audit / yarn audit** - Built-in vulnerability scanning
- **Snyk** - Continuous dependency monitoring
- **Dependabot** - Automated PRs for dependency updates (GitHub)

**Rationale:** React apps typically have 500+ dependencies. Regular auditing catches known vulnerabilities. For children's apps, this is critical for compliance.

**Recommendation:** Run `npm audit` in CI/CD pipeline and block PRs with high/critical vulnerabilities.

**Source:** [React Security Checklist: Essential Practices Every Developer Must Follow](https://cybersierra.co/blog/react-security-checklist/)

### 3. Content Security Policy (CSP)

**Implementation:**

```html
<!-- public/index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.supabase.co;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

**For Production (via headers):**

```javascript
// vite.config.js
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co wss://*.supabase.co"
    }
  }
})
```

**Rationale:** CSP prevents XSS by whitelisting allowed sources for scripts, styles, and other resources. Note: VexFlow and Vite dev mode require `'unsafe-inline'` and `'unsafe-eval'`, which weakens CSP. For production, consider refactoring to remove these.

**Source:** [React Security Best Practices 2025](https://corgea.com/Learn/react-security-best-practices-2025)

### 4. Secure Environment Variables

**Never Commit Secrets:**

```bash
# .env.local (gitignored)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx  # OK to expose (public)
SUPABASE_SERVICE_ROLE_KEY=xxx  # NEVER expose to client
```

**Client-Side Safety:**

```javascript
// BAD: Exposes service_role key to client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY // NEVER do this
)

// GOOD: Only use anon key in client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY // Safe to expose
)
```

**Rationale:** The `anon` key is **safe to expose** (it's public, protected by RLS). The `service_role` key **bypasses RLS** and should NEVER be used in client code. Only use it server-side (Edge Functions, backend services).

**Source:** [Supabase Security | Supabase Docs](https://supabase.com/docs/guides/security)

### 5. HTTPS-Only in Production

**Enforce HTTPS:**

```javascript
// vite.config.js
export default defineConfig({
  server: {
    https: true, // For local testing with self-signed cert
  },
  build: {
    // No special config needed - HTTPS enforced by hosting provider
  }
})
```

**Service Worker Update:**

```javascript
// public/sw.js
self.addEventListener('fetch', (event) => {
  // Upgrade HTTP to HTTPS
  const url = new URL(event.request.url)
  if (url.protocol === 'http:' && url.hostname !== 'localhost') {
    url.protocol = 'https:'
    event.respondWith(fetch(url.toString()))
    return
  }
  // ... rest of fetch handler
})
```

**Rationale:** HTTPS is required for PWAs (service workers won't register on HTTP). For children's apps handling sensitive data, HTTPS is mandatory for COPPA compliance.

**Source:** [React Security Vulnerabilities: Code Review Checklist for 2025](https://www.propelcode.ai/blog/react-security-vulnerabilities-code-review-checklist)

### 6. Automated Security Linting

**Install ESLint Security Plugin:**

```bash
npm install -D eslint-plugin-security eslint-plugin-react-security
```

**Configure ESLint:**

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:security/recommended",
    "plugin:react-security/recommended"
  ],
  "plugins": ["security", "react-security"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "react-security/no-dangerously-set-innerhtml": "error"
  }
}
```

**Rationale:** Security linters catch common vulnerabilities during development (before code review). Examples: `eval()` usage, regex DoS, XSS via dangerouslySetInnerHTML.

**Source:** [10 React security best practices | Snyk](https://snyk.io/blog/10-react-security-best-practices/)

---

## COPPA Compliance Checklist

### Updated COPPA Rule (Effective June 23, 2025)

Key changes impacting this project:

1. **Expanded "Personal Information" Definition:**
   - Biometric identifiers (facial recognition, voiceprints)
   - Mobile phone numbers (when used for text messages)
   - Any persistent identifier tied to a child

2. **Separate Consent for Third Parties:**
   - Must get explicit consent for disclosing child data to third parties
   - Exception: If third-party is "integral" to the service (e.g., Supabase for data storage)

3. **Enhanced Parent Notices:**
   - Must disclose third-party categories that may receive child data
   - Must disclose data retention policy

**Sources:**
- [COPPA Compliance in 2025: A Practical Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [Children's Online Privacy in 2025: The Amended COPPA Rule](https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule)

### Implementation Checklist

#### 1. Age Gate
- [ ] Collect birthdate on signup
- [ ] Block direct signup for children under 13
- [ ] Require parent/teacher account creation first

```javascript
// Example age gate
function validateAge(birthdate) {
  const age = calculateAge(birthdate)
  if (age < 13) {
    throw new Error('Children under 13 must have a parent or teacher create their account')
  }
  return true
}
```

#### 2. Parental Consent
- [ ] Implement verifiable parental consent mechanism
- [ ] Acceptable methods (per FTC):
  - Consent form (signed and returned via mail/fax/scan)
  - Credit card verification ($1 charge, refunded)
  - Video conference with ID verification
  - Teacher acting as parent representative (for school use)
- [ ] Store consent records with timestamp

**For School Context:**
Teachers can act as agents for parental consent if the school has obtained parent consent for the educational program.

**Source:** [COPPA Compliance: How to design COPPA compliant mobile apps for kids](https://www.techaheadcorp.com/blog/coppa-compliance/)

#### 3. Data Minimization
- [ ] Only collect data necessary for the app's function
- [ ] Remove unnecessary fields from student profile:
  - ❌ Full birthdate (just age verification)
  - ❌ Email (teacher email is sufficient)
  - ❌ Profile photo (use avatars)
  - ✅ Username (non-identifiable)
  - ✅ Progress data (core feature)

#### 4. Disable Third-Party Services
- [ ] Disable analytics for child accounts
- [ ] Disable advertising entirely (COPPA prohibits behavioral ads for children)
- [ ] Audit all SDKs and libraries for third-party tracking

```javascript
// Example: Conditional analytics
function initAnalytics(user) {
  if (user.role === 'teacher') {
    // OK to track teacher usage
    analytics.init()
  } else {
    // Do NOT track student usage
    console.log('Analytics disabled for student accounts')
  }
}
```

**Source:** [COPPA Compliance in 2025: A Practical Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)

#### 5. Parent Access & Deletion Rights
- [ ] Provide parent portal to view child's data
- [ ] Implement "Delete Student Account" feature
- [ ] Provide data export (JSON format)

```javascript
// Example parent access
async function getStudentData(studentId, requesterId) {
  // Verify requester is the student's teacher
  const isAuthorized = await verifyTeacherStudentRelationship(requesterId, studentId)
  if (!isAuthorized) {
    throw new Error('Unauthorized')
  }

  const data = await supabase
    .from('students')
    .select('id, username, total_xp, current_level, created_at')
    .eq('id', studentId)
    .single()

  return data
}
```

#### 6. Privacy Policy
- [ ] Write child-focused privacy policy (simple language)
- [ ] Disclose what data is collected and why
- [ ] Disclose third parties that receive data (Supabase)
- [ ] Disclose data retention policy
- [ ] Include contact information for privacy requests

**Required Disclosures:**
- "We collect your username and game progress to track your learning"
- "We store data with Supabase (cloud provider) to save your progress"
- "We do NOT share your data with advertisers"
- "Parents can request to view or delete your data by contacting [email]"

#### 7. App Store Compliance
- [ ] Set age rating to "Ages 9+" (Google Play) / "4+" (Apple)
- [ ] Declare COPPA compliance in app store listings
- [ ] Submit privacy policy URL
- [ ] Disable ads and third-party tracking for child accounts

**Google Play Requirements:**
- Must use "Designed for Families" program
- All third-party SDKs must be COPPA-compliant
- Must implement age-neutral content

**Apple App Store Requirements:**
- Must provide privacy nutrition label
- Apps rated "4+" cannot have behavioral advertising
- Contextual ads must be age-appropriate

**Sources:**
- [App Store Age Ratings Guide for iOS and Android](https://capgo.app/blog/app-store-age-ratings-guide/)
- [COPPA Compliance: How to design COPPA compliant mobile apps for kids](https://www.techaheadcorp.com/blog/coppa-compliance/)

---

## Prioritized Recommendations

### Immediate (Phase 1 - Pre-MVP)

1. **Enable RLS on All Tables**
   - **Why:** Foundation of security - without RLS, all data is exposed
   - **Effort:** 1 day
   - **Impact:** Critical

2. **Fix user_metadata Usage in RLS Policies**
   - **Why:** Current vulnerability - users can modify their role
   - **Effort:** 1 day
   - **Impact:** Critical
   - **Action:** Migrate to database table checks or custom JWT claims via Access Token Hook

3. **Implement Secure Logout**
   - **Why:** Shared device scenario (schools) - must clear localStorage
   - **Effort:** 0.5 days
   - **Impact:** High
   - **Action:** Update logout function to clear all user-specific keys

4. **Add Authorization Checks to SECURITY DEFINER Functions**
   - **Why:** Functions currently bypass RLS without verification
   - **Effort:** 1 day
   - **Impact:** Critical
   - **Action:** Add `IF auth.uid() != p_student_id THEN RAISE EXCEPTION` checks

5. **Configure Session Timeouts**
   - **Why:** Shared devices require auto-logout
   - **Effort:** 0.5 days
   - **Impact:** High
   - **Action:** Set inactivity timeout (15 min) and max session (2 hours) in Supabase Dashboard

### Short-Term (Phase 2 - Pre-Production)

6. **Implement Custom JWT Claims with Access Token Hook**
   - **Why:** Performance improvement for RLS policies
   - **Effort:** 2 days
   - **Impact:** Medium
   - **Action:** Create `auth.custom_access_token_hook` function, add role to JWT

7. **Client-Side Inactivity Timeout**
   - **Why:** Immediate logout on inactivity (better UX than server timeout)
   - **Effort:** 1 day
   - **Impact:** Medium
   - **Action:** Implement `useInactivityTimeout` hook

8. **Audit Third-Party Dependencies**
   - **Why:** COPPA compliance - must disable tracking for child accounts
   - **Effort:** 1 day
   - **Impact:** High
   - **Action:** Review all npm packages, remove analytics/tracking for students

9. **Implement Child Data Anonymization**
   - **Why:** COPPA requirement - minimize PII exposure
   - **Effort:** 1 day
   - **Impact:** Medium
   - **Action:** Anonymize usernames in leaderboards/shared features

10. **Add Content Security Policy**
    - **Why:** XSS prevention layer
    - **Effort:** 0.5 days
    - **Impact:** Medium
    - **Action:** Add CSP meta tag and configure for VexFlow

### Medium-Term (Phase 3 - Production Hardening)

11. **Edge Functions with Redis Rate Limiting**
    - **Why:** Prevent cost/performance abuse via unlimited writes
    - **Effort:** 3 days
    - **Impact:** High
    - **Action:** Deploy Edge Functions for score saving, session creation
    - **Cost:** Upstash Redis free tier (10k commands/day)

12. **Enable PGAudit for Compliance**
    - **Why:** COPPA audit trail for data access/modification
    - **Effort:** 1 day
    - **Impact:** Medium
    - **Action:** Install PGAudit extension, configure logging

13. **Implement Parent Data Access Portal**
    - **Why:** COPPA requirement - parents must be able to view child data
    - **Effort:** 3 days
    - **Impact:** High
    - **Action:** Build teacher dashboard feature for viewing student data

14. **Switch to sessionStorage for Shared Devices**
    - **Why:** Better security on school computers
    - **Effort:** 0.5 days
    - **Impact:** Medium
    - **Trade-off:** Users must log in per tab (acceptable for schools)

15. **Automated Security Scanning in CI/CD**
    - **Why:** Catch vulnerabilities before production
    - **Effort:** 1 day
    - **Impact:** Medium
    - **Action:** Add npm audit, Snyk, and eslint-plugin-security to GitHub Actions

### Long-Term (Phase 4 - Scaling & Compliance)

16. **Upgrade to Supabase Team Plan**
    - **Why:** Get platform audit logs for compliance
    - **Effort:** N/A (billing change)
    - **Impact:** Medium
    - **Cost:** $25/month

17. **Implement Age Gate & Parental Consent Flow**
    - **Why:** COPPA compliance - required before public launch
    - **Effort:** 5 days
    - **Impact:** Critical
    - **Action:** Build signup flow with birthdate check, teacher consent mechanism

18. **Write COPPA-Compliant Privacy Policy**
    - **Why:** Required for app store submission
    - **Effort:** 2 days (with legal review)
    - **Impact:** Critical
    - **Action:** Draft policy in simple language, have lawyer review

19. **SOC 2 Audit Report Review**
    - **Why:** Reference Supabase's compliance in your own certifications
    - **Effort:** 0.5 days
    - **Impact:** Low
    - **Action:** Request SOC 2 report from Supabase support

20. **Consider Encryption at Rest for Sensitive Fields**
    - **Why:** Extra protection for PII (usernames, teacher emails)
    - **Effort:** 3 days
    - **Impact:** Low (Supabase already encrypts at rest)
    - **Action:** Implement client-side encryption for extra-sensitive fields (optional)

---

## Decision Matrix

| Feature | Security Impact | Compliance Impact | Effort | Priority |
|---------|----------------|-------------------|--------|----------|
| Enable RLS | Critical | High | Low | P0 |
| Fix user_metadata | Critical | Medium | Low | P0 |
| Secure logout | High | Medium | Low | P0 |
| SECURITY DEFINER auth checks | Critical | Medium | Low | P0 |
| Session timeouts | High | Medium | Low | P0 |
| Custom JWT claims | Medium | Low | Medium | P1 |
| Client inactivity timeout | Medium | Medium | Low | P1 |
| Audit dependencies | Medium | High | Low | P1 |
| Anonymize child data | Medium | High | Low | P1 |
| Content Security Policy | Medium | Low | Low | P1 |
| Rate limiting (Edge Functions) | High | Medium | High | P2 |
| PGAudit | Low | High | Low | P2 |
| Parent data access | Medium | Critical | Medium | P2 |
| sessionStorage | Medium | Medium | Low | P2 |
| Security scanning CI/CD | Medium | Medium | Low | P2 |
| Supabase Team plan | Low | Medium | N/A | P3 |
| Age gate & consent | High | Critical | High | P3 |
| Privacy policy | Low | Critical | Medium | P3 |
| SOC 2 review | Low | Low | Low | P3 |
| Encryption at rest | Low | Low | High | P4 |

**Priority Levels:**
- **P0:** Must complete before MVP release
- **P1:** Must complete before production launch
- **P2:** Must complete before app store submission
- **P3:** Must complete before public availability
- **P4:** Nice to have (optional enhancement)

---

## Architecture Decision Records

### ADR-001: Use Database Tables for Role Verification (Not JWT Metadata)

**Status:** Recommended

**Context:** Need to verify user roles (student vs teacher) in RLS policies.

**Decision:** Use database table checks (`EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid())`) instead of JWT `user_metadata` claims.

**Rationale:**
- `user_metadata` can be modified by users via `supabase.auth.updateUser()`
- Database tables are the source of truth
- Custom JWT claims via Access Token Hook can be added later for performance

**Consequences:**
- Slightly slower than JWT claims (requires table lookup)
- More secure (cannot be manipulated by client)
- Easier to update roles (no need for user re-login)

### ADR-002: Use Edge Functions for Rate Limiting (Not Database Triggers)

**Status:** Recommended for Production

**Context:** Need to prevent abuse via unlimited database writes.

**Decision:** Implement rate limiting via Edge Functions with Redis for critical write operations.

**Rationale:**
- Database triggers add overhead to every operation
- Redis-based rate limiting is more flexible and performant
- Edge Functions provide API gateway-like functionality
- Can rate limit by user ID (from Supabase Auth)

**Consequences:**
- Requires external Redis instance (Upstash free tier)
- Adds architectural complexity
- Increases latency (cold starts: 200-400ms)
- Better scalability and cost control

**Alternative Considered:** Database triggers - rejected due to performance concerns and table growth.

### ADR-003: Use sessionStorage for Shared Devices (Not localStorage)

**Status:** Recommended for Schools

**Context:** App will be used on shared computers in schools.

**Decision:** Use `sessionStorage` for Supabase auth persistence instead of `localStorage`.

**Rationale:**
- `sessionStorage` clears on tab close (auto-logout)
- Better security for shared devices
- Prevents next user from accessing previous user's data

**Consequences:**
- Users must log in per tab (worse UX)
- Acceptable trade-off for school environment
- May need to provide "Keep me logged in" option for personal devices

**Alternative Considered:** Aggressive localStorage cleanup on logout - partial solution, doesn't protect against forgotten logouts.

### ADR-004: Custom JWT Claims via Access Token Hook

**Status:** Recommended for Performance

**Context:** Need to check user roles frequently in RLS policies.

**Decision:** Use Supabase's Custom Access Token Hook to add `user_role` claim to JWT.

**Rationale:**
- JWT claims are available via `current_setting('request.jwt.claims')` without disk I/O
- Faster than querying database tables in every RLS policy
- Official Supabase feature (not a workaround)

**Consequences:**
- Claims don't update automatically (requires re-login)
- Database tables still remain source of truth
- Requires decoding JWT client-side to access claims in React

**Implementation:** Use both approaches - custom claims for RLS performance, database tables as source of truth.

---

## Additional Resources

### Supabase Documentation
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
- [User Sessions](https://supabase.com/docs/guides/auth/sessions)
- [Rate Limiting Edge Functions](https://supabase.com/docs/guides/functions/examples/rate-limiting)
- [PGAudit Extension](https://supabase.com/docs/guides/database/extensions/pgaudit)
- [SOC 2 Compliance](https://supabase.com/docs/guides/security/soc-2-compliance)

### COPPA Compliance
- [COPPA Compliance in 2025: A Practical Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [Children's Online Privacy in 2025: The Amended COPPA Rule](https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule)
- [COPPA Compliance Checklist](https://countly.com/blog/coppa-compliance-checklist)
- [App Store Age Ratings Guide](https://capgo.app/blog/app-store-age-ratings-guide/)

### React Security
- [React Security Checklist: Complete Guide for 2025](https://www.propelcode.ai/blog/react-security-checklist-complete-guide-2025)
- [React Security Best Practices 2025](https://corgea.com/Learn/react-security-best-practices-2025)
- [10 React security best practices | Snyk](https://snyk.io/blog/10-react-security-best-practices/)

### Multi-Tenancy Patterns
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Efficient multi tenancy with Supabase](https://arda.beyazoglu.com/supabase-multi-tenancy)

### Community Discussions
- [RLS policy based on user metadata](https://github.com/orgs/supabase/discussions/13091)
- [Rate limits on postRest or graphql](https://github.com/orgs/supabase/discussions/19493)
- [SECURITY DEFINER functions](https://github.com/orgs/supabase/discussions/20521)

---

**Next Steps:**

1. Review this document with the development team
2. Create GitHub issues for P0 items (pre-MVP security fixes)
3. Update project roadmap with security milestones
4. Schedule security audit before production launch
5. Engage legal counsel for COPPA compliance review

---

*This research reflects best practices as of January 2026 and incorporates the latest COPPA amendments effective June 23, 2025.*
