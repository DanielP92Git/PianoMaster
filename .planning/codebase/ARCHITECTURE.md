# Architecture

**Analysis Date:** 2026-03-08

## Pattern Overview

**Overall:** Component-Driven SPA with Service Layer and BaaS Backend

**Key Characteristics:**
- Single-page React application with client-side routing (React Router v7)
- Backend-as-a-Service via Supabase (auth, Postgres, real-time, edge functions)
- Three-tier state management: Redux (minimal), React Context (feature-scoped), React Query (server state)
- Defense-in-depth security: client-side authorization checks + database RLS policies
- Role-based UI: Students and Teachers share the same app with different routes and components
- Progressive Web App with offline support, push notifications, and orientation locking

## Provider Hierarchy

The app wraps all content in a deeply nested provider chain. Order matters for context dependencies.

```
<StrictMode>                         # src/main.jsx
  <Provider store={store}>           # Redux (rhythm only)
    <BrowserRouter>                  # React Router
      <App>                          # src/App.jsx
        <QueryClientProvider>        # TanStack React Query (5-min stale, 10-min GC)
          <AccessibilityProvider>    # src/contexts/AccessibilityContext.jsx
            <SettingsProvider>       # src/contexts/SettingsContext.jsx
              <SessionTimeoutProvider>  # src/contexts/SessionTimeoutContext.jsx
                <ModalProvider>      # src/contexts/ModalContext.jsx
                  <RhythmProvider>   # src/reducers/rhythmReducer.jsx
                    <SightReadingSessionProvider>  # src/contexts/SightReadingSessionContext.jsx
                      <SubscriptionProvider>       # src/contexts/SubscriptionContext.jsx
                        <AppRoutes />
                      </SubscriptionProvider>
                    </SightReadingSessionProvider>
                  </RhythmProvider>
                </ModalProvider>
              </SessionTimeoutProvider>
            </SettingsProvider>
          </AccessibilityProvider>
        </QueryClientProvider>
      </App>
    </BrowserRouter>
  </Provider>
</StrictMode>
```

**Note:** `AudioContextProvider` is NOT in the global hierarchy. It wraps individual game routes at the route level in `src/App.jsx`:
```jsx
<Route path="/notes-master-mode/notes-recognition-game"
  element={<AudioContextProvider><NotesRecognitionGame /></AudioContextProvider>} />
```

## Layers

**Presentation Layer (Pages & Layout):**
- Purpose: Route-level page components and shared layout scaffolding
- Location: `src/pages/`, `src/components/layout/`
- Contains: Page shells, navigation, AppLayout with sidebar/header/tabs
- Depends on: Components, Hooks, Contexts
- Used by: Router in `src/App.jsx`
- Key files:
  - `src/components/layout/AppLayout.jsx` - Shell with sidebar, header, mobile tabs, Outlet
  - `src/components/layout/Dashboard.jsx` - Student dashboard (hero, stats, daily goals, continue learning)
  - `src/components/layout/TeacherDashboard.jsx` - Teacher dashboard (97KB, monolithic)
  - `src/pages/TrailMapPage.jsx` - Full-viewport overlay for skill trail
  - `src/pages/AppSettings.jsx` - Settings page with notification, accessibility, subscription toggles

**Game Components Layer:**
- Purpose: Self-contained game implementations with their own state machines
- Location: `src/components/games/`
- Contains: Four game types, shared settings, victory/game-over screens
- Depends on: Hooks (audio, pitch, game progress), Services (scores, progress), Contexts (session, accessibility)
- Used by: Routes defined in `src/App.jsx`
- Key files:
  - `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (105KB) - Note identification with combo, lives, auto-grow
  - `src/components/games/notes-master-games/MemoryGame.jsx` (41KB) - Card-matching note pairs
  - `src/components/games/sight-reading-game/SightReadingGame.jsx` (136KB) - VexFlow notation with mic/keyboard input
  - `src/components/games/rhythm-games/MetronomeTrainer.jsx` (49KB) - Rhythm tap game with metronome
  - `src/components/games/VictoryScreen.jsx` - Post-game results, XP awards, trail progress
  - `src/components/games/GameOverScreen.jsx` - Game over with lives/time/score variants
  - `src/components/games/shared/UnifiedGameSettings.jsx` (87KB) - Shared settings modal for all games

**Feature Hooks Layer:**
- Purpose: Reusable business logic hooks organized by domain
- Location: `src/features/`, `src/hooks/`
- Contains: Authentication hooks, game hooks, data hooks, audio hooks
- Depends on: Services, Contexts, React Query
- Used by: Components, Pages
- Key files:
  - `src/features/authentication/useUser.js` - Central auth hook (React Query, stale 5min)
  - `src/features/games/hooks/useGameProgress.js` - Score tracking, game finish, practice session creation
  - `src/features/games/hooks/useGameSettings.js` - Clef, difficulty, timed mode settings
  - `src/hooks/useVictoryState.js` (24KB) - Victory screen orchestration (XP, streak, accessories, boss unlocks)
  - `src/hooks/usePitchDetection.js` (16KB) - McLeod pitch detection via pitchy library
  - `src/hooks/useMicNoteInput.js` (10KB) - Mic input state machine (note-on/off detection)
  - `src/hooks/useAudioEngine.js` (38KB) - Audio playback engine

**Context Layer:**
- Purpose: Feature-scoped state shared across component trees
- Location: `src/contexts/`
- Contains: 7 context providers, each with its own hook
- Depends on: Services, React Query
- Used by: Components, Hooks
- Key contexts:
  - `src/contexts/AccessibilityContext.jsx` - High contrast, reduced motion, font size, sound, screen reader
  - `src/contexts/SettingsContext.jsx` - User preferences (persisted to Supabase)
  - `src/contexts/SessionTimeoutContext.jsx` - Inactivity timer with pause/resume for games
  - `src/contexts/SightReadingSessionContext.jsx` - Exercise session state (idle/in-progress/complete)
  - `src/contexts/SubscriptionContext.jsx` - Premium status via React Query + Supabase Realtime
  - `src/contexts/AudioContextProvider.jsx` - Shared Web Audio API AudioContext with iOS interruption handling
  - `src/contexts/ModalContext.jsx` - Global modal management

**Service Layer:**
- Purpose: API calls, business logic, data transformations
- Location: `src/services/`
- Contains: Supabase queries, authorization utils, domain services
- Depends on: `src/services/supabase.js` (Supabase client singleton)
- Used by: Hooks, Components
- Key services:
  - `src/services/supabase.js` - Singleton Supabase client (PKCE flow, realtime, custom headers)
  - `src/services/apiAuth.js` - Login, signup, getCurrentUser, logout
  - `src/services/apiDatabase.js` - CRUD for students, scores, practice sessions (authorization checks)
  - `src/services/apiTeacher.js` (38KB) - Teacher operations with relationship verification
  - `src/services/skillProgressService.js` (22KB) - Trail node progress, exercise progress, recommendations
  - `src/services/streakService.js` (22KB) - Streak protection (grace, freeze, weekend pass, comeback)
  - `src/services/dailyGoalsService.js` (10KB) - Daily goal generation and tracking
  - `src/services/subscriptionService.js` - Subscription status, plans, detail fetching
  - `src/services/achievementService.js` - Achievement definitions and tracking
  - `src/services/notificationService.js` - Web Push subscription management
  - `src/services/authorizationUtils.js` - Shared `verifyStudentDataAccess()`, `getCurrentUserId()`
  - `src/services/rateLimitService.js` - Client-side rate limiting

**Data Definition Layer:**
- Purpose: Static game content definitions (trail nodes, exercise types, constants)
- Location: `src/data/`, `src/config/`
- Contains: 93 skill trail nodes, node types, subscription config
- Depends on: Nothing (leaf layer)
- Used by: Services, Components, Hooks
- Key files:
  - `src/data/skillTrail.js` - Main export: SKILL_NODES, lookup functions (getNodeById, isNodeUnlocked, etc.)
  - `src/data/constants.js` - NODE_CATEGORIES, EXERCISE_TYPES (dependency-free to avoid circular imports)
  - `src/data/expandedNodes.js` - Aggregates all unit files into single array
  - `src/data/units/*.js` - 12 unit definition files (treble 1-3, bass 1-3, rhythm 1-6)
  - `src/config/subscriptionConfig.js` - FREE_NODE_IDS set, isFreeNode() gate function

**Backend Layer (Supabase):**
- Purpose: Database, auth, serverless functions, real-time subscriptions
- Location: `supabase/`
- Contains: Edge Functions (Deno/TypeScript), SQL migrations with RLS policies
- Depends on: Supabase platform, Lemon Squeezy API, web-push
- Used by: Service layer via Supabase client
- Key files:
  - `supabase/functions/create-checkout/index.ts` - Lemon Squeezy checkout URL generation
  - `supabase/functions/cancel-subscription/index.ts` - Subscription cancellation
  - `supabase/functions/lemon-squeezy-webhook/index.ts` - Webhook handler for subscription events
  - `supabase/functions/send-daily-push/index.ts` - Cron-triggered push notifications
  - `supabase/functions/send-consent-email/index.ts` - COPPA parental consent email
  - `supabase/functions/send-weekly-report/index.ts` - Weekly progress report emails
  - `supabase/migrations/` - 90+ migration files with RLS policies, helper functions

**Utility Layer:**
- Purpose: Shared helpers, platform detection, XP calculations
- Location: `src/utils/`
- Contains: Pure functions, platform utilities, constants
- Depends on: Nothing (mostly leaf)
- Used by: All layers
- Key files:
  - `src/utils/xpSystem.js` - XP levels, calculateLevel(), calculateSessionXP(), awardXP()
  - `src/utils/pwa.js` - Service worker registration, fullscreen, orientation lock
  - `src/utils/pwaDetection.js` - isIOSDevice(), isInStandaloneMode(), isAndroidDevice()
  - `src/utils/isIOSSafari.js` - iOS Safari detection (excludes Chrome/Firefox on iOS)
  - `src/utils/celebrationTiers.js` - Star-based celebration config
  - `src/utils/useMotionTokens.js` - Reduced-motion-aware framer-motion presets

## Data Flow

**Authentication Flow:**
1. `src/main.jsx` initializes Supabase client (`src/services/supabase.js`)
2. `src/App.jsx` listens to `supabase.auth.onAuthStateChange` and invalidates `["user"]` query
3. `src/features/authentication/useUser.js` queries `getCurrentUser()` via React Query
4. `src/ui/ProtectedRoute.jsx` checks `isAuthenticated` and redirects to `/login` if false
5. `AuthenticatedWrapper` in `src/App.jsx` checks role, account status, COPPA consent
6. Teachers auto-redirect to `/teacher` via `TeacherRedirect` component

**Game Session Flow (Trail Mode):**
1. **TrailNodeModal** (`src/components/trail/TrailNodeModal.jsx`) passes `location.state` with `{ nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }`
2. **Game Component** reads `location.state`, auto-starts with trail config via `useEffect` + `hasAutoStartedRef`
3. **During gameplay:** Game component manages local state (combo, lives, score), calls `pauseTimer()`/`resumeTimer()` on SessionTimeoutContext
4. **On completion:** Game passes score to `VictoryScreen` component
5. **VictoryScreen** (`src/components/games/VictoryScreen.jsx`) delegates to `useVictoryState` hook
6. **useVictoryState** (`src/hooks/useVictoryState.js`):
   - Calls `updateExerciseProgress()` or `updateNodeProgress()` via `skillProgressService`
   - Awards XP via `awardXP()` from `src/utils/xpSystem.js`
   - Records practice via `streakService.recordPractice()`
   - Checks accessory unlocks via `useAccessoryUnlockDetection`
   - Invalidates React Query caches for `["student-progress"]`, `["streak-state"]`, etc.
7. **Next exercise or return:** If multi-exercise node with remaining exercises, navigates to next; otherwise returns to trail

**Subscription / Content Gate Flow:**
1. **UI Gate:** `SubscriptionContext` provides `isPremium` globally; `isFreeNode()` from `src/config/subscriptionConfig.js` checks node access
2. **TrailNodeModal** checks both `isPremium` and `isFreeNode(nodeId)` before allowing "Start Practice"
3. **DB Gate:** RLS policies on `students_score` and `student_skill_progress` call `is_free_node(node_id) OR has_active_subscription(auth.uid())`
4. **Realtime updates:** `SubscriptionContext` subscribes to `postgres_changes` on `parent_subscriptions` table for instant premium unlock

**State Management:**
- **React Query** (primary for server state): User auth (`["user"]`), student progress (`["student-progress"]`), streak (`["streak-state"]`), subscription (`["subscription"]`), daily goals, scores, accessories
- **React Context** (UI state): Accessibility settings, sight reading session, subscription status, session timeout, modal state
- **Redux** (legacy, rhythm only): `src/store.js` with single `rhythmReducer` for composition state
- **Local component state** (game state): Each game manages its own state machine internally

## Key Abstractions

**Trail Node:**
- Purpose: Represents a single learnable skill unit in the piano learning journey
- Examples: `src/data/units/trebleUnit1Redesigned.js`, `src/data/units/rhythmUnit3Redesigned.js`
- Pattern: Static data objects with id, category, prerequisites, skills, exercises array, xpReward
- Lookup: `src/data/skillTrail.js` provides getNodeById(), getNodesByCategory(), isNodeUnlocked()

**Game Component:**
- Purpose: Self-contained game with settings, gameplay, and completion flow
- Examples: `src/components/games/notes-master-games/NotesRecognitionGame.jsx`, `src/components/games/sight-reading-game/SightReadingGame.jsx`
- Pattern: Large monolithic components (40-136KB) with internal state machines, auto-start from trail via location.state, shared VictoryScreen/GameOverScreen
- Integration: Accept `nodeId`, `nodeConfig`, `exerciseIndex` via location.state for trail mode

**Service Module:**
- Purpose: Encapsulated Supabase queries with authorization checks
- Examples: `src/services/skillProgressService.js`, `src/services/streakService.js`
- Pattern: Exported async functions that call `verifyStudentDataAccess()` before DB operations, return data or throw

**Context Provider:**
- Purpose: Feature-scoped state shared across component subtree
- Examples: `src/contexts/SubscriptionContext.jsx`, `src/contexts/AccessibilityContext.jsx`
- Pattern: `createContext()` + Provider component + custom `useXxx()` hook with "must be used within Provider" guard

## Entry Points

**Application Entry:**
- Location: `src/main.jsx`
- Triggers: Browser loads `index.html` which loads Vite-bundled JS
- Responsibilities: Font imports, Redux store setup, BrowserRouter, PWA initialization (service worker, fullscreen, orientation lock), renders `<App />`

**App Root:**
- Location: `src/App.jsx`
- Triggers: Rendered by main.jsx
- Responsibilities: QueryClient setup, provider hierarchy, route definitions, auth state listener, service worker message handler, orientation controller

**Supabase Edge Functions:**
- Location: `supabase/functions/*/index.ts`
- Triggers: HTTP requests (webhooks, cron, client calls)
- Responsibilities: Checkout creation, subscription management, push notifications, consent emails, weekly reports

**Service Worker:**
- Location: `public/sw.js`
- Triggers: Network requests, push events, notification clicks
- Responsibilities: Cache management (static assets, navigation, API), push notification display, offline fallback

## Error Handling

**Strategy:** Mixed - service layer throws, components catch and display toast/overlay

**Patterns:**
- Services throw errors after logging to console; callers catch and show `toast.error()` via react-hot-toast
- Authorization failures throw immediately with descriptive messages (defense-in-depth)
- Network errors in `useUser` use circuit breaker pattern: no retry on network errors, exponential backoff on others
- Audio errors show full-screen overlays: `MicErrorOverlay` for permission issues, `AudioInterruptedOverlay` for iOS interruptions
- Supabase RLS violations surface as database errors in the service layer
- Rate limiting via `src/services/rateLimitService.js` returns structured rate limit status; UI shows `RateLimitBanner`
- Token refresh failures auto-sign-out to prevent repeated 400 errors

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error`/`console.warn` directly. No structured logging framework. Debug logging gated behind `process.env.NODE_ENV === 'development'` in some services.

**Validation:** No formal validation library. Input validation is inline in service functions (e.g., `verifyStudentDataAccess()`, rate limit checks). Database constraints and RLS policies serve as ground truth.

**Authentication:** Supabase Auth with PKCE flow. Role determined by database table membership (`students` vs `teachers`), NOT JWT metadata. `useUser()` hook is the single source of truth for auth state. Client checks supplement RLS.

**Authorization:** Two-layer defense-in-depth:
1. Client-side: `verifyStudentDataAccess()` in `src/services/authorizationUtils.js` checks ownership or teacher-student relationship
2. Database: RLS policies on every table, helper functions `is_free_node()` and `has_active_subscription()`

**Internationalization:** i18next with `en` and `he` locales. Two namespaces: `common` and `trail`. RTL support via `i18n.dir()`. Hebrew font family (`font-hebrew`) applied via CSS.

**Accessibility:** `AccessibilityContext` provides high contrast, reduced motion, font size, extended timeouts, screen reader optimization. `useMotionTokens()` hook returns motion-safe framer-motion presets.

**Offline/PWA:** Service worker (`public/sw.js`) with cache-first for static assets, network-first for API, never-cache for Supabase `/rest/` and auth endpoints. Push notification handling. Offline fallback page (`public/offline.html`).

---

*Architecture analysis: 2026-03-08*
