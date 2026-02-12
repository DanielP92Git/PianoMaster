# Codebase Structure

**Analysis Date:** 2026-01-31

## Directory Layout

```
PianoApp2/
├── src/
│   ├── App.jsx                  # Root app component with routing and providers
│   ├── main.jsx                 # Entry point, service worker registration
│   ├── index.css                # Global Tailwind styles
│   ├── store.js                 # Redux store (minimal, only for rhythm)
│   │
│   ├── pages/                   # Routed page components
│   │   ├── TrailMapPage.jsx     # Full-viewport skill trail map
│   │   ├── Dashboard.jsx        # Student/teacher home (moved to layout/)
│   │   ├── PracticeModes.jsx    # Game mode selection
│   │   ├── PracticeSessions.jsx # Recording and playback
│   │   ├── Achievements.jsx     # Achievement display
│   │   ├── StudentAssignments.jsx  # Teacher assignment viewing
│   │   ├── AppSettings.jsx      # User settings
│   │   └── Legal.jsx            # Legal/privacy pages
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx       # Main layout wrapper (sidebar, header, outlet)
│   │   │   ├── Dashboard.jsx       # Student dashboard (hero, goals, streak)
│   │   │   ├── TeacherDashboard.jsx  # Teacher portal
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   ├── Header.jsx          # Top header bar
│   │   │   └── MobileTabsNav.jsx   # Mobile tab navigation
│   │   │
│   │   ├── games/
│   │   │   ├── VictoryScreen.jsx   # Game results (stars, XP, achievements)
│   │   │   ├── GameModeGrid.jsx    # Game selection UI
│   │   │   │
│   │   │   ├── notes-master-games/
│   │   │   │   ├── MemoryGame.jsx                # Note memory matching
│   │   │   │   ├── NotesRecognitionGame.jsx      # Identify notes by sound/image
│   │   │   │   └── NoteImageDisplay.jsx          # Shared note rendering
│   │   │   │
│   │   │   ├── sight-reading-game/
│   │   │   │   ├── SightReadingGame.jsx          # VexFlow-based note reading
│   │   │   │   ├── components/
│   │   │   │   │   ├── SightReadingLayoutHarness.jsx  # Debug harness
│   │   │   │   │   └── [other sight reading UI]
│   │   │   │   ├── utils/
│   │   │   │   │   ├── patternBuilder.js        # Pattern generation logic
│   │   │   │   │   ├── rhythmGenerator.js       # Rhythm generation
│   │   │   │   │   └── [test files]
│   │   │   │   └── hooks/
│   │   │   │       └── [sight reading specific hooks]
│   │   │   │
│   │   │   ├── rhythm-games/
│   │   │   │   ├── MetronomeTrainer.jsx         # Rhythm practice with metronome
│   │   │   │   └── components/
│   │   │   │       └── [rhythm UI components]
│   │   │   │
│   │   │   └── shared/
│   │   │       └── UnifiedGameSettings.jsx      # Shared settings modal
│   │   │
│   │   ├── trail/
│   │   │   ├── TrailMap.jsx       # Visual trail map with wavy paths
│   │   │   ├── TrailNode.jsx      # Individual node UI (locked/available/mastered)
│   │   │   └── TrailNodeModal.jsx # Node details and exercise list
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DailyGoalsCard.jsx # 3 daily goals with progress bars
│   │   │   └── [dashboard widgets]
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx      # Student/teacher login
│   │   │   ├── RoleSelection.jsx  # Choose student or teacher
│   │   │   └── [auth components]
│   │   │
│   │   ├── ui/
│   │   │   ├── ProtectedRoute.jsx       # Auth guard wrapper
│   │   │   ├── AudioRecorder.jsx        # Mic recording UI
│   │   │   ├── AudioPlayer.jsx          # Audio playback
│   │   │   ├── AnimatedAvatar.jsx       # User avatar with accessories
│   │   │   ├── AccessoryUnlockModal.jsx # Accessory unlock animation
│   │   │   ├── AlarmModal.jsx           # Reminder alarm UI
│   │   │   └── [other UI components]
│   │   │
│   │   ├── pwa/
│   │   │   ├── PWAInstallPrompt.jsx           # Install prompt (Android)
│   │   │   ├── IOSInstallPrompt.jsx          # Add to home screen (iOS)
│   │   │   ├── PWAUpdateNotification.jsx     # New version available
│   │   │   ├── NetworkStatus.jsx             # Offline indicator
│   │   │   ├── IOSLandscapeTipModal.jsx      # Landscape mode hint
│   │   │   └── [other PWA features]
│   │   │
│   │   ├── animations/
│   │   │   └── [Framer Motion animation components]
│   │   │
│   │   └── [other component directories]
│   │
│   ├── contexts/
│   │   ├── AccessibilityContext.jsx      # a11y settings (contrast, motion, timeouts)
│   │   ├── SettingsContext.jsx           # User preferences
│   │   ├── SightReadingSessionContext.jsx # Active sight reading game state
│   │   └── ModalContext.jsx              # Global modal/dialog state
│   │
│   ├── services/
│   │   ├── supabase.js                    # Supabase client singleton
│   │   ├── skillProgressService.js        # Trail node progress CRUD
│   │   ├── dailyGoalsService.js           # Daily goals generation
│   │   ├── apiAuth.js                     # Authentication operations
│   │   ├── apiDatabase.js                 # Core data queries
│   │   ├── apiTeacher.js                  # Teacher operations
│   │   ├── apiScores.js                   # Score recording
│   │   ├── achievementService.js          # Achievement logic
│   │   ├── streakService.js               # Daily streaks
│   │   ├── practiceService.js             # Practice sessions
│   │   ├── reminderService.js             # Game reminders
│   │   ├── dashboardReminderService.js    # Dashboard alarms
│   │   ├── audioCompressionService.js     # Audio codec handling
│   │   ├── audioCacheService.js           # Audio caching
│   │   ├── profileService.js              # Profile operations
│   │   ├── apiSettings.js                 # Settings operations
│   │   └── [other domain services]
│   │
│   ├── data/
│   │   ├── skillTrail.js          # Node definitions (90+ nodes, units, helpers)
│   │   ├── constants.js            # NODE_CATEGORIES, EXERCISE_TYPES
│   │   ├── nodeTypes.js            # Node type visual mappings
│   │   ├── expandedNodes.js        # Extended node configurations
│   │   ├── trailSections.js        # Trail section definitions
│   │   └── units/                  # Unit-specific data files
│   │       └── [unit files]
│   │
│   ├── utils/
│   │   ├── xpSystem.js             # XP levels, calculations, leaderboards
│   │   ├── progressMigration.js    # One-time XP migration
│   │   ├── nodeGenerator.js        # Dynamic node generation
│   │   ├── translateNodeName.js    # i18n node name resolution
│   │   ├── pwa.js                  # PWA initialization, fullscreen, orientation
│   │   ├── pwaDetection.js         # Device detection (iOS, standalone)
│   │   ├── avatarAssets.js         # Avatar image resolution
│   │   ├── points.js               # Point calculations
│   │   ├── accessoryUnlocks.js     # Accessory unlock logic
│   │   ├── resetTrailProgress.js   # Debug trail reset
│   │   ├── useMotionTokens.js      # Motion preference tokens
│   │   └── [other utilities]
│   │
│   ├── hooks/
│   │   ├── useUser.js                        # Auth user state
│   │   ├── usePitchDetection.js              # Mic pitch analysis
│   │   ├── useAudioEngine.js                 # Web Audio API
│   │   ├── useMicNoteInput.js                # Keyboard/mic input
│   │   ├── useKeyboardNavigation.js          # Keyboard handling
│   │   ├── useDatabase.js                    # Generic DB queries
│   │   ├── useRealTimeSubscriptions.js       # Supabase real-time
│   │   ├── useUserProfile.js                 # User profile data
│   │   ├── useAccessories.js                 # Accessory management
│   │   ├── useAccessoryUnlockDetection.js   # Unlock detection
│   │   ├── useStreakWithAchievements.js     # Streak data
│   │   ├── useTotalPoints.js                 # XP/points display
│   │   ├── usePracticeSessionWithAchievements.js  # Session tracking
│   │   ├── useDailyReminder.js               # Reminder notifications
│   │   ├── useGlobalAudioSettings.js         # Audio preferences
│   │   ├── useScreenReader.js                # a11y screen reader
│   │   ├── useDocumentTitle.js               # Dynamic page titles
│   │   ├── useGlobalFullscreenOnFirstTap.js # Fullscreen on first interaction
│   │   ├── useGamesPlayed.js                 # Game count tracking
│   │   ├── useIsMobile.js                    # Mobile detection
│   │   ├── useNewRecordingsCount.js          # Recording count
│   │   └── [other domain hooks]
│   │
│   ├── features/
│   │   ├── authentication/
│   │   │   ├── useUser.js        # Consolidated auth state
│   │   │   ├── useLogin.js       # Login flow
│   │   │   ├── useLogout.js      # Logout flow
│   │   │   ├── useSignup.js      # Registration flow
│   │   │   └── useSocialAuth.js  # Social auth (if enabled)
│   │   │
│   │   ├── userData/
│   │   │   └── useScores.js      # User score data
│   │   │
│   │   └── games/
│   │       └── hooks/
│   │           └── [game-specific hooks]
│   │
│   ├── reducers/
│   │   └── rhythmReducer.jsx      # Redux reducer for rhythm composition state
│   │
│   ├── i18n/
│   │   └── index.js              # i18next configuration
│   │
│   ├── locales/
│   │   ├── en/
│   │   │   ├── common.json       # English common strings
│   │   │   ├── trail.json        # English trail strings
│   │   │   └── [other namespaces]
│   │   └── he/
│   │       ├── common.json       # Hebrew translations (RTL)
│   │       ├── trail.json        # Hebrew trail strings
│   │       └── [other namespaces]
│   │
│   ├── assets/
│   │   ├── icons/              # Small icon images
│   │   ├── images/             # Hero/background images (WebP)
│   │   ├── avatars/            # Avatar images
│   │   ├── noteImages/         # Note display images
│   │   ├── musicSymbols/       # Music notation symbols
│   │   └── sounds/
│   │       └── piano/          # Piano note audio files (WAV)
│   │
│   ├── test/
│   │   └── setupTests.js        # Vitest configuration
│   │
│   └── types/
│       └── [TypeScript type definitions]
│
├── public/
│   ├── sw.js                    # Service worker with caching strategies
│   ├── manifest.json            # PWA manifest
│   ├── index.html               # HTML entry point
│   └── [static assets]
│
├── supabase/
│   └── migrations/              # Database schema migrations
│       ├── 20260125000001_add_exercise_progress.sql
│       ├── 20260129000002_add_unit_tracking.sql
│       └── [other migrations]
│
├── docs/                        # Documentation
│   ├── DESIGN_SYSTEM.md
│   ├── vexflow-notation/
│   └── [other guides]
│
├── vite.config.js              # Vite build configuration
├── package.json                # Dependencies and scripts
├── .eslintrc.js                # ESLint rules
├── .prettierrc                 # Prettier formatting
└── CLAUDE.md                   # Claude Code instructions
```

## Directory Purposes

**src/pages/:**
- Purpose: Routed page components that fill the main outlet
- Contains: Full-page views (trail, settings, achievements, practice modes)
- Key files: `TrailMapPage.jsx` (full-viewport), `PracticeModes.jsx` (game selection)

**src/components/:**
- Purpose: Reusable and page-specific React components
- Contains: Layout (header, sidebar), games (all game UIs), UI utilities, PWA features
- Key files: `VictoryScreen.jsx` (post-game), `TrailMap.jsx` (trail visualization)

**src/contexts/:**
- Purpose: React Context providers for feature-scoped state
- Contains: Accessibility (a11y settings), Settings (user prefs), SightReading (game state), Modal (dialogs)
- Pattern: Each context exports provider component and custom hook (useAccessibility, useSettings, etc.)

**src/services/:**
- Purpose: Business logic, API calls, Supabase interactions
- Contains: CRUD operations (skillProgressService, dailyGoalsService), auth flows, notification services
- Pattern: Services export named functions, no classes, no React dependencies

**src/data/:**
- Purpose: Static data definitions and constants
- Contains: Skill node definitions (90+ nodes), exercise types, unit metadata, category definitions
- Pattern: Constants first, no dependencies, exported as arrays/objects

**src/utils/:**
- Purpose: Pure utility functions and calculations
- Contains: XP calculations, PWA initialization, avatar resolution, node generation
- Pattern: Stateless functions, no side effects except where necessary (pwa.js)

**src/hooks/:**
- Purpose: Custom React hooks for reusable component logic
- Contains: Micro-hooks for features (audio, pitch, profile), integration hooks (database, realtime)
- Pattern: useX naming, internal state/effects, export hook and dependencies

**src/features/:**
- Purpose: Feature-scoped hooks and logic
- Organization: authentication/, userData/, games/ - each with custom hooks
- Pattern: Logical grouping of related hooks per feature domain

**src/reducers/:**
- Purpose: Redux reducers (minimal usage)
- Contains: Only rhythm composition state (RhythmProvider context wrapper)
- Pattern: Reducer function + context provider + custom hooks

**src/i18n/ & src/locales/:**
- Purpose: Internationalization setup and translations
- Setup: i18next configuration in i18n/index.js
- Translations: Nested JSON in locales/en/ and locales/he/ (RTL support)

**src/assets/:**
- Purpose: Static media files
- Organization: icons/ (small), images/ (hero WebP), noteImages/ (note visuals), sounds/piano/ (audio)
- Pattern: Reference by path, optimize images with WebP

**public/:**
- Purpose: Static files served directly, PWA configuration
- Key files: sw.js (service worker), manifest.json (PWA metadata), index.html (app shell)

**supabase/:**
- Purpose: Database schema and migration scripts
- Contains: SQL migrations with version timestamps
- Pattern: One change per migration file, idempotent operations

## Key File Locations

**Entry Points:**
- `src/main.jsx`: Service worker registration, i18n init, orientation lock, React root creation
- `src/App.jsx`: Providers (Query, Accessibility, Settings, Modal, Rhythm, SightReading), route structure, auth listeners
- `public/index.html`: App shell with root div, manifest link, theme color meta

**Configuration:**
- `vite.config.js`: Dev server (port 5174), Vite plugins (React, SVGR)
- `package.json`: Dependencies (React 18, Vite 6, Supabase, TanStack Query, i18next, VexFlow)
- `CLAUDE.md`: Claude Code guidance (build commands, architecture overview, security patterns)

**Core Logic:**
- `src/App.jsx`: Root app, routing, provider nesting
- `src/components/layout/AppLayout.jsx`: Main layout with sidebar/header conditional hiding
- `src/components/games/VictoryScreen.jsx`: Post-game state management, XP awarding, trail integration
- `src/services/skillProgressService.js`: Node progress tracking, exercise completion
- `src/utils/xpSystem.js`: XP thresholds, level calculations, leaderboard logic
- `src/data/skillTrail.js`: All 90+ skill node definitions, helpers, prerequisites

**Testing:**
- `src/test/setupTests.js`: Vitest JSDOM setup, global mocks
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js`: Pattern generation tests
- `src/components/games/sight-reading-game/utils/rhythmGenerator.test.js`: Rhythm generation tests

**Styling:**
- `src/index.css`: Global Tailwind directives, custom utilities, design system tokens
- Cards: `.card`, `.card-hover`, `.card-compact`, `.card-elevated` (migrated from glassmorphism)

## Naming Conventions

**Files:**
- Components: `PascalCase.jsx` (MemoryGame.jsx, TrailNode.jsx)
- Hooks: `useXxx.js` (useUser.js, usePitchDetection.js)
- Services: `xxxService.js` (skillProgressService.js, dailyGoalsService.js)
- Utilities: `xxx.js` (xpSystem.js, nodeGenerator.js)
- Constants/Data: `xxxConstants.js` or `xxx.js` (constants.js, skillTrail.js)

**Directories:**
- Feature domains: `lowercase-with-hyphens` (notes-master-games/, sight-reading-game/)
- Utilities: `lowercase-with-hyphens` (pwa.js is exception - filename, not dir)
- Contexts: `XxxContext.jsx` matching hook `useXxx()`

**Functions:**
- Hooks: `useXxx()`
- Service functions: `camelCase()` (getNodeProgress, updateNodeProgress, awardXP)
- Utilities: `camelCase()` (calculateLevel, translateNodeName)
- Component handlers: `handleXxx()` or `onXxx()`

**Variables:**
- Boolean: `isXxx`, `hasXxx`, `canXxx` (isTeacher, hasNodes, canUnlock)
- Refs: `xxxRef` (lastRoleRef, dismissedKeyRef)
- State: `camelCase` (selectedRhythms, timeSignature)

**Constants:**
- Uppercase with underscores (XP_LEVELS, NODE_CATEGORIES, EXERCISE_TYPES)
- Objects as UPPER_SNAKE_CASE (SKILL_NODES, XP_REWARDS)

## Where to Add New Code

**New Feature (Game Type):**
- Game component: `src/components/games/[feature-name]/[FeatureName].jsx`
- Game-specific hooks: `src/hooks/use[Feature].js` or `src/features/games/hooks/`
- Game settings: Integrate with `src/components/games/shared/UnifiedGameSettings.jsx`
- Route: Add to `src/App.jsx` under game routes
- Integration: Wire VictoryScreen with trail support (nodeId, exerciseIndex, totalExercises, exerciseType)

**New Trail Node:**
- Add to `SKILL_NODES` array in `src/data/skillTrail.js`
- Define exercises array with type and config
- Set prerequisites to control unlock order
- Assign xpReward value
- Mark isBoss: true for challenge nodes
- Re-export from data helpers (getNodeById, etc.)

**New Service/API:**
- Create `src/services/xxxService.js`
- Export named functions, no default export
- Import supabase and other services as needed
- Add error handling with try-catch
- Create custom hook in `src/features/` or `src/hooks/` to consume service

**New Context (Feature State):**
- Create `src/contexts/XxxContext.jsx`
- Export provider component and custom hook (useXxx)
- Include validation with provider check in hook
- Wrap in App.jsx with other providers
- Use context for feature-scoped state only (not global)

**New Utility Function:**
- Location: `src/utils/xxx.js`
- Pure functions preferred (no side effects)
- Export named functions
- Add JSDoc comments for complex logic
- Create tests alongside

**New Page/Route:**
- Component: `src/pages/XxxPage.jsx`
- Route: Add Route in App.jsx → AppLayout children
- Layout: Inherits AppLayout (sidebar, header)
- Full-viewport pages: Use `fixed inset-0 overflow-y-auto` pattern (see TrailMapPage)

**New Accessibility Feature:**
- Add setting to `src/contexts/AccessibilityContext.jsx`
- Export hook `useAccessibility()` if not existing
- Consume in components: `const { feature } = useAccessibility()`
- Apply conditional rendering/styling based on setting

## Special Directories

**src/components/games/sight-reading-game/:**
- Purpose: VexFlow-based music notation reading game
- Generated: No, all hand-coded
- Committed: Yes
- Key files: SightReadingGame.jsx (main), utils/ (pattern/rhythm generation), hooks/ (game-specific)
- Pattern: One Stave per measure, SVG backend, automatic beaming with Beam.generateBeams()

**src/components/games/shared/:**
- Purpose: Shared game utilities and components
- Contains: UnifiedGameSettings.jsx (modal for game configuration)
- Pattern: Game components import and use settings modal

**src/reducers/:**
- Purpose: Redux state (minimal)
- Contains: Only rhythmReducer.jsx for composition state
- Pattern: RhythmProvider wraps in App.jsx, useRhythm() and useRhythmDispatch() for access

**public/:**
- Purpose: Static files served directly by Vite
- Key files: sw.js (service worker), manifest.json (PWA), index.html (app shell)
- Service Worker: Cache versioning via pianomaster-v2 constant, auth endpoint exclusion

**supabase/migrations/:**
- Purpose: Database schema evolution
- Pattern: Timestamp-versioned SQL files, idempotent (IF NOT EXISTS)
- Typical changes: Table creation, RLS policies, function definitions, column additions

