# Security Hardening Guidelines

This document covers security patterns learned from the January 2026 security audit. Follow these guidelines when adding new features or modifying existing code.

## 1. Authorization Patterns

### Never Trust User-Provided IDs Without Verification

**Vulnerable Pattern:**
```javascript
// BAD: Accepts any studentId without verification
export async function saveScore(studentId, score) {
  await supabase.from('students_score').insert({ student_id: studentId, ...score });
}
```

**Secure Pattern:**
```javascript
// GOOD: Verify the user can only access their own data
export async function saveScore(studentId, score) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== studentId) {
    throw new Error('Unauthorized: Cannot save score for another user');
  }
  await supabase.from('students_score').insert({ student_id: studentId, ...score });
}
```

### Always Verify Relationship-Based Access

For teacher-student operations, verify the relationship exists before modifying data.

**Vulnerable Pattern:**
```javascript
// BAD: Teacher can modify any student's data
export async function deleteStudentSession(teacherId, studentId, sessionId) {
  await supabase.from('practice_sessions').delete().eq('id', sessionId);
}
```

**Secure Pattern:**
```javascript
// GOOD: Verify teacher-student connection first
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
  await supabase.from('practice_sessions').delete().eq('id', sessionId);
}
```

## 2. Database Security (Supabase RLS)

### Never Use `user_metadata` in RLS Policies

JWT `user_metadata` can be modified by clients via `supabase.auth.updateUser()`. Never use it for authorization decisions.

**Vulnerable RLS Policy:**
```sql
-- BAD: user_metadata can be manipulated by the client
CREATE POLICY "Admin access" ON sensitive_table
  FOR ALL USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );
```

**Secure RLS Policy:**
```sql
-- GOOD: Use database state that users cannot modify
CREATE POLICY "Admin access" ON sensitive_table
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Or use a helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teachers WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Admin access" ON sensitive_table
  FOR ALL USING (is_admin());
```

### SECURITY DEFINER Functions Must Have Explicit Authorization

Functions with `SECURITY DEFINER` run with the privileges of the function owner (usually superuser). Always add explicit authorization checks.

**Vulnerable Function:**
```sql
-- BAD: Any authenticated user can award XP to any student
CREATE OR REPLACE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE students SET total_xp = total_xp + p_xp_amount WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Secure Function:**
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

## 3. Authentication & JWT Handling

### Verify Roles from Database, Not Metadata

**Vulnerable Pattern:**
```javascript
// BAD: Role from user_metadata can be manipulated
const { data: { user } } = await supabase.auth.getUser();
const role = user?.user_metadata?.role;
if (role === 'teacher') {
  // Grant teacher access
}
```

**Secure Pattern:**
```javascript
// GOOD: Verify role by checking database tables
async function getUserRole(userId) {
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', userId)
    .single();

  if (teacher) return 'teacher';

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', userId)
    .single();

  if (student) return 'student';

  return null;
}
```

### Clear User Data on Logout

On shared devices (common in schools), user data persists in localStorage after logout.

**Vulnerable Pattern:**
```javascript
// BAD: Only signs out, leaves user data in localStorage
async function logout() {
  await supabase.auth.signOut();
  navigate('/login');
}
```

**Secure Pattern:**
```javascript
// GOOD: Clear all user-specific data on logout
async function logout() {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  await supabase.auth.signOut();

  if (userId) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes(userId) || key?.startsWith('user_') || key?.startsWith('progress_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  localStorage.removeItem('xp_migration_complete');
  localStorage.removeItem('cached_user_progress');

  navigate('/login');
}
```

## 4. Service Worker Security

### Never Cache Authentication Endpoints

Caching auth-related requests can cause tokens to persist after logout or leak between users.

**Vulnerable Pattern:**
```javascript
// BAD: Caches all fetch requests including auth
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
```

**Secure Pattern:**
```javascript
// GOOD: Exclude auth endpoints from caching
const AUTH_EXCLUDED_PATTERNS = [
  '/auth/',
  '/token',
  '/logout',
  '/session',
  'supabase.co/auth',
  'gotrue',
];

function shouldSkipCache(url) {
  return AUTH_EXCLUDED_PATTERNS.some(pattern => url.includes(pattern));
}

self.addEventListener('fetch', (event) => {
  if (shouldSkipCache(event.request.url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
```

## 5. Child Data Protection (COPPA/GDPR-K)

This app is designed for 8-year-old learners. Special care must be taken with personally identifiable information.

### Minimize PII Exposure in Shared Features

**Vulnerable Pattern:**
```javascript
// BAD: Exposes usernames to all users in leaderboard
const leaderboard = await supabase
  .from('students')
  .select('id, username, total_xp')
  .order('total_xp', { ascending: false })
  .limit(10);
```

**Secure Pattern:**
```javascript
// GOOD: Anonymize other users' data
const { data: { user } } = await supabase.auth.getUser();
const currentUserId = user?.id;

const leaderboard = await supabase
  .from('students')
  .select('id, username, total_xp')
  .order('total_xp', { ascending: false })
  .limit(10);

const anonymizedLeaderboard = leaderboard.data.map((entry, index) => ({
  ...entry,
  username: entry.id === currentUserId ? entry.username : `Student ${index + 1}`,
  isCurrentUser: entry.id === currentUserId
}));
```

### Additional COPPA Considerations

- **Parental consent**: Required for collecting data from children under 13
- **Data minimization**: Only collect data necessary for the app's function
- **No targeted advertising**: Do not use children's data for marketing
- **Teacher/parent visibility**: Parents and teachers should be able to view/delete child data
- **Secure data storage**: Encrypt sensitive data at rest and in transit

## 6. Defense in Depth

Even with RLS policies, implement client-side authorization checks as an additional layer.

**Pattern:**
```javascript
// Layer 1: Client-side check (fast, user-friendly error)
export async function updateStudentProgress(studentId, progress) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== studentId) {
    console.error('Authorization failed: user mismatch');
    throw new Error('Unauthorized');
  }

  // Layer 2: RLS policy on the table (enforced at database level)
  const { error } = await supabase
    .from('student_skill_progress')
    .upsert({ student_id: studentId, ...progress });

  if (error) {
    console.error('Database error:', error);
    throw error;
  }
}
```

## 7. Debug Code in Production

### Gate Debug Functions Behind Environment Checks

**Vulnerable Pattern:**
```javascript
// BAD: Debug endpoints available in production
export async function debugListAllTables() {
  const { data } = await supabase.rpc('list_tables');
  return data;
}
```

**Secure Pattern:**
```javascript
// GOOD: Only available in development
export async function debugListAllTables() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Debug functions are disabled in production');
    return null;
  }

  const { data } = await supabase.rpc('list_tables');
  return data;
}
```

## 8. Security Implementation Checklist

When adding new features, verify the following:

### Database Functions
- [ ] SECURITY DEFINER functions have explicit `auth.uid()` checks
- [ ] Functions verify user can only modify their own data (or have valid relationship)
- [ ] No use of `user_metadata` for authorization decisions
- [ ] Sensitive operations are logged for audit purposes

### RLS Policies
- [ ] All tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Policies use database state, not JWT metadata
- [ ] Admin checks use `is_admin()` function with database verification
- [ ] SELECT policies limit data exposure appropriately

### Client-Side Code
- [ ] User IDs are verified before API calls
- [ ] Relationship-based access is verified (teacher-student, etc.)
- [ ] Error messages don't leak sensitive information
- [ ] Debug/development code is gated behind environment checks

### Authentication Flow
- [ ] Roles verified from database tables, not user_metadata
- [ ] Logout clears all user-specific localStorage data
- [ ] Session tokens are not cached in service worker
- [ ] Auth state changes trigger appropriate cleanup

### Data Privacy (COPPA/GDPR-K)
- [ ] Child usernames are anonymized in public-facing features
- [ ] Only necessary data is collected and stored
- [ ] Parents/teachers can view and delete child data
- [ ] No cross-user data leakage in shared features

## 9. Common Vulnerable Patterns to Avoid

| Pattern | Risk | Correct Approach |
|---------|------|------------------|
| `auth.jwt() -> 'user_metadata' ->> 'role'` | User can modify metadata | Query database tables |
| `SECURITY DEFINER` without auth check | Function runs as superuser | Add `IF auth.uid() != param THEN RAISE` |
| Accepting `studentId` parameter blindly | IDOR vulnerability | Verify `user.id === studentId` |
| Teacher functions without relationship check | Unauthorized data access | Verify in `teacher_student` table |
| Caching all fetch requests | Auth token persistence | Exclude auth endpoints from cache |
| Exposing usernames in leaderboards | COPPA violation | Anonymize non-current-user data |
| Debug functions in production | Information disclosure | Gate behind `NODE_ENV === 'development'` |
| Only clearing auth on logout | Data persistence on shared devices | Clear localStorage user keys |

## 10. Key Security Files

- `public/sw.js` - Service worker with auth exclusion patterns
- `src/services/authService.js` - Authentication with secure logout
- `src/services/scoreService.js` - Score operations with authorization checks
- `src/services/teacherService.js` - Teacher operations with relationship verification
- `src/config/subscriptionConfig.js` - Free tier boundary (must sync with Postgres `is_free_node()`)
- `supabase/migrations/*` - Database schema with RLS policies
- `supabase/migrations/20260226000001_add_subscription_tables.sql` - Subscription RLS + helper functions
- `supabase/migrations/20260226000003_add_content_gate_rls.sql` - Content gate RLS on score tables
