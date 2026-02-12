# Architecture

**Analysis Date:** 2026-01-31

## Pattern Overview

**Overall:** Multi-layer feature-driven architecture with React Router page routing, context-based feature state, and Supabase backend integration. The application implements a Duolingo-style skill progression system alongside traditional game modes.

**Key Characteristics:**
- Layered separation: pages → components → hooks → services → database
- Feature-scoped state via React Context (Accessibility, Settings, SightReading, Rhythm)
- Server state via React Query with Supabase real-time subscriptions
- Role-based access (Student/Teacher) with route protection
- Game session lifecycle managed by context and hooks
- Trail system as parallel to game modes, sharing underlying services

## Layers

**Presentation (Pages & Components):**
- Purpose: React components for UI rendering, route containers, and game interfaces
- Location: `src/pages/`, `src/components/`
- Contains: Page layouts (TrailMapPage, Dashboard), game UIs (MemoryGame, NotesRecognitionGame, SightReadingGame, MetronomeTrainer), modals, forms
- Depends on: Hooks, contexts, services
- Used by: React Router routes in `src/App.jsx`

**Feature Hooks (Feature Layer):**
- Purpose: Encapsulate feature-specific business logic and data fetching
- Location: `src/features/` (authentication, games, userData), `src/hooks/`
- Contains: `useUser()`, `useScores()`, `usePitchDetection()`, `useAudioEngine()`, `useKeyboardNavigation()`, trait-specific hooks
- Depends on: Services, contexts, React Query
- Used by: Components and other hooks

**State Management (Context + Query):**
- Purpose: Provide shared state within feature scopes
- Location: `src/contexts/`, wrapped in `App.jsx`
- Contains:
  - `AccessibilityContext` - a11y settings (high contrast, reduced motion, timeouts, RTL)
  - `SettingsContext` - user preferences (theme, notification settings)
  - `SightReadingSessionContext` - active sight reading game state
  - `ModalContext` - global modal/dialog state
  - `RhythmProvider` (reducer) - rhythm composition state
  - React Query client for server state (auth, scores, progress)
- Depends on: Services for data initialization
- Used by: All feature components and hooks

**Services Layer (Business Logic):**
- Purpose: API calls, data transformations, business rules, direct Supabase interactions
- Location: `src/services/`
- Key services:
  - `skillProgressService.js` - Trail node progress (CRUD), star calculation, exercise tracking
  - `dailyGoalsService.js` - Daily goal generation, progress calculation
  - `apiAuth.js` - Authentication operations (login, signup, logout)
  - `apiDatabase.js` - Core data queries (scores, practice sessions)
  - `apiTeacher.js` - Teacher-specific operations (student management, assignments)
  - `achievementService.js` - Achievement logic
  - `streakService.js` - Daily practice streaks
  - `practiceService.js` - Practice session management
  - `reminderService.js`, `dashboardReminderService.js` - Push notifications
  - Audio services: `audioEngine.js`, `audioCacheService.js`, `audioCompressionService.js`
- Depends on: Supabase, utilities
- Used by: Hooks and components

**Data Layer (Constants & Utilities):**
- Purpose: Static data definitions, calculations, and transformations
- Location: `src/data/`, `src/utils/`
- Data files:
  - `src/data/skillTrail.js` - Node definitions (90+ nodes), unit metadata, prerequisites
  - `src/data/constants.js` - NODE_CATEGORIES, EXERCISE_TYPES
  - `src/data/nodeTypes.js` - Node visual type mappings
  - `src/data/expandedNodes.js` - Extended node configuration
  - `src/data/trailSections.js` - Trail UI section definitions
- Utility files:
  - `src/utils/xpSystem.js` - XP levels, calculations, leaderboards
  - `src/utils/progressMigration.js` - One-time XP migration for existing users
  - `src/utils/nodeGenerator.js` - Dynamic node generation helpers
  - `src/utils/pwa.js` - PWA/fullscreen initialization
  - `src/utils/avatarAssets.js` - Avatar resolution logic
- Depends on: None (constants layer)
- Used by: Services, hooks, components

**Backend (Supabase):**
- Purpose: Authentication, database persistence, real-time subscriptions
- Connection: `src/services/supabase.js`
- Key tables: `students`, `teachers`, `student_skill_progress`, `student_daily_goals`, `students_score`, `practice_sessions`
- RLS (Row-Level Security) policies protect data access
- Functions: `award_xp()` for safe XP updates

## Data Flow

**Game Session Flow (Trail + Traditional):**

1. User navigates to game via trail node or game menu
2. Component (MemoryGame, NotesRecognitionGame, SightReadingGame, MetronomeTrainer) receives:
   - Optional: `nodeId`, `exerciseIndex`, `totalExercises` from location.state (trail context)
   - Settings from SettingsContext
3. Game runs, collects score/results
4. VictoryScreen component:
   - If from trail: calls `updateExerciseProgress()` → `skillProgressService`
   - Otherwise: calls `updateNodeProgress()` for traditional play
   - Calls `awardXP()` via xpSystem
   - Shows achievement/accessory unlocks
   - Navigates to next exercise or returns to trail/menu
5. skillProgressService updates `student_skill_progress` table
6. xpSystem RPC calls `award_xp()` function which updates `students.total_xp`

**Trail Progression Flow:**

1. TrailMapPage renders skill nodes via TrailMap component
2. Node unlock logic: `isNodeUnlocked()` checks prerequisites from `skillTrail.js`
3. User clicks node → TrailNodeModal shows details
4. Modal displays exercise list with progress icons
5. "Start Practice" button navigates to game component with trail state
6. After game, nodes update with stars, unlock next nodes
7. Dashboard shows recommended next node via `getNextRecommendedNode()`

**Daily Goals Flow:**

1. Dashboard queries `getDailyGoalsWithProgress()` on mount
2. If no goals for today: `generateDailyGoals()` creates 3 random goals
3. Goals stored in `student_daily_goals` table
4. Progress calculated by querying `students_score` + `student_skill_progress`
5. Query refetches every 60s to update progress bars
6. Goals auto-complete when conditions met

**XP & Leveling Flow:**

1. Node completion → calculateSessionXP() determines stars & base XP
2. VictoryScreen calls awardXP(studentId, totalXP)
3. RPC function `award_xp()` atomically:
   - Increments `students.total_xp`
   - Calculates new level via XP_LEVELS thresholds
   - Returns leveledUp flag
4. Dashboard displays current level and progress to next
5. Leaderboard anonymizes usernames (COPPA compliance) except for current user

**State Management:**
- Redux: Minimal, only for rhythm composition state (`rhythmReducer`)
- Context: Feature-scoped (Accessibility, Settings, SightReading, Rhythm)
- React Query: Server state (auth, user profile, scores, progress) with 5-min stale time
- localStorage: PWA installation, dismissed tips, migration flags

## Key Abstractions

**Skill Node:**
- Purpose: Represent a learnable unit with prerequisites, exercises, and rewards
- Examples: `src/data/skillTrail.js` defines 90+ nodes (treble, bass, rhythm, boss)
- Pattern: SKILL_NODES array, helpers like `getNodeById()`, `isNodeUnlocked()`, `getUnlockedNodes()`
- Structure: id, name, category, order, prerequisites, skills array, exercises array, xpReward, isBoss

**Exercise:**
- Purpose: Individual practice challenge within a node (nodes can have multiple exercises)
- Pattern: Each exercise has type (note_recognition, sight_reading, rhythm, memory_game), config with parameters
- Tracking: `exercise_progress` JSONB column in `student_skill_progress` tracks completion per exercise

**Game Session Context:**
- Purpose: Shared state for active game (settings, progress, results)
- Providers: SightReadingSessionContext (for sight reading), RhythmProvider (for composition)
- Pattern: useContext hook to access, dispatch actions to modify

**XP & Level:**
- Purpose: Player progression gamification
- Abstraction: XP_LEVELS array (15 levels), calculateLevel(), calculateSessionXP(), awardXP()
- Integration: Awarded on node completion, displayed on dashboard and leaderboards

**User Roles:**
- Purpose: Student vs. Teacher access control
- Pattern: `useUser()` hook provides `isStudent`, `isTeacher` booleans
- Enforcement: ProtectedRoute wrapper, role-based redirects in App.jsx

## Entry Points

**App Root:**
- Location: `src/main.jsx`
- Triggers: Page load
- Responsibilities: Initialize service worker, register i18n, lock orientation, create React root

**App Component:**
- Location: `src/App.jsx`
- Triggers: React mount
- Responsibilities: Setup providers (Query, Accessibility, Settings, Modal, Rhythm, SightReadingSession), define route structure, handle auth state changes, manage orientation/fullscreen, initialize reminder services

**AppLayout:**
- Location: `src/components/layout/AppLayout.jsx`
- Triggers: Route to "/" and nested routes
- Responsibilities: Conditionally hide/show sidebar and header, apply background styles, render Outlet for child routes

**Dashboard:**
- Location: `src/components/layout/Dashboard.jsx`
- Triggers: Route to "/" for students
- Responsibilities: Load user profile, daily goals, streak, total points; show "Continue Learning" button, daily goals card, practice mode links

**TrailMapPage:**
- Location: `src/pages/TrailMapPage.jsx`
- Triggers: Route to "/trail"
- Responsibilities: Full-viewport trail visualization, node unlock/click handling, modal management

**Game Components:**
- Locations: `src/components/games/notes-master-games/*`, `src/components/games/rhythm-games/*`, `src/components/games/sight-reading-game/*`
- Triggers: Route to game path (e.g., "/notes-master-mode/notes-recognition-game")
- Responsibilities: Game logic (generate questions, process answers), handle settings, collect scores, render VictoryScreen on completion

**VictoryScreen:**
- Location: `src/components/games/VictoryScreen.jsx`
- Triggers: Game completion
- Responsibilities: Calculate stars, call updateExerciseProgress() or updateNodeProgress(), award XP, show unlocks, navigate to next exercise or return

## Error Handling

**Strategy:** Try-catch blocks at service layer, console logging, user-facing error toasts via react-hot-toast

**Patterns:**
- Services throw errors after logging (consumed by hooks/components)
- Components catch and display toast notifications
- Auth failures trigger logout and redirect to /login
- Network failures: React Query retry (1 retry), refetch on reconnect enabled
- Supabase RLS violations: Caught as errors, logged, user sees generic error message

## Cross-Cutting Concerns

**Logging:**
- Console-based (remove in production)
- Service layer: logs errors and major operations
- Components: logs state changes, navigation
- Utils: logs DEBUG operations (gated by NODE_ENV)

**Validation:**
- Services: Validate user ID before DB operations (authorization checks)
- Components: Form validation before submission
- Data: Trail system validates node prerequisites, star thresholds (XP_LEVELS)

**Authentication:**
- Entry: LoginForm → apiAuth.js services
- Persistence: Supabase session token via localStorage
- Refresh: App.jsx listens to onAuthStateChange, invalidates queries on token refresh
- Cleanup: Logout clears localStorage user keys (COPPA compliance for shared devices)

**Internationalization (i18n):**
- Setup: `src/i18n/index.js` configures i18next with English and Hebrew
- RTL: AccessibilityContext provides `dir()` for Hebrew, document.documentElement.lang/dir updated in App.jsx
- Translations: `src/locales/en/` and `src/locales/he/` with nested JSON keys
- Node names: `translateNodeName()` helper for dynamic trail text

**Accessibility:**
- AccessibilityContext manages high contrast, reduced motion, extended timeouts
- Components check context flags and apply conditional rendering/styling
- Toaster duration adapts to extended timeouts
- ScreenReader hook optimizes DOM for assistive tech

**PWA & Service Worker:**
- Registration: `registerServiceWorker()` in main.jsx
- Cache versioning: pianomaster-v2, bump to force refresh
- Auth exclusion: Service worker skips caching auth endpoints
- Offline: Navigation cache-first with fallback
- Preloading: `<picture>` elements with WebP for hero images

