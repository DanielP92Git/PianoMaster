# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Component-Driven SPA with Service Layer and BaaS Backend

**Key Characteristics:**
- Single-page React 18 application with client-side routing (React Router v7)
- Backend-as-a-Service via Supabase (auth, Postgres, real-time subscriptions, edge functions)
- Three-tier state management: Redux (minimal/legacy), React Context (feature-scoped), TanStack React Query v5 (server state)
- Defense-in-depth security: client-side authorization checks + database RLS policies
- Role-based UI: Students and Teachers share the same app with different routes and components
- Progressive Web App with offline support, push notifications, orientation locking, and iOS-specific handling
- All UI in JavaScript (JSX) -- no TypeScript in app code (only `src/types/database.ts` for Supabase types)

## Provider Hierarchy

The app wraps all content in a deeply nested provider chain. Order matters for context dependencies.

```
<StrictMode>                              # src/main.jsx
  <Provider store={store}>                # Redux (rhythm only) — src/store.js
    <BrowserRouter>                       # React Router
      <App>                              # src/App.jsx
        <QueryClientProvider>             # TanStack React Query (5-min stale, 10-min GC)
          <ErrorBoundary>                # src/components/ErrorBoundary.jsx
            <AccessibilityProvider>       # src/contexts/AccessibilityContext.jsx
              <SettingsProvider>          # src/contexts/SettingsContext.jsx
                <SessionTimeoutProvider>  # src/contexts/SessionTimeoutContext.jsx
                  <ModalProvider>         # src/contexts/ModalContext.jsx
                    <RhythmProvider>      # src/reducers/rhythmReducer.jsx
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
          </ErrorBoundary>
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

This avoids Safari's 4-AudioContext limit and ensures a fresh audio context per game session.

## Layers

**Presentation Layer (Pages & Layout):**
- Purpose: Route-level page components and shared layout scaffolding
- Location: `src/pages/`, `src/components/layout/`
- Contains: Page shells, navigation, AppLayout with sidebar/header/mobile tabs
- Depends on: Components, Hooks, Contexts
- Used by: Router in `src/App.jsx`
- Key files:
  - `src/components/layout/AppLayout.jsx` (101 lines) - Shell with sidebar, header, mobile tabs; uses `<Outlet />` for child routes; hides chrome for game and trail routes
  - `src/components/layout/Dashboard.jsx` (849 lines) - Student dashboard with hero area, daily goals, weekly summary, practice sessions, push opt-in
  - `src/components/layout/TeacherDashboard.jsx` (2699 lines) - Full teacher dashboard (monolithic)
  - `src/components/layout/Header.jsx` - Page header with menu toggle, title, user avatar
  - `src/components/layout/Sidebar.jsx` - Desktop sidebar navigation
  - `src/components/layout/MobileTabsNav.jsx` - Bottom tab bar for mobile
  - `src/components/layout/appNavigationConfig.js` - Shared nav item definitions for sidebar and mobile tabs

**Game Components Layer:**
- Purpose: Self-contained game implementations with their own internal state machines
- Location: `src/components/games/`
- Contains: Four game types, shared settings, victory/game-over screens
- Depends on: Hooks (audio, pitch, game progress), Services (scores, progress), Contexts (session timeout, accessibility)
- Used by: Routes defined in `src/App.jsx`
- Key files:
  - `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (2827 lines) - Note identification with combo system, lives, auto-grow note pool
  - `src/components/games/notes-master-games/MemoryGame.jsx` (1144 lines) - Card-matching note pairs
  - `src/components/games/sight-reading-game/SightReadingGame.jsx` (3747 lines) - VexFlow notation reading with mic/keyboard input
  - `src/components/games/rhythm-games/MetronomeTrainer.jsx` (1464 lines) - Rhythm tap game with metronome, supports 6/8 compound time
  - `src/components/games/VictoryScreen.jsx` - Post-game results, XP awards, trail progress, boss unlock modal
  - `src/components/games/GameOverScreen.jsx` - Game over with lives/time/score variants and sad Beethoven animation
  - `src/components/games/shared/UnifiedGameSettings.jsx` (2288 lines) - Configuration-driven pre-game settings modal for all games

**Feature Hooks Layer:**
- Purpose: Reusable business logic hooks organized by domain
- Location: `src/features/`, `src/hooks/`
- Contains: Authentication hooks, game hooks, data hooks, audio hooks
- Depends on: Services, Contexts, React Query
- Used by: Components, Pages
- Key files:
  - `src/features/authentication/useUser.js` - Central auth hook via React Query (stale 5min), returns `{ user, isAuthenticated, isTeacher, isStudent, userRole, profile }`
  - `src/features/authentication/useLogin.js`, `useLogout.js`, `useSignup.js`, `useSocialAuth.js`, `useResetPassword.js`, `useUpdatePassword.js` - Auth action hooks
  - `src/features/games/hooks/useGameProgress.js` - Score tracking, answer handling, practice session creation
  - `src/features/games/hooks/useGameSettings.js` - Clef, difficulty, timed mode, note selection settings
  - `src/features/games/hooks/useGameTimer.js` - Countdown timer with pause/resume
  - `src/features/userData/useScores.js` - Score fetching and updates
  - `src/hooks/useVictoryState.js` (712 lines) - Victory screen orchestration (XP awards, streak recording, accessory unlocks, boss unlocks, celebration tiers)
  - `src/hooks/usePitchDetection.js` - McLeod pitch detection via `pitchy` library (clarity gate 0.9, range A2-C6)
  - `src/hooks/useMicNoteInput.js` - Mic input state machine (note-on/off detection) with named presets from `micInputPresets.js`
  - `src/hooks/useAudioEngine.js` (1245 lines) - Audio playback engine
  - `src/hooks/useOnboarding.js` - First-time onboarding tour state
  - `src/hooks/useAccountStatus.js` - Account suspension checks (consent pending, deletion scheduled)

**Context Layer:**
- Purpose: Feature-scoped state shared across component trees
- Location: `src/contexts/`
- Contains: 7 context providers, each co-locating the Provider component and a `useXxx()` hook
- Depends on: Services, React Query
- Used by: Components, Hooks
- Key contexts:
  - `src/contexts/AccessibilityContext.jsx` - High contrast, reduced motion, font size, sound volume, keyboard navigation, screen reader, extended timeouts. Uses `useReducer` with localStorage persistence.
  - `src/contexts/SettingsContext.jsx` - User preferences persisted to Supabase `user_preferences` table (notification settings, audio prefs, daily reminder times). Debounced saves.
  - `src/contexts/SessionTimeoutContext.jsx` - Inactivity timer with role-based durations (students shorter). Games call `pauseTimer()` during gameplay and `resumeTimer()` when idle.
  - `src/contexts/SightReadingSessionContext.jsx` - 10-exercise session state machine (`idle` -> `in-progress` -> `complete`). Tracks exercise results per session.
  - `src/contexts/SubscriptionContext.jsx` - Premium status via React Query (`staleTime: 0`) + Supabase Realtime `postgres_changes` subscription on `parent_subscriptions` table. Shows toast on `false -> true` transition.
  - `src/contexts/AudioContextProvider.jsx` - Shared Web Audio API `AudioContext` with `AnalyserNode`. Handles iOS interrupted state detection (`onstatechange`), mic permissions, visibility-based suspend/resume.
  - `src/contexts/ModalContext.jsx` - Simple global modal open/close management.

**Service Layer:**
- Purpose: API calls, business logic, data transformations -- all Supabase queries
- Location: `src/services/`
- Contains: 30 service files covering auth, database CRUD, domain logic
- Depends on: `src/services/supabase.js` (Supabase client singleton)
- Used by: Hooks, Components
- Key services:
  - `src/services/supabase.js` - Singleton Supabase client (PKCE auth flow, realtime at 10 events/sec, custom `X-Client-Info` header)
  - `src/services/apiAuth.js` - Login (with 15s timeout), getCurrentUser (with refresh token error recovery), signup, social auth, password reset
  - `src/services/apiDatabase.js` - CRUD for students, scores, practice sessions with `verifyStudentDataAccess()` authorization checks
  - `src/services/apiTeacher.js` (1325 lines) - Teacher operations: student management, assignments, recordings, analytics, relationship verification
  - `src/services/apiScores.js` - Score submission and retrieval
  - `src/services/apiSettings.js` - User preference CRUD
  - `src/services/skillProgressService.js` - Trail node progress CRUD, exercise progress, star calculations, node unlock checks, next-node recommendations
  - `src/services/streakService.js` - Streak protection system: 36-hour grace window, 0-3 freeze inventory, weekend pass (Israeli Shabbat: Fri/Sat), comeback bonus (2x XP for 3 days). Includes network error cooldown/dedup.
  - `src/services/dailyGoalsService.js` - Daily goal generation (3 random from 5 types), progress calculation, goal completion tracking
  - `src/services/dailyChallengeService.js` - Daily challenge system
  - `src/services/subscriptionService.js` - Subscription status checks (mirrors Postgres `has_active_subscription()` with grace periods), plan fetching
  - `src/services/achievementService.js` - Achievement definitions and tracking
  - `src/services/notificationService.js` - Web Push subscription management (VAPID)
  - `src/services/consentService.js` - COPPA parental consent flow
  - `src/services/accountDeletionService.js` - Account deletion request handling
  - `src/services/authorizationUtils.js` - Shared `verifyStudentDataAccess()` (checks ownership or teacher-student connection), `getCurrentUserId()`
  - `src/services/rateLimitService.js` - Client-side rate limiting
  - `src/services/sentryService.js` - Sentry error tracking initialization
  - `src/services/weeklyProgressService.js` - Weekly progress data aggregation
  - `src/services/profileService.js` - Profile data management
  - `src/services/practiceService.js` - Practice session management
  - `src/services/reminderService.js`, `src/services/dashboardReminderService.js` - Client-side reminder management with alarm modal
  - `src/services/audioCacheService.js`, `src/services/audioCompressionService.js` - Audio caching and compression
  - `src/services/dataExportService.js` - Student data export (COPPA/GDPR compliance)

**Data Definition Layer:**
- Purpose: Static game content definitions (trail nodes, exercise configs, constants)
- Location: `src/data/`, `src/config/`
- Contains: 93 skill trail nodes across 22 unit files, constants, subscription config
- Depends on: Nothing (leaf layer -- zero imports from other app layers)
- Used by: Services, Components, Hooks
- Key files:
  - `src/data/constants.js` - `NODE_CATEGORIES` (TREBLE_CLEF, BASS_CLEF, RHYTHM, BOSS), `EXERCISE_TYPES` (NOTE_RECOGNITION, SIGHT_READING, RHYTHM, MEMORY_GAME, BOSS_CHALLENGE). Dependency-free to avoid circular imports.
  - `src/data/skillTrail.js` - Main exports: `SKILL_NODES` (93 nodes), `UNITS` metadata, lookup functions (`getNodeById()`, `getNodesByCategory()`, `getBossNodes()`, `getNextNodeInCategory()`, `isNodeUnlocked()`, `getUnlockedNodes()`)
  - `src/data/expandedNodes.js` - Aggregates all 22 unit files into single `EXPANDED_NODES` array
  - `src/data/units/trebleUnit{1-7}Redesigned.js` - Treble clef nodes (first position through key signatures)
  - `src/data/units/bassUnit{1-7}Redesigned.js` - Bass clef nodes (first position through key signatures)
  - `src/data/units/rhythmUnit{1-8}Redesigned.js` - Rhythm nodes (quarter notes through syncopation, including 6/8 compound meter)
  - `src/data/nodeTypes.js` - Node type visual definitions
  - `src/config/subscriptionConfig.js` - `FREE_NODE_IDS` Set (19 IDs: 7 treble + 6 bass + 6 rhythm), `PAYWALL_BOSS_NODE_IDS` (3), `isFreeNode()` gate function. Must stay in sync with Postgres `is_free_node()`.

**Backend Layer (Supabase):**
- Purpose: Database, auth, serverless functions, real-time subscriptions
- Location: `supabase/`
- Contains: 10 Edge Functions (Deno/TypeScript), 100+ SQL migrations with RLS policies
- Depends on: Supabase platform, Lemon Squeezy API, Brevo email API, web-push
- Used by: Service layer via Supabase client; Edge functions triggered by HTTP/cron
- Edge Functions:
  - `supabase/functions/create-checkout/index.ts` - Lemon Squeezy checkout URL generation
  - `supabase/functions/cancel-subscription/index.ts` - Cancel subscription via LS API
  - `supabase/functions/lemon-squeezy-webhook/index.ts` - Webhook handler with signature verification; has `lib/` subdirectory for modular handlers
  - `supabase/functions/send-daily-push/index.ts` - Cron-triggered daily push notifications
  - `supabase/functions/send-weekly-report/index.ts` - Weekly parent progress report emails via Brevo
  - `supabase/functions/send-consent-email/index.ts` - COPPA parental consent email
  - `supabase/functions/unsubscribe-weekly-report/index.ts` - HMAC-SHA256 signed email unsubscribe handler
  - `supabase/functions/verify-consent/index.ts` - Consent verification endpoint
  - `supabase/functions/process-account-deletions/index.ts` - Account deletion processing
  - `supabase/functions/send-feedback/index.ts` - User feedback submission handler

**Utility Layer:**
- Purpose: Shared helpers, platform detection, XP calculations, celebration logic
- Location: `src/utils/`
- Contains: Pure functions, platform utilities, constants
- Depends on: Mostly nothing (leaf); `xpSystem.js` imports supabase client
- Used by: All layers
- Key files:
  - `src/utils/xpSystem.js` - 30 static XP levels + infinite prestige tiers (3000 XP each beyond level 30), `calculateLevel()`, `calculateSessionXP()`, `awardXP()`, `getStudentXP()`, `getLevelProgress()`
  - `src/utils/pwa.js` - Service worker registration, fullscreen initialization, orientation lock (`lockOrientation()`)
  - `src/utils/pwaDetection.js` - `isIOSDevice()`, `isInStandaloneMode()`, `isAndroidDevice()`
  - `src/utils/isIOSSafari.js` - iOS Safari detection (excludes Chrome/Firefox on iOS)
  - `src/utils/celebrationTiers.js` - Star-based celebration tier config
  - `src/utils/celebrationMessages.js` - Celebration message templates
  - `src/utils/useMotionTokens.js` - Reduced-motion-aware framer-motion animation presets
  - `src/utils/translateNodeName.js` - Trail node name localization
  - `src/utils/avatarAssets.js` - Avatar image source resolution
  - `src/utils/accessoryUnlocks.js` - Accessory unlock condition checks
  - `src/utils/levelUpTracking.js` - Level-up celebration dedup tracking
  - `src/utils/nodeTypeStyles.js` - Visual styles for trail node types
  - `src/utils/fanfareSound.js` - Victory sound effect
  - `src/utils/errorNotification.js` - Error notification helper
  - `src/utils/ageUtils.js` - Age calculation for COPPA

## Data Flow

**Authentication Flow:**
1. `src/main.jsx` initializes Supabase client (`src/services/supabase.js`) with PKCE auth flow
2. `src/App.jsx` listens to `supabase.auth.onAuthStateChange` -- on `TOKEN_REFRESH_FAILED`, signs out to prevent repeated 400s; on any event, invalidates `["user"]` React Query
3. `src/features/authentication/useUser.js` queries `getCurrentUser()` from `src/services/apiAuth.js` via React Query with circuit breaker (no retry on network errors, exponential backoff on others)
4. `src/ui/ProtectedRoute.jsx` checks `isAuthenticated` and redirects to `/login` if false
5. `AuthenticatedWrapper` in `src/App.jsx` handles post-auth gates in order:
   a. No profile yet -> show `RoleSelection` (student or teacher)
   b. Student with suspended account (consent pending) -> show `ParentalConsentPending`
   c. Student with suspended account (deletion) -> show suspension message
6. Teachers auto-redirect to `/teacher` via `TeacherRedirect` component at the `/` index route

**Game Session Flow (Trail Mode):**
1. **TrailNodeModal** (`src/components/trail/TrailNodeModal.jsx`) passes `location.state` with `{ nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }`
2. **Game Component** reads `location.state`, auto-starts with trail config via `useEffect` + `hasAutoStartedRef` pattern (prevents double-start in StrictMode)
3. **During gameplay:** Game component manages local state (combo, lives, score), calls `pauseTimer()`/`resumeTimer()` on `SessionTimeoutContext`
4. **On completion:** Game passes score/props to `VictoryScreen`
5. **VictoryScreen** (`src/components/games/VictoryScreen.jsx`) delegates all logic to `useVictoryState` hook
6. **useVictoryState** (`src/hooks/useVictoryState.js`):
   - Calls `updateExerciseProgress()` (if `exerciseIndex` provided) or `updateNodeProgress()` via `skillProgressService`
   - Awards XP via `awardXP()` only when entire node is complete
   - Records practice via `streakService.recordPractice()`
   - Applies comeback multiplier when active
   - Checks accessory unlocks via `useAccessoryUnlockDetection`
   - Checks boss node unlocks via `useBossUnlockTracking`
   - Invalidates React Query caches: `["student-progress"]`, `["streak-state"]`, `["student-xp"]`, etc.
7. **Next exercise or return:** If multi-exercise node with `exercisesRemaining > 0`, `onNextExercise` callback navigates to next exercise; otherwise "Back to Trail"

**Game Session Flow (Free Play Mode):**
1. User selects game from `/practice-modes` -> mode selector (e.g., `NotesMasterMode`) -> specific game
2. No `location.state` passed; game shows `UnifiedGameSettings` pre-game configuration screen
3. User configures clef, difficulty, timed mode, note selection, etc.
4. Game plays with `node_id: null`; `VictoryScreen` awards free play XP (`calculateFreePlayXP()`) and records practice
5. Score saved to `students_score` with `node_id = NULL` (always passes RLS since `NULL` is free)

**Subscription / Content Gate Flow:**
1. **UI Gate:** `SubscriptionContext` provides `isPremium` globally; `isFreeNode()` from `src/config/subscriptionConfig.js` checks node access in trail UI
2. **TrailNodeModal** checks both `isPremium` and `isFreeNode(nodeId)` before allowing game start; shows paywall/upgrade prompt for locked nodes
3. **DB Gate:** RLS policies on `students_score` and `student_skill_progress` enforce `is_free_node(node_id) OR has_active_subscription(auth.uid())`; `node_id = NULL` (free play) always passes
4. **Realtime updates:** `SubscriptionContext` subscribes to `postgres_changes` on `parent_subscriptions` table; instant premium unlock reflected in UI

**State Management Strategy:**
- **React Query** (primary for all server state): User auth (`["user"]`), student progress (`["student-progress"]`), streak (`["streak-state"]`), subscription (`["subscription"]`), XP (`["student-xp"]`), daily goals, scores, accessories, weekly progress
- **React Context** (feature-scoped UI state): Accessibility settings, user preferences, sight reading session, subscription status cache, session timeout, modal state
- **Redux** (legacy, single slice): `src/store.js` with `rhythmReducer` only -- manages rhythm composition state (selected rhythms, time signature, bars). Not used by other game types.
- **Local component state** (ephemeral game state): Each game manages its own state machine internally (combo count, lives, current question, feedback animations)
- **location.state** (navigation params): Trail mode passes `{ nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }` between trail and game components

## Key Abstractions

**Trail Node:**
- Purpose: Represents a single learnable skill unit in the piano learning journey
- Examples: `src/data/units/trebleUnit1Redesigned.js`, `src/data/units/rhythmUnit7Redesigned.js`
- Pattern: Static data objects with `{ id, name, category, order, prerequisites, skills, exercises[], xpReward, isBoss }`
- Each exercise has `{ type, config: { notePool, questionCount, clef, ... } }`
- Lookup: `src/data/skillTrail.js` provides `getNodeById()`, `getNodesByCategory()`, `isNodeUnlocked()`, `getUnlockedNodes()`

**Game Component:**
- Purpose: Self-contained game with settings, gameplay loop, and completion flow
- Examples: `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (2827 lines), `src/components/games/sight-reading-game/SightReadingGame.jsx` (3747 lines)
- Pattern: Large monolithic components with internal state machines; auto-start from trail via `location.state` + `hasAutoStartedRef`; delegate to shared `VictoryScreen`/`GameOverScreen`
- Integration points: Accept `nodeId`, `nodeConfig`, `exerciseIndex` via `location.state`; callback to `onNextExercise` or `onNextTrailExercise`

**Service Module:**
- Purpose: Encapsulated Supabase queries with authorization checks
- Examples: `src/services/skillProgressService.js`, `src/services/streakService.js`
- Pattern: Exported async functions that call `verifyStudentDataAccess()` before DB operations, return data or throw. Services import the singleton `supabase` client from `src/services/supabase.js`.

**Context Provider:**
- Purpose: Feature-scoped state shared across component subtree
- Examples: `src/contexts/SubscriptionContext.jsx`, `src/contexts/AccessibilityContext.jsx`
- Pattern: `createContext()` + Provider component + custom `useXxx()` hook with "must be used within Provider" guard. ESLint suppress comment for `react-refresh/only-export-components` is standard.

**Dashboard Card:**
- Purpose: Self-contained widget for the student dashboard
- Examples: `src/components/dashboard/DailyGoalsCard.jsx`, `src/components/dashboard/XPProgressCard.jsx`
- Pattern: Each card fetches its own data (via React Query or props from parent), renders within the glassmorphism card pattern

## Entry Points

**Application Entry:**
- Location: `src/main.jsx`
- Triggers: Browser loads `index.html` which loads Vite-bundled JS
- Responsibilities: Self-hosted font imports (8 font families for COPPA compliance -- no Google Fonts CDN), Redux store setup, BrowserRouter, Sentry initialization, PWA initialization (service worker registration, fullscreen, orientation lock), renders `<App />`

**App Root:**
- Location: `src/App.jsx` (489 lines)
- Triggers: Rendered by `main.jsx`
- Responsibilities: QueryClient configuration, full provider hierarchy, route definitions (with lazy-loaded pages and games), auth state change listener, service worker message handler, dashboard reminder initialization, orientation controller, HTML lang/dir management

**Supabase Edge Functions:**
- Location: `supabase/functions/*/index.ts`
- Triggers: HTTP requests (webhooks from Lemon Squeezy, cron jobs for push/email, client API calls)
- Responsibilities: Checkout creation, subscription lifecycle management, push notifications, consent emails, weekly reports, account deletion processing, feedback submission

**Service Worker:**
- Location: `public/sw.js`
- Triggers: Network requests, push events, notification clicks
- Responsibilities: Cache management (`pianomaster-v8` main cache, `pianomaster-accessories-v2` accessory cache), static asset cache-first strategy, navigation network-first with offline fallback, auth/REST API never-cached, push notification display

## Routing Architecture

Routes are defined in `src/App.jsx` `AppRoutes` component. All pages except public routes are lazy-loaded.

**Layout Route** (`/` with `<AppLayout />`):
- All protected pages render inside `AppLayout` which provides sidebar, header, mobile tabs
- `AppLayout` hides chrome (sidebar, header, tabs) for game routes and trail page

**Public Routes** (no auth required):
- `/login` - `LoginForm`
- `/reset-password` - `ResetPasswordPage`
- `/consent/verify` - `ConsentVerifyPage` (parent email verification)
- `/privacy` - `PrivacyPolicyPage`
- `/terms` - `TermsOfServicePage`

**Protected Student Routes:**
- `/` - Student dashboard (teachers redirect to `/teacher`)
- `/trail` - Full-viewport skill trail map overlay
- `/practice-modes` - Free practice game selection
- `/practice-sessions` - Recording and playback
- `/achievements` - Achievement badges
- `/settings` - App settings
- `/subscribe`, `/subscribe/success` - Subscription purchase flow
- `/parent-portal` - Parent subscription management
- `/avatars` - Avatar customization

**Game Routes** (hide sidebar/header for distraction-free gameplay):
- `/notes-master-mode` - Notes game type selector
- `/notes-master-mode/memory-game` - Memory card game
- `/notes-master-mode/notes-recognition-game` - Note identification (wrapped in `AudioContextProvider`)
- `/notes-master-mode/sight-reading-game` - Sight reading (wrapped in `AudioContextProvider`)
- `/rhythm-mode` - Rhythm game type selector
- `/rhythm-mode/metronome-trainer` - Rhythm training (wrapped in `AudioContextProvider`)

**Teacher Routes:**
- `/teacher/*` - `TeacherDashboard` handles sub-routing internally

## Error Handling

**Strategy:** Mixed -- services throw, components catch and display via toast/overlay

**Patterns:**
- Services throw errors after logging to console; callers catch and show `toast.error()` via react-hot-toast
- Authorization failures throw immediately with descriptive messages (defense-in-depth)
- Network errors in `useUser` use circuit breaker pattern: no retry on `Failed to fetch` / network errors, single retry with exponential backoff for others
- Token refresh failures (`TOKEN_REFRESH_FAILED` event) trigger auto-signout to prevent repeated 400 errors
- Audio errors show full-screen overlays: `MicErrorOverlay` for permission issues, `AudioInterruptedOverlay` for iOS audio interruptions
- Rate limiting via `src/services/rateLimitService.js` returns structured status; UI shows `RateLimitBanner`
- Top-level `ErrorBoundary` (`src/components/ErrorBoundary.jsx`) catches unhandled render errors
- Sentry captures unhandled exceptions in production (initialized in `src/main.jsx` via `src/services/sentryService.js`)

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error`/`console.warn` directly. No structured logging framework. Debug logging gated behind `process.env.NODE_ENV === 'development'` or local `DEBUG` flags in some modules.

**Validation:** No formal validation library. Input validation is inline in service functions (e.g., `verifyStudentDataAccess()`, rate limit checks, star calculation range checks). Database constraints and RLS policies serve as ground truth.

**Authentication:** Supabase Auth with PKCE flow. Role determined by database table membership (`students` table with `role` column), NOT JWT metadata. `useUser()` hook is the single source of truth for auth state. Every service function calls `verifyStudentDataAccess()` as a client-side supplement to RLS.

**Authorization (Defense-in-Depth):**
1. Client-side: `verifyStudentDataAccess()` in `src/services/authorizationUtils.js` checks ownership or teacher-student connection before every DB operation
2. Database: RLS policies on every table with `auth.uid()` verification; helper functions `is_free_node()` and `has_active_subscription()` for content gating
3. UI: `isFreeNode()` from `src/config/subscriptionConfig.js` for fast paywall display; `SubscriptionContext` for premium status

**Internationalization:** i18next with `en` (English) and `he` (Hebrew) locales. Two namespaces: `common` and `trail`. RTL support via `i18n.dir()`. Hebrew font family (`font-hebrew`: Heebo + Assistant) applied automatically. Language detection: localStorage -> navigator -> htmlTag.

**Accessibility:** `AccessibilityContext` provides: high contrast, reduced motion, font size (4 levels), sound volume, keyboard navigation, focus visible, large targets, simplified UI, extended timeouts, screen reader optimization. `useMotionTokens()` hook returns motion-safe framer-motion presets. Toast durations extended when `extendedTimeouts` is active.

**Offline/PWA:** Service worker (`public/sw.js`) with:
- Cache-first for `/assets/*` (safe due to Vite content-hashing)
- Network-first for navigation (ensures latest `index.html` after deploy), offline fallback page
- Network-first for API with cache fallback
- NEVER cache Supabase `/rest/` endpoints or auth endpoints (security)
- Push notification handling (`push` and `notificationclick` events)
- Accessory images cached in separate `pianomaster-accessories-v2` cache

**COPPA Compliance:** Parent gate (two-digit math problem) before push notification opt-in. COPPA consent email flow for new student accounts. Self-hosted fonts (no Google Fonts CDN tracking). PII minimization. Data export capability.

---

*Architecture analysis: 2026-03-23*
