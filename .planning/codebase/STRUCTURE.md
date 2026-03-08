# Codebase Structure

**Analysis Date:** 2026-03-08

## Directory Layout

```
PianoApp2/
├── public/                     # Static assets served as-is
│   ├── accessories/            # Avatar accessory images
│   ├── audio/                  # Audio sample files
│   ├── avatars/                # Avatar images and Beethoven animation frames
│   ├── data/                   # Static data files
│   ├── icons/                  # PWA icons (various sizes)
│   ├── images/                 # Hero images (PNG + WebP), backgrounds
│   ├── sounds/                 # Sound effects and piano samples
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── offline.html            # Offline fallback page
├── src/
│   ├── assets/                 # Imported static assets (bundled by Vite)
│   │   ├── avatars/            # Avatar image imports
│   │   ├── icons/              # UI icon assets
│   │   ├── images/             # Bundled images (victory-background.webp, etc.)
│   │   ├── musicSymbols/       # Music notation symbol images
│   │   ├── noteImages/         # Note images organized by clef and accidental
│   │   └── sounds/             # Sound assets (piano samples)
│   ├── components/             # React components by domain
│   │   ├── animations/         # Firework animation effect
│   │   ├── auth/               # Login, signup, role selection, consent
│   │   ├── celebrations/       # Boss unlock modal, confetti
│   │   ├── charts/             # Analytics charts (teacher dashboard)
│   │   ├── dashboard/          # Dashboard cards (daily goals, XP, stats, push opt-in)
│   │   ├── games/              # Game implementations (see Game Components below)
│   │   ├── layout/             # AppLayout, Dashboard, TeacherDashboard, Header, Sidebar
│   │   ├── orientation/        # RotatePromptOverlay for mobile landscape
│   │   ├── pwa/                # PWA install prompts, update notification, network status
│   │   ├── settings/           # Settings UI components (profile, notifications, toggles)
│   │   ├── streak/             # StreakDisplay with freeze/grace/comeback UI
│   │   ├── student/            # (empty directory)
│   │   ├── teacher/            # Teacher-specific components (assignments, recordings, data export)
│   │   ├── trail/              # Trail map components (TrailMap, TrailNode, TrailNodeModal)
│   │   └── ui/                 # Shared UI primitives (Button, Card, Modal, Toast, etc.)
│   ├── config/                 # App configuration
│   │   └── subscriptionConfig.js  # Free tier node IDs, isFreeNode() gate
│   ├── contexts/               # React Context providers
│   ├── data/                   # Static data definitions
│   │   ├── units/              # Trail node definitions (12 unit files)
│   │   ├── constants.js        # NODE_CATEGORIES, EXERCISE_TYPES
│   │   ├── expandedNodes.js    # Aggregated node exports
│   │   ├── nodeTypes.js        # Node type definitions
│   │   └── skillTrail.js       # Main trail API (SKILL_NODES, lookups)
│   ├── features/               # Feature-scoped hooks
│   │   ├── authentication/     # useUser, useLogin, useLogout, useSignup, useSocialAuth
│   │   ├── games/hooks/        # useGameProgress, useGameSettings, useGameTimer, useSounds
│   │   └── userData/           # useScores
│   ├── hooks/                  # Shared custom hooks
│   ├── i18n/                   # i18next configuration
│   │   └── index.js            # i18n init with language detector
│   ├── locales/                # Translation files
│   │   ├── en/                 # English (common.json, trail.json)
│   │   └── he/                 # Hebrew (common.json, trail.json)
│   ├── pages/                  # Route-level page components
│   ├── reducers/               # Redux reducers
│   │   └── rhythmReducer.jsx   # Only Redux slice (rhythm composition)
│   ├── services/               # API calls and business logic
│   ├── store.js                # Redux store (single reducer)
│   ├── styles/                 # Additional CSS
│   │   └── trail-effects.css   # Trail-specific animations
│   ├── test/                   # Test setup
│   │   └── setupTests.js       # Vitest JSDOM setup
│   ├── types/                  # TypeScript type definitions
│   │   └── database.ts         # Supabase database types
│   ├── ui/                     # Legacy UI components (ProtectedRoute, Spinner)
│   ├── utils/                  # Shared utilities
│   ├── App.jsx                 # Root component (providers, routes, auth listener)
│   ├── index.css               # Global CSS (Tailwind, card classes, animations)
│   └── main.jsx                # Application entry point
├── supabase/
│   ├── functions/              # Supabase Edge Functions (Deno/TypeScript)
│   │   ├── cancel-subscription/   # Cancel via Lemon Squeezy API
│   │   ├── create-checkout/       # Create Lemon Squeezy checkout URL
│   │   ├── lemon-squeezy-webhook/ # Webhook handler with signature verification
│   │   ├── send-consent-email/    # COPPA consent email sender
│   │   ├── send-daily-push/       # Cron-triggered push notifications
│   │   ├── send-weekly-report/    # Weekly progress report emails
│   │   └── unsubscribe-weekly-report/ # Email unsubscribe handler
│   ├── migrations/             # SQL migrations (90+ files, chronological)
│   └── config.toml             # Supabase local dev config
├── scripts/                    # Development and validation scripts
│   ├── patternVerifier.mjs     # Validate rhythm pattern definitions
│   ├── validateTrail.mjs       # Validate trail node definitions
│   └── verify-teacher-points.mjs  # Verify teacher XP access
├── docs/                       # Documentation
│   ├── DESIGN_SYSTEM.md        # Design system reference
│   ├── tests/                  # Test documentation
│   └── vexflow-notation/       # VexFlow implementation guide
├── CLAUDE.md                   # AI assistant instructions (45KB)
├── index.html                  # HTML entry point with preload hints
├── vite.config.js              # Vite build configuration
├── vitest.config.js            # Vitest test configuration
├── tailwind.config.js          # Tailwind CSS configuration (13KB, custom theme)
├── eslint.config.js            # ESLint flat config
├── postcss.config.js           # PostCSS configuration
├── netlify.toml                # Netlify deployment config
├── vercel.json                 # Vercel deployment config
└── package.json                # Dependencies and scripts
```

## Game Components Detail

```
src/components/games/
├── GameModeGrid.jsx                      # Game type selection grid
├── GameOverScreen.jsx                    # Game over screen (3 variants)
├── VictoryScreen.jsx                     # Post-game victory with XP/stars
├── NotesMasterMode.jsx                   # Notes game mode selector
├── RhythmMasterMode.jsx                  # Rhythm game mode selector
├── notes-master-games/
│   ├── NotesRecognitionGame.jsx          # 105KB - Note identification game
│   ├── MemoryGame.jsx                    # 41KB - Card-matching note pairs
│   └── NoteImageDisplay.jsx             # Note image rendering helper
├── rhythm-games/
│   ├── MetronomeTrainer.jsx             # 49KB - Rhythm training game
│   ├── RhythmPatternGenerator.js        # Pattern generation logic
│   └── components/                      # Sub-components (GameControls, MetronomeDisplay, etc.)
├── shared/
│   ├── UnifiedGameSettings.jsx          # 87KB - Settings modal for all games
│   ├── AudioInterruptedOverlay.jsx      # iOS audio interruption recovery
│   └── noteSelectionUtils.js            # Note pool selection logic
└── sight-reading-game/
    ├── SightReadingGame.jsx             # 136KB - Sheet music reading game
    ├── components/                      # Sub-components (VexFlowStaffDisplay, KlavierKeyboard, etc.)
    ├── constants/                       # Game settings, note definitions, timing
    ├── hooks/                           # Pattern generation, rhythm playback, timing analysis
    └── utils/                           # Pattern builder, rhythm generator, score calculator
```

## Directory Purposes

**`src/components/games/`:**
- Purpose: All game type implementations
- Contains: Four game types (NotesRecognition, Memory, SightReading, MetronomeTrainer), shared components (VictoryScreen, GameOverScreen, UnifiedGameSettings)
- Key pattern: Each game is a large monolithic component with internal state machine. Games accept trail state via `location.state` for auto-start.

**`src/services/`:**
- Purpose: All Supabase API calls and business logic
- Contains: Domain services (auth, scores, progress, streak, goals, subscription, notifications)
- Key pattern: Each service imports `supabase` client, calls `verifyStudentDataAccess()` for authorization, exports async functions

**`src/hooks/`:**
- Purpose: Shared custom hooks used across multiple components
- Contains: Audio hooks, pitch detection, platform detection, game orchestration
- Key pattern: Hooks named `use*.js`, some have companion markdown documentation files

**`src/features/`:**
- Purpose: Feature-scoped hooks grouped by domain
- Contains: Three domains: `authentication/`, `games/hooks/`, `userData/`
- Key pattern: Feature hooks re-exported from feature directories, used by components

**`src/contexts/`:**
- Purpose: React Context providers with associated hooks
- Contains: 7 providers (Accessibility, Settings, SessionTimeout, Modal, SightReadingSession, Subscription, AudioContext)
- Key pattern: Each file exports `XxxProvider` component and `useXxx()` hook

**`src/data/`:**
- Purpose: Static game content definitions
- Contains: Trail node data (93 nodes across 12 unit files), constants, lookup functions
- Key pattern: Unit files export arrays of node objects; `skillTrail.js` re-exports with lookup utilities

**`src/locales/`:**
- Purpose: i18n translation JSON files
- Contains: `en/` and `he/` with `common.json` (53-64KB) and `trail.json` (14-18KB)
- Key pattern: Deeply nested JSON objects accessed via dot notation (e.g., `t('pages.settings.title')`)

**`supabase/functions/`:**
- Purpose: Serverless edge functions (Deno runtime)
- Contains: 7 functions for checkout, webhooks, notifications, email, reports
- Key pattern: Each function has its own directory with `index.ts`; webhook function has `lib/` subdirectory for helpers

**`supabase/migrations/`:**
- Purpose: Database schema evolution with RLS policies
- Contains: 90+ SQL migration files, chronologically ordered
- Key pattern: Files named `YYYYMMDDHHMMSS_description.sql`; contain CREATE TABLE, CREATE POLICY, CREATE FUNCTION statements

## Key File Locations

**Entry Points:**
- `src/main.jsx`: Application bootstrap (font imports, Redux, router, PWA init)
- `src/App.jsx`: Root component (providers, routes, auth listener, 462 lines)
- `index.html`: HTML shell with preload hints and meta tags
- `public/sw.js`: Service worker entry

**Configuration:**
- `vite.config.js`: Vite build config
- `vitest.config.js`: Test runner config
- `tailwind.config.js`: Tailwind theme (13KB with custom design tokens)
- `eslint.config.js`: ESLint flat config
- `src/config/subscriptionConfig.js`: Free tier boundary (must sync with Postgres `is_free_node()`)
- `src/i18n/index.js`: i18next initialization

**Core Logic:**
- `src/services/skillProgressService.js`: Trail progress CRUD (22KB)
- `src/services/streakService.js`: Streak protection logic (22KB)
- `src/utils/xpSystem.js`: XP calculations and level thresholds (13KB)
- `src/data/skillTrail.js`: Trail node API and lookups (9KB)
- `src/hooks/useVictoryState.js`: Victory orchestration (24KB)

**Database:**
- `src/services/supabase.js`: Supabase client singleton
- `src/types/database.ts`: TypeScript database types (17KB)
- `src/services/authorizationUtils.js`: Shared authorization checks

**Testing:**
- `src/test/setupTests.js`: Vitest JSDOM setup
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js`: Pattern tests
- `src/components/games/sight-reading-game/utils/rhythmGenerator.test.js`: Rhythm tests
- `src/utils/xpSystem.test.js`: XP system tests
- `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx`: Mic restart test

## Naming Conventions

**Files:**
- Components: PascalCase with `.jsx` extension (e.g., `TrailNodeModal.jsx`, `DailyGoalsCard.jsx`)
- Hooks: camelCase starting with `use` (e.g., `useVictoryState.js`, `usePitchDetection.js`)
- Services: camelCase (e.g., `skillProgressService.js`, `streakService.js`)
- API services: prefixed with `api` (e.g., `apiAuth.js`, `apiDatabase.js`, `apiTeacher.js`)
- Utils: camelCase (e.g., `xpSystem.js`, `pwaDetection.js`)
- Constants: camelCase (e.g., `constants.js`, `gameSettings.js`)
- CSS: kebab-case (e.g., `trail-effects.css`)
- Tests: same name with `.test.js` or `.test.jsx` suffix
- Trail unit data: camelCase with unit number and `Redesigned` suffix (e.g., `trebleUnit1Redesigned.js`)
- Supabase migrations: `YYYYMMDDHHMMSS_description.sql`
- Edge functions: kebab-case directory names (e.g., `send-daily-push/`)

**Directories:**
- Components: kebab-case for multi-word (e.g., `sight-reading-game/`, `notes-master-games/`)
- Feature directories: camelCase (e.g., `authentication/`, `userData/`)
- Locale directories: ISO 639-1 codes (e.g., `en/`, `he/`)

**Exports:**
- Components: default export (PascalCase function)
- Hooks: named export (`export function useXxx()`)
- Services: named exports (async functions)
- Context: named exports for both Provider and hook

## Where to Add New Code

**New Game Type:**
1. Create component: `src/components/games/{game-name}/GameName.jsx`
2. Add route in `src/App.jsx` (wrap with `<AudioContextProvider>` if audio needed)
3. Add to game route list in `src/components/layout/AppLayout.jsx` `gameRoutes` array
4. Add to landscape routes in `OrientationController` in `src/App.jsx`
5. Add exercise type to `src/data/constants.js` EXERCISE_TYPES
6. Add trail node handling in `src/components/trail/TrailNodeModal.jsx` switch cases
7. Add i18n keys in `src/locales/en/common.json` and `src/locales/he/common.json`

**New Service:**
- Create: `src/services/{serviceName}.js`
- Pattern: Import `supabase` from `./supabase`, import `verifyStudentDataAccess` from `./authorizationUtils`
- Export named async functions

**New Hook:**
- Shared hooks: `src/hooks/use{HookName}.js`
- Feature-scoped hooks: `src/features/{feature}/hooks/use{HookName}.js`
- Game-scoped hooks: `src/components/games/{game}/hooks/use{HookName}.js`

**New Page:**
- Create: `src/pages/{PageName}.jsx`
- Add route in `src/App.jsx` inside the `<Route path="/" element={...}>` layout route
- Add navigation item in `src/components/layout/appNavigationConfig.js` if needed
- Add page title mapping in `src/components/layout/AppLayout.jsx` `getPageTitleKey()`

**New Context Provider:**
- Create: `src/contexts/{FeatureName}Context.jsx`
- Export `{FeatureName}Provider` and `use{FeatureName}()` hook
- Add to provider hierarchy in `src/App.jsx` (position based on dependencies)

**New Trail Unit:**
- Create: `src/data/units/{category}Unit{N}Redesigned.js`
- Import and spread into `src/data/expandedNodes.js`
- Update `UNITS` map in `src/data/skillTrail.js`
- If free tier changes: update `src/config/subscriptionConfig.js` AND Postgres `is_free_node()` function

**New Edge Function:**
- Create: `supabase/functions/{function-name}/index.ts`
- Deploy via `supabase functions deploy {function-name}`

**New Database Migration:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- Include RLS policies for any new tables
- Apply via `supabase db push`

**New Translation Keys:**
- Add to `src/locales/en/common.json` (or `trail.json` for trail-specific)
- Add corresponding keys to `src/locales/he/common.json` (or `trail.json`)
- Use namespaced `t()`: `t('section.key')` for common, `t('trail:section.key')` for trail

**New UI Component:**
- Shared/reusable: `src/components/ui/{ComponentName}.jsx`
- Domain-specific: `src/components/{domain}/{ComponentName}.jsx`
- Dashboard card: `src/components/dashboard/{CardName}.jsx`

## Special Directories

**`public/`:**
- Purpose: Static assets served without processing
- Generated: No (manually managed)
- Committed: Yes
- Note: Service worker (`sw.js`) must be at root for scope. Cache version (`pianomaster-v6`) must be bumped for cache refresh.

**`src/assets/`:**
- Purpose: Assets imported by JS/CSS and processed by Vite
- Generated: No
- Committed: Yes
- Note: Images here get hashed filenames in production build

**`dist/`:**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**`supabase/.temp/`:**
- Purpose: Supabase CLI temporary state
- Generated: Yes
- Committed: Partially (project-ref, version files)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No

**`.planning/`:**
- Purpose: GSD workflow planning documents
- Generated: Yes (by GSD commands)
- Committed: Yes

---

*Structure analysis: 2026-03-08*
