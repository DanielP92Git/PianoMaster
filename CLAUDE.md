# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server on port 5174
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format all files
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
npm run verify:patterns  # Validate pattern definitions
```

**Testing a single file:** `npx vitest run src/path/to/file.test.js`

## Architecture Overview

This is a **piano learning PWA** built with React 18 + Vite. It features multiple music education games, user progression tracking, and teacher/student role differentiation.

### Tech Stack
- **Frontend:** React 18, Vite 6, React Router v7
- **State:** Redux Toolkit (minimal), React Context (feature-scoped), TanStack React Query v5
- **Backend:** Supabase (auth, database, real-time subscriptions)
- **Music Notation:** VexFlow v5 for SVG-based sheet music rendering
- **Audio:** Klavier library for keyboard input, Web Audio API for pitch detection
- **Styling:** Tailwind CSS with custom design system (see `docs/DESIGN_SYSTEM.md`)
- **i18n:** i18next with English and Hebrew (RTL) support

### State Management Approach
- **Redux Toolkit:** Only for rhythm composition state (`src/reducers/rhythmReducer.jsx`)
- **React Context:** Feature-scoped providers in `src/contexts/` (Accessibility, Settings, SightReadingSession, Rhythm)
- **React Query:** Server state, auth, caching with 5-min stale time

### Key Directory Structure
```
src/
├── components/games/          # Game implementations
│   ├── sight-reading-game/    # VexFlow-based notation reading
│   ├── notes-master-games/    # Memory & recognition games
│   ├── rhythm-games/          # Rhythm/metronome training
│   └── shared/                # UnifiedGameSettings
├── features/                  # Feature hooks (auth, games, userData)
├── contexts/                  # Context providers
├── hooks/                     # Custom hooks (audio, pitch detection, etc.)
├── services/                  # API calls and business logic
├── pages/                     # Routed page components
└── locales/                   # i18n translation files (en, he)
```

## VexFlow Implementation

VexFlow renders music notation as SVG. Key guidelines:

- **One measure per Stave** - each `Stave` represents one bar
- **Use SVG backend:** `new Renderer(div, Renderer.Backends.SVG)`
- **Automatic beaming:** Use `Beam.generateBeams(notes, config?)` instead of manual beams
- **Stem directions:** For rhythm-only displays, force `Stem.UP`; for pitch-based, let VexFlow calculate
- **Key strings:** Format as `"pitch/octave"` (e.g., `'c/4'`, `'eb/4'`)
- **Duration codes:** `'w'`, `'h'`, `'q'`, `'8'`, `'16'`, `'qr'` (r = rest)

See `docs/vexflow-notation/vexflow-guidelines.md` for detailed patterns.

## Design System

Use Tailwind utilities with the centralized design system:

- **Cards:** `.card`, `.card-hover`, `.card-compact`, `.card-elevated`
- **Text colors:** `text-gray-900` (primary), `text-gray-600` (secondary), `text-gray-500` (tertiary)
- **Backgrounds:** `bg-white` for cards, `bg-gray-100` for nested elements
- **Borders:** `border-gray-200` standard

The app migrated from glassmorphism to white cards. See `docs/DESIGN_SYSTEM.md` for migration patterns.

## Testing

Tests use Vitest with JSDOM environment. Setup file: `src/test/setupTests.js`

Pattern and rhythm utility tests are in:
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js`
- `src/components/games/sight-reading-game/utils/rhythmGenerator.test.js`

## Game Session Flow

Games follow a consistent session model managed by context:
1. **Pre-game setup:** Configure settings (clef, time signature, difficulty)
2. **Session state:** `idle` → `in-progress` → `complete`
3. **Exercise tracking:** 10 exercises per session with scoring
4. **Feedback:** Real-time pitch/rhythm accuracy via mic or keyboard input

## Routing

Protected routes require authentication. Teachers auto-redirect to `/teacher`. Key routes:
- `/` - Dashboard (role-specific)
- `/trail` - Skill progression trail (full-viewport overlay)
- `/notes-master-mode/*` - Note learning games
- `/rhythm-mode/*` - Rhythm training games
- `/practice-modes` - Free practice mode selection
- `/practice-sessions` - Recording and playback

## Accessibility

The app has comprehensive a11y support via `AccessibilityContext`:
- High contrast mode
- Reduced motion
- Screen reader optimization
- RTL support (Hebrew)
- Extended timeouts for cognitive accessibility

## PWA & Service Worker

The app is a Progressive Web App with offline support.

### Service Worker (`public/sw.js`)
- Cache versioning: `pianomaster-v2` (bump version to force cache refresh)
- Caching strategies:
  - **Static assets**: Cache-first for icons, manifest, offline page
  - **Navigation**: Cache-first with offline fallback
  - **API calls**: Network-first with cache fallback
  - **Accessory images**: Dedicated `pianomaster-accessories-v2` cache
- Skips caching for Vite dev server, JS modules, and script requests

### Image Optimization Pattern

Hero images use `<picture>` element with WebP format and preload hints:

```jsx
// Dashboard.jsx hero image pattern
<picture>
  <source media="(min-width: 1024px)" type="image/webp" srcSet="/images/desktop-hero.webp" />
  <source type="image/webp" srcSet="/images/mobile-hero.webp" />
  <source media="(min-width: 1024px)" srcSet="/images/desktop-hero.png" />
  <img src="/images/mobile-hero.png" loading="eager" fetchpriority="high" />
</picture>
```

Preload hints in `index.html` for critical images:
```html
<link rel="preload" as="image" href="/images/hero.webp" type="image/webp" />
```

## Layout Patterns

### Full-Viewport Overlay Pages

For pages like the Trail Map that need full viewport coverage (no sidebars, no gaps):

1. **TrailMapPage.jsx** uses `fixed inset-0 overflow-y-auto`:
   ```jsx
   <div className="fixed inset-0 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
   ```

2. **AppLayout.jsx** conditionally hides sidebar/header and adds `w-full overflow-hidden`:
   ```jsx
   const isTrailPage = location.pathname === "/trail";
   // Sidebar/header hidden when isTrailPage
   // Main element gets: isTrailPage ? "w-full" : ""
   ```

### Game Routes

Game routes (`/notes-master-mode/*`, `/rhythm-mode/*`) also hide the sidebar and header for distraction-free gameplay.

## Gamification Trail System (Added Jan 2026)

A Duolingo-style skill progression system for 8-year-old learners with 93 nodes across three parallel learning paths.

### Core Concepts

- **Skill Nodes**: 93 learning units organized by category (Treble: 23 nodes, Bass: 22 nodes, Rhythm: 36 nodes, Boss: 12 nodes)
- **Star Rating**: 0-3 stars based on performance (60%=1★, 80%=2★, 95%=3★)
- **XP System**: Experience points with 10 levels (Beginner → Legend)
- **Daily Goals**: 3 random goals per day to encourage engagement
- **Prerequisites**: Nodes unlock progressively (e.g., complete "C & D" before "C, D, E")
- **Static Definitions**: All nodes statically defined in unit files under `src/data/units/`

### Key Files

#### Data Layer
- `src/data/skillTrail.js` - Main export for all node definitions, categories, prerequisites
  - `SKILL_NODES` array (93 nodes) imported from `expandedNodes.js`
  - `getNodeById()`, `getNodesByCategory()`, `getBossNodes()`
  - `isNodeUnlocked()`, `getUnlockedNodes()`, `getAllNodes()`
- `src/data/expandedNodes.js` - Aggregates all unit files into single export
- `src/data/units/` - Individual unit definition files:
  - `trebleUnit1.js` through `trebleUnit4.js` (23 treble nodes total)
  - `bassUnit1.js` through `bassUnit3.js` (22 bass nodes total)
  - `rhythmUnit1.js` through `rhythmUnit6.js` (36 rhythm nodes total)
  - Each unit file exports nodes with boss nodes marked for completion milestones

#### Services
- `src/services/skillProgressService.js` - CRUD for student progress
  - `getStudentProgress()`, `getNodeProgress()`, `updateNodeProgress()`
  - `getNextRecommendedNode()` - Smart suggestion for "Continue Learning"
  - `getCompletedNodeIds()`, `checkNodeUnlocked()`

- `src/services/dailyGoalsService.js` - Daily goals generation & tracking
  - `getTodaysGoals()` - Creates 3 goals if none exist for today
  - `getDailyGoalsWithProgress()` - Fetches goals with current progress
  - `calculateDailyProgress()` - Queries today's activity from DB
  - Goal types: complete_exercises, earn_three_stars, practice_new_node, perfect_score, maintain_streak

- `src/utils/xpSystem.js` - XP calculations and level thresholds
  - `XP_LEVELS` array with thresholds (0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200)
  - `calculateLevel()`, `calculateXPReward()`, `awardXP()`

- `src/utils/progressMigration.js` - One-time migration for existing users
  - Uses localStorage to track migration status
  - Awards XP based on historical score count

#### Components
- `src/components/trail/TrailMap.jsx` - Visual skill trail with horizontal wavy path layout
  - `TrailSection` - Renders category path with responsive SVG
  - `PathConnector` - SVG curved lines between nodes
  - Nodes distributed evenly within container width (no horizontal scroll)
- `src/components/trail/TrailNode.jsx` - Individual node (locked/available/in-progress/mastered states)
- `src/components/trail/TrailNodeModal.jsx` - Node details + "Start Practice" button
- `src/components/dashboard/DailyGoalsCard.jsx` - Shows 3 daily goals with progress bars
- `src/pages/TrailMapPage.jsx` - Full-viewport page wrapper using `fixed inset-0`

#### Integration Points
- `src/components/games/VictoryScreen.jsx` - Saves star rating, awards XP on trail completion
- `src/components/layout/Dashboard.jsx` - "Continue Learning" button + Daily Goals card
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - Accepts `nodeId` prop for trail integration

### Database Tables

```sql
-- Student progress on trail nodes
student_skill_progress (
  student_id UUID,
  node_id TEXT,
  stars INTEGER (0-3),
  best_score INTEGER (percentage 0-100),
  exercises_completed INTEGER,
  last_practiced TIMESTAMP
)

-- Daily goals per student
student_daily_goals (
  student_id UUID,
  goal_date DATE,
  goals JSONB,           -- Array of 3 goal objects
  completed_goals JSONB  -- Array of completed goal IDs
)

-- XP columns on students table
students.total_xp INTEGER
students.current_level INTEGER (1-10)
```

### Trail Node Structure

```javascript
{
  id: 'treble_c_e',
  name: 'C, D, E',
  category: 'treble_clef',
  order: 2,
  prerequisites: ['treble_c_d'],
  skills: ['C4', 'D4', 'E4'],
  exercises: [{
    type: 'note_recognition',
    config: { notePool: ['C4', 'D4', 'E4'], questionCount: 10, clef: 'treble' }
  }],
  xpReward: 50,
  isBoss: false
}
```

### User Flow

1. **Dashboard** → "Continue Learning" button shows next recommended node
2. **Trail Map** → Click node → Modal with details → "Start Practice"
3. **Game** → Play with node's config → Complete → VictoryScreen
4. **VictoryScreen** → Shows stars + XP gained → Updates `student_skill_progress`
5. **Return to Trail** → Node shows earned stars, next nodes unlock

### Daily Goals Flow

1. Dashboard mounts → `getDailyGoalsWithProgress(studentId)` called
2. If no goals for today → `generateDailyGoals()` creates 3 random goals
3. Goals stored in `student_daily_goals` table with today's date
4. Progress calculated from `students_score` + `student_skill_progress` tables
5. Goals refetch every 60 seconds to update progress bars

### Sequential Exercises Feature (Jan 2026)

Nodes can have multiple exercises that must be completed in order. Node stars = minimum stars across all exercises (only calculated when ALL exercises are complete).

#### Database Schema Addition

```sql
-- Added to student_skill_progress table
exercise_progress JSONB DEFAULT '[]'::jsonb

-- Example structure:
-- [
--   { "index": 0, "type": "note_recognition", "stars": 2, "bestScore": 85, "completedAt": "..." },
--   { "index": 1, "type": "sight_reading", "stars": 3, "bestScore": 98, "completedAt": "..." }
-- ]
```

Migration file: `supabase/migrations/20260125000001_add_exercise_progress.sql`

#### Exercise Types

Defined in `src/data/skillTrail.js`:
```javascript
export const EXERCISE_TYPES = {
  NOTE_RECOGNITION: 'note_recognition',
  SIGHT_READING: 'sight_reading',
  RHYTHM: 'rhythm',
  BOSS_CHALLENGE: 'boss_challenge'
};
```

#### Service Functions (skillProgressService.js)

- `getExerciseProgress(studentId, nodeId)` - Returns array of exercise progress
- `getNextExerciseIndex(studentId, nodeId, totalExercises)` - Returns next uncompleted index or null
- `updateExerciseProgress(studentId, nodeId, exerciseIndex, exerciseType, stars, score, totalExercises)` - Upserts exercise progress, returns `{ nodeComplete, exercisesRemaining }`
- `isExerciseCompleted(studentId, nodeId, exerciseIndex)` - Boolean check

#### Navigation State for Trail Games

When navigating to a game from the trail, pass this state via `location.state`:
```javascript
{
  nodeId: 'treble_c_d',
  nodeConfig: { notePool: ['C4', 'D4'], clef: 'treble', ... },
  exerciseIndex: 0,        // 0-based index
  totalExercises: 2,       // Total exercises in node
  exerciseType: 'note_recognition'
}
```

#### Game Component Integration

All three game components accept trail state and auto-start:
- `NotesRecognitionGame.jsx` - Uses `handleNextExercise` callback
- `SightReadingGame.jsx` - Uses `handleNextTrailExercise` callback (renamed to avoid conflict)
- `MetronomeTrainer.jsx` - Uses `handleNextExercise` callback

Auto-start pattern:
```javascript
const hasAutoStartedRef = useRef(false);
useEffect(() => {
  if (nodeConfig && !hasAutoStartedRef.current) {
    hasAutoStartedRef.current = true;
    // Build settings from nodeConfig
    // updateSettings(trailSettings)
    // updateProgress({ showSettingsModal: false })
    // setTimeout(() => startGame(trailSettings), 50)
  }
}, [nodeConfig]);
```

#### VictoryScreen Props for Trail

```javascript
<VictoryScreen
  nodeId={nodeId}
  exerciseIndex={trailExerciseIndex}      // Current exercise (0-based)
  totalExercises={trailTotalExercises}    // Total in node
  exerciseType={trailExerciseType}        // e.g., 'note_recognition'
  onNextExercise={handleNextExercise}     // Callback to navigate to next
/>
```

VictoryScreen behavior:
- Calls `updateExerciseProgress()` instead of `updateNodeProgress()` when exerciseIndex provided
- Shows "Next Exercise (X left)" button when `exercisesRemaining > 0`
- Shows "Back to Trail" when node is complete
- Only awards XP when entire node is complete

#### TrailNodeModal Exercise List

Shows exercise completion status with icons:
- ✓ Completed with stars
- → Current/next exercise
- 🔒 Locked (must complete previous first)

#### Debugging Multi-Exercise Navigation

Debug logging is available in the exercise navigation flow:
- `handleNextExercise` in game components logs parameters and navigation decisions
- VictoryScreen logs `exercisesRemaining`, button renders, and click events

Common issues to check:
1. Exercise type mismatch between node config and switch case handling
2. State race conditions with `exercisesRemaining` calculation
3. Ensure `location.state` carries all required fields (`nodeId`, `exerciseIndex`, `totalExercises`, `exerciseType`)

## Security Hardening Guidelines

This section documents security patterns learned from the January 2026 security audit. Follow these guidelines when adding new features or modifying existing code.

### 1. Authorization Patterns

#### Never Trust User-Provided IDs Without Verification

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

#### Always Verify Relationship-Based Access

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

### 2. Database Security (Supabase RLS)

#### Never Use `user_metadata` in RLS Policies

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

#### SECURITY DEFINER Functions Must Have Explicit Authorization

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

### 3. Authentication & JWT Handling

#### Verify Roles from Database, Not Metadata

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
  // Check if user exists in teachers table
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', userId)
    .single();

  if (teacher) return 'teacher';

  // Check if user exists in students table
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', userId)
    .single();

  if (student) return 'student';

  return null;
}
```

#### Clear User Data on Logout

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
  // Get user ID before signing out
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  await supabase.auth.signOut();

  // Clear user-specific localStorage keys
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

  // Clear migration flags and cached data
  localStorage.removeItem('xp_migration_complete');
  localStorage.removeItem('cached_user_progress');

  navigate('/login');
}
```

### 4. Service Worker Security

#### Never Cache Authentication Endpoints

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
  // Never cache auth-related requests
  if (shouldSkipCache(event.request.url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Apply caching strategy for other requests
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
```

### 5. Child Data Protection (COPPA/GDPR-K)

This app is designed for 8-year-old learners. Special care must be taken with personally identifiable information.

#### Minimize PII Exposure in Shared Features

**Vulnerable Pattern:**
```javascript
// BAD: Exposes usernames to all users in leaderboard
const leaderboard = await supabase
  .from('students')
  .select('id, username, total_xp')
  .order('total_xp', { ascending: false })
  .limit(10);

// Returns: [{ id: '...', username: 'JohnDoe', total_xp: 500 }, ...]
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

// Anonymize usernames for non-current users
const anonymizedLeaderboard = leaderboard.data.map((entry, index) => ({
  ...entry,
  username: entry.id === currentUserId ? entry.username : `Student ${index + 1}`,
  isCurrentUser: entry.id === currentUserId
}));
```

#### Additional COPPA Considerations

- **Parental consent**: Required for collecting data from children under 13
- **Data minimization**: Only collect data necessary for the app's function
- **No targeted advertising**: Do not use children's data for marketing
- **Teacher/parent visibility**: Parents and teachers should be able to view/delete child data
- **Secure data storage**: Encrypt sensitive data at rest and in transit

### 6. Defense in Depth

Even with RLS policies, implement client-side authorization checks as an additional layer.

**Pattern:**
```javascript
// Layer 1: Client-side check (fast, user-friendly error)
export async function updateStudentProgress(studentId, progress) {
  const { data: { user } } = await supabase.auth.getUser();

  // Client-side authorization check
  if (!user || user.id !== studentId) {
    console.error('Authorization failed: user mismatch');
    throw new Error('Unauthorized');
  }

  // Layer 2: RLS policy on the table (enforced at database level)
  // Even if client check is bypassed, RLS will block unauthorized access
  const { error } = await supabase
    .from('student_skill_progress')
    .upsert({ student_id: studentId, ...progress });

  if (error) {
    // RLS violation will surface here
    console.error('Database error:', error);
    throw error;
  }
}
```

### 7. Debug Code in Production

#### Gate Debug Functions Behind Environment Checks

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

### 8. Security Implementation Checklist

When adding new features, verify the following:

#### Database Functions
- [ ] SECURITY DEFINER functions have explicit `auth.uid()` checks
- [ ] Functions verify user can only modify their own data (or have valid relationship)
- [ ] No use of `user_metadata` for authorization decisions
- [ ] Sensitive operations are logged for audit purposes

#### RLS Policies
- [ ] All tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Policies use database state, not JWT metadata
- [ ] Admin checks use `is_admin()` function with database verification
- [ ] SELECT policies limit data exposure appropriately

#### Client-Side Code
- [ ] User IDs are verified before API calls
- [ ] Relationship-based access is verified (teacher-student, etc.)
- [ ] Error messages don't leak sensitive information
- [ ] Debug/development code is gated behind environment checks

#### Authentication Flow
- [ ] Roles verified from database tables, not user_metadata
- [ ] Logout clears all user-specific localStorage data
- [ ] Session tokens are not cached in service worker
- [ ] Auth state changes trigger appropriate cleanup

#### Data Privacy (COPPA/GDPR-K)
- [ ] Child usernames are anonymized in public-facing features
- [ ] Only necessary data is collected and stored
- [ ] Parents/teachers can view and delete child data
- [ ] No cross-user data leakage in shared features

### 9. Common Vulnerable Patterns to Avoid

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

### 10. Key Security Files

- `public/sw.js` - Service worker with auth exclusion patterns
- `src/services/authService.js` - Authentication with secure logout
- `src/services/scoreService.js` - Score operations with authorization checks
- `src/services/teacherService.js` - Teacher operations with relationship verification
- `supabase/migrations/*` - Database schema with RLS policies