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
│   ├── notes-master-games/    # Memory & recognition games (NotesRecognition, MemoryGame)
│   ├── rhythm-games/          # Rhythm/metronome training
│   └── shared/                # UnifiedGameSettings, AudioInterruptedOverlay
├── components/streak/         # StreakDisplay with freeze/grace/comeback UI
├── components/orientation/    # RotatePromptOverlay for mobile landscape
├── components/settings/       # Settings components (notifications, parent gate)
├── features/                  # Feature hooks (auth, games, userData)
├── contexts/                  # Context providers (Accessibility, Settings, AudioContext, SessionTimeout)
├── hooks/                     # Custom hooks (audio, pitch detection, mic presets, landscape lock)
├── services/                  # API calls and business logic
├── pages/                     # Routed page components
├── utils/                     # Shared utilities (isIOSSafari, xpSystem, pwaDetection, useMotionTokens)
├── config/                    # App config (subscriptionConfig)
└── locales/                   # i18n translation files (en, he)
supabase/
├── functions/                 # Edge Functions (send-daily-push, create-checkout, cancel-subscription)
└── migrations/                # Database migrations with RLS policies
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

The app uses a **glassmorphism design** on a purple gradient background (`bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900` in AppLayout.jsx).

### Glass Card Pattern (primary — used by all inner pages)
- **Container:** `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg`
- **Nested elements:** `bg-white/5 border-white/10` or `bg-white/10 border-white/20`
- **Text colors:** `text-white` (primary), `text-white/70` (secondary), `text-white/60` (tertiary)
- **Accent numbers:** Use `-300` variants (e.g., `text-indigo-300`, `text-green-300`) for colored values
- **Progress bars:** Track `bg-white/15`, fill `bg-indigo-400`
- **Hover states:** `hover:bg-white/5` or `hover:bg-white/10`

### CSS Card Classes (legacy — defined in index.css)
- `.card` = `bg-white/80 border-gray-200` — semi-transparent, avoid on purple bg pages
- `.card-hover`, `.card-compact`, `.card-elevated` — white card variants
- `.card-glass-legacy` = `bg-white/10 backdrop-blur-md border-white/20` — matches the glass pattern above

### Reference Pages
- **Settings:** Uses `SettingsSection` component with glass card pattern
- **PracticeSessions:** Glass cards with `bg-white/10 backdrop-blur-md`
- **Dashboard:** Glass stat cards with `bg-white/10 border-white/10`
- **Achievements:** Glass cards matching the pattern above

See `docs/DESIGN_SYSTEM.md` for additional patterns.

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
- `/subscribe` - Subscription purchase (Lemon Squeezy overlay checkout)
- `/subscribe/success` - Post-purchase confirmation
- `/parent-portal` - Subscription management (cancel, view plan)
- `/settings` - App settings (notifications, subscription, accessibility)
- `/legal` - Privacy/legal page
- `/consent/verify` - **Public route** (no auth). Parent email verification for COPPA consent

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
- Cache versioning: `pianomaster-v6` (bump version to force cache refresh)
- Caching strategies:
  - **Static assets**: Cache-first for icons, manifest, offline page
  - **Navigation**: Cache-first with offline fallback
  - **API calls**: Network-first with cache fallback
  - **Supabase REST API** (`/rest/`): Never cached (prevents stale subscription-gate state)
  - **Accessory images**: Dedicated `pianomaster-accessories-v2` cache
- Skips caching for Vite dev server, JS modules, and script requests
- **Push notifications**: Handles `push` events (parses JSON payload, shows notification) and `notificationclick` events (navigates to `/trail`, `/practice`, or `/` based on notification type)

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
- `src/data/constants.js` - Shared trail constants (no dependencies, avoids circular imports)
  - `NODE_CATEGORIES` — `TREBLE_CLEF`, `BASS_CLEF`, `RHYTHM`, `BOSS`
  - `EXERCISE_TYPES` — `NOTE_RECOGNITION`, `SIGHT_READING`, `RHYTHM`, `MEMORY_GAME`, `BOSS_CHALLENGE`
- `src/data/skillTrail.js` - Main export for all node definitions, categories, prerequisites
  - Re-exports `NODE_CATEGORIES` and `EXERCISE_TYPES` from `constants.js`
  - `SKILL_NODES` array (93 nodes) imported from `expandedNodes.js`
  - `getNodeById()`, `getNodesByCategory()`, `getBossNodes()`
  - `getNextNodeInCategory(nodeId)` — next non-boss node in same category (used by auto-grow)
  - `isNodeUnlocked()`, `getUnlockedNodes()`, `getAllNodes()`
- `src/data/expandedNodes.js` - Aggregates all redesigned unit files into single export
- `src/data/units/` - Redesigned unit definition files (educational psychology-driven):
  - `trebleUnit1Redesigned.js` through `trebleUnit3Redesigned.js` (23 treble nodes total)
  - `bassUnit1Redesigned.js` through `bassUnit3Redesigned.js` (22 bass nodes total)
  - `rhythmUnit1Redesigned.js` through `rhythmUnit6Redesigned.js` (36 rhythm nodes total)
  - Each unit file exports nodes with boss nodes marked for completion milestones

#### Config
- `src/config/subscriptionConfig.js` - Single source of truth for free tier boundary
  - `FREE_NODE_IDS` Set (19 IDs: treble_1_1..7, bass_1_1..6, rhythm_1_1..6)
  - `isFreeNode(nodeId)` - Returns true if node is in free tier
  - `PAYMENT_PROCESSOR` - Lemon Squeezy config placeholder
  - Must stay in sync with Postgres `is_free_node()` function

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
- `src/components/games/notes-master-games/MemoryGame.jsx` - Note-pair matching game, accepts trail state
- `src/components/games/GameOverScreen.jsx` - Game over screen with lives/time/score variants

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

-- Subscription plans (read-only reference, public SELECT)
subscription_plans (
  id TEXT PRIMARY KEY,          -- e.g., 'monthly-ils', 'yearly-usd'
  name TEXT,
  billing_period TEXT,          -- 'monthly' or 'yearly'
  currency TEXT,                -- 'ILS' or 'USD'
  amount_cents INTEGER,         -- e.g., 2990 = 29.90 ILS
  lemon_squeezy_variant_id TEXT, -- NULL until Phase 13
  is_active BOOLEAN
)

-- Parent subscriptions (SELECT-only for authenticated, writes via service_role webhook)
parent_subscriptions (
  student_id UUID FK → students.id,
  ls_subscription_id TEXT,      -- Lemon Squeezy subscription ID
  ls_customer_id TEXT,
  ls_variant_id TEXT,
  plan_id TEXT FK → subscription_plans.id,
  status TEXT,                  -- on_trial|active|paused|past_due|unpaid|cancelled|expired
  current_period_end TIMESTAMP, -- determines access expiry on cancellation
  parent_email TEXT             -- denormalized for display, not auth
)

-- Content gate: students_score has node_id for RLS enforcement
students_score.node_id TEXT     -- NULL for non-trail games (always allowed)
-- Sparse index: WHERE node_id IS NOT NULL
```

### Postgres Helper Functions

```sql
-- Returns true if node is free (19 Unit 1 nodes + NULL)
is_free_node(p_node_id TEXT) → BOOLEAN  -- IMMUTABLE, SECURITY INVOKER
-- Mirrors FREE_NODE_IDS in src/config/subscriptionConfig.js

-- Returns true if student has active subscription (with grace periods)
has_active_subscription(p_student_id UUID) → BOOLEAN  -- STABLE, SECURITY DEFINER
-- Active OR (cancelled + period not ended) OR (past_due + 3-day grace)
```

### Content Gate (Defense in Depth)

Premium trail nodes are gated at two layers:
1. **React UI** — `isFreeNode()` from `src/config/subscriptionConfig.js` (fast UX, shows paywall)
2. **Database RLS** — `students_score_insert_gate` and `student_skill_progress_insert_gate` policies call `is_free_node(node_id) OR has_active_subscription(auth.uid())` (ground truth enforcement)

Non-trail games pass `node_id: null` which always passes `is_free_node(NULL) = true`.

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

Defined in `src/data/constants.js` (re-exported by `skillTrail.js`):
```javascript
export const EXERCISE_TYPES = {
  NOTE_RECOGNITION: 'note_recognition',
  SIGHT_READING: 'sight_reading',
  RHYTHM: 'rhythm',
  MEMORY_GAME: 'memory_game',
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

All four game components accept trail state and auto-start:
- `NotesRecognitionGame.jsx` - Uses `handleNextExercise` callback
- `SightReadingGame.jsx` - Uses `handleNextTrailExercise` callback (renamed to avoid conflict)
- `MetronomeTrainer.jsx` - Uses `handleNextExercise` callback
- `MemoryGame.jsx` - Uses `handleNextExercise` callback (exercise type: `memory_game`)

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

## Push Notifications (Added Mar 2026)

Web Push notifications to encourage daily practice. COPPA-compliant with parent gate.

### Architecture

- **Client opt-in**: Dashboard shows `PushOptInCard` after 7 days → navigates to `/settings`
- **Settings toggle**: `NotificationPermissionCard` manages 6-state machine: `loading | unsupported | denied | enabled | consent_skip | default`
- **COPPA parent gate**: `ParentGateMath` requires solving a two-digit addition problem before first opt-in. After 3 failures a hint appears. Once solved, `parent_consent_granted = true` in DB; subsequent re-enables skip the gate
- **iOS PWA requirement**: Detects non-standalone mode, shows "install first" warning (iOS Web Push only works from home screen PWA)

### Key Files

| File | Role |
|---|---|
| `src/services/notificationService.js` | Client-side push helpers (subscribe, unsubscribe, permission checks) |
| `src/components/dashboard/PushOptInCard.jsx` | Dashboard soft-prompt card (7-day delay, dismissible) |
| `src/components/settings/NotificationPermissionCard.jsx` | Settings toggle with full state machine |
| `src/components/settings/ParentGateMath.jsx` | COPPA math gate overlay |
| `supabase/functions/send-daily-push/index.ts` | Edge Function that sends pushes (cron-triggered) |
| `supabase/migrations/20260304000001_add_push_subscriptions.sql` | DB schema + RLS |

### Database Table

```sql
push_subscriptions (
  id UUID PRIMARY KEY,
  student_id UUID FK → students(id) ON DELETE CASCADE,
  subscription JSONB,            -- { endpoint, keys: { p256dh, auth } }
  is_enabled BOOLEAN,
  parent_consent_granted BOOLEAN,
  parent_consent_at TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ,  -- Server-set; enforces 1/day rate limit
  UNIQUE (student_id)            -- one row per student
)
```

RLS: students can SELECT/INSERT/UPDATE/DELETE their own row only. Edge Function uses service role key.

### Edge Function: `send-daily-push`

- `verify_jwt = false` — authenticated via `x-cron-secret` header
- Triggered daily at 14:00 UTC via `pg_cron` + `pg_net`
- Skip conditions per student: (a) already notified today, (b) already practiced today
- Context-aware messages: streak at risk > near next XP level > incomplete daily goals > generic
- On HTTP 410 (Gone): auto-disables subscription
- Required env secrets: `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Client needs `VITE_VAPID_PUBLIC_KEY` in `.env`

### Edge Functions (Subscription)

| Function | Purpose |
|---|---|
| `create-checkout` | Creates Lemon Squeezy checkout overlay URL |
| `cancel-subscription` | Cancels subscription via Lemon Squeezy API |
| `send-daily-push` | Sends daily practice reminder push notifications |

## Streak Protection System (Added Mar 2026)

Prevents frustrating streak loss with grace windows, freezes, weekend pass, and comeback bonuses.

### Architecture

- **Grace Window**: 36 hours from last practice (not midnight cutoff) before streak breaks
- **Streak Freezes**: Inventory of 0-3 freezes, earned every 7-day milestone, auto-consumed when grace expires
- **Weekend Pass**: Parent-gated toggle in Settings; skips Friday and Saturday from streak evaluation (Israeli Shabbat pattern)
- **Comeback Bonus**: When streak breaks, 2x XP multiplier for 3 days to encourage return

### Key Files

| File | Role |
|---|---|
| `src/services/streakService.js` | Full streak protection logic (grace, freeze, weekend pass, comeback) |
| `src/components/streak/StreakDisplay.jsx` | Streak UI with freeze/grace/comeback states |
| `src/pages/AppSettings.jsx` | Weekend pass toggle with parent gate |
| `src/components/layout/Dashboard.jsx` | Comeback banner when bonus is active |
| `src/components/games/VictoryScreen.jsx` | Comeback multiplier applied to XP awards |
| `supabase/migrations/20260305000001_streak_protection.sql` | DB schema for streak protection columns |

### Service API (`streakService`)

- `getStreak()` — Returns just the streak count number (backward-compatible)
- `getStreakState()` — Returns full state object for UI (React Query key: `["streak-state", userId]`)
  - `{ streakCount, freezeCount, weekendPassEnabled, inGraceWindow, lastFreezeConsumedAt, comebackBonus }`
- `recordPractice()` — Updates streak on practice completion (called from VictoryScreen)
- `toggleWeekendPass(enabled)` — Parent-gated weekend pass toggle

### Database Schema (current_streak table additions)

```sql
streak_freezes INTEGER NOT NULL DEFAULT 0,          -- 0-3 freeze inventory
weekend_pass_enabled BOOLEAN NOT NULL DEFAULT false, -- parent-gated
last_freeze_earned_at TIMESTAMPTZ,                   -- prevents double-earn
comeback_bonus_start TIMESTAMPTZ,                    -- NULL when no bonus
comeback_bonus_expires TIMESTAMPTZ,                  -- NULL when no bonus
last_freeze_consumed_at TIMESTAMPTZ                  -- for one-time toast UI
-- CHECK constraint: streak_freezes BETWEEN 0 AND 3
```

### Constants

- `GRACE_WINDOW_HOURS = 36`
- `MAX_FREEZE_COUNT = 3`
- `FREEZE_EARN_INTERVAL = 7` (every 7-day streak milestone)
- `COMEBACK_BONUS_DAYS = 3`

## Notes Recognition Engagement (Added Mar 2026)

Arcade-style engagement mechanics for `NotesRecognitionGame.jsx` to keep 8-year-olds motivated.

### Combo System
- Correct answers increment combo counter
- Combo tiers with visual feedback (color/size escalation)
- Wrong answer resets combo to 0 with shake animation

### Lives System
- 3 lives per session (`INITIAL_LIVES = 3`)
- Wrong answer deducts a life
- 0 lives triggers `GameOverScreen` with lives-lost variant
- Hearts displayed in HUD

### On-Fire Mode
- Triggered at combo threshold (consecutive correct answers)
- Visual: fire icon, glow effect on game area
- Fire sound effect plays on activation
- Respects app-wide reduced-motion setting

### Auto-Grow Note Pool
- During trail mode, combo milestones expand the note pool
- Uses `getNextNodeInCategory(nodeId)` to find pedagogically-appropriate next notes
- New notes trigger a banner notification ("New note unlocked!")
- Growth interval tied to combo count (every N correct in a row)

### GameOverScreen (`src/components/games/GameOverScreen.jsx`)
- Three variants: `livesLost`, `timeRanOut`, `scoreTooLow`
- Shows sad Beethoven animation, final score, reason message
- "Try Again" and "Exit" buttons
- Fully i18n-ized

## Session Timeout (Added 2026)

Automatic inactivity logout for child safety on shared devices.

### Key Files
- `src/contexts/SessionTimeoutContext.jsx` — Provider with `pauseTimer`/`resumeTimer` for games
- `src/hooks/useInactivityTimeout.js` — Core timeout logic with role-based durations
- `src/components/ui/InactivityWarningModal.jsx` — Warning shown 5 minutes before logout

### Usage
Games call `pauseTimer()` during active gameplay and `resumeTimer()` when idle. Stores `logoutReason: 'inactivity'` in sessionStorage for login page messaging.

## Orientation & Landscape Lock

### Key Files
- `src/hooks/useLandscapeLock.js` — Android PWA: enters fullscreen + locks to landscape; no-op on iOS/desktop
- `src/hooks/useRotatePrompt.js` — Shows rotate-to-landscape prompt on mobile portrait; permanent dismiss via localStorage
- `src/components/orientation/RotatePromptOverlay.jsx` — Visual overlay for rotate prompt
- `src/utils/pwaDetection.js` — `isAndroidDevice()`, `isInStandaloneMode()` platform detection

All game components use both hooks. Android PWA gets API-based lock; iOS/web get a dismissible prompt overlay.

## Audio Infrastructure

### AudioContextProvider (`src/contexts/AudioContextProvider.jsx`)
- Central `AudioContext` management for the entire app
- Provides `useAudioContext()` hook
- iOS Safari interruption detection (phone calls, Siri, etc.)
- Used by all game components, pitch detection, and mic input

### `useMicNoteInput` Hook (`src/hooks/useMicNoteInput.js`)
- Combines pitch detection with note-on/note-off state machine
- Used by `NotesRecognitionGame` for microphone-based note input
- Integrates with `AudioContextProvider` for shared audio context

### `useMotionTokens` Hook (`src/utils/useMotionTokens.js`)
- Provides reduced-motion-aware animation tokens for framer-motion
- Returns `{ reduce, snappy, soft, fade }` transition presets
- `reduce` = true when user prefers reduced motion → all transitions become `{ duration: 0 }`

## iOS Safari Hardening (Added Feb 2026)

### Shared Utility: `src/utils/isIOSSafari.js`

```javascript
export const isIOSSafari = boolean; // iPad/iPhone detection, excludes Chrome/Firefox/Edge iOS
```

### MicErrorOverlay (`src/components/games/sight-reading-game/components/MicErrorOverlay.jsx`)

Full-screen overlay for microphone errors. Props: `errorType` (`"permission_denied" | "mic_stopped" | null`), `isRetrying`, `canRetry`, `onRetry`, `onBack`.

- On iOS Safari + `permission_denied`: shows 5-step guide to re-enable mic in iOS Settings
- On other platforms: shows generic browser hint
- i18n keys under `micError.*`

### AudioInterruptedOverlay (`src/components/games/shared/AudioInterruptedOverlay.jsx`)

Detects iOS Safari audio context interruptions (phone calls, Siri, etc.) and shows recovery overlay. Used by all three game components.

## Pitch Detection & Timing

### `usePitchDetection` Hook

Supports two modes:
- **Shared analyser**: Pass `analyserNode` prop → attaches to existing `AnalyserNode`, doesn't close `AudioContext` on stop
- **Self-created** (legacy): Creates its own `AudioContext`, closes everything on stop

Uses **McLeod Pitch Method** via `pitchy` library. Clarity gate: `PITCH_CLARITY_THRESHOLD = 0.9`. Range: A2 (MIDI 45) to C6 (MIDI 84).

Performance marks (`getAudioData`, `findPitch`) appear in browser DevTools User Timing.

### `useTimingAnalysis` Hook (`src/components/games/sight-reading-game/hooks/useTimingAnalysis.js`)

Centralizes timing window calculations for Sight Reading game:
- `buildTimingWindows(pattern)` — BPM-adaptive early/late tolerances, prevents window overlap at high BPM
- `evaluateTiming(timeDiffMs)` — ≤100ms perfect (1.0), ≤200ms good (0.8), ≤300ms okay (0.5), else early/late (0.3)
- Constants in `src/components/games/sight-reading-game/constants/timingConstants.js`

### Mic Input Presets (`src/hooks/micInputPresets.js`)

Named presets and BPM-adaptive timing:
```javascript
MIC_INPUT_PRESETS.sightReading     // { rmsThreshold, tolerance, onFrames, changeFrames, offMs, minInterOnMs }
MIC_INPUT_PRESETS.notesRecognition
calcMicTimingFromBpm(bpm, shortestNoteDuration) // Returns { onFrames, offMs, changeFrames, minInterOnMs }
```

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
- `src/config/subscriptionConfig.js` - Free tier boundary (must sync with Postgres `is_free_node()`)
- `supabase/migrations/*` - Database schema with RLS policies
- `supabase/migrations/20260226000001_add_subscription_tables.sql` - Subscription RLS + helper functions
- `supabase/migrations/20260226000003_add_content_gate_rls.sql` - Content gate RLS on score tables