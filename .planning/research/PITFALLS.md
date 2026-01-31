# Security Pitfalls Research

**Research Date:** January 31, 2026
**Target:** React + Supabase piano learning PWA for children (ages 8+)
**Purpose:** Identify common security mistakes to avoid during security hardening phase

---

## Overview

This document catalogs security pitfalls specific to React + Supabase applications handling child data, with emphasis on COPPA compliance, authentication security, and data protection on shared devices (common in school environments).

### Known Vulnerabilities in Codebase

Based on audit, the following concerns have been identified:
- ✅ **FIXED**: `user_metadata` abuse in RLS policies (migration `20260127000001`)
- ✅ **FIXED**: Missing auth checks in `award_xp()` SECURITY DEFINER function (migration `20260126000001`)
- ⚠️ **PARTIAL**: Service worker auth endpoint exclusion implemented but needs verification
- ❌ **TODO**: localStorage migration tracking can be manipulated
- ❌ **TODO**: No session timeout for idle users
- ❌ **TODO**: No rate limiting on score submissions
- ❌ **TODO**: No client-side authorization verification in services

---

## 1. Supabase-Specific Pitfalls

### 1.1 user_metadata Abuse in RLS Policies

**Severity:** 🔴 Critical (CVE-worthy)

**What It Is:**
Using JWT `user_metadata` claims in Row Level Security policies for authorization decisions. Since `user_metadata` can be modified by authenticated users via `supabase.auth.updateUser()`, relying on it for access control creates a privilege escalation vulnerability.

**How It Happens:**
```sql
-- ❌ VULNERABLE: User can modify their own metadata
CREATE POLICY "Admin access" ON sensitive_table
FOR ALL USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
```

**Attack Vector:**
1. User authenticates as normal student
2. User calls `supabase.auth.updateUser({ data: { role: 'admin' } })`
3. User's JWT now contains `user_metadata.role = 'admin'`
4. RLS policy grants admin access

**Detection Method:**
- Use Supabase Security Advisor (check #0015: "RLS references user_metadata")
- Run migration check: `grep -r "user_metadata" supabase/migrations/`
- Automated scan: `splinter` tool for Supabase security issues

**Prevention Strategy:**
```sql
-- ✅ SECURE: Use database state that users cannot modify
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teachers
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Admin access" ON sensitive_table
FOR ALL USING (is_admin());
```

**Key Principles:**
- Never trust client-modifiable data for authorization
- Store roles and permissions in database tables with RLS protection
- Use SECURITY DEFINER helper functions to check database state
- Mark helper functions as STABLE for query optimizer efficiency

**Phase to Address:** Phase 1 (Critical Security Fixes)
**Status in Codebase:** ✅ Fixed in migration `20260127000001_fix_admin_rls_verification.sql`

**References:**
- [Supabase Security Advisor: RLS References user_metadata](https://supabase.github.io/splinter/0015_rls_references_user_metadata/)
- [Supabase Security Retro: 2025](https://supabase.com/blog/supabase-security-2025-retro)
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

### 1.2 SECURITY DEFINER Functions Without Authorization Checks

**Severity:** 🔴 Critical

**What It Is:**
PostgreSQL functions marked `SECURITY DEFINER` execute with the privileges of the function creator (typically superuser), bypassing RLS policies. Without explicit authorization checks, any authenticated user can call these functions to escalate privileges.

**How It Happens:**
```sql
-- ❌ VULNERABLE: Any authenticated user can award XP to any student
CREATE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE students SET total_xp = total_xp + p_xp_amount
  WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Attack Vector:**
1. Attacker authenticates as Student A
2. Attacker calls `award_xp('student-b-uuid', 10000)`
3. Function runs with superuser privileges, bypassing RLS
4. Student B gains unearned XP, corrupting leaderboard

**Detection Method:**
```bash
# Find all SECURITY DEFINER functions
grep -r "SECURITY DEFINER" supabase/migrations/

# Check each function for auth.uid() checks
# Look for patterns like:
# - IF auth.uid() IS NULL THEN RAISE EXCEPTION
# - IF auth.uid() != p_user_id THEN RAISE EXCEPTION
```

**Warning Signs:**
- SECURITY DEFINER functions in `public` schema (exposed via API)
- Functions accepting user IDs without verification
- No `auth.uid()` checks in function body
- Functions that modify data without ownership verification

**Prevention Strategy:**
```sql
-- ✅ SECURE: Explicit authorization check
CREATE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS TABLE(...) AS $$
BEGIN
  -- CRITICAL: Verify caller owns the resource
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only award XP to yourself';
  END IF;

  -- Safe to proceed...
  UPDATE students SET total_xp = total_xp + p_xp_amount
  WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add protective comment
COMMENT ON FUNCTION award_xp IS
  'Awards XP to student. Security: auth.uid() must equal p_student_id';
```

**Best Practices:**
- Prefer `SECURITY INVOKER` (default) unless RLS bypass is explicitly needed
- Always set `search_path` in SECURITY DEFINER functions to prevent SQL injection
- Never expose SECURITY DEFINER functions in `public` schema if possible
- Add authorization checks at the start of every SECURITY DEFINER function
- Document security requirements in function comments

**Phase to Address:** Phase 1 (Critical Security Fixes)
**Status in Codebase:** ✅ Fixed in migration `20260126000001_fix_award_xp_security.sql`

**References:**
- [Supabase SQL: RLS Policies with security definer functions](https://supabase-sql.vercel.app/rls-policies-with-security-definer-function)
- [Database Functions | Supabase Docs](https://supabase.com/docs/guides/database/functions)
- [Supabase Discussion #36942: Documentation inconsistency](https://github.com/orgs/supabase/discussions/36942)

---

### 1.3 RLS Policy Gaps (Missing or Disabled RLS)

**Severity:** 🔴 Critical

**What It Is:**
Tables without Row Level Security enabled or with incomplete policy coverage, allowing unauthorized access to all data. The 2025 CVE-2025-48757 exposed 170+ applications due to missing RLS in generated code.

**Statistics:**
- 83% of exposed Supabase databases involve RLS misconfigurations
- RLS is the #1 cause of Supabase data breaches

**How It Happens:**
```sql
-- ❌ VULNERABLE: RLS disabled (default state)
CREATE TABLE student_scores (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  score INTEGER
);
-- RLS not enabled = anyone can read/write all data
```

**Attack Vector:**
1. Attacker authenticates as any user
2. Attacker queries `student_scores` table via API
3. All rows returned (no RLS filtering)
4. Attacker accesses all students' scores

**Detection Method:**
```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- rowsecurity = false means vulnerable

-- Check which tables have policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

**Warning Signs:**
- New tables created without RLS enable command
- Tables in exposed schemas (`public`) without policies
- Generic policies like `USING (true)` that allow all access
- No testing of RLS policies with different user contexts

**Prevention Strategy:**
```sql
-- ✅ SECURE: Enable RLS and create restrictive policies
ALTER TABLE student_scores ENABLE ROW LEVEL SECURITY;

-- Students can only read their own scores
CREATE POLICY "Students can read own scores"
ON student_scores FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can only insert their own scores
CREATE POLICY "Students can insert own scores"
ON student_scores FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());
```

**Defense in Depth:**
- Enable RLS on ALL tables in exposed schemas
- Create separate policies for SELECT, INSERT, UPDATE, DELETE
- Test policies by switching to `anon` and `authenticated` roles
- Use Supabase Security Advisor to scan for missing policies
- Set up database tests that verify RLS effectiveness

**Phase to Address:** Phase 1 (Critical Security Fixes)
**Status in Codebase:** ⚠️ Needs verification - run Security Advisor

**References:**
- [Your Supabase is public if you turn off RLS | Hacker News](https://news.ycombinator.com/item?id=46355345)
- [Supabase Security Flaw: 170+ Apps Exposed by Missing RLS](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/)
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

### 1.4 Insecure Direct Object Reference (IDOR)

**Severity:** 🟠 High

**What It Is:**
Client code accepts user-provided IDs (student_id, session_id, etc.) without verifying the authenticated user has permission to access that resource. Even with RLS enabled, client-side services should validate ownership before making requests.

**How It Happens:**
```javascript
// ❌ VULNERABLE: Accepts any studentId without verification
export async function updateStudentProgress(studentId, nodeId, stars, score) {
  const { error } = await supabase
    .from('student_skill_progress')
    .upsert({ student_id: studentId, node_id: nodeId, stars, score });

  if (error) throw error;
}

// Attacker calls: updateStudentProgress('victim-uuid', 'node1', 3, 100)
// RLS *should* block this, but defense in depth requires client check too
```

**Attack Vector:**
1. Attacker inspects network requests to find victim's student_id
2. Attacker calls API function with victim's ID
3. Without client-side check, request reaches database
4. If RLS has gaps, data is modified

**Detection Method:**
```bash
# Search for service functions accepting user IDs
grep -r "studentId" src/services/*.js

# Check each function for auth.getUser() verification
# Look for pattern: if (user.id !== studentId) throw Error
```

**Warning Signs:**
- Service functions accepting user IDs as parameters
- No `getUser()` calls before database operations
- Direct use of URL parameters (e.g., `/student/:id`) without verification
- Teacher functions not verifying teacher-student relationship

**Prevention Strategy:**
```javascript
// ✅ SECURE: Verify user owns the resource
export async function updateStudentProgress(studentId, nodeId, stars, score) {
  // Layer 1: Client-side authorization check (fast, user-friendly)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== studentId) {
    console.error('Authorization failed: user mismatch');
    throw new Error('Unauthorized: Cannot modify another user\'s progress');
  }

  // Layer 2: Database RLS (server-side enforcement)
  const { error } = await supabase
    .from('student_skill_progress')
    .upsert({ student_id: studentId, node_id: nodeId, stars, score });

  if (error) {
    // RLS violations surface here
    console.error('Database error:', error);
    throw error;
  }
}
```

**Teacher-Student Relationship Verification:**
```javascript
// For teacher operations, verify relationship exists
async function verifyTeacherStudentConnection(teacherId, studentId) {
  const { data } = await supabase
    .from('teacher_student')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .single();

  return !!data;
}

export async function deleteStudentSession(teacherId, studentId, sessionId) {
  const isConnected = await verifyTeacherStudentConnection(teacherId, studentId);
  if (!isConnected) {
    throw new Error('Unauthorized: No teacher-student relationship');
  }

  // Safe to proceed...
}
```

**Phase to Address:** Phase 2 (Service Layer Hardening)
**Status in Codebase:** ❌ Missing in `src/services/skillProgressService.js` and others

**References:**
- [Insecure Direct Object Reference Prevention - OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [What is IDOR (Insecure Direct Object Reference)?](https://www.varonis.com/blog/what-is-idor-insecure-direct-object-reference)
- [Row-Level Recklessness: Testing Supabase Security](https://www.precursorsecurity.com/security-blog/row-level-recklessness-testing-supabase-security)

---

### 1.5 Missing Rate Limiting on Score/Progress Submissions

**Severity:** 🟡 Medium (but important for competitive integrity)

**What It Is:**
No throttling on score submission endpoints allows automated score farming, leaderboard manipulation, and XP inflation. Critical for maintaining competitive fairness in gamified learning.

**How It Happens:**
```javascript
// ❌ VULNERABLE: No rate limiting
export async function saveScore(studentId, gameType, score) {
  await supabase.from('students_score').insert({
    student_id: studentId,
    game_type: gameType,
    score: score
  });
}

// Attacker script:
// for (let i = 0; i < 1000; i++) {
//   await saveScore(userId, 'notes', 100);
// }
```

**Attack Vector:**
1. Attacker writes automated script to submit perfect scores
2. Script runs in loop, submitting hundreds of scores per minute
3. Student gains massive XP and leaderboard position unfairly
4. Legitimate students lose motivation

**Detection Method:**
```sql
-- Check for suspicious score patterns
SELECT student_id, COUNT(*), MAX(created_at) - MIN(created_at) as time_span
FROM students_score
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY student_id
HAVING COUNT(*) > 50;
-- High count in short time = likely abuse
```

**Warning Signs:**
- Score insertion functions with no throttling
- Same student submitting >100 scores/hour
- Perfect scores submitted at regular intervals (bot pattern)
- Score timestamps less than game duration apart

**Prevention Strategies:**

**Option 1: PostgreSQL-based Rate Limiting (Recommended for Supabase)**
```sql
-- Create rate limit tracking table
CREATE TABLE private.rate_limits (
  ip_address TEXT,
  user_id UUID,
  action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit function
CREATE FUNCTION check_rate_limit(p_user_id UUID, p_action TEXT, p_max_requests INT, p_window_minutes INT)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INT;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM private.rate_limits
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  IF request_count >= p_max_requests THEN
    RETURN FALSE; -- Rate limit exceeded
  END IF;

  -- Log this request
  INSERT INTO private.rate_limits (user_id, action) VALUES (p_user_id, p_action);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use in save_score function
CREATE FUNCTION save_score(p_student_id UUID, p_score INT)
RETURNS void AS $$
BEGIN
  -- Check rate limit: max 10 scores per 5 minutes
  IF NOT check_rate_limit(p_student_id, 'submit_score', 10, 5) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before submitting more scores.';
  END IF;

  -- Proceed with score save...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Option 2: Edge Function with Redis**
```typescript
// Edge function with Redis rate limiting
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: Deno.env.get('REDIS_URL'),
  token: Deno.env.get('REDIS_TOKEN')
});

Deno.serve(async (req) => {
  const { studentId, score } = await req.json();

  // Rate limit: 10 requests per minute per user
  const key = `rate_limit:score:${studentId}`;
  const requests = await redis.incr(key);

  if (requests === 1) {
    await redis.expire(key, 60); // 1 minute window
  }

  if (requests > 10) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Proceed with score save...
});
```

**Option 3: Client-side Minimum Game Duration**
```javascript
// Record when game started
const gameStartTime = Date.now();

async function submitScore(score) {
  const gameDuration = Date.now() - gameStartTime;
  const minimumDuration = 30000; // 30 seconds

  if (gameDuration < minimumDuration) {
    throw new Error('Game completed too quickly. Please play through the full session.');
  }

  // Submit with duration for server validation
  await supabase.from('students_score').insert({
    score,
    game_duration_ms: gameDuration
  });
}
```

**Best Practices:**
- Implement per-user rate limits (not just IP-based)
- Log rate limit violations for monitoring
- Use exponential backoff on 429 responses
- Track game session duration to detect instant completions
- Monitor for statistical anomalies (too many perfect scores)

**Phase to Address:** Phase 3 (Abuse Prevention)
**Status in Codebase:** ❌ Not implemented

**References:**
- [Rate Limiting and Protection | Supabase Auth](https://deepwiki.com/supabase/auth/6.2-rate-limiting-and-protection)
- [Optimize Supabase API: Rate Limiting Guide](https://blog.mansueli.com/rate-limiting-supabase-requests-with-postgresql-and-pgheaderkit)
- [Rate Limiting Edge Functions | Supabase Docs](https://supabase.com/docs/guides/functions/examples/rate-limiting)

---

## 2. Client-Side Pitfalls (React/PWA)

### 2.1 Service Worker Caching Authentication Tokens

**Severity:** 🔴 Critical (especially on shared devices)

**What It Is:**
Service workers cache HTTP responses including those containing JWT tokens or session data. On shared devices (common in schools), cached auth data persists after logout, allowing the next user to access the previous user's account.

**How It Happens:**
```javascript
// ❌ VULNERABLE: Caches ALL fetch requests including auth
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});

// Result: Auth tokens cached, persist after logout
```

**Attack Scenario (School Environment):**
1. Student A logs in on shared iPad
2. Student A uses app (JWT tokens cached by service worker)
3. Student A clicks logout but tokens remain in cache
4. Student B opens app on same iPad
5. Service worker serves cached auth responses
6. Student B gains access to Student A's account

**Detection Method:**
```bash
# Check if service worker caches auth endpoints
grep -A 20 "addEventListener.*fetch" public/sw.js

# Look for:
# - Lack of URL filtering in cache logic
# - No exclusion patterns for /auth/, /token/, /session/
# - Cache-all patterns like caches.match(event.request)
```

**Warning Signs:**
- Service worker caches all responses indiscriminately
- No auth endpoint exclusion patterns
- Testing on shared devices shows session persistence after logout
- Browser dev tools > Application > Cache Storage shows JWT tokens

**Prevention Strategy:**
```javascript
// ✅ SECURE: Exclude auth endpoints from caching
const AUTH_EXCLUDED_PATTERNS = [
  /\/auth\//,       // All auth-related paths
  /\/token/,        // Token endpoints
  /\/session/,      // Session endpoints
  /\/logout/,       // Logout endpoints
  /\/user/,         // User info endpoints
];

function isAuthEndpoint(url) {
  if (!url.hostname.includes('supabase.co')) return false;
  return AUTH_EXCLUDED_PATTERNS.some(pattern => pattern.test(url.pathname));
}

self.addEventListener('fetch', (event) => {
  // NEVER cache auth-related requests
  if (isAuthEndpoint(new URL(event.request.url))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Apply caching strategy for non-auth requests
  event.respondWith(
    caches.match(event.request).then(/* ... */)
  );
});

// On logout, clear auth cache entries
async function clearAuthCache() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();

  for (const request of requests) {
    if (isAuthEndpoint(new URL(request.url))) {
      await cache.delete(request);
    }
  }
}
```

**Additional Protections:**
- Clear service worker cache on logout
- Use sessionStorage instead of localStorage for sensitive data
- Implement aggressive cache-busting for auth-related requests
- Add `Cache-Control: no-store` headers to auth endpoints
- Test on shared devices to verify logout clears all state

**Phase to Address:** Phase 1 (Critical Security Fixes)
**Status in Codebase:** ✅ Implemented in `public/sw.js` (lines 29-60), needs testing

**References:**
- [Service workers to manage our JWT tokens](https://about.grabyo.com/service-workers-jwt-tokens/)
- [Using Service Worker as an auth relay](https://itnext.io/using-service-worker-as-an-auth-relay-5abc402878dd)
- [Session management with service workers | Firebase](https://firebase.google.com/docs/auth/web/service-worker-sessions)

---

### 2.2 localStorage Manipulation on Shared Devices

**Severity:** 🟠 High (especially for children's apps)

**What It Is:**
localStorage persists across browser sessions and is not automatically cleared on logout. User-specific data (migration flags, cached progress, settings) remains accessible to the next user on shared devices.

**How It Happens:**
```javascript
// ❌ VULNERABLE: Migration flag persists after logout
export const isMigrated = (studentId) => {
  const migrationKey = `trail_migration_v2_${studentId}`;
  return localStorage.getItem(migrationKey) === 'complete';
};

// Problem: Attacker can set migration flag for another user
// localStorage.setItem('trail_migration_v2_victim-uuid', 'complete')
```

**Attack Scenarios:**

**Scenario 1: Migration Manipulation**
1. Attacker logs in, opens dev console
2. Attacker sets `localStorage.setItem('trail_migration_v2_victim-uuid', 'complete')`
3. Victim logs in later on same device
4. Migration skipped due to manipulated flag
5. Victim loses XP bonus or has corrupted progress

**Scenario 2: Data Leakage**
1. Student A logs out of shared school computer
2. localStorage still contains cached user data
3. Student B opens browser dev tools
4. Student B reads Student A's cached data from localStorage

**Detection Method:**
```bash
# Find all localStorage usage
grep -r "localStorage" src/

# Check for:
# - User-specific keys not cleared on logout
# - Sensitive data stored in localStorage (tokens, PII)
# - Migration/state flags that can be manipulated
```

**Warning Signs:**
- No localStorage clearing logic in logout function
- User-specific keys stored with predictable patterns
- Authentication tokens in localStorage (should use httpOnly cookies)
- Personal data cached in localStorage

**Prevention Strategy:**

**Solution 1: Clear localStorage on Logout**
```javascript
// ✅ SECURE: Comprehensive logout with localStorage cleanup
async function logout() {
  // Get user ID before signing out
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Clear ALL user-specific localStorage keys
  if (userId) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // Remove user-specific keys
      if (key?.includes(userId) ||
          key?.startsWith('user_') ||
          key?.startsWith('progress_') ||
          key?.startsWith('trail_migration_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Clear migration flags
  localStorage.removeItem('xp_migration_complete');
  localStorage.removeItem('cached_user_progress');

  navigate('/login');
}
```

**Solution 2: Use sessionStorage for Sensitive Data**
```javascript
// sessionStorage clears automatically when browser/tab closes
export const isMigrated = (studentId) => {
  const migrationKey = `trail_migration_v2_${studentId}`;
  // Check sessionStorage first (cleared on browser close)
  const sessionCheck = sessionStorage.getItem(migrationKey);
  if (sessionCheck === 'complete') return true;

  // Fall back to database query if not in sessionStorage
  return checkMigrationInDatabase(studentId);
};
```

**Solution 3: Encrypt localStorage Data**
```javascript
// Use encryption library for sensitive localStorage data
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_STORAGE_KEY;

export const secureStorage = {
  setItem: (key, value) => {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      ENCRYPTION_KEY
    ).toString();
    localStorage.setItem(key, encrypted);
  },

  getItem: (key) => {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch {
      return null;
    }
  }
};
```

**Best Practices:**
- Prefer sessionStorage over localStorage for user-specific data
- Clear all user-specific localStorage keys on logout
- Never store auth tokens in localStorage (use httpOnly cookies)
- Encrypt sensitive data if localStorage is necessary
- Implement session timeouts for shared device environments
- Test logout flow on shared devices

**Phase to Address:** Phase 2 (Client-Side Security)
**Status in Codebase:** ⚠️ Partial fix needed in `src/utils/progressMigration.js`

**References:**
- [Leveraging LocalStorage and SessionStorage in React](https://medium.com/@shankavieducationalinstitute/leveraging-localstorage-and-sessionstorage-in-react-278698d42097)
- [Encypher: Secure Your React State with Encrypted localStorage](https://dev.to/sreehari_sj_1d3d883c0f6b/encypher-secure-your-react-state-with-encrypted-localstorage-and-sessionstorage-5937)
- [Protecting React Apps from Broken Authentication](https://www.stackhawk.com/blog/react-broken-authentication-guide-examples-and-prevention/)

---

### 2.3 Missing Session Timeout for Idle Users

**Severity:** 🟡 Medium (important for shared devices)

**What It Is:**
No automatic logout after period of inactivity. On shared school devices, students may walk away without logging out, leaving their account accessible to others.

**How It Happens:**
```javascript
// ❌ VULNERABLE: No idle detection or timeout
// User logs in, leaves device unattended
// Session remains active indefinitely
// Next student can access previous student's account
```

**Attack Scenario:**
1. Student A logs in during music class
2. Bell rings, Student A leaves in a hurry (doesn't log out)
3. Student B sits down at same computer 5 minutes later
4. Student B has access to Student A's account and progress

**Detection Method:**
```bash
# Check for idle timer or timeout logic
grep -r "idle\|timeout\|inactivity" src/

# Common libraries:
# - react-idle-timer
# - react-timeout
# - Custom timeout hooks
```

**Warning Signs:**
- No session timeout configuration in auth setup
- Sessions persist indefinitely
- No idle detection in app
- User reports unauthorized access from shared devices

**Prevention Strategy:**

**Solution 1: React Idle Timer**
```javascript
import { useIdleTimer } from 'react-idle-timer';

function App() {
  const { data: { user } } = supabase.auth.getUser();

  // Auto-logout after 15 minutes of inactivity (schools)
  const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  useIdleTimer({
    timeout: IDLE_TIMEOUT,
    onIdle: async () => {
      if (user) {
        console.log('User idle, logging out for security');
        await supabase.auth.signOut();
        navigate('/login?reason=idle');
      }
    },
    // What counts as "active"
    events: [
      'mousemove',
      'keydown',
      'wheel',
      'mousedown',
      'touchstart',
      'visibilitychange'
    ],
    // Warn before auto-logout
    promptBeforeIdle: 60000, // Warn 1 minute before
    onPrompt: () => {
      // Show warning modal: "You'll be logged out in 1 minute"
    }
  });

  return <>{/* app content */}</>;
}
```

**Solution 2: Custom Timeout Hook**
```javascript
function useSessionTimeout(timeoutMs = 15 * 60 * 1000) {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const updateActivity = () => setLastActivity(Date.now());
    events.forEach(event => window.addEventListener(event, updateActivity));

    const checkTimeout = setInterval(() => {
      const idle = Date.now() - lastActivity;
      if (idle > timeoutMs) {
        supabase.auth.signOut();
        navigate('/login?reason=timeout');
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(checkTimeout);
    };
  }, [lastActivity, timeoutMs]);
}
```

**Solution 3: Supabase Session Expiry**
```javascript
// Configure Supabase for shorter session duration
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Short session expiry for school environment
    sessionExpiresIn: 3600, // 1 hour (default is 1 week)
  }
});
```

**Configurable Timeouts by Environment:**
```javascript
const TIMEOUT_CONFIG = {
  school: 15 * 60 * 1000,    // 15 minutes (strict)
  home: 60 * 60 * 1000,      // 60 minutes (relaxed)
  development: Infinity       // No timeout for dev
};

const timeoutDuration = TIMEOUT_CONFIG[import.meta.env.VITE_ENVIRONMENT] || TIMEOUT_CONFIG.school;
```

**Best Practices:**
- Implement idle detection in all environments
- Use stricter timeouts (10-15 min) for shared device deployments
- Show warning before auto-logout (better UX)
- Save unsaved work before logging out
- Clear all state on timeout (same as manual logout)
- Make timeout duration configurable for different deployments

**Phase to Address:** Phase 2 (Client-Side Security)
**Status in Codebase:** ❌ Not implemented

**References:**
- [React Idle Timer (npm)](https://www.npmjs.com/package/react-idle-timer)
- [Protecting React Apps from Broken Authentication](https://www.stackhawk.com/blog/react-broken-authentication-guide-examples-and-prevention/)

---

### 2.4 XSS via dangerouslySetInnerHTML

**Severity:** 🟠 High (if used with user-generated content)

**What It Is:**
Using React's `dangerouslySetInnerHTML` with unsanitized user input creates cross-site scripting (XSS) vulnerabilities. While React escapes JSX by default, `dangerouslySetInnerHTML` bypasses this protection.

**How It Happens:**
```javascript
// ❌ VULNERABLE: Unsanitized user content rendered as HTML
function StudentComment({ comment }) {
  return <div dangerouslySetInnerHTML={{ __html: comment.text }} />;
}

// Attacker submits comment:
// comment.text = '<img src=x onerror="alert(document.cookie)">'
// XSS executes when comment renders
```

**Attack Vector:**
1. Attacker finds input field (comment, description, note)
2. Attacker inputs malicious HTML: `<script>/* steal session */</script>`
3. Content saved to database
4. Victim views page containing attacker's content
5. Malicious script executes in victim's browser context

**Detection Method:**
```bash
# Find all dangerouslySetInnerHTML usage
grep -r "dangerouslySetInnerHTML" src/

# Check each usage:
# - Is input user-generated?
# - Is input sanitized before rendering?
# - Can DOMPurify be used instead?
```

**Current Status:**
```bash
# In this codebase:
$ grep -r "dangerouslySetInnerHTML" src/
# No files found ✅
```

**Warning Signs:**
- `dangerouslySetInnerHTML` used with user input
- Rich text editors without sanitization
- Markdown rendering without allowlist
- HTML templating with variable substitution

**Prevention Strategy:**

**Solution 1: Avoid dangerouslySetInnerHTML**
```javascript
// ✅ BEST: Use React's default escaping
function StudentComment({ comment }) {
  // React automatically escapes this
  return <div>{comment.text}</div>;
}
```

**Solution 2: Use DOMPurify for Sanitization**
```javascript
import DOMPurify from 'dompurify';

// ✅ SECURE: Sanitize before rendering
function RichTextDisplay({ html }) {
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
}
```

**Solution 3: Use Markdown with React-Markdown**
```javascript
import ReactMarkdown from 'react-markdown';

// ✅ SECURE: Markdown library handles sanitization
function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      children={content}
      allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li']}
    />
  );
}
```

**Best Practices:**
- Never use `dangerouslySetInnerHTML` with user input
- Always sanitize HTML with DOMPurify before rendering
- Use React's default escaping whenever possible
- For rich text, use libraries like React-Markdown
- Configure allowlists (not denylists) for allowed tags/attributes
- Never build your own HTML sanitizer (extremely difficult)

**Phase to Address:** Phase 3 (Code Quality & Prevention)
**Status in Codebase:** ✅ Not currently used in codebase

**References:**
- [React XSS Guide: Understanding and Prevention](https://www.stackhawk.com/blog/react-xss-guide-examples-and-prevention/)
- [Preventing XSS in React: dangerouslySetInnerHTML](https://pragmaticwebsecurity.com/articles/spasecurity/react-xss-part2.html)
- [Is React Vulnerable to XSS?](https://www.invicti.com/blog/web-security/is-react-vulnerable-to-xss)

---

## 3. COPPA Compliance Pitfalls (Child Data Protection)

### 3.1 Exposing Child Usernames in Public Features

**Severity:** 🟡 Medium (COPPA violation)

**What It Is:**
Displaying child usernames, scores, or other personally identifiable information (PII) in leaderboards, public profiles, or shared features without parental consent. COPPA prohibits collecting/displaying PII for children under 13.

**Regulatory Context:**
- **COPPA Update 2025:** Final rule effective June 23, 2025; compliance deadline April 22, 2026
- **Penalties:** Up to $53,088 per violation (2026 rates)
- **Expanded PII Definition:** Now includes persistent identifiers, device IDs, IP addresses, biometric data, geolocation, behavioral/inferred data

**How It Happens:**
```javascript
// ❌ COPPA VIOLATION: Exposes all student usernames
async function getLeaderboard() {
  const { data } = await supabase
    .from('students')
    .select('id, username, total_xp')
    .order('total_xp', { ascending: false })
    .limit(10);

  // Returns: [{ username: 'JohnDoe', total_xp: 500 }, ...]
  return data;
}
```

**Risk Factors:**
- Leaderboards showing child usernames
- Public profiles with names, ages, locations
- Classroom views showing multiple students' data
- Shared playlists or practice sessions with creator names
- Comments/forums with username display

**Detection Method:**
```bash
# Find leaderboard/public display components
grep -r "leaderboard\|ranking\|top.*student" src/components/

# Check for username exposure:
# - SELECT username queries
# - Components rendering user.username
# - API responses containing PII
```

**Warning Signs:**
- Leaderboards showing real names
- Profile pages accessible without authentication
- Username/name fields in public-facing queries
- No anonymization in shared features

**Prevention Strategy:**

**Solution 1: Anonymize Non-Current Users**
```javascript
// ✅ COPPA COMPLIANT: Anonymize other students
async function getLeaderboard(currentUserId) {
  const { data } = await supabase
    .from('students')
    .select('id, username, total_xp')
    .order('total_xp', { ascending: false })
    .limit(10);

  // Anonymize all usernames except current user
  return data.map((entry, index) => ({
    ...entry,
    username: entry.id === currentUserId
      ? entry.username
      : `Student ${index + 1}`,
    isCurrentUser: entry.id === currentUserId
  }));
}
```

**Solution 2: Pseudonymous Identifiers**
```javascript
// Use generated nicknames instead of real usernames
function generatePseudonym(userId) {
  const adjectives = ['Swift', 'Clever', 'Bright', 'Quick'];
  const animals = ['Panda', 'Tiger', 'Eagle', 'Dolphin'];

  // Deterministic hash of userId
  const hash = simpleHash(userId);
  const adj = adjectives[hash % adjectives.length];
  const animal = animals[(hash >> 2) % animals.length];

  return `${adj} ${animal}`;
}

// Leaderboard shows: "Swift Panda", "Clever Tiger", etc.
```

**Solution 3: Teacher-Only PII Access**
```javascript
// Students see anonymized data; teachers see real names
async function getClassProgress(teacherId, studentId) {
  const isTeacher = await checkIsTeacher(teacherId);

  const { data } = await supabase
    .from('students')
    .select('id, username, total_xp')
    .eq('teacher_id', teacherId);

  if (!isTeacher) {
    // Students only see their own name
    return data.map(student => ({
      ...student,
      username: student.id === studentId ? student.username : 'Classmate'
    }));
  }

  // Teachers see real names
  return data;
}
```

**COPPA Compliance Checklist:**
- [ ] No child usernames in public leaderboards
- [ ] No PII in shareable URLs (e.g., `/profile/:username`)
- [ ] Parental consent obtained before displaying any PII
- [ ] Teacher/parent access to view/delete child data
- [ ] Data minimization: collect only necessary information
- [ ] No cross-user data visible to children
- [ ] Secure deletion available on request

**Phase to Address:** Phase 1 (Critical Compliance)
**Status in Codebase:** ⚠️ Needs review of leaderboard/public features

**References:**
- [COPPA Compliance in 2025: A Practical Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [FTC Amends COPPA Rule (2025)](https://www.dwt.com/blogs/privacy--security-law-blog/2025/05/coppa-rule-ftc-amended-childrens-privacy)
- [Understanding Children's Online Privacy Rules](https://pandectes.io/blog/childrens-online-privacy-rules-around-coppa-gdpr-k-and-age-verification/)

---

### 3.2 Third-Party SDK Data Collection

**Severity:** 🟠 High (COPPA violation)

**What It Is:**
Using third-party analytics, advertising, or social SDKs that collect child data without verifying they are COPPA-compliant. The 2025 COPPA update requires separate opt-in consent for third-party data sharing.

**Regulatory Requirements (2025 Update):**
- **Separate consent for third parties:** Operators must obtain explicit opt-in consent specifically for third-party disclosures (e.g., advertising)
- **Analytics restriction:** For privacy-preserving analytics, use aggregate event counts, short retention, no cross-app identifiers, server-side logging
- **No targeted advertising:** Cannot use children's data for marketing or behavioral profiling

**How It Happens:**
```javascript
// ❌ COPPA VIOLATION: Analytics SDK tracking children
import Analytics from 'analytics-sdk';

Analytics.init({
  apiKey: 'xxx',
  userId: currentUser.id,  // ← Persistent identifier
  userProperties: {
    age: 8,
    grade: 3,
    location: 'New York'
  }
});

Analytics.track('GameCompleted', {
  gameType: 'notes',
  score: 100,
  duration: 120
});
```

**Problems:**
- Persistent user identifier sent to third party
- User properties include age, location (PII)
- No parental consent for third-party sharing
- Cross-app tracking via userId

**Detection Method:**
```bash
# Find third-party SDK usage
grep -r "import.*from.*analytics\|import.*from.*mixpanel\|import.*from.*segment" src/

# Check package.json for analytics dependencies
cat package.json | grep -i "analytics\|mixpanel\|segment\|amplitude"

# Review privacy policy for COPPA compliance
```

**Warning Signs:**
- Analytics SDKs without COPPA mode enabled
- User IDs sent to third parties
- Ad networks integrated (Facebook Pixel, Google Ads)
- Social login without parental consent
- Persistent identifiers tracked across sessions

**Prevention Strategy:**

**Solution 1: Server-Side Analytics Only**
```javascript
// ✅ COPPA COMPLIANT: Server-side aggregation
// Client sends minimal, anonymized events
async function trackEvent(eventName, properties) {
  // NO userId, NO deviceId, NO PII
  await supabase.from('anonymous_events').insert({
    event_name: eventName,
    event_properties: properties,  // No PII
    created_at: new Date()
  });

  // Server aggregates: COUNT(*), AVG(score), etc.
  // No individual user tracking
}
```

**Solution 2: Self-Hosted Analytics**
```javascript
// Use privacy-first, self-hosted solutions
import { Plausible } from 'plausible-tracker';

const plausible = Plausible({
  domain: 'pianomaster.app',
  apiHost: 'https://analytics.pianomaster.app',  // Self-hosted
  trackLocalhost: false
});

// Track page views (no PII)
plausible.trackPageview();

// Custom events (no user identifiers)
plausible.trackEvent('GameComplete', {
  props: {
    game: 'notes',
    // No userId, no deviceId
  }
});
```

**Solution 3: Age-Gate Analytics**
```javascript
// Only track users who are 13+
function initAnalytics(user) {
  const userAge = calculateAge(user.birthdate);

  if (userAge >= 13) {
    // Full analytics for teens/adults
    Analytics.init({ userId: user.id });
  } else {
    // Minimal, anonymized analytics for children
    Analytics.init({
      anonymousId: generateSessionId(),  // Session-only, not persisted
      userProperties: {
        ageGroup: 'under13'  // Cohort, not exact age
      }
    });
  }
}
```

**COPPA-Safe Analytics Practices:**
- Use server-side aggregation (not client-side tracking)
- No persistent identifiers for under-13 users
- No cross-app/cross-session tracking for children
- Self-host analytics or use COPPA-certified vendors
- Aggregate data only (DAU, session count, no individual paths)
- Short retention periods for event data
- Opt-in consent for any third-party data sharing

**Approved Analytics Approach for This App:**
```javascript
// Aggregate metrics only, no user tracking
async function getDashboardMetrics() {
  // Total users (count)
  const { count: totalUsers } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  // Games played today (count)
  const { count: gamesToday } = await supabase
    .from('students_score')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date().toISOString().split('T')[0]);

  // No individual user data leaves the server
  return { totalUsers, gamesToday };
}
```

**Phase to Address:** Phase 1 (Critical Compliance)
**Status in Codebase:** ⚠️ Needs review of analytics usage

**References:**
- [COPPA Compliance in 2025: Analytics Considerations](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [FTC's 2025 COPPA Final Rule Amendments](https://securiti.ai/ftc-coppa-final-rule-amendments/)
- [Understanding Children's Online Privacy Rules](https://pandectes.io/blog/childrens-online-privacy-rules-around-coppa-gdpr-k-and-age-verification/)

---

### 3.3 Missing Data Deletion Capabilities

**Severity:** 🟡 Medium (COPPA requirement)

**What It Is:**
No mechanism for parents or teachers to delete child data on request. COPPA requires operators to provide parents the ability to review and delete their child's personal information.

**Regulatory Requirements:**
- **Parental rights:** Parents must be able to review, delete, and limit data collection
- **Data retention policies:** Must have written policies for when data is deleted
- **Deletion enforcement:** Must delete data when no longer necessary for purpose collected

**How It Happens:**
```javascript
// ❌ NON-COMPLIANT: No deletion function
// Teachers can view student data but cannot delete it
// No parent portal to request deletion
```

**Detection Method:**
```bash
# Check for deletion functions
grep -r "delete.*student\|remove.*student" src/services/

# Check database policies
grep -r "DELETE" supabase/migrations/ | grep -i "student"

# Look for:
# - DELETE RLS policies
# - Soft delete vs hard delete logic
# - Parent/teacher access controls
```

**Warning Signs:**
- No "Delete Account" button in student settings
- No teacher function to remove student
- No admin panel for data deletion requests
- Hard-coded prevention of deletions
- No audit logs of deletions

**Prevention Strategy:**

**Solution 1: Cascading Deletion Function**
```sql
-- Create comprehensive delete function
CREATE OR REPLACE FUNCTION delete_student_data(p_student_id UUID)
RETURNS void AS $$
BEGIN
  -- Verify caller is authorized (teacher or admin)
  IF NOT is_teacher_of_student(auth.uid(), p_student_id)
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot delete this student';
  END IF;

  -- Delete in dependency order
  DELETE FROM student_skill_progress WHERE student_id = p_student_id;
  DELETE FROM students_score WHERE student_id = p_student_id;
  DELETE FROM student_daily_goals WHERE student_id = p_student_id;
  DELETE FROM practice_sessions WHERE student_id = p_student_id;
  DELETE FROM user_accessories WHERE user_id = p_student_id;
  DELETE FROM teacher_student WHERE student_id = p_student_id;

  -- Finally delete student record
  DELETE FROM students WHERE id = p_student_id;

  -- Log deletion for audit
  INSERT INTO audit_log (action, target_id, performed_by)
  VALUES ('student_deleted', p_student_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Solution 2: Teacher Deletion Interface**
```javascript
// Teacher dashboard component
async function deleteStudent(studentId) {
  // Confirm with teacher
  const confirmed = await showConfirmDialog({
    title: 'Delete Student Data',
    message: 'This will permanently delete all data for this student. This action cannot be undone.',
    confirmText: 'Delete Forever'
  });

  if (!confirmed) return;

  try {
    // Call deletion function
    const { error } = await supabase.rpc('delete_student_data', {
      p_student_id: studentId
    });

    if (error) throw error;

    showNotification('Student data deleted successfully');
  } catch (error) {
    console.error('Deletion failed:', error);
    showNotification('Failed to delete student data', 'error');
  }
}
```

**Solution 3: Automated Data Retention**
```sql
-- Auto-delete inactive students after 2 years (configurable)
CREATE OR REPLACE FUNCTION cleanup_inactive_students()
RETURNS void AS $$
BEGIN
  -- Delete students with no activity in 2 years
  DELETE FROM students
  WHERE last_login < NOW() - INTERVAL '2 years'
    AND account_status != 'active';

  -- Log cleanup action
  INSERT INTO audit_log (action, details)
  VALUES ('automated_cleanup', 'Deleted inactive students');
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (Supabase extension)
SELECT cron.schedule(
  'cleanup-inactive-students',
  '0 2 * * 0',  -- Every Sunday at 2 AM
  'SELECT cleanup_inactive_students();'
);
```

**COPPA Deletion Requirements:**
- [ ] Parent/teacher can request deletion via UI
- [ ] Deletion removes all PII across all tables
- [ ] Cascade deletes handle foreign key relationships
- [ ] Audit logs track all deletions
- [ ] Automated retention policies implemented
- [ ] Deletion confirmed via email/notification
- [ ] Deleted data cannot be recovered

**Database Migration for Deletion Policies:**
```sql
-- Migration: Add DELETE policies for COPPA compliance

-- Teachers can delete students they're connected to
CREATE POLICY "Teachers can delete their students"
ON students FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teacher_student
    WHERE teacher_id = auth.uid()
      AND student_id = students.id
  )
  OR is_admin()
);

-- Students can delete their own progress
CREATE POLICY "Students can delete own progress"
ON student_skill_progress FOR DELETE
TO authenticated
USING (student_id = auth.uid());
```

**Phase to Address:** Phase 2 (Compliance Features)
**Status in Codebase:** ⚠️ RLS DELETE policies exist (migration `20260129000003`), need UI

**References:**
- [COPPA: Children's Online Privacy Protection Act Explained](https://termly.io/resources/articles/coppa/)
- [Children's Online Privacy Protection Act | FTC](https://www.ftc.gov/terms/childrens-online-privacy-protection-act-coppa)
- [COPPA Compliance in 2025: Data Retention](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)

---

## 4. Detection Checklist

Use this checklist to audit for security pitfalls before each release:

### Database Security (Supabase)
- [ ] Run Supabase Security Advisor for all tables
- [ ] Check for user_metadata usage: `grep -r "user_metadata" supabase/`
- [ ] Verify all SECURITY DEFINER functions have auth checks
- [ ] Confirm RLS enabled on all public tables: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- [ ] Test RLS policies by switching to `anon` and `authenticated` roles
- [ ] Check for IDOR vulnerabilities in service functions
- [ ] Verify rate limiting on score submission endpoints

### Client-Side Security (React/PWA)
- [ ] Verify service worker excludes auth endpoints from cache
- [ ] Test logout clears all localStorage user keys
- [ ] Confirm no `dangerouslySetInnerHTML` with user content: `grep -r "dangerouslySetInnerHTML" src/`
- [ ] Check for XSS vulnerabilities in user-generated content
- [ ] Verify session timeout implemented for shared devices
- [ ] Test app on shared device (logout → login as different user)

### COPPA Compliance
- [ ] Audit public features for child username exposure
- [ ] Verify parental consent flow for data collection
- [ ] Check analytics SDKs are COPPA-compliant or removed
- [ ] Confirm deletion functions exist for teachers/parents
- [ ] Review data retention policies and automated cleanup
- [ ] Test deletion flow (data fully removed from all tables)
- [ ] Verify no targeted advertising or cross-app tracking

### Automated Security Tests
```javascript
// Example test: Verify RLS prevents unauthorized access
test('RLS prevents student from accessing other student data', async () => {
  const studentA = await createTestStudent();
  const studentB = await createTestStudent();

  // Login as Student A
  const { data: sessionA } = await supabase.auth.signInWithPassword({
    email: studentA.email,
    password: 'password'
  });

  // Try to read Student B's progress (should fail)
  const { data, error } = await supabase
    .from('student_skill_progress')
    .select('*')
    .eq('student_id', studentB.id);

  expect(data).toHaveLength(0); // RLS should filter out
  // Or expect error if policy uses restrictive WITH CHECK
});
```

### Security Review Process
1. **Pre-deployment:** Run checklist on feature branch
2. **Code review:** Security-focused review for auth/data changes
3. **Staging test:** Manual testing on shared device simulation
4. **Production:** Monitor error logs for RLS violations
5. **Monthly:** Re-run Security Advisor and update findings

---

## 5. Mitigation Priority Matrix

| Pitfall | Severity | Effort | Phase | Status |
|---------|----------|--------|-------|--------|
| user_metadata in RLS | 🔴 Critical | Low | Phase 1 | ✅ Fixed |
| SECURITY DEFINER without auth | 🔴 Critical | Low | Phase 1 | ✅ Fixed |
| Service worker auth caching | 🔴 Critical | Low | Phase 1 | ✅ Implemented |
| Missing RLS policies | 🔴 Critical | Medium | Phase 1 | ⚠️ Needs audit |
| IDOR in services | 🟠 High | Medium | Phase 2 | ❌ TODO |
| localStorage on shared devices | 🟠 High | Low | Phase 2 | ⚠️ Partial |
| Child username exposure | 🟡 Medium | Medium | Phase 1 | ⚠️ Needs review |
| Third-party SDK tracking | 🟠 High | Low | Phase 1 | ⚠️ Needs review |
| Missing data deletion | 🟡 Medium | High | Phase 2 | ⚠️ Has RLS, needs UI |
| No session timeout | 🟡 Medium | Low | Phase 2 | ❌ TODO |
| No rate limiting | 🟡 Medium | High | Phase 3 | ❌ TODO |
| XSS via dangerouslySetInnerHTML | 🟠 High | N/A | N/A | ✅ Not used |

**Legend:**
- 🔴 Critical: Must fix before public launch
- 🟠 High: Should fix in next sprint
- 🟡 Medium: Fix before v1.0 release

---

## 6. Resources & References

### Official Documentation
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Security Advisor](https://supabase.com/docs/guides/database/database-advisors)
- [COPPA | Federal Trade Commission](https://www.ftc.gov/terms/childrens-online-privacy-protection-act-coppa)

### Security Tools
- [Supabase Splinter](https://supabase.github.io/splinter/) - RLS policy scanner
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML sanitization
- [React Idle Timer](https://www.npmjs.com/package/react-idle-timer) - Session timeout

### Learning Resources
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Supabase Security Retro: 2025](https://supabase.com/blog/supabase-security-2025-retro)
- [React Security Best Practices](https://www.stackhawk.com/blog/react-xss-guide-examples-and-prevention/)

### Compliance Guides
- [COPPA Compliance in 2025: A Practical Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [FTC COPPA Final Rule Amendments 2025](https://securiti.ai/ftc-coppa-final-rule-amendments/)

---

## 7. Next Steps

### Immediate Actions (This Sprint)
1. ✅ Document all pitfalls with detection methods
2. ⚠️ Run Supabase Security Advisor on production database
3. ⚠️ Audit all service functions for IDOR vulnerabilities
4. ❌ Add client-side authorization checks to all data mutation functions
5. ❌ Implement session timeout for shared device environments

### Phase 1: Critical Security Fixes
- Fix any RLS gaps found by Security Advisor
- Add authorization checks to service layer
- Review/remove any third-party analytics SDKs
- Audit public features for child data exposure

### Phase 2: Compliance & Hardening
- Implement data deletion UI for teachers
- Add comprehensive logout (localStorage cleanup)
- Build session timeout with idle detection
- Create automated security tests

### Phase 3: Abuse Prevention & Monitoring
- Implement rate limiting on score submissions
- Add audit logging for sensitive operations
- Set up monitoring for RLS violations
- Create incident response playbook

---

**Document Version:** 1.0
**Last Updated:** January 31, 2026
**Next Review:** Before Phase 1 implementation
