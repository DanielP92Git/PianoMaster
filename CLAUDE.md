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
- `/notes-master-mode/*` - Note learning games
- `/rhythm-mode/*` - Rhythm training games
- `/practice-sessions` - Recording and playback

## Accessibility

The app has comprehensive a11y support via `AccessibilityContext`:
- High contrast mode
- Reduced motion
- Screen reader optimization
- RTL support (Hebrew)
- Extended timeouts for cognitive accessibility

## Gamification Trail System (Added Jan 2026)

A Duolingo-style skill progression system for 8-year-old learners.

### Core Concepts

- **Skill Nodes**: Learning units organized by category (Treble Clef, Bass Clef, Rhythm)
- **Star Rating**: 0-3 stars based on performance (60%=1★, 80%=2★, 95%=3★)
- **XP System**: Experience points with 10 levels (Beginner → Legend)
- **Daily Goals**: 3 random goals per day to encourage engagement
- **Prerequisites**: Nodes unlock progressively (e.g., complete "C & D" before "C, D, E")

### Key Files

#### Data Layer
- `src/data/skillTrail.js` - All node definitions, categories, prerequisites
  - `SKILL_NODES` array with treble/bass/rhythm paths
  - `getNodeById()`, `getNodesByCategory()`, `getBossNodes()`
  - `isNodeUnlocked()`, `getUnlockedNodes()`, `getAllNodes()`

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
- `src/components/trail/TrailMap.jsx` - Visual skill trail with node grid
- `src/components/trail/TrailNode.jsx` - Individual node (locked/available/in-progress/mastered states)
- `src/components/trail/TrailNodeModal.jsx` - Node details + "Start Practice" button
- `src/components/dashboard/DailyGoalsCard.jsx` - Shows 3 daily goals with progress bars
- `src/pages/TrailMapPage.jsx` - Page wrapper for trail

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

#### Known Issue (In Progress)

**Bug**: After completing first exercise, VictoryScreen shows correctly but then auto-redirects to `/trail` with infinite fetch loop (`ERR_INSUFFICIENT_RESOURCES`).

**Debug logging added** to trace the issue:
- `handleNextExercise` in NotesRecognitionGame logs all parameters and navigation decisions
- VictoryScreen logs `exercisesRemaining`, button renders, and click events

**Likely causes being investigated**:
1. `handleNextExercise` hitting default switch case (unknown exercise type)
2. State race condition with `exercisesRemaining`