# Codebase Structure

**Analysis Date:** 2026-03-23

## Directory Layout

```
PianoApp2/
├── public/                     # Static assets served as-is (not processed by Vite)
│   ├── accessories/            # Avatar accessory images
│   ├── audio/                  # Audio sample files
│   ├── avatars/                # Avatar images, Beethoven animation frames (mp4/webP)
│   ├── data/                   # Static data files
│   ├── icons/                  # PWA icons (96/192/384/512px)
│   ├── images/                 # Hero images (PNG + WebP), backgrounds
│   ├── sounds/                 # Sound effects, piano samples
│   ├── _redirects              # Netlify redirect rules
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (cache v8)
│   └── offline.html            # Offline fallback page
├── src/
│   ├── assets/                 # Imported assets (bundled by Vite, get hashed filenames)
│   │   ├── avatars/parts/      # Avatar part images for customization
│   │   ├── icons/              # UI icon assets (includes large/ subdir)
│   │   ├── images/             # Bundled images (victory-background.webp, etc.)
│   │   ├── musicSymbols/       # Music notation symbol images
│   │   ├── noteImages/         # Note images by clef (treble/, bass/) and accidental (flats/, sharps/)
│   │   └── sounds/piano/       # Piano sound assets (wav, includes untrimmed/temp dirs)
│   ├── components/             # React components organized by domain
│   ├── config/                 # App configuration
│   ├── contexts/               # React Context providers (7 files)
│   ├── data/                   # Static trail node data definitions
│   ├── features/               # Feature-scoped hooks by domain
│   ├── hooks/                  # Shared custom hooks (29 files)
│   ├── i18n/                   # i18next configuration
│   ├── locales/                # Translation JSON files (en/, he/)
│   ├── pages/                  # Route-level page components (16 files)
│   ├── reducers/               # Redux reducers (rhythm only)
│   ├── services/               # API calls and business logic (30 files)
│   ├── styles/                 # Additional CSS beyond index.css
│   ├── test/                   # Test setup
│   ├── types/                  # TypeScript type definitions
│   ├── ui/                     # Legacy UI components (ProtectedRoute, Spinner)
│   ├── utils/                  # Shared utilities (17 files)
│   ├── App.jsx                 # Root component (489 lines)
│   ├── index.css               # Global CSS (Tailwind base, card classes, animations)
│   ├── main.jsx                # Application entry point (font imports, bootstrap)
│   └── store.js                # Redux store (single rhythm reducer)
├── supabase/
│   ├── functions/              # 10 Edge Functions (Deno/TypeScript)
│   ├── migrations/             # 100+ SQL migration files
│   └── config.toml             # Supabase local dev configuration
├── scripts/                    # Development and validation scripts
├── docs/                       # Documentation
├── .planning/                  # GSD workflow planning documents
├── CLAUDE.md                   # AI assistant instructions
├── index.html                  # HTML entry point with preload hints
├── vite.config.js              # Vite build + plugin configuration
├── vitest.config.js            # Vitest test runner configuration
├── tailwind.config.js          # Tailwind CSS configuration (13KB custom theme)
├── eslint.config.js            # ESLint flat config
├── postcss.config.js           # PostCSS configuration
├── netlify.toml                # Netlify deployment config (SPA redirect rules)
└── package.json                # Dependencies and npm scripts
```

## Component Directory Detail

```
src/components/
├── animations/
│   └── Firework.jsx                      # Firework particle effect
├── auth/
│   ├── AgeGate.jsx                       # Age verification gate
│   ├── AuthButton.jsx                    # Shared auth action button
│   ├── LoginForm.jsx                     # Login page with email/password + social
│   ├── ParentalConsentPending.jsx        # Waiting-for-consent UI when suspended
│   ├── ParentEmailStep.jsx              # Parent email input during signup
│   ├── RoleSelection.jsx                # Teacher/student role picker after signup
│   ├── SignupForm.jsx                    # Signup form
│   └── SocialLogin.jsx                  # Google/social auth buttons
├── celebrations/
│   ├── BossUnlockModal.jsx              # Boss node unlock celebration modal
│   ├── CelebrationWrapper.css           # Celebration animation styles
│   └── ConfettiEffect.jsx              # Confetti particle overlay
├── charts/
│   ├── AnalyticsDashboard.jsx           # Teacher analytics overview
│   ├── ClassPerformanceChart.jsx        # Class performance bar chart
│   ├── PerformanceDistribution.jsx      # Score distribution chart
│   ├── PracticeActivityTimeline.jsx     # Practice activity timeline
│   └── TopPerformersLeaderboard.jsx     # Student leaderboard
├── dashboard/
│   ├── DailyChallengeCard.jsx           # Daily challenge widget
│   ├── DailyGoalsCard.jsx              # 3 daily goals progress
│   ├── DailyMessageBanner.jsx          # Motivational daily message
│   ├── PlayNextButton.jsx              # Continue learning button
│   ├── PushOptInCard.jsx               # Push notification opt-in (after 7 days)
│   ├── UnifiedStatsCard.jsx            # Aggregated stats display
│   ├── WeeklySummaryCard.jsx           # Weekly progress summary
│   ├── XPProgressCard.jsx             # XP level progress bar
│   └── XPRing.jsx                      # Circular XP progress ring
├── games/
│   ├── GameModeGrid.jsx                 # Game type selection grid layout
│   ├── GameOverScreen.jsx               # Game over (3 variants: lives/time/score)
│   ├── VictoryScreen.jsx               # Post-game results + XP + trail progress
│   ├── NotesMasterMode.jsx             # Notes game type selector page
│   ├── RhythmMasterMode.jsx            # Rhythm game type selector page
│   ├── notes-master-games/
│   │   ├── NotesRecognitionGame.jsx     # 2827 lines — note identification with combo, lives, auto-grow
│   │   ├── MemoryGame.jsx              # 1144 lines — card-matching note pairs
│   │   ├── NoteImageDisplay.jsx        # Note image rendering helper
│   │   └── NotesRecognitionGame.autogrow.test.js  # Auto-grow feature tests
│   ├── rhythm-games/
│   │   ├── MetronomeTrainer.jsx        # 1464 lines — rhythm tap game (supports 6/8)
│   │   ├── RhythmPatternGenerator.js   # Pattern generation logic
│   │   └── components/                 # Sub-components:
│   │       ├── GameControls.jsx        #   Play/pause/restart controls
│   │       ├── MetronomeDisplay.jsx    #   Visual metronome (supports compound time)
│   │       ├── PatternDisplay.jsx      #   Pattern notation display
│   │       ├── RhythmGameSettings.jsx  #   Rhythm-specific settings
│   │       ├── RhythmGameSetup.jsx     #   Setup screen
│   │       ├── RhythmNotationRenderer.jsx  # Rhythm notation via VexFlow
│   │       ├── TapArea.jsx             #   Tap target for rhythm input
│   │       └── index.js               #   Barrel export
│   ├── shared/
│   │   ├── UnifiedGameSettings.jsx     # 2288 lines — config-driven pre-game settings for all games
│   │   ├── AudioInterruptedOverlay.jsx # iOS audio interruption recovery overlay
│   │   └── noteSelectionUtils.js       # Note pool selection logic
│   └── sight-reading-game/
│       ├── SightReadingGame.jsx        # 3747 lines — sheet music reading with mic/keyboard
│       ├── SightReadingGame.micRestart.test.jsx  # Mic restart integration test
│       ├── __tests__/                  # Additional test files
│       ├── components/
│       │   ├── FeedbackSummary.jsx     # Post-exercise feedback display
│       │   ├── KeySignatureSelection.jsx  # Key signature picker
│       │   ├── KlavierKeyboard.jsx     # On-screen piano keyboard (Klavier lib)
│       │   ├── MicErrorOverlay.jsx     # Microphone error/permission overlay
│       │   ├── PreGameSetup.jsx        # Sight-reading specific setup
│       │   ├── RhythmPatternPreview.jsx  # Rhythm pattern visual preview
│       │   ├── SightReadingLayout.jsx  # Game layout container
│       │   ├── SightReadingLayoutHarness.jsx  # Dev-only layout harness
│       │   └── VexFlowStaffDisplay.jsx # VexFlow SVG staff renderer
│       ├── constants/
│       │   ├── durationConstants.js    # Note/rest duration codes
│       │   ├── gameSettings.js         # Default game settings
│       │   ├── keySignatureConfig.js   # Key signature definitions
│       │   ├── noteDefinitions.js      # Note pitch definitions
│       │   ├── staffPositions.js       # Staff line/space positions
│       │   └── timingConstants.js      # Timing-related constants
│       ├── hooks/
│       │   ├── usePatternGeneration.js # Pattern generation hook
│       │   ├── useRhythmPlayback.js    # Rhythm audio playback hook
│       │   └── useTimingAnalysis.js    # Timing accuracy analysis hook
│       └── utils/
│           ├── beamGroupUtils.js       # Beam grouping for VexFlow (+ test)
│           ├── keySignatureUtils.js    # Key signature transpose logic (+ test)
│           ├── patternBuilder.js       # Music pattern construction (+ test)
│           ├── rhythmGenerator.js      # Rhythm pattern generation (+ test)
│           ├── rhythmPatterns.js       # Pattern definitions
│           ├── scoreCalculator.js      # Score calculation logic
│           └── vexflowHelpers.js       # VexFlow rendering utilities
├── layout/
│   ├── AppLayout.jsx                   # Shell: sidebar + header + tabs + Outlet
│   ├── appNavigationConfig.js          # Nav item definitions (student/teacher/common)
│   ├── Dashboard.jsx                   # 849 lines — student dashboard
│   ├── Header.jsx                      # Top header bar
│   ├── MobileTabsNav.jsx              # Bottom tab navigation (mobile)
│   ├── Sidebar.jsx                     # Desktop sidebar navigation
│   └── TeacherDashboard.jsx           # 2699 lines — teacher dashboard (monolithic)
├── onboarding/
│   └── OnboardingTour.jsx             # First-time user onboarding tour
├── orientation/
│   └── RotatePromptOverlay.jsx        # Mobile landscape rotation prompt
├── pwa/
│   ├── IOSInstallPrompt.jsx           # iOS PWA install instructions
│   ├── IOSLandscapeTipModal.jsx       # iOS landscape orientation tip
│   ├── NetworkStatus.jsx              # Online/offline status indicator
│   ├── PWAInstallPrompt.jsx           # Android/desktop PWA install prompt
│   └── PWAUpdateNotification.jsx      # Service worker update notification
├── settings/
│   ├── FeedbackForm.jsx               # User feedback submission form
│   ├── FeedbackForm.test.jsx          # Feedback form unit test
│   ├── LanguageSelector.jsx           # Language switcher (en/he)
│   ├── NotificationPermissionCard.jsx # Push notification 6-state permission manager
│   ├── ParentGateMath.jsx            # COPPA parent gate (two-digit math)
│   ├── ProfileForm.jsx               # Profile editing form
│   ├── SettingsSection.jsx            # Settings group container
│   ├── SliderSetting.jsx             # Slider input setting
│   ├── TimePicker.jsx                # Time picker for daily reminders
│   └── ToggleSetting.jsx             # Toggle switch setting
├── streak/
│   └── StreakDisplay.jsx              # Streak counter with freeze/grace/comeback visuals
├── student/                           # (empty — student-specific components are elsewhere)
├── teacher/
│   ├── AccountDeletionModal.jsx       # Student account deletion confirmation
│   ├── AssignmentManagement.jsx       # Assignment CRUD
│   ├── DataExportModal.jsx            # Student data export (COPPA/GDPR)
│   ├── NotificationCenter.jsx         # Teacher notification management
│   └── RecordingsReview.jsx           # Student recording review/feedback
├── trail/
│   ├── HorizontalTrailLayout.jsx      # Horizontal trail node layout (desktop)
│   ├── ZigzagTrailLayout.jsx          # Zigzag trail layout (mobile)
│   ├── TrailMap.jsx                   # Main trail map container
│   ├── TrailNode.jsx                  # Individual trail node component
│   ├── TrailNodeModal.jsx             # Node detail modal (start practice, progress)
│   ├── UnitProgressCard.jsx           # Unit completion progress card
│   ├── PathConnector.jsx              # SVG path connector between nodes
│   └── icons/                         # Trail-specific icon components
├── ui/
│   ├── AccessoryUnlockModal.jsx       # Accessory unlock celebration
│   ├── AlarmModal.jsx                 # Dashboard reminder alarm
│   ├── AnimatedAvatar.jsx             # Avatar with equipped accessories
│   ├── AudioPlayer.jsx               # Audio playback component
│   ├── AudioRecorder.jsx             # Audio recording component
│   ├── BackButton.jsx                # Navigation back button
│   ├── Badge.jsx                      # Badge display
│   ├── Button.jsx                     # Shared button component
│   ├── Card.jsx                       # Shared card container
│   ├── DraggableAccessory.jsx         # Drag-and-drop accessory placement
│   ├── Fireflies.jsx                  # Animated firefly particles (dashboard)
│   ├── GoldStar.jsx                   # Gold star SVG component
│   ├── InactivityWarningModal.jsx     # Session timeout warning
│   ├── Input.jsx                      # Shared input component
│   ├── Modal.jsx                      # Generic modal container
│   ├── MusicLoader.jsx               # Piano-themed loading spinner
│   ├── Navigation.jsx                 # (legacy navigation)
│   ├── PracticeSessionPlayer.jsx      # Recording playback UI
│   ├── Progress.jsx                   # Progress bar component
│   ├── RateLimitBanner.jsx            # Rate limit warning banner
│   ├── Toast.jsx                      # Custom toast component
│   └── UnlockRequirementModal.jsx     # Unlock requirement display
└── Avatars.jsx                        # Avatar customization page component
    ErrorBoundary.jsx                  # Top-level error boundary
```

## Data Layer Detail

```
src/data/
├── constants.js              # NODE_CATEGORIES, EXERCISE_TYPES (zero-dependency)
├── expandedNodes.js          # Aggregates all 22 unit files into single array
├── nodeTypes.js              # Node type visual definitions
├── skillTrail.js             # Main API: SKILL_NODES, UNITS metadata, lookup functions
└── units/
    ├── trebleUnit1Redesigned.js   # Treble Unit 1: First Position (C, D, E)
    ├── trebleUnit2Redesigned.js   # Treble Unit 2: Five Finger Position (C-G)
    ├── trebleUnit3Redesigned.js   # Treble Unit 3: Full Octave (C-C)
    ├── trebleUnit4Redesigned.js   # Treble Unit 4: Extended Range (ledger lines)
    ├── trebleUnit5Redesigned.js   # Treble Unit 5: Accidentals (sharps/flats)
    ├── trebleUnit6Redesigned.js   # Treble Unit 6: Key Signatures I
    ├── trebleUnit7Redesigned.js   # Treble Unit 7: Key Signatures II
    ├── bassUnit1Redesigned.js     # Bass Unit 1: First Position
    ├── bassUnit2Redesigned.js     # Bass Unit 2: Five Finger Position
    ├── bassUnit3Redesigned.js     # Bass Unit 3: Full Octave
    ├── bassUnit4Redesigned.js     # Bass Unit 4: Extended Range
    ├── bassUnit5Redesigned.js     # Bass Unit 5: Accidentals
    ├── bassUnit6Redesigned.js     # Bass Unit 6: Key Signatures I
    ├── bassUnit7Redesigned.js     # Bass Unit 7: Key Signatures II
    ├── rhythmUnit1Redesigned.js   # Rhythm Unit 1: Quarter/half notes
    ├── rhythmUnit2Redesigned.js   # Rhythm Unit 2: Whole notes and rests
    ├── rhythmUnit3Redesigned.js   # Rhythm Unit 3: Dotted rhythms
    ├── rhythmUnit4Redesigned.js   # Rhythm Unit 4: Eighth notes
    ├── rhythmUnit5Redesigned.js   # Rhythm Unit 5: Eighth note patterns
    ├── rhythmUnit6Redesigned.js   # Rhythm Unit 6: Sixteenth notes
    ├── rhythmUnit7Redesigned.js   # Rhythm Unit 7: 6/8 Compound meter
    ├── rhythmUnit7Redesigned.test.js  # Structural validation test
    ├── rhythmUnit8Redesigned.js   # Rhythm Unit 8: Syncopation + final boss
    └── rhythmUnit8Redesigned.test.js  # Structural validation test
```

## Supabase Directory Detail

```
supabase/
├── config.toml                           # Local dev config
├── functions/
│   ├── cancel-subscription/index.ts      # Cancel subscription via Lemon Squeezy API
│   ├── create-checkout/index.ts          # Create Lemon Squeezy checkout URL
│   ├── lemon-squeezy-webhook/
│   │   ├── index.ts                      # Webhook entry with HMAC signature verification
│   │   └── lib/                          # Modular webhook handlers (by event type)
│   ├── process-account-deletions/index.ts  # Cron: process scheduled account deletions
│   ├── send-consent-email/index.ts       # Send COPPA parental consent email
│   ├── send-daily-push/index.ts          # Cron: daily practice reminder push notifications
│   ├── send-feedback/index.ts            # Submit user feedback
│   ├── send-weekly-report/index.ts       # Cron: weekly parent progress email (Brevo)
│   ├── unsubscribe-weekly-report/index.ts  # HMAC-signed email unsubscribe
│   └── verify-consent/index.ts           # Verify parent consent token
└── migrations/                           # 100+ SQL files (chronological)
    ├── 20250105*.sql                     # Teacher-student connections, RLS policies
    ├── 20250108-20250121*.sql            # Performance, assignments, preferences
    ├── 20250623*.sql                     # Remote schema sync
    ├── 20250625*.sql                     # Teacher schema, policies, security fixes
    ├── 20250708*.sql                     # RLS optimization, performance cleanup
    ├── 20251027*.sql                     # Rename notes modes
    ├── 20251129*.sql                     # Teacher-student linking, backfill
    ├── 20251206-20251223*.sql            # Avatar accessories, RLS
    ├── 20260124-20260131*.sql            # Skill trail system, exercise progress, RLS audit
    ├── 20260201-20260208*.sql            # COPPA schema, rate limiting, score percentile
    ├── 20260304-20260308*.sql            # Push subscriptions, streak protection, XP levels
    ├── 20260317*.sql                     # Daily challenges
    ├── 20260321*.sql                     # Account deletion audit log
    └── 20260322*.sql                     # Feedback submissions
```

## Key File Locations

**Entry Points:**
- `src/main.jsx`: Application bootstrap (font imports, Redux, router, Sentry, PWA init)
- `src/App.jsx`: Root component (providers, routes, auth listener, 489 lines)
- `index.html`: HTML shell with preload hints, meta tags, theme-color
- `public/sw.js`: Service worker entry

**Configuration:**
- `vite.config.js`: Vite build config (React plugin, SVGR, Sentry sourcemap upload, bundle visualizer)
- `vitest.config.js`: Test runner config (JSDOM environment)
- `tailwind.config.js`: Tailwind theme (13KB with custom design tokens, font families, animations)
- `eslint.config.js`: ESLint flat config
- `postcss.config.js`: PostCSS with Tailwind and autoprefixer
- `netlify.toml`: Netlify deployment (SPA fallback, headers)
- `src/config/subscriptionConfig.js`: Free tier boundary (19 node IDs; must sync with Postgres `is_free_node()`)
- `src/i18n/index.js`: i18next initialization (en + he, localStorage language detection)

**Core Business Logic:**
- `src/services/skillProgressService.js`: Trail progress CRUD, exercise progress, star calculations, recommendations
- `src/services/streakService.js`: Streak protection (36h grace, freezes, weekend pass, comeback bonus)
- `src/utils/xpSystem.js`: 30 XP levels + infinite prestige tiers, level calculations, XP awards
- `src/data/skillTrail.js`: Trail node API and lookup functions
- `src/hooks/useVictoryState.js` (712 lines): Victory screen orchestration (XP, streak, accessories, boss unlocks, celebrations)
- `src/services/dailyGoalsService.js`: Daily goal generation and progress tracking
- `src/services/dailyChallengeService.js`: Daily challenge management
- `src/services/subscriptionService.js`: Subscription status with grace period logic

**Authentication:**
- `src/services/supabase.js`: Supabase client singleton (PKCE flow)
- `src/services/apiAuth.js`: Login/signup/getCurrentUser with error recovery
- `src/features/authentication/useUser.js`: Central auth hook (React Query)
- `src/services/authorizationUtils.js`: Shared `verifyStudentDataAccess()`, `getCurrentUserId()`
- `src/ui/ProtectedRoute.jsx`: Route guard component

**Audio/Music:**
- `src/contexts/AudioContextProvider.jsx`: Shared AudioContext with iOS handling
- `src/hooks/useAudioEngine.js` (1245 lines): Audio playback engine
- `src/hooks/usePitchDetection.js`: McLeod pitch detection via pitchy
- `src/hooks/useMicNoteInput.js`: Mic note-on/off state machine
- `src/hooks/micInputPresets.js`: Named mic input configuration presets
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx`: VexFlow SVG renderer
- `src/components/games/sight-reading-game/components/KlavierKeyboard.jsx`: On-screen piano

**Testing:**
- `src/test/setupTests.js`: Vitest JSDOM setup with testing-library matchers
- `src/components/games/sight-reading-game/utils/*.test.js`: Pattern/rhythm generator tests
- `src/data/units/rhythmUnit{7,8}Redesigned.test.js`: Trail data structural validation
- `src/utils/xpSystem.test.js`: XP calculation tests
- `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js`: Auto-grow tests
- `src/components/settings/FeedbackForm.test.jsx`: Feedback form tests
- `src/hooks/__tests__/`: Hook test files
- `src/services/__tests__/`: Service test files

## Naming Conventions

**Files:**
- Components: PascalCase with `.jsx` extension (e.g., `TrailNodeModal.jsx`, `DailyGoalsCard.jsx`)
- Hooks: camelCase starting with `use` and `.js` extension (e.g., `useVictoryState.js`, `usePitchDetection.js`)
- Services: camelCase with `.js` (e.g., `skillProgressService.js`, `streakService.js`)
- API services: prefixed with `api` (e.g., `apiAuth.js`, `apiDatabase.js`, `apiTeacher.js`, `apiScores.js`)
- Utils: camelCase with `.js` (e.g., `xpSystem.js`, `pwaDetection.js`)
- Constants/config: camelCase with `.js` (e.g., `constants.js`, `gameSettings.js`, `subscriptionConfig.js`)
- CSS: kebab-case (e.g., `trail-effects.css`)
- Tests: same name with `.test.js` or `.test.jsx` suffix
- Trail unit data: camelCase `{category}Unit{N}Redesigned.js` (e.g., `trebleUnit1Redesigned.js`)
- Supabase migrations: `YYYYMMDDHHMMSS_description.sql`
- Edge functions: kebab-case directory names (e.g., `send-daily-push/`)

**Directories:**
- Component groups: kebab-case for multi-word (e.g., `sight-reading-game/`, `notes-master-games/`)
- Feature directories: camelCase (e.g., `authentication/`, `userData/`)
- Locale directories: ISO 639-1 codes (e.g., `en/`, `he/`)

**Exports:**
- Components: default export for page/layout components; named export for game components and reusable pieces
- Hooks: named export (`export function useXxx()`)
- Services: named exports (async functions)
- Contexts: named exports for both `XxxProvider` and `useXxx()` hook (co-located in same file)
- Data: named exports for constants and lookup functions

## Where to Add New Code

**New Game Type:**
1. Create component directory: `src/components/games/{game-name}/GameName.jsx`
2. Add lazy-loaded route in `src/App.jsx` (wrap with `<AudioContextProvider>` if mic/audio needed)
3. Add path to `gameRoutes` array in `src/components/layout/AppLayout.jsx` (hides sidebar/header)
4. Add path to `LANDSCAPE_ROUTES` array in `OrientationController` in `src/App.jsx`
5. Add exercise type to `EXERCISE_TYPES` in `src/data/constants.js`
6. Add exercise handling in `src/components/trail/TrailNodeModal.jsx` switch cases
7. Add i18n keys in both `src/locales/en/common.json` and `src/locales/he/common.json`
8. Add game card to appropriate mode selector (`NotesMasterMode.jsx` or `RhythmMasterMode.jsx`)

**New Dashboard Card:**
- Create: `src/components/dashboard/{CardName}Card.jsx`
- Import and render in `src/components/layout/Dashboard.jsx`
- Fetch data via React Query or receive via props from Dashboard

**New Trail Unit:**
1. Create: `src/data/units/{category}Unit{N}Redesigned.js` with node array export
2. Import and spread into `src/data/expandedNodes.js`
3. Add UNITS metadata entry in `src/data/skillTrail.js`
4. Add English translations in `src/locales/en/trail.json`
5. Add Hebrew translations in `src/locales/he/trail.json`
6. If free tier boundary changes: update `src/config/subscriptionConfig.js` AND Postgres `is_free_node()` function
7. Run `npm run verify:trail` to validate

**New Service:**
- Create: `src/services/{serviceName}.js`
- Import `supabase` from `./supabase`
- Import `verifyStudentDataAccess` from `./authorizationUtils` for student-data operations
- Export named async functions
- Pattern: Every function that reads/writes student data should call `verifyStudentDataAccess()` first

**New Hook:**
- Shared hooks: `src/hooks/use{HookName}.js`
- Feature-scoped hooks: `src/features/{feature}/hooks/use{HookName}.js`
- Game-scoped hooks: `src/components/games/{game}/hooks/use{HookName}.js`

**New Page:**
1. Create: `src/pages/{PageName}.jsx`
2. Add lazy import in `src/App.jsx`
3. Add route inside the layout route (`<Route path="/" element={<AppLayout />}>`)
4. If navigation needed: add item to `src/components/layout/appNavigationConfig.js`
5. Add page title mapping in `AppLayout.jsx` `getPageTitleKey()`
6. Add i18n translation keys

**New Context Provider:**
1. Create: `src/contexts/{FeatureName}Context.jsx`
2. Export `{FeatureName}Provider` and `use{FeatureName}()` hook
3. Add to provider hierarchy in `src/App.jsx` (position based on which other contexts it depends on)
4. Add ESLint suppress comment: `// eslint-disable-next-line react-refresh/only-export-components`

**New Edge Function:**
1. Create: `supabase/functions/{function-name}/index.ts`
2. Add entry to `supabase/config.toml` if needed
3. Deploy via `supabase functions deploy {function-name}`
4. Set required env vars via Supabase dashboard

**New Database Migration:**
1. Create: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Include RLS policies for any new tables (all tables must have RLS enabled)
3. Apply locally via `supabase db push`
4. Apply to production via `supabase db push --db-url <production_url>`

**New Translation Keys:**
- Add to `src/locales/en/common.json` (or `trail.json` for trail-specific)
- Add corresponding keys to `src/locales/he/common.json` (or `trail.json`)
- Use: `t('section.key')` for common namespace, `t('trail:section.key')` for trail namespace

**New UI Component:**
- Shared/reusable primitives: `src/components/ui/{ComponentName}.jsx`
- Domain-specific: `src/components/{domain}/{ComponentName}.jsx`
- Use glassmorphism card pattern on purple background pages: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg`

**Tests:**
- Co-locate test files next to source: `{FileName}.test.js` or `{FileName}.test.jsx`
- Or use `__tests__/` directory adjacent to source files
- Setup file: `src/test/setupTests.js`

## Special Directories

**`public/`:**
- Purpose: Static assets served without processing by Vite
- Generated: No (manually managed)
- Committed: Yes
- Note: Service worker (`sw.js`) must be at root for scope. Cache version (`pianomaster-v8`) must be bumped for cache refresh after changes.

**`src/assets/`:**
- Purpose: Assets imported by JS/CSS and processed by Vite (content-hashed filenames in production)
- Generated: No
- Committed: Yes
- Note: Use `import` to reference these; Vite handles the path rewriting.

**`dist/`:**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (in `.gitignore`)

**`supabase/.temp/`:**
- Purpose: Supabase CLI temporary state (project-ref, remote-commit)
- Generated: Yes
- Committed: Partially (tracked for project binding)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No

**`.planning/`:**
- Purpose: GSD workflow planning documents (roadmap, milestones, phases, codebase analysis)
- Generated: Yes (by GSD commands)
- Committed: Yes
- Note: Feature branches own their phase directories; main owns shared docs (ROADMAP, STATE, PROJECT).

**`scripts/`:**
- Purpose: Development and validation scripts (Node.js ESM)
- Generated: No
- Committed: Yes
- Key scripts:
  - `validateTrail.mjs`: Validates trail node data (prereqs, cycles, XP, types); runs as prebuild hook
  - `patternVerifier.mjs`: Validates sight-reading pattern definitions
  - `verify-teacher-points.mjs`: Verifies teacher XP access in database

**`docs/`:**
- Purpose: Project documentation
- Generated: No
- Committed: Yes
- Key docs:
  - `docs/DESIGN_SYSTEM.md`: Design system reference
  - `docs/SECURITY_GUIDELINES.md`: Security patterns and requirements
  - `docs/vexflow-notation/`: VexFlow implementation guidelines

---

*Structure analysis: 2026-03-23*
